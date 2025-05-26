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

// Import the nickname manager
const { changeNicknamesToDutchSnacks } = require("./nicknameManager");

// Log when the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  // Set a random status
  setRandomStatus();
  
  console.log("Testing nickname changes to Dutch snacks (no actual changes)...");

  try {
    await testNicknameChanges();
    console.log("Nickname test completed successfully!");
  } catch (error) {
    console.error("Error testing nicknames:", error);
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

// Function to test nickname changes without actually changing them
async function testNicknameChanges() {
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      return;
    }

    // For each guild, test nickname changes
    for (const guild of guilds.values()) {
      try {
        console.log(`\n=== Testing nickname changes for guild: ${guild.name} ===`);
        
        // Check if the bot has the necessary permissions
        const botMember = guild.members.me;
        if (!botMember.permissions.has("ManageNicknames")) {
          console.log(`⚠️ Bot doesn't have 'Manage Nicknames' permission in guild "${guild.name}". Cannot change nicknames.`);
          continue;
        }
        
        // Get all members from the guild
        const members = await guild.members.fetch();
        
        // Count members that can and cannot have their nicknames changed
        let canChange = 0;
        let cannotChange = 0;
        let botCount = 0;
        
        // For each member, check if we can change their nickname
        for (const [memberId, member] of members.entries()) {
          // Skip bots
          if (member.user.bot) {
            botCount++;
            console.log(`👾 Bot user: ${member.user.tag} (skipped)`);
            continue;
          }
          
          // Check role hierarchy
          if (member.roles.highest.position >= botMember.roles.highest.position) {
            cannotChange++;
            console.log(`❌ Cannot change nickname for ${member.user.tag} due to role hierarchy.`);
          } else {
            canChange++;
            console.log(`✅ Can change nickname for ${member.user.tag} (current: "${member.nickname || member.user.username}")`);
          }
        }
        
        console.log(`\n=== Summary for ${guild.name} ===`);
        console.log(`Total members: ${members.size}`);
        console.log(`Members whose nicknames can be changed: ${canChange}`);
        console.log(`Members whose nicknames cannot be changed: ${cannotChange}`);
        console.log(`Bot users (skipped): ${botCount}`);
        
        if (canChange > 0) {
          console.log(`\n✅ Test successful! The bot can change nicknames for ${canChange} members in this guild.`);
        } else {
          console.log(`\n⚠️ Warning: The bot cannot change any nicknames in this guild. Check role hierarchy.`);
        }
      } catch (error) {
        console.error(`Error testing nicknames in guild ${guild.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in testNicknameChanges:", error);
    throw error;
  }
}

// Login to Discord with the bot token
client.login(config.token);