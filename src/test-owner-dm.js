/**
 * Script to test sending a DM to the server owner
 * Run with: npm run test-owner-dm
 */

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { testOwnerDM } = require("./nicknameManager");

// Create a new Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// Get the bot token from environment variables
const token = process.env.BOT_TOKEN;

if (!token) {
  console.error("Error: BOT_TOKEN is not set in the .env file");
  process.exit(1);
}

// Log when the bot is ready
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  try {
    // Get all guilds the bot is in
    const guilds = client.guilds.cache;
    
    if (guilds.size === 0) {
      console.error("Bot is not in any guilds!");
      process.exit(1);
    }
    
    console.log(`Bot is in ${guilds.size} guild(s)`);
    
    // Process each guild
    for (const guild of guilds.values()) {
      console.log(`Testing owner DM in guild: ${guild.name}`);
      
      try {
        // Test sending a DM to the server owner
        const result = await testOwnerDM(guild);
        
        // Log the result
        if (result.success) {
          console.log(`✅ Successfully sent DM to server owner in ${guild.name}`);
          console.log(`Suggested nickname: ${result.suggestedSnack}`);
        } else {
          console.log(`⚠️ Test completed with issues in ${guild.name}:`);
          
          if (result.ownerFound) {
            console.log(`✅ Server owner found`);
          } else {
            console.log(`❌ Could not find server owner`);
          }
          
          if (result.dmSent) {
            console.log(`✅ DM was sent successfully`);
          } else {
            console.log(`❌ Could not send DM to server owner`);
          }
          
          if (result.error) {
            console.log(`Error: ${result.error}`);
          }
        }
      } catch (error) {
        console.error(`Error testing owner DM in guild ${guild.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error testing owner DM:", error);
  } finally {
    // Always exit when done
    console.log("Test complete. Exiting...");
    process.exit(0);
  }
});

// Login to Discord with the bot token
client.login(token);