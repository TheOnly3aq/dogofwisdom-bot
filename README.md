# Dog of Wisdom Bot

A fun Discord bot that sends random "Dog of Wisdom" style messages to a random channel in your server, pinging a random user.

## Features

- 🐶 Sends random Dog of Wisdom style messages (e.g., "ha ba da ga da", "woof", etc.)
- 🎯 Pings a random user with each message
- 📊 Creates a new category and channel 5 minutes before sending the message
- 🕒 Scheduled daily messages (configurable)
- 🎮 Random bot status that changes hourly
- 🔄 Anti-mute system that creates new categories each time
- 🍪 Changes everyone's nickname to a random Dutch snack every Monday at 3 AM
- 🎲 Game selection dice roll command to help decide what to play
- 📝 Comprehensive logging system with Discord channel integration
- 📨 Direct message command for admins (works in DMs and servers)
- 🔐 Configurable permissions via environment variables

## Setup

1. **Create a Discord Bot**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" and give it a name
   - Go to the "Bot" tab and click "Add Bot"
   - Under the "Privileged Gateway Intents" section, enable:
     - SERVER MEMBERS INTENT
     - MESSAGE CONTENT INTENT
   - Copy the bot token (you'll need this for configuration)

2. **Invite the Bot to Your Server**
   - In the Developer Portal, go to the "OAuth2" tab
   - In the "URL Generator" section, select the "bot" scope
   - Select the following permissions:
     - Read Messages/View Channels
     - Send Messages
     - Read Message History
     - Mention Everyone
     - Manage Channels (required for creating new categories)
     - Manage Roles (required for setting permissions on new channels)
     - Manage Nicknames (required for changing member nicknames)
   - Copy the generated URL and open it in your browser to invite the bot to your server

3. **Configure the Bot**
   - Create a `.env` file in the root directory
   - Fill in your bot token and schedule settings (see Configuration section)

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```
   
   Or run one of the test commands:
   ```bash
   npm run send-now         # Test sending a message without pinging users
   npm run test-nicknames   # Test if the bot can change nicknames (without actually changing them)
   npm run change-nicknames # Change everyone's nickname to a Dutch snack immediately
   npm run test-group-snack # Test the "Group Snack Event" where everyone gets the same snack
   npm run check-timezone   # Check the server's timezone configuration
   npm run test-owner-dm    # Test sending a nickname suggestion DM to the server owner
   ```

## Configuration

Configure the bot by creating a `.env` file in the root directory.

### Environment Variables

```
# Required
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
CRON_SCHEDULE=0 9 * * *

# User and role permissions
BOT_OWNER_ID=YOUR_DISCORD_USER_ID
ADMIN_ROLE_ID=ROLE_ID_FOR_ADMIN_COMMANDS
ADMIN_USER_ID=ADDITIONAL_ADMIN_USER_ID

# Logging configuration
LOG_CHANNEL_ID=CHANNEL_ID_FOR_LOGGING

# Optional
# TIMEZONE=UTC  # Optional, defaults to server's local timezone
```

### Configuration Options

- `BOT_TOKEN`: Your Discord bot token
- `CRON_SCHEDULE`: When to send the message (in cron format)
- `BOT_OWNER_ID`: Discord user ID of the bot owner (can use admin commands in DMs)
- `ADMIN_ROLE_ID`: Role ID that grants admin permissions in servers
- `ADMIN_USER_ID`: Additional user ID that can use admin commands (optional)
- `LOG_CHANNEL_ID`: Channel ID where bot logs will be sent (optional)
- `TIMEZONE`: The timezone for the cron schedule (optional, defaults to server's local timezone)

### Message Generation

The bot generates random Dog of Wisdom style messages using three methods:
1. Common patterns from the Dog of Wisdom (30% chance)
2. Repeated syllables like "ba ba ba" (20% chance)
3. Random combinations of syllables (50% chance)

### Bot Status

The bot displays a random status that changes every hour. Statuses include:
- Watching for wisdom seekers
- Listening to ba ha da ga da
- Playing with ancient knowledge
- And more!

### Anti-Mute System

To prevent users from muting the bot's messages:
- The bot creates a new category 5 minutes before sending the daily message
- It then creates a new channel within that category
- The message is sent to this new channel, making it harder for users to mute
- Each day, a completely different category and channel are used

### Dutch Snack Nicknames

Every Monday at 3 AM (server local time), the bot will:
- Change everyone's nickname to a random Dutch snack (including other bots)
- 10% chance for a "Group Snack Event" where everyone gets the same snack
- Skip users with higher roles than the bot (due to Discord permissions)
- Send a direct message to the server owner with a suggested nickname and an interactive button that provides instructions on how to change their nickname (since the bot cannot change the owner's nickname)

Some examples of Dutch snacks used:
- Stroopwafel
- Bitterballen
- Kroket
- Poffertjes
- Hagelslag
- And many more!

### Logging System

The bot includes a comprehensive logging system that records all activities:

- **File Logging**: All logs are saved to daily log files in the `logs` directory
- **Console Logging**: Real-time logs are displayed in the console
- **Discord Channel Logging**: Logs can be sent to a specified Discord channel

#### Log Types
- **Command Logs**: Records who used which commands and with what parameters
- **DM Logs**: Tracks direct messages sent by the bot (with privacy protection)
- **Error Logs**: Detailed error reporting with stack traces
- **Startup Logs**: Configuration information when the bot starts
- **Received DM Logs**: Records when users send direct messages to the bot
- **Mention Logs**: Records when users mention the bot in messages

#### Discord Channel Logging
When configured with a `LOG_CHANNEL_ID`, the bot will send rich embeds to the specified channel with:
- Color-coded logs by type (blue for info, green for commands, red for errors, etc.)
- Structured information in embed fields
- Timestamps for all events
- Truncated message content for privacy

## Bot Commands

The bot supports both traditional prefix commands (starting with `!`) and Discord slash commands (starting with `/`).

### Bot Commands
- `!help` or `/help` - Show the help message with all available commands

### Game Commands
- `!roll` or `/roll` - Roll a dice to randomly select a game to play (chooses between Minecraft, Repo, and Lethal Company)

### Admin Commands
- `!toggledaily` or `/toggledaily` - Toggle daily messages on/off (requires admin permissions)
- `!togglenicknames` or `/togglenicknames` - Toggle weekly nickname changes on/off (requires admin permissions)
- `/send-now` - Send the daily message immediately (requires admin permissions)
- `/test-nicknames` - Test the nickname change functionality without waiting for the schedule (requires admin permissions)
- `/change-nicknames` - Manually change all nicknames to Dutch snacks (requires admin permissions)
- `/test-group-snack` - Test the group snack event where everyone gets the same nickname (requires admin permissions)
- `/check-timezone` - Check the current timezone configuration (requires admin permissions)
- `/test-owner-dm` - Test sending a nickname suggestion DM to the server owner (requires admin permissions)
- `/send-dm` - Send a direct message to any user (requires admin permissions, works in DMs for bot owner)

### Using Slash Commands
Slash commands provide these benefits:
- Auto-completion and parameter hints
- Better visibility in Discord's UI
- No need to remember command prefixes
- Admin commands are only shown to users with appropriate permissions

### Direct Message Command

The `/send-dm` command allows authorized users to send direct messages to any user:

```
/send-dm user:USER_ID_OR_TAG message:YOUR_MESSAGE use_embed:true/false
```

Parameters:
- `user`: Either a Discord user ID (e.g., "123456789012345678") or a Discord user tag (e.g., "username#1234")
- `message`: The message content to send
- `use_embed`: Whether to send the message as a rich embed (optional, default: false)

Permissions:
- In servers: Users with the admin role (configured by `ADMIN_ROLE_ID`)
- In DMs: The bot owner (configured by `BOT_OWNER_ID`) or admin user (configured by `ADMIN_USER_ID`)

This command works both in servers and in direct messages with the bot, making it useful for sending announcements or private messages to users.

## Cron Schedule Format

The cron schedule follows the format: `minute hour day-of-month month day-of-week`

Examples:
- `0 12 * * *`: Every day at 12:00 PM
- `0 9 * * 1-5`: Every weekday at 9:00 AM
- `0 18 * * 0,6`: Every weekend at 6:00 PM

## Running the Bot Continuously

For production use, consider using a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/index.js --name wisdom-bot
pm2 save
```

## Troubleshooting

### Permission Issues

If the bot can't create categories or channels, check the following:

1. **Bot Permissions**: Make sure the bot has the "Manage Channels" and "Manage Roles" permissions in your server.

2. **Role Hierarchy**: The bot's role must be higher in the role list than the roles you want it to manage permissions for. Go to Server Settings > Roles and drag the bot's role higher in the list.

3. **Server Verification Level**: If your server has a high verification level, it might restrict certain actions. Consider lowering it temporarily when setting up the bot.

4. **Channel Limit**: Discord has a limit of 500 channels per server. If you're close to this limit, the bot might not be able to create new channels.

### Fallback Behavior

If the bot can't create a new category and channel, it will fall back to using a random existing text channel. You'll see a message in the console like:
```
Bot doesn't have 'Manage Channels' permission in guild "Your Server". Cannot create category.
Using random channel #general (no prepared channel found)
```



## License

This project is licensed under the MIT License - see the LICENSE file for details.