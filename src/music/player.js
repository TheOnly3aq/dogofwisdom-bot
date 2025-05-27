const { Player } = require('discord-player');
const { Client } = require('discord.js');
const playdl = require('play-dl');

/**
 * Initialize the music player for the bot
 * @param {Client} client - Discord.js client instance
 * @returns {Player} - Configured player instance
 */
function initializePlayer(client) {
    // Create a new Player instance
    const player = new Player(client, {
        ytdlOptions: {
            quality: 'highestaudio',
            highWaterMark: 1 << 25
        }
    });

    // Set up play-dl as the stream provider
    player.extractors.loadDefault();

    // Register player events
    player.events.on('playerStart', (queue, track) => {
        // Send a message when a track starts playing
        queue.metadata.channel.send(`🎵 Now playing: **${track.title}** by **${track.author}**`);
    });

    player.events.on('audioTrackAdd', (queue, track) => {
        // Send a message when a track is added to the queue
        queue.metadata.channel.send(`🎵 Added **${track.title}** by **${track.author}** to the queue`);
    });

    player.events.on('audioTracksAdd', (queue, tracks) => {
        // Send a message when multiple tracks are added to the queue
        queue.metadata.channel.send(`🎵 Added ${tracks.length} tracks to the queue`);
    });

    player.events.on('disconnect', (queue) => {
        // Send a message when the bot disconnects from the voice channel
        queue.metadata.channel.send('❌ I was manually disconnected from the voice channel');
    });

    player.events.on('emptyChannel', (queue) => {
        // Send a message when the voice channel becomes empty
        queue.metadata.channel.send('❌ Nobody is in the voice channel, leaving...');
    });

    player.events.on('emptyQueue', (queue) => {
        // Send a message when the queue becomes empty
        queue.metadata.channel.send('✅ Queue finished!');
    });

    player.events.on('error', (queue, error) => {
        // Log errors
        console.error(`[Player Error] ${error.message}`);
        queue.metadata.channel.send(`❌ Error: ${error.message}`);
    });

    return player;
}

module.exports = { initializePlayer };