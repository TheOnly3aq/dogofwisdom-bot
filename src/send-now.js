require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// Load configuration from environment variables
const config = {
  token: process.env.BOT_TOKEN,
  timezone: process.env.TIMEZONE || "UTC",
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel],
});

// Log when the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Set a random status
  setRandomStatus();

  console.log("Sending TEST wisdom message immediately (no user pings)...");

  try {
    await sendWisdomMessage();
    console.log("Test message sent successfully!");
  } catch (error) {
    console.error("Error sending message:", error);
  } finally {
    // Disconnect the bot after sending the message
    client.destroy();
    process.exit(0);
  }
});

// Function to set a random status for the bot
function setRandomStatus() {
  const statuses = [
    { type: "WATCHING", name: "for wisdom seekers" },
    { type: "WATCHING", name: "the universe unfold" },
    { type: "WATCHING", name: "dogs of wisdom" },
    { type: "LISTENING", name: "ba ha da ga da" },
    { type: "LISTENING", name: "the sounds of wisdom" },
    { type: "PLAYING", name: "with ancient knowledge" },
    { type: "PLAYING", name: "fetch with wisdom bones" },
    { type: "COMPETING", name: "wisdom contests" },
  ];

  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  // Set the activity
  // Activity types: 0 (PLAYING), 1 (STREAMING), 2 (LISTENING), 3 (WATCHING), 5 (COMPETING)
  const activityTypeMap = {
    PLAYING: 0,
    STREAMING: 1,
    LISTENING: 2,
    WATCHING: 3,
    COMPETING: 5,
  };

  client.user.setActivity(randomStatus.name, {
    type: activityTypeMap[randomStatus.type],
  });
  console.log(`Status set to: ${randomStatus.type} ${randomStatus.name}`);
}

// Import the message generator and category manager
const { generateWisdomMessage } = require("./messageGenerator");
const {
  createRandomCategory,
  createChannelInCategory,
} = require("./categoryManager");

// Function to create categories and channels for testing
async function createTestCategories() {
  console.log("Creating test categories and channels...");

  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return {};
    }

    const testChannels = new Map();

    // For each guild, create a new category and channel
    for (const guild of guilds.values()) {
      try {
        // Create a new category
        const newCategory = await createRandomCategory(guild);
        if (!newCategory) {
          console.log(`Failed to create test category in guild: ${guild.name}`);
          continue;
        }

        // Create a new channel in the category
        const newChannel = await createChannelInCategory(guild, newCategory);
        if (!newChannel) {
          console.log(`Failed to create test channel in guild: ${guild.name}`);
          continue;
        }

        // Store the category and channel for this guild
        testChannels.set(guild.id, {
          category: newCategory,
          channel: newChannel,
        });

        console.log(
          `Created test category "${newCategory.name}" with channel "#${newChannel.name}" in guild: ${guild.name}`
        );
      } catch (error) {
        console.error(
          `Error creating test category for guild ${guild.name}:`,
          error
        );
      }
    }

    return testChannels;
  } catch (error) {
    console.error("Error in createTestCategories:", error);
    return {};
  }
}

// Function to send the wisdom message with a random user ping
async function sendWisdomMessage() {
  try {
    // Create test categories and channels
    const testChannels = await createTestCategories();

    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return;
    }

    // For each guild, send a message to the test channel
    for (const guild of guilds.values()) {
      try {
        let targetChannel;

        // Check if we have a test channel for this guild
        const guildTestChannels = testChannels.get(guild.id);
        if (guildTestChannels && guildTestChannels.channel) {
          targetChannel = guildTestChannels.channel;
          console.log(
            `Using test channel #${targetChannel.name} in category "${guildTestChannels.category.name}"`
          );
        } else {
          // Fallback to a random channel if test channel creation failed
          const textChannels = guild.channels.cache.filter(
            (channel) =>
              channel.type === 0 && // 0 is GUILD_TEXT
              channel.permissionsFor(guild.members.me).has("SendMessages")
          );

          if (textChannels.size === 0) {
            console.log(
              `No accessible text channels found in guild: ${guild.name}`
            );
            continue;
          }

          // Select a random text channel
          targetChannel = textChannels.random();
          console.log(
            `Using random channel #${targetChannel.name} (test channel creation failed)`
          );
        }

        // Generate a random wisdom message
        const randomMessage = generateWisdomMessage();

        // Send the message without pinging anyone (for testing)
        await targetChannel.send(`${randomMessage} (Test message - no ping)`);
        console.log(
          `Test wisdom message sent to ${guild.name} in #${targetChannel.name}: "${randomMessage}"`
        );
      } catch (error) {
        console.error(`Error sending message to guild ${guild.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in sendWisdomMessage:", error);
    throw error;
  }
}

// Login to Discord with the bot token
client.login(config.token);
