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
   ```

## Configuration

Configure the bot by creating a `.env` file in the root directory.

### Environment Variables

```
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
CRON_SCHEDULE=0 9 * * *
# TIMEZONE=UTC  # Optional, defaults to server's local timezone
```

### Configuration Options

- `BOT_TOKEN`: Your Discord bot token
- `CRON_SCHEDULE`: When to send the message (in cron format)
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

Some examples of Dutch snacks used:
- Stroopwafel
- Bitterballen
- Kroket
- Poffertjes
- Hagelslag
- And many more!

## Bot Commands

The bot supports both traditional prefix commands (starting with `!`) and Discord slash commands (starting with `/`).

### Music Commands
- `!play [YouTube URL]` or `/play [YouTube URL]` - Play a YouTube video in your voice channel (alias: `!p`)
- `!skip` or `/skip` - Skip the current song (alias: `!s`)
- `!queue` or `/queue` - Show the current music queue (alias: `!q`)
- `!join` or `/join` - Make the bot join your voice channel
- `!leave` or `/leave` - Make the bot leave the voice channel (alias: `!dc`)
- `!help` - Show the help message with all available commands

### Game Commands
- `!roll` or `/roll` - Roll a dice to randomly select a game to play (chooses between Minecraft, Repo, and Lethal Company)

### Admin Commands
- `!toggledaily` or `/toggledaily` - Toggle daily messages on/off (requires the admin role with ID: 1376665402758926487)
- `!togglenicknames` or `/togglenicknames` - Toggle weekly nickname changes on/off (requires the admin role with ID: 1376665402758926487)

### Using Slash Commands
Slash commands provide these benefits:
- Auto-completion and parameter hints
- Better visibility in Discord's UI
- No need to remember command prefixes
- Admin commands are only shown to users with appropriate permissions

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