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
  joinChannel,
  leaveChannel,
  playYouTube,
  skipSong,
  getQueue,
} = require("./musicPlayer");

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
  adminRoleId: "1376665402758926487", // Role ID that can control bot features
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
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
];

// Log when the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(
    `Scheduled to send daily message at: ${config.cronSchedule} (${config.timezone})`
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
            const result = await changeNicknamesToDutchSnacks(guild);

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

// Handle slash command interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  try {
    // Game commands
    if (commandName === 'roll') {
      // List of games to roll from
      const games = ["Minecraft", "Repo", "Lethal Company"];
      
      // Randomly select a game
      const randomGame = games[Math.floor(Math.random() * games.length)];
      
      // Send the result with a dice emoji
      await interaction.reply(`🎲 The dice has been rolled! You should play: **${randomGame}**`);
    } 
    
    // Admin commands
    else if (commandName === 'toggledaily') {
      // Check if the user has the required admin role
      const member = interaction.member;
      if (!member.roles.cache.has(config.adminRoleId)) {
        return interaction.reply({
          content: "❌ You don't have permission to use this command. You need the admin role.",
          ephemeral: true // Only visible to the command user
        });
      }
      
      // Toggle the daily messages state
      config.dailyMessagesEnabled = !config.dailyMessagesEnabled;
      
      // Send confirmation message
      const status = config.dailyMessagesEnabled ? "enabled" : "disabled";
      await interaction.reply(`✅ Daily messages have been **${status}**!`);
      
      // Log the change
      console.log(`Daily messages ${status} by ${interaction.user.tag}`);
    } 
    
    else if (commandName === "togglenicknames") {
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
        const result = await changeNicknamesToDutchSnacks(guild);

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
        const result = await changeNicknamesToDutchSnacks(guild, true);

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

        const result = await testOwnerDM(guild);

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
    console.error('Error handling slash command:', error);
    
    // If the interaction hasn't been replied to yet, send an error message
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: `❌ An error occurred: ${error.message}`, 
        ephemeral: true 
      });
    } else if (interaction.deferred) {
      await interaction.editReply(`❌ An error occurred: ${error.message}`);
    }
  }
});

// Login to Discord with the bot token
client.login(config.token);
