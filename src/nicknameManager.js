/**
 * Utility functions for managing Discord nicknames
 */

// Emoji sentence templates for weird but understandable combinations (max 7 emojis)
const emojiSentences = [
  // Sexual/Dirty combinations (for fun)
  "🍆 💦 🍑", // eggplant water peach
  "🍌 🍑 💋", // banana peach kiss
  "🌭 🍑 🔥", // hotdog peach fire
  "🥒 💦 🍑", // cucumber water peach
  "🍆 🍑 👅", // eggplant peach tongue
  "🍌 🍑 🍆", // banana peach eggplant
  "🌭 💦 🍑", // hotdog water peach
  "🥒 🍑 💋", // cucumber peach kiss
  "🍆 🍑 🔥", // eggplant peach fire
  "🍌 💦 🍑", // banana water peach

  // Person + Action + Object combinations
  "👨 🍔 🍽️", // person eating plate
  "👩 🍕 🚽", // woman pizza toilet
  "🧑 🍰 🛏️", // person cake bed
  "👨‍🦲 🍺 🚗", // bald man beer car
  "👩‍🦱 🍕 🐕", // curly woman pizza dog
  "🧑‍🦳 🍔 🏠", // old person burger house
  "👨‍🦰 🍰 🚲", // ginger man cake bike
  "👩‍🦲 🍺 🏊", // bald woman beer swimming
  "🧑‍🦱 🍕 🎮", // person pizza gaming
  "👨‍🦳 🍔 🎵", // old man burger music

  // Weird but understandable
  "🐕 🍕 🚽", // dog pizza toilet
  "🐱 🍔 🛏️", // cat burger bed
  "🐭 🍰 🚗", // mouse cake car
  "🐹 🍺 🏠", // hamster beer house
  "🐰 🍕 🚲", // rabbit pizza bike
  "🦊 🍔 🏊", // fox burger swimming
  "🐻 🍰 🎮", // bear cake gaming
  "🐼 🍺 🎵", // panda beer music
  "🐨 🍕 🚽", // koala pizza toilet
  "🐯 🍔 🛏️", // tiger burger bed

  // More creative combinations
  "👻 🍕 🚗", // ghost pizza car
  "🤖 🍔 🏠", // robot burger house
  "👽 🍰 🚲", // alien cake bike
  "🧙‍♂️ 🍺 🏊", // wizard beer swimming
  "🧙‍♀️ 🍕 🎮", // witch pizza gaming
  "🧚‍♂️ 🍔 🎵", // fairy burger music
  "🧚‍♀️ 🍰 🚽", // fairy cake toilet
  "🧛‍♂️ 🍺 🛏️", // vampire beer bed
  "🧛‍♀️ 🍕 🚗", // vampire pizza car
  "🧟‍♂️ 🍔 🏠", // zombie burger house

  // Random weird combinations
  "🚗 🍕 👨", // car pizza man
  "🏠 🍔 👩", // house burger woman
  "🚲 🍰 🧑", // bike cake person
  "🚽 🍺 👨‍🦲", // toilet beer bald man
  "🛏️ 🍕 👩‍🦱", // bed pizza curly woman
  "🎮 🍔 🧑‍🦳", // gaming burger old person
  "🎵 🍰 👨‍🦰", // music cake ginger man
  "🏊 🍺 👩‍🦲", // swimming beer bald woman
  "🚗 🍕 🧑‍🦱", // car pizza person
  "🏠 🍔 👨‍🦳", // house burger old man

  // More diverse combinations
  "🍕 🚽 🍔", // pizza toilet burger
  "🍔 🛏️ 🍰", // burger bed cake
  "🍰 🚗 🍺", // cake car beer
  "🍺 🏠 🍕", // beer house pizza
  "🍕 🚲 🍔", // pizza bike burger
  "🍔 🏊 🍰", // burger swimming cake
  "🍰 🎮 🍺", // cake gaming beer
  "🍺 🎵 🍕", // beer music pizza
  "🍕 🚽 🍔", // pizza toilet burger
  "🍔 🛏️ 🍰", // burger bed cake

  // New diverse combinations
  "👨 🚗 🍕 🍔 🍰", // man car pizza burger cake
  "👩 🏠 🍺 🚽 🛏️", // woman house beer toilet bed
  "🧑 🚲 🍕 🎮 🎵", // person bike pizza gaming music
  "👨‍🦲 🏊 🍔 🍰 🚗", // bald man swimming burger cake car
  "👩‍🦱 🍕 🐕 🚽 🛏️", // curly woman pizza dog toilet bed
  "🧑‍🦳 🍔 🏠 🚲 🎮", // old person burger house bike gaming
  "👨‍🦰 🍰 🚲 🍺 🏊", // ginger man cake bike beer swimming
  "👩‍🦲 🍺 🏊 🍕 🎮", // bald woman beer swimming pizza gaming
  "🧑‍🦱 🍕 🎮 🍔 🍰", // person pizza gaming burger cake
  "👨‍🦳 🍔 🎵 🍺 🚗", // old man burger music beer car

  // More sexual/dirty combinations
  "🍆 🍑 💦 🔥 👅", // eggplant peach water fire tongue
  "🍌 🍑 💋 🔥 💦", // banana peach kiss fire water
  "🌭 🍑 🔥 👅 💋", // hotdog peach fire tongue kiss
  "🥒 💦 🍑 🔥 👅", // cucumber water peach fire tongue
  "🍆 🍑 👅 💋 🔥", // eggplant peach tongue kiss fire
  "🍌 🍑 🍆 💦 🔥", // banana peach eggplant water fire
  "🌭 💦 🍑 👅 💋", // hotdog water peach tongue kiss
  "🥒 🍑 💋 🔥 💦", // cucumber peach kiss fire water
  "🍆 🍑 🔥 💦 👅", // eggplant peach fire water tongue
  "🍌 💦 🍑 👅 🔥", // banana water peach tongue fire

  // Random weird combinations
  "🐕 🍕 🚽 🍔 🛏️", // dog pizza toilet burger bed
  "🐱 🍔 🛏️ 🍰 🚗", // cat burger bed cake car
  "🐭 🍰 🚗 🍺 🏠", // mouse cake car beer house
  "🐹 🍺 🏠 🍕 🚲", // hamster beer house pizza bike
  "🐰 🍕 🚲 🍔 🏊", // rabbit pizza bike burger swimming
  "🦊 🍔 🏊 🍰 🎮", // fox burger swimming cake gaming
  "🐻 🍰 🎮 🍺 🎵", // bear cake gaming beer music
  "🐼 🍺 🎵 🍕 🚽", // panda beer music pizza toilet
  "🐨 🍕 🚽 🍔 🛏️", // koala pizza toilet burger bed
  "🐯 🍔 🛏️ 🍰 🚗", // tiger burger bed cake car

  // More creative combinations
  "👻 🍕 🚗 🍔 🍰", // ghost pizza car burger cake
  "🤖 🍔 🏠 🍺 🚽", // robot burger house beer toilet
  "👽 🍰 🚲 🍕 🎮", // alien cake bike pizza gaming
  "🧙‍♂️ 🍺 🏊 🍔 🍰", // wizard beer swimming burger cake
  "🧙‍♀️ 🍕 🎮 🍺 🎵", // witch pizza gaming beer music
  "🧚‍♂️ 🍔 🎵 🍰 🚽", // fairy burger music cake toilet
  "🧚‍♀️ 🍰 🚽 🍺 🛏️", // fairy cake toilet beer bed
  "🧛‍♂️ 🍺 🛏️ 🍕 🚗", // vampire beer bed pizza car
  "🧛‍♀️ 🍕 🚗 🍔 🏠", // vampire pizza car burger house
  "🧟‍♂️ 🍔 🏠 🍰 🚲", // zombie burger house cake bike

  // Even more diverse combinations
  "🚗 🍕 👨 🍔 🍰 🍺", // car pizza man burger cake beer
  "🏠 🍔 👩 🍺 🚽 🛏️", // house burger woman beer toilet bed
  "🚲 🍰 🧑 🍕 🎮 🎵", // bike cake person pizza gaming music
  "🚽 🍺 👨‍🦲 🍔 🍰 🚗", // toilet beer bald man burger cake car
  "🛏️ 🍕 👩‍🦱 🍺 🚽 🍔", // bed pizza curly woman beer toilet burger
  "🎮 🍔 🧑‍🦳 🍰 🚲 🍺", // gaming burger old person cake bike beer
  "🎵 🍰 👨‍🦰 🍺 🏊 🍕", // music cake ginger man beer swimming pizza
  "🏊 🍺 👩‍🦲 🍕 🎮 🍔", // swimming beer bald woman pizza gaming burger
  "🚗 🍕 🧑‍🦱 🍔 🍰 🍺", // car pizza person burger cake beer
  "🏠 🍔 👨‍🦳 🍺 🚽 🛏️", // house burger old man beer toilet bed
];

module.exports.emojiSentences = emojiSentences;

/**
 * Changes all members' nicknames in a guild to random emoji sentences
 * @param {Guild} guild - The Discord guild to change nicknames in
 * @param {boolean} forceGroupEmoji - Force everyone to have the same emoji sentence (for testing)
 * @param {Object} config - Configuration object with settings
 * @param {boolean} forceBattleMode - Force battle mode (Pewdiepie vs T-Series) for testing
 * @returns {Promise<Object>} Object containing success and failure counts, including battle results
 */
async function changeNicknamesToEmojiSentences(
  guild,
  forceGroupEmoji = false,
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
      groupEmojiUsed: false,
      groupEmoji: null,
    };
  }

  console.log(
    `Changing nicknames in guild "${guild.name}" to emoji sentences...`
  );

  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    groupEmojiUsed: false,
    groupEmoji: null,
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
    const useGroupEmoji =
      forceGroupEmoji ||
      (randomValue < 0.1 && randomValue >= 0.05 && !forceBattleMode); // 5% chance
    const useBattleMode =
      forceBattleMode || (randomValue < 0.05 && !forceGroupEmoji); // 5% chance for battle mode
    let groupEmoji = null;
    let battleMode = false;

    if (useGroupEmoji) {
      // Select one emoji sentence for everyone
      groupEmoji =
        emojiSentences[Math.floor(Math.random() * emojiSentences.length)];
      console.log(
        `🎉 GROUP EMOJI EVENT! Everyone will be named "${groupEmoji}" 🎉`
      );
      result.groupEmojiUsed = true;
      result.groupEmoji = groupEmoji;
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
      // Determine which emoji sentence to use for the bot
      let botEmojiToUse;
      if (useGroupEmoji) {
        // Use the group emoji
        botEmojiToUse = groupEmoji;
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
          emojiSentences[Math.floor(Math.random() * emojiSentences.length)];
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
          // Determine which emoji sentence would have been used
          let suggestedEmoji;
          if (useGroupEmoji) {
            suggestedEmoji = groupEmoji;
          } else if (battleMode) {
            suggestedEmoji = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
          } else {
            suggestedEmoji =
              emojiSentences[Math.floor(Math.random() * emojiSentences.length)];
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

        // Determine which emoji sentence to use
        let emojiToUse;
        if (useGroupEmoji) {
          // Use the group emoji
          emojiToUse = groupEmoji;
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
            emojiSentences[Math.floor(Math.random() * emojiSentences.length)];
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
      `Error in changeNicknamesToEmojiSentences for guild ${guild.name}:`,
      error
    );
    result.errors.push(`General error: ${error.message}`);
    return result;
  }
}

/**
 * Function to test sending a DM to the server owner with a nickname suggestion
 * @param {Guild} guild - The Discord guild
 * @param {boolean} useGroupEmoji - Whether to use a group emoji or random emoji
 * @param {Object} config - Configuration object with settings
 * @param {boolean} useBattleMode - Whether to use battle mode (Pewdiepie vs T-Series)
 * @returns {Promise<Object>} Object containing the result of the operation
 */
async function testOwnerDM(
  guild,
  useGroupEmoji = false,
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
    if (useGroupEmoji) {
      // Use a random emoji sentence as the "group emoji"
      suggestedEmoji =
        emojiSentences[Math.floor(Math.random() * emojiSentences.length)];
      console.log(`Using group emoji: ${suggestedEmoji}`);
    } else if (useBattleMode) {
      // Use battle mode - randomly choose between Pewdiepie and T-Series
      suggestedEmoji = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
      console.log(`Using battle mode emoji: ${suggestedEmoji}`);
    } else {
      // Get a random emoji sentence
      suggestedEmoji =
        emojiSentences[Math.floor(Math.random() * emojiSentences.length)];
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
  changeNicknamesToEmojiSentences,
  testOwnerDM,
  emojiSentences,
};
