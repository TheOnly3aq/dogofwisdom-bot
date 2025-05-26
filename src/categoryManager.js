/**
 * Utility functions for managing Discord categories
 */

// Array of fun category names
const categoryNames = [
  "Wisdom of the Day",
  "Dog Wisdom Central",
  "Today's Enlightenment",
  "Bark of Wisdom",
  "Canine Knowledge",
  "Doggo Insights",
  "Puppy Prophecies",
  "Woof Wisdom",
  "Bork Thoughts",
  "Howling Truths",
  "Paw-sitive Thinking",
  "Tail-wagging Wisdom",
  "Furry Philosophy",
  "Snout Insights",
  "Barking Brilliance",
  "Fetch Your Wisdom",
  "Treat for Thought",
  "Leash on Life",
  "Collar of Knowledge",
  "Kibble Contemplations",
];

/**
 * Creates a new category in a guild with a random name
 * @param {Guild} guild - The Discord guild to create the category in
 * @returns {Promise<CategoryChannel|null>} The newly created category or null if creation failed
 */
async function createRandomCategory(guild) {
  try {
    // Check if the bot has the necessary permissions
    const botMember = guild.members.me;
    if (!botMember.permissions.has("ManageChannels")) {
      console.log(
        `Bot doesn't have 'Manage Channels' permission in guild "${guild.name}". Cannot create category.`
      );
      return null;
    }

    // Select a random category name
    const randomName =
      categoryNames[Math.floor(Math.random() * categoryNames.length)];

    // Add a random number to make it unique
    const uniqueName = `${randomName} #${Math.floor(Math.random() * 1000)}`;

    try {
      // Create the category
      const newCategory = await guild.channels.create({
        name: uniqueName,
        type: 4, // 4 is GUILD_CATEGORY
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: ["ViewChannel"],
          },
        ],
        reason: "Daily wisdom message category",
      });

      console.log(
        `Created new category "${uniqueName}" in guild "${guild.name}"`
      );
      return newCategory;
    } catch (createError) {
      // If creation fails due to permissions, log a more specific message
      if (createError.code === 50013) {
        // Missing Permissions error code
        console.log(
          `Bot has 'Manage Channels' permission but still couldn't create a category in "${guild.name}". This might be due to role hierarchy.`
        );
      } else {
        console.error(
          `Error creating category in guild ${guild.name}:`,
          createError
        );
      }
      return null;
    }
  } catch (error) {
    console.error(
      `Error in createRandomCategory for guild ${guild.name}:`,
      error
    );
    return null;
  }
}

/**
 * Creates a new text channel in a category
 * @param {Guild} guild - The Discord guild to create the channel in
 * @param {CategoryChannel} category - The category to create the channel in
 * @returns {Promise<TextChannel|null>} The newly created text channel or null if creation failed
 */
async function createChannelInCategory(guild, category) {
  try {
    // Check if the bot has the necessary permissions
    const botMember = guild.members.me;
    if (!botMember.permissions.has("ManageChannels")) {
      console.log(
        `Bot doesn't have 'Manage Channels' permission in guild "${guild.name}". Cannot create channel.`
      );
      return null;
    }

    // Channel name options
    const channelNames = [
      "daily-wisdom",
      "wisdom-chat",
      "dog-speaks",
      "listen-here",
      "important-barks",
      "wisdom-drops",
      "pay-attention",
      "bark-of-the-day",
      "heed-this-woof",
      "wisdom-nuggets",
    ];

    // Select a random channel name
    const randomName =
      channelNames[Math.floor(Math.random() * channelNames.length)];

    try {
      // Create the text channel in the category
      const newChannel = await guild.channels.create({
        name: randomName,
        type: 0, // 0 is GUILD_TEXT
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
        ],
        reason: "Daily wisdom message channel",
      });

      console.log(
        `Created new channel "#${randomName}" in category "${category.name}" in guild "${guild.name}"`
      );
      return newChannel;
    } catch (createError) {
      // If creation fails due to permissions, log a more specific message
      if (createError.code === 50013) {
        // Missing Permissions error code
        console.log(
          `Bot has 'Manage Channels' permission but still couldn't create a channel in "${guild.name}". This might be due to role hierarchy.`
        );
      } else {
        console.error(
          `Error creating channel in guild ${guild.name}:`,
          createError
        );
      }
      return null;
    }
  } catch (error) {
    console.error(
      `Error in createChannelInCategory for guild ${guild.name}:`,
      error
    );
    return null;
  }
}

module.exports = {
  createRandomCategory,
  createChannelInCategory,
};
