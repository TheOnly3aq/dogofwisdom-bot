/**
 * Simple test script to verify battle mode command functionality
 */

// Mock the Discord.js components we need
const mockGuild = {
  id: "test-guild-id",
  name: "Test Guild",
  ownerId: "owner-id",
  members: {
    fetch: async () => {
      // Create a mock members collection
      const mockMembers = new Map();
      
      // Add bot member
      mockMembers.set("bot-id", {
        id: "bot-id",
        user: { username: "TestBot", tag: "TestBot#1234" },
        nickname: null,
        permissions: { has: () => true },
        roles: { highest: { position: 10 } },
        setNickname: async (nickname, reason) => {
          console.log(`Bot nickname set to: ${nickname}`);
        }
      });
      
      // Add regular members
      for (let i = 1; i <= 15; i++) {
        mockMembers.set(`user-${i}`, {
          id: `user-${i}`,
          user: { username: `User${i}`, tag: `User${i}#1234` },
          nickname: null,
          roles: { highest: { position: 1 } },
          setNickname: async (nickname, reason) => {
            console.log(`User${i} nickname set to: ${nickname}`);
          }
        });
      }
      
      return mockMembers;
    },
    me: {
      id: "bot-id",
      user: { username: "TestBot", tag: "TestBot#1234" },
      nickname: null,
      permissions: { has: () => true },
      roles: { highest: { position: 10 } }
    }
  }
};

// Import the nickname manager
const { changeNicknamesToDutchSnacks } = require('./src/nicknameManager.js');

async function testBattleCommand() {
  console.log("🧪 Testing Battle Mode Command functionality...\n");
  
  try {
    // Test forced battle mode (simulating the /battle-mode command)
    console.log("=== SIMULATING /battle-mode COMMAND ===");
    const result = await changeNicknamesToDutchSnacks(
      mockGuild,
      false, // forceGroupSnack
      { ownerDMsEnabled: false, blacklistedGuilds: [] }, // config
      true   // forceBattleMode
    );
    
    console.log("\n📊 Command Results:");
    console.log(`- Battle Mode Used: ${result.battleModeUsed}`);
    console.log(`- Pewdiepie Count: ${result.pewdiepieCount}`);
    console.log(`- T-Series Count: ${result.tseriesCount}`);
    console.log(`- Total Success: ${result.success}`);
    console.log(`- Failed: ${result.failed}`);
    console.log(`- Skipped: ${result.skipped}`);
    
    // Simulate the command response message
    if (result.battleModeUsed) {
      let responseMessage =
        `⚔️ **BATTLE MODE COMPLETE!** ⚔️\n` +
        `Success: ${result.success}\n` +
        `Failed: ${result.failed}\n` +
        `Skipped: ${result.skipped}\n\n` +
        `🔥 **BATTLE RESULTS** 🔥\n` +
        `Pewdiepie Army: ${result.pewdiepieCount} 👊\n` +
        `T-Series Forces: ${result.tseriesCount} 🎵\n`;

      // Determine and announce the winner
      const winner = result.pewdiepieCount > result.tseriesCount ? "Pewdiepie" : 
                     result.tseriesCount > result.pewdiepieCount ? "T-Series" : "TIE";
      
      if (winner === "TIE") {
        responseMessage += `\n🤝 **IT'S A TIE!** The battle ends in a draw! 🤝`;
      } else {
        responseMessage += `\n🏆 **${winner.toUpperCase()} WINS!** 🏆`;
        if (winner === "Pewdiepie") {
          responseMessage += `\n👑 Bro fist! 👊`;
        } else {
          responseMessage += `\n🎵 Music conquers all! 🎵`;
        }
      }

      console.log("\n🎮 Simulated Discord Response:");
      console.log("=" .repeat(50));
      console.log(responseMessage);
      console.log("=" .repeat(50));
      
      // Check if distribution is reasonable
      const total = result.pewdiepieCount + result.tseriesCount;
      const pewdiepieRatio = result.pewdiepieCount / total;
      console.log(`\n📈 Distribution Analysis: ${(pewdiepieRatio * 100).toFixed(1)}% Pewdiepie, ${((1 - pewdiepieRatio) * 100).toFixed(1)}% T-Series`);
      
      if (pewdiepieRatio > 0.2 && pewdiepieRatio < 0.8) {
        console.log("✅ Distribution looks balanced!");
      } else {
        console.log("⚠️  Distribution might be skewed, but this can happen with smaller groups.");
      }
    } else {
      console.log("❌ Battle mode was not activated when forced!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testBattleCommand();