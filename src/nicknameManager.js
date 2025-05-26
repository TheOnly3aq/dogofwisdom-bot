/**
 * Utility functions for managing Discord nicknames
 */

// Array of Dutch snack names
const dutchSnacks = [
  // Original list
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

  // Additional Dutch snacks
  "Tompoes",
  "Eierbal",
  "Bamischijf",
  "Nasischijf",
  "Berenklauw",
  "Mexicano",
  "Kaassouflé",
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
  "Sylvester Stallone",
  "Karnemelk",
  "Chocomel",
  "Fristi",
  "Muisjes",
];

/**
 * Changes all members' nicknames in a guild to random Dutch snacks
 * @param {Guild} guild - The Discord guild to change nicknames in
 * @param {boolean} forceGroupSnack - Force everyone to have the same snack (for testing)
 * @returns {Promise<Object>} Object containing success and failure counts
 */
async function changeNicknamesToDutchSnacks(guild, forceGroupSnack = false) {
  console.log(`Changing nicknames in guild "${guild.name}" to Dutch snacks...`);

  const result = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    groupSnackUsed: false,
    groupSnack: null,
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

    // For each member, set a Dutch snack as nickname
    for (const [memberId, member] of members.entries()) {
      try {
        // Skip members with higher roles than the bot (can't change their nicknames)
        if (member.roles.highest.position >= botMember.roles.highest.position) {
          console.log(
            `Cannot change nickname for ${member.user.tag} due to role hierarchy.`
          );
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

module.exports = {
  changeNicknamesToDutchSnacks,
  dutchSnacks,
};
