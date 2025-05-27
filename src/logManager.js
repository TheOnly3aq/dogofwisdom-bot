/**
 * Utility for logging bot activities and user interactions
 */
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const { EmbedBuilder } = require("discord.js");

// Global variables
let client = null;
let logChannelId = null;

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Initialize the logger with Discord client and config
 * @param {Object} discordClient - The Discord.js client
 * @param {Object} config - The bot configuration
 */
function initializeLogger(discordClient, config) {
  console.log(`[DEBUG] Initializing logger with client: ${!!discordClient}`);
  console.log(`[DEBUG] Log channel ID from config: ${config.logChannelId}`);

  client = discordClient;
  logChannelId = config.logChannelId;

  console.log(`[DEBUG] Logger initialized with channel ID: ${logChannelId}`);

  // Test the channel connection
  if (client && logChannelId) {
    client.channels
      .fetch(logChannelId)
      .then((channel) => {
        console.log(
          `[DEBUG] Successfully connected to log channel: ${channel.name}`
        );
      })
      .catch((error) => {
        console.error(
          `[DEBUG] Failed to connect to log channel: ${error.message}`
        );
      });
  }

  console.log(`[DEBUG] Calling logMessage for startup`);
  logMessage(
    `Logger initialized. Discord channel logging ${
      logChannelId ? "enabled" : "disabled"
    }.`,
    "startup"
  );
}

/**
 * Send a log message to the configured Discord channel
 * @param {string} message - The message to log
 * @param {string} type - The type of log
 * @param {Object} embedData - Optional additional data for rich embeds
 */
async function logToDiscord(message, type, embedData = null) {
  // Debug logging
  console.log(`[DEBUG] logToDiscord called with type: ${type}`);
  console.log(
    `[DEBUG] client exists: ${!!client}, logChannelId: ${logChannelId}`
  );

  if (!client || !logChannelId) {
    console.log(
      `[DEBUG] Skipping Discord logging: client or logChannelId not set`
    );
    return;
  }

  try {
    console.log(`[DEBUG] Attempting to fetch channel: ${logChannelId}`);
    const logChannel = await client.channels
      .fetch(logChannelId)
      .catch((error) => {
        console.error(`[DEBUG] Error fetching channel: ${error.message}`);
        return null;
      });

    if (!logChannel) {
      console.log(
        `[DEBUG] Could not find log channel with ID: ${logChannelId}`
      );
      return;
    }

    console.log(`[DEBUG] Found log channel: ${logChannel.name || "Unknown"}`);

    // Define colors for different log types
    const colors = {
      info: "#3498db", // Blue
      command: "#2ecc71", // Green
      dm: "#9b59b6", // Purple
      error: "#e74c3c", // Red
      startup: "#f1c40f", // Yellow
      "dm-received": "#1abc9c", // Teal
      "message-received": "#e67e22", // Orange
    };

    // Create a rich embed for the log
    const embed = new EmbedBuilder()
      .setColor(colors[type] || "#7f8c8d")
      .setTitle(`${type.toUpperCase()} Log`)
      .setDescription(message)
      .setTimestamp();

    // Add additional fields if provided
    if (embedData) {
      Object.entries(embedData).forEach(([key, value]) => {
        if (value) {
          embed.addFields({ name: key, value: String(value) });
        }
      });
    }

    // Send the log message
    console.log(`[DEBUG] Sending embed to channel ${logChannel.name}`);
    const sentMessage = await logChannel.send({ embeds: [embed] });
    console.log(
      `[DEBUG] Successfully sent message to Discord: ${sentMessage.id}`
    );
    return true;
  } catch (error) {
    console.error(`Error sending log to Discord: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

/**
 * Log a message to console, file, and optionally Discord
 * @param {string} message - The message to log
 * @param {string} type - The type of log (info, command, dm, error)
 * @param {Object} embedData - Optional additional data for Discord embeds
 * @param {boolean} skipDiscord - Whether to skip Discord logging (to prevent circular calls)
 */
function logMessage(
  message,
  type = "info",
  embedData = null,
  skipDiscord = false
) {
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

  // Log to console
  console.log(logEntry);

  // Log to file
  const today = moment().format("YYYY-MM-DD");
  const logFile = path.join(logsDir, `${today}.log`);

  fs.appendFileSync(logFile, logEntry + "\n");

  // Log to Discord if enabled and not skipped
  if (!skipDiscord) {
    console.log(`[DEBUG] Sending log to Discord: ${type}`);
    logToDiscord(message, type, embedData).catch((error) => {
      console.error(`[DEBUG] Error in logToDiscord: ${error.message}`);
      // Log the error to console and file, but skip Discord to prevent loops
      logMessage(
        `Error sending log to Discord: ${error.message}`,
        "error",
        null,
        true
      );
    });
  }
}

/**
 * Log command usage
 * @param {Object} interaction - The Discord interaction
 * @param {string} commandName - The name of the command
 * @param {Object} options - The command options
 */
function logCommand(interaction, commandName, options = {}) {
  const user = interaction.user;
  const guild = interaction.guild ? interaction.guild.name : "DM";

  // Mask sensitive information in options
  const maskedOptions = { ...options };
  if (maskedOptions.message) {
    maskedOptions.message = `"${maskedOptions.message.substring(0, 20)}${
      maskedOptions.message.length > 20 ? "..." : ""
    }"`;
  }

  const message = `User ${user.tag} (${user.id}) in ${guild} used command /${commandName}`;

  // Create embed data for Discord logging
  const embedData = {
    User: `${user.tag} (${user.id})`,
    Location: guild,
    Command: `/${commandName}`,
    Options:
      Object.keys(maskedOptions).length > 0
        ? JSON.stringify(maskedOptions)
        : "None",
  };

  logMessage(message, "command", embedData);
}

/**
 * Log direct messages sent by the bot
 * @param {string} senderTag - Tag of the user who initiated the DM
 * @param {string} senderId - ID of the user who initiated the DM
 * @param {string} recipientTag - Tag of the recipient
 * @param {string} recipientId - ID of the recipient
 * @param {string} message - The message content (truncated for privacy)
 * @param {boolean} success - Whether the message was sent successfully
 */
function logDirectMessage(
  senderTag,
  senderId,
  recipientTag,
  recipientId,
  message,
  success
) {
  // Truncate message for privacy in logs
  const truncatedMessage =
    message.length > 30 ? `${message.substring(0, 30)}...` : message;

  const status = success ? "SUCCESS" : "FAILED";

  const logMsg = `[${status}] DM from ${senderTag} (${senderId}) to ${recipientTag} (${recipientId}): ${truncatedMessage}`;

  // Create embed data for Discord logging
  const embedData = {
    Status: status,
    Sender: `${senderTag} (${senderId})`,
    Recipient: `${recipientTag} (${recipientId})`,
    Message: truncatedMessage,
  };

  logMessage(logMsg, "dm", embedData);
}

/**
 * Log errors
 * @param {string} context - The context where the error occurred
 * @param {Error} error - The error object
 */
function logError(context, error) {
  const message = `Error in ${context}: ${error.message}`;

  // Create embed data for Discord logging
  const embedData = {
    Context: context,
    Error: error.message,
    Stack: error.stack ? error.stack.substring(0, 1000) : "No stack trace",
  };

  logMessage(message, "error", embedData);
}

/**
 * Test the Discord logging functionality
 * @returns {Promise<boolean>} Whether the test was successful
 */
async function testDiscordLogging() {
  console.log(`[DEBUG] Testing Discord logging functionality`);

  if (!client || !logChannelId) {
    console.log(
      `[DEBUG] Cannot test Discord logging: client or logChannelId not set`
    );
    return false;
  }

  try {
    const testEmbed = {
      Test: "This is a test message",
      Timestamp: new Date().toISOString(),
    };

    const result = await logToDiscord(
      "This is a test message to verify Discord logging is working correctly.",
      "info",
      testEmbed
    );

    return result;
  } catch (error) {
    console.error(`[DEBUG] Test Discord logging failed: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

module.exports = {
  initializeLogger,
  logMessage,
  logCommand,
  logDirectMessage,
  logError,
  testDiscordLogging,
};
