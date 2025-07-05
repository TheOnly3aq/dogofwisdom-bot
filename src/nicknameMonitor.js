/**
 * Nickname monitoring system for automatically reverting specific user's nickname changes
 */

const { dutchSnacks } = require('./nicknameManager');

/**
 * Get a random Dutch snack name
 * @returns {string} Random Dutch snack name
 */
function getRandomDutchSnack() {
  return dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
}

/**
 * Handle nickname change monitoring for a specific user
 * @param {GuildMember} oldMember - The member before the update
 * @param {GuildMember} newMember - The member after the update
 * @param {Object} config - Configuration object
 * @param {Function} logMessage - Logging function
 */
async function handleNicknameMonitoring(oldMember, newMember, config, logMessage) {
  try {
    // Check if monitoring is enabled and user ID is configured
    if (!config.monitoredUserId) {
      return; // No user configured for monitoring
    }

    // Check if this is the monitored user
    if (newMember.id !== config.monitoredUserId) {
      return; // Not the monitored user
    }

    // Check if the nickname actually changed
    const oldNickname = oldMember.nickname;
    const newNickname = newMember.nickname;
    
    if (oldNickname === newNickname) {
      return; // No nickname change
    }

    // Check if the guild is blacklisted
    if (config.blacklistedGuilds && config.blacklistedGuilds.includes(newMember.guild.id)) {
      console.log(`Guild "${newMember.guild.name}" (${newMember.guild.id}) is blacklisted. Skipping nickname monitoring.`);
      return;
    }

    // Check if the bot has permission to manage nicknames
    const botMember = newMember.guild.members.me;
    if (!botMember.permissions.has("ManageNicknames")) {
      console.log(`Bot doesn't have 'Manage Nicknames' permission in guild "${newMember.guild.name}". Cannot monitor nicknames.`);
      return;
    }

    // Check if the bot can change this user's nickname (role hierarchy)
    if (newMember.roles.highest.position >= botMember.roles.highest.position) {
      console.log(`Cannot change nickname for monitored user ${newMember.user.tag} due to role hierarchy.`);
      
      // Log this attempt
      if (logMessage) {
        logMessage(
          `Monitored user ${newMember.user.tag} changed nickname from "${oldNickname || newMember.user.username}" to "${newNickname || newMember.user.username}" but bot cannot revert due to role hierarchy`,
          "nickname-monitor",
          {
            User: `${newMember.user.tag} (${newMember.id})`,
            Guild: `${newMember.guild.name} (${newMember.guild.id})`,
            "Old Nickname": oldNickname || newMember.user.username,
            "New Nickname": newNickname || newMember.user.username,
            Status: "Failed - Role hierarchy"
          }
        );
      }
      return;
    }

    // Get a random Dutch snack name
    const randomSnack = getRandomDutchSnack();

    console.log(`Monitored user ${newMember.user.tag} changed nickname from "${oldNickname || newMember.user.username}" to "${newNickname || newMember.user.username}". Changing to "${randomSnack}"`);

    // Change the nickname to a random Dutch snack
    await newMember.setNickname(randomSnack, "Automatic nickname monitoring - reverting to Dutch snack");

    // Log the successful change
    if (logMessage) {
      logMessage(
        `Successfully reverted monitored user ${newMember.user.tag}'s nickname to "${randomSnack}"`,
        "nickname-monitor",
        {
          User: `${newMember.user.tag} (${newMember.id})`,
          Guild: `${newMember.guild.name} (${newMember.guild.id})`,
          "Old Nickname": oldNickname || newMember.user.username,
          "Attempted Nickname": newNickname || newMember.user.username,
          "Reverted To": randomSnack,
          Status: "Success"
        }
      );
    }

    console.log(`Successfully changed monitored user's nickname to "${randomSnack}"`);

  } catch (error) {
    console.error(`Error in nickname monitoring for user ${newMember.user.tag}:`, error);
    
    // Log the error
    if (logMessage) {
      logMessage(
        `Error monitoring nickname change for ${newMember.user.tag}: ${error.message}`,
        "nickname-monitor-error",
        {
          User: `${newMember.user.tag} (${newMember.id})`,
          Guild: `${newMember.guild.name} (${newMember.guild.id})`,
          Error: error.message,
          Status: "Error"
        }
      );
    }
  }
}

module.exports = {
  handleNicknameMonitoring,
  getRandomDutchSnack
};