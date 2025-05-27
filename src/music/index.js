const { initializePlayer } = require('./player');
const {
    musicCommands,
    playCommand,
    skipCommand,
    queueCommand,
    pauseCommand,
    stopCommand,
    nowPlayingCommand,
    volumeCommand,
    loopCommand
} = require('./commands');

/**
 * Initialize the music module
 * @param {Client} client - Discord.js client instance
 * @returns {Object} - Music module with player and commands
 */
function initializeMusicModule(client) {
    // Initialize the player
    const player = initializePlayer(client);
    
    // Log that the music module has been initialized
    console.log('Music module initialized successfully');
    
    return {
        player,
        commands: musicCommands,
        handleCommand: async (interaction) => {
            const commandName = interaction.commandName;
            
            switch (commandName) {
                case 'play':
                    await playCommand(interaction, player);
                    break;
                case 'skip':
                    await skipCommand(interaction, player);
                    break;
                case 'queue':
                    await queueCommand(interaction, player);
                    break;
                case 'pause':
                    await pauseCommand(interaction, player);
                    break;
                case 'stop':
                    await stopCommand(interaction, player);
                    break;
                case 'nowplaying':
                    await nowPlayingCommand(interaction, player);
                    break;
                case 'volume':
                    await volumeCommand(interaction, player);
                    break;
                case 'loop':
                    await loopCommand(interaction, player);
                    break;
            }
        }
    };
}

module.exports = { initializeMusicModule };