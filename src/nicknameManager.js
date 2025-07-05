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

  // Dutch Cheese
  "Gouda",
  "Edam",
  "Leerdammer",
  "Maasdam",
  "Aged Gouda",
  "Young Gouda",
  "Gerookte Gouda",
  "Komijnekaas",
  "Kruidenkaas",
  "Roomkaas",
  "Boerenkaas",
  "Geitenkaas",

  // Dutch Landmarks & Places
  "Keukenhof",
  "Kinderdijk",
  "Zaanse Schans",
  "Giethoorn",
  "Marken",
  "Volendam",
  "Rijksmuseum",
  "Van Gogh Museum",
  "Anne Frank Huis",
  "Concertgebouw",
  "Koninklijk Paleis",
  "Dam",
  "Vondelpark",
  "Bloemenmarkt",
  "Jordaan",
  "Prinsengracht",
  "Herengracht",
  "Keizersgracht",
  "Singel",
  "Westerkerk",
  "Zuiderkerk",
  "Oude Kerk",
  "Nieuwmarkt",
  "Leidseplein",
  "Rembrandtplein",
  "Museumplein",
  "Centraal Station",
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
  "Pudding",
  "Custard",

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
  "Alexander Pechtold",
  "Halbe Zijlstra",
  "Kajsa Ollongren",
  "Hugo de Jonge",
  "Edith Schippers",
  "Dilan Yeşilgöz-Zegerius",
  "Wouter Koolmees",
  "Lilian Marijnissen",
  "Emile Roemer",
  "Henk Krol",
  "Tunahan Kuzu",
  "Khadija Arib",
  "Vera Bergkamp",
  "Martin Bosma",
  "Jan Paternotte",
  "Attje Kuiken",
  "Laurens Dassen",
  "Sylvana Simons",
  "Esther Ouwehand",
  "Kees van der Staaij",
  "Farid Azarkan",
  "Henk Nijboer",
  "Tom van der Lee",
  "Bart Snels",
  "Renske Leijten",
  "Ronald Plasterk",
  "Eric Wiebes",
  "Mona Keijzer",
  "Carola Schouten",
  "Dennis Wiersma",
  "Frank Weerwind",
  "Steven van Weyenberg",
  "Tamara van Ark",
  "Arie Slob",
  "Menno Snel",
  "Paul Blokhuis",
  "Hans Vijlbrief",
  "Barbara Visser",
  "Stientje van Veldhoven",
  "Bas van 't Wout",
  "Mark Harbers",
  "Ank Bijleveld",
  "Kajsa Ollongren",
  "Raymond Knops",
  "Ingrid van Engelshoven",
  "Sander Dekker",
  "Fred Teeven",
  "Jeanine Hennis-Plasschaert",
  "Jeroen Dijsselbloem",
  "Liesje Schreinemacher",
  "Micky Adriaansens",
  "Ernst Kuipers",
  "Conny Helder",
  "Hanke Bruins Slot",
  "Vivianne Heijnen",
  "Christianne van der Wal",
  "Karien van Gennip",
  "Markuszower",
  "Joost Eerdmans",
  "Gidi Markuszower",
  "Nicki Pouw-Verweij",
  "Simone Kerseboom",
  "Pepijn van Houwelingen",
  "Wybren van Haga",
  "Liane den Haan",
  "Pieter Heerma",
  "Mirjam Bikker",
  "Tom van der Lee",
  "Lisa Westerveld",
  "Tjeerd de Groot",
  "Laura Bromet",
  "Kiki Hagen",
  "Suzanne Kröger",
  "Peter Kwint",
  "Maarten Hijink",
  "Sandra Beckerman",
  "Bart van Kent",
  "Michiel van Nispen",
  "Jasper van Dijk",
  "Renske Leijten",
  "Gijs van Dijk",
  "Songül Mutluer",
  "Habtamu de Hoop",
  "Henk Nijboer",
  "Joris Thijssen",
  "Mohammed Mohandis",
  "Bente Becker",
  "Roelof Bisschop",
  "Chris Stoffer",
  "Harm Beertema",
  "Martin Bosma",
  "Derk Jan Eppink",
  "Ruben Brekelmans",
  "Vicky Maeijer",
  "Kiki Hagen",
  "Anne Kuik",
  "Jaco Geurts",
  "Pieter Grinwis",
  "Don Ceder",
  "Stieneke van der Graaf",
  "Henri Bontenbal",
  "Ingrid Michon-Derkzen",
  "Lisa van Ginneken",
  "Jan Paternotte",
  "Alexander Hammelburg",
  "Joost Sneller",
  "Sjoerd Sjoerdsma",
  "Salima Belhaj",
  "Kees Verhoeven",
  "Steven van Weyenberg",
  "Antje Diertens",
  "Maarten Groothuizen",
  "Rens Raemakers",
  "Paul Smeulders",
  "Suzanne Kröger",
  "Laura Bromet",
  "Kiki Hagen",
  "Tjeerd de Groot",
  "Lammert van Raan",
  "Esther Ouwehand",
  "Eva van Esch",
  "Frank Futselaar",
  "Peter Kwint",
  "Sandra Beckerman",
  "Renske Leijten",
  "Maarten Hijink",
  "Bart van Kent",
  "Michiel van Nispen",
  "Jasper van Dijk",
  "Gijs van Dijk",
  "Habtamu de Hoop",
  "Songül Mutluer",
  "Joris Thijssen",
  "Mohammed Mohandis",
  "Bente Becker",
  "Roelof Bisschop",
  "Chris Stoffer",
  "Harm Beertema",
  "Martin Bosma",
  "Derk Jan Eppink",
  "Ruben Brekelmans",
  "Vicky Maeijer",
  "Nicki Pouw-Verweij",
  "Simone Kerseboom",
  "Pepijn van Houwelingen",
  "Wybren van Haga",
  "Liane den Haan",
  "Pieter Heerma",
  "Mirjam Bikker",
];

/**
 * Changes all members' nicknames in a guild to random Dutch snacks
 * @param {Guild} guild - The Discord guild to change nicknames in
 * @param {boolean} forceGroupSnack - Force everyone to have the same snack (for testing)
 * @param {Object} config - Configuration object with settings
 * @returns {Promise<Object>} Object containing success and failure counts
 */
async function changeNicknamesToDutchSnacks(
  guild,
  forceGroupSnack = false,
  config = { ownerDMsEnabled: true, blacklistedGuilds: [] }
) {
  // Check if the guild is blacklisted
  if (config.blacklistedGuilds && config.blacklistedGuilds.includes(guild.id)) {
    console.log(`Guild "${guild.name}" (${guild.id}) is blacklisted. Skipping nickname changes.`);
    return {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [`Guild "${guild.name}" is blacklisted`],
      groupSnackUsed: false,
      groupSnack: null
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

    // Determine if we should use a group snack (10% chance or if forced)
    const useGroupSnack = forceGroupSnack || Math.random() < 0.1; // 10% chance
    let groupSnack = null;

    if (useGroupSnack) {
      // Select one snack for everyone
      groupSnack = dutchSnacks[Math.floor(Math.random() * dutchSnacks.length)];
      console.log(
        `🎉 GROUP SNACK EVENT! Everyone will be named "${groupSnack}" 🎉`
      );
      result.groupSnackUsed = true;
      result.groupSnack = groupSnack;
    }

    // First, handle the bot's own nickname
    try {
      // Determine which snack to use for the bot
      let botSnackToUse;
      if (useGroupSnack) {
        // Use the group snack
        botSnackToUse = groupSnack;
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

    console.log(
      `Nickname change complete for guild "${guild.name}". Success: ${result.success}, Failed: ${result.failed}, Skipped: ${result.skipped}`
    );
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
 * @returns {Promise<Object>} Object containing the result of the operation
 */
async function testOwnerDM(
  guild,
  useGroupSnack = false,
  config = { ownerDMsEnabled: true }
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
