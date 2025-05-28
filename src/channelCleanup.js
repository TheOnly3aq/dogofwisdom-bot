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

  // Discord doesn't provide a createdBy property, so we rely on name patterns

  // Check if the channel has a name pattern that matches our bot's created channels
  const botCreatedPatterns = [
    // Channel patterns - EXACT matches only
    /^wisdom-\d+$/, // wisdom-123
    /^daily-wisdom$/, // From createChannelInCategory
    /^wisdom-chat$/, // From createChannelInCategory
    /^dog-speaks$/, // From createChannelInCategory
    /^listen-here$/, // From createChannelInCategory
    /^important-barks$/, // From createChannelInCategory
    /^wisdom-drops$/, // From createChannelInCategory
    /^pay-attention$/, // From createChannelInCategory
    /^bark-of-the-day$/, // From createChannelInCategory
    /^heed-this-woof$/, // From createChannelInCategory
    /^wisdom-nuggets$/, // From createChannelInCategory
    /^daily-wisdom-\d+$/, // daily-wisdom-123
    /^bot-wisdom-\d+$/, // bot-wisdom-123
    /^wisdom-bot-\d+$/, // wisdom-bot-123
    /^dog-wisdom-\d+$/, // dog-wisdom-123
    /^dog-of-wisdom-\d+$/, // dog-of-wisdom-123
    /^wisdom-dog-\d+$/, // wisdom-dog-123
    /^wisdom-message-\d+$/, // wisdom-message-123

    // Category patterns - EXACT matches only
    /^Wisdom of the Day #\d+$/, // From createRandomCategory
    /^Dog Wisdom Central #\d+$/, // From createRandomCategory
    /^Today's Enlightenment #\d+$/, // From createRandomCategory
    /^Bark of Wisdom #\d+$/, // From createRandomCategory
    /^Canine Knowledge #\d+$/, // From createRandomCategory
    /^Doggo Insights #\d+$/, // From createRandomCategory
    /^Puppy Prophecies #\d+$/, // From createRandomCategory
    /^Woof Wisdom #\d+$/, // From createRandomCategory
    /^Bork Thoughts #\d+$/, // From createRandomCategory
    /^Howling Truths #\d+$/, // From createRandomCategory
    /^Paw-sitive Thinking #\d+$/, // From createRandomCategory
    /^Tail-wagging Wisdom #\d+$/, // From createRandomCategory
    /^Furry Philosophy #\d+$/, // From createRandomCategory
    /^Snout Insights #\d+$/, // From createRandomCategory
    /^Barking Brilliance #\d+$/, // From createRandomCategory
    /^Fetch Your Wisdom #\d+$/, // From createRandomCategory
    /^Treat for Thought #\d+$/, // From createRandomCategory
    /^Leash on Life #\d+$/, // From createRandomCategory
    /^Collar of Knowledge #\d+$/, // From createRandomCategory
    /^Kibble Contemplations #\d+$/, // From createRandomCategory
  ];

  // Log channel details for debugging
  console.log(
    `Checking channel: ${channel.name} (${channel.id}), created at: ${new Date(
      channel.createdTimestamp
    ).toISOString()}`
  );

  // Check if the channel name matches any of our patterns
  const matchesPattern = botCreatedPatterns.some((pattern) =>
    pattern.test(channel.name)
  );
  if (matchesPattern) {
    console.log(`Channel ${channel.name} matches bot pattern`);
    return true;
  }

  // Check if the channel was created very recently (within the last hour)
  // AND has a specific bot-created name pattern
  const now = Date.now();
  const channelAge = now - channel.createdTimestamp;
  const isVeryRecent = channelAge < 60 * 60 * 1000; // Less than 1 hour old

  // Only consider very recent channels if they have a specific bot pattern
  if (isVeryRecent && channel.name.startsWith("wisdom-")) {
    console.log(
      `Channel ${channel.name} is very recent (less than 1 hour old) and has a wisdom- prefix`
    );
    return true;
  }

  // If we get here, the channel is not considered to be created by the bot
  console.log(
    `Channel ${channel.name} is NOT considered to be created by the bot`
  );
  return false;
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
  
  const isOlder = channelAge > daysInMs;

  // Log for debugging
  console.log(
    `Channel ${channel.name} age: ${Math.round(
      channelAge / (24 * 60 * 60 * 1000)
    )} days, threshold: ${days} days, isOlder: ${isOlder}`
  );

  return isOlder;
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
  
  const isNewer = channelAge < daysInMs;

  // Log for debugging
  console.log(
    `Channel ${channel.name} age: ${Math.round(
      channelAge / (24 * 60 * 60 * 1000)
    )} days, threshold: ${days} days, isNewer: ${isNewer}`
  );

  return isNewer;
}

/**
 * Cleans up channels and categories created by the bot
 * @param {Client} client - The Discord client
 * @param {number} days - Delete channels older than this many days or newer than this many days
 * @param {boolean} deleteOlder - If true, delete channels older than days, if false, delete channels newer than days
 * @param {Object} options - Additional options for cleanup
 * @param {string} options.channelType - Type of channels to delete: 'text', 'voice', 'all' (default: 'all')
 * @param {boolean} options.botCreatedOnly - Only delete channels created by the bot (default: true)
 * @param {boolean} options.deleteCategories - Whether to delete categories (default: true)
 * @returns {Promise<Object>} - Statistics about the cleanup
 */
async function cleanupChannels(
  client,
  days = 7,
  deleteOlder = true,
  options = {}
) {
  // Set default options
  const channelType = options.channelType || "all";
  const botCreatedOnly = options.botCreatedOnly !== false; // Default to true if not specified
  const deleteCategories = options.deleteCategories !== false; // Default to true if not specified

  console.log(
    `Starting cleanup of ${channelType} channels ${
      deleteOlder ? "older" : "newer"
    } than ${days} days... (bot created only: ${botCreatedOnly}, delete categories: ${deleteCategories})`
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

        // First, find and delete text/voice channels based on the channelType option
        // Discord.js channel types:
        // 0: GUILD_TEXT, 2: GUILD_VOICE, 4: GUILD_CATEGORY, 5: GUILD_ANNOUNCEMENT,
        // 13: GUILD_STAGE_VOICE, 15: GUILD_FORUM

        // Filter channels based on the channelType option
        let nonCategoryChannels = channels.filter((c) => c.type !== 4); // Not categories

        if (channelType === "text") {
          // Text channels (includes announcements and forums)
          nonCategoryChannels = nonCategoryChannels.filter((c) =>
            [0, 5, 15].includes(c.type)
          );
          console.log(`Filtering to text channels only`);
        } else if (channelType === "voice") {
          // Voice channels (includes stage channels)
          nonCategoryChannels = nonCategoryChannels.filter((c) =>
            [2, 13].includes(c.type)
          );
          console.log(`Filtering to voice channels only`);
        }

        for (const [channelId, channel] of nonCategoryChannels.entries()) {
          try {
            // Check if the channel meets the age criteria
            const meetsAgeCriteria = deleteOlder
              ? isOlderThan(channel, days)
              : isNewerThan(channel, days);

            // Check if the channel was created by the bot (if botCreatedOnly is true)
            const isBotChannel =
              !botCreatedOnly || isCreatedByBot(channel, client);

            if (isBotChannel && meetsAgeCriteria) {
              console.log(
                `Deleting ${deleteOlder ? "old" : "new"} ${getChannelTypeName(
                  channel.type
                )} channel #${channel.name} (${channelId}) in ${guild.name}`
              );
              await channel.delete(
                `Automatic cleanup of ${deleteOlder ? "old" : "new"} ${
                  botCreatedOnly ? "bot-created" : ""
                } channels`
              );
              stats.channelsDeleted++;
            } else {
              stats.skipped++;
              if (!meetsAgeCriteria) {
                console.log(
                  `Skipped channel ${channel.name} - doesn't meet age criteria`
                );
              }
              if (botCreatedOnly && !isBotChannel) {
                console.log(
                  `Skipped channel ${channel.name} - not created by bot`
                );
              }
            }
          } catch (error) {
            console.error(
              `Error deleting channel ${channel.name}: ${error.message}`
            );
            stats.errors++;
          }
        }

        // Only process categories if we're not filtering by channel type or if we're cleaning up everything
        // and if deleteCategories option is enabled
        if (channelType === "all" && deleteCategories) {
          console.log(
            `Processing categories for deletion (enabled: ${deleteCategories})`
          );

          // Then, find and delete empty categories
          for (const [categoryId, category] of channels
            .filter((c) => c.type === 4)
            .entries()) {
            // 4 is GUILD_CATEGORY
            try {
              // Check if the category meets the age criteria
              const meetsAgeCriteria = deleteOlder
                ? isOlderThan(category, days)
                : isNewerThan(category, days);

              // Check if the category was created by the bot (if botCreatedOnly is true)
              const isBotCategory =
                !botCreatedOnly || isCreatedByBot(category, client);

              if (
                isBotCategory &&
                meetsAgeCriteria &&
                category.children.cache.size === 0
              ) {
                console.log(
                  `Deleting empty ${deleteOlder ? "old" : "new"} category "${
                    category.name
                  }" (${categoryId}) in ${guild.name}`
                );
                await category.delete(
                  `Automatic cleanup of ${deleteOlder ? "old" : "new"} ${
                    botCreatedOnly ? "bot-created" : ""
                  } categories`
                );
                stats.categoriesDeleted++;
              } else {
                stats.skipped++;
                if (!meetsAgeCriteria) {
                  console.log(
                    `Skipped category ${category.name} - doesn't meet age criteria`
                  );
                }
                if (botCreatedOnly && !isBotCategory) {
                  console.log(
                    `Skipped category ${category.name} - not created by bot`
                  );
                }
                if (category.children.cache.size > 0) {
                  console.log(
                    `Skipped category ${category.name} - not empty (${category.children.cache.size} children)`
                  );
                }
              }
            } catch (error) {
              console.error(
                `Error deleting category ${category.name}: ${error.message}`
              );
              stats.errors++;
            }
          }
        } else if (channelType === "all" && !deleteCategories) {
          console.log(`Skipping category deletion (disabled by option)`);
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
 * Helper function to get a human-readable channel type name
 * @param {number} type - The Discord channel type
 * @returns {string} - A human-readable channel type name
 */
function getChannelTypeName(type) {
  switch (type) {
    case 0: return 'text';
    case 2: return 'voice';
    case 4: return 'category';
    case 5: return 'announcement';
    case 13: return 'stage';
    case 15: return 'forum';
    default: return 'unknown';
  }
}

/**
 * Cleans up old channels and categories created by the bot (backward compatibility)
 * @param {Client} client - The Discord client
 * @param {number} olderThanDays - Delete channels older than this many days
 * @param {Object} options - Additional options for cleanup
 * @param {string} options.channelType - Type of channels to delete: 'text', 'voice', 'all' (default: 'all')
 * @param {boolean} options.botCreatedOnly - Only delete channels created by the bot (default: true)
 * @param {boolean} options.deleteCategories - Whether to delete categories (default: true)
 * @returns {Promise<Object>} - Statistics about the cleanup
 */
async function cleanupOldChannels(client, olderThanDays = 7, options = {}) {
  return cleanupChannels(client, olderThanDays, true, options);
}

/**
 * Cleans up new channels and categories created by the bot
 * @param {Client} client - The Discord client
 * @param {number} newerThanDays - Delete channels newer than this many days
 * @param {Object} options - Additional options for cleanup
 * @param {string} options.channelType - Type of channels to delete: 'text', 'voice', 'all' (default: 'all')
 * @param {boolean} options.botCreatedOnly - Only delete channels created by the bot (default: true)
 * @param {boolean} options.deleteCategories - Whether to delete categories (default: true)
 * @returns {Promise<Object>} - Statistics about the cleanup
 */
async function cleanupNewChannels(client, newerThanDays = 7, options = {}) {
  return cleanupChannels(client, newerThanDays, false, options);
}

module.exports = {
  cleanupOldChannels,
  cleanupNewChannels,
  cleanupChannels,
  isCreatedByBot,
  isOlderThan,
  isNewerThan,
};