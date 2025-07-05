/**
 * Test script for nickname monitoring functionality
 */

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { handleNicknameMonitoring } = require("./nicknameMonitor");

// Configuration
const config = {
  token: process.env.BOT_TOKEN,
  monitoredUserId: process.env.MONITORED_USER_ID || "",
  blacklistedGuilds: process.env.BLACKLISTED_GUILDS
    ? process.env.BLACKLISTED_GUILDS.split(",").map((id) => id.trim())
    : [],
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// Simple logging function for testing
function logMessage(message, type, embedData) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  if (embedData) {
    console.log("Additional data:", embedData);
  }
}

// Handle guild member updates (for nickname monitoring)
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    console.log(`\n=== Guild Member Update Detected ===`);
    console.log(`User: ${newMember.user.tag} (${newMember.id})`);
    console.log(`Guild: ${newMember.guild.name} (${newMember.guild.id})`);
    console.log(`Old nickname: ${oldMember.nickname || "None"}`);
    console.log(`New nickname: ${newMember.nickname || "None"}`);
    console.log(`Is monitored user: ${newMember.id === config.monitoredUserId}`);
    
    // Handle nickname monitoring
    await handleNicknameMonitoring(oldMember, newMember, config, logMessage);
    
    console.log(`=== End of Update ===\n`);
  } catch (error) {
    console.error(`Error handling guild member update: ${error.message}`);
    console.error(error.stack);
  }
});

client.once("ready", () => {
  console.log(`\n🤖 Nickname Monitor Test Bot is ready!`);
  console.log(`Logged in as: ${client.user.tag}`);
  console.log(`Monitored user ID: ${config.monitoredUserId || "Not configured"}`);
  console.log(`Blacklisted guilds: ${config.blacklistedGuilds.length > 0 ? config.blacklistedGuilds.join(", ") : "None"}`);
  console.log(`\nWaiting for nickname changes...`);
  console.log(`Press Ctrl+C to stop the test.\n`);
});

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

// Login to Discord with the bot token
client.login(config.token).catch((error) => {
  console.error("Failed to login:", error);
  process.exit(1);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down nickname monitor test...");
  client.destroy();
  process.exit(0);
});