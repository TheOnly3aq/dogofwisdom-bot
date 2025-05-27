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
const libsodium = require("libsodium-wrappers");

// Initialize libsodium
(async () => {
  await libsodium.ready;
  console.log("libsodium initialized successfully");
})();

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
    console.log("=== JOIN CHANNEL FUNCTION STARTED ===");
    console.log(`Context type: ${typeof context}`);
    console.log(`Context keys: ${Object.keys(context).join(", ")}`);

    // Ensure libsodium is ready
    console.log("Waiting for libsodium to be ready...");
    await libsodium.ready;
    console.log("libsodium is ready");

    // Check if context is a message or interaction
    const isInteraction = context.commandName !== undefined;
    console.log(`Is interaction: ${isInteraction}`);

    // Validate context has required properties
    if (!context.member) {
      console.error("Error: context.member is undefined");
      return {
        success: false,
        message: "Invalid context: member not found",
      };
    }

    if (!context.guild) {
      console.error("Error: context.guild is undefined");
      return {
        success: false,
        message: "Invalid context: guild not found",
      };
    }

    console.log(`Guild ID: ${context.guild.id}`);
    console.log(`Member ID: ${context.member.id}`);

    // Check if user is in a voice channel
    if (!context.member.voice) {
      console.error("Error: context.member.voice is undefined");
      return {
        success: false,
        message: "Cannot access voice state. Please try again.",
      };
    }

    const voiceChannel = context.member.voice.channel;
    if (!voiceChannel) {
      console.log("User is not in a voice channel");
      return {
        success: false,
        message: "You need to be in a voice channel first!",
      };
    }

    console.log(
      `Voice channel ID: ${voiceChannel.id}, Name: ${voiceChannel.name}`
    );

    // Validate voice adapter creator
    if (!context.guild.voiceAdapterCreator) {
      console.error("Error: voiceAdapterCreator is undefined");
      return {
        success: false,
        message: "Voice adapter creator not found. This is a Discord.js issue.",
      };
    }

    console.log("Creating voice connection...");

    // Create a connection to the voice channel
    let connection;
    try {
      connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: context.guild.id,
        adapterCreator: context.guild.voiceAdapterCreator,
        selfDeaf: true, // Bot deafens itself to save bandwidth
        selfMute: false, // Bot needs to be able to speak
      });

      console.log("Voice connection created");
      console.log(`Connection state: ${connection.state.status}`);
    } catch (connectionError) {
      console.error("Error creating voice connection:", connectionError);
      return {
        success: false,
        message: `Failed to connect to voice channel: ${connectionError.message}`,
      };
    }

    // Log when connection state changes
    connection.on(VoiceConnectionStatus.Ready, () => {
      console.log("Voice Connection is Ready!");
    });

    connection.on(VoiceConnectionStatus.Connecting, () => {
      console.log("Voice Connection is Connecting...");
    });

    connection.on(VoiceConnectionStatus.Signalling, () => {
      console.log("Voice Connection is Signalling...");
    });

    // Create an audio player
    console.log("Creating audio player...");
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    console.log("Audio player created");

    // Subscribe the connection to the audio player
    console.log("Subscribing connection to player...");
    const subscription = connection.subscribe(player);
    if (!subscription) {
      console.error("Failed to subscribe connection to player");
      connection.destroy();
      return {
        success: false,
        message: "Failed to set up voice connection. Please try again.",
      };
    }
    console.log("Connection subscribed to player successfully");

    // Store the connection and player
    connections.set(context.guild.id, connection);
    players.set(context.guild.id, player);
    console.log(`Stored connection and player for guild ${context.guild.id}`);

    // Initialize queue for this guild if it doesn't exist
    if (!queues.has(context.guild.id)) {
      queues.set(context.guild.id, []);
      console.log(`Initialized empty queue for guild ${context.guild.id}`);
    }

    // Set up event listeners for the connection
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.log("Voice Connection Disconnected");
      try {
        console.log("Attempting to reconnect...");
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        console.log("Reconnection in progress - ignoring disconnect");
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        console.log("Reconnection failed - destroying connection");
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        connection.destroy();
        cleanup(context.guild.id);
        console.log(`Cleaned up resources for guild ${context.guild.id}`);
      }
    });

    // Set up event listeners for the player
    player.on(AudioPlayerStatus.Idle, () => {
      console.log("Player is now Idle, playing next song");
      // When the current song ends, play the next one in queue
      playNext(context.guild.id);
    });

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("Player is now Playing");
    });

    player.on(AudioPlayerStatus.Paused, () => {
      console.log("Player is now Paused");
    });

    player.on(AudioPlayerStatus.AutoPaused, () => {
      console.log("Player is now AutoPaused");
    });

    player.on("error", (error) => {
      console.error(`Player error: ${error.message}`);
      console.error(error.stack);
      console.log("Attempting to play next song after error");
      playNext(context.guild.id);
    });

    console.log("=== JOIN CHANNEL FUNCTION COMPLETED SUCCESSFULLY ===");
    return { success: true, message: `Joined ${voiceChannel.name}!` };
  } catch (error) {
    console.error("=== ERROR IN JOIN CHANNEL FUNCTION ===");
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    return {
      success: false,
      message: `Error joining voice channel: ${error.message}`,
    };
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
    console.log("=== PLAY YOUTUBE FUNCTION STARTED ===");
    console.log(`Received request to play: ${url}`);
    console.log(`Context type: ${typeof context}`);

    // Validate context
    if (!context) {
      console.error("Error: context is undefined");
      return {
        success: false,
        message: "Invalid context: context is undefined",
      };
    }

    if (!context.guild) {
      console.error("Error: context.guild is undefined");
      return { success: false, message: "Invalid context: guild not found" };
    }

    console.log(`Guild ID: ${context.guild.id}`);

    // Try to extract video ID first for better validation
    let videoId;
    try {
      console.log("Attempting to extract video ID...");
      videoId = ytdl.getVideoID(url);
      console.log(`Extracted video ID: ${videoId}`);
      // Normalize URL to standard format
      url = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`Normalized URL: ${url}`);
    } catch (idError) {
      console.error("Error extracting video ID:", idError.message);
      console.log("Will continue with original URL and validate below");
      // Continue with original URL, will validate below
    }

    // Check if the URL is valid using both libraries for better reliability
    console.log("Validating URL with both libraries...");
    let isValidYtdl = false;
    let isValidPlayDl = false;

    try {
      isValidYtdl = ytdl.validateURL(url);
      console.log(`ytdl-core validation result: ${isValidYtdl}`);
    } catch (ytdlValidateError) {
      console.error(
        "Error during ytdl-core validation:",
        ytdlValidateError.message
      );
    }

    try {
      isValidPlayDl = play.yt_validate(url);
      console.log(`play-dl validation result: ${isValidPlayDl}`);
    } catch (playDlValidateError) {
      console.error(
        "Error during play-dl validation:",
        playDlValidateError.message
      );
    }

    if (!isValidYtdl && !isValidPlayDl) {
      console.error(
        `Invalid YouTube URL: ${url} (ytdl: ${isValidYtdl}, play-dl: ${isValidPlayDl})`
      );
      return { success: false, message: "Please provide a valid YouTube URL!" };
    }

    console.log(`URL validation passed: ${url}`);

    // Get the guild ID
    const guildId = context.guild.id;
    console.log(`Using guild ID: ${guildId}`);

    // Check if the bot is in a voice channel
    console.log(`Checking if bot is in voice channel for guild ${guildId}`);
    console.log(
      `Current connections: ${Array.from(connections.keys()).join(", ")}`
    );

    if (!connections.has(guildId)) {
      console.log("Bot not in voice channel, attempting to join...");

      // Check if user is in a voice channel
      if (!context.member) {
        console.error("Error: context.member is undefined");
        return {
          success: false,
          message: "Cannot join voice channel: member not found",
        };
      }

      if (!context.member.voice) {
        console.error("Error: context.member.voice is undefined");
        return {
          success: false,
          message: "Cannot join voice channel: voice state not found",
        };
      }

      if (!context.member.voice.channel) {
        console.log("User is not in a voice channel");
        return {
          success: false,
          message: "You need to be in a voice channel first!",
        };
      }

      console.log(
        `User is in voice channel: ${context.member.voice.channel.name} (${context.member.voice.channel.id})`
      );

      const joinResult = await joinChannel(context);
      console.log(`Join channel result: ${JSON.stringify(joinResult)}`);

      if (!joinResult.success) {
        console.error("Failed to join voice channel:", joinResult.message);
        return joinResult;
      }
      console.log("Successfully joined voice channel");
    } else {
      console.log(`Bot is already in a voice channel for guild ${guildId}`);
    }

    // First try: Get video info using play-dl
    try {
      console.log("Attempting to get video info using play-dl...");
      const videoInfo = await play.video_info(url);
      console.log("play-dl video_info call succeeded");

      if (!videoInfo) {
        console.error("Error: videoInfo is undefined");
        throw new Error("Failed to get video info: result is undefined");
      }

      if (!videoInfo.video_details) {
        console.error("Error: videoInfo.video_details is undefined");
        throw new Error(
          "Failed to get video details: video_details is undefined"
        );
      }

      const videoTitle = videoInfo.video_details.title;
      const durationInSec = videoInfo.video_details.durationInSec;

      // Log video details for debugging
      console.log(
        `Video info retrieved: ${videoTitle} (Duration: ${durationInSec}s)`
      );

      // Add special flag for very short videos
      const isShortVideo = durationInSec < 60; // Less than 1 minute
      if (isShortVideo) {
        console.log("This is a short video, will use special handling");
      }

      // Add to queue
      console.log(`Getting queue for guild ${guildId}`);
      const queue = queues.get(guildId);
      if (!queue) {
        console.error(`Error: queue for guild ${guildId} is undefined`);
        queues.set(guildId, []);
        console.log(`Created new queue for guild ${guildId}`);
      }

      const queueItem = {
        url,
        title: videoTitle,
        isShortVideo,
        videoId,
      };

      queue.push(queueItem);
      console.log(`Added to queue: ${videoTitle}`);
      console.log(`Queue length: ${queue.length}`);

      // If nothing is playing, start playing
      console.log(`Getting player for guild ${guildId}`);
      const player = players.get(guildId);
      if (!player) {
        console.error(`Error: player for guild ${guildId} is undefined`);
        return {
          success: false,
          message: "Audio player not found. Please try again.",
        };
      }

      console.log(`Player state: ${player.state.status}`);

      if (player.state.status === AudioPlayerStatus.Idle) {
        console.log("Player is idle, starting playback immediately");
        return await playNext(guildId);
      } else {
        console.log(
          `Player is busy, added to queue at position ${queue.length}`
        );
        return {
          success: true,
          message: `Added to queue: ${videoTitle}`,
          position: queue.length,
        };
      }
    } catch (playDlError) {
      console.error(
        "Error getting video info with play-dl:",
        playDlError.message
      );
      console.error(playDlError.stack);

      // Second try: Fallback to ytdl-core for getting info
      try {
        console.log("Falling back to ytdl-core for video info...");
        const ytdlInfo = await ytdl.getInfo(url);
        console.log("ytdl-core getInfo call succeeded");

        if (!ytdlInfo) {
          console.error("Error: ytdlInfo is undefined");
          throw new Error("Failed to get video info: result is undefined");
        }

        if (!ytdlInfo.videoDetails) {
          console.error("Error: ytdlInfo.videoDetails is undefined");
          throw new Error(
            "Failed to get video details: videoDetails is undefined"
          );
        }

        const videoTitle = ytdlInfo.videoDetails.title;
        const durationInSec = parseInt(ytdlInfo.videoDetails.lengthSeconds);
        const isShortVideo = durationInSec < 60; // Less than 1 minute

        console.log(
          `Fallback video info retrieved: ${videoTitle} (Duration: ${durationInSec}s)`
        );

        // Add to queue
        console.log(`Getting queue for guild ${guildId}`);
        const queue = queues.get(guildId);
        if (!queue) {
          console.error(`Error: queue for guild ${guildId} is undefined`);
          queues.set(guildId, []);
          console.log(`Created new queue for guild ${guildId}`);
        }

        const queueItem = {
          url,
          title: videoTitle,
          isShortVideo,
          videoId,
        };

        queue.push(queueItem);
        console.log(`Added to queue using fallback: ${videoTitle}`);
        console.log(`Queue length: ${queue.length}`);

        // If nothing is playing, start playing
        console.log(`Getting player for guild ${guildId}`);
        const player = players.get(guildId);
        if (!player) {
          console.error(`Error: player for guild ${guildId} is undefined`);
          return {
            success: false,
            message: "Audio player not found. Please try again.",
          };
        }

        console.log(`Player state: ${player.state.status}`);

        if (player.state.status === AudioPlayerStatus.Idle) {
          console.log(
            "Player is idle, starting playback immediately (fallback)"
          );
          return await playNext(guildId);
        } else {
          console.log(
            `Player is busy, added to queue at position ${queue.length} (fallback)`
          );
          return {
            success: true,
            message: `Added to queue: ${videoTitle} (using fallback)`,
            position: queue.length,
          };
        }
      } catch (ytdlError) {
        console.error("Fallback info retrieval failed:", ytdlError.message);
        console.error(ytdlError.stack);

        // Last resort: Use the video ID as the title
        if (!videoId) {
          try {
            console.log("Final attempt to extract video ID...");
            videoId = ytdl.getVideoID(url);
            console.log(`Extracted video ID in last resort: ${videoId}`);
          } catch (finalIdError) {
            console.error(
              "Final attempt to extract video ID failed:",
              finalIdError.message
            );
            console.error(finalIdError.stack);
            return {
              success: false,
              message:
                "Could not process this YouTube URL. Please try a different video.",
            };
          }
        }

        const simplifiedTitle = `YouTube Video (${videoId})`;
        console.log(`Using simplified title for video: ${simplifiedTitle}`);

        // Add to queue with simplified title
        console.log(`Getting queue for guild ${guildId}`);
        const queue = queues.get(guildId);
        if (!queue) {
          console.error(`Error: queue for guild ${guildId} is undefined`);
          queues.set(guildId, []);
          console.log(`Created new queue for guild ${guildId}`);
        }

        const queueItem = {
          url,
          title: simplifiedTitle,
          isShortVideo: true, // Assume it's a short video for special handling
          videoId,
        };

        queue.push(queueItem);
        console.log(`Added to queue using last resort: ${simplifiedTitle}`);
        console.log(`Queue length: ${queue.length}`);

        // If nothing is playing, start playing
        console.log(`Getting player for guild ${guildId}`);
        const player = players.get(guildId);
        if (!player) {
          console.error(`Error: player for guild ${guildId} is undefined`);
          return {
            success: false,
            message: "Audio player not found. Please try again.",
          };
        }

        console.log(`Player state: ${player.state.status}`);

        if (player.state.status === AudioPlayerStatus.Idle) {
          console.log(
            "Player is idle, starting playback immediately (last resort)"
          );
          return await playNext(guildId);
        } else {
          console.log(
            `Player is busy, added to queue at position ${queue.length} (last resort)`
          );
          return {
            success: true,
            message: `Added to queue: ${simplifiedTitle}`,
            position: queue.length,
          };
        }
      }
    }
  } catch (error) {
    console.error("=== ERROR IN PLAY YOUTUBE FUNCTION ===");
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    return {
      success: false,
      message: `Error playing YouTube video: ${error.message}`,
    };
  }
}

// Function to play the next song in the queue
async function playNext(guildId) {
  try {
    console.log(`=== PLAY NEXT FUNCTION STARTED FOR GUILD ${guildId} ===`);

    // Get the queue for this guild
    console.log(`Getting queue for guild ${guildId}`);
    const queue = queues.get(guildId);
    if (!queue || queue.length === 0) {
      console.log(`No songs in queue for guild ${guildId}`);
      nowPlaying.delete(guildId);
      return { success: false, message: "No more songs in queue!" };
    }

    console.log(`Queue length: ${queue.length}`);

    // Get the next song
    const nextSong = queue.shift();
    console.log(`Next song: ${JSON.stringify(nextSong)}`);

    // Get the player
    console.log(`Getting player for guild ${guildId}`);
    const player = players.get(guildId);
    if (!player) {
      console.error(`Error: player for guild ${guildId} is undefined`);
      return { success: false, message: "No audio player found!" };
    }

    console.log(`Player state: ${player.state.status}`);
    console.log(`Attempting to play: ${nextSong.title} (${nextSong.url})`);

    // Make sure we have a valid video ID
    let videoId = nextSong.videoId;
    console.log(`Initial video ID: ${videoId}`);

    if (!videoId) {
      try {
        console.log("Extracting video ID...");
        videoId = ytdl.getVideoID(nextSong.url);
        console.log(`Extracted video ID: ${videoId}`);
      } catch (idError) {
        console.error(`Error extracting video ID: ${idError.message}`);
        console.error(idError.stack);
      }
    }

    // Normalize the URL to ensure best compatibility
    const normalizedUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : nextSong.url;
    console.log(`Using normalized URL: ${normalizedUrl}`);

    // Try multiple methods to play the song
    let success = false;
    let errorMessages = [];

    // Method 1: play-dl with high quality
    if (!success) {
      try {
        console.log(
          "Method 1: Attempting to play using play-dl with high quality..."
        );

        const streamOptions = {
          discordPlayerCompatibility: true,
          seek: 0,
          quality: 0, // Highest quality
        };

        console.log(`Stream options: ${JSON.stringify(streamOptions)}`);
        console.log("Calling play.stream...");

        const stream = await play.stream(normalizedUrl, streamOptions);
        console.log("play.stream call succeeded");

        if (!stream) {
          console.error("Error: stream is undefined");
          throw new Error("Failed to get stream: result is undefined");
        }

        if (!stream.stream) {
          console.error("Error: stream.stream is undefined");
          throw new Error("Failed to get stream.stream: it is undefined");
        }

        if (!stream.type) {
          console.error("Error: stream.type is undefined");
          throw new Error("Failed to get stream.type: it is undefined");
        }

        console.log(`Stream type: ${stream.type}`);
        console.log("Creating audio resource...");

        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
        });

        if (!resource) {
          console.error("Error: resource is undefined");
          throw new Error(
            "Failed to create audio resource: result is undefined"
          );
        }

        console.log("Audio resource created");

        if (resource.volume) {
          console.log("Setting volume to 100%");
          resource.volume.setVolume(1);
        } else {
          console.log(
            "Warning: resource.volume is undefined, cannot set volume"
          );
        }

        console.log("Playing audio resource...");
        player.play(resource);
        console.log("Audio resource is now playing");

        nowPlaying.set(guildId, nextSong);
        console.log(`Set nowPlaying for guild ${guildId}`);

        console.log(
          `Successfully playing: ${nextSong.title} using play-dl (high quality)`
        );
        success = true;
      } catch (error) {
        console.error(`Method 1 failed: ${error.message}`);
        console.error(error.stack);
        errorMessages.push(`Method 1 (play-dl high quality): ${error.message}`);
      }
    }

    // Method 2: play-dl with low quality
    if (!success) {
      try {
        console.log(
          "Method 2: Attempting to play using play-dl with low quality..."
        );

        const streamOptions = {
          discordPlayerCompatibility: true,
          seek: 0,
          quality: 2, // Lower quality
        };

        console.log(`Stream options: ${JSON.stringify(streamOptions)}`);
        console.log("Calling play.stream with low quality...");

        const stream = await play.stream(normalizedUrl, streamOptions);
        console.log("play.stream call succeeded");

        if (!stream) {
          console.error("Error: stream is undefined");
          throw new Error("Failed to get stream: result is undefined");
        }

        if (!stream.stream) {
          console.error("Error: stream.stream is undefined");
          throw new Error("Failed to get stream.stream: it is undefined");
        }

        if (!stream.type) {
          console.error("Error: stream.type is undefined");
          throw new Error("Failed to get stream.type: it is undefined");
        }

        console.log(`Stream type: ${stream.type}`);
        console.log("Creating audio resource...");

        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
        });

        if (!resource) {
          console.error("Error: resource is undefined");
          throw new Error(
            "Failed to create audio resource: result is undefined"
          );
        }

        console.log("Audio resource created");

        if (resource.volume) {
          console.log("Setting volume to 100%");
          resource.volume.setVolume(1);
        } else {
          console.log(
            "Warning: resource.volume is undefined, cannot set volume"
          );
        }

        console.log("Playing audio resource...");
        player.play(resource);
        console.log("Audio resource is now playing");

        nowPlaying.set(guildId, nextSong);
        console.log(`Set nowPlaying for guild ${guildId}`);

        console.log(
          `Successfully playing: ${nextSong.title} using play-dl (low quality)`
        );
        success = true;
      } catch (error) {
        console.error(`Method 2 failed: ${error.message}`);
        console.error(error.stack);
        errorMessages.push(`Method 2 (play-dl low quality): ${error.message}`);
      }
    }

    // Method 3: ytdl-core with specific options for music videos
    if (!success) {
      try {
        console.log(
          "Method 3: Attempting to play using ytdl-core with music video options..."
        );

        // Create the stream with optimal options for music videos
        console.log("Creating ytdl stream...");
        const ytdlOptions = {
          filter: "audioonly",
          quality: "lowestaudio",
          highWaterMark: 1 << 25, // 32MB buffer
          dlChunkSize: 0, // Get the entire file as a single chunk
          requestOptions: {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              Referer: "https://www.youtube.com/",
            },
          },
        };

        console.log(`ytdl options: ${JSON.stringify(ytdlOptions)}`);
        const ytdlStream = ytdl(normalizedUrl, ytdlOptions);
        console.log("ytdl stream created");

        // Handle stream errors
        ytdlStream.on("error", (error) => {
          console.error(`ytdl stream error: ${error.message}`);
          console.error(error.stack);
          // Only try to play the next song if we haven't already succeeded
          if (!success) {
            console.log("Scheduling next song due to stream error...");
            setTimeout(() => playNext(guildId), 1000);
          }
        });

        // Log when data is received
        ytdlStream.on("data", (chunk) => {
          console.log(
            `Received ${chunk.length} bytes of data from ytdl stream`
          );
        });

        // Log when the stream ends
        ytdlStream.on("end", () => {
          console.log("ytdl stream ended");
        });

        // Create the audio resource
        console.log("Creating audio resource from ytdl stream...");
        const resource = createAudioResource(ytdlStream, {
          inlineVolume: true,
        });

        if (!resource) {
          console.error("Error: resource is undefined");
          throw new Error(
            "Failed to create audio resource: result is undefined"
          );
        }

        console.log("Audio resource created");

        if (resource.volume) {
          console.log("Setting volume to 100%");
          resource.volume.setVolume(1);
        } else {
          console.log(
            "Warning: resource.volume is undefined, cannot set volume"
          );
        }

        console.log("Playing audio resource...");
        player.play(resource);
        console.log("Audio resource is now playing");

        nowPlaying.set(guildId, nextSong);
        console.log(`Set nowPlaying for guild ${guildId}`);

        console.log(`Successfully playing: ${nextSong.title} using ytdl-core`);
        success = true;
      } catch (error) {
        console.error(`Method 3 failed: ${error.message}`);
        console.error(error.stack);
        errorMessages.push(`Method 3 (ytdl-core): ${error.message}`);
      }
    }

    // Method 4: ytdl-core with different options for music videos
    if (!success) {
      try {
        console.log(
          "Method 4: Attempting to play using ytdl-core with alternative options..."
        );

        // Try with a different set of options specifically for music videos
        console.log("Creating ytdl stream with alternative options...");
        const ytdlOptions = {
          filter: (format) => format.hasAudio && !format.hasVideo,
          highWaterMark: 1 << 25, // 32MB buffer
          requestOptions: {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              Referer: "https://www.youtube.com/",
              Cookie:
                "CONSENT=YES+cb; YSC=DwKYllHNwuw; VISITOR_INFO1_LIVE=7cPyAIGQPrI",
            },
          },
        };

        console.log(`ytdl alternative options: ${JSON.stringify(ytdlOptions)}`);
        const ytdlStream = ytdl(normalizedUrl, ytdlOptions);
        console.log("ytdl stream with alternative options created");

        ytdlStream.on("error", (error) => {
          console.error(`ytdl music stream error: ${error.message}`);
          console.error(error.stack);
          // Only try to play the next song if we haven't already succeeded
          if (!success) {
            console.log("Scheduling next song due to stream error...");
            setTimeout(() => playNext(guildId), 1000);
          }
        });

        // Log when data is received
        ytdlStream.on("data", (chunk) => {
          console.log(
            `Received ${chunk.length} bytes of data from ytdl alternative stream`
          );
        });

        // Log when the stream ends
        ytdlStream.on("end", () => {
          console.log("ytdl alternative stream ended");
        });

        // Create the audio resource
        console.log("Creating audio resource from ytdl alternative stream...");
        const resource = createAudioResource(ytdlStream, {
          inlineVolume: true,
        });

        if (!resource) {
          console.error("Error: resource is undefined");
          throw new Error(
            "Failed to create audio resource: result is undefined"
          );
        }

        console.log("Audio resource created");

        if (resource.volume) {
          console.log("Setting volume to 100%");
          resource.volume.setVolume(1);
        } else {
          console.log(
            "Warning: resource.volume is undefined, cannot set volume"
          );
        }

        console.log("Playing audio resource...");
        player.play(resource);
        console.log("Audio resource is now playing");

        nowPlaying.set(guildId, nextSong);
        console.log(`Set nowPlaying for guild ${guildId}`);

        console.log(
          `Successfully playing: ${nextSong.title} using ytdl-core (alternative options)`
        );
        success = true;
      } catch (error) {
        console.error(`Method 4 failed: ${error.message}`);
        console.error(error.stack);
        errorMessages.push(
          `Method 4 (ytdl-core alternative options): ${error.message}`
        );
      }
    }

    // Method 5: Last resort - try with a completely different approach
    if (!success) {
      try {
        console.log("Method 5: Last resort attempt with minimal options...");

        // Try with minimal options
        console.log("Creating ytdl stream with minimal options...");
        const ytdlOptions = {
          filter: "audioonly",
          requestOptions: {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          },
        };

        console.log(`ytdl minimal options: ${JSON.stringify(ytdlOptions)}`);
        const ytdlStream = ytdl(normalizedUrl, ytdlOptions);
        console.log("ytdl stream with minimal options created");

        ytdlStream.on("error", (error) => {
          console.error(`ytdl minimal stream error: ${error.message}`);
          console.error(error.stack);
          // Only try to play the next song if we haven't already succeeded
          if (!success) {
            console.log("Scheduling next song due to stream error...");
            setTimeout(() => playNext(guildId), 1000);
          }
        });

        // Create the audio resource
        console.log("Creating audio resource from ytdl minimal stream...");
        const resource = createAudioResource(ytdlStream, {
          inlineVolume: true,
        });

        if (!resource) {
          console.error("Error: resource is undefined");
          throw new Error(
            "Failed to create audio resource: result is undefined"
          );
        }

        console.log("Audio resource created");

        if (resource.volume) {
          console.log("Setting volume to 100%");
          resource.volume.setVolume(1);
        } else {
          console.log(
            "Warning: resource.volume is undefined, cannot set volume"
          );
        }

        console.log("Playing audio resource...");
        player.play(resource);
        console.log("Audio resource is now playing");

        nowPlaying.set(guildId, nextSong);
        console.log(`Set nowPlaying for guild ${guildId}`);

        console.log(
          `Successfully playing: ${nextSong.title} using ytdl-core (minimal options)`
        );
        success = true;
      } catch (error) {
        console.error(`Method 5 failed: ${error.message}`);
        console.error(error.stack);
        errorMessages.push(
          `Method 5 (ytdl-core minimal options): ${error.message}`
        );
      }
    }

    // If all methods failed, log detailed error and skip to next song
    if (!success) {
      console.error(`All playback methods failed for ${nextSong.title}.`);
      console.error(`Error messages: ${JSON.stringify(errorMessages)}`);

      // Skip to the next song
      console.log("Scheduling next song due to all methods failing...");
      setTimeout(() => playNext(guildId), 1000);

      return {
        success: false,
        message: `Couldn't play ${nextSong.title}, skipping to next song...`,
      };
    }

    // If we got here, one of the methods succeeded
    console.log(
      `=== PLAY NEXT FUNCTION COMPLETED SUCCESSFULLY FOR GUILD ${guildId} ===`
    );
    return {
      success: true,
      message: `Now playing: ${nextSong.title}`,
      title: nextSong.title,
    };
  } catch (error) {
    console.error("=== ERROR IN PLAY NEXT FUNCTION ===");
    console.error(`Error type: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);

    // Try to play the next song in the queue
    console.log("Scheduling next song due to error...");
    setTimeout(() => {
      try {
        console.log(`Getting queue for guild ${guildId} after error`);
        const queue = queues.get(guildId);
        if (queue && queue.length > 0) {
          console.log(`Queue has ${queue.length} songs, playing next song`);
          playNext(guildId);
        } else {
          console.log("Queue is empty, not playing next song");
        }
      } catch (nextError) {
        console.error(
          "Error trying to play next song after failure:",
          nextError.message
        );
        console.error(nextError.stack);
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