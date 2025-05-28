/**
 * Utility functions for cleaning up channels created by the bot
 */

/**
 * Checks if a channel or category was created by the bot
 * @param {Channel|CategoryChannel} channel - The channel or category to check
 * @returns {boolean} - True if the channel was created by the bot
 */
function isCreatedByBot(channel, client) {
  // Check if the channel was created by the bot
  // This is a heuristic - we assume channels created by the bot have certain patterns
  
  // Check if the channel was created by the bot's user ID
  if (channel.createdBy && channel.createdBy.id === client.user.id) {
    return true;
  }
  
  // Check if the channel has a name pattern that matches our bot's created channels
  const botCreatedPatterns = [
    /^wisdom-\d+$/, // wisdom-123
    /^daily-wisdom-\d+$/, // daily-wisdom-123
    /^bot-wisdom-\d+$/, // bot-wisdom-123
    /^random-\d+$/, // random-123
    /^daily-\d+$/, // daily-123
    /^temp-\d+$/, // temp-123
  ];
  
  return botCreatedPatterns.some(pattern => pattern.test(channel.name));
}

/**
 * Checks if a channel or category is older than the specified number of days
 * @param {Channel|CategoryChannel} channel - The channel or category to check
 * @param {number} days - The number of days
 * @returns {boolean} - True if the channel is older than the specified days
 */
function isOlderThan(channel, days) {
  const now = Date.now();
  const channelAge = now - channel.createdTimestamp;
  const daysInMs = days * 24 * 60 * 60 * 1000;
  
  return channelAge > daysInMs;
}

/**
 * Checks if a channel or category is newer than the specified number of days
 * @param {Channel|CategoryChannel} channel - The channel or category to check
 * @param {number} days - The number of days
 * @returns {boolean} - True if the channel is newer than the specified days
 */
function isNewerThan(channel, days) {
  const now = Date.now();
  const channelAge = now - channel.createdTimestamp;
  const daysInMs = days * 24 * 60 * 60 * 1000;
  
  return channelAge < daysInMs;
}

/**
 * Cleans up channels and categories created by the bot
 * @param {Client} client - The Discord client
 * @param {number} days - Delete channels older than this many days or newer than this many days
 * @param {boolean} deleteOlder - If true, delete channels older than days, if false, delete channels newer than days
 * @returns {Promise<Object>} - Statistics about the cleanup
 */
async function cleanupChannels(client, days = 7, deleteOlder = true) {
  console.log(
    `Starting cleanup of channels ${
      deleteOlder ? "older" : "newer"
    } than ${days} days...`
  );

  const stats = {
    channelsDeleted: 0,
    categoriesDeleted: 0,
    errors: 0,
    skipped: 0,
  };

  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;

    // For each guild, find and delete channels
    for (const guild of guilds.values()) {
      try {
        console.log(
          `Checking for ${deleteOlder ? "old" : "new"} channels in guild: ${
            guild.name
          }`
        );

        // Get all channels in the guild
        const channels = await guild.channels.fetch();

        // First, find and delete text/voice channels
        for (const [channelId, channel] of channels
          .filter((c) => c.type !== 4)
          .entries()) {
          // 4 is GUILD_CATEGORY
          try {
            // Check if the channel was created by the bot and meets the age criteria
            const meetsAgeCriteria = deleteOlder
              ? isOlderThan(channel, days)
              : isNewerThan(channel, days);

            if (isCreatedByBot(channel, client) && meetsAgeCriteria) {
              console.log(
                `Deleting ${deleteOlder ? "old" : "new"} channel #${
                  channel.name
                } (${channelId}) in ${guild.name}`
              );
              await channel.delete(
                `Automatic cleanup of ${
                  deleteOlder ? "old" : "new"
                } bot-created channels`
              );
              stats.channelsDeleted++;
            } else {
              stats.skipped++;
            }
          } catch (error) {
            console.error(
              `Error deleting channel ${channel.name}: ${error.message}`
            );
            stats.errors++;
          }
        }

        // Then, find and delete empty categories
        for (const [categoryId, category] of channels
          .filter((c) => c.type === 4)
          .entries()) {
          // 4 is GUILD_CATEGORY
          try {
            // Check if the category was created by the bot, meets the age criteria, and is empty
            const meetsAgeCriteria = deleteOlder
              ? isOlderThan(category, days)
              : isNewerThan(category, days);

            if (
              isCreatedByBot(category, client) &&
              meetsAgeCriteria &&
              category.children.cache.size === 0
            ) {
              console.log(
                `Deleting empty ${deleteOlder ? "old" : "new"} category "${
                  category.name
                }" (${categoryId}) in ${guild.name}`
              );
              await category.delete(
                `Automatic cleanup of ${
                  deleteOlder ? "old" : "new"
                } bot-created categories`
              );
              stats.categoriesDeleted++;
            } else {
              stats.skipped++;
            }
          } catch (error) {
            console.error(
              `Error deleting category ${category.name}: ${error.message}`
            );
            stats.errors++;
          }
        }
      } catch (error) {
        console.error(
          `Error cleaning up channels in guild ${guild.name}: ${error.message}`
        );
        stats.errors++;
      }
    }
  } catch (error) {
    console.error(`Error in cleanupChannels: ${error.message}`);
    stats.errors++;
  }

  console.log(
    `Channel cleanup complete. Deleted ${stats.channelsDeleted} channels and ${stats.categoriesDeleted} categories. Errors: ${stats.errors}`
  );
  return stats;
}

/**
 * Cleans up old channels and categories created by the bot (backward compatibility)
 * @param {Client} client - The Discord client
 * @param {number} olderThanDays - Delete channels older than this many days
 * @returns {Promise<Object>} - Statistics about the cleanup
 */
async function cleanupOldChannels(client, olderThanDays = 7) {
  return cleanupChannels(client, olderThanDays, true);
}

/**
 * Cleans up new channels and categories created by the bot
 * @param {Client} client - The Discord client
 * @param {number} newerThanDays - Delete channels newer than this many days
 * @returns {Promise<Object>} - Statistics about the cleanup
 */
async function cleanupNewChannels(client, newerThanDays = 7) {
  return cleanupChannels(client, newerThanDays, false);
}

module.exports = {
  cleanupOldChannels,
  cleanupNewChannels,
  cleanupChannels,
  isCreatedByBot,
  isOlderThan,
  isNewerThan,
};