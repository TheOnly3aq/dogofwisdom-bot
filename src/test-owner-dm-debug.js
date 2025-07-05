/**
 * Debug script to test owner DM functionality specifically
 */

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { changeNicknamesToDutchSnacks } = require("./nicknameManager");

// Configuration
const config = {
  token: process.env.BOT_TOKEN,
  testGuildId: "1354118380873060414", // Replace with your test guild ID
  ownerDMsEnabled: true,
  blacklistedGuilds: [],
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once("ready", async () => {
  console.log(`🤖 Owner DM Debug Bot is ready!`);
  console.log(`Logged in as: ${client.user.tag}`);
  
  try {
    // Get the test guild
    const guild = client.guilds.cache.get(config.testGuildId);
    if (!guild) {
      console.log(`❌ Could not find guild with ID: ${config.testGuildId}`);
      process.exit(1);
    }
    
    console.log(`🏰 Testing in guild: ${guild.name}`);
    console.log(`👑 Guild owner ID: ${guild.ownerId}`);
    
    // Get the owner member
    const owner = await guild.members.fetch(guild.ownerId);
    console.log(`👑 Guild owner: ${owner.user.tag}`);
    
    // Check bot permissions
    const botMember = guild.members.me;
    console.log(`🤖 Bot: ${botMember.user.tag}`);
    console.log(`🔐 Bot has Manage Nicknames: ${botMember.permissions.has("ManageNicknames")}`);
    
    // Check role hierarchy
    console.log(`📊 Bot highest role position: ${botMember.roles.highest.position}`);
    console.log(`📊 Owner highest role position: ${owner.roles.highest.position}`);
    console.log(`📊 Can bot change owner nickname: ${owner.roles.highest.position < botMember.roles.highest.position}`);
    
    console.log(`\n🧪 Testing owner DM functionality...`);
    
    // Test the nickname change function
    const result = await changeNicknamesToDutchSnacks(guild, false, config);
    
    console.log(`\n📊 Results:`);
    console.log(`✅ Success: ${result.success}`);
    console.log(`❌ Failed: ${result.failed}`);
    console.log(`⏭️ Skipped: ${result.skipped}`);
    console.log(`👑 Owner suggestion sent: ${result.ownerSuggestion}`);
    console.log(`🍪 Suggested snack: ${result.suggestedSnack}`);
    
    if (result.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.ownerSuggestion) {
      console.log(`\n✅ Owner DM should have been sent successfully!`);
    } else {
      console.log(`\n❌ Owner DM was not sent. Check the logs above for reasons.`);
    }
    
  } catch (error) {
    console.error(`❌ Error testing owner DM:`, error);
  }
  
  // Shutdown
  setTimeout(() => {
    console.log(`\n🛑 Shutting down debug bot...`);
    client.destroy();
    process.exit(0);
  }, 3000);
});

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

// Login to Discord with the bot token
client.login(config.token).catch((error) => {
  console.error("Failed to login:", error);
  process.exit(1);
});