/**
 * Test script to verify audit log functionality for nickname monitoring
 */

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

// Configuration
const config = {
  token: process.env.BOT_TOKEN,
  testGuildId: "1354118380873060414", // Replace with your test guild ID
};

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once("ready", async () => {
  console.log(`🤖 Audit Log Test Bot is ready!`);
  console.log(`Logged in as: ${client.user.tag}`);
  
  try {
    // Get the test guild
    const guild = client.guilds.cache.get(config.testGuildId);
    if (!guild) {
      console.log(`❌ Could not find guild with ID: ${config.testGuildId}`);
      process.exit(1);
    }
    
    console.log(`📋 Testing audit logs in guild: ${guild.name}`);
    
    // Check bot permissions
    const botMember = guild.members.me;
    const hasAuditLogPermission = botMember.permissions.has("ViewAuditLog");
    const hasManageNicknames = botMember.permissions.has("ManageNicknames");
    
    console.log(`🔐 Bot permissions:`);
    console.log(`   - View Audit Log: ${hasAuditLogPermission ? '✅' : '❌'}`);
    console.log(`   - Manage Nicknames: ${hasManageNicknames ? '✅' : '❌'}`);
    
    if (!hasAuditLogPermission) {
      console.log(`⚠️  Bot needs "View Audit Log" permission to identify who changes nicknames`);
    }
    
    if (hasAuditLogPermission) {
      console.log(`\n📜 Fetching recent audit log entries...`);
      
      // Fetch recent audit log entries for member updates
      const auditLogs = await guild.fetchAuditLogs({
        type: 24, // MEMBER_UPDATE
        limit: 5
      });
      
      console.log(`Found ${auditLogs.entries.size} recent member update entries:`);
      
      auditLogs.entries.forEach((entry, index) => {
        const target = entry.target;
        const executor = entry.executor;
        const changes = entry.changes;
        
        console.log(`\n${index + 1}. Entry ID: ${entry.id}`);
        console.log(`   Target: ${target.tag} (${target.id})`);
        console.log(`   Executor: ${executor.tag} (${executor.id})`);
        console.log(`   Created: ${entry.createdAt.toISOString()}`);
        console.log(`   Age: ${Math.round((Date.now() - entry.createdTimestamp) / 1000)} seconds ago`);
        
        if (changes && changes.length > 0) {
          console.log(`   Changes:`);
          changes.forEach(change => {
            console.log(`     - ${change.key}: "${change.old}" → "${change.new}"`);
          });
        }
      });
    }
    
    console.log(`\n✅ Audit log test completed!`);
    console.log(`\nTo test nickname monitoring:`);
    console.log(`1. Make sure the bot has both "Manage Nicknames" and "View Audit Log" permissions`);
    console.log(`2. Set MONITORED_USER_ID in your .env file`);
    console.log(`3. Have someone change the monitored user's nickname`);
    console.log(`4. The bot should revert it and DM the person who made the change`);
    
  } catch (error) {
    console.error(`❌ Error testing audit logs:`, error);
  }
  
  // Shutdown
  setTimeout(() => {
    console.log(`\n🛑 Shutting down test bot...`);
    client.destroy();
    process.exit(0);
  }, 2000);
});

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

// Login to Discord with the bot token
client.login(config.token).catch((error) => {
  console.error("Failed to login:", error);
  process.exit(1);
});