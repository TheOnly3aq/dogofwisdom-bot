/**
 * YouTube-DLP Handler for Discord Bot
 * 
 * This module provides a more reliable way to stream YouTube videos
 * using yt-dlp instead of ytdl-core or play-dl.
 */

const { createAudioResource } = require('@discordjs/voice');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Try to load yt-dlp-exec if available
let ytDlpExec = null;
try {
  ytDlpExec = require('yt-dlp-exec');
  console.log("Using yt-dlp-exec package");
} catch (error) {
  console.log("yt-dlp-exec package not available, will use command line yt-dlp if installed");
}

// Create a temporary directory for storing audio files
const TEMP_DIR = path.join(os.tmpdir(), 'wisdom_bot_audio');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Get video information using yt-dlp
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} Video information
 */
async function getVideoInfo(url) {
  console.log(`[YTDLP] Getting video info for: ${url}`);
  
  // If yt-dlp-exec is available, use it
  if (ytDlpExec) {
    try {
      const options = {
        dumpSingleJson: true,
        noPlaylist: true,
      };
      
      const info = await ytDlpExec(url, options);
      
      return {
        title: info.title,
        url: info.webpage_url,
        thumbnail: info.thumbnail,
        duration: info.duration,
        id: info.id
      };
    } catch (error) {
      console.error(`[YTDLP] Error with yt-dlp-exec: ${error.message}`);
      throw error;
    }
  } else {
    // Fall back to spawning the yt-dlp process
    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        url
      ]);
      
      let stdout = '';
      let stderr = '';
      
      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      ytdlp.on('close', (code) => {
        if (code !== 0) {
          console.error(`[YTDLP] Error getting video info: ${stderr}`);
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          const info = JSON.parse(stdout);
          resolve({
            title: info.title,
            url: info.webpage_url,
            thumbnail: info.thumbnail,
            duration: info.duration,
            id: info.id
          });
        } catch (error) {
          console.error(`[YTDLP] Error parsing video info: ${error.message}`);
          reject(error);
        }
      });
    });
  }
}

/**
 * Stream audio from YouTube using yt-dlp
 * @param {string} url - YouTube URL
 * @returns {Promise<Object>} Audio resource and metadata
 */
async function createAudioStream(url) {
  try {
    console.log(`[YTDLP] Creating audio stream for: ${url}`);
    
    // Get video info first
    const videoInfo = await getVideoInfo(url);
    const outputPath = path.join(TEMP_DIR, `${videoInfo.id}.opus`);
    
    // Check if we already have this file cached
    if (fs.existsSync(outputPath)) {
      console.log(`[YTDLP] Using cached audio file: ${outputPath}`);
      const resource = createAudioResource(fs.createReadStream(outputPath), {
        inputType: 'opus',
        inlineVolume: true
      });
      
      if (resource.volume) {
        resource.volume.setVolume(0.5);
      }
      
      return {
        resource,
        videoInfo
      };
    }
    
    // Download the audio
    if (ytDlpExec) {
      // Use yt-dlp-exec if available
      try {
        console.log(`[YTDLP] Downloading audio using yt-dlp-exec to: ${outputPath}`);
        
        const options = {
          extractAudio: true,
          audioFormat: 'opus',
          audioQuality: '128K',
          output: outputPath,
          format: 'bestaudio',
        };
        
        await ytDlpExec(url, options);
        
        console.log(`[YTDLP] Successfully downloaded audio to: ${outputPath}`);
        
        // Create audio resource from the downloaded file
        const resource = createAudioResource(fs.createReadStream(outputPath), {
          inputType: 'opus',
          inlineVolume: true
        });
        
        if (resource.volume) {
          resource.volume.setVolume(0.5);
        }
        
        return {
          resource,
          videoInfo
        };
      } catch (error) {
        console.error(`[YTDLP] Error with yt-dlp-exec: ${error.message}`);
        throw error;
      }
    } else {
      // Fall back to spawning the yt-dlp process
      return new Promise((resolve, reject) => {
        const ytdlp = spawn('yt-dlp', [
          '-f', 'bestaudio',
          '--extract-audio',
          '--audio-format', 'opus',
          '--audio-quality', '128K',
          '-o', outputPath,
          url
        ]);
        
        let stderr = '';
        
        ytdlp.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        ytdlp.on('close', (code) => {
          if (code !== 0) {
            console.error(`[YTDLP] Error downloading audio: ${stderr}`);
            reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
            return;
          }
          
          console.log(`[YTDLP] Successfully downloaded audio to: ${outputPath}`);
          
          // Create audio resource from the downloaded file
          const resource = createAudioResource(fs.createReadStream(outputPath), {
            inputType: 'opus',
            inlineVolume: true
          });
          
          if (resource.volume) {
            resource.volume.setVolume(0.5);
          }
          
          resolve({
            resource,
            videoInfo
          });
        });
      });
    }
  } catch (error) {
    console.error(`[YTDLP] Error creating audio stream: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up temporary files
 */
function cleanupTempFiles() {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      
      // Delete files older than 1 hour
      if (stats.mtimeMs < oneHourAgo) {
        fs.unlinkSync(filePath);
        console.log(`[YTDLP] Deleted old temporary file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`[YTDLP] Error cleaning up temp files: ${error.message}`);
  }
}

// Clean up temporary files every hour
setInterval(cleanupTempFiles, 60 * 60 * 1000);

module.exports = {
  getVideoInfo,
  createAudioStream
};