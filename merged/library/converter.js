/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      let tmp = path.join(tmpDir, `${Date.now()}_${Math.random().toString(36).substring(2)}.${ext || 'tmp'}`);
      let out = `${tmp}.${ext2 || 'tmp'}`;
      await fs.promises.writeFile(tmp, buffer);
      
      const proc = spawn('ffmpeg', [
        '-y',
        '-i', tmp,
        ...args,
        out
      ]);

      proc.on('error', (err) => {
        try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (e) {}
        try { if (fs.existsSync(out)) fs.unlinkSync(out); } catch (e) {}
        reject(err);
      });

      proc.on('close', async (code) => {
        try {
          if (fs.existsSync(tmp)) await fs.promises.unlink(tmp);
          if (code !== 0) {
            if (fs.existsSync(out)) await fs.promises.unlink(out);
            return reject(new Error(`FFmpeg exited with code ${code}`));
          }
          const res = await fs.promises.readFile(out);
          if (fs.existsSync(out)) await fs.promises.unlink(out);
          resolve(res);
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Convert Audio to Playable WhatsApp Audio
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toAudio(buffer, ext = 'mp3') {
  return ffmpeg(buffer, [
    '-vn',
    '-ac', '2',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'mp3'
  ], ext, 'mp3');
}

/**
 * Convert Audio to Playable WhatsApp PTT
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext File Extension 
 */
function toPTT(buffer, ext = 'mp3') {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus');
}

/**
 * Convert Video to Playable WhatsApp Video (H.264 + AAC + Faststart)
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext File Extension 
 */
function toVideo(buffer, ext = 'mp4') {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '26',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-movflags', '+faststart'
  ], ext, 'mp4');
}

module.exports = {
  toAudio,
  toPTT,
  toVideo,
  ffmpeg,
};
