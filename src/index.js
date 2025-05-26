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

// Import the message generator
const { generateWisdomMessage } = require("./messageGenerator");

// Function to send the daily message with a random user ping
async function sendDailyMessage() {
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return;
    }

    // For each guild, send a message to a random text channel
    for (const guild of guilds.values()) {
      try {
        // Get all text channels the bot has access to
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
        const randomChannel = textChannels.random();

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
        await randomChannel.send(`${randomMessage} <@${randomMember.id}>`);
        console.log(
          `Daily message sent to ${guild.name} in #${randomChannel.name}: "${randomMessage}", pinged: ${randomMember.user.tag}`
        );
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
