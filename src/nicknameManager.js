/**
 * Utility functions for managing Discord nicknames
 */

// Funny real names for stupid but hilarious Discord nicknames
const funnyNames = [
  // Classic stupid names
  "Dick Butkus",
  "Rusty Kuntz",
  "Dick Trickle",
  "Dick Pole",
  "Dick Pound",
  "Dick Smothers",
  "Dick Van Dyke",
  "Dick Cheney",
  "Dick Vitale",
  "Dick Wolf",

  // More ridiculous real names
  "Harry Baals",
  "Harry Dick",
  "Harry Johnson",
  "Harry Cox",
  "Harry Weiner",
  "Harry Butts",
  "Harry Pussy",
  "Harry Sack",
  "Harry Nuts",
  "Harry Balls",

  // Silly but real names
  "Ben Dover",
  "Ben Gay",
  "Ben Johnson",
  "Ben Dover Jr",
  "Ben Dover Sr",
  "Ben Dover III",
  "Ben Dover IV",
  "Ben Dover V",
  "Ben Dover VI",
  "Ben Dover VII",

  // Funny last names
  "Mike Hunt",
  "Mike Litoris",
  "Mike Oxlong",
  "Mike Hawk",
  "Mike Rotch",
  "Mike Hunt Jr",
  "Mike Hunt Sr",
  "Mike Hunt III",
  "Mike Hunt IV",
  "Mike Hunt V",

  // More creative combinations
  "Hugh Jass",
  "Hugh Janus",
  "Hugh Mungus",
  "Hugh G. Rection",
  "Hugh Jorgan",
  "Hugh Hefner",
  "Hugh Grant",
  "Hugh Laurie",
  "Hugh Jackman",
  "Hugh Bonneville",

  // Silly but real names
  "Willie Stroker",
  "Willie Nelson",
  "Willie Mays",
  "Willie Wonka",
  "Willie Shakespeare",
  "Willie Wonka Jr",
  "Willie Wonka Sr",
  "Willie Wonka III",
  "Willie Wonka IV",
  "Willie Wonka V",

  // More ridiculous names
  "Peter File",
  "Peter Griffin",
  "Peter Parker",
  "Peter Pan",
  "Peter Piper",
  "Peter Rabbit",
  "Peter Venkman",
  "Peter Quill",
  "Peter Pettigrew",
  "Peter Dinklage",

  // Funny combinations
  "Jack Mehoff",
  "Jack Daniels",
  "Jack Black",
  "Jack White",
  "Jack Johnson",
  "Jack Nicholson",
  "Jack Lemmon",
  "Jack Lemmon Jr",
  "Jack Lemmon Sr",
  "Jack Lemmon III",

  // More silly names
  "Phil McCrackin",
  "Phil Collins",
  "Phil Jackson",
  "Phil Mickelson",
  "Phil Spector",
  "Phil McGraw",
  "Phil Donahue",
  "Phil Hartman",
  "Phil Silvers",
  "Phil Harris",

  // Ridiculous but real names
  "Seymour Butts",
  "Seymour Hersh",
  "Seymour Skinner",
  "Seymour Cray",
  "Seymour Papert",
  "Seymour Benzer",
  "Seymour Hersh",
  "Seymour Hersh Jr",
  "Seymour Hersh Sr",
  "Seymour Hersh III",

  // More funny names
  "Dixie Normous",
  "Dixie Carter",
  "Dixie Chicks",
  "Dixie Lee Ray",
  "Dixie Dean",
  "Dixie Walker",
  "Dixie Howell",
  "Dixie Evans",
  "Dixie Kong",
  "Dixie Kong Jr",

  // Silly but real names
  "Anita Bath",
  "Anita Baker",
  "Anita Hill",
  "Anita Bryant",
  "Anita O'Day",
  "Anita Ekberg",
  "Anita Page",
  "Anita Louise",
  "Anita Stewart",
  "Anita Garibaldi",

  // More ridiculous names
  "Eileen Dover",
  "Eileen Brennan",
  "Eileen Heckart",
  "Eileen Atkins",
  "Eileen Davidson",
  "Eileen Ford",
  "Eileen Gray",
  "Eileen Ivers",
  "Eileen Joyce",
  "Eileen O'Higgins",

  // Funny combinations
  "Wayne Kerr",
  "Wayne Gretzky",
  "Wayne Newton",
  "Wayne Brady",
  "Wayne Knight",
  "Wayne Rooney",
  "Wayne Shorter",
  "Wayne Static",
  "Wayne Wang",
  "Wayne Wang Jr",

  // More silly names
  "Pat Myaz",
  "Pat Sajak",
  "Pat Boone",
  "Pat Benatar",
  "Pat Morita",
  "Pat Robertson",
  "Pat Riley",
  "Pat Summit",
  "Pat Tillman",
  "Pat Tillman Jr",

  // Ridiculous but real names
  "Chris P. Bacon",
  "Chris Rock",
  "Chris Evans",
  "Chris Hemsworth",
  "Chris Pratt",
  "Chris Pine",
  "Chris Brown",
  "Chris Martin",
  "Chris Cornell",
  "Chris Farley",

  // More funny names
  "Justin Case",
  "Justin Timberlake",
  "Justin Bieber",
  "Justin Trudeau",
  "Justin Theroux",
  "Justin Long",
  "Justin Hartley",
  "Justin Chambers",
  "Justin Chatwin",
  "Justin Chatwin Jr",

  // Silly but real names
  "Barry McCockiner",
  "Barry Manilow",
  "Barry White",
  "Barry Bonds",
  "Barry Sanders",
  "Barry Goldwater",
  "Barry Gibb",
  "Barry Levinson",
  "Barry Sonnenfeld",
  "Barry Sonnenfeld Jr",

  // More ridiculous names
  "Terry Cloth",
  "Terry Crews",
  "Terry Bradshaw",
  "Terry Gilliam",
  "Terry Jones",
  "Terry Pratchett",
  "Terry O'Quinn",
  "Terry Kinney",
  "Terry Kinney Jr",
  "Terry Kinney Sr",

  // Funny combinations
  "Randy Marsh",
  "Randy Johnson",
  "Randy Quaid",
  "Randy Newman",
  "Randy Travis",
  "Randy Jackson",
  "Randy Orton",
  "Randy Moss",
  "Randy Savage",
  "Randy Savage Jr",

  // More silly names
  "Doug Hole",
  "Doug Flutie",
  "Doug E. Fresh",
  "Doug Liman",
  "Doug Jones",
  "Doug Bradley",
  "Doug Hutchison",
  "Doug Savant",
  "Doug Savant Jr",
  "Doug Savant Sr",

  // Ridiculous but real names
  "Nick Gurr",
  "Nick Nolte",
  "Nick Cage",
  "Nick Offerman",
  "Nick Swardson",
  "Nick Kroll",
  "Nick Cannon",
  "Nick Lachey",
  "Nick Jonas",
  "Nick Jonas Jr",

  // More funny names
  "Tom Foolery",
  "Tom Hanks",
  "Tom Cruise",
  "Tom Brady",
  "Tom Selleck",
  "Tom Petty",
  "Tom Waits",
  "Tom Jones",
  "Tom Arnold",
  "Tom Arnold Jr",

  // Silly but real names
  "Bill Ding",
  "Bill Gates",
  "Bill Clinton",
  "Bill Murray",
  "Bill Cosby",
  "Bill Nye",
  "Bill Maher",
  "Bill O'Reilly",
  "Bill Paxton",
  "Bill Paxton Jr",

  // More ridiculous names
  "Al Coholic",
  "Al Pacino",
  "Al Gore",
  "Al Sharpton",
  "Al Green",
  "Al Roker",
  "Al Michaels",
  "Al Michaels Jr",
  "Al Michaels Sr",
  "Al Michaels III",

  // Funny combinations
  "Gene Pool",
  "Gene Hackman",
  "Gene Wilder",
  "Gene Kelly",
  "Gene Simmons",
  "Gene Autry",
  "Gene Tierney",
  "Gene Tierney Jr",
  "Gene Tierney Sr",
  "Gene Tierney III",

  // More silly names
  "Sue Permarket",
  "Sue Ellen",
  "Sue Grafton",
  "Sue Monk Kidd",
  "Sue Townsend",
  "Sue Johanson",
  "Sue Johanson Jr",
  "Sue Johanson Sr",
  "Sue Johanson III",
  "Sue Johanson IV",

  // Ridiculous but real names
  "Mary Christmas",
  "Mary Poppins",
  "Mary Tyler Moore",
  "Mary Steenburgen",
  "Mary McDonnell",
  "Mary McDonnell Jr",
  "Mary McDonnell Sr",
  "Mary McDonnell III",
  "Mary McDonnell IV",
  "Mary McDonnell V",

  // More funny names
  "April Showers",
  "April O'Neil",
  "April Bowlby",
  "April Grace",
  "April Matson",
  "April Matson Jr",
  "April Matson Sr",
  "April Matson III",
  "April Matson IV",
  "April Matson V",

  // Silly but real names
  "May Flowers",
  "May West",
  "May Britt",
  "May Robson",
  "May Whitty",
  "May Whitty Jr",
  "May Whitty Sr",
  "May Whitty III",
  "May Whitty IV",
  "May Whitty V",

  // More ridiculous names
  "June Bug",
  "June Lockhart",
  "June Allyson",
  "June Havoc",
  "June Havoc Jr",
  "June Havoc Sr",
  "June Havoc III",
  "June Havoc IV",
  "June Havoc V",
  "June Havoc VI",

  // Funny combinations
  "July Fourth",
  "July Garland",
  "July Garland Jr",
  "July Garland Sr",
  "July Garland III",
  "July Garland IV",
  "July Garland V",
  "July Garland VI",
  "July Garland VII",
  "July Garland VIII",

  // More silly names
  "August West",
  "August Wilson",
  "August Strindberg",
  "August Strindberg Jr",
  "August Strindberg Sr",
  "August Strindberg III",
  "August Strindberg IV",
  "August Strindberg V",
  "August Strindberg VI",
  "August Strindberg VII",

  // Ridiculous but real names
  "September Morn",
  "September Morn Jr",
  "September Morn Sr",
  "September Morn III",
  "September Morn IV",
  "September Morn V",
  "September Morn VI",
  "September Morn VII",
  "September Morn VIII",
  "September Morn IX",

  // More funny names
  "October Sky",
  "October Sky Jr",
  "October Sky Sr",
  "October Sky III",
  "October Sky IV",
  "October Sky V",
  "October Sky VI",
  "October Sky VII",
  "October Sky VIII",
  "October Sky IX",

  // Silly but real names
  "November Rain",
  "November Rain Jr",
  "November Rain Sr",
  "November Rain III",
  "November Rain IV",
  "November Rain V",
  "November Rain VI",
  "November Rain VII",
  "November Rain VIII",
  "November Rain IX",

  // More ridiculous names
  "December Bride",
  "December Bride Jr",
  "December Bride Sr",
  "December Bride III",
  "December Bride IV",
  "December Bride V",
  "December Bride VI",
  "December Bride VII",
  "December Bride VIII",
  "December Bride IX",
];

module.exports.funnyNames = funnyNames;

/**
 * Changes all members' nicknames in a guild to random funny names
 * @param {Guild} guild - The Discord guild to change nicknames in
 * @param {boolean} forceGroupName - Force everyone to have the same funny name (for testing)
 * @param {Object} config - Configuration object with settings
 * @param {boolean} forceBattleMode - Force battle mode (Pewdiepie vs T-Series) for testing
 * @returns {Promise<Object>} Object containing success and failure counts, including battle results
 */
async function changeNicknamesToFunnyNames(
  guild,
  forceGroupName = false,
  config = { ownerDMsEnabled: true, blacklistedGuilds: [] },
  forceBattleMode = false
) {
  // Check if the guild is blacklisted
  if (config.blacklistedGuilds && config.blacklistedGuilds.includes(guild.id)) {
    console.log(
      `Guild "${guild.name}" (${guild.id}) is blacklisted. Skipping nickname changes.`
    );
    return {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [`Guild "${guild.name}" is blacklisted`],
      groupNameUsed: false,
      groupName: null,
    };
  }

  console.log(`Changing nicknames in guild "${guild.name}" to funny names...`);

  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    groupNameUsed: false,
    groupName: null,
    battleModeUsed: false,
    pewdiepieCount: 0,
    tseriesCount: 0,
    ownerSuggestion: false,
    suggestedEmoji: null,
  };

  try {
    // Get all members from the guild
    const members = await guild.members.fetch();

    // Check if the bot has the necessary permissions
    const botMember = guild.members.me;
    if (!botMember.permissions.has("ManageNicknames")) {
      console.log(
        `Bot doesn't have 'Manage Nicknames' permission in guild "${guild.name}". Cannot change nicknames.`
      );
      result.errors.push(
        `Missing 'Manage Nicknames' permission in guild "${guild.name}"`
      );
      return result;
    }

    // Determine which special event to use
    const randomValue = Math.random();
    const useGroupName =
      forceGroupName ||
      (randomValue < 0.1 && randomValue >= 0.05 && !forceBattleMode); // 5% chance
    const useBattleMode =
      forceBattleMode || (randomValue < 0.05 && !forceGroupName); // 5% chance for battle mode
    let groupName = null;
    let battleMode = false;

    if (useGroupName) {
      // Select one funny name for everyone
      groupName = funnyNames[Math.floor(Math.random() * funnyNames.length)];
      console.log(
        `🎉 GROUP NAME EVENT! Everyone will be named "${groupName}" 🎉`
      );
      result.groupNameUsed = true;
      result.groupName = groupName;
    } else if (useBattleMode) {
      // Battle mode: split between Pewdiepie and T-Series
      battleMode = true;
      console.log(
        `⚔️ BATTLE MODE! The great war begins - Pewdiepie vs T-Series! ⚔️`
      );
      result.battleModeUsed = true;
    }

    // First, handle the bot's own nickname
    try {
      // Determine which funny name to use for the bot
      let botEmojiToUse;
      if (useGroupName) {
        // Use the group name
        botEmojiToUse = groupName;
      } else if (battleMode) {
        // In battle mode, bot gets a random choice between Pewdiepie and T-Series
        botEmojiToUse = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
        if (botEmojiToUse === "Pewdiepie") {
          result.pewdiepieCount++;
        } else {
          result.tseriesCount++;
        }
      } else {
        // Get a random emoji sentence
        botEmojiToUse =
          funnyNames[Math.floor(Math.random() * funnyNames.length)];
      }

      // Store the original nickname for logging
      const originalBotNickname = botMember.nickname || botMember.user.username;

      // Set the bot's nickname
      await botMember.setNickname(
        botEmojiToUse,
        "Weekly emoji sentence nickname change"
      );

      console.log(
        `Changed bot's own nickname from "${originalBotNickname}" to "${botEmojiToUse}"`
      );
      result.success++;
    } catch (error) {
      console.error(`Error changing bot's own nickname:`, error);
      result.failed++;
      result.errors.push(`Error for bot: ${error.message}`);
    }

    // For each member, set a Dutch snack as nickname
    for (const [memberId, member] of members.entries()) {
      try {
        // Skip the bot as we already handled it
        if (member.id === botMember.id) {
          continue;
        }

        // Check if member has higher roles than the bot (can't change their nicknames)
        if (member.roles.highest.position >= botMember.roles.highest.position) {
          // Determine which funny name would have been used
          let suggestedEmoji;
          if (useGroupName) {
            suggestedEmoji = groupName;
          } else if (battleMode) {
            suggestedEmoji = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
          } else {
            suggestedEmoji =
              funnyNames[Math.floor(Math.random() * funnyNames.length)];
          }

          // Check if this is the server owner
          const isOwner = member.id === guild.ownerId;

          if (isOwner) {
            // Check if owner DMs are enabled
            if (!config.ownerDMsEnabled) {
              console.log(
                `${member.user.tag} is the server owner, but owner DMs are disabled. Skipping DM.`
              );
              result.skipped++;
              continue;
            }

            console.log(
              `${member.user.tag} is the server owner. Sending DM with nickname suggestion.`
            );

            // Try to send a DM to the server owner with a button
            try {
              // Import the necessary Discord.js components
              const {
                ActionRowBuilder,
                ButtonBuilder,
                ButtonStyle,
              } = require("discord.js");

              // Create a button for changing nickname
              const changeNicknameButton = new ButtonBuilder()
                .setCustomId(
                  `change_nickname_${guild.id}_${suggestedEmoji.replace(
                    /\s+/g,
                    "_"
                  )}`
                )
                .setLabel(`Change my nickname to ${suggestedEmoji}`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji("👑");

              // Create an action row with the button
              const row = new ActionRowBuilder().addComponents(
                changeNicknameButton
              );

              // Send the message with the button
              await member.send({
                content:
                  `Hello server owner! I couldn't change your nickname due to Discord permissions, but to match today's emoji sentence theme, ` +
                  `you might want to change your nickname to: **${suggestedEmoji}**\n\n` +
                  `You can click the button below to get instructions on how to change your nickname, or do it manually.`,
                components: [row],
              });

              console.log(
                `Successfully sent nickname suggestion DM with button to ${member.user.tag}`
              );

              // Track that we sent a suggestion to the owner
              result.ownerSuggestion = true;
              result.suggestedEmoji = suggestedEmoji;
            } catch (dmError) {
              console.log(
                `Could not send DM to ${member.user.tag}: ${dmError.message}`
              );
            }
          } else {
            console.log(
              `Cannot change nickname for ${member.user.tag} due to role hierarchy.`
            );
          }

          result.skipped++;
          continue;
        }

        // Determine which funny name to use
        let emojiToUse;
        if (useGroupName) {
          // Use the group name
          emojiToUse = groupName;
        } else if (battleMode) {
          // Battle mode: assign based on current balance to keep it roughly 50/50
          const totalAssigned = result.pewdiepieCount + result.tseriesCount;
          const pewdiepieRatio =
            totalAssigned === 0 ? 0 : result.pewdiepieCount / totalAssigned;

          // If Pewdiepie ratio is less than 0.5, favor Pewdiepie, otherwise favor T-Series
          // Add some randomness to avoid perfect alternating pattern
          const favorPewdiepie =
            pewdiepieRatio < 0.5 ||
            (pewdiepieRatio === 0.5 && Math.random() < 0.5);

          if (favorPewdiepie) {
            emojiToUse = "Pewdiepie";
            result.pewdiepieCount++;
          } else {
            emojiToUse = "T-Series";
            result.tseriesCount++;
          }
        } else {
          // Get a random emoji sentence
          emojiToUse =
            funnyNames[Math.floor(Math.random() * funnyNames.length)];
        }

        // Store the original nickname for logging
        const originalNickname = member.nickname || member.user.username;

        // Set the new nickname
        await member.setNickname(
          emojiToUse,
          "Weekly emoji sentence nickname change"
        );

        console.log(
          `Changed nickname for ${member.user.tag} from "${originalNickname}" to "${emojiToUse}"`
        );
        result.success++;
      } catch (error) {
        console.error(`Error changing nickname for ${member.user.tag}:`, error);
        result.failed++;
        result.errors.push(`Error for ${member.user.tag}: ${error.message}`);
      }
    }

    let completionMessage = `Nickname change complete for guild "${guild.name}". Success: ${result.success}, Failed: ${result.failed}, Skipped: ${result.skipped}`;

    if (result.battleModeUsed) {
      completionMessage += ` | ⚔️ BATTLE RESULTS: Pewdiepie: ${result.pewdiepieCount}, T-Series: ${result.tseriesCount}`;
      const winner =
        result.pewdiepieCount > result.tseriesCount
          ? "Pewdiepie"
          : result.tseriesCount > result.pewdiepieCount
          ? "T-Series"
          : "TIE";
      completionMessage += ` | Winner: ${winner}! 🏆`;
    }

    console.log(completionMessage);
    return result;
  } catch (error) {
    console.error(
      `Error in changeNicknamesToFunnyNames for guild ${guild.name}:`,
      error
    );
    result.errors.push(`General error: ${error.message}`);
    return result;
  }
}

/**
 * Function to test sending a DM to the server owner with a nickname suggestion
 * @param {Guild} guild - The Discord guild
 * @param {boolean} useGroupName - Whether to use a group name or random name
 * @param {Object} config - Configuration object with settings
 * @param {boolean} useBattleMode - Whether to use battle mode (Pewdiepie vs T-Series)
 * @returns {Promise<Object>} Object containing the result of the operation
 */
async function testOwnerDM(
  guild,
  useGroupName = false,
  config = { ownerDMsEnabled: true },
  useBattleMode = false
) {
  console.log(`Testing owner DM in guild "${guild.name}"...`);

  const result = {
    success: false,
    ownerFound: false,
    dmSent: false,
    suggestedEmoji: null,
    error: null,
  };

  try {
    // Get the guild owner
    const owner = await guild.fetchOwner();

    if (!owner) {
      result.error = "Could not find server owner";
      return result;
    }

    result.ownerFound = true;
    console.log(`Found server owner: ${owner.user.tag}`);

    // Check if owner DMs are enabled
    if (!config.ownerDMsEnabled) {
      console.log(`Owner DMs are disabled. Skipping DM test.`);
      result.error = "Owner DMs are disabled in configuration";
      return result;
    }

    // Determine which emoji sentence to suggest
    let suggestedEmoji;
    if (useGroupName) {
      // Use a random emoji sentence as the "group emoji"
      suggestedEmoji =
        funnyNames[Math.floor(Math.random() * funnyNames.length)];
      console.log(`Using group emoji: ${suggestedEmoji}`);
    } else if (useBattleMode) {
      // Use battle mode - randomly choose between Pewdiepie and T-Series
      suggestedEmoji = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
      console.log(`Using battle mode emoji: ${suggestedEmoji}`);
    } else {
      // Get a random emoji sentence
      suggestedEmoji =
        funnyNames[Math.floor(Math.random() * funnyNames.length)];
      console.log(`Using random emoji: ${suggestedEmoji}`);
    }

    result.suggestedEmoji = suggestedEmoji;

    // Try to send a DM to the server owner with a button
    try {
      // Import the necessary Discord.js components
      const {
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle,
      } = require("discord.js");

      // Create a button for changing nickname
      const changeNicknameButton = new ButtonBuilder()
        .setCustomId(
          `change_nickname_${guild.id}_${suggestedEmoji.replace(/\s+/g, "_")}`
        )
        .setLabel(`Change my nickname to ${suggestedEmoji}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji("👑");

      // Create an action row with the button
      const row = new ActionRowBuilder().addComponents(changeNicknameButton);

      // Send the message with the button
      await owner.send({
        content:
          `Hello server owner! This is a test of the nickname suggestion feature.\n` +
          `If this were a real nickname change, I would suggest changing your nickname to: **${suggestedEmoji}**\n\n` +
          `You can click the button below to get instructions on how to change your nickname, or do it manually.`,
        components: [row],
      });

      console.log(`Successfully sent test DM with button to ${owner.user.tag}`);
      result.dmSent = true;
      result.success = true;
    } catch (dmError) {
      console.log(`Could not send DM to ${owner.user.tag}: ${dmError.message}`);
      result.error = `Could not send DM: ${dmError.message}`;
    }

    return result;
  } catch (error) {
    console.error(`Error in testOwnerDM for guild ${guild.name}:`, error);
    result.error = error.message;
    return result;
  }
}

module.exports = {
  changeNicknamesToFunnyNames,
  testOwnerDM,
  funnyNames,
};
