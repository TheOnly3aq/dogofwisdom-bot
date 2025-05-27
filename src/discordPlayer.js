const { Player } = require('discord-player');
const { GuildQueue } = require('discord-player');
const { QueryType } = require("discord-player");

/**
 * Initialize the Discord Player
 * @param {Client} client - The Discord.js client
 * @returns {Player} - The initialized player
 */
async function initializePlayer(client) {
  // Configure FFmpeg path
  try {
    const ffmpeg = require("ffmpeg-static");
    console.log("FFmpeg path:", ffmpeg);
  } catch (ffmpegError) {
    console.log("FFmpeg not found:", ffmpegError.message);
  }

  // Create a new Player instance with specific options
  const player = new Player(client, {
    ytdlOptions: {
      quality: "highestaudio",
      highWaterMark: 1 << 25, // 32MB buffer
      dlChunkSize: 0, // Disable chunking for better performance
    },
    connectionTimeout: 30000, // 30 seconds
    skipFFmpeg: false, // Ensure FFmpeg is used
    debug: true, // Enable debug mode
    useLegacyFFmpeg: false, // Use modern FFmpeg
    smoothVolume: true, // Enable smooth volume transitions
    disableVolume: false, // Enable volume control
    bufferingTimeout: 15000, // 15 seconds buffering timeout
    noEmitInsert: false, // Emit insert events

    // Voice-related options
    lagMonitor: 1000, // Monitor voice connection lag
    volumeSmoothness: 0.1, // Smooth volume transitions

    // Audio quality options
    audioCodec: "opus", // Use opus codec
    bitrate: "auto", // Auto bitrate

    // Play-dl specific options
    fetchBeforeQueued: true, // Fetch stream info before queuing
    preferredQuality: "high", // Prefer high quality
  });

  // Add event listeners
  setupPlayerEvents(player);

  // For discord-player v7.1.0, we need to register extractors
  try {
    // First try to load the built-in extractors
    await player.extractors.loadDefault();
    console.log("Loaded default extractors");

    // Then try to register play-dl for better YouTube support
    try {
      // Configure play-dl
      const play = require("play-dl");

      // Create a custom extractor using play-dl
      const { YouTubeExtractor } = require("@discord-player/extractor");

      // Register the YouTube extractor
      player.extractors.register(YouTubeExtractor);

      console.log("Registered YouTube extractor with play-dl");
    } catch (playDlError) {
      console.log("Could not register play-dl extractor:", playDlError.message);
    }

    // Log all registered extractors
    const extractors = player.extractors.getAll();
    console.log(`Total registered extractors: ${extractors.length}`);
    extractors.forEach((ext) => console.log(`- ${ext.constructor.name}`));
  } catch (error) {
    console.log("Error initializing extractors:", error.message);

    // Last resort fallback
    try {
      const { DefaultExtractors } = require("@discord-player/extractor");
      await player.extractors.loadMulti(DefaultExtractors);
      console.log("Fallback: Loaded extractors from @discord-player/extractor");
    } catch (fallbackError) {
      console.log(
        "All extractor loading methods failed:",
        fallbackError.message
      );
    }
  }

  // Log player initialization complete
  console.log("Discord Player initialization complete");
  return player;
}

/**
 * Set up event listeners for the player
 * @param {Player} player - The Discord Player instance
 */
function setupPlayerEvents(player) {
  // Track start event
  player.events.on("playerStart", (queue, track) => {
    console.log(
      `[EVENT] playerStart: Playing "${track.title}" by "${track.author}"`
    );
    console.log(
      `[EVENT] playerStart: Queue connection status: ${
        queue.connection ? "Connected" : "Not connected"
      }`
    );
    console.log(`[EVENT] playerStart: Queue volume: ${queue.node.volume}`);

    queue.metadata.send(
      `🎵 Now playing: **${track.title}** by **${track.author}**`
    );
  });

  // Track add event
  player.events.on("audioTrackAdd", (queue, track) => {
    queue.metadata.send(
      `🎵 Added to queue: **${track.title}** by **${track.author}**`
    );
  });

  // Playlist add event
  player.events.on("audioTracksAdd", (queue, tracks) => {
    queue.metadata.send(`🎵 Added ${tracks.length} tracks to the queue`);
  });

  // Error events
  player.events.on("error", (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
    queue.metadata.send(`❌ Error: ${error.message}`);
  });

  player.events.on("playerError", (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
    queue.metadata.send(`❌ Player Error: ${error.message}`);
  });

  player.events.on("connectionError", (queue, error) => {
    console.error(`[Connection Error] ${error.message}`);
    queue.metadata.send(`❌ Connection Error: ${error.message}`);
  });

  // Queue end event
  player.events.on("emptyQueue", (queue) => {
    queue.metadata.send("✅ Queue finished! Use `/play` to add more songs.");
  });

  // Bot disconnect event
  player.events.on("disconnect", (queue) => {
    queue.metadata.send(
      "❌ I was manually disconnected from the voice channel, clearing queue!"
    );
  });

  // Channel empty event
  player.events.on("emptyChannel", (queue) => {
    queue.metadata.send("❌ Nobody is in the voice channel, leaving...");
  });

  // Debug event - log all events
  player.events.on("debug", (queue, message) => {
    console.log(`[Player Debug] ${message}`);
  });

  // Add a raw event listener to catch all events
  player.events.on("raw", (eventName, ...args) => {
    console.log(`[Player Raw Event] ${eventName}`);
  });
}

/**
 * Play a song from a URL or search query
 * @param {Interaction} interaction - The Discord interaction
 * @param {string} query - The song URL or search query
 */
async function playSong(interaction, query) {
  try {
    // Defer the reply to give us time to process
    await interaction.deferReply();

    // Get the member
    const member = interaction.member;

    // Check if the member is in a voice channel
    if (!member.voice.channel) {
      return interaction.followUp({
        content: "❌ You need to be in a voice channel to play music!",
        ephemeral: true,
      });
    }

    // Check if the bot has permission to join and speak
    const permissions = member.voice.channel.permissionsFor(
      interaction.client.user
    );
    if (!permissions.has("Connect") || !permissions.has("Speak")) {
      return interaction.followUp({
        content:
          "❌ I need permissions to join and speak in your voice channel!",
        ephemeral: true,
      });
    }

    // Get the player instance from global
    console.log("Accessing global.player in playSong function");
    console.log("global.player exists:", global.player ? "Yes" : "No");
    console.log("global.player type:", typeof global.player);

    const player = global.player;
    if (!player) {
      console.log("Player is not initialized in playSong function");
      return interaction.followUp({
        content: "❌ Music player is not initialized!",
        ephemeral: true,
      });
    }

    // Create a queue for this guild with more detailed options
    const queue = player.nodes.create(interaction.guild, {
      metadata: interaction.channel, // We can access this metadata object from the queue
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: 5000, // 5 seconds
      leaveOnEnd: true,
      leaveOnEndCooldown: 300000, // 5 minutes
      volume: 80,
      bufferingTimeout: 15000, // 15 seconds
      connectionTimeout: 30000, // 30 seconds
      selfDeaf: true, // Bot should deafen itself to save bandwidth
      maxSize: 1000, // Maximum queue size
      maxHistorySize: 100, // Maximum history size
      noEmitInsert: false, // Emit insert events
      skipOnNoStream: true, // Skip when no stream is available
    });

    try {
      // Connect to the voice channel with detailed logging
      if (!queue.connection) {
        console.log(
          `Attempting to connect to voice channel: ${member.voice.channel.name} (${member.voice.channel.id})`
        );

        // Force disconnect any existing connections first
        try {
          const existingConnection =
            interaction.guild.members.me?.voice?.connection;
          if (existingConnection) {
            console.log("Forcing disconnect from existing voice connection");
            existingConnection.disconnect();
          }
        } catch (disconnectError) {
          console.log(
            "Error during force disconnect:",
            disconnectError.message
          );
        }

        // Connect with a timeout
        const connectionPromise = queue.connect(member.voice.channel);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), 10000)
        );

        await Promise.race([connectionPromise, timeoutPromise]);
        console.log("Successfully connected to voice channel");
      } else {
        console.log("Already connected to voice channel");
      }
    } catch (error) {
      // Destroy the queue if we failed to connect
      queue.delete();
      return interaction.followUp({
        content: `❌ Could not join your voice channel: ${error.message}`,
        ephemeral: true,
      });
    }

    // Search for the song
    let searchResult;
    try {
      // Check if the query is a YouTube URL
      const isYouTubeUrl =
        query.includes("youtube.com/") || query.includes("youtu.be/");

      console.log("Searching for song:", query);
      console.log("Is YouTube URL:", isYouTubeUrl);

      // Try to use play-dl directly for YouTube URLs for better reliability
      if (isYouTubeUrl) {
        try {
          console.log("Using play-dl for YouTube URL");
          const play = require("play-dl");

          // Get video info
          const videoInfo = await play.video_info(query);
          console.log("Video info retrieved:", videoInfo.video_details.title);

          // Use the proper track creation method for discord-player v7.1.0
          const { Track } = require("discord-player");

          // Create a proper Track object
          const track = new Track(player, {
            title: videoInfo.video_details.title,
            description: videoInfo.video_details.description,
            author: videoInfo.video_details.channel.name,
            url: query,
            thumbnail: videoInfo.video_details.thumbnails[0].url,
            duration: videoInfo.video_details.durationInSec * 1000,
            views: videoInfo.video_details.views,
            requestedBy: interaction.user,
            source: "youtube",
            // Add the raw data needed for playback
            raw: {
              source: "youtube",
              url: query,
              id: videoInfo.video_details.id,
              engine: "play-dl",
            },
          });

          // Create a search result object with the proper Track object
          searchResult = {
            playlist: null,
            tracks: [track],
          };

          console.log("Created track manually using play-dl");
        } catch (playDlError) {
          console.log(
            "Error using play-dl, falling back to default search:",
            playDlError.message
          );
          // Fall back to default search
          searchResult = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.YOUTUBE_VIDEO,
          });
        }
      } else {
        // Use the default search for non-YouTube URLs
        searchResult = await player.search(query, {
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO,
        });
      }

      console.log(
        "Search result:",
        searchResult
          ? `Found ${searchResult.tracks.length} results`
          : "No results"
      );
    } catch (error) {
      console.log("Error searching for song:", error.message);
      return interaction.followUp({
        content: `❌ Error searching for song: ${error.message}`,
        ephemeral: true,
      });
    }

    // If no tracks were found
    if (!searchResult || !searchResult.tracks.length) {
      return interaction.followUp({
        content: "❌ No results found!",
        ephemeral: true,
      });
    }

    // Add the track(s) to the queue
    try {
      console.log("Adding tracks to queue");

      if (searchResult.playlist) {
        // Add the playlist to the queue
        console.log(
          `Adding playlist with ${searchResult.tracks.length} tracks`
        );

        // Use the proper method for adding tracks in v7.1.0
        await queue.tracks.add(searchResult.tracks);
        console.log(`Queue now has ${queue.tracks.size} tracks`);

        await interaction.followUp(
          `✅ Added playlist **${searchResult.playlist.title}** with ${searchResult.tracks.length} songs to the queue!`
        );
      } else {
        // Add the track to the queue
        console.log(`Adding single track: ${searchResult.tracks[0].title}`);

        // Use the proper method for adding a track in v7.1.0
        const addResult = await queue.tracks.add(searchResult.tracks[0]);
        console.log(
          `Track added to queue: ${addResult ? "Success" : "Failed"}`
        );
        console.log(`Queue now has ${queue.tracks.size} tracks`);

        await interaction.followUp(
          `✅ Added **${searchResult.tracks[0].title}** to the queue!`
        );
      }

      // Play the queue if it's not already playing
      if (!queue.isPlaying()) {
        console.log("Starting playback");
        try {
          // Check if we have a valid connection
          if (!queue.connection) {
            console.log("No connection found, attempting to connect again");
            await queue.connect(member.voice.channel);
          }

          console.log(
            "Connection status:",
            queue.connection ? "Connected" : "Not connected",
            "to channel:",
            member.voice.channel ? member.voice.channel.name : "Unknown"
          );

          // Check if we have tracks in the queue
          console.log("Tracks in queue:", queue.tracks.size);
          console.log(
            "Current track:",
            queue.currentTrack ? queue.currentTrack.title : "None"
          );

          // Make sure we have a current track
          if (!queue.currentTrack && queue.tracks.size > 0) {
            console.log(
              "No current track but tracks exist in queue, setting current track"
            );
            const nextTrack = queue.tracks.at(0);
            queue.node.setCurrentTrack(nextTrack);
          }

          // Start playback with detailed logging
          console.log(
            "Starting playback with track:",
            queue.currentTrack ? queue.currentTrack.title : "No track"
          );

          // Use the proper play method for v7.1.0
          const playResult = await queue.node.play();
          console.log("Play result:", playResult ? "Success" : "Failed");

          // Additional logging
          console.log(
            "Player state:",
            queue.node.isPlaying() ? "Playing" : "Not playing"
          );
          console.log("Volume:", queue.node.volume);
        } catch (playError) {
          console.error("Error during playback start:", playError);
          throw playError; // Re-throw to be caught by the outer catch block
        }
      } else {
        console.log("Queue is already playing");
        console.log(
          "Current track:",
          queue.currentTrack ? queue.currentTrack.title : "None"
        );
      }
    } catch (error) {
      console.error("Error adding track to queue:", error);
      return interaction.followUp({
        content: `❌ Error adding track to queue: ${error.message}`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Error in playSong function:", error);
    return interaction.followUp({
      content: `❌ An error occurred: ${error.message}`,
      ephemeral: true,
    });
  }
}

/**
 * Skip the current song
 * @param {Interaction} interaction - The Discord interaction
 */
async function skipSong(interaction) {
  try {
    // Get the member
    const member = interaction.member;

    // Check if the member is in a voice channel
    if (!member.voice.channel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to skip songs!",
        ephemeral: true,
      });
    }

    // Get the player instance from global
    const player = global.player;
    if (!player) {
      return interaction.reply({
        content: "❌ Music player is not initialized!",
        ephemeral: true,
      });
    }

    // Get the queue for this guild
    const queue = player.nodes.get(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "❌ No music is currently playing!",
        ephemeral: true,
      });
    }

    // Skip the current song
    const currentTrack = queue.currentTrack;
    queue.node.skip();

    return interaction.reply(`✅ Skipped **${currentTrack.title}**!`);
  } catch (error) {
    console.error("Error in skipSong function:", error);
    return interaction.reply({
      content: `❌ An error occurred: ${error.message}`,
      ephemeral: true,
    });
  }
}

/**
 * Stop the music and clear the queue
 * @param {Interaction} interaction - The Discord interaction
 */
async function stopMusic(interaction) {
  try {
    // Get the member
    const member = interaction.member;

    // Check if the member is in a voice channel
    if (!member.voice.channel) {
      return interaction.reply({
        content: "❌ You need to be in a voice channel to stop the music!",
        ephemeral: true,
      });
    }

    // Get the player instance from global
    const player = global.player;
    if (!player) {
      return interaction.reply({
        content: "❌ Music player is not initialized!",
        ephemeral: true,
      });
    }

    // Get the queue for this guild
    const queue = player.nodes.get(interaction.guildId);
    if (!queue) {
      return interaction.reply({
        content: "❌ No music is currently playing!",
        ephemeral: true,
      });
    }

    // Clear the queue and stop the music
    queue.delete();

    return interaction.reply("🛑 Stopped the music and cleared the queue!");
  } catch (error) {
    console.error("Error in stopMusic function:", error);
    return interaction.reply({
      content: `❌ An error occurred: ${error.message}`,
      ephemeral: true,
    });
  }
}

/**
 * Show the current queue
 * @param {Interaction} interaction - The Discord interaction
 */
async function showQueue(interaction) {
  try {
    // Get the player instance from global
    const player = global.player;
    if (!player) {
      return interaction.reply({
        content: "❌ Music player is not initialized!",
        ephemeral: true,
      });
    }

    // Get the queue for this guild
    const queue = player.nodes.get(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "❌ No music is currently playing!",
        ephemeral: true,
      });
    }

    // Get the current track and upcoming tracks
    const currentTrack = queue.currentTrack;
    const tracks = queue.tracks.toArray();

    // Create an embed for the queue
    const queueEmbed = {
      title: "🎵 Music Queue",
      description: `**Now Playing:**\n${currentTrack.title} by ${currentTrack.author}\n\n`,
      color: 0x3498db,
      fields: [],
      footer: {
        text: `Requested by ${interaction.user.tag}`,
      },
    };

    // Add upcoming tracks to the embed
    if (tracks.length > 0) {
      const trackList = tracks
        .slice(0, 10)
        .map(
          (track, index) => `${index + 1}. ${track.title} by ${track.author}`
        )
        .join("\n");

      queueEmbed.description += `**Upcoming Tracks:**\n${trackList}`;

      // If there are more tracks than we're showing
      if (tracks.length > 10) {
        queueEmbed.description += `\n\n...and ${
          tracks.length - 10
        } more track(s)`;
      }
    } else {
      queueEmbed.description += "**Upcoming Tracks:**\nNo tracks in queue";
    }

    return interaction.reply({ embeds: [queueEmbed] });
  } catch (error) {
    console.error("Error in showQueue function:", error);
    return interaction.reply({
      content: `❌ An error occurred: ${error.message}`,
      ephemeral: true,
    });
  }
}

/**
 * Join the voice channel
 * @param {Interaction} interaction - The Discord interaction
 */
async function joinVoiceChannel(interaction) {
    try {
        // Get the member
        const member = interaction.member;
        
        // Check if the member is in a voice channel
        if (!member.voice.channel) {
            return interaction.reply({
                content: '❌ You need to be in a voice channel for me to join!',
                ephemeral: true
            });
        }

        // Get the player instance from global
        const player = global.player;
        if (!player) {
            return interaction.reply({
                content: '❌ Music player is not initialized!',
                ephemeral: true
            });
        }

        // Check if already in a voice channel in this guild
        const existingQueue = player.nodes.get(interaction.guildId);
        if (existingQueue && existingQueue.connection) {
            return interaction.reply({
                content: '❌ I\'m already in a voice channel!',
                ephemeral: true
            });
        }

        // Create a queue for this guild
        const queue = player.nodes.create(interaction.guild, {
            metadata: interaction.channel,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 5000, // 5 seconds
            leaveOnEnd: true,
            leaveOnEndCooldown: 300000, // 5 minutes
            volume: 80
        });

        try {
            // Connect to the voice channel
            await queue.connect(member.voice.channel);
            return interaction.reply(`✅ Joined ${member.voice.channel.name}!`);
        } catch (error) {
            // Destroy the queue if we failed to connect
            queue.delete();
            return interaction.reply({
                content: `❌ Could not join your voice channel: ${error.message}`,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Error in joinVoiceChannel function:', error);
        return interaction.reply({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
        });
    }
}

/**
 * Leave the voice channel
 * @param {Interaction} interaction - The Discord interaction
 */
async function leaveVoiceChannel(interaction) {
    try {
        // Get the member
        const member = interaction.member;
        
        // Check if the member is in a voice channel
        if (!member.voice.channel) {
            return interaction.reply({
                content: '❌ You need to be in a voice channel to use this command!',
                ephemeral: true
            });
        }

        // Get the player instance from global
        const player = global.player;
        if (!player) {
            return interaction.reply({
                content: '❌ Music player is not initialized!',
                ephemeral: true
            });
        }

        // Get the queue for this guild
        const queue = player.nodes.get(interaction.guildId);
        if (!queue) {
            return interaction.reply({
                content: '❌ I\'m not in a voice channel!',
                ephemeral: true
            });
        }

        // Delete the queue (which also disconnects from the voice channel)
        queue.delete();
        
        return interaction.reply('👋 Left the voice channel!');
    } catch (error) {
        console.error('Error in leaveVoiceChannel function:', error);
        return interaction.reply({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
        });
    }
}

/**
 * Pause the current song
 * @param {Interaction} interaction - The Discord interaction
 */
async function pauseSong(interaction) {
    try {
        // Get the member
        const member = interaction.member;
        
        // Check if the member is in a voice channel
        if (!member.voice.channel) {
            return interaction.reply({
                content: '❌ You need to be in a voice channel to pause the music!',
                ephemeral: true
            });
        }

        // Get the player instance from global
        const player = global.player;
        if (!player) {
            return interaction.reply({
                content: '❌ Music player is not initialized!',
                ephemeral: true
            });
        }

        // Get the queue for this guild
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: '❌ No music is currently playing!',
                ephemeral: true
            });
        }

        // Check if already paused
        if (queue.node.isPaused()) {
            return interaction.reply({
                content: '❌ The music is already paused!',
                ephemeral: true
            });
        }

        // Pause the queue
        queue.node.pause();
        
        return interaction.reply('⏸️ Paused the music!');
    } catch (error) {
        console.error('Error in pauseSong function:', error);
        return interaction.reply({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
        });
    }
}

/**
 * Resume the paused song
 * @param {Interaction} interaction - The Discord interaction
 */
async function resumeSong(interaction) {
    try {
        // Get the member
        const member = interaction.member;
        
        // Check if the member is in a voice channel
        if (!member.voice.channel) {
            return interaction.reply({
                content: '❌ You need to be in a voice channel to resume the music!',
                ephemeral: true
            });
        }

        // Get the player instance from global
        const player = global.player;
        if (!player) {
            return interaction.reply({
                content: '❌ Music player is not initialized!',
                ephemeral: true
            });
        }

        // Get the queue for this guild
        const queue = player.nodes.get(interaction.guildId);
        if (!queue) {
            return interaction.reply({
                content: '❌ No music is in the queue!',
                ephemeral: true
            });
        }

        // Check if not paused
        if (!queue.node.isPaused()) {
            return interaction.reply({
                content: '❌ The music is not paused!',
                ephemeral: true
            });
        }

        // Resume the queue
        queue.node.resume();
        
        return interaction.reply('▶️ Resumed the music!');
    } catch (error) {
        console.error('Error in resumeSong function:', error);
        return interaction.reply({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
        });
    }
}

module.exports = {
    initializePlayer,
    playSong,
    skipSong,
    stopMusic,
    showQueue,
    joinVoiceChannel,
    leaveVoiceChannel,
    pauseSong,
    resumeSong
};