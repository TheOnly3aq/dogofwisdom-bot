/**
 * Nickname monitoring system for automatically reverting specific user's nickname changes
 */

const { combinedDutchSnackSwears } = require("./nicknameManager");

// Cooldown tracking to prevent infinite loops
// Key: userId, Value: timestamp of last bot-initiated nickname change
const nicknameCooldowns = new Map();

// Cooldown duration in milliseconds (5 seconds)
const COOLDOWN_DURATION = 5000;

/**
 * Get a random Dutch snack name
 * @returns {string} Random Dutch snack name
 */
function getRandomDutchSnack() {
  return combinedDutchSnackSwears[
    Math.floor(Math.random() * combinedDutchSnackSwears.length)
  ];
}

/**
 * Check if a user is currently in cooldown period
 * @param {string} userId - The user ID to check
 * @returns {boolean} True if user is in cooldown, false otherwise
 */
function isUserInCooldown(userId) {
  const lastChange = nicknameCooldowns.get(userId);
  if (!lastChange) return false;
  
  const now = Date.now();
  const timeSinceLastChange = now - lastChange;
  
  return timeSinceLastChange < COOLDOWN_DURATION;
}

/**
 * Set cooldown for a user after bot changes their nickname
 * @param {string} userId - The user ID to set cooldown for
 */
function setCooldownForUser(userId) {
  nicknameCooldowns.set(userId, Date.now());
  
  // Clean up old cooldowns to prevent memory leaks
  setTimeout(() => {
    nicknameCooldowns.delete(userId);
  }, COOLDOWN_DURATION + 1000); // Add 1 second buffer
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

    // Check if user is in cooldown period (to prevent infinite loops)
    if (isUserInCooldown(newMember.id)) {
      console.log(
        `User ${newMember.user.tag} is in cooldown period. Ignoring nickname change.`
      );
      return;
    }

    // Check if the guild is blacklisted
    if (
      config.blacklistedGuilds &&
      config.blacklistedGuilds.includes(newMember.guild.id)
    ) {
      console.log(
        `Guild "${newMember.guild.name}" (${newMember.guild.id}) is blacklisted. Skipping nickname monitoring.`
      );
      return;
    }

    // Check if the bot has permission to manage nicknames
    const botMember = newMember.guild.members.me;
    if (!botMember.permissions.has("ManageNicknames")) {
      console.log(
        `Bot doesn't have 'Manage Nicknames' permission in guild "${newMember.guild.name}". Cannot monitor nicknames.`
      );
      return;
    }

    // Check if the bot can change this user's nickname (role hierarchy)
    if (newMember.roles.highest.position >= botMember.roles.highest.position) {
      console.log(
        `Cannot change nickname for monitored user ${newMember.user.tag} due to role hierarchy.`
      );

      // Log this attempt
      if (logMessage) {
        logMessage(
          `Monitored user ${newMember.user.tag} changed nickname from "${
            oldNickname || newMember.user.username
          }" to "${
            newNickname || newMember.user.username
          }" but bot cannot revert due to role hierarchy`,
          "nickname-monitor",
          {
            User: `${newMember.user.tag} (${newMember.id})`,
            Guild: `${newMember.guild.name} (${newMember.guild.id})`,
            "Old Nickname": oldNickname || newMember.user.username,
            "New Nickname": newNickname || newMember.user.username,
            Status: "Failed - Role hierarchy",
          }
        );
      }
      return;
    }

    // Get a random Dutch snack name
    const randomSnack = getRandomDutchSnack();

    console.log(
      `Monitored user ${newMember.user.tag} changed nickname from "${
        oldNickname || newMember.user.username
      }" to "${
        newNickname || newMember.user.username
      }". Changing to "${randomSnack}"`
    );

    // Change the nickname to a random Dutch snack
    await newMember.setNickname(
      randomSnack,
      "Automatic nickname monitoring - reverting to Dutch snack"
    );

    // Set cooldown to prevent infinite loop
    setCooldownForUser(newMember.id);

    // Send "Nuh Uh" message to the main channel
    let messageSent = false;
    let messageError = null;

    try {
      // Get the main channel from config
      if (config.mainChannelId) {
        const mainChannel = newMember.guild.channels.cache.get(
          config.mainChannelId
        );

        if (mainChannel && mainChannel.isTextBased()) {
          // Check if bot can send messages in the channel
          const botMember = newMember.guild.members.me;
          if (mainChannel.permissionsFor(botMember).has("SendMessages")) {
            await mainChannel.send("Nuh Uh");
            console.log(
              `Successfully sent "Nuh Uh" message to channel #${mainChannel.name}`
            );
            messageSent = true;
          } else {
            console.log(
              `Bot doesn't have permission to send messages in channel #${mainChannel.name}`
            );
            messageError = "No permission to send messages";
          }
        } else {
          console.log(
            `Main channel not found or not a text channel: ${config.mainChannelId}`
          );
          messageError = "Channel not found or not text-based";
        }
      } else {
        console.log("No main channel configured for 'Nuh Uh' messages");
        messageError = "No main channel configured";
      }
    } catch (error) {
      console.log(
        `Could not send "Nuh Uh" message to main channel: ${error.message}`
      );
      messageError = error.message;
    }

    // Log the successful change
    if (logMessage) {
      logMessage(
        `Successfully reverted monitored user ${
          newMember.user.tag
        }'s nickname to "${randomSnack}"${
          messageSent
            ? ' and sent "Nuh Uh" message to main channel'
            : " but failed to send message"
        }`,
        "nickname-monitor",
        {
          User: `${newMember.user.tag} (${newMember.id})`,
          Guild: `${newMember.guild.name} (${newMember.guild.id})`,
          "Old Nickname": oldNickname || newMember.user.username,
          "Attempted Nickname": newNickname || newMember.user.username,
          "Reverted To": randomSnack,
          "Message Sent": messageSent ? "Yes" : "No",
          "Message Error": messageError || "None",
          Status: "Success",
        }
      );
    }

    console.log(
      `Successfully changed monitored user's nickname to "${randomSnack}"`
    );
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
  getRandomDutchSnack,
  isUserInCooldown,
  setCooldownForUser,
};