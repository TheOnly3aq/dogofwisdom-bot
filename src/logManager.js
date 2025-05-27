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
  client = discordClient;
  logChannelId = config.logChannelId;

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
  if (!client || !logChannelId) return;

  try {
    const logChannel = await client.channels
      .fetch(logChannelId)
      .catch(() => null);
    if (!logChannel) return;

    // Define colors for different log types
    const colors = {
      info: "#3498db", // Blue
      command: "#2ecc71", // Green
      dm: "#9b59b6", // Purple
      error: "#e74c3c", // Red
      startup: "#f1c40f", // Yellow
      "dm-received": "#1abc9c", // Teal
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
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error(`Error sending log to Discord: ${error.message}`);
  }
}

/**
 * Log a message to console, file, and optionally Discord
 * @param {string} message - The message to log
 * @param {string} type - The type of log (info, command, dm, error)
 * @param {Object} embedData - Optional additional data for Discord embeds
 */
function logMessage(message, type = "info", embedData = null) {
  const timestamp = moment().format("YYYY-MM-DD HH:mm:ss");
  const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

  // Log to console
  console.log(logEntry);

  // Log to file
  const today = moment().format("YYYY-MM-DD");
  const logFile = path.join(logsDir, `${today}.log`);

  fs.appendFileSync(logFile, logEntry + "\n");

  // Log to Discord if enabled
  logToDiscord(message, type, embedData);
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

module.exports = {
  initializeLogger,
  logMessage,
  logCommand,
  logDirectMessage,
  logError,
};
