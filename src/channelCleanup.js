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
    // Channel patterns
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
    /^random-\d+$/, // random-123
    /^daily-\d+$/, // daily-123
    /^temp-\d+$/, // temp-123
    /^test-\d+$/, // test-123
    /^bot-test-\d+$/, // bot-test-123
    /^wisdom-bot-\d+$/, // wisdom-bot-123
    /^dog-wisdom-\d+$/, // dog-wisdom-123
    /^dog-of-wisdom-\d+$/, // dog-of-wisdom-123
    /^wisdom-dog-\d+$/, // wisdom-dog-123
    /^bot-channel-\d+$/, // bot-channel-123
    /^channel-\d+$/, // channel-123
    /^wisdom-message-\d+$/, // wisdom-message-123
    /^message-\d+$/, // message-123

    // Category patterns
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
    /^category-\d+$/, // category-123
    /^wisdom-category-\d+$/, // wisdom-category-123
    /^bot-category-\d+$/, // bot-category-123
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
  }

  // Check if the channel was created after the bot was started
  // This is a fallback for test channels that might not match our patterns
  const botStartTime = client.readyTimestamp;
  const wasCreatedAfterBotStart = channel.createdTimestamp > botStartTime;

  // Check if the channel was created very recently (within the last hour)
  // This is useful for catching test channels created by send-now.js
  const now = Date.now();
  const channelAge = now - channel.createdTimestamp;
  const isVeryRecent = channelAge < 60 * 60 * 1000; // Less than 1 hour old

  if (isVeryRecent) {
    console.log(
      `Channel ${channel.name} is very recent (less than 1 hour old)`
    );
    return true;
  }

  if (wasCreatedAfterBotStart && !matchesPattern) {
    // For channels created after the bot started, we'll consider them bot-created
    // if they have certain keywords in their name
    const botKeywords = [
      "test",
      "wisdom",
      "bot",
      "dog",
      "daily",
      "random",
      "temp",
      "bark",
      "woof",
      "howl",
    ];
    const hasKeyword = botKeywords.some((keyword) =>
      channel.name.toLowerCase().includes(keyword)
    );

    if (hasKeyword) {
      console.log(
        `Channel ${channel.name} was created after bot start and has a bot keyword`
      );
      return true;
    }
  }

  return matchesPattern;
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