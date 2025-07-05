/**
 * Utility functions for managing Discord nicknames
 */

// Array of Dutch snack names
const dutchSnacks = [
  // Traditional Dutch Snacks & Food
  "Stroopwafel",
  "Bitterballen",
  "Kroket",
  "Frikandel",
  "Poffertjes",
  "Hagelslag",
  "Dropjes",
  "Oliebollen",
  "Speculaas",
  "Tompouce",
  "Kibbeling",
  "Haring",
  "Kaassoufflé",
  "Gevulde Koek",
  "Boterkoek",
  "Ontbijtkoek",
  "Appeltaart",
  "Vla",
  "Pepernoten",
  "Kroketten",
  "Pannenkoeken",
  "Pindakaas",
  "Beschuit",
  "Eierkoek",
  "Rookworst",
  "Erwtensoep",
  "Stamppot",
  "Kaasbroodje",
  "Saucijzenbroodje",
  "Frikandelbroodje",
  "Bossche Bol",
  "Limburgse Vlaai",
  "Zeeuwse Bolus",
  "Krentenbollen",
  "Suikerbrood",
  "Roze Koek",
  "Mergpijpje",
  "Jodenkoek",
  "Krakeling",
  "Bokkenpootje",
  "Tompoes",
  "Eierbal",
  "Bamischijf",
  "Nasischijf",
  "Berenklauw",
  "Mexicano",
  "Loempia",
  "Patat Oorlog",
  "Patat Speciaal",
  "Kapsalon",
  "Broodje Gezond",
  "Broodje Bal",
  "Broodje Kroket",
  "Uitsmijter",
  "Patatje Joppie",
  "Patatje Pindasaus",
  "Kipcorn",
  "Kaastengel",
  "Bittergarnituur",
  "Gehaktbal",
  "Huzarensalade",
  "Filet Americain",
  "Ossenworst",
  "Leverworst",
  "Boerenkool",
  "Hutspot",
  "Zuurkool",
  "Spruitjes",
  "Vlaflip",
  "Hopjesvla",
  "Chocoladevla",
  "Vanillevla",
  "Aardbeivla",
  "Dubbelvla",
  "Anijsmelk",
  "Karnemelk",
  "Chocomel",
  "Fristi",
  "Muisjes",

  // Latvian Sweet Snacks (in Latvian)
  "Sklandrausis",
  "Rupjmaize ar medu",
  "Maizes zupa",
  "Auzu pārslu cepumi",
  "Biezpiena plācenīši",
  "Saldā biezpiena sieriņš",
  "Jāņu siers ar rozīnēm",
  "Zefīrs",
  "Gotiņa",
  "Kārums",
  "Saldējums plombīrs",
  "Riekstu maize",
  "Dzērveņu pastila",
  "Medus kūka",
  "Kliņģerīši",
  "Piparkūkas",
  "Kūka Vecrīga",
  "Saldā maize",
  "Saldā biezpiena torte",
  "Kafijas konfektes",
  "Kūka Cielaviņa",
  "Saldā krējuma sieriņš",
  "Ābolu plātsmaize",
  "Plūmju ievārījums",
  "Aveņu zefīrs",
  "Medus konfektes",
  // More Latvian Sweet Snacks
  "Saldā krējuma kūka",
  "Sviesta cepumi",
  "Karameles",
  "Šokolādes konfektes",
  "Vafeļu torte",
  "Biezpiena sieriņš ar šokolādi",
  "Ābolu ievārījums",
  "Riekstu konfektes",

  // Latvian Politicians (in Latvian)
  "Krišjānis Kariņš",
  "Egils Levits",
  "Arturs Krišjānis Kariņš",
  "Edgars Rinkēvičs", //THIS DIDNT EVEN KNOW HIS OWN PRESIDENT
  "Aigars Kalvītis",
  "Valdis Dombrovskis",
  "Andris Šķēle",
  "Andris Bērziņš",
  "Māris Kučinskis",

  // Dutch Cities & Landmarks
  "Schiphol",
  "Deltawerken",
  "Afsluitdijk",
  "Hoge Veluwe",
  "Waddenzee",
  "Biesbosch",
  "Haarlem",
  "Utrecht",
  "Rotterdam",
  "Den Haag",
  "Groningen",
  "Maastricht",
  "Eindhoven",
  "Tilburg",
  "Breda",
  "Nijmegen",
  "Apeldoorn",
  "Arnhem",
  "Amersfoort",
  "Zaandam",
  "Alkmaar",
  "Hoorn",
  "Enkhuizen",
  "Kampen",
  "Zwolle",
  "Deventer",
  "Zutphen",

  // Dutch Windmills
  "Kinderdijkse Molens",
  "Zaanse Schans Molens",
  "De Gooyer",
  "Molen van Sloten",
  "De Rieker",
  "Bloemmolen",
  "De Otter",
  "De Gekroonde Poelenburg",
  "Het Jonge Schaap",
  "De Kat",
  "De Zoeker",
  "De Bonte Hen",
  "Molen",
  "Korenmolen",
  "Poldermolen",

  // Dutch Flowers & Plants
  "Tulp",
  "Tulpen",
  "Narcis",
  "Hyacint",
  "Krokus",
  "Nederlandse Iris",
  "Keukenhof Tulp",
  "Rode Tulp",
  "Gele Tulp",
  "Roze Tulp",
  "Paarse Tulp",
  "Witte Tulp",
  "Zwarte Tulp",
  "Papegaaitulp",
  "Darwin Tulp",
  "Triumph Tulp",
  "Lelie Tulp",
  "Franje Tulp",
  "Dubbele Tulp",
  "Botanische Tulp",

  // Dutch Culture & Traditions
  "Koningsdag",
  "Sinterklaas",
  "Zwarte Piet",
  "Bevrijdingsdag",
  "Dodenherdenking",
  "Carnaval",
  "Kermis",
  "Prinsjesdag",
  "Oranjekoorts",
  "Oranje",
  "Huis van Oranje",
  "Willem-Alexander",
  "Maxima",
  "Beatrix",
  "Juliana",
  "Wilhelmina",

  // Dutch Transportation
  "Fiets",
  "Bakfiets",
  "Omafiets",
  "Tram",
  "GVB",
  "NS",
  "Intercity",
  "Sprinter",
  "OV-chipkaart",
  "Rondvaart",

  // Dutch Weather & Geography
  "Polder",
  "Dijk",
  "Waterland",
  "Laaglanden",
  "Zeeland",
  "Zuiderzee",
  "IJsselmeer",
  "Noordzee",
  "Waddenzee",
  "Rijn",
  "Maas",
  "IJssel",
  "Schelde",

  // Dutch Animals
  "Nederlandse Hangoor",
  "Fries Paard",
  "Lakenvelder",
  "Texelse Schaap",
  "Nederlandse Geit",
  "Keeshond",
  "Hollandse Herder",
  "Stabyhoun",
  "Wetterhoun",
  "Markiesje",
  "Smoushond",

  // Dutch Sports & Activities
  "Schaatsen",
  "Elfstedentocht",
  "Korfbal",
  "Hockey",
  "Voetbal",
  "Ajax",
  "PSV",
  "Feyenoord",
  "Oranje",
  "Totaalvoetbal",
  "Johan Cruijff",
  "Marco van Basten",
  "Ruud Gullit",
  "Frank Rijkaard",
  "Arjen Robben",
  "Wesley Sneijder",
  "Robin van Persie",
  "Virgil van Dijk",

  // Dutch Art & Artists
  "Rembrandt",
  "Van Gogh",
  "Vermeer",
  "Mondriaan",
  "Escher",
  "Frans Hals",
  "Jan Steen",
  "Jheronimus Bosch",
  "De Stijl",
  "Gouden Eeuw",
  "Hollandse Meesters",
  "Nachtwacht",
  "Meisje met de parel",
  "Zonnebloemen",

  // Dutch Language & Expressions
  "Gezellig",
  "Gezelligheid",
  "Doe Normaal",
  "Lekker",
  "Hoi",
  "Dag",
  "Dank je wel",
  "Alsjeblieft",
  "Goedemorgen",
  "Goedemiddag",
  "Goedenavond",
  "Welterusten",
  "Tot ziens",
  "Proost",
  "Smakelijk eten",

  // Dutch Companies & Brands
  "Philips",
  "Heineken",
  "Grolsch",
  "Amstel",
  "Bavaria",
  "Albert Heijn",
  "Jumbo",
  "HEMA",
  "Blokker",
  "Etos",
  "Kruidvat",
  "Action",
  "TomTom",
  "Coolblue",

  // Dutch Inventions & Innovations
  "Microscoop",
  "Telescoop",
  "Slingerklok",
  "Brandspuit",
  "Beurs",
  "Jenever",
  "CD",
  "DVD",
  "Cassettebandje",
  "Flitspaal",
  "Onderzeeër",
  "Oliebol",
  "Koekje",

  // Dutch Seasons & Holidays
  "Sinterklaas",
  "Pakjesavond",
  "Nieuwjaar",
  "Pasen",
  "Koninginnedag",
  "Bevrijdingsdag",
  "Hemelvaartsdag",
  "Pinksteren",
  "Kerstmis",
  "Eerste Kerstdag",
  "Tweede Kerstdag",

  // Dutch Architecture
  "Grachtenpand",
  "Hofje",
  "Trapgevel",
  "Klokgevel",
  "Neckgevel",
  "Amsterdamse School",
  "Berlage",
  "Rietveld",
  "Kubuswoningen",
  "Erasmusbrug",
  "Magere Brug",
  "Blauwbrug",

  // Dutch Music & Entertainment
  "André Hazes",
  "Golden Earring",
  "Shocking Blue",
  "Caro Emerald",
  "Anouk",
  "Marco Borsato",
  "Guus Meeuwis",
  "Acda en de Munnik",
  "Klein Orkest",
  "Doe Maar",
  "Tiësto",
  "Armin van Buuren",
  "Hardwell",
  "Martin Garrix",
  "Oliver Heldens",
  "Showtek",
  "Afrojack",
  "Fedde le Grand",

  // More Dutch Food Items
  "Jenever",
  "Advocaat",
  "Bitter",
  "Oranjebitter",
  "Vieux",
  "Brandewijn",
  "Kopstoot",
  "Boerenjongens",
  "Boerenmeisjes",
  "Kandeel",
  "Bisschopswijn",
  "Glühwein",
  "Warme Chocolademelk",
  "Anijsmelk",
  "Karnemelk",
  "Yoghurt",
  "Kwark",
  "Hangop",
  "Vla",

  // Dutch Politicians (2010 - present)
  "Mark Rutte",
  "Geert Wilders",
  "Sigrid Kaag",
  "Wopke Hoekstra",
  "Lodewijk Asscher",
  "Jesse Klaver",
  "Lilianne Ploumen",
  "Rob Jetten",
  "Pieter Omtzigt",
  "Caroline van der Plas",
  "Thierry Baudet",
  "Gert-Jan Segers",
  "Sybrand Buma",
  "Femke Halsema",
];

/**
 * Changes all members' nicknames in a guild to random Dutch snacks
 * @param {Guild} guild - The Discord guild to change nicknames in
 * @param {boolean} forceGroupSnack - Force everyone to have the same snack (for testing)
 * @param {Object} config - Configuration object with settings
 * @param {boolean} forceBattleMode - Force battle mode (Pewdiepie vs T-Series) for testing
 * @returns {Promise<Object>} Object containing success and failure counts, including battle results
 */
async function changeNicknamesToDutchSnacks(
  guild,
  forceGroupSnack = false,
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
      groupSnackUsed: false,
      groupSnack: null,
    };
  }

  console.log(`Changing nicknames in guild "${guild.name}" to Dutch snacks...`);

  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    groupSnackUsed: false,
    groupSnack: null,
    battleModeUsed: false,
    pewdiepieCount: 0,
    tseriesCount: 0,
    ownerSuggestion: false,
    suggestedSnack: null,
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
    const useGroupSnack =
      forceGroupSnack ||
      (randomValue < 0.1 && randomValue >= 0.05 && !forceBattleMode); // 5% chance
    const useBattleMode =
      forceBattleMode || (randomValue < 0.05 && !forceGroupSnack); // 5% chance for battle mode
    let groupSnack = null;
    let battleMode = false;

    if (useGroupSnack) {
      // Select one snack for everyone
      groupSnack = dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
      console.log(
        `🎉 GROUP SNACK EVENT! Everyone will be named "${groupSnack}" 🎉`
      );
      result.groupSnackUsed = true;
      result.groupSnack = groupSnack;
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
      // Determine which snack to use for the bot
      let botSnackToUse;
      if (useGroupSnack) {
        // Use the group snack
        botSnackToUse = groupSnack;
      } else if (battleMode) {
        // In battle mode, bot gets a random choice between Pewdiepie and T-Series
        botSnackToUse = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
        if (botSnackToUse === "Pewdiepie") {
          result.pewdiepieCount++;
        } else {
          result.tseriesCount++;
        }
      } else {
        // Get a random Dutch snack
        botSnackToUse =
          dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
      }

      // Store the original nickname for logging
      const originalBotNickname = botMember.nickname || botMember.user.username;

      // Set the bot's nickname
      await botMember.setNickname(
        botSnackToUse,
        "Weekly Dutch snack nickname change"
      );

      console.log(
        `Changed bot's own nickname from "${originalBotNickname}" to "${botSnackToUse}"`
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
          // Determine which snack would have been used
          let suggestedSnack;
          if (useGroupSnack) {
            suggestedSnack = groupSnack;
          } else if (battleMode) {
            suggestedSnack = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
          } else {
            suggestedSnack =
              dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
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
                  `change_nickname_${guild.id}_${suggestedSnack.replace(
                    /\s+/g,
                    "_"
                  )}`
                )
                .setLabel(`Change my nickname to ${suggestedSnack}`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji("👑");

              // Create an action row with the button
              const row = new ActionRowBuilder().addComponents(
                changeNicknameButton
              );

              // Send the message with the button
              await member.send({
                content:
                  `Hello server owner! I couldn't change your nickname due to Discord permissions, but to match today's Dutch snack theme, ` +
                  `you might want to change your nickname to: **${suggestedSnack}**\n\n` +
                  `You can click the button below to get instructions on how to change your nickname, or do it manually.`,
                components: [row],
              });

              console.log(
                `Successfully sent nickname suggestion DM with button to ${member.user.tag}`
              );

              // Track that we sent a suggestion to the owner
              result.ownerSuggestion = true;
              result.suggestedSnack = suggestedSnack;
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

        // Determine which snack to use
        let snackToUse;
        if (useGroupSnack) {
          // Use the group snack
          snackToUse = groupSnack;
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
            snackToUse = "Pewdiepie";
            result.pewdiepieCount++;
          } else {
            snackToUse = "T-Series";
            result.tseriesCount++;
          }
        } else {
          // Get a random Dutch snack
          snackToUse =
            dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
        }

        // Store the original nickname for logging
        const originalNickname = member.nickname || member.user.username;

        // Set the new nickname
        await member.setNickname(
          snackToUse,
          "Weekly Dutch snack nickname change"
        );

        console.log(
          `Changed nickname for ${member.user.tag} from "${originalNickname}" to "${snackToUse}"`
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
      `Error in changeNicknamesToDutchSnacks for guild ${guild.name}:`,
      error
    );
    result.errors.push(`General error: ${error.message}`);
    return result;
  }
}

/**
 * Function to test sending a DM to the server owner with a nickname suggestion
 * @param {Guild} guild - The Discord guild
 * @param {boolean} useGroupSnack - Whether to use a group snack or random snack
 * @param {Object} config - Configuration object with settings
 * @param {boolean} useBattleMode - Whether to use battle mode (Pewdiepie vs T-Series)
 * @returns {Promise<Object>} Object containing the result of the operation
 */
async function testOwnerDM(
  guild,
  useGroupSnack = false,
  config = { ownerDMsEnabled: true },
  useBattleMode = false
) {
  console.log(`Testing owner DM in guild "${guild.name}"...`);

  const result = {
    success: false,
    ownerFound: false,
    dmSent: false,
    suggestedSnack: null,
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

    // Determine which snack to suggest
    let suggestedSnack;
    if (useGroupSnack) {
      // Use a random snack as the "group snack"
      suggestedSnack =
        dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
      console.log(`Using group snack: ${suggestedSnack}`);
    } else if (useBattleMode) {
      // Use battle mode - randomly choose between Pewdiepie and T-Series
      suggestedSnack = Math.random() < 0.5 ? "Pewdiepie" : "T-Series";
      console.log(`Using battle mode snack: ${suggestedSnack}`);
    } else {
      // Get a random Dutch snack
      suggestedSnack =
        dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
      console.log(`Using random snack: ${suggestedSnack}`);
    }

    result.suggestedSnack = suggestedSnack;

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
          `change_nickname_${guild.id}_${suggestedSnack.replace(/\s+/g, "_")}`
        )
        .setLabel(`Change my nickname to ${suggestedSnack}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji("👑");

      // Create an action row with the button
      const row = new ActionRowBuilder().addComponents(changeNicknameButton);

      // Send the message with the button
      await owner.send({
        content:
          `Hello server owner! This is a test of the nickname suggestion feature.\n` +
          `If this were a real nickname change, I would suggest changing your nickname to: **${suggestedSnack}**\n\n` +
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
  changeNicknamesToDutchSnacks,
  testOwnerDM,
  dutchSnacks,
};
