const ytdl = require('ytdl-core');
const play = require("play-dl");
const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  NoSubscriberBehavior,
} = require("@discordjs/voice");
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configure play-dl with more robust settings
play.setToken({
  useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
});

// YouTube has been making changes to their API, so we need to keep our libraries updated
console.log(`Using ytdl-core version: ${ytdl.version}`);
console.log(`Using play-dl version: ${play.playDlVersion}`);

// Set up a function to check for updates to these libraries
async function checkForUpdates() {
  try {
    console.log("Checking for updates to YouTube libraries...");
    const { stdout } = await execAsync('npm outdated ytdl-core play-dl');
    if (stdout.includes('ytdl-core') || stdout.includes('play-dl')) {
      console.log("Updates available for YouTube libraries. Consider updating with: npm update ytdl-core play-dl");
    }
  } catch (error) {
    // If the command exits with code 1, it means there are outdated packages
    if (error.code === 1 && error.stdout) {
      console.log("Updates available for YouTube libraries. Consider updating with: npm update ytdl-core play-dl");
    } else {
      console.error("Error checking for updates:", error.message);
    }
  }
}

// Check for updates when the module is loaded
checkForUpdates();

// Store active connections and players for each guild
const connections = new Map();
const players = new Map();
const queues = new Map();
const nowPlaying = new Map();

// Function to join a voice channel
async function joinChannel(context) {
  try {
    // Check if context is a message or interaction
    const isInteraction = context.commandName !== undefined;

    // Check if user is in a voice channel
    const voiceChannel = context.member.voice.channel;
    if (!voiceChannel) {
      return {
        success: false,
        message: "You need to be in a voice channel first!",
      };
    }

    // Create a connection to the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: context.guild.id,
      adapterCreator: context.guild.voiceAdapterCreator,
    });

    // Create an audio player
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    // Subscribe the connection to the audio player
    connection.subscribe(player);

    // Store the connection and player
    connections.set(context.guild.id, connection);
    players.set(context.guild.id, player);

    // Initialize queue for this guild if it doesn't exist
    if (!queues.has(context.guild.id)) {
      queues.set(context.guild.id, []);
    }

    // Set up event listeners for the connection
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        connection.destroy();
        cleanup(context.guild.id);
      }
    });

    // Set up event listeners for the player
    player.on(AudioPlayerStatus.Idle, () => {
      // When the current song ends, play the next one in queue
      playNext(context.guild.id);
    });

    player.on("error", (error) => {
      console.error(`Error: ${error.message} with resource`);
      playNext(context.guild.id);
    });

    return { success: true, message: `Joined ${voiceChannel.name}!` };
  } catch (error) {
    console.error("Error joining voice channel:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Function to leave a voice channel
function leaveChannel(guildId) {
  try {
    const connection = connections.get(guildId);
    if (connection) {
      connection.destroy();
      cleanup(guildId);
      return { success: true, message: "Left the voice channel!" };
    } else {
      return { success: false, message: "I'm not in a voice channel!" };
    }
  } catch (error) {
    console.error("Error leaving voice channel:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Function to play a YouTube video
async function playYouTube(context, url) {
  try {
    console.log(`Received request to play: ${url}`);
    
    // Try to extract video ID first for better validation
    let videoId;
    try {
      videoId = ytdl.getVideoID(url);
      console.log(`Extracted video ID: ${videoId}`);
      // Normalize URL to standard format
      url = `https://www.youtube.com/watch?v=${videoId}`;
    } catch (idError) {
      console.error("Error extracting video ID:", idError);
      // Continue with original URL, will validate below
    }
    
    // Check if the URL is valid using both libraries for better reliability
    const isValidYtdl = ytdl.validateURL(url);
    const isValidPlayDl = play.yt_validate(url);
    
    if (!isValidYtdl && !isValidPlayDl) {
      console.error(`Invalid YouTube URL: ${url} (ytdl: ${isValidYtdl}, play-dl: ${isValidPlayDl})`);
      return { success: false, message: "Please provide a valid YouTube URL!" };
    }
    
    console.log(`URL validation passed: ${url}`);

    // Get the guild ID
    const guildId = context.guild.id;

    // Check if the bot is in a voice channel
    if (!connections.has(guildId)) {
      console.log("Bot not in voice channel, attempting to join...");
      const joinResult = await joinChannel(context);
      if (!joinResult.success) {
        console.error("Failed to join voice channel:", joinResult.message);
        return joinResult;
      }
      console.log("Successfully joined voice channel");
    }

    // First try: Get video info using play-dl
    try {
      console.log("Attempting to get video info using play-dl...");
      const videoInfo = await play.video_info(url);
      const videoTitle = videoInfo.video_details.title;
      const durationInSec = videoInfo.video_details.durationInSec;

      // Log video details for debugging
      console.log(`Video info retrieved: ${videoTitle} (Duration: ${durationInSec}s)`);

      // Add special flag for very short videos
      const isShortVideo = durationInSec < 60; // Less than 1 minute
      if (isShortVideo) {
        console.log("This is a short video, will use special handling");
      }

      // Add to queue
      const queue = queues.get(guildId);
      const queueItem = {
        url,
        title: videoTitle,
        isShortVideo,
        videoId
      };
      queue.push(queueItem);
      console.log(`Added to queue: ${videoTitle}`);

      // If nothing is playing, start playing
      const player = players.get(guildId);
      if (player.state.status === AudioPlayerStatus.Idle) {
        console.log("Player is idle, starting playback immediately");
        return await playNext(guildId);
      } else {
        console.log(`Player is busy, added to queue at position ${queue.length}`);
        return {
          success: true,
          message: `Added to queue: ${videoTitle}`,
          position: queue.length,
        };
      }
    } catch (playDlError) {
      console.error("Error getting video info with play-dl:", playDlError);

      // Second try: Fallback to ytdl-core for getting info
      try {
        console.log("Falling back to ytdl-core for video info...");
        const ytdlInfo = await ytdl.getInfo(url);
        const videoTitle = ytdlInfo.videoDetails.title;
        const durationInSec = parseInt(ytdlInfo.videoDetails.lengthSeconds);
        const isShortVideo = durationInSec < 60; // Less than 1 minute

        console.log(`Fallback video info retrieved: ${videoTitle} (Duration: ${durationInSec}s)`);

        // Add to queue
        const queue = queues.get(guildId);
        const queueItem = {
          url,
          title: videoTitle,
          isShortVideo,
          videoId
        };
        queue.push(queueItem);
        console.log(`Added to queue using fallback: ${videoTitle}`);

        // If nothing is playing, start playing
        const player = players.get(guildId);
        if (player.state.status === AudioPlayerStatus.Idle) {
          console.log("Player is idle, starting playback immediately (fallback)");
          return await playNext(guildId);
        } else {
          console.log(`Player is busy, added to queue at position ${queue.length} (fallback)`);
          return {
            success: true,
            message: `Added to queue: ${videoTitle} (using fallback)`,
            position: queue.length,
          };
        }
      } catch (ytdlError) {
        console.error("Fallback info retrieval failed:", ytdlError);

        // Last resort: Use the video ID as the title
        if (!videoId) {
          try {
            videoId = ytdl.getVideoID(url);
          } catch (finalIdError) {
            console.error("Final attempt to extract video ID failed:", finalIdError);
            return { success: false, message: "Could not process this YouTube URL. Please try a different video." };
          }
        }
        
        const simplifiedTitle = `YouTube Video (${videoId})`;
        console.log(`Using simplified title for video: ${simplifiedTitle}`);

        // Add to queue with simplified title
        const queue = queues.get(guildId);
        const queueItem = {
          url,
          title: simplifiedTitle,
          isShortVideo: true, // Assume it's a short video for special handling
          videoId
        };
        queue.push(queueItem);
        console.log(`Added to queue using last resort: ${simplifiedTitle}`);

        // If nothing is playing, start playing
        const player = players.get(guildId);
        if (player.state.status === AudioPlayerStatus.Idle) {
          console.log("Player is idle, starting playback immediately (last resort)");
          return await playNext(guildId);
        } else {
          console.log(`Player is busy, added to queue at position ${queue.length} (last resort)`);
          return {
            success: true,
            message: `Added to queue: ${simplifiedTitle}`,
            position: queue.length,
          };
        }
      }
    }
  } catch (error) {
    console.error("Error playing YouTube video:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Function to play the next song in the queue
async function playNext(guildId) {
  try {
    // Get the queue for this guild
    const queue = queues.get(guildId);
    if (!queue || queue.length === 0) {
      nowPlaying.delete(guildId);
      return { success: false, message: "No more songs in queue!" };
    }

    // Get the next song
    const nextSong = queue.shift();

    // Get the player
    const player = players.get(guildId);
    if (!player) {
      return { success: false, message: "No audio player found!" };
    }

    console.log(`Attempting to play: ${nextSong.title} (${nextSong.url})`);

    // Make sure we have a valid video ID
    let videoId = nextSong.videoId;
    if (!videoId) {
      try {
        videoId = ytdl.getVideoID(nextSong.url);
        console.log(`Extracted video ID: ${videoId}`);
      } catch (idError) {
        console.error("Error extracting video ID:", idError);
      }
    }

    // Normalize the URL to ensure best compatibility
    const normalizedUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : nextSong.url;
    console.log(`Using normalized URL: ${normalizedUrl}`);

    // Try multiple methods to play the song
    let success = false;
    let errorMessages = [];

    // Method 1: play-dl with high quality
    if (!success) {
      try {
        console.log("Method 1: Attempting to play using play-dl with high quality...");
        
        const streamOptions = {
          discordPlayerCompatibility: true,
          seek: 0,
          quality: 0, // Highest quality
        };
        
        const stream = await play.stream(normalizedUrl, streamOptions);
        
        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
        });
        
        if (resource) {
          if (resource.volume) {
            resource.volume.setVolume(1);
          }
          
          player.play(resource);
          nowPlaying.set(guildId, nextSong);
          
          console.log(`Successfully playing: ${nextSong.title} using play-dl (high quality)`);
          success = true;
        } else {
          throw new Error("Failed to create audio resource");
        }
      } catch (error) {
        console.error("Method 1 failed:", error.message);
        errorMessages.push(`Method 1 (play-dl high quality): ${error.message}`);
      }
    }

    // Method 2: play-dl with low quality
    if (!success) {
      try {
        console.log("Method 2: Attempting to play using play-dl with low quality...");
        
        const streamOptions = {
          discordPlayerCompatibility: true,
          seek: 0,
          quality: 2, // Lower quality
        };
        
        const stream = await play.stream(normalizedUrl, streamOptions);
        
        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
        });
        
        if (resource) {
          if (resource.volume) {
            resource.volume.setVolume(1);
          }
          
          player.play(resource);
          nowPlaying.set(guildId, nextSong);
          
          console.log(`Successfully playing: ${nextSong.title} using play-dl (low quality)`);
          success = true;
        } else {
          throw new Error("Failed to create audio resource");
        }
      } catch (error) {
        console.error("Method 2 failed:", error.message);
        errorMessages.push(`Method 2 (play-dl low quality): ${error.message}`);
      }
    }

    // Method 3: ytdl-core with specific options for music videos
    if (!success) {
      try {
        console.log("Method 3: Attempting to play using ytdl-core with music video options...");
        
        // Create the stream with optimal options for music videos
        const ytdlStream = ytdl(normalizedUrl, {
          filter: "audioonly",
          quality: "lowestaudio",
          highWaterMark: 1 << 25, // 32MB buffer
          dlChunkSize: 0, // Get the entire file as a single chunk
          requestOptions: {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": "https://www.youtube.com/",
            },
          },
        });
        
        // Handle stream errors
        ytdlStream.on("error", (error) => {
          console.error(`ytdl stream error: ${error.message}`);
          // Only try to play the next song if we haven't already succeeded
          if (!success) {
            setTimeout(() => playNext(guildId), 1000);
          }
        });
        
        // Create the audio resource
        const resource = createAudioResource(ytdlStream, {
          inlineVolume: true,
        });
        
        if (resource) {
          if (resource.volume) {
            resource.volume.setVolume(1);
          }
          
          player.play(resource);
          nowPlaying.set(guildId, nextSong);
          
          console.log(`Successfully playing: ${nextSong.title} using ytdl-core`);
          success = true;
        } else {
          throw new Error("Failed to create audio resource");
        }
      } catch (error) {
        console.error("Method 3 failed:", error.message);
        errorMessages.push(`Method 3 (ytdl-core): ${error.message}`);
      }
    }

    // Method 4: ytdl-core with different options for music videos
    if (!success) {
      try {
        console.log("Method 4: Attempting to play using ytdl-core with alternative options...");
        
        // Try with a different set of options specifically for music videos
        const ytdlStream = ytdl(normalizedUrl, {
          filter: (format) => format.hasAudio && !format.hasVideo,
          highWaterMark: 1 << 25, // 32MB buffer
          requestOptions: {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Referer": "https://www.youtube.com/",
              "Cookie": "CONSENT=YES+cb; YSC=DwKYllHNwuw; VISITOR_INFO1_LIVE=7cPyAIGQPrI",
            },
          },
        });
        
        ytdlStream.on("error", (error) => {
          console.error(`ytdl music stream error: ${error.message}`);
          // Only try to play the next song if we haven't already succeeded
          if (!success) {
            setTimeout(() => playNext(guildId), 1000);
          }
        });
        
        const resource = createAudioResource(ytdlStream, {
          inlineVolume: true,
        });
        
        if (resource) {
          if (resource.volume) {
            resource.volume.setVolume(1);
          }
          
          player.play(resource);
          nowPlaying.set(guildId, nextSong);
          
          console.log(`Successfully playing: ${nextSong.title} using ytdl-core (alternative options)`);
          success = true;
        } else {
          throw new Error("Failed to create audio resource");
        }
      } catch (error) {
        console.error("Method 4 failed:", error.message);
        errorMessages.push(`Method 4 (ytdl-core alternative options): ${error.message}`);
      }
    }

    // If all methods failed, log detailed error and skip to next song
    if (!success) {
      console.error(`All playback methods failed for ${nextSong.title}. Errors:`, errorMessages);
      
      // Skip to the next song
      setTimeout(() => playNext(guildId), 1000);
      
      return {
        success: false,
        message: `Couldn't play ${nextSong.title}, skipping to next song...`,
      };
    }
    
    // If we got here, one of the methods succeeded
    return {
      success: true,
      message: `Now playing: ${nextSong.title}`,
      title: nextSong.title,
    };
  } catch (error) {
    console.error("Error playing next song:", error);
    
    // Try to play the next song in the queue
    setTimeout(() => {
      try {
        const queue = queues.get(guildId);
        if (queue && queue.length > 0) {
          playNext(guildId);
        }
      } catch (nextError) {
        console.error("Error trying to play next song after failure:", nextError);
      }
    }, 1000);
    
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Function to skip the current song
function skipSong(guildId) {
  try {
    const player = players.get(guildId);
    if (!player) {
      return { success: false, message: "No audio player found!" };
    }

    if (player.state.status === AudioPlayerStatus.Playing) {
      player.stop();
      return { success: true, message: "Skipped to the next song!" };
    } else {
      return { success: false, message: "Nothing is playing right now!" };
    }
  } catch (error) {
    console.error("Error skipping song:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Function to get the current queue
function getQueue(guildId) {
  const queue = queues.get(guildId);
  const current = nowPlaying.get(guildId);
  
  if (!queue || queue.length === 0) {
    if (!current) {
      return { success: false, message: "The queue is empty!" };
    } else {
      return { 
        success: true, 
        current,
        queue: []
      };
    }
  }
  
  return { 
    success: true, 
    current,
    queue
  };
}

// Function to clean up resources
function cleanup(guildId) {
  connections.delete(guildId);
  players.delete(guildId);
  queues.delete(guildId);
  nowPlaying.delete(guildId);
}

module.exports = {
  joinChannel,
  leaveChannel,
  playYouTube,
  skipSong,
  getQueue
};