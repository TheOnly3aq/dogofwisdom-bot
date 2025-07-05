/**
 * Simple test script to verify battle mode logic
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
      for (let i = 1; i <= 10; i++) {
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
const { changeNicknamesToDutchSnacks } = require('./nicknameManager.js');

async function testBattleMode() {
  console.log("🧪 Testing Battle Mode functionality...\n");
  
  try {
    // Test forced battle mode
    console.log("=== TESTING FORCED BATTLE MODE ===");
    const result = await changeNicknamesToDutchSnacks(
      mockGuild,
      false, // forceGroupSnack
      { ownerDMsEnabled: false, blacklistedGuilds: [] }, // config
      true   // forceBattleMode
    );
    
    console.log("\n📊 Battle Mode Results:");
    console.log(`- Battle Mode Used: ${result.battleModeUsed}`);
    console.log(`- Pewdiepie Count: ${result.pewdiepieCount}`);
    console.log(`- T-Series Count: ${result.tseriesCount}`);
    console.log(`- Total Success: ${result.success}`);
    console.log(`- Failed: ${result.failed}`);
    console.log(`- Skipped: ${result.skipped}`);
    
    // Verify battle mode was used
    if (result.battleModeUsed) {
      console.log("✅ Battle mode was successfully activated!");
      
      // Check if distribution is reasonable (not all one side)
      const total = result.pewdiepieCount + result.tseriesCount;
      const pewdiepieRatio = result.pewdiepieCount / total;
      console.log(`📈 Distribution: ${(pewdiepieRatio * 100).toFixed(1)}% Pewdiepie, ${((1 - pewdiepieRatio) * 100).toFixed(1)}% T-Series`);
      
      if (pewdiepieRatio > 0.2 && pewdiepieRatio < 0.8) {
        console.log("✅ Distribution looks balanced!");
      } else {
        console.log("⚠️  Distribution might be too skewed, but this can happen with small samples.");
      }
    } else {
      console.log("❌ Battle mode was not activated when forced!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testBattleMode();