/**
 * Discord Player Handler
 *
 * This module provides a more robust way to play music using discord-player
 * which handles YouTube and other sources more reliably.
 */

const { Player } = require("discord-player");
const { Client } = require("discord.js");
const { YouTubeExtractor } = require("@discord-player/extractor");

// Map to store player instances for each guild
const players = new Map();
// Map to store queues for each guild
const queues = new Map();
// Map to store currently playing songs
const nowPlaying = new Map();

/**
 * Initialize the Discord Player for a client
 * @param {Client} client - Discord.js client
 */
async function initializePlayer(client) {
  try {
    console.log("Initializing Discord Player...");

    // Create a new Player instance
    const player = new Player(client);

    // Register the YouTube extractor
    await player.extractors.register(YouTubeExtractor, {});

    // Set up event listeners
    player.events.on("playerStart", (queue, track) => {
      console.log(`Started playing: ${track.title}`);
      nowPlaying.set(queue.guild.id, track);
    });

    player.events.on("playerFinish", (queue) => {
      console.log(`Finished playing in guild: ${queue.guild.id}`);
      nowPlaying.delete(queue.guild.id);
    });

    player.events.on("error", (queue, error) => {
      console.error(`Player error in guild ${queue.guild.id}:`, error.message);
    });

    player.events.on("emptyQueue", (queue) => {
      console.log(`Queue ended in guild: ${queue.guild.id}`);
      queues.delete(queue.guild.id);
    });

    return player;
  } catch (error) {
    console.error("Error initializing Discord Player:", error);
    throw error;
  }
}

/**
 * Join a voice channel
 * @param {Object} interaction - Discord interaction
 * @param {Player} player - Discord Player instance
 * @returns {Object} Result object with success status and message
 */
async function joinVoiceChannel(interaction, player) {
  try {
    const { member, guild } = interaction;

    // Check if user is in a voice channel
    if (!member.voice.channel) {
      return {
        success: false,
        message: "You need to be in a voice channel to use this command.",
      };
    }

    // Get or create a queue for this guild
    const queue = player.nodes.create(guild, {
      metadata: {
        channel: interaction.channel,
      },
      selfDeaf: true,
      volume: 80,
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: 300000, // 5 minutes
      leaveOnEnd: true,
      leaveOnEndCooldown: 300000, // 5 minutes
    });

    // Connect to the voice channel
    if (!queue.connection) {
      await queue.connect(member.voice.channel);
    }

    // Store the queue for this guild
    queues.set(guild.id, queue);

    return {
      success: true,
      message: `Joined ${member.voice.channel.name}!`,
    };
  } catch (error) {
    console.error("Error joining voice channel:", error);
    return {
      success: false,
      message: `Error joining voice channel: ${error.message}`,
    };
  }
}

/**
 * Leave a voice channel
 * @param {Object} interaction - Discord interaction
 * @returns {Object} Result object with success status and message
 */
async function leaveVoiceChannel(interaction) {
  try {
    const { guild } = interaction;

    // Get the queue for this guild
    const queue = queues.get(guild.id);

    if (!queue) {
      return {
        success: false,
        message: "I'm not in a voice channel.",
      };
    }

    // Delete the queue and disconnect
    queue.delete();
    queues.delete(guild.id);
    nowPlaying.delete(guild.id);

    return {
      success: true,
      message: "Left the voice channel!",
    };
  } catch (error) {
    console.error("Error leaving voice channel:", error);
    return {
      success: false,
      message: `Error leaving voice channel: ${error.message}`,
    };
  }
}

/**
 * Play a song
 * @param {Object} interaction - Discord interaction
 * @param {Player} player - Discord Player instance
 * @param {string} query - Song query or URL
 * @returns {Object} Result object with success status and message
 */
async function playSong(interaction, player, query) {
  try {
    const { guild, member } = interaction;

    // Check if user is in a voice channel
    if (!member.voice.channel) {
      return {
        success: false,
        message: "You need to be in a voice channel to use this command.",
      };
    }

    // Get or create a queue for this guild
    let queue = queues.get(guild.id);

    if (!queue) {
      // Join the voice channel first
      const joinResult = await joinVoiceChannel(interaction, player);
      if (!joinResult.success) {
        return joinResult;
      }

      queue = queues.get(guild.id);
    }

    // Search for the song
    console.log(`Searching for: ${query}`);
    const searchResult = await player.search(query, {
      requestedBy: interaction.user,
      searchEngine: "youtube",
    });

    if (!searchResult || searchResult.tracks.length === 0) {
      return {
        success: false,
        message: `No results found for: ${query}`,
      };
    }

    // Get the first track from the search result
    const track = searchResult.tracks[0];

    // Add the track to the queue
    queue.addTrack(track);

    // Start playing if not already playing
    if (!queue.isPlaying()) {
      await queue.node.play();
    }

    return {
      success: true,
      message: `Added to queue: **${track.title}**`,
    };
  } catch (error) {
    console.error("Error playing song:", error);
    return {
      success: false,
      message: `Error playing song: ${error.message}`,
    };
  }
}

/**
 * Skip the current song
 * @param {Object} interaction - Discord interaction
 * @returns {Object} Result object with success status and message
 */
async function skipSong(interaction) {
  try {
    const { guild } = interaction;

    // Get the queue for this guild
    const queue = queues.get(guild.id);

    if (!queue || !queue.isPlaying()) {
      return {
        success: false,
        message: "There is nothing playing to skip.",
      };
    }

    // Skip the current song
    queue.node.skip();

    return {
      success: true,
      message: "Skipped the current song!",
    };
  } catch (error) {
    console.error("Error skipping song:", error);
    return {
      success: false,
      message: `Error skipping song: ${error.message}`,
    };
  }
}

/**
 * Pause the current song
 * @param {Object} interaction - Discord interaction
 * @returns {Object} Result object with success status and message
 */
async function pauseSong(interaction) {
  try {
    const { guild } = interaction;

    // Get the queue for this guild
    const queue = queues.get(guild.id);

    if (!queue || !queue.isPlaying()) {
      return {
        success: false,
        message: "There is nothing playing to pause.",
      };
    }

    // Pause the queue
    queue.node.pause();

    return {
      success: true,
      message: "Paused the music!",
    };
  } catch (error) {
    console.error("Error pausing song:", error);
    return {
      success: false,
      message: `Error pausing song: ${error.message}`,
    };
  }
}

/**
 * Resume the current song
 * @param {Object} interaction - Discord interaction
 * @returns {Object} Result object with success status and message
 */
async function resumeSong(interaction) {
  try {
    const { guild } = interaction;

    // Get the queue for this guild
    const queue = queues.get(guild.id);

    if (!queue) {
      return {
        success: false,
        message: "There is no music in the queue.",
      };
    }

    if (!queue.node.isPaused()) {
      return {
        success: false,
        message: "The music is not paused.",
      };
    }

    // Resume the queue
    queue.node.resume();

    return {
      success: true,
      message: "Resumed the music!",
    };
  } catch (error) {
    console.error("Error resuming song:", error);
    return {
      success: false,
      message: `Error resuming song: ${error.message}`,
    };
  }
}

/**
 * Get the current queue
 * @param {Object} interaction - Discord interaction
 * @returns {Object} Result object with success status, message, and queue
 */
async function getQueue(interaction) {
  try {
    const { guild } = interaction;

    // Get the queue for this guild
    const queue = queues.get(guild.id);

    if (!queue || queue.tracks.size === 0) {
      return {
        success: false,
        message: "There are no songs in the queue.",
      };
    }

    // Get the current song
    const currentSong = queue.currentTrack;

    // Get the next songs in the queue (up to 5)
    const nextSongs = queue.tracks.toArray().slice(0, 5);

    return {
      success: true,
      message: "Queue retrieved successfully.",
      currentSong,
      nextSongs,
    };
  } catch (error) {
    console.error("Error getting queue:", error);
    return {
      success: false,
      message: `Error getting queue: ${error.message}`,
    };
  }
}

/**
 * Set the volume
 * @param {Object} interaction - Discord interaction
 * @param {number} volume - Volume level (0-100)
 * @returns {Object} Result object with success status and message
 */
async function setVolume(interaction, volume) {
  try {
    const { guild } = interaction;

    // Get the queue for this guild
    const queue = queues.get(guild.id);

    if (!queue) {
      return {
        success: false,
        message: "I'm not playing any music.",
      };
    }

    // Validate volume
    if (volume < 0 || volume > 100) {
      return {
        success: false,
        message: "Volume must be between 0 and 100.",
      };
    }

    // Set the volume
    queue.node.setVolume(volume);

    return {
      success: true,
      message: `Volume set to ${volume}%`,
    };
  } catch (error) {
    console.error("Error setting volume:", error);
    return {
      success: false,
      message: `Error setting volume: ${error.message}`,
    };
  }
}

module.exports = {
  initializePlayer,
  joinVoiceChannel,
  leaveVoiceChannel,
  playSong,
  skipSong,
  pauseSong,
  resumeSong,
  getQueue,
  setVolume,
};
