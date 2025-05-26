# Dog of Wisdom Bot

A fun Discord bot that sends random "Dog of Wisdom" style messages to a random channel in your server, pinging a random user.

## Features

- 🐶 Sends random Dog of Wisdom style messages (e.g., "ha ba da ga da", "woof", etc.)
- 🎯 Pings a random user with each message
- 📊 Selects a random text channel to post in
- 🕒 Scheduled daily messages (configurable)
- 🎮 Random bot status that changes hourly

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
   
   Or test it without pinging users:
   ```bash
   npm run send-now
   ```

## Configuration

Configure the bot by creating a `.env` file in the root directory.

### Environment Variables

```
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
CRON_SCHEDULE=0 9 * * *
TIMEZONE=UTC
```

### Configuration Options

- `BOT_TOKEN`: Your Discord bot token
- `CRON_SCHEDULE`: When to send the message (in cron format)
- `TIMEZONE`: The timezone for the cron schedule

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.