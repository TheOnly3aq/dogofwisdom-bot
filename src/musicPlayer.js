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
  demuxProbe,
} = require("@discordjs/voice");

// Store active connections and players for each guild
const connections = new Map();
const players = new Map();
const queues = new Map();
const nowPlaying = new Map();

// Function to join a voice channel
async function joinChannel(interaction) {
  try {
    // Check if user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return { success: false, message: "You need to be in a voice channel first!" };
    }

    // Create a connection to the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    // Create an audio player
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      }
    });

    // Subscribe the connection to the audio player
    connection.subscribe(player);

    // Store the connection and player
    connections.set(interaction.guild.id, connection);
    players.set(interaction.guild.id, player);
    
    // Initialize queue for this guild if it doesn't exist
    if (!queues.has(interaction.guild.id)) {
      queues.set(interaction.guild.id, []);
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
        cleanup(interaction.guild.id);
      }
    });

    // Set up event listeners for the player
    player.on(AudioPlayerStatus.Idle, () => {
      // When the current song ends, play the next one in queue
      playNext(interaction.guild.id);
    });

    player.on('error', error => {
      console.error(`Error: ${error.message} with resource`);
      playNext(interaction.guild.id);
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
async function playYouTube(interaction, url) {
  try {
    // Check if the URL is valid
    if (!play.yt_validate(url)) {
      return { success: false, message: "Please provide a valid YouTube URL!" };
    }

    // Get the guild ID
    const guildId = interaction.guild.id;

    // Check if the bot is in a voice channel
    if (!connections.has(guildId)) {
      const joinResult = await joinChannel(interaction);
      if (!joinResult.success) {
        return joinResult;
      }
    }

    try {
      // Get video info using play-dl
      const videoInfo = await play.video_info(url);
      const videoTitle = videoInfo.video_details.title;

      // Add to queue
      const queue = queues.get(guildId);
      const queueItem = { url, title: videoTitle };
      queue.push(queueItem);

      // If nothing is playing, start playing
      const player = players.get(guildId);
      if (player.state.status === AudioPlayerStatus.Idle) {
        return await playNext(guildId);
      } else {
        return {
          success: true,
          message: `Added to queue: ${videoTitle}`,
          position: queue.length,
        };
      }
    } catch (infoError) {
      console.error("Error getting video info with play-dl:", infoError);

      try {
        // Fallback to ytdl-core for getting info
        const ytdlInfo = await ytdl.getInfo(url);
        const videoTitle = ytdlInfo.videoDetails.title;

        // Add to queue
        const queue = queues.get(guildId);
        const queueItem = { url, title: videoTitle };
        queue.push(queueItem);

        // If nothing is playing, start playing
        const player = players.get(guildId);
        if (player.state.status === AudioPlayerStatus.Idle) {
          return await playNext(guildId);
        } else {
          return {
            success: true,
            message: `Added to queue: ${videoTitle} (using fallback)`,
            position: queue.length,
          };
        }
      } catch (fallbackInfoError) {
        console.error("Fallback info retrieval failed:", fallbackInfoError);

        // Last resort: Use the URL as the title
        const videoId = ytdl.getVideoID(url);
        const simplifiedTitle = `YouTube Video (${videoId})`;

        // Add to queue with simplified title
        const queue = queues.get(guildId);
        const queueItem = { url, title: simplifiedTitle };
        queue.push(queueItem);

        // If nothing is playing, start playing
        const player = players.get(guildId);
        if (player.state.status === AudioPlayerStatus.Idle) {
          return await playNext(guildId);
        } else {
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

    try {
      // Use play-dl to stream the YouTube video
      const stream = await play.stream(nextSong.url, {
        discordPlayerCompatibility: true,
      });

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
        inlineVolume: true,
      });

      if (resource) {
        // Set volume to 100%
        if (resource.volume) {
          resource.volume.setVolume(1);
        }

        // Play the audio
        player.play(resource);

        // Store the currently playing song
        nowPlaying.set(guildId, nextSong);

        return {
          success: true,
          message: `Now playing: ${nextSong.title}`,
          title: nextSong.title,
        };
      } else {
        console.error("Failed to create audio resource");
        return { success: false, message: "Failed to create audio resource" };
      }
    } catch (streamError) {
      console.error("Error creating stream with play-dl:", streamError);

      // Try fallback to ytdl-core
      try {
        console.log("Trying fallback to ytdl-core...");
        const fallbackStream = ytdl(nextSong.url, {
          filter: "audioonly",
          quality: "highestaudio",
          highWaterMark: 1 << 25, // 32MB buffer
        });

        // Handle stream errors
        fallbackStream.on("error", (error) => {
          console.error(`Fallback stream error: ${error.message}`);
          // Try to play the next song if this one fails
          playNext(guildId);
        });

        const resource = createAudioResource(fallbackStream, {
          inlineVolume: true,
        });

        // Play the audio
        player.play(resource);

        // Store the currently playing song
        nowPlaying.set(guildId, nextSong);

        return {
          success: true,
          message: `Now playing: ${nextSong.title} (fallback method)`,
          title: nextSong.title,
        };
      } catch (fallbackError) {
        console.error("Fallback streaming method failed:", fallbackError);

        // Skip to the next song
        setTimeout(() => playNext(guildId), 1000);

        return {
          success: false,
          message: `Couldn't play ${nextSong.title}, skipping to next song...`,
        };
      }
    }
  } catch (error) {
    console.error("Error playing next song:", error);
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