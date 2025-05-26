# Wisdom Bot

A Discord bot that sends a daily message and pings a random user in your server.

## Features

- Sends a customizable message once a day
- Pings a random user in the server
- Configurable message content, channel, and schedule
- Easy to set up and deploy

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
   - Copy the `.env.example` file to `.env` or create a `config.json` file based on `config.example.json`
   - Fill in your bot token, channel ID, and customize the message

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start the Bot**
   ```bash
   node src/index.js
   ```

## Configuration

You can configure the bot using either a `config.json` file or environment variables.

### Using config.json

Create a `config.json` file in the root directory with the following structure:

```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "channelId": "YOUR_DISCORD_CHANNEL_ID",
  "message": "Hello everyone! Here's your daily wisdom message!",
  "cronSchedule": "0 12 * * *",
  "timezone": "UTC"
}
```

### Using Environment Variables

Alternatively, you can use environment variables by creating a `.env` file:

```
BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
CHANNEL_ID=YOUR_DISCORD_CHANNEL_ID
DAILY_MESSAGE=Hello everyone! Here's your daily wisdom message!
CRON_SCHEDULE=0 12 * * *
TIMEZONE=UTC
```

### Configuration Options

- `token`: Your Discord bot token
- `channelId`: The ID of the channel where messages will be sent
- `message`: The message content to be sent daily
- `cronSchedule`: When to send the message (in cron format)
- `timezone`: The timezone for the cron schedule

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