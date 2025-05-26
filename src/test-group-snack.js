require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const moment = require("moment-timezone");

// Get the local server timezone
const getLocalTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

// Load configuration from environment variables
const config = {
  token: process.env.BOT_TOKEN,
  timezone: getLocalTimezone(), // Use local server timezone
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

// Import the nickname manager
const { changeNicknamesToDutchSnacks } = require("./nicknameManager");

// Log when the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  // Set a random status
  setRandomStatus();

  console.log(
    "Testing GROUP SNACK feature - everyone (including bots) will get the same Dutch snack nickname..."
  );

  try {
    await testGroupSnack();
    console.log("Group snack test completed successfully!");
  } catch (error) {
    console.error("Error testing group snack:", error);
  } finally {
    // Disconnect the bot after testing
    client.destroy();
    process.exit(0);
  }
});

// Function to set a random status for the bot
function setRandomStatus() {
  const statuses = [
    { type: "WATCHING", name: "for snack lovers" },
    { type: "WATCHING", name: "Dutch cuisine" },
    { type: "WATCHING", name: "snack time" },
    { type: "LISTENING", name: "snack cravings" },
    { type: "LISTENING", name: "Dutch food reviews" },
    { type: "PLAYING", name: "with Dutch snacks" },
    { type: "PLAYING", name: "snack roulette" },
    { type: "COMPETING", name: "snack eating contests" },
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

// Function to test the group snack feature
async function testGroupSnack() {
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return;
    }

    // For each guild, change nicknames with forced group snack
    for (const guild of guilds.values()) {
      try {
        console.log(`\n=== Testing GROUP SNACK for guild: ${guild.name} ===`);

        // Change nicknames to the same Dutch snack (force group snack)
        const result = await changeNicknamesToDutchSnacks(guild, true);

        console.log(`\n=== Results for ${guild.name} ===`);
        console.log(`Nicknames changed successfully: ${result.success}`);
        console.log(`Nicknames failed to change: ${result.failed}`);
        console.log(`Members skipped: ${result.skipped}`);

        if (result.groupSnackUsed) {
          console.log(`\n🎉 GROUP SNACK USED: "${result.groupSnack}" 🎉`);
        }

        if (result.errors.length > 0) {
          console.log("\nErrors encountered:");
          result.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
          });
        }
      } catch (error) {
        console.error(
          `Error testing group snack in guild ${guild.name}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error in testGroupSnack:", error);
    throw error;
  }
}

// Login to Discord with the bot token
client.login(config.token);
