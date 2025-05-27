/**
 * Utility functions for music commands
 */

/**
 * Check if the user is in a voice channel
 * @param {Object} interaction - Discord interaction object
 * @returns {boolean} - True if the user is in a voice channel
 */
function isUserInVoiceChannel(interaction) {
    if (!interaction.member.voice.channel) {
        interaction.reply({
            content: '❌ You need to be in a voice channel to use this command!',
            ephemeral: true
        });
        return false;
    }
    return true;
}

/**
 * Check if the bot has permission to join and speak in the voice channel
 * @param {Object} interaction - Discord interaction object
 * @returns {boolean} - True if the bot has permission
 */
function hasVoicePermission(interaction) {
    const permissions = interaction.member.voice.channel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        interaction.reply({
            content: '❌ I need permissions to join and speak in your voice channel!',
            ephemeral: true
        });
        return false;
    }
    return true;
}

/**
 * Format duration in milliseconds to mm:ss format
 * @param {number} duration - Duration in milliseconds
 * @returns {string} - Formatted duration
 */
function formatDuration(duration) {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Create a progress bar for the current track
 * @param {number} current - Current position in milliseconds
 * @param {number} total - Total duration in milliseconds
 * @param {number} size - Size of the progress bar
 * @returns {string} - Progress bar string
 */
function createProgressBar(current, total, size = 15) {
    const percentage = current / total;
    const progress = Math.round(size * percentage);
    const emptyProgress = size - progress;

    const progressText = '▇'.repeat(progress);
    const emptyProgressText = '—'.repeat(emptyProgress);
    
    return `${progressText}${emptyProgressText}`;
}

module.exports = {
    isUserInVoiceChannel,
    hasVoicePermission,
    formatDuration,
    createProgressBar
};