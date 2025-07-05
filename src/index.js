require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const cron = require("node-cron");
const moment = require("moment-timezone");
const {
  cleanupOldChannels,
  cleanupNewChannels,
  cleanupChannels,
} = require("./channelCleanup");
const {
  handleNicknameMonitoring,
  setCooldownForUser,
} = require("./nicknameMonitor");

// Get the local server timezone
const getLocalTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

// Load configuration from environment variables
const config = {
  token: process.env.BOT_TOKEN,
  cronSchedule: process.env.CRON_SCHEDULE || "0 12 * * *", // Default: 12:00 PM every day
  timezone: getLocalTimezone(), // Use local server timezone
  dailyMessagesEnabled: true, // Default: daily messages are enabled
  nicknameChangesEnabled: true, // Default: weekly nickname changes are enabled
  ownerDMsEnabled: true, // Default: DMs to server owner are enabled
  adminRoleId: process.env.ADMIN_ROLE_ID || "1376665402758926487", // Role ID that can control bot features
  botOwnerId: process.env.BOT_OWNER_ID || "", // User ID of the bot owner who can use commands in DMs
  adminUserId: process.env.ADMIN_USER_ID || "", // Additional user ID that can use admin commands
  logChannelId: process.env.LOG_CHANNEL_ID || "", // Channel ID for logging bot activities
  blacklistedGuilds: process.env.BLACKLISTED_GUILDS
    ? process.env.BLACKLISTED_GUILDS.split(",").map((id) => id.trim())
    : [], // Guild IDs to exclude from bot features
  blacklistedChannels: process.env.BLACKLISTED_CHANNELS
    ? process.env.BLACKLISTED_CHANNELS.split(",").map((id) => id.trim())
    : [], // Channel IDs that should never be deleted
  monitoredUserId: process.env.MONITORED_USER_ID || "", // User ID to monitor for nickname changes
  mainChannelId: process.env.MAIN_CHANNEL_ID || "", // Channel ID for "Nuh Uh" messages
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

// Define slash commands
const commands = [
  // Roll command
  new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Roll a dice to decide what game to play")
    .toJSON(),

  // Toggle daily messages command (admin only)
  new SlashCommandBuilder()
    .setName("toggledaily")
    .setDescription("Toggle daily messages on/off")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only show to admins in UI
    .toJSON(),

  // Toggle nickname changes command (admin only)
  new SlashCommandBuilder()
    .setName("togglenicknames")
    .setDescription("Toggle weekly nickname changes on/off")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only show to admins in UI
    .toJSON(),

  // Toggle owner DMs command (admin only)
  new SlashCommandBuilder()
    .setName("toggleownerdms")
    .setDescription("Toggle DM notifications to server owners on/off")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only show to admins in UI
    .toJSON(),

  // Send daily message now (admin only)
  new SlashCommandBuilder()
    .setName("send-now")
    .setDescription("Send the daily message immediately")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // Test nickname changes (admin only)
  new SlashCommandBuilder()
    .setName("test-nicknames")
    .setDescription(
      "Test the nickname change functionality without waiting for the schedule"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // Change nicknames manually (admin only)
  new SlashCommandBuilder()
    .setName("change-nicknames")
    .setDescription("Manually change all nicknames to Dutch snacks")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // Test group snack event (admin only)
  new SlashCommandBuilder()
    .setName("test-group-snack")
    .setDescription(
      "Test the group snack event where everyone gets the same nickname"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // Check timezone (admin only)
  new SlashCommandBuilder()
    .setName("check-timezone")
    .setDescription("Check the current timezone configuration")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // Cleanup channels (admin only)
  new SlashCommandBuilder()
    .setName("cleanup-channels")
    .setDescription("Delete channels created by the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Which channels to delete")
        .setRequired(true)
        .addChoices(
          { name: "Old channels (older than specified days)", value: "old" },
          { name: "New channels (newer than specified days)", value: "new" },
          { name: "Both old and new channels", value: "both" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription(
          "Delete channels older/newer than this many days (default: 7)"
        )
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(30)
    )
    .addStringOption((option) =>
      option
        .setName("channel-type")
        .setDescription("Type of channels to delete")
        .setRequired(false)
        .addChoices(
          { name: "All channels", value: "all" },
          { name: "Text channels only", value: "text" },
          { name: "Voice channels only", value: "voice" }
        )
    )
    .addBooleanOption((option) =>
      option
        .setName("bot-created-only")
        .setDescription(
          "Only delete channels created by the bot (default: true)"
        )
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("delete-categories")
        .setDescription("Delete empty categories (default: true)")
        .setRequired(false)
    )
    .addBooleanOption((option) =>
      option
        .setName("preserve-active-voice")
        .setDescription(
          "Don't delete voice channels with active users (default: true)"
        )
        .setRequired(false)
    )
    .toJSON(),

  // Test owner DM (admin only)
  new SlashCommandBuilder()
    .setName("test-owner-dm")
    .setDescription("Test sending a nickname suggestion DM to the server owner")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  // Music commands
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a YouTube video")
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("The YouTube URL to play")
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current music queue")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("join")
    .setDescription("Join your voice channel")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leave the voice channel")
    .toJSON(),

  // Send direct message command (admin only)
  new SlashCommandBuilder()
    .setName("send-dm")
    .setDescription("Send a direct message to a specific user")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("user")
        .setDescription(
          "The user's ID or tag (e.g., 'username#1234' or '123456789012345678')"
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send to the user")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("use_embed")
        .setDescription(
          "Whether to send the message as an embed (default: false)"
        )
        .setRequired(false)
    )
    .toJSON(),

  // Test nickname monitoring (admin only)
  new SlashCommandBuilder()
    .setName("test-nickname-monitor")
    .setDescription(
      "Test the nickname monitoring feature by changing the monitored user's nickname"
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
];

// Handle messages sent to the bot
client.on("messageCreate", async (message) => {
  try {
    // Ignore messages from bots (including itself)
    if (message.author.bot) return;

    // Log all messages that mention the bot or are direct messages
    const botMentioned = message.mentions.users.has(client.user.id);
    const isDM = !message.guild;

    if (isDM || botMentioned) {
      console.log(
        `[DEBUG] Processing message from ${message.author.tag} (${
          isDM ? "DM" : "mention"
        })`
      );

      // Truncate message for privacy
      const truncatedContent =
        message.content.substring(0, 100) +
        (message.content.length > 100 ? "..." : "");

      // Create log message
      const location = isDM
        ? "DM"
        : `#${message.channel.name} in ${message.guild.name}`;
      const logType = isDM ? "dm-received" : "message-received";

      // Create embed data for rich logging
      const embedData = {
        User: `${message.author.tag} (${message.author.id})`,
        Location: location,
        Content: truncatedContent,
        Attachments:
          message.attachments.size > 0
            ? `${message.attachments.size} attachment(s)`
            : "None",
      };

      console.log(`[DEBUG] Logging message to Discord with type: ${logType}`);

      // Log the message
      logMessage(
        `Received message from ${message.author.tag} in ${location}: ${truncatedContent}`,
        logType,
        embedData
      );

      // Optional: Auto-respond to DMs
      // if (isDM) {
      //   message.reply("Thank you for your message! I'm a bot and don't respond to direct messages. Please use commands in a server instead.");
      // }
    }
  } catch (error) {
    console.error(`[ERROR] Error processing message: ${error.message}`);
    console.error(error.stack);
  }
});

// Log when the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(
    `Scheduled to send daily message at: ${config.cronSchedule} (${config.timezone})`
  );

  // Initialize logging system first, before any logging calls
  console.log("Initializing logging system...");
  initializeLogger(client, config);

  // Wait a moment to ensure logger is fully initialized
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Test Discord logging
  const testResult = await testDiscordLogging();
  console.log(`Discord logging test ${testResult ? "succeeded" : "failed"}`);

  console.log("Logging system initialized, sending startup logs...");

  // Now send startup logs
  logMessage(`Bot started successfully. Logging system active.`, "startup");
  logMessage(
    `Bot owner ID set to: ${config.botOwnerId || "Not configured"}`,
    "startup"
  );
  logMessage(
    `Admin role ID set to: ${config.adminRoleId || "Not configured"}`,
    "startup"
  );
  logMessage(
    `Admin user ID set to: ${config.adminUserId || "Not configured"}`,
    "startup"
  );
  logMessage(
    `Log channel ID set to: ${config.logChannelId || "Not configured"}`,
    "startup"
  );
  logMessage(
    `Monitored user ID set to: ${config.monitoredUserId || "Not configured"}`,
    "startup"
  );

  // Register slash commands
  try {
    console.log("Started refreshing application (/) commands.");

    const rest = new REST({ version: "10" }).setToken(config.token);

    // Register commands globally (for all guilds)
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error("Error refreshing application commands:", error);
  }

  // Set a custom status for the bot
  setRandomStatus();

  // Change status every hour
  setInterval(setRandomStatus, 60 * 60 * 1000);

  // Schedule the daily message at the configured time

  // Log the schedule
  console.log(
    `Message sending scheduled for: ${config.cronSchedule} (${config.timezone})`
  );

  // Schedule the daily message
  cron.schedule(
    config.cronSchedule,
    async () => {
      try {
        // Only send daily message if enabled
        if (config.dailyMessagesEnabled) {
          // Pass true to ping random users in scheduled messages
          await sendDailyMessage(true);
        } else {
          console.log("Daily messages are disabled. Skipping daily message.");
        }
      } catch (error) {
        console.error("Error sending daily message:", error);
      }
    },
    {
      timezone: config.timezone,
    }
  );

  // Schedule weekly nickname changes to Dutch snacks at 3 AM on Monday
  console.log(
    `Weekly nickname changes scheduled for: 0 3 * * 1 (${config.timezone})`
  );
  cron.schedule(
    "0 3 * * 1", // At 3:00 AM every Monday
    async () => {
      try {
        // Check if nickname changes are enabled
        if (!config.nicknameChangesEnabled) {
          console.log(
            "Weekly nickname changes are disabled. Skipping nickname changes."
          );
          return;
        }

        console.log(
          `Starting weekly nickname changes to Dutch snacks... (${new Date().toLocaleString()} - ${
            config.timezone
          })`
        );

        // Get all guilds the bot is in
        const guilds = client.guilds.cache;
        if (guilds.size === 0) {
          console.error("Bot is not in any guilds!");
          return;
        }

        // For each guild, change nicknames
        for (const guild of guilds.values()) {
          try {
            // Skip blacklisted guilds
            if (config.blacklistedGuilds.includes(guild.id)) {
              console.log(
                `Guild "${guild.name}" (${guild.id}) is blacklisted. Skipping nickname changes.`
              );
              continue;
            }

            console.log(`Changing nicknames for guild: ${guild.name}`);

            // Change nicknames to Dutch snacks
            const result = await changeNicknamesToDutchSnacks(
              guild,
              false,
              config
            );

            console.log(
              `Results for ${guild.name}: Success: ${result.success}, Failed: ${result.failed}, Skipped: ${result.skipped}`
            );

            if (result.groupSnackUsed) {
              console.log(
                `🎉 GROUP SNACK EVENT! Everyone in ${guild.name} was named "${result.groupSnack}" 🎉`
              );
            }
          } catch (error) {
            console.error(
              `Error changing nicknames in guild ${guild.name}:`,
              error
            );
          }
        }

        console.log("Weekly nickname changes completed!");
      } catch (error) {
        console.error("Error in weekly nickname changes:", error);
      }
    },
    {
      timezone: config.timezone,
    }
  );

  // Schedule weekly channel cleanup at 4 AM on Monday (after nickname changes)
  console.log(
    `Weekly channel cleanup scheduled for: 0 4 * * 1 (${config.timezone})`
  );
  cron.schedule(
    "0 4 * * 1", // At 4:00 AM every Monday
    async () => {
      try {
        console.log(
          `Starting weekly channel cleanup... (${new Date().toLocaleString()} - ${
            config.timezone
          })`
        );

        // Options for cleanup - only delete channels created by the bot
        const cleanupOptions = {
          channelType: "all",
          botCreatedOnly: true,
        };

        // Clean up channels older than 7 days
        const oldCleanupStats = await cleanupOldChannels(
          client,
          7,
          cleanupOptions
        );
        console.log(
          `Old channel cleanup completed! Deleted ${oldCleanupStats.channelsDeleted} channels and ${oldCleanupStats.categoriesDeleted} categories.`
        );

        // Clean up channels newer than 7 days
        const newCleanupStats = await cleanupNewChannels(
          client,
          7,
          cleanupOptions
        );
        console.log(
          `New channel cleanup completed! Deleted ${newCleanupStats.channelsDeleted} channels and ${newCleanupStats.categoriesDeleted} categories.`
        );

        // Total stats
        const totalChannelsDeleted =
          oldCleanupStats.channelsDeleted + newCleanupStats.channelsDeleted;
        const totalCategoriesDeleted =
          oldCleanupStats.categoriesDeleted + newCleanupStats.categoriesDeleted;

        console.log(
          `Weekly channel cleanup completed! Total deleted: ${totalChannelsDeleted} channels and ${totalCategoriesDeleted} categories.`
        );
      } catch (error) {
        console.error("Error in weekly channel cleanup:", error);
      }
    },
    {
      timezone: config.timezone,
    }
  );
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

// Import the message generator, category manager, and nickname manager
const { generateWisdomMessage } = require("./messageGenerator");
const {
  createRandomCategory,
  createChannelInCategory,
} = require("./categoryManager");
const {
  changeNicknamesToDutchSnacks,
  testOwnerDM,
} = require("./nicknameManager");
const { sendDirectMessage } = require("./directMessageManager");
const {
  initializeLogger,
  logMessage,
  logCommand,
  logDirectMessage,
  logError,
  testDiscordLogging,
} = require("./logManager");

// Store created categories and channels for each guild
const guildCategories = new Map();

// Function to prepare categories 5 minutes before sending the message
async function prepareCategories() {
  console.log("Preparing categories for wisdom messages...");

  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return;
    }

    // For each guild, create a new category and channel
    for (const guild of guilds.values()) {
      try {
        // Skip blacklisted guilds
        if (config.blacklistedGuilds.includes(guild.id)) {
          console.log(
            `Guild "${guild.name}" (${guild.id}) is blacklisted. Skipping category preparation.`
          );
          continue;
        }
        // Create a new category
        const newCategory = await createRandomCategory(guild);
        if (!newCategory) {
          console.log(`Failed to create category in guild: ${guild.name}`);
          continue;
        }

        // Create a new channel in the category
        const newChannel = await createChannelInCategory(guild, newCategory);
        if (!newChannel) {
          console.log(`Failed to create channel in guild: ${guild.name}`);
          continue;
        }

        // Store the category and channel for this guild
        guildCategories.set(guild.id, {
          category: newCategory,
          channel: newChannel,
        });

        console.log(
          `Prepared new category and channel for guild: ${guild.name}`
        );
      } catch (error) {
        console.error(
          `Error preparing category for guild ${guild.name}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error in prepareCategories:", error);
  }
}

// Function to send the daily message in a new channel
// pingUsers: if true, will ping random users in the message (for scheduled messages)
// if false, will not ping anyone (for test messages)
async function sendDailyMessage(pingUsers = false) {
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return;
    }

    // For each guild, create a new category and channel, then send the message
    for (const guild of guilds.values()) {
      try {
        // Skip blacklisted guilds
        if (config.blacklistedGuilds.includes(guild.id)) {
          console.log(
            `Guild "${guild.name}" (${guild.id}) is blacklisted. Skipping daily message.`
          );
          continue;
        }

        // Create a new category
        const newCategory = await createRandomCategory(guild);
        if (!newCategory) {
          console.log(`Failed to create category in guild: ${guild.name}`);
          continue;
        }

        // Create a new channel in the category
        const newChannel = await createChannelInCategory(guild, newCategory);
        if (!newChannel) {
          console.log(`Failed to create channel in guild: ${guild.name}`);
          // Try to delete the category since we couldn't create a channel
          try {
            await newCategory.delete();
          } catch (deleteError) {
            console.error(`Error deleting category: ${deleteError.message}`);
          }
          continue;
        }

        // Generate a random wisdom message
        const randomMessage = generateWisdomMessage();

        let finalMessage = randomMessage;

        // If pingUsers is true, select a random user to ping
        if (pingUsers) {
          try {
            // Fetch all members if not already cached
            if (guild.members.cache.size === 0) {
              await guild.members.fetch();
            }

            // Filter out bots and get only human users
            const humanMembers = guild.members.cache.filter(
              (member) => !member.user.bot
            );

            if (humanMembers.size > 0) {
              // Select a random member
              const randomMember = humanMembers.random();
              // Add the ping to the message
              finalMessage = `${randomMember} ${randomMessage}`;
              console.log(
                `Pinging user ${randomMember.user.tag} in daily message`
              );
            } else {
              console.log(`No human members found in guild: ${guild.name}`);
            }
          } catch (memberError) {
            console.error(
              `Error fetching members for guild ${guild.name}:`,
              memberError
            );
            // Continue with the message without pinging anyone
          }
        } else {
          console.log(`Not pinging any users (test message)`);
        }

        // Send the message (with or without ping based on pingUsers parameter)
        await newChannel.send(finalMessage);
        console.log(
          `Daily message sent to ${guild.name} in #${newChannel.name}: "${randomMessage}"`
        );

        // Store the category and channel for future reference
        guildCategories.set(guild.id, {
          category: newCategory,
          channel: newChannel,
        });
      } catch (error) {
        console.error(`Error sending message to guild ${guild.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in sendDailyMessage:", error);
  }
}

// Handle commands from messages
client.on("messageCreate", async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if the message starts with the prefix
  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;

  // Parse the command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Handle music commands
  try {
    if (command === "play" || command === "p") {
      // Check if a URL was provided
      if (!args.length) {
        return message.reply("Please provide a YouTube URL!");
      }

      // Get the URL
      const url = args[0];

      // Send a loading message
      const loadingMsg = await message.channel.send("🔄 Loading...");

      // Play the YouTube video
      const result = await playYouTube(message, url);

      // Update the loading message with the result
      if (result.success) {
        loadingMsg.edit(result.message);
      } else {
        loadingMsg.edit(`❌ ${result.message}`);
      }
    } else if (command === "skip" || command === "s") {
      // Skip the current song
      const result = skipSong(message.guild.id);
      message.channel.send(
        result.success ? result.message : `❌ ${result.message}`
      );
    } else if (command === "queue" || command === "q") {
      // Get the queue
      const result = getQueue(message.guild.id);

      if (!result.success) {
        return message.channel.send(`❌ ${result.message}`);
      }

      // Format the queue
      let queueMessage = "";

      if (result.current) {
        queueMessage += `🎵 **Now Playing:** ${result.current.title}\n\n`;
      }

      if (result.queue.length) {
        queueMessage += "**Queue:**\n";
        result.queue.forEach((song, index) => {
          queueMessage += `${index + 1}. ${song.title}\n`;
        });
      } else {
        queueMessage += "**Queue is empty**";
      }

      message.channel.send(queueMessage);
    } else if (
      command === "leave" ||
      command === "disconnect" ||
      command === "dc"
    ) {
      // Leave the voice channel
      const result = leaveChannel(message.guild.id);
      message.channel.send(
        result.success ? result.message : `❌ ${result.message}`
      );
    } else if (command === "join") {
      // Join the voice channel
      const result = await joinChannel(message);
      message.channel.send(
        result.success ? result.message : `❌ ${result.message}`
      );
    } else if (command === "roll") {
      // List of games to roll from
      const games = ["Minecraft", "Repo", "Lethal Company"];

      // Randomly select a game
      const randomGame = games[Math.floor(Math.random() * games.length)];

      // Send the result with a dice emoji
      message.channel.send(
        `🎲 The dice has been rolled! You should play: **${randomGame}**`
      );
    } else if (command === "toggledaily") {
      // Check if the user has the required admin role
      const member = message.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return message.reply(
          "❌ You don't have permission to use this command. You need the admin role."
        );
      }

      // Toggle the daily messages state
      config.dailyMessagesEnabled = !config.dailyMessagesEnabled;

      // Send confirmation message
      const status = config.dailyMessagesEnabled ? "enabled" : "disabled";
      message.channel.send(`✅ Daily messages have been **${status}**!`);

      // Log the change
      console.log(`Daily messages ${status} by ${message.author.tag}`);
    } else if (command === "togglenicknames") {
      // Check if the user has the required admin role
      const member = message.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return message.reply(
          "❌ You don't have permission to use this command. You need the admin role."
        );
      }

      // Toggle the nickname changes state
      config.nicknameChangesEnabled = !config.nicknameChangesEnabled;

      // Send confirmation message
      const status = config.nicknameChangesEnabled ? "enabled" : "disabled";
      message.channel.send(
        `✅ Weekly nickname changes have been **${status}**!`
      );

      // Log the change
      console.log(`Weekly nickname changes ${status} by ${message.author.tag}`);
    } else if (command === "toggleownerdms") {
      // Check if the user has the required admin role
      const member = message.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return message.reply(
          "❌ You don't have permission to use this command. You need the admin role."
        );
      }

      // Toggle the owner DMs state
      config.ownerDMsEnabled = !config.ownerDMsEnabled;

      // Send confirmation message
      const status = config.ownerDMsEnabled ? "enabled" : "disabled";
      message.channel.send(
        `✅ Server owner DM notifications have been **${status}**!`
      );

      // Log the change
      console.log(
        `Server owner DM notifications ${status} by ${message.author.tag}`
      );
    } else if (command === "help") {
      // Display help message for music commands
      const helpMessage = `
**Music Commands:**
\`${prefix}play [YouTube URL]\` - Play a YouTube video
\`${prefix}skip\` - Skip the current song
\`${prefix}queue\` - Show the current queue
\`${prefix}join\` - Join your voice channel
\`${prefix}leave\` - Leave the voice channel
\`${prefix}help\` - Show this help message

**Game Commands:**
\`${prefix}roll\` - Roll a dice to decide what game to play

**Admin Commands:**
\`${prefix}toggledaily\` - Toggle daily messages on/off (requires admin role)
\`${prefix}togglenicknames\` - Toggle weekly nickname changes on/off (requires admin role)
\`${prefix}toggleownerdms\` - Toggle server owner DM notifications on/off (requires admin role)

**Aliases:**
\`${prefix}p\` - Alias for play
\`${prefix}s\` - Alias for skip
\`${prefix}q\` - Alias for queue
\`${prefix}dc\` - Alias for leave
`;
      message.channel.send(helpMessage);
    }
  } catch (error) {
    console.error("Error handling command:", error);
    message.channel.send(`❌ An error occurred: ${error.message}`);
  }
});

// Handle slash command and button interactions
client.on("interactionCreate", async (interaction) => {
  // Handle button interactions
  if (interaction.isButton()) {
    try {
      // Check if this is a nickname change button
      if (interaction.customId.startsWith("change_nickname_")) {
        // Extract the guild ID and nickname from the custom ID
        const parts = interaction.customId.split("_");
        const guildId = parts[2];
        const nickname = parts.slice(3).join("_").replace(/_/g, " ");

        // Send instructions on how to change nickname
        await interaction.reply({
          content:
            `**How to change your nickname in Discord:**\n\n` +
            `1. Right-click on the server name in the server list\n` +
            `2. Select "Change Nickname"\n` +
            `3. Enter: \`${nickname}\`\n` +
            `4. Click "Save"\n\n` +
            `Or on mobile:\n` +
            `1. Swipe right to open the server list\n` +
            `2. Tap on the server\n` +
            `3. Tap on the three dots in the top-right\n` +
            `4. Tap "Change Nickname"\n` +
            `5. Enter: \`${nickname}\`\n` +
            `6. Tap "Save"`,
          ephemeral: true,
        });

        console.log(
          `Sent nickname change instructions to ${interaction.user.tag} for nickname: ${nickname}`
        );
      }
    } catch (error) {
      console.error("Error handling button interaction:", error);
      try {
        await interaction.reply({
          content: "❌ An error occurred while processing this button.",
          ephemeral: true,
        });
      } catch (replyError) {
        console.error("Error sending error reply:", replyError);
      }
    }
    return;
  }

  // Handle slash commands
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // Log the command usage
  try {
    // Get command options for logging
    const options = {};
    if (interaction.options && interaction.options._hoistedOptions) {
      interaction.options._hoistedOptions.forEach((opt) => {
        options[opt.name] = opt.value;
      });
    }

    // Log the command
    logCommand(interaction, commandName, options);
  } catch (error) {
    logError("command logging", error);
  }

  try {
    // Game commands
    if (commandName === "roll") {
      // List of games to roll from
      const games = ["Minecraft", "Repo", "Lethal Company"];

      // Randomly select a game
      const randomGame = games[Math.floor(Math.random() * games.length)];

      // Send the result with a dice emoji
      await interaction.reply(
        `🎲 The dice has been rolled! You should play: **${randomGame}**`
      );
    }

    // Admin commands
    else if (commandName === "toggledaily") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true, // Only visible to the command user
        });
      }

      // Toggle the daily messages state
      config.dailyMessagesEnabled = !config.dailyMessagesEnabled;

      // Send confirmation message
      const status = config.dailyMessagesEnabled ? "enabled" : "disabled";
      await interaction.reply(`✅ Daily messages have been **${status}**!`);

      // Log the change
      console.log(`Daily messages ${status} by ${interaction.user.tag}`);
    } else if (commandName === "togglenicknames") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true, // Only visible to the command user
        });
      }

      // Toggle the nickname changes state
      config.nicknameChangesEnabled = !config.nicknameChangesEnabled;

      // Send confirmation message
      const status = config.nicknameChangesEnabled ? "enabled" : "disabled";
      await interaction.reply(
        `✅ Weekly nickname changes have been **${status}**!`
      );

      // Log the change
      console.log(
        `Weekly nickname changes ${status} by ${interaction.user.tag}`
      );
    } else if (commandName === "toggleownerdms") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true, // Only visible to the command user
        });
      }

      // Toggle the owner DMs state
      config.ownerDMsEnabled = !config.ownerDMsEnabled;

      // Send confirmation message
      const status = config.ownerDMsEnabled ? "enabled" : "disabled";
      await interaction.reply(
        `✅ Server owner DM notifications have been **${status}**!`
      );

      // Log the change
      console.log(
        `Server owner DM notifications ${status} by ${interaction.user.tag}`
      );
    }

    // Admin command: send-now
    else if (commandName === "send-now") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true,
        });
      }

      // Defer the reply as this might take some time
      await interaction.deferReply();

      try {
        // Send the daily message immediately without pinging users (test mode)
        await sendDailyMessage(false);
        await interaction.editReply(
          "✅ Daily message has been sent manually! (No user pings in test mode)"
        );
        console.log(
          `Daily message sent manually by ${interaction.user.tag} (without pings)`
        );
      } catch (error) {
        console.error("Error sending manual daily message:", error);
        await interaction.editReply(
          `❌ Error sending daily message: ${error.message}`
        );
      }
    }

    // Admin command: test-nicknames
    else if (commandName === "test-nicknames") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true,
        });
      }

      // Defer the reply as this might take some time
      await interaction.deferReply();

      try {
        // Get the guild
        const guild = interaction.guild;

        // Test the nickname change functionality
        console.log(
          `Testing nickname changes in guild "${guild.name}" (initiated by ${interaction.user.tag})`
        );

        // Change nicknames to Dutch snacks
        const result = await changeNicknamesToDutchSnacks(guild, false, config);

        // Send the result
        let responseMessage =
          `✅ Nickname test complete!\n` +
          `Success: ${result.success}\n` +
          `Failed: ${result.failed}\n` +
          `Skipped: ${result.skipped}\n`;

        if (result.groupSnackUsed) {
          responseMessage += `🎉 GROUP SNACK EVENT! Everyone was named "${result.groupSnack}" 🎉\n`;
        }

        if (result.ownerSuggestion) {
          responseMessage += `\n👑 Server owner suggestion: "${result.suggestedSnack}" (sent via DM)`;
        }

        await interaction.editReply(responseMessage);
      } catch (error) {
        console.error("Error testing nickname changes:", error);
        await interaction.editReply(
          `❌ Error testing nickname changes: ${error.message}`
        );
      }
    }

    // Admin command: change-nicknames
    else if (commandName === "change-nicknames") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true,
        });
      }

      // Defer the reply as this might take some time
      await interaction.deferReply();

      try {
        // Get the guild
        const guild = interaction.guild;

        // Change nicknames to Dutch snacks
        console.log(
          `Manually changing nicknames in guild "${guild.name}" (initiated by ${interaction.user.tag})`
        );

        const result = await changeNicknamesToDutchSnacks(guild, false, config);

        // Send the result
        let responseMessage =
          `✅ Nicknames changed successfully!\n` +
          `Success: ${result.success}\n` +
          `Failed: ${result.failed}\n` +
          `Skipped: ${result.skipped}\n`;

        if (result.groupSnackUsed) {
          responseMessage += `🎉 GROUP SNACK EVENT! Everyone was named "${result.groupSnack}" 🎉\n`;
        }

        if (result.ownerSuggestion) {
          responseMessage += `\n👑 Server owner suggestion: "${result.suggestedSnack}" (sent via DM)`;
        }

        await interaction.editReply(responseMessage);
      } catch (error) {
        console.error("Error changing nicknames:", error);
        await interaction.editReply(
          `❌ Error changing nicknames: ${error.message}`
        );
      }
    }

    // Admin command: test-group-snack
    else if (commandName === "test-group-snack") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true,
        });
      }

      // Defer the reply as this might take some time
      await interaction.deferReply();

      try {
        // Get the guild
        const guild = interaction.guild;

        // Force a group snack event
        console.log(
          `Testing group snack event in guild "${guild.name}" (initiated by ${interaction.user.tag})`
        );

        // Change nicknames to Dutch snacks with forced group snack
        const result = await changeNicknamesToDutchSnacks(guild, true, config);

        // Send the result
        let responseMessage =
          `✅ Group snack test complete!\n` +
          `Success: ${result.success}\n` +
          `Failed: ${result.failed}\n` +
          `Skipped: ${result.skipped}\n` +
          `🎉 GROUP SNACK EVENT! Everyone was named "${result.groupSnack}" 🎉\n`;

        if (result.ownerSuggestion) {
          responseMessage += `\n👑 Server owner suggestion: "${result.suggestedSnack}" (sent via DM)`;
        }

        await interaction.editReply(responseMessage);
      } catch (error) {
        console.error("Error testing group snack event:", error);
        await interaction.editReply(
          `❌ Error testing group snack event: ${error.message}`
        );
      }
    }

    // Admin command: cleanup-channels
    else if (commandName === "cleanup-channels") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true,
        });
      }

      // Defer the reply as this might take some time
      await interaction.deferReply();

      try {
        // Get the days parameter (default to 7 if not provided)
        const days = interaction.options.getInteger("days") || 7;

        // Get the mode parameter (default to "old" if not provided)
        const mode = interaction.options.getString("mode") || "old";

        // Get the channel type parameter (default to "all" if not provided)
        const channelType =
          interaction.options.getString("channel-type") || "all";

        // Get the bot-created-only parameter (default to true if not provided)
        const botCreatedOnly =
          interaction.options.getBoolean("bot-created-only");
        // If botCreatedOnly is null (not specified), default to true
        const useBotCreatedOnly = botCreatedOnly !== false;

        // Get the delete-categories parameter (default to true if not provided)
        const deleteCategories =
          interaction.options.getBoolean("delete-categories");
        // If deleteCategories is null (not specified), default to true
        const useDeleteCategories = deleteCategories !== false;

        // Get the preserve-active-voice parameter (default to true if not provided)
        const preserveActiveVoice = interaction.options.getBoolean(
          "preserve-active-voice"
        );
        // If preserveActiveVoice is null (not specified), default to true
        const usePreserveActiveVoice = preserveActiveVoice !== false;

        // Create options object for cleanup functions
        const cleanupOptions = {
          channelType: channelType,
          botCreatedOnly: useBotCreatedOnly,
          deleteCategories: useDeleteCategories,
          blacklistedChannels: config.blacklistedChannels,
          preserveActiveVoice: usePreserveActiveVoice,
        };

        let cleanupStats = {
          channelsDeleted: 0,
          categoriesDeleted: 0,
          skipped: 0,
          errors: 0,
          blacklisted: 0,
        };
        let modeDescription = "";

        // Run the cleanup based on the selected mode
        if (mode === "old" || mode === "both") {
          console.log(
            `Manual channel cleanup triggered by ${interaction.user.tag} for channels older than ${days} days` +
              ` (channel type: ${channelType}, bot created only: ${useBotCreatedOnly}, delete categories: ${useDeleteCategories})`
          );
          const oldCleanupStats = await cleanupOldChannels(
            client,
            days,
            cleanupOptions
          );

          // Add to total stats
          cleanupStats.channelsDeleted += oldCleanupStats.channelsDeleted;
          cleanupStats.categoriesDeleted += oldCleanupStats.categoriesDeleted;
          cleanupStats.skipped += oldCleanupStats.skipped;
          cleanupStats.errors += oldCleanupStats.errors;
          cleanupStats.blacklisted += oldCleanupStats.blacklisted || 0;

          modeDescription += `Deleted channels older than ${days} days.\n`;
        }

        if (mode === "new" || mode === "both") {
          console.log(
            `Manual channel cleanup triggered by ${interaction.user.tag} for channels newer than ${days} days` +
              ` (channel type: ${channelType}, bot created only: ${useBotCreatedOnly}, delete categories: ${useDeleteCategories})`
          );
          const newCleanupStats = await cleanupNewChannels(
            client,
            days,
            cleanupOptions
          );

          // Add to total stats
          cleanupStats.channelsDeleted += newCleanupStats.channelsDeleted;
          cleanupStats.categoriesDeleted += newCleanupStats.categoriesDeleted;
          cleanupStats.skipped += newCleanupStats.skipped;
          cleanupStats.errors += newCleanupStats.errors;
          cleanupStats.blacklisted += newCleanupStats.blacklisted || 0;
          cleanupStats.activeVoice += newCleanupStats.activeVoice || 0;

          modeDescription += `Deleted channels newer than ${days} days.\n`;
        }

        // Send the result
        await interaction.editReply(
          `✅ Channel cleanup completed!\n` +
            `- Deleted ${cleanupStats.channelsDeleted} channels\n` +
            `- Deleted ${cleanupStats.categoriesDeleted} categories\n` +
            `- Skipped ${cleanupStats.skipped} channels/categories\n` +
            `- Protected ${
              cleanupStats.blacklisted || 0
            } blacklisted channels/categories\n` +
            `- Preserved ${
              cleanupStats.activeVoice || 0
            } active voice channels\n` +
            `- Encountered ${cleanupStats.errors} errors\n\n` +
            `Mode: ${mode}\n` +
            `Channel type: ${channelType}\n` +
            `Bot created only: ${useBotCreatedOnly}\n` +
            `Delete categories: ${useDeleteCategories}\n` +
            `Preserve active voice channels: ${usePreserveActiveVoice}\n` +
            modeDescription
        );
      } catch (error) {
        console.error("Error cleaning up channels:", error);
        await interaction.editReply(
          `❌ Error cleaning up channels: ${error.message}`
        );
      }
    }

    // Admin command: check-timezone
    else if (commandName === "check-timezone") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true,
        });
      }

      // Get timezone information
      const timezone = config.timezone;
      const currentTime = new Date().toLocaleString("en-US", {
        timeZone: timezone,
      });
      const dailySchedule = config.cronSchedule;
      const weeklySchedule = "0 3 * * 1"; // Monday at 3 AM

      // Format the response
      const response = [
        `**Timezone Configuration**`,
        `Current timezone: \`${timezone}\``,
        `Current time in this timezone: \`${currentTime}\``,
        ``,
        `**Schedules**`,
        `Daily message schedule: \`${dailySchedule}\` (${
          config.dailyMessagesEnabled ? "Enabled" : "Disabled"
        })`,
        `Weekly nickname schedule: \`${weeklySchedule}\` (${
          config.nicknameChangesEnabled ? "Enabled" : "Disabled"
        })`,
        `Server owner DM notifications: (${
          config.ownerDMsEnabled ? "Enabled" : "Disabled"
        })`,
      ].join("\n");

      // Send the timezone information
      await interaction.reply(response);
      console.log(`Timezone information checked by ${interaction.user.tag}`);
    }

    // Admin command: test-owner-dm
    else if (commandName === "test-owner-dm") {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true,
        });
      }

      // Defer the reply as this might take some time
      await interaction.deferReply();

      try {
        // Get the guild
        const guild = interaction.guild;

        // Test sending a DM to the server owner
        console.log(
          `Testing owner DM in guild "${guild.name}" (initiated by ${interaction.user.tag})`
        );

        const result = await testOwnerDM(guild, false, config);

        // Format the response based on the result
        let responseMessage = `✅ Owner DM test complete!\n`;

        if (result.success) {
          responseMessage += `👑 Successfully sent a DM to the server owner!\n`;
          responseMessage += `Suggested nickname: **${result.suggestedSnack}**\n`;
        } else {
          responseMessage += `⚠️ Test completed with issues:\n`;

          if (result.ownerFound) {
            responseMessage += `✅ Server owner found\n`;
          } else {
            responseMessage += `❌ Could not find server owner\n`;
          }

          if (result.dmSent) {
            responseMessage += `✅ DM was sent successfully\n`;
          } else {
            responseMessage += `❌ Could not send DM to server owner\n`;
          }

          if (result.error) {
            responseMessage += `\nError: ${result.error}`;
          }
        }

        // Send the result
        await interaction.editReply(responseMessage);
      } catch (error) {
        console.error("Error testing owner DM:", error);
        await interaction.editReply(
          `❌ Error testing owner DM: ${error.message}`
        );
      }
    }

    // Admin command: send-dm
    else if (commandName === "send-dm") {
      // Check permissions - either admin role in a server or bot owner in DMs
      let hasPermission = false;

      // If in a guild (server), check for admin role
      if (interaction.guild) {
        const member = interaction.member;
        if (member && member.roles.cache.has(config.adminRoleId)) {
          hasPermission = true;
        }
      }

      // Check if user is the bot owner or admin user (works in DMs or servers)
      if (
        (config.botOwnerId && interaction.user.id === config.botOwnerId) ||
        (config.adminUserId && interaction.user.id === config.adminUserId)
      ) {
        hasPermission = true;
      }

      // If no permission, reject the command
      if (!hasPermission) {
        return interaction.reply({
          content:
            "❌ You don't have permission to use this command. You need either the admin role in a server or be an authorized user.",
          ephemeral: true,
        });
      }

      // Defer the reply as this might take some time
      await interaction.deferReply({ ephemeral: true });

      try {
        // Get the parameters from the options
        const userIdentifier = interaction.options.getString("user");
        const message = interaction.options.getString("message");
        const useEmbed = interaction.options.getBoolean("use_embed") || false;

        console.log(
          `Sending direct message to ${userIdentifier} (initiated by ${interaction.user.tag})`
        );

        // Send the direct message
        const result = await sendDirectMessage(
          client,
          userIdentifier,
          message,
          useEmbed,
          interaction.user // Pass the sender for logging
        );

        // Format the response based on the result
        let responseMessage = `✅ Direct message operation complete!\n`;

        if (result.success) {
          responseMessage += `✅ Successfully sent a DM to the user!\n`;
          responseMessage += `User: ${userIdentifier}\n`;
          responseMessage += `Message: "${message}"\n`;
          responseMessage += `Embed: ${useEmbed ? "Yes" : "No"}\n`;
        } else {
          responseMessage += `⚠️ Operation completed with issues:\n`;

          if (result.userFound) {
            responseMessage += `✅ User found\n`;
          } else {
            responseMessage += `❌ Could not find user with identifier: ${userIdentifier}\n`;
          }

          if (result.dmSent) {
            responseMessage += `✅ DM was sent successfully\n`;
          } else {
            responseMessage += `❌ Could not send DM to user\n`;
          }

          if (result.error) {
            responseMessage += `\nError: ${result.error}`;
          }
        }

        // Send the result (ephemeral so only the command user can see it)
        await interaction.editReply({
          content: responseMessage,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error sending direct message:", error);
        await interaction.editReply({
          content: `❌ Error sending direct message: ${error.message}`,
          ephemeral: true,
        });
      }
    }

    // Admin command: test-nickname-monitor
    else if (commandName === "test-nickname-monitor") {
      // Check permissions - either admin role in a server or bot owner in DMs
      let hasPermission = false;

      // If in a guild (server), check for admin role
      if (interaction.guild) {
        const member = interaction.member;
        if (member && member.roles.cache.has(config.adminRoleId)) {
          hasPermission = true;
        }
      }

      // If in DMs, check if it's the bot owner or admin user
      if (!interaction.guild) {
        if (
          interaction.user.id === config.botOwnerId ||
          interaction.user.id === config.adminUserId
        ) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        await interaction.reply({
          content: "❌ You don't have permission to use this command.",
          ephemeral: true,
        });
        return;
      }

      // Check if monitoring is configured
      if (!config.monitoredUserId) {
        await interaction.reply({
          content:
            "❌ No user is configured for nickname monitoring. Please set the `MONITORED_USER_ID` environment variable.",
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        // Find the monitored user in this guild
        const guild = interaction.guild;
        if (!guild) {
          await interaction.editReply({
            content: "❌ This command can only be used in a server.",
            ephemeral: true,
          });
          return;
        }

        const monitoredMember = await guild.members
          .fetch(config.monitoredUserId)
          .catch(() => null);
        if (!monitoredMember) {
          await interaction.editReply({
            content: `❌ Could not find the monitored user (ID: ${config.monitoredUserId}) in this server.`,
            ephemeral: true,
          });
          return;
        }

        // Check if the bot can change this user's nickname
        const botMember = guild.members.me;
        if (!botMember.permissions.has("ManageNicknames")) {
          await interaction.editReply({
            content:
              "❌ Bot doesn't have 'Manage Nicknames' permission in this server.",
            ephemeral: true,
          });
          return;
        }

        if (
          monitoredMember.roles.highest.position >=
          botMember.roles.highest.position
        ) {
          await interaction.editReply({
            content: `❌ Cannot change nickname for ${monitoredMember.user.tag} due to role hierarchy.`,
            ephemeral: true,
          });
          return;
        }

        // Get the current nickname
        const currentNickname =
          monitoredMember.nickname || monitoredMember.user.username;

        // Change the nickname to "Test Nickname" to trigger the monitoring
        await monitoredMember.setNickname(
          "Test Nickname",
          "Testing nickname monitoring feature"
        );

        // Set a brief cooldown to prevent the monitoring system from immediately triggering
        setCooldownForUser(monitoredMember.id);

        await interaction.editReply({
          content: `✅ Successfully changed ${monitoredMember.user.tag}'s nickname from "${currentNickname}" to "Test Nickname".\n\nNow try changing their nickname manually - the monitoring system will automatically revert it to a random Dutch snack name and send "Nuh Uh" to the main channel! (There's a 5-second cooldown to prevent infinite loops)`,
          ephemeral: true,
        });

        // Log the test
        logMessage(
          `Admin ${interaction.user.tag} tested nickname monitoring for user ${monitoredMember.user.tag}`,
          "command",
          {
            Admin: `${interaction.user.tag} (${interaction.user.id})`,
            "Monitored User": `${monitoredMember.user.tag} (${monitoredMember.id})`,
            Guild: `${guild.name} (${guild.id})`,
            "Previous Nickname": currentNickname,
            "Test Nickname": "Test Nickname",
            Action: "Nickname monitoring test",
          }
        );
      } catch (error) {
        console.error("Error testing nickname monitoring:", error);
        await interaction.editReply({
          content: `❌ Error testing nickname monitoring: ${error.message}`,
          ephemeral: true,
        });
      }
    }

    // Music commands
    else if (commandName === "play") {
      // Get the URL from the options
      const url = interaction.options.getString("url");

      // Defer the reply to give time for processing
      await interaction.deferReply();

      // Play the YouTube video
      const result = await playYouTube(interaction, url);

      // Send the result
      if (result.success) {
        await interaction.editReply(result.message);
      } else {
        await interaction.editReply(`❌ ${result.message}`);
      }
    } else if (commandName === "skip") {
      // Skip the current song
      const result = skipSong(interaction.guild.id);
      await interaction.reply(
        result.success ? result.message : `❌ ${result.message}`
      );
    } else if (commandName === "queue") {
      // Get the queue
      const result = getQueue(interaction.guild.id);

      if (!result.success) {
        return interaction.reply(`❌ ${result.message}`);
      }

      // Format the queue
      let queueMessage = "";

      if (result.current) {
        queueMessage += `🎵 **Now Playing:** ${result.current.title}\n\n`;
      }

      if (result.queue.length) {
        queueMessage += "**Queue:**\n";
        result.queue.forEach((song, index) => {
          queueMessage += `${index + 1}. ${song.title}\n`;
        });
      } else {
        queueMessage += "**Queue is empty**";
      }

      await interaction.reply(queueMessage);
    } else if (commandName === "join") {
      // Join the voice channel
      const result = await joinChannel(interaction);
      await interaction.reply(
        result.success ? result.message : `❌ ${result.message}`
      );
    } else if (commandName === "leave") {
      // Leave the voice channel
      const result = leaveChannel(interaction.guild.id);
      await interaction.reply(
        result.success ? result.message : `❌ ${result.message}`
      );
    }
  } catch (error) {
    console.error("Error handling slash command:", error);

    // If the interaction hasn't been replied to yet, send an error message
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `❌ An error occurred: ${error.message}`,
        ephemeral: true,
      });
    } else if (interaction.deferred) {
      await interaction.editReply(`❌ An error occurred: ${error.message}`);
    }
  }
});

// Handle guild member updates (for nickname monitoring)
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    // Handle nickname monitoring
    await handleNicknameMonitoring(oldMember, newMember, config, logMessage);
  } catch (error) {
    console.error(`Error handling guild member update: ${error.message}`);
    console.error(error.stack);
  }
});

// Login to Discord with the bot token
client.login(config.token);
