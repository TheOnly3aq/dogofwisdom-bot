/**
 * Music Player for Discord Bot
 *
 * A simple music player with basic functionality:
 * - Join/leave voice channels
 * - Play YouTube videos
 * - Skip songs
 * - Queue management
 * - Pause/resume playback
 */

const ytdl = require("ytdl-core");
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
const libsodium = require("libsodium-wrappers");
const fallbackPlayer = require("./fallbackPlayer");
const ytdlpHandler = require("./ytdlpHandler");

// Initialize libsodium and fallback player
(async () => {
  await libsodium.ready;
  console.log("Libsodium initialized successfully");

  // Initialize the fallback player
  await fallbackPlayer.initializeFallbackPlayer();
})();

// Store active connections and players for each guild
const connections = new Map();
const players = new Map();
const queues = new Map();
const nowPlaying = new Map();



/**
 * Join a voice channel
 * @param {Object} context - Message or Interaction object
 * @returns {Object} Result object with success status and message
 */
async function joinChannel(context) {
  try {
    // Ensure libsodium is ready
    await libsodium.ready;

    // Validate context has required properties
    if (!context.member) {
      return {
        success: false,
        message: "Invalid context: member not found",
      };
    }

    if (!context.guild) {
      return {
        success: false,
        message: "Invalid context: guild not found",
      };
    }

    // Check if user is in a voice channel
    const voiceChannel = context.member.voice.channel;
    if (!voiceChannel) {
      return {
        success: false,
        message: "You need to be in a voice channel first!",
      };
    }

    // Validate voice adapter creator
    if (!context.guild.voiceAdapterCreator) {
      return {
        success: false,
        message: "Voice adapter creator not found. This is a Discord.js issue.",
      };
    }

    // Create a connection to the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: context.guild.id,
      adapterCreator: context.guild.voiceAdapterCreator,
      selfDeaf: true, // Bot deafens itself to save bandwidth
      selfMute: false, // Bot needs to be able to speak
    });

    // Create an audio player
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    // Subscribe the connection to the audio player
    const subscription = connection.subscribe(player);
    if (!subscription) {
      connection.destroy();
      return {
        success: false,
        message: "Failed to set up voice connection. Please try again.",
      };
    }

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
        // Try to reconnect
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Reconnection in progress - ignore disconnect
      } catch (error) {
        // Seems to be a real disconnect which shouldn't be recovered from
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
      console.error(`Player error: ${error.message}`);
      // Attempt to play next song after error
      playNext(context.guild.id);
    });

    return { success: true, message: `Joined ${voiceChannel.name}!` };
  } catch (error) {
    console.error(`Error joining voice channel: ${error.message}`);
    return {
      success: false,
      message: `Error joining voice channel: ${error.message}`,
    };
  }
}

/**
 * Leave a voice channel
 * @param {string} guildId - Guild ID
 * @returns {Object} Result object with success status and message
 */
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
    console.error(`Error leaving voice channel: ${error.message}`);
    return { success: false, message: `Error: ${error.message}` };
  }
}

/**
 * Play a YouTube video
 * @param {Object} context - Message or Interaction object
 * @param {string} url - YouTube URL or search query
 * @returns {Object} Result object with success status and message
 */
async function playYouTube(context, url) {
  try {
    // Validate context
    if (!context || !context.guild) {
      return {
        success: false,
        message: "Invalid context",
      };
    }

    const guildId = context.guild.id;

    // Check if the bot is in a voice channel
    if (!connections.has(guildId)) {
      // Check if user is in a voice channel
      if (
        !context.member ||
        !context.member.voice ||
        !context.member.voice.channel
      ) {
        return {
          success: false,
          message: "You need to be in a voice channel first!",
        };
      }

      // Join the voice channel
      const joinResult = await joinChannel(context);
      if (!joinResult.success) {
        return joinResult;
      }
    }

    // Try to get video info
    let videoInfo;
    let isSearch = false;

    // Check if the input is a URL or a search query
    if (ytdl.validateURL(url)) {
      // It's a valid YouTube URL
      console.log(`Processing valid YouTube URL: ${url}`);
      try {
        // Try with play-dl first
        videoInfo = await play.video_info(url);
        console.log("Successfully retrieved video info with play-dl");
      } catch (error) {
        console.error(`play-dl video_info error: ${error.message}`);
        try {
          // Fallback to ytdl-core with more robust options
          console.log("Falling back to ytdl-core for video info");

          const ytdlOptions = {
            requestOptions: {
              headers: {
                // Add a user agent to avoid being blocked
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5",
              },
            },
          };

          const ytdlInfo = await ytdl.getInfo(url, ytdlOptions);
          console.log("Successfully retrieved video info with ytdl-core");

          videoInfo = {
            video_details: {
              title: ytdlInfo.videoDetails.title,
              url: ytdlInfo.videoDetails.video_url,
              thumbnail: {
                url: ytdlInfo.videoDetails.thumbnails[0]?.url || "",
              },
              durationInSec: parseInt(ytdlInfo.videoDetails.lengthSeconds) || 0,
            },
          };
        } catch (ytdlError) {
          console.error(`ytdl-core getInfo error: ${ytdlError.message}`);

          // Try to extract video ID and create a basic info object
          try {
            console.log("Attempting to create basic video info from URL");
            let videoId = "";

            if (url.includes("youtube.com/watch?v=")) {
              videoId = url.split("v=")[1].split("&")[0];
            } else if (url.includes("youtu.be/")) {
              videoId = url.split("youtu.be/")[1].split("?")[0];
            }

            if (videoId) {
              // Create a basic video info object
              videoInfo = {
                video_details: {
                  title: `YouTube Video (${videoId})`,
                  url: url,
                  thumbnail: {
                    url: `https://img.youtube.com/vi/${videoId}/default.jpg`,
                  },
                  durationInSec: 0,
                },
              };
              console.log("Created basic video info from URL");
            } else {
              throw new Error("Could not extract video ID");
            }
          } catch (extractError) {
            console.error(`Video ID extraction error: ${extractError.message}`);
            return {
              success: false,
              message:
                "Failed to get video information. YouTube might be blocking our request. Please try another URL.",
            };
          }
        }
      }
    } else {
      // Treat it as a search query
      isSearch = true;
      console.log(`Processing search query: ${url}`);
      try {
        // Try with play-dl
        const searchResults = await play.search(url, { limit: 1 });
        if (searchResults && searchResults.length > 0) {
          console.log(`Found search result: ${searchResults[0].title}`);
          videoInfo = await play.video_info(searchResults[0].url);
        } else {
          return {
            success: false,
            message: "No search results found. Please try a different query.",
          };
        }
      } catch (searchError) {
        console.error(`Search error: ${searchError.message}`);

        // Try a different approach for searching
        try {
          console.log("Attempting alternative search method");
          // This is a simplified approach - in a real implementation, you might want to use a different search API
          return {
            success: false,
            message:
              "Search functionality is currently limited due to YouTube API restrictions. Please try using a direct YouTube URL instead.",
          };
        } catch (altSearchError) {
          console.error(`Alternative search error: ${altSearchError.message}`);
          return {
            success: false,
            message:
              "Failed to search for videos. YouTube might be blocking our request. Please try using a direct URL.",
          };
        }
      }
    }

    // Extract video details
    if (!videoInfo || !videoInfo.video_details) {
      return {
        success: false,
        message:
          "Failed to get video information. The video might be unavailable or restricted.",
      };
    }

    const videoDetails = videoInfo.video_details;

    // Validate video details
    if (!videoDetails.title || !videoDetails.url) {
      return {
        success: false,
        message: "Invalid video details. The video might be unavailable.",
      };
    }

    // Create a song object
    const song = {
      title: videoDetails.title,
      url: videoDetails.url,
      thumbnail: videoDetails.thumbnail?.url || "",
      duration: videoDetails.durationInSec || 0,
      requestedBy: context.member?.user?.tag || "Unknown user",
    };

    // Get the queue for this guild
    let queue = queues.get(guildId);
    if (!queue) {
      queue = [];
      queues.set(guildId, queue);
    }

    // Add the song to the queue
    queue.push(song);

    // Get the player for this guild
    const player = players.get(guildId);
    if (!player) {
      return {
        success: false,
        message: "Audio player not found. Please try again.",
      };
    }

    // Check if the player is idle (not playing anything)
    if (player.state.status === AudioPlayerStatus.Idle) {
      // Start playing immediately
      return await playNext(guildId);
    } else {
      // Add to queue
      return {
        success: true,
        message: `Added ${isSearch ? "search result" : ""} **${
          song.title
        }** to the queue at position ${queue.length}`,
      };
    }
  } catch (error) {
    console.error(`Error playing YouTube video: ${error.message}`);
    return {
      success: false,
      message: `Error playing YouTube video: ${error.message}`,
    };
  }
}

/**
 * Play the next song in the queue
 * @param {string} guildId - Guild ID
 * @returns {Object} Result object with success status and message
 */
async function playNext(guildId) {
  try {
    // Get the queue for this guild
    const queue = queues.get(guildId);
    if (!queue || queue.length === 0) {
      // Clear the now playing
      nowPlaying.delete(guildId);
      return { success: false, message: "No more songs in the queue!" };
    }

    // Get the next song
    const nextSong = queue.shift();

    // Validate the song object
    if (!nextSong || !nextSong.url) {
      console.error("Invalid song object:", nextSong);
      // Try to play the next song in the queue
      if (queue.length > 0) {
        setTimeout(() => playNext(guildId), 1000);
        return {
          success: false,
          message: "Invalid song data, skipping to next song...",
        };
      } else {
        return {
          success: false,
          message: "Invalid song data and no more songs in the queue!",
        };
      }
    }

    // Set the now playing
    nowPlaying.set(guildId, nextSong);

    // Get the player and connection
    const player = players.get(guildId);
    const connection = connections.get(guildId);

    if (!player || !connection) {
      return {
        success: false,
        message: "Player or connection not found. Please try again.",
      };
    }

    // Validate and normalize the URL
    try {
      console.log(`Attempting to play: ${nextSong.url}`);

      if (!nextSong.url) {
        throw new Error("Song URL is undefined");
      }

      // Ensure the URL is properly formatted
      let videoUrl = nextSong.url;

      // Extract video ID if it's a YouTube URL
      let videoId = null;
      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
        try {
          // Try to extract video ID using ytdl-core
          videoId = ytdl.getVideoID(videoUrl);
          console.log(`Extracted video ID: ${videoId}`);

          // Reconstruct a clean YouTube URL
          videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
          console.log(`Normalized URL: ${videoUrl}`);
        } catch (idError) {
          console.error(`Error extracting video ID: ${idError.message}`);
          // Continue with the original URL
        }
      }

      // Try play-dl first (most reliable in recent tests)
      try {
        console.log(`Using play-dl for: ${videoUrl}`);

        // Validate the URL with play-dl
        const isValid = await play.validate(videoUrl);
        console.log(`URL validation result: ${isValid}`);

        // Try to get a fresh stream URL using play-dl
        const streamInfo = await play.stream(videoUrl, {
          discordPlayerCompatibility: true,
          quality: 2, // Use high quality audio
        });

        if (!streamInfo || !streamInfo.stream) {
          throw new Error("Failed to create stream with play-dl");
        }

        console.log("Successfully created stream with play-dl");

        // Create the audio resource
        const resource = createAudioResource(streamInfo.stream, {
          inputType: streamInfo.type,
          inlineVolume: true,
        });
        resource.volume.setVolume(0.5);

        // Play the audio
        player.play(resource);

        return {
          success: true,
          message: `Now playing: **${nextSong.title}**`,
        };
      } catch (playDlError) {
        console.error(`play-dl error: ${playDlError.message}`);
        throw playDlError; // Propagate to next fallback
      }
    } catch (playDlError) {
      console.error(`play-dl error: ${playDlError.message}`);

      // Fallback to ytdl-core
      try {
        console.log(`Falling back to ytdl-core for: ${nextSong.url}`);

        // Use more robust ytdl options
        const ytdlOptions = {
          filter: "audioonly",
          quality: "highestaudio",
          highWaterMark: 1 << 25, // 32MB buffer
          requestOptions: {
            headers: {
              // Add a user agent to avoid being blocked
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              Cookie:
                "CONSENT=YES+cb; YSC=DwKYl4-q2sU; VISITOR_INFO1_LIVE=5VHa2PZ-uBE",
            },
          },
        };

        // Try to get a fresh stream
        const ytdlStream = ytdl(nextSong.url, ytdlOptions);

        // Add error handler to the stream
        ytdlStream.on("error", (err) => {
          console.error(`ytdl stream error: ${err.message}`);
        });

        // Create the audio resource
        const resource = createAudioResource(ytdlStream, {
          inputType: undefined, // Let Discord.js figure it out
          inlineVolume: true,
        });
        resource.volume.setVolume(0.5);

        // Play the audio
        player.play(resource);

        return {
          success: true,
          message: `Now playing: **${nextSong.title}**`,
        };
      } catch (ytdlError) {
        console.error(`ytdl-core error: ${ytdlError.message}`);

        // Try yt-dlp if available (as a last resort before fallback player)
        try {
          console.log(`Trying yt-dlp for: ${nextSong.url}`);

          // Check if yt-dlp is installed
          const { execSync } = require("child_process");
          try {
            execSync("yt-dlp --version", { stdio: "ignore" });
            console.log("yt-dlp is installed");

            // Use our yt-dlp handler
            const { resource, videoInfo } =
              await ytdlpHandler.createAudioStream(nextSong.url);

            // Play the audio
            player.play(resource);

            return {
              success: true,
              message: `Now playing: **${videoInfo.title || nextSong.title}**`,
            };
          } catch (error) {
            console.error("yt-dlp is not installed, using fallback player");
            throw new Error("yt-dlp is not installed");
          }
        } catch (ytdlpError) {
          console.error(`yt-dlp error: ${ytdlpError.message}`);
          console.error(
            `Failed to play song with all methods: ${nextSong.title}`
          );

          // Use our fallback player as a last resort
          console.log("Using fallback player as last resort");
          return await fallbackPlayer.playWithFallback(player, nextSong);
        }
      }
    }
  } catch (error) {
    console.error(`Error in playNext: ${error.message}`);

    // Try to use the fallback player as a last resort
    try {
      const player = players.get(guildId);
      const nextSong = nowPlaying.get(guildId);

      if (player && nextSong) {
        console.log("Attempting to use fallback player after error");
        return await fallbackPlayer.playWithFallback(player, nextSong);
      }
    } catch (fallbackError) {
      console.error(`Fallback player error: ${fallbackError.message}`);
    }

    // Try to play the next song in the queue
    const queue = queues.get(guildId);
    if (queue && queue.length > 0) {
      setTimeout(() => playNext(guildId), 1000);
    }

    return {
      success: false,
      message: `⚠️ YouTube playback is currently experiencing issues. We're working on a fix. Error: ${error.message}`,
    };
  }
}

/**
 * Skip the current song
 * @param {string} guildId - Guild ID
 * @returns {Object} Result object with success status and message
 */
function skipSong(guildId) {
  try {
    const player = players.get(guildId);
    if (!player) {
      return { success: false, message: "No audio player found!" };
    }

    // Stop the current song, which will trigger the idle event and play the next song
    player.stop();
    return { success: true, message: "Skipped to the next song!" };
  } catch (error) {
    console.error(`Error skipping song: ${error.message}`);
    return { success: false, message: `Error: ${error.message}` };
  }
}

/**
 * Pause the current playback
 * @param {string} guildId - Guild ID
 * @returns {Object} Result object with success status and message
 */
function pausePlayback(guildId) {
  try {
    const player = players.get(guildId);
    if (!player) {
      return { success: false, message: "No audio player found!" };
    }

    if (player.state.status !== AudioPlayerStatus.Playing) {
      return { success: false, message: "Nothing is playing right now!" };
    }

    player.pause();
    return { success: true, message: "Paused the current song!" };
  } catch (error) {
    console.error(`Error pausing playback: ${error.message}`);
    return { success: false, message: `Error: ${error.message}` };
  }
}

/**
 * Resume the current playback
 * @param {string} guildId - Guild ID
 * @returns {Object} Result object with success status and message
 */
function resumePlayback(guildId) {
  try {
    const player = players.get(guildId);
    if (!player) {
      return { success: false, message: "No audio player found!" };
    }

    if (player.state.status !== AudioPlayerStatus.Paused) {
      return { success: false, message: "Playback is not paused!" };
    }

    player.unpause();
    return { success: true, message: "Resumed playback!" };
  } catch (error) {
    console.error(`Error resuming playback: ${error.message}`);
    return { success: false, message: `Error: ${error.message}` };
  }
}

/**
 * Get the current queue
 * @param {string} guildId - Guild ID
 * @returns {Object} Result object with success status, message, current song, and queue
 */
function getQueue(guildId) {
  const queue = queues.get(guildId);
  const current = nowPlaying.get(guildId);

  if (!queue || queue.length === 0) {
    if (!current) {
      return { success: false, message: "No songs in the queue!" };
    }
  }

  return {
    success: true,
    message: "Retrieved queue successfully",
    current,
    queue,
  };
}

/**
 * Clean up resources for a guild
 * @param {string} guildId - Guild ID
 */
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
  pausePlayback,
  resumePlayback,
  getQueue,
};
