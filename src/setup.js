const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to prompt for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setup() {
  console.log("Welcome to the Wisdom Bot setup!");
  console.log("This script will help you configure your bot.\n");

  // Ask for configuration values
  const token = await prompt("Enter your Discord bot token: ");
  const channelId = await prompt(
    "Enter the Discord channel ID where messages will be sent: "
  );
  const message =
    (await prompt(
      'Enter the daily message (default: "Hello everyone! Here\'s your daily wisdom message!"): '
    )) || "Hello everyone! Here's your daily wisdom message!";
  const cronSchedule =
    (await prompt(
      'Enter the cron schedule (default: "0 12 * * *" - every day at 12:00 PM): '
    )) || "0 12 * * *";
  const timezone =
    (await prompt('Enter the timezone (default: "UTC"): ')) || "UTC";

  // Ask which configuration method to use
  const configMethod = (
    await prompt(
      "Do you want to use a config file or .env file? (config/env): "
    )
  ).toLowerCase();

  if (configMethod === "config" || configMethod === "c") {
    // Create config.json
    const config = {
      token,
      channelId,
      message,
      cronSchedule,
      timezone,
    };

    fs.writeFileSync(
      path.join(__dirname, "..", "config.json"),
      JSON.stringify(config, null, 2)
    );
    console.log("Configuration saved to config.json");
  } else {
    // Create .env file
    const envContent = `BOT_TOKEN=${token}
CHANNEL_ID=${channelId}
DAILY_MESSAGE=${message}
CRON_SCHEDULE=${cronSchedule}
TIMEZONE=${timezone}`;

    fs.writeFileSync(path.join(__dirname, "..", ".env"), envContent);
    console.log("Configuration saved to .env file");
  }

  console.log("\nSetup complete! You can now start the bot with:");
  console.log("npm start");

  rl.close();
}

setup().catch((error) => {
  console.error("Error during setup:", error);
  rl.close();
});
