require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const cron = require("node-cron");

// Load configuration from environment variables
const config = {
  token: process.env.BOT_TOKEN,
  cronSchedule: process.env.CRON_SCHEDULE || "0 12 * * *", // Default: 12:00 PM every day
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
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(
    `Scheduled to send daily message at: ${config.cronSchedule} (${config.timezone})`
  );

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
          await prepareCategories();
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
        await sendDailyMessage();
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
        console.log("Starting weekly nickname changes to Dutch snacks...");

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
const { changeNicknamesToDutchSnacks } = require("./nicknameManager");

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

// Login to Discord with the bot token
client.login(config.token);
