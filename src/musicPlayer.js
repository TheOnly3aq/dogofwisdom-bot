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

// Initialize libsodium
(async () => {
  await libsodium.ready;
  console.log("Libsodium initialized successfully");
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
      try {
        videoInfo = await play.video_info(url);
      } catch (error) {
        try {
          // Fallback to ytdl-core
          const ytdlInfo = await ytdl.getInfo(url);
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
          return {
            success: false,
            message: "Failed to get video information. Please try another URL.",
          };
        }
      }
    } else {
      // Treat it as a search query
      isSearch = true;
      try {
        const searchResults = await play.search(url, { limit: 1 });
        if (searchResults && searchResults.length > 0) {
          videoInfo = await play.video_info(searchResults[0].url);
        } else {
          return {
            success: false,
            message: "No search results found. Please try a different query.",
          };
        }
      } catch (searchError) {
        return {
          success: false,
          message: "Failed to search for videos. Please try again.",
        };
      }
    }

    // Extract video details
    const videoDetails = videoInfo.video_details;

    // Create a song object
    const song = {
      title: videoDetails.title,
      url: videoDetails.url,
      thumbnail: videoDetails.thumbnail.url,
      duration: videoDetails.durationInSec,
      requestedBy: context.member.user.tag,
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

    // Try to play using play-dl first (most reliable)
    try {
      const stream = await play.stream(nextSong.url);

      // Create the audio resource
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });
      resource.volume.setVolume(1);

      // Play the audio
      player.play(resource);

      return {
        success: true,
        message: `Now playing: **${nextSong.title}**`,
      };
    } catch (playDlError) {
      // Fallback to ytdl-core
      try {
        const ytdlOptions = {
          filter: "audioonly",
          quality: "highestaudio",
          highWaterMark: 1 << 25, // 32MB buffer
        };

        const ytdlStream = ytdl(nextSong.url, ytdlOptions);

        // Create the audio resource
        const resource = createAudioResource(ytdlStream, {
          inputType: undefined, // Let Discord.js figure it out
          inlineVolume: true,
        });
        resource.volume.setVolume(1);

        // Play the audio
        player.play(resource);

        return {
          success: true,
          message: `Now playing: **${nextSong.title}**`,
        };
      } catch (ytdlError) {
        console.error(
          `Failed to play song with both methods: ${nextSong.title}`
        );

        // Skip to the next song
        setTimeout(() => playNext(guildId), 1000);

        return {
          success: false,
          message: `Couldn't play ${nextSong.title}, skipping to next song...`,
        };
      }
    }
  } catch (error) {
    console.error(`Error in playNext: ${error.message}`);

    // Try to play the next song in the queue
    const queue = queues.get(guildId);
    if (queue && queue.length > 0) {
      setTimeout(() => playNext(guildId), 1000);
    }

    return { success: false, message: `Error: ${error.message}` };
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
