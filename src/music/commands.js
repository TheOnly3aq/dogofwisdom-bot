const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QueryType } = require('discord-player');
const { isUserInVoiceChannel, hasVoicePermission, formatDuration, createProgressBar } = require('./utils');

/**
 * Play command - Play a song in the voice channel
 */
async function playCommand(interaction, player) {
    try {
        // Check if user is in a voice channel
        if (!isUserInVoiceChannel(interaction) || !hasVoicePermission(interaction)) return;

        // Defer the reply as searching might take time
        await interaction.deferReply();

        const query = interaction.options.getString('query');
        
        // Search for the song
        const searchResult = await player.search(query, {
            requestedBy: interaction.user,
            searchEngine: QueryType.AUTO
        });

        // If no tracks were found
        if (!searchResult || !searchResult.tracks.length) {
            return interaction.followUp({ content: '❌ No results found!' });
        }

        // Create a queue if there isn't one
        const queue = await player.nodes.create(interaction.guild, {
            metadata: {
                channel: interaction.channel,
                client: interaction.client
            },
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 300000, // 5 minutes
            leaveOnEnd: true,
            leaveOnEndCooldown: 300000, // 5 minutes
            volume: 75
        });

        try {
            // Connect to the voice channel
            if (!queue.connection) {
                await queue.connect(interaction.member.voice.channel);
            }
        } catch (error) {
            // Destroy the queue if connection fails
            player.nodes.delete(interaction.guildId);
            return interaction.followUp({ content: `❌ Could not join your voice channel: ${error.message}` });
        }

        // Add the track(s) to the queue
        if (searchResult.playlist) {
            queue.addTrack(searchResult.tracks);
            await interaction.followUp({ content: `✅ Added **${searchResult.tracks.length}** songs from playlist **${searchResult.playlist.title}** to the queue!` });
        } else {
            queue.addTrack(searchResult.tracks[0]);
            const track = searchResult.tracks[0];
            
            const embed = new EmbedBuilder()
                .setTitle('Added to Queue')
                .setDescription(`[${track.title}](${track.url})`)
                .setThumbnail(track.thumbnail)
                .addFields(
                    { name: 'Duration', value: formatDuration(track.duration), inline: true },
                    { name: 'Requested By', value: track.requestedBy.tag, inline: true }
                )
                .setColor('#00FF00');
            
            await interaction.followUp({ embeds: [embed] });
        }

        // Start playing if not already
        if (!queue.node.isPlaying()) await queue.node.play();
    } catch (error) {
        console.error(`Error in play command: ${error.message}`);
        return interaction.followUp({ content: `❌ Error: ${error.message}` });
    }
}

/**
 * Skip command - Skip the current song
 */
async function skipCommand(interaction, player) {
    try {
        // Check if user is in a voice channel
        if (!isUserInVoiceChannel(interaction)) return;

        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        // Skip the current song
        queue.node.skip();
        interaction.reply('⏭️ Skipped the current track!');
    } catch (error) {
        console.error(`Error in skip command: ${error.message}`);
        return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Queue command - Display the current queue
 */
async function queueCommand(interaction, player) {
    try {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();

        if (!tracks.length) {
            const embed = new EmbedBuilder()
                .setTitle('Queue')
                .setDescription(`Currently playing: [${currentTrack.title}](${currentTrack.url})`)
                .setThumbnail(currentTrack.thumbnail)
                .addFields(
                    { name: 'Duration', value: formatDuration(currentTrack.duration), inline: true },
                    { name: 'Requested By', value: currentTrack.requestedBy.tag, inline: true }
                )
                .setFooter({ text: 'No tracks in the queue' })
                .setColor('#00FF00');
            
            return interaction.reply({ embeds: [embed] });
        }

        const queueString = tracks.slice(0, 10).map((track, i) => {
            return `${i + 1}. [${track.title}](${track.url}) - ${track.requestedBy.tag}`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('Queue')
            .setDescription(`Currently playing: [${currentTrack.title}](${currentTrack.url})\n\n**Upcoming Tracks:**\n${queueString}`)
            .setThumbnail(currentTrack.thumbnail)
            .addFields(
                { name: 'Duration', value: formatDuration(currentTrack.duration), inline: true },
                { name: 'Requested By', value: currentTrack.requestedBy.tag, inline: true },
                { name: 'Total Tracks', value: tracks.length.toString(), inline: true }
            )
            .setColor('#00FF00');
        
        if (tracks.length > 10) {
            embed.setFooter({ text: `And ${tracks.length - 10} more track(s)` });
        }

        interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(`Error in queue command: ${error.message}`);
        return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Pause command - Pause the current song
 */
async function pauseCommand(interaction, player) {
    try {
        // Check if user is in a voice channel
        if (!isUserInVoiceChannel(interaction)) return;

        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        const paused = queue.node.isPaused();
        if (paused) {
            queue.node.resume();
            return interaction.reply('▶️ Resumed the music!');
        } else {
            queue.node.pause();
            return interaction.reply('⏸️ Paused the music!');
        }
    } catch (error) {
        console.error(`Error in pause command: ${error.message}`);
        return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Stop command - Stop playing and clear the queue
 */
async function stopCommand(interaction, player) {
    try {
        // Check if user is in a voice channel
        if (!isUserInVoiceChannel(interaction)) return;

        const queue = player.nodes.get(interaction.guildId);
        if (!queue) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        // Clear the queue and stop playing
        queue.delete();
        interaction.reply('🛑 Stopped the music and cleared the queue!');
    } catch (error) {
        console.error(`Error in stop command: ${error.message}`);
        return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Now Playing command - Show information about the current song
 */
async function nowPlayingCommand(interaction, player) {
    try {
        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        const track = queue.currentTrack;
        const progress = queue.node.getTimestamp();
        
        const progressBar = createProgressBar(progress.current, track.duration);
        
        const embed = new EmbedBuilder()
            .setTitle('Now Playing')
            .setDescription(`[${track.title}](${track.url})`)
            .setThumbnail(track.thumbnail)
            .addFields(
                { name: 'Duration', value: `${formatDuration(progress.current)} / ${formatDuration(track.duration)}`, inline: true },
                { name: 'Requested By', value: track.requestedBy.tag, inline: true },
                { name: 'Progress', value: `${progressBar} ${Math.round((progress.current / track.duration) * 100)}%`, inline: false }
            )
            .setColor('#00FF00');
        
        interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(`Error in nowPlaying command: ${error.message}`);
        return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Volume command - Change the volume of the music
 */
async function volumeCommand(interaction, player) {
    try {
        // Check if user is in a voice channel
        if (!isUserInVoiceChannel(interaction)) return;

        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        const volume = interaction.options.getInteger('percent');
        if (volume < 0 || volume > 100) {
            return interaction.reply({ content: '❌ Volume must be between 0 and 100!', ephemeral: true });
        }

        queue.node.setVolume(volume);
        interaction.reply(`🔊 Volume set to ${volume}%`);
    } catch (error) {
        console.error(`Error in volume command: ${error.message}`);
        return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

/**
 * Loop command - Toggle loop mode
 */
async function loopCommand(interaction, player) {
    try {
        // Check if user is in a voice channel
        if (!isUserInVoiceChannel(interaction)) return;

        const queue = player.nodes.get(interaction.guildId);
        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
        }

        const mode = interaction.options.getString('mode');
        
        switch (mode) {
            case 'off':
                queue.setRepeatMode(0); // RepeatMode.OFF
                return interaction.reply('🔁 Loop mode: Off');
            case 'track':
                queue.setRepeatMode(1); // RepeatMode.TRACK
                return interaction.reply('🔂 Loop mode: Track');
            case 'queue':
                queue.setRepeatMode(2); // RepeatMode.QUEUE
                return interaction.reply('🔁 Loop mode: Queue');
            default:
                return interaction.reply({ content: '❌ Invalid loop mode!', ephemeral: true });
        }
    } catch (error) {
        console.error(`Error in loop command: ${error.message}`);
        return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
    }
}

// Define the slash commands for music functionality
const musicCommands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song')
        .addStringOption(option => 
            option.setName('query')
                .setDescription('The song to play (URL or search term)')
                .setRequired(true)
        )
        .toJSON(),
    
    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song')
        .toJSON(),
    
    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Display the current song queue')
        .toJSON(),
    
    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause or resume the current song')
        .toJSON(),
    
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playing and clear the queue')
        .toJSON(),
    
    new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show information about the current song')
        .toJSON(),
    
    new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Change the volume of the music')
        .addIntegerOption(option => 
            option.setName('percent')
                .setDescription('Volume level (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)
        )
        .toJSON(),
    
    new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle loop mode')
        .addStringOption(option => 
            option.setName('mode')
                .setDescription('Loop mode')
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )
        )
        .toJSON()
];

module.exports = {
    musicCommands,
    playCommand,
    skipCommand,
    queueCommand,
    pauseCommand,
    stopCommand,
    nowPlayingCommand,
    volumeCommand,
    loopCommand
};