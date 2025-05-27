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
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
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

  // Test owner DM (admin only)
  new SlashCommandBuilder()
    .setName("test-owner-dm")
    .setDescription("Test sending a nickname suggestion DM to the server owner")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show the help message with all available commands")
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

  // Parse the cron schedule to calculate 5 minutes before
  const parseCronForPreparation = (cronExpression) => {
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) return null;

    // Extract minute and hour
    let minute = parseInt(parts[0]);
    let hour = parseInt(parts[1]);

    // Calculate 5 minutes before
    minute = minute - 5;
    if (minute < 0) {
      minute = 55 + minute; // Add 60 and subtract 5
      hour = (hour - 1 + 24) % 24; // Subtract 1 hour, handle day wrap
    }

    // Return the new cron expression
    return `${minute} ${hour} ${parts[2]} ${parts[3]} ${parts[4]}`;
  };

  // Get the preparation cron schedule (5 minutes before the message)
  const prepCronSchedule = parseCronForPreparation(config.cronSchedule);

  // Log the schedules
  console.log(
    `Category preparation scheduled for: ${prepCronSchedule} (${config.timezone})`
  );
  console.log(
    `Message sending scheduled for: ${config.cronSchedule} (${config.timezone})`
  );

  // Schedule category preparation (5 minutes before)
  if (prepCronSchedule) {
    cron.schedule(
      prepCronSchedule,
      async () => {
        try {
          // Only prepare categories if daily messages are enabled
          if (config.dailyMessagesEnabled) {
            await prepareCategories();
          } else {
            console.log(
              "Daily messages are disabled. Skipping category preparation."
            );
          }
        } catch (error) {
          console.error("Error preparing categories:", error);
        }
      },
      {
        timezone: config.timezone,
      }
    );
  }

  // Schedule the daily message
  cron.schedule(
    config.cronSchedule,
    async () => {
      try {
        // Only send daily message if enabled
        if (config.dailyMessagesEnabled) {
          await sendDailyMessage();
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

// Function to send the daily message with a random user ping
async function sendDailyMessage() {
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return;
    }

    // For each guild, send a message to the prepared channel or a random one
    for (const guild of guilds.values()) {
      try {
        let targetChannel;

        // Check if we have a prepared category and channel for this guild
        const preparedChannels = guildCategories.get(guild.id);
        if (preparedChannels && preparedChannels.channel) {
          targetChannel = preparedChannels.channel;
          console.log(
            `Using prepared channel #${targetChannel.name} in category "${preparedChannels.category.name}"`
          );
        } else {
          // Fallback to a random channel if no prepared channel exists
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
            `Using random channel #${targetChannel.name} (no prepared channel found)`
          );
        }

        // Get all members from the guild
        const members = await guild.members.fetch();

        // Filter out bots and get a random member
        const humanMembers = members.filter((member) => !member.user.bot);
        if (humanMembers.size === 0) {
          console.log(`No human members found in guild: ${guild.name}`);
          continue;
        }

        const randomMember = humanMembers.random();

        // Generate a random wisdom message
        const randomMessage = generateWisdomMessage();

        // Send the message with the random user ping
        await targetChannel.send(`${randomMessage} <@${randomMember.id}>`);
        console.log(
          `Daily message sent to ${guild.name} in #${targetChannel.name}: "${randomMessage}", pinged: ${randomMember.user.tag}`
        );

        // Clear the prepared category and channel for this guild
        guildCategories.delete(guild.id);
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

  // Handle commands
  try {
    if (command === "roll") {
      // List of games to roll from
      const games = ["Minecraft", "Repo", "Lethal Company"];

      // Randomly select a game
      const randomGame = games[Math.floor(Math.random() * games.length)];

      // Send the result with a dice emoji
      message.channel.send(
        `🎲 The dice has been rolled! You should play: **${randomGame}**`
      );
    } else if (command === "help") {
      // Send help message
      const helpEmbed = {
        title: "Dog of Wisdom Bot - Help",
        description: "Here are the available commands:",
        color: 0x3498db,
        fields: [
          {
            name: "🎲 Game Commands",
            value: "`!roll` - Roll a dice to decide what game to play",
          },
          {
            name: "⚙️ Admin Commands",
            value:
              "`!toggledaily` - Toggle daily messages on/off\n" +
              "`!togglenicknames` - Toggle weekly nickname changes on/off\n" +
              "Use `/` commands for more admin features",
          },
        ],
        footer: {
          text: "All commands are also available as slash (/) commands",
        },
      };

      message.channel.send({ embeds: [helpEmbed] });
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
      // Display help message
      const helpMessage = `
**Game Commands:**
\`${prefix}roll\` - Roll a dice to decide what game to play

**Admin Commands:**
\`${prefix}toggledaily\` - Toggle daily messages on/off (requires admin role)
\`${prefix}togglenicknames\` - Toggle weekly nickname changes on/off (requires admin role)
\`${prefix}toggleownerdms\` - Toggle server owner DM notifications on/off (requires admin role)
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
        // Send the daily message immediately
        await sendDailyMessage();
        await interaction.editReply("✅ Daily message has been sent manually!");
        console.log(`Daily message sent manually by ${interaction.user.tag}`);
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

        const result = await changeNicknamesToDutchSnacks(guild);

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
    } else if (commandName === "help") {
      // Send help message
      const helpEmbed = {
        title: "Dog of Wisdom Bot - Help",
        description: "Here are the available commands:",
        color: 0x3498db,
        fields: [
          {
            name: "🎲 Game Commands",
            value: "`/roll` - Roll a dice to decide what game to play",
          },
          {
            name: "⚙️ Admin Commands",
            value:
              "`/toggledaily` - Toggle daily messages on/off\n" +
              "`/togglenicknames` - Toggle weekly nickname changes on/off\n" +
              "`/toggleownerdms` - Toggle DM notifications to server owners\n" +
              "`/send-now` - Send the daily message immediately\n" +
              "`/test-nicknames` - Test the nickname change functionality\n" +
              "`/change-nicknames` - Manually change all nicknames\n" +
              "`/test-group-snack` - Test the group snack event\n" +
              "`/check-timezone` - Check the timezone configuration\n" +
              "`/test-owner-dm` - Test sending a nickname suggestion DM\n" +
              "`/send-dm` - Send a direct message to a specific user",
          },
        ],
        footer: {
          text: "All commands are also available with the ! prefix (e.g., !roll)",
        },
      };

      await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
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

// Login to Discord with the bot token
client.login(config.token);
