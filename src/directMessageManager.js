/**
 * Utility functions for sending direct messages to users
 */

/**
 * Sends a direct message to a user by their ID or tag
 * @param {Client} client - The Discord client
 * @param {string} userIdentifier - The user's ID or tag (e.g., "username#1234" or "123456789012345678")
 * @param {string} message - The message to send
 * @param {boolean} includeEmbed - Whether to include an embed with the message
 * @returns {Promise<Object>} Object containing the result of the operation
 */
async function sendDirectMessage(client, userIdentifier, message, includeEmbed = false) {
  console.log(`Attempting to send direct message to user: ${userIdentifier}`);

  const result = {
    success: false,
    userFound: false,
    dmSent: false,
    error: null
  };

  try {
    // Determine if the identifier is a user ID (all digits) or a tag
    const isUserId = /^\d+$/.test(userIdentifier);
    let user = null;

    if (isUserId) {
      // Try to fetch the user by ID
      try {
        user = await client.users.fetch(userIdentifier);
        console.log(`Found user by ID: ${user.tag}`);
      } catch (fetchError) {
        console.log(`Could not find user with ID: ${userIdentifier}`);
        result.error = `Could not find user with ID: ${userIdentifier}`;
        return result;
      }
    } else {
      // Try to find the user by tag
      // Note: This requires searching through all users the bot can see
      // which might not be efficient for large bots
      const allUsers = client.users.cache;
      user = allUsers.find(u => u.tag === userIdentifier);
      
      if (!user) {
        console.log(`Could not find user with tag: ${userIdentifier}`);
        result.error = `Could not find user with tag: ${userIdentifier}`;
        return result;
      }
      console.log(`Found user by tag: ${user.tag}`);
    }

    if (!user) {
      result.error = `User not found: ${userIdentifier}`;
      return result;
    }

    result.userFound = true;

    // Prepare the message content
    let messageOptions = { content: message };

    // Add an embed if requested
    if (includeEmbed) {
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Message from Dog of Wisdom Bot')
        .setDescription(message)
        .setTimestamp()
        .setFooter({ text: 'Sent with wisdom and love 🐶' });

      messageOptions = {
        content: 'You have received a message:',
        embeds: [embed]
      };
    }

    // Send the DM
    try {
      await user.send(messageOptions);
      console.log(`Successfully sent DM to ${user.tag}`);
      result.dmSent = true;
      result.success = true;
    } catch (dmError) {
      console.log(`Could not send DM to ${user.tag}: ${dmError.message}`);
      result.error = `Could not send DM: ${dmError.message}`;
    }

    return result;
  } catch (error) {
    console.error(`Error in sendDirectMessage:`, error);
    result.error = error.message;
    return result;
  }
}

module.exports = {
  sendDirectMessage
};