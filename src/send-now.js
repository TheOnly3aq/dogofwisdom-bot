require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// Load configuration from environment variables
const config = {
  token: process.env.BOT_TOKEN,
  channelId: process.env.CHANNEL_ID,
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
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log("Sending wisdom message immediately...");

  try {
    await sendWisdomMessage();
    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Error sending message:", error);
  } finally {
    // Disconnect the bot after sending the message
    client.destroy();
    process.exit(0);
  }
});

// Import the message generator
const { generateWisdomMessage } = require("./messageGenerator");

// Function to send the wisdom message with a random user ping
async function sendWisdomMessage() {
  try {
    const channel = await client.channels.fetch(config.channelId);
    if (!channel) {
      console.error(`Channel with ID ${config.channelId} not found!`);
      return;
    }

    // Get all members from the guild
    const guild = channel.guild;
    const members = await guild.members.fetch();

    // Filter out bots and get a random member
    const humanMembers = members.filter((member) => !member.user.bot);
    if (humanMembers.size === 0) {
      console.error("No human members found in the server!");
      return;
    }

    const randomMember = humanMembers.random();

    // Generate a random wisdom message
    const randomMessage = generateWisdomMessage();

    // Send the message with the random user ping
    await channel.send(`${randomMessage} <@${randomMember.id}>`);
    console.log(
      `Wisdom message sent: "${randomMessage}", pinged: ${randomMember.user.tag}`
    );
  } catch (error) {
    console.error("Error in sendWisdomMessage:", error);
    throw error;
  }
}

// Login to Discord with the bot token
client.login(config.token);
