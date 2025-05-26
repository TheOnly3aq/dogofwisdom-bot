/**
 * Generates random wisdom dog-like messages
 * inspired by the Dog of Wisdom video
 */

// Simple syllables that can be combined
const syllables = [
  "ba", "da", "ga", "ha", "pa", "ma", "wa", 
  "bo", "do", "go", "ho", "po", "mo", "wo",
  "bu", "du", "gu", "hu", "pu", "mu", "wu"
];

// Common patterns from Dog of Wisdom
const commonPatterns = [
  "ha ba da ga da",
  "ba da ba da",
  "ha ba da",
  "pa pa pa",
  "da ba dee da",
  "buh buh",
  "haba daba",
  "woof"
];

// Repeated syllables (like "ba ba" or "ha ha")
function generateRepeatedSyllable() {
  const syllable = syllables[Math.floor(Math.random() * syllables.length)];
  const repeats = Math.floor(Math.random() * 3) + 2; // 2-4 repeats
  return Array(repeats).fill(syllable).join(" ");
}

/**
 * Generates a random wisdom message
 * @returns {string} A random wisdom message
 */
function generateWisdomMessage() {
  // Decide which type of message to generate
  const messageType = Math.random();
  
  if (messageType < 0.3) {
    // 30% chance: Use a common pattern
    return commonPatterns[Math.floor(Math.random() * commonPatterns.length)];
  } else if (messageType < 0.5) {
    // 20% chance: Use repeated syllables
    return generateRepeatedSyllable();
  } else {
    // 50% chance: Generate a random combination
    const wordCount = Math.floor(Math.random() * 4) + 2; // 2-5 words
    
    let message = [];
    
    for (let i = 0; i < wordCount; i++) {
      // Determine syllables per word (1-3)
      const syllablesPerWord = Math.floor(Math.random() * 3) + 1;
      
      let word = "";
      for (let j = 0; j < syllablesPerWord; j++) {
        // Get random syllable
        const syllable = syllables[Math.floor(Math.random() * syllables.length)];
        word += syllable;
      }
      
      message.push(word);
    }
    
    return message.join(" ");
  }
}

module.exports = { generateWisdomMessage };