require("dotenv").config();
const moment = require("moment-timezone");

// Get the local server timezone
const getLocalTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
};

// Get the timezone from .env file if it exists
const getConfigTimezone = () => {
  return process.env.TIMEZONE || "Not set in .env (will use local timezone)";
};

// Display timezone information
console.log("=== Timezone Information ===");
console.log(`Server local timezone: ${getLocalTimezone()}`);
console.log(`Current local time: ${new Date().toLocaleString()}`);
console.log(`Configured timezone in .env: ${getConfigTimezone()}`);
console.log(
  `Current time in configured timezone: ${new Date().toLocaleString("en-US", {
    timeZone: process.env.TIMEZONE || getLocalTimezone(),
  })}`
);

// Display which timezone is being used
const actualTimezone = process.env.TIMEZONE || getLocalTimezone();
console.log(`\n>>> Bot is currently using: ${actualTimezone} <<<`);
console.log(
  "Note: If no timezone is set in .env, the bot will use the server's local timezone."
);
