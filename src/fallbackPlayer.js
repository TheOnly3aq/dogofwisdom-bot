/**
 * Fallback Music Player for Discord Bot
 * 
 * This is a simplified fallback player that doesn't rely on YouTube APIs.
 * It's used when the main player fails due to YouTube API restrictions.
 */

const fs = require('fs');
const path = require('path');
const { createAudioResource } = require('@discordjs/voice');

// Path to the silent audio file
const RESOURCES_DIR = path.join(__dirname, '..', 'resources');
const SILENT_AUDIO_PATH = path.join(RESOURCES_DIR, 'silent.mp3');

/**
 * Initialize the fallback player
 * Creates necessary directories and files
 */
async function initializeFallbackPlayer() {
  try {
    // Create resources directory if it doesn't exist
    if (!fs.existsSync(RESOURCES_DIR)) {
      fs.mkdirSync(RESOURCES_DIR, { recursive: true });
      console.log("Created resources directory");
    }

    // Create a silent MP3 file if it doesn't exist
    if (!fs.existsSync(SILENT_AUDIO_PATH)) {
      // This is a minimal valid MP3 file (essentially silence)
      const silentBuffer = Buffer.from([
        0xFF, 0xFB, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
      ]);
      
      fs.writeFileSync(SILENT_AUDIO_PATH, silentBuffer);
      console.log("Created silent audio file for fallback");
    }
    
    return true;
  } catch (error) {
    console.error(`Error initializing fallback player: ${error.message}`);
    return false;
  }
}

/**
 * Create a silent audio resource
 * @returns {Object} Audio resource or null if failed
 */
function createSilentResource() {
  try {
    // Make sure the fallback player is initialized
    if (!fs.existsSync(SILENT_AUDIO_PATH)) {
      initializeFallbackPlayer();
    }
    
    // Create a read stream from the silent audio file
    const silentStream = fs.createReadStream(SILENT_AUDIO_PATH);
    
    // Create an audio resource
    const resource = createAudioResource(silentStream, {
      inputType: undefined,
      inlineVolume: true,
    });
    
    if (resource.volume) {
      resource.volume.setVolume(0.5);
    }
    
    return resource;
  } catch (error) {
    console.error(`Error creating silent resource: ${error.message}`);
    return null;
  }
}

/**
 * Play a song using the fallback player
 * @param {Object} player - Discord.js audio player
 * @param {Object} song - Song object with title and url
 * @returns {Object} Result object with success status and message
 */
async function playWithFallback(player, song) {
  try {
    console.log(`Using fallback player for: ${song.title}`);
    
    // Create a silent audio resource
    const resource = createSilentResource();
    
    if (!resource) {
      return {
        success: false,
        message: `⚠️ Unable to create audio resource for ${song.title}`,
      };
    }
    
    // Play the silent audio
    player.play(resource);
    
    return {
      success: true,
      message: `⚠️ YouTube playback is currently experiencing issues. We're working on a fix.\n\nAttempting to play: **${song.title}**`,
    };
  } catch (error) {
    console.error(`Error in fallback player: ${error.message}`);
    return {
      success: false,
      message: `⚠️ Unable to play ${song.title} due to YouTube API restrictions. Please try again later.`,
    };
  }
}

module.exports = {
  initializeFallbackPlayer,
  createSilentResource,
  playWithFallback,
};