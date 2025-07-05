# Nickname Monitoring Feature

## Overview

The nickname monitoring feature automatically reverts a specific user's nickname changes back to random Dutch snack names and sends "Nuh Uh" to a configured main channel. This is perfect for keeping someone's nickname consistently themed while publicly announcing their failed attempt!

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# User ID to monitor for nickname changes - when this user changes their nickname, it will be changed back to a random Dutch snack
MONITORED_USER_ID=590892077496270858

# Channel ID where "Nuh Uh" messages should be sent when nickname monitoring triggers
MAIN_CHANNEL_ID=1354118380873060414
```

To find IDs:

1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click on the user and select "Copy User ID"
3. Right-click on the channel and select "Copy Channel ID"

## How It Works

1. **Monitoring**: The bot listens for nickname changes across all servers it's in
2. **Detection**: When the monitored user changes their nickname, the bot detects it
3. **Reversion**: The bot automatically changes their nickname to a random Dutch snack
4. **Channel Message**: The bot sends "Nuh Uh" to the configured main channel
5. **Cooldown**: A 5-second cooldown prevents infinite loops when the bot changes the nickname

## Features

### Automatic Monitoring

- Monitors the specified user across all servers
- Only triggers for the configured user ID
- Respects server blacklists and permissions

### Anti-Loop Protection

- 5-second cooldown after bot changes a nickname
- Prevents infinite loops from bot-triggered changes
- Automatic cleanup of cooldown tracking

### Permission Handling

- Checks bot permissions before attempting changes
- Respects Discord's role hierarchy
- Uses audit logs to identify who made the change (requires "View Audit Log" permission)
- Logs permission issues for debugging

### Logging

- Logs all nickname monitoring activities
- Includes detailed information about changes
- Tracks message delivery status
- Separate log types for successes and errors

## Commands

### `/test-nickname-monitor` (Admin Only)

Tests the nickname monitoring feature by:

1. Changing the monitored user's nickname to "Test Nickname"
2. Setting a cooldown to prevent immediate reversion
3. Instructing you to manually change the nickname to see the monitoring in action

## Testing

### Manual Testing

1. Run the bot with `npm start`
2. Use `/test-nickname-monitor` command in a server
3. Manually change the monitored user's nickname
4. Watch it get reverted to a Dutch snack name and see "Nuh Uh" appear in the main channel!

### Dedicated Test Script

Run the nickname monitoring test script:

```bash
npm run test-nickname-monitor
```

This script:

- Only monitors nickname changes (minimal bot functionality)
- Provides detailed console output for debugging
- Shows exactly when and why the monitoring triggers

## Dutch Snack Names

The bot uses the same list of Dutch snacks as the regular nickname changing feature, including:

- Stroopwafel
- Bitterballen
- Kroket
- Frikandel
- Poffertjes
- And many more!

## Troubleshooting

### Bot Not Responding to Nickname Changes

1. Check that `MONITORED_USER_ID` is set correctly
2. Check that `MAIN_CHANNEL_ID` is set correctly
3. Verify the bot has "Manage Nicknames" permission
4. Verify the bot has "Send Messages" permission in the main channel
5. Ensure the bot's role is higher than the monitored user's highest role
6. Check if the server is blacklisted

### Infinite Loop Issues

The cooldown system should prevent this, but if you experience issues:

1. Check the console logs for cooldown messages
2. Verify the cooldown duration (5 seconds by default)
3. Restart the bot to clear any stuck cooldowns

### Permission Errors

- Bot needs "Manage Nicknames" permission
- Bot needs "Send Messages" permission in the main channel
- Bot's role must be higher than the target user's highest role
- Server owner nicknames cannot be changed by bots

### Message Delivery Issues

- Bot may not have permission to send messages in the configured channel
- The main channel may not exist or may have been deleted
- The channel may not be a text channel
- The bot will still change the nickname even if message sending fails

## Configuration Examples

### Basic Setup

```env
MONITORED_USER_ID=123456789012345678
MAIN_CHANNEL_ID=987654321098765432
```

### With Server Blacklist

```env
MONITORED_USER_ID=123456789012345678
MAIN_CHANNEL_ID=987654321098765432
BLACKLISTED_GUILDS=111111111111111111,222222222222222222
```

The monitoring will work in all servers except the blacklisted ones.
