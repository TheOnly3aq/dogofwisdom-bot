const { Player } = require('discord-player');
const { GuildQueue } = require('discord-player');
const { QueryType } = require('discord-player');

/**
 * Initialize the Discord Player
 * @param {Client} client - The Discord.js client
 * @returns {Player} - The initialized player
 */
async function initializePlayer(client) {
    // Create a new Player instance
    const player = new Player(client);
    
    // Add event listeners
    setupPlayerEvents(player);
    
    // Initialize the player
    await player.extractors.loadDefault();
    
    return player;
}

/**
 * Set up event listeners for the player
 * @param {Player} player - The Discord Player instance
 */
function setupPlayerEvents(player) {
    // Track start event
    player.events.on('playerStart', (queue, track) => {
        queue.metadata.send(`🎵 Now playing: **${track.title}** by **${track.author}**`);
    });

    // Track add event
    player.events.on('audioTrackAdd', (queue, track) => {
        queue.metadata.send(`🎵 Added to queue: **${track.title}** by **${track.author}**`);
    });

    // Playlist add event
    player.events.on('audioTracksAdd', (queue, tracks) => {
        queue.metadata.send(`🎵 Added ${tracks.length} tracks to the queue`);
    });

    // Error events
    player.events.on('error', (queue, error) => {
        console.error(`[Player Error] ${error.message}`);
        queue.metadata.send(`❌ Error: ${error.message}`);
    });

    player.events.on('playerError', (queue, error) => {
        console.error(`[Player Error] ${error.message}`);
        queue.metadata.send(`❌ Player Error: ${error.message}`);
    });

    player.events.on('connectionError', (queue, error) => {
        console.error(`[Connection Error] ${error.message}`);
        queue.metadata.send(`❌ Connection Error: ${error.message}`);
    });

    // Queue end event
    player.events.on('emptyQueue', (queue) => {
        queue.metadata.send('✅ Queue finished! Use `/play` to add more songs.');
    });

    // Bot disconnect event
    player.events.on('disconnect', (queue) => {
        queue.metadata.send('❌ I was manually disconnected from the voice channel, clearing queue!');
    });

    // Channel empty event
    player.events.on('emptyChannel', (queue) => {
        queue.metadata.send('❌ Nobody is in the voice channel, leaving...');
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
                content: '❌ You need to be in a voice channel to play music!',
                ephemeral: true
            });
        }

        // Check if the bot has permission to join and speak
        const permissions = member.voice.channel.permissionsFor(interaction.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return interaction.followUp({
                content: '❌ I need permissions to join and speak in your voice channel!',
                ephemeral: true
            });
        }

        // Get the player instance from global
        const player = global.player;
        if (!player) {
            return interaction.followUp({
                content: '❌ Music player is not initialized!',
                ephemeral: true
            });
        }

        // Create a queue for this guild
        const queue = player.nodes.create(interaction.guild, {
            metadata: interaction.channel, // We can access this metadata object from the queue
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 5000, // 5 seconds
            leaveOnEnd: true,
            leaveOnEndCooldown: 300000, // 5 minutes
            volume: 80
        });

        try {
            // Connect to the voice channel
            if (!queue.connection) {
                await queue.connect(member.voice.channel);
            }
        } catch (error) {
            // Destroy the queue if we failed to connect
            queue.delete();
            return interaction.followUp({
                content: `❌ Could not join your voice channel: ${error.message}`,
                ephemeral: true
            });
        }

        // Search for the song
        const searchResult = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.AUTO
        });

        // If no tracks were found
        if (!searchResult || !searchResult.tracks.length) {
            return interaction.followUp({
                content: '❌ No results found!',
                ephemeral: true
            });
        }

        // Add the track(s) to the queue
        try {
            if (searchResult.playlist) {
                // Add the playlist to the queue
                queue.addTrack(searchResult.tracks);
                await interaction.followUp(`✅ Added playlist **${searchResult.playlist.title}** with ${searchResult.tracks.length} songs to the queue!`);
            } else {
                // Add the track to the queue
                queue.addTrack(searchResult.tracks[0]);
                await interaction.followUp(`✅ Added **${searchResult.tracks[0].title}** to the queue!`);
            }

            // Play the queue if it's not already playing
            if (!queue.isPlaying()) {
                await queue.node.play();
            }
        } catch (error) {
            console.error('Error adding track to queue:', error);
            return interaction.followUp({
                content: `❌ Error adding track to queue: ${error.message}`,
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Error in playSong function:', error);
        return interaction.followUp({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
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
                content: '❌ You need to be in a voice channel to skip songs!',
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

        // Skip the current song
        const currentTrack = queue.currentTrack;
        queue.node.skip();
        
        return interaction.reply(`✅ Skipped **${currentTrack.title}**!`);
    } catch (error) {
        console.error('Error in skipSong function:', error);
        return interaction.reply({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
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
                content: '❌ You need to be in a voice channel to stop the music!',
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
                content: '❌ No music is currently playing!',
                ephemeral: true
            });
        }

        // Clear the queue and stop the music
        queue.delete();
        
        return interaction.reply('🛑 Stopped the music and cleared the queue!');
    } catch (error) {
        console.error('Error in stopMusic function:', error);
        return interaction.reply({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
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

        // Get the current track and upcoming tracks
        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();

        // Create an embed for the queue
        const queueEmbed = {
            title: '🎵 Music Queue',
            description: `**Now Playing:**\n${currentTrack.title} by ${currentTrack.author}\n\n`,
            color: 0x3498db,
            fields: [],
            footer: {
                text: `Requested by ${interaction.user.tag}`
            }
        };

        // Add upcoming tracks to the embed
        if (tracks.length > 0) {
            const trackList = tracks.slice(0, 10).map((track, index) => 
                `${index + 1}. ${track.title} by ${track.author}`
            ).join('\n');
            
            queueEmbed.description += `**Upcoming Tracks:**\n${trackList}`;
            
            // If there are more tracks than we're showing
            if (tracks.length > 10) {
                queueEmbed.description += `\n\n...and ${tracks.length - 10} more track(s)`;
            }
        } else {
            queueEmbed.description += '**Upcoming Tracks:**\nNo tracks in queue';
        }

        return interaction.reply({ embeds: [queueEmbed] });
    } catch (error) {
        console.error('Error in showQueue function:', error);
        return interaction.reply({
            content: `❌ An error occurred: ${error.message}`,
            ephemeral: true
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