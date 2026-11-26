/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas')
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const { execFile, spawn } = require('child_process')
const { promisify } = require('util')
const axios = require('axios')
const { Sticker } = require('wa-sticker-formatter')
const WebP = require('node-webpmux')

const execFileAsync = promisify(execFile)

const CACHE_DIR = path.join(os.tmpdir(), 'shorekeeper-brat-cache')
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

const MAX_TEXT_LENGTH = 200

const httpAgent = new (require('https').Agent)({ keepAlive: false, family: 4 })

async function getBuffer(url, retries = 3) {
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        httpsAgent: httpAgent,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
        }
      })
      return Buffer.from(res.data)
    } catch (e) {
      lastErr = e
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastErr
}

async function ensureCachedFile(url, filename) {
  const dest = path.join(CACHE_DIR, filename)
  if (!fs.existsSync(dest)) {
    const buf = await getBuffer(url)
    fs.writeFileSync(dest, buf)
  }
  return dest
}

const SHARED_EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
const SHARED_EMOJI_JSON_PATH = path.join(CACHE_DIR, 'shared-emoji-apple.json')
let sharedEmojiMap = null
const sharedEmojiImageCache = new Map()

function emojiToUnicode(emoji) {
  return [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')
}

async function loadSharedEmojiMap() {
  if (sharedEmojiMap) return sharedEmojiMap
  if (!fs.existsSync(SHARED_EMOJI_JSON_PATH) || fs.statSync(SHARED_EMOJI_JSON_PATH).size === 0) {
    const buf = await getBuffer(SHARED_EMOJI_JSON_URL)
    fs.writeFileSync(SHARED_EMOJI_JSON_PATH, buf)
  }
  sharedEmojiMap = JSON.parse(fs.readFileSync(SHARED_EMOJI_JSON_PATH, 'utf-8'))
  return sharedEmojiMap
}

async function getSharedEmojiImage(emoji) {
  if (sharedEmojiImageCache.has(emoji)) return sharedEmojiImageCache.get(emoji)
  const map = await loadSharedEmojiMap()
  const base = emojiToUnicode(emoji)
  const variants = [
    base,
    base.replace(/-fe0f/gi, ''),
    `${base.replace(/-fe0f/gi, '')}-fe0f`,
    base.toUpperCase(),
    base.replace(/-fe0f/gi, '').toUpperCase(),
    base.replace(/-fe0f/gi, '').toUpperCase() + '-FE0F'
  ]
  let b64 = null
  for (const v of variants) {
    if (map[v]) { b64 = map[v]; break }
  }
  if (!b64) return null
  const img = await loadImage(Buffer.from(b64, 'base64'))
  sharedEmojiImageCache.set(emoji, img)
  return img
}

async function makeStickerBuffer(imageBuffer) {
  const sticker = new Sticker(imageBuffer, {
    pack: global.packname || 'Hitoshi MD V1',
    author: global.author || 'Kureza MD',
    type: 'full',
    quality: 80
  })
  return sticker.toBuffer()
}

async function addStickerExif(webpBuffer) {
  const img = new WebP.Image()
  await img.load(webpBuffer)

  const json = {
    'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
    'sticker-pack-name': global.packname || 'Hitoshi MD V1',
    'sticker-pack-publisher': global.author || 'Kureza MD',
    emojis: ['🔥']
  }
  const exifAttr = Buffer.from([
    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
  ])
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8')
  const exif = Buffer.concat([exifAttr, jsonBuffer])
  exif.writeUIntLE(jsonBuffer.length, 14, 4)

  img.exif = exif
  return img.save(null)
}

const ClassicEngine = (() => {
  const FONT_URL = 'https://cdn.jsdelivr.net/gh/Napoleon-Fibonacci/assets@main/font/impact.ttf'
  const EMOJI_JSON_URL = 'https://media.githubusercontent.com/media/Ditzzx-vibecoder/entahlah/main/emoji-apple.json'
  const FONT_PATH = path.join(CACHE_DIR, 'classic-impact.ttf')
  const EMOJI_JSON_PATH = path.join(CACHE_DIR, 'classic-emoji-apple.json')

  const THEMES = {
    black: { bg: '#000000', text: '#ffffff' },
    white: { bg: '#ffffff', text: '#000000' },
    green: { bg: '#8ace00', text: '#000000' }
  }

  let fontReady = false
  let emojiMap = null
  const emojiImageCache = new Map()

  async function ensureFont() {
    if (fontReady) return
    if (!fs.existsSync(FONT_PATH)) {
      const buf = await getBuffer(FONT_URL)
      fs.writeFileSync(FONT_PATH, buf)
    }
    GlobalFonts.registerFromPath(FONT_PATH, 'Impact')
    fontReady = true
  }

  function emojiToUnicode(emoji) {
    return [...emoji].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-')
  }

  async function loadEmojiMap() {
    if (emojiMap) return emojiMap
    if (!fs.existsSync(EMOJI_JSON_PATH)) {
      const buf = await getBuffer(EMOJI_JSON_URL)
      fs.writeFileSync(EMOJI_JSON_PATH, buf)
    }
    emojiMap = JSON.parse(fs.readFileSync(EMOJI_JSON_PATH, 'utf-8'))
    return emojiMap
  }

  async function getEmojiImage(emoji) {
    if (emojiImageCache.has(emoji)) return emojiImageCache.get(emoji)
    const map = await loadEmojiMap()
    const base = emojiToUnicode(emoji)
    const variants = [
      base,
      base.replace(/-fe0f/gi, ''),
      `${base.replace(/-fe0f/gi, '')}-fe0f`,
      base.toUpperCase(),
      base.replace(/-fe0f/gi, '').toUpperCase(),
      base.replace(/-fe0f/gi, '').toUpperCase() + '-FE0F'
    ]
    let b64 = null
    for (const v of variants) {
      if (map[v]) { b64 = map[v]; break }
    }
    if (!b64) return null
    const img = await loadImage(Buffer.from(b64, 'base64'))
    emojiImageCache.set(emoji, img)
    return img
  }

  async function drawAppleEmoji(ctx, emoji, x, y, size) {
    const img = await getEmojiImage(emoji)
    if (!img) { ctx.fillText(emoji, x, y); return }
    ctx.drawImage(img, x, y, size, size)
  }

  const EMOJI_REGEX = /(\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}\uFE0F?|\p{Emoji}\uFE0F|[\u{1F1E0}-\u{1F1FF}]{2}|\p{Extended_Pictographic}\uFE0F?)/gu

  function measureTextCustom(ctx, text, fontSize) {
    const parts = text.split(EMOJI_REGEX)
    let w = 0
    for (const part of parts) {
      if (!part) continue
      EMOJI_REGEX.lastIndex = 0
      if (EMOJI_REGEX.test(part)) w += fontSize
      else w += ctx.measureText(part).width
      EMOJI_REGEX.lastIndex = 0
    }
    return w
  }

  async function drawTextWithEmojis(ctx, text, x, y, fontSize) {
    const parts = text.split(EMOJI_REGEX)
    let curX = x
    for (const part of parts) {
      if (!part) continue
      EMOJI_REGEX.lastIndex = 0
      if (EMOJI_REGEX.test(part)) {
        await drawAppleEmoji(ctx, part, curX, y, fontSize)
        curX += fontSize
      } else {
        ctx.fillText(part, curX, y)
        curX += ctx.measureText(part).width
      }
      EMOJI_REGEX.lastIndex = 0
    }
  }

  function wrapText(ctx, text, maxWidth, fontSize) {
    ctx.font = `${fontSize}px Impact`
    const words = text.split(' ')
    const lines = []
    let cur = ''
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word
      if (measureTextCustom(ctx, test, fontSize) > maxWidth && cur) {
        lines.push(cur)
        cur = word
      } else {
        cur = test
      }
    }
    if (cur) lines.push(cur)
    return lines
  }

  function fitsAt(ctx, text, fontSize, maxWidth, maxHeight, lineGap) {
    const lines = wrapText(ctx, text, maxWidth, fontSize)
    const longestWord = Math.max(...text.split(' ').map(w => measureTextCustom(ctx, w, fontSize)))
    const totalHeight = lines.length * (fontSize + lineGap) - lineGap
    return longestWord <= maxWidth && totalHeight <= maxHeight
  }

  function findBestFontSize(ctx, text, maxWidth, maxHeight, lineGap) {
    let lo = 10
    let hi = 700
    let best = lo
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (fitsAt(ctx, text, mid, maxWidth, maxHeight, lineGap)) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return best
  }

  function easeOutBack(x) {
    const c1 = 1.4
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
  }

  function calculateWordLayout(ctx, fullText, maxWidth, maxHeight, lineGap, margin, padding, boxSize) {
    const fontSize = findBestFontSize(ctx, fullText, maxWidth, maxHeight, lineGap)
    ctx.font = `${fontSize}px Impact`
    const defaultSpaceWidth = ctx.measureText(' ').width

    const fullLines = wrapText(ctx, fullText, maxWidth, fontSize)
    const totalTextHeight = fullLines.length * (fontSize + lineGap) - lineGap
    const startY = margin + (boxSize - totalTextHeight) / 2

    const wordLayouts = []
    let currentY = startY

    for (let l = 0; l < fullLines.length; l++) {
      const line = fullLines[l]
      const lineWords = line.split(' ').filter(Boolean)
      const isLastLine = (l === fullLines.length - 1)
      const totalWordsW = lineWords.reduce((acc, w) => acc + measureTextCustom(ctx, w, fontSize), 0)

      let spaceBetween = defaultSpaceWidth
      if (!isLastLine && lineWords.length > 1) {
        spaceBetween = (maxWidth - totalWordsW) / (lineWords.length - 1)
      }

      let currentX = margin + padding
      for (const word of lineWords) {
        const wordW = measureTextCustom(ctx, word, fontSize)
        wordLayouts.push({ text: word, x: currentX, y: currentY, w: wordW, h: fontSize })
        currentX += wordW + spaceBetween
      }
      currentY += fontSize + lineGap
    }

    return { fontSize, wordLayouts }
  }

  async function renderCanvas({ wordLayouts, fontSize, wordStates, theme, blurAmount, highlightProgress = 0, format = 'mp4', margin = 70 }) {
    const selectedTheme = THEMES[theme] || THEMES.white
    const size = 1000
    const boxSize = size - margin * 2
    const x = margin
    const y = margin
    const w = boxSize
    const h = boxSize

    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    if (format !== 'gif') {
      ctx.fillStyle = selectedTheme.bg
      ctx.fillRect(0, 0, size, size)
    } else {
      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = selectedTheme.bg
      ctx.fillRect(x, y, w, h)
    }

    if (!wordLayouts || wordLayouts.length === 0) return canvas

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()

    ctx.fillStyle = selectedTheme.text
    ctx.font = `${fontSize}px Impact`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    if (blurAmount > 0) ctx.filter = `blur(${blurAmount}px)`

    for (let idx = 0; idx < wordLayouts.length; idx++) {
      const item = wordLayouts[idx]
      const state = wordStates[idx] || { scale: 0, alpha: 0, visible: false }
      if (!state.visible) continue

      const centerX = item.x + item.w / 2
      const centerY = item.y + fontSize / 2

      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, state.alpha))

      if (state.scale !== 1.0) {
        ctx.translate(centerX, centerY)
        ctx.scale(state.scale, state.scale)
        ctx.translate(-centerX, -centerY)
      }

      await drawTextWithEmojis(ctx, item.text, item.x, item.y, fontSize)
      ctx.restore()
    }

    if (highlightProgress > 0 && highlightProgress <= 1) {
      const totalDist = boxSize * 2.8
      const curr = margin - boxSize * 1.0 + highlightProgress * totalDist
      const sweepW = boxSize * 0.95
      const grad = ctx.createLinearGradient(curr, curr, curr + sweepW, curr + sweepW)

      grad.addColorStop(0.00, 'rgba(255, 255, 255, 0)')
      grad.addColorStop(0.10, 'rgba(255, 255, 255, 0.35)')
      grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.95)')
      grad.addColorStop(0.38, 'rgba(255, 255, 255, 0.35)')
      grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.05)')
      grad.addColorStop(0.52, 'rgba(255, 255, 255, 0.05)')
      grad.addColorStop(0.60, 'rgba(255, 255, 255, 0.35)')
      grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.95)')
      grad.addColorStop(0.88, 'rgba(255, 255, 255, 0.35)')
      grad.addColorStop(1.00, 'rgba(255, 255, 255, 0)')

      ctx.fillStyle = grad
      ctx.fillRect(margin, margin, boxSize, boxSize)
    }

    ctx.restore()
    return canvas
  }

  async function generateImage(text, { theme = 'white', blur = 0 } = {}) {
    await ensureFont()
    await loadEmojiMap()
    if (!text.trim()) throw new Error('Teks kosong')

    const size = 1000
    const margin = 70
    const padding = 40
    const boxSize = size - margin * 2
    const lineGap = 15
    const maxWidth = boxSize - padding * 2
    const maxHeight = boxSize - padding * 2

    const dummyCanvas = createCanvas(size, size)
    const dummyCtx = dummyCanvas.getContext('2d')
    const { fontSize, wordLayouts } = calculateWordLayout(dummyCtx, text, maxWidth, maxHeight, lineGap, margin, padding, boxSize)
    const allVisible = wordLayouts.map(() => ({ scale: 1.0, alpha: 1.0, visible: true }))

    const canvas = await renderCanvas({ wordLayouts, fontSize, wordStates: allVisible, theme, blurAmount: blur, highlightProgress: 0, format: 'png', margin })
    return canvas.encode('png')
  }

  async function generateVideo(text, { theme = 'white', blur = 0, holdDuration = 1.5, fastProgress = true } = {}) {
    const blurAmount = [0, 1, 2, 3].includes(blur) ? blur : 0
    await ensureFont()
    await loadEmojiMap()
    if (!text.trim()) throw new Error('Teks kosong')

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brat-classic-'))
    const FPS = 60
    const frameStepTime = 1 / FPS
    const tasks = []

    const size = 1000
    const margin = 70
    const padding = 40
    const boxSize = size - margin * 2
    const lineGap = 15
    const maxWidth = boxSize - padding * 2
    const maxHeight = boxSize - padding * 2

    const dummyCanvas = createCanvas(size, size)
    const dummyCtx = dummyCanvas.getContext('2d')
    const { fontSize, wordLayouts } = calculateWordLayout(dummyCtx, text, maxWidth, maxHeight, lineGap, margin, padding, boxSize)
    const totalWords = wordLayouts.length

    tasks.push({ wordStates: wordLayouts.map(() => ({ scale: 0, alpha: 0, visible: false })), highlightProgress: 0, duration: 0.15 })

    const staggerFrames = 5
    const bounceFramesCount = 28
    const totalBounceFrames = (totalWords - 1) * staggerFrames + bounceFramesCount

    for (let f = 0; f < totalBounceFrames; f++) {
      const wordStates = wordLayouts.map((_, i) => {
        const startFrame = i * staggerFrames
        const currentFrame = f - startFrame
        if (currentFrame < 0) return { scale: 0, alpha: 0, visible: false }
        if (currentFrame >= bounceFramesCount) return { scale: 1.0, alpha: 1.0, visible: true }
        const prog = currentFrame / (bounceFramesCount - 1)
        const bounceFactor = easeOutBack(prog)
        const scale = 0.2 + (1.0 - 0.2) * bounceFactor
        const alpha = Math.min(1.0, prog * 1.8)
        return { scale, alpha, visible: true }
      })
      const highlightProgress = (f + 1) / totalBounceFrames
      tasks.push({ wordStates, highlightProgress, duration: frameStepTime })
    }

    const secondHighlightFrames = 38
    const allVisibleStates = wordLayouts.map(() => ({ scale: 1.0, alpha: 1.0, visible: true }))
    for (let hf = 0; hf < secondHighlightFrames; hf++) {
      const highlightProgress = (hf + 1) / secondHighlightFrames
      tasks.push({ wordStates: allVisibleStates, highlightProgress, duration: frameStepTime })
    }
    tasks.push({ wordStates: allVisibleStates, highlightProgress: 0, duration: holdDuration })

    const renderFrame = async (task, index) => {
      const canvas = await renderCanvas({ wordLayouts, fontSize, wordStates: task.wordStates, theme, blurAmount, highlightProgress: task.highlightProgress, format: 'mp4', margin })
      const buffer = await canvas.encode('png')
      const framePath = path.join(tmpDir, `frame-${String(index + 1).padStart(5, '0')}.png`)
      fs.writeFileSync(framePath, buffer)
      return { path: framePath, duration: task.duration }
    }

    let framePaths
    if (fastProgress) {
      framePaths = await Promise.all(tasks.map((task, i) => renderFrame(task, i)))
    } else {
      framePaths = []
      for (let i = 0; i < tasks.length; i++) framePaths.push(await renderFrame(tasks[i], i))
    }

    const manifestLines = []
    for (let i = 0; i < framePaths.length; i++) {
      manifestLines.push(`file '${framePaths[i].path.replace(/'/g, "'\\''")}'`)
      manifestLines.push(`duration ${framePaths[i].duration}`)
    }
    manifestLines.push(`file '${framePaths[framePaths.length - 1].path.replace(/'/g, "'\\''")}'`)

    const concatPath = path.join(tmpDir, 'concat.txt')
    fs.writeFileSync(concatPath, manifestLines.join('\n'))

    const outPath = path.join(tmpDir, `out-${Date.now()}.mp4`)
    await execFileAsync('ffmpeg', [
      '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
      '-vf', 'fps=60,scale=1000:1000',
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      outPath
    ])

    const buffer = fs.readFileSync(outPath)
    fs.rmSync(tmpDir, { recursive: true, force: true })
    return buffer
  }

  async function generateSticker(text, { theme = 'white', blur = 0, holdDuration = 1.0, fastProgress = true } = {}) {
    const blurAmount = [0, 1, 2, 3].includes(blur) ? blur : 0
    await ensureFont()
    await loadEmojiMap()
    if (!text.trim()) throw new Error('Teks kosong')

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brat-classic-stk-'))
    try {
      const FPS = 30
      const frameStepTime = 1 / FPS
      const tasks = []

      const size = 1000
      const margin = 70
      const padding = 40
      const boxSize = size - margin * 2
      const lineGap = 15
      const maxWidth = boxSize - padding * 2
      const maxHeight = boxSize - padding * 2

      const dummyCanvas = createCanvas(size, size)
      const dummyCtx = dummyCanvas.getContext('2d')
      const { fontSize, wordLayouts } = calculateWordLayout(dummyCtx, text, maxWidth, maxHeight, lineGap, margin, padding, boxSize)
      const totalWords = wordLayouts.length

      tasks.push({ wordStates: wordLayouts.map(() => ({ scale: 0, alpha: 0, visible: false })), highlightProgress: 0, duration: 0.1 })

      const staggerFrames = 3
      const bounceFramesCount = 14
      const totalBounceFrames = (totalWords - 1) * staggerFrames + bounceFramesCount

      for (let f = 0; f < totalBounceFrames; f++) {
        const wordStates = wordLayouts.map((_, i) => {
          const startFrame = i * staggerFrames
          const currentFrame = f - startFrame
          if (currentFrame < 0) return { scale: 0, alpha: 0, visible: false }
          if (currentFrame >= bounceFramesCount) return { scale: 1.0, alpha: 1.0, visible: true }
          const prog = currentFrame / (bounceFramesCount - 1)
          const bounceFactor = easeOutBack(prog)
          const scale = 0.2 + (1.0 - 0.2) * bounceFactor
          const alpha = Math.min(1.0, prog * 1.8)
          return { scale, alpha, visible: true }
        })
        const highlightProgress = (f + 1) / totalBounceFrames
        tasks.push({ wordStates, highlightProgress, duration: frameStepTime })
      }

      const secondHighlightFrames = 18
      const allVisibleStates = wordLayouts.map(() => ({ scale: 1.0, alpha: 1.0, visible: true }))
      for (let hf = 0; hf < secondHighlightFrames; hf++) {
        const highlightProgress = (hf + 1) / secondHighlightFrames
        tasks.push({ wordStates: allVisibleStates, highlightProgress, duration: frameStepTime })
      }
      tasks.push({ wordStates: allVisibleStates, highlightProgress: 0, duration: holdDuration })

      const renderFrame = async (task, index) => {
        const canvas = await renderCanvas({ wordLayouts, fontSize, wordStates: task.wordStates, theme, blurAmount, highlightProgress: task.highlightProgress, format: 'mp4', margin })
        const buffer = await canvas.encode('png')
        const framePath = path.join(tmpDir, `frame-${String(index + 1).padStart(5, '0')}.png`)
        fs.writeFileSync(framePath, buffer)
        return { path: framePath, duration: task.duration }
      }

      let framePaths
      if (fastProgress) {
        framePaths = await Promise.all(tasks.map((task, i) => renderFrame(task, i)))
      } else {
        framePaths = []
        for (let i = 0; i < tasks.length; i++) framePaths.push(await renderFrame(tasks[i], i))
      }

      const manifestLines = []
      for (let i = 0; i < framePaths.length; i++) {
        manifestLines.push(`file '${framePaths[i].path.replace(/'/g, "'\\''")}'`)
        manifestLines.push(`duration ${framePaths[i].duration}`)
      }
      manifestLines.push(`file '${framePaths[framePaths.length - 1].path.replace(/'/g, "'\\''")}'`)

      const concatPath = path.join(tmpDir, 'concat.txt')
      fs.writeFileSync(concatPath, manifestLines.join('\n'))

      async function encodeWebp({ outFps, qscale }) {
        const outPath = path.join(tmpDir, `out-${outFps}-${qscale}.webp`)
        await execFileAsync('ffmpeg', [
          '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
          '-vcodec', 'libwebp',
          '-filter:v', `fps=${outFps},scale=512:512:flags=lanczos`,
          '-lossless', '0', '-compression_level', '6', '-qscale', String(qscale),
          '-loop', '0', '-an', '-vsync', '0',
          outPath
        ], { maxBuffer: 1024 * 1024 * 10 })
        return fs.readFileSync(outPath)
      }

      const MAX_STICKER_BYTES = 900 * 1024
      const QUALITY_STEPS = [
        { outFps: 15, qscale: 55 },
        { outFps: 12, qscale: 45 },
        { outFps: 10, qscale: 35 },
        { outFps: 8, qscale: 25 },
        { outFps: 8, qscale: 15 }
      ]

      let smallest = null
      for (const step of QUALITY_STEPS) {
        const buf = await encodeWebp(step)
        if (!smallest || buf.length < smallest.length) smallest = buf
        if (buf.length <= MAX_STICKER_BYTES) return buf
      }
      return smallest
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  return { generateImage, generateVideo, generateSticker }
})()

const GojoEngine = (() => {
  const BRAT_IMAGE_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Gojo.jpeg'
  const BRAT_FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Poppins.ttf'
  const IMAGE_PATH = path.join(CACHE_DIR, 'gojo-bg.jpeg')
  const FONT_PATH = path.join(CACHE_DIR, 'gojo-poppins.ttf')

  const CANVAS = { width: 1254, height: 1254 }
  const SAFE_ZONE = { a: 660, b: 1180, c: 270, d: 990 }
  const TEXT_STYLE = { fontFamily: 'Poppins', maxFontSize: 90, minFontSize: 22, lineHeight: 1.18, color: '#111111', align: 'center' }

  let ready = false
  let bgImageCache = null

  async function ensureAssets() {
    if (ready) return
    if (!fs.existsSync(IMAGE_PATH)) fs.writeFileSync(IMAGE_PATH, await getBuffer(BRAT_IMAGE_URL))
    if (!fs.existsSync(FONT_PATH)) fs.writeFileSync(FONT_PATH, await getBuffer(BRAT_FONT_URL))
    GlobalFonts.registerFromPath(FONT_PATH, TEXT_STYLE.fontFamily)
    ready = true
  }

  function normalizeText(text) {
    return String(text || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  }

  function getSafeRect(zone) {
    return { x: zone.c, y: zone.a, w: zone.d - zone.c, h: zone.b - zone.a, centerX: (zone.c + zone.d) / 2, centerY: (zone.a + zone.b) / 2 }
  }

  function setFont(ctx, size) { ctx.font = `${size}px ${TEXT_STYLE.fontFamily}` }

  function splitLongWord(ctx, word, maxWidth) {
    const chars = [...word]
    const parts = []
    let current = ''
    for (const char of chars) {
      const test = current + char
      if (ctx.measureText(test).width <= maxWidth || !current) current = test
      else { parts.push(current); current = char }
    }
    if (current) parts.push(current)
    return parts
  }

  function wrapParagraph(ctx, paragraph, maxWidth) {
    const words = paragraph.split(' ').filter(Boolean)
    const lines = []
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (ctx.measureText(test).width <= maxWidth) { current = test; continue }
      if (current) { lines.push(current); current = '' }
      if (ctx.measureText(word).width <= maxWidth) current = word
      else {
        const parts = splitLongWord(ctx, word, maxWidth)
        lines.push(...parts.slice(0, -1))
        current = parts.at(-1) || ''
      }
    }
    if (current) lines.push(current)
    return lines
  }

  function wrapText(ctx, text, maxWidth) {
    return text.split('\n').flatMap((paragraph) => {
      const clean = paragraph.trim()
      return clean ? wrapParagraph(ctx, clean, maxWidth) : ['']
    })
  }

  function fitText(ctx, text, rect) {
    for (let size = TEXT_STYLE.maxFontSize; size >= TEXT_STYLE.minFontSize; size--) {
      setFont(ctx, size)
      const lineHeight = Math.ceil(size * TEXT_STYLE.lineHeight)
      const lines = wrapText(ctx, text, rect.w)
      const totalHeight = lines.length * lineHeight
      if (totalHeight <= rect.h) return { size, lines, lineHeight, totalHeight }
    }
    const size = TEXT_STYLE.minFontSize
    setFont(ctx, size)
    const lineHeight = Math.ceil(size * TEXT_STYLE.lineHeight)
    const lines = wrapText(ctx, text, rect.w)
    const maxLines = Math.max(1, Math.floor(rect.h / lineHeight))
    const clipped = lines.slice(0, maxLines)
    if (lines.length > maxLines && clipped.length) {
      let last = clipped[clipped.length - 1]
      while (last.length > 0 && ctx.measureText(`${last}...`).width > rect.w) last = last.slice(0, -1)
      clipped[clipped.length - 1] = `${last}...`
    }
    return { size, lines: clipped, lineHeight, totalHeight: clipped.length * lineHeight }
  }

  function drawCenteredText(ctx, text, zone) {
    const rect = getSafeRect(zone)
    const fitted = fitText(ctx, text, rect)
    const startY = rect.y + (rect.h - fitted.totalHeight) / 2

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.w, rect.h)
    ctx.clip()

    setFont(ctx, fitted.size)
    ctx.fillStyle = TEXT_STYLE.color
    ctx.textAlign = TEXT_STYLE.align
    ctx.textBaseline = 'top'

    fitted.lines.forEach((line, index) => {
      const y = startY + index * fitted.lineHeight
      ctx.fillText(line, rect.centerX, y)
    })
    ctx.restore()
  }

  async function getBgImage() {
    if (bgImageCache) return bgImageCache
    bgImageCache = await loadImage(fs.readFileSync(IMAGE_PATH))
    return bgImageCache
  }

  async function generateImage(text) {
    await ensureAssets()
    const inputText = normalizeText(text)
    const image = await getBgImage()
    const canvas = createCanvas(CANVAS.width, CANVAS.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, CANVAS.width, CANVAS.height)
    drawCenteredText(ctx, inputText, SAFE_ZONE)
    return canvas.encode('png')
  }

  function tokenize(text) {
    return normalizeText(text).replace(/[,，]/g, ' ').split(/\s+/).map(v => v.trim()).filter(Boolean)
  }

  function splitIntoLayers(tokens, maxWordPerLayer) {
    if (!Number.isFinite(maxWordPerLayer) || maxWordPerLayer <= 0) return [tokens]
    const layers = []
    for (let i = 0; i < tokens.length; i += maxWordPerLayer) layers.push(tokens.slice(i, i + maxWordPerLayer))
    return layers
  }

  function resolveDurations(frames, lyric) {
    return frames.map((frame) => frame.isLastInLayer ? Math.max(0.05, lyric.lastFrameDuration) : Math.max(0.05, lyric.frameDuration))
  }

  function buildRevealFrames(text, config) {
    const tokens = tokenize(text)
    const layers = splitIntoLayers(tokens, config.lyric.maxWordPerLayer)
    const frames = []
    for (const layer of layers) {
      let current = ''
      for (let i = 0; i < layer.length; i++) {
        current += (current ? ' ' : '') + layer[i]
        frames.push({ text: current, isLastInLayer: i === layer.length - 1 })
      }
    }
    const durations = resolveDurations(frames, config.lyric)
    return frames.map((frame, index) => ({ ...frame, duration: durations[index] }))
  }

  async function createFrame(image, text, filePath) {
    const canvas = createCanvas(CANVAS.width, CANVAS.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, CANVAS.width, CANVAS.height)
    drawCenteredText(ctx, text, SAFE_ZONE)
    fs.writeFileSync(filePath, await canvas.encode('png'))
  }

  function escapeConcatPath(filePath) { return filePath.replace(/'/g, "'\\''") }

  function buildManifest(frames, framePaths) {
    const lines = []
    for (let i = 0; i < frames.length; i++) {
      lines.push(`file '${escapeConcatPath(framePaths[i])}'`)
      lines.push(`duration ${frames[i].duration}`)
    }
    lines.push(`file '${escapeConcatPath(framePaths[framePaths.length - 1])}'`)
    return lines.join('\n')
  }

  const STICKER_CONFIG = {
    fast_progress: true, fps: 10, width: 512, height: 512,
    lyric: { maxWordPerLayer: 5, frameDuration: 0.7, lastFrameDuration: 1.5 }
  }

  async function generateSticker(text) {
    await ensureAssets()
    const frames = buildRevealFrames(text, STICKER_CONFIG)
    if (!frames.length) throw new Error('Teks kosong')

    const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'brat-gojosticker-'))
    try {
      const image = await getBgImage()
      const framePaths = frames.map((_, index) => path.join(tmpDir, `frame-${String(index + 1).padStart(4, '0')}.png`))

      const batchSize = 5
      for (let start = 0; start < frames.length; start += batchSize) {
        const batch = frames.slice(start, start + batchSize)
        await Promise.all(batch.map((frame, i) => createFrame(image, frame.text, framePaths[start + i])))
      }

      const concatPath = path.join(tmpDir, 'concat.txt')
      fs.writeFileSync(concatPath, buildManifest(frames, framePaths))

      const outputPath = path.join(tmpDir, `out-${Date.now()}.webp`)
      await execFileAsync('ffmpeg', [
        '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
        '-vcodec', 'libwebp',
        '-filter:v', `fps=${STICKER_CONFIG.fps},scale=${STICKER_CONFIG.width}:${STICKER_CONFIG.height}:flags=lanczos`,
        '-lossless', '0', '-compression_level', '6', '-qscale', '60',
        '-loop', '0', '-an', '-vsync', '0',
        outputPath
      ], { maxBuffer: 1024 * 1024 * 10 })

      const buffer = fs.readFileSync(outputPath)
      return buffer
    } finally {
      await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    }
  }

  return { generateImage, generateSticker }
})()

const VermeilEngine = (() => {
  const BRAT_IMAGE_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Vermile.jpg'
  const BRAT_FONT_URL = 'https://raw.githubusercontent.com/Ditzzx-vibecoder/Assets/main/Brat/Poppins.ttf'
  const EMOJI_FONT_URL = 'https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf'

  const IMAGE_PATH = path.join(CACHE_DIR, 'vermeil-bg.jpg')
  const FONT_PATH = path.join(CACHE_DIR, 'vermeil-poppins.ttf')
  const EMOJI_FONT_PATH = path.join(CACHE_DIR, 'vermeil-emoji.ttf')

  const CONFIG = {
    width: 1254, height: 1254,
    safeZone: { a: 655, b: 1118, c: 282, d: 993 },
    style: { fontFamily: 'Poppins', emojiFont: 'Noto Color Emoji', maxFontSize: 90, minFontSize: 22, lineHeight: 1.18, color: '#111111' },
    video: { fps: 10, outWidth: 512, outHeight: 512, maxWordPerLayer: 5, frameDuration: 0.6, lastFrameDuration: 1.2 }
  }

  let ready = false
  let bgImageCache = null

  async function ensureAssets() {
    if (ready) return
    if (!fs.existsSync(IMAGE_PATH)) fs.writeFileSync(IMAGE_PATH, await getBuffer(BRAT_IMAGE_URL))
    if (!fs.existsSync(FONT_PATH)) fs.writeFileSync(FONT_PATH, await getBuffer(BRAT_FONT_URL))
    if (!fs.existsSync(EMOJI_FONT_PATH)) fs.writeFileSync(EMOJI_FONT_PATH, await getBuffer(EMOJI_FONT_URL))
    GlobalFonts.registerFromPath(FONT_PATH, CONFIG.style.fontFamily)
    GlobalFonts.registerFromPath(EMOJI_FONT_PATH, CONFIG.style.emojiFont)
    ready = true
  }

  function drawCenteredText(ctx, text) {
    const { safeZone, style } = CONFIG
    const rect = { x: safeZone.c, y: safeZone.a, w: safeZone.d - safeZone.c, h: safeZone.b - safeZone.a, centerX: (safeZone.c + safeZone.d) / 2 }
    let fontSize = style.maxFontSize
    let lines = []

    while (fontSize >= style.minFontSize) {
      ctx.font = `${fontSize}px ${style.fontFamily}, "${style.emojiFont}"`
      lines = []
      const words = text.split(' ')
      let currentLine = ''
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        if (ctx.measureText(testLine).width <= rect.w) currentLine = testLine
        else { lines.push(currentLine); currentLine = word }
      }
      lines.push(currentLine)
      if (lines.length * (fontSize * style.lineHeight) <= rect.h) break
      fontSize--
    }

    const lineHeight = fontSize * style.lineHeight
    let startY = rect.y + (rect.h - (lines.length * lineHeight)) / 2
    ctx.fillStyle = style.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    for (const line of lines) {
      ctx.fillText(line, rect.centerX, startY)
      startY += lineHeight
    }
  }

  async function getBgImage() {
    if (bgImageCache) return bgImageCache
    bgImageCache = await loadImage(fs.readFileSync(IMAGE_PATH))
    return bgImageCache
  }

  async function generate(text) {
    await ensureAssets()
    const workDir = path.join(os.tmpdir(), `diezy-vermeil-${crypto.randomUUID()}`)
    const outputPath = `${workDir}.webp`

    try {
      await fsp.mkdir(workDir, { recursive: true })
      const bgImage = await getBgImage()
      const tokens = text.trim().split(/\s+/).filter(Boolean)
      const framesData = []
      for (let i = 0; i < tokens.length; i += CONFIG.video.maxWordPerLayer) {
        const layer = tokens.slice(i, i + CONFIG.video.maxWordPerLayer)
        let current = ''
        for (let j = 0; j < layer.length; j++) {
          current += (current ? ' ' : '') + layer[j]
          framesData.push({ text: current, duration: j === layer.length - 1 ? CONFIG.video.lastFrameDuration : CONFIG.video.frameDuration })
        }
      }

      const framePaths = []
      for (let i = 0; i < framesData.length; i++) {
        const canvas = createCanvas(CONFIG.width, CONFIG.height)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(bgImage, 0, 0, CONFIG.width, CONFIG.height)
        drawCenteredText(ctx, framesData[i].text)
        const p = path.join(workDir, `f${i}.png`)
        await fsp.writeFile(p, await canvas.encode('png'))
        framePaths.push({ path: p, duration: framesData[i].duration })
      }

      const manifestPath = path.join(workDir, 'manifest.txt')
      let manifest = framePaths.map(f => `file '${f.path.replace(/'/g, "'\\''")}'\nduration ${f.duration}`).join('\n')
      manifest += `\nfile '${framePaths[framePaths.length - 1].path.replace(/'/g, "'\\''")}'`
      await fsp.writeFile(manifestPath, manifest)

      const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i "${manifestPath}" -vcodec libwebp -filter:v "fps=${CONFIG.video.fps},scale=${CONFIG.video.outWidth}:${CONFIG.video.outHeight}:flags=lanczos" -lossless 0 -compression_level 6 -qscale 60 -loop 0 -an -vsync 0 "${outputPath}"`
      await promisify(require('child_process').exec)(ffmpegCmd)

      const buffer = fs.readFileSync(outputPath)
      return buffer
    } finally {
      await fsp.rm(workDir, { recursive: true, force: true }).catch(() => {})
      await fsp.rm(outputPath, { force: true }).catch(() => {})
    }
  }

  return { generate }
})()

const ViralEngine = (() => {
  const FONTS = {
    anton: { name: 'Anton', file: 'viral-anton.ttf', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf' }
  }

  const W = 720
  const H = 720
  const FPS = 30
  const DURATION = 4
  const FRAMES = FPS * DURATION
  const WORD_DELAY = 2
  const ZOOM_FRAMES = 7
  const SHINE_FRAMES = 32
  const SHINE_WIDTH = 260
  const MAX_WORDS_PER_LINE = 2
  const MAX_TEXT_WIDTH = 590
  const MIN_FONT_SIZE = 35
  const MAX_FONT_SIZE = 105
  const EMOJI_SIZE = 76

  let fontsReady = false

  async function ensureFonts() {
    if (fontsReady) return
    for (const key of Object.keys(FONTS)) {
      const f = FONTS[key]
      const dest = path.join(CACHE_DIR, f.file)
      try {
        if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
          const buf = await getBuffer(f.url)
          fs.writeFileSync(dest, buf)
        }
        if (!GlobalFonts.has(f.name)) GlobalFonts.registerFromPath(dest, f.name)
      } catch (e) {
        if (fs.existsSync(dest)) fs.rmSync(dest, { force: true })
        throw new Error(`Gagal ambil font ${f.name} dari ${f.url}: ${e.message}`)
      }
    }
    fontsReady = true
  }

  function easeOutBack(t) {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4) }

  function getScale(elapsed) {
    const p = Math.min(1, elapsed / ZOOM_FRAMES)
    if (p < 0.72) {
      const t = p / 0.72
      return 0.08 + easeOutBack(t) * 1.02
    }
    const t = (p - 0.72) / 0.28
    return 1.10 - easeOutQuart(t) * 0.10
  }

  function getShine(elapsed) { return (elapsed % SHINE_FRAMES) / SHINE_FRAMES }

  function applyShine(image, width, height, elapsed) {
    const ictx = image.getContext('2d')
    const mask = ictx.getImageData(0, 0, width, height)
    const result = createCanvas(width, height)
    const rctx = result.getContext('2d')
    const p = getShine(elapsed)
    const start = -width - height
    const end = width + height
    const travel = start + p * (end - start)

    const gradient = rctx.createLinearGradient(travel - height - SHINE_WIDTH, -height, travel + height + SHINE_WIDTH, height)
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.25, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.38, 'rgba(255,255,255,0.18)')
    gradient.addColorStop(0.44, 'rgba(255,255,255,0.42)')
    gradient.addColorStop(0.48, 'rgba(255,255,255,0.78)')
    gradient.addColorStop(0.50, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.52, 'rgba(255,255,255,0.78)')
    gradient.addColorStop(0.56, 'rgba(255,255,255,0.42)')
    gradient.addColorStop(0.62, 'rgba(255,255,255,0.18)')
    gradient.addColorStop(0.75, 'rgba(255,255,255,0)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')

    rctx.fillStyle = gradient
    rctx.fillRect(0, 0, width, height)

    const light = rctx.getImageData(0, 0, width, height)
    for (let i = 0; i < light.data.length; i += 4) {
      light.data[i] = 255
      light.data[i + 1] = 255
      light.data[i + 2] = 255
      light.data[i + 3] = Math.min(mask.data[i + 3], light.data[i + 3])
    }
    rctx.putImageData(light, 0, 0)
    return result
  }

  function parseTokens(text) {
    const regex = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu
    const result = []
    let last = 0
    for (const match of text.matchAll(regex)) {
      const index = match.index
      if (index > last) {
        const words = text.slice(last, index).trim().split(/\s+/).filter(Boolean)
        for (const word of words) result.push({ type: 'word', text: word })
      }
      result.push({ type: 'emoji', text: match[0] })
      last = index + match[0].length
    }
    if (last < text.length) {
      const words = text.slice(last).trim().split(/\s+/).filter(Boolean)
      for (const word of words) result.push({ type: 'word', text: word })
    }
    return result
  }

  async function generate(text) {
    await ensureFonts()

    const canvas = createCanvas(W, H)
    const ctx = canvas.getContext('2d')
    const tokens = parseTokens(text)

    let fontSize = MAX_FONT_SIZE
    let lines = []

    while (fontSize >= MIN_FONT_SIZE) {
      ctx.font = `900 ${fontSize}px "${FONTS.anton.name}"`
      lines = []
      for (let i = 0; i < tokens.length; i += MAX_WORDS_PER_LINE) lines.push(tokens.slice(i, i + MAX_WORDS_PER_LINE))

      const lineHeight = fontSize * 1.05
      let valid = true
      for (const line of lines) {
        let width = 0
        for (let i = 0; i < line.length; i++) {
          const item = line[i]
          width += item.type === 'word' ? ctx.measureText(item.text).width : EMOJI_SIZE
          if (i < line.length - 1) width += ctx.measureText(' ').width
        }
        if (width > MAX_TEXT_WIDTH) { valid = false; break }
      }
      if (valid && lines.length * lineHeight <= 500) break
      fontSize -= 2
    }

    ctx.font = `900 ${fontSize}px "${FONTS.anton.name}"`
    const lineHeight = fontSize * 1.05
    const totalHeight = lines.length * lineHeight
    const startY = H / 2 - totalHeight / 2

    const items = []
    let globalIndex = 0

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]
      let totalWidth = 0
      const widths = []
      for (const item of line) {
        const width = item.type === 'word' ? ctx.measureText(item.text).width : EMOJI_SIZE
        widths.push(width)
        totalWidth += width
      }
      totalWidth += ctx.measureText(' ').width * (line.length - 1)

      let x = (W - totalWidth) / 2
      for (let i = 0; i < line.length; i++) {
        const item = line[i]
        const width = widths[i]
        items.push({ ...item, x: x + width / 2, y: startY + li * lineHeight + fontSize / 2, width, index: globalIndex++ })
        x += width + ctx.measureText(' ').width
      }
    }

    const emojiImages = new Map()
    for (const item of items) {
      if (item.type === 'emoji' && !emojiImages.has(item.text)) {
        emojiImages.set(item.text, await getSharedEmojiImage(item.text))
      }
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brat-viral-'))
    try {
      const framePaths = []
      for (let frame = 0; frame < FRAMES; frame++) {
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, W, H)

        for (const item of items) {
          const elapsed = frame - item.index * WORD_DELAY
          if (elapsed < 0) continue
          const scale = getScale(elapsed)

          ctx.save()
          ctx.translate(item.x, item.y)
          ctx.scale(scale, scale)

          if (item.type === 'word') {
            ctx.font = `900 ${fontSize}px "${FONTS.anton.name}"`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillStyle = '#000'
            ctx.fillText(item.text, 0, 0)

            const sw = Math.ceil(item.width + 240)
            const sh = Math.ceil(fontSize + 240)
            const base = createCanvas(sw, sh)
            const bctx = base.getContext('2d')
            bctx.font = `900 ${fontSize}px "${FONTS.anton.name}"`
            bctx.textAlign = 'center'
            bctx.textBaseline = 'middle'
            bctx.fillStyle = '#fff'
            bctx.fillText(item.text, sw / 2, sh / 2)

            const highlight = applyShine(base, sw, sh, elapsed)
            ctx.drawImage(highlight, -sw / 2, -sh / 2)
          } else {
            const size = EMOJI_SIZE + 240
            const base = createCanvas(size, size)
            const ectx = base.getContext('2d')
            const emojiImg = emojiImages.get(item.text)
            if (emojiImg) {
              ectx.drawImage(emojiImg, (size - EMOJI_SIZE) / 2, (size - EMOJI_SIZE) / 2, EMOJI_SIZE, EMOJI_SIZE)
            } else {
              ectx.font = `${EMOJI_SIZE}px sans-serif`
              ectx.textAlign = 'center'
              ectx.textBaseline = 'middle'
              ectx.fillText(item.text, size / 2, size / 2)
            }
            ctx.drawImage(base, -size / 2, -size / 2)

            const highlight = applyShine(base, size, size, elapsed)
            ctx.drawImage(highlight, -size / 2, -size / 2)
          }

          ctx.restore()
        }

        const framePath = path.join(tmpDir, `frame-${String(frame + 1).padStart(5, '0')}.png`)
        fs.writeFileSync(framePath, canvas.toBuffer('image/png'))
        framePaths.push(framePath)
      }

      const frameDuration = 1 / FPS
      const manifestLines = []
      for (let i = 0; i < framePaths.length; i++) {
        manifestLines.push(`file '${framePaths[i].replace(/'/g, "'\\''")}'`)
        manifestLines.push(`duration ${frameDuration}`)
      }
      manifestLines.push(`file '${framePaths[framePaths.length - 1].replace(/'/g, "'\\''")}'`)

      const concatPath = path.join(tmpDir, 'concat.txt')
      fs.writeFileSync(concatPath, manifestLines.join('\n'))

      async function encodeWebp({ outFps, qscale }) {
        const outPath = path.join(tmpDir, `out-${outFps}-${qscale}.webp`)
        await execFileAsync('ffmpeg', [
          '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
          '-vcodec', 'libwebp',
          '-filter:v', `fps=${outFps},scale=512:512:flags=lanczos`,
          '-lossless', '0', '-compression_level', '6', '-qscale', String(qscale),
          '-loop', '0', '-an', '-vsync', '0',
          outPath
        ], { maxBuffer: 1024 * 1024 * 10 })
        return fs.readFileSync(outPath)
      }

      const MAX_STICKER_BYTES = 900 * 1024
      const QUALITY_STEPS = [
        { outFps: 15, qscale: 60 },
        { outFps: 12, qscale: 45 },
        { outFps: 10, qscale: 35 },
        { outFps: 8, qscale: 25 },
        { outFps: 8, qscale: 15 }
      ]

      let smallest = null
      for (const step of QUALITY_STEPS) {
        const buf = await encodeWebp(step)
        if (!smallest || buf.length < smallest.length) smallest = buf
        if (buf.length <= MAX_STICKER_BYTES) return buf
      }
      return smallest
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  return { generate }
})()

async function sendBratMenu(diezy, m, teks) {
  const opt = (label, cmd) => ({
    name: 'quick_reply',
    buttonParamsJson: JSON.stringify({ display_text: label, id: `.${cmd} ${teks}` })
  })

  await diezy.relayMessage(m.chat, {
    interactiveMessage: {
      body: {
        text: `╭┈┈⬡�? ʙʀᴀ�? ᴍᴀᴋᴇʀ 」\n�? �? ᴛᴇᴋs  : ${teks}\n�? �? sᴛʏʟᴇ : Pilih varian di bawah\n╰┈┈┈┈┈┈┈┈┈⬡`
      },
      footer: { text: `© ${global.botname || 'Hitoshi MD V1'} �? Brat Maker` },
      nativeFlowMessage: {
        buttons: [
          opt('Classic', 'bratclassic'),
          opt('Classic Video', 'bratclassicvid'),
          opt('Gojo', 'bratgojo'),
          opt('Gojo Animasi', 'bratgojovid'),
          opt('Vermeil', 'bratvermeil'),
          opt('Viral', 'bratviral')
        ],
        messageParamsJson: ''
      }
    }
  }, {})
}

let handler = async (m, { diezy, command, text, isRegistered, isCreator, isPremium, checkLimit, addLimit, Reply }) => {
  if (typeof isRegistered === 'function' && !isRegistered(m.sender) && !isCreator) {
    return Reply(global.mess?.verifikasi || 'Silakan daftar / verifikasi terlebih dahulu!')
  }

  const teks = (text || '').trim()

  if (!teks) return Reply(`�? Masukkan teks!\nContoh: .${command} Hello World`)
  if (teks.length > MAX_TEXT_LENGTH) return Reply(`�? Teks terlalu panjang! Maksimal ${MAX_TEXT_LENGTH} karakter.`)

  if (typeof checkLimit === 'function' && checkLimit(m.sender, isCreator)) {
    return Reply(global.mess?.limit || 'Limit harian kamu habis!')
  }
  if (typeof addLimit === 'function') {
    addLimit(m.sender, isCreator)
  }

  await diezy.sendMessage(m.chat, { react: { text: '�?', key: m.key } }).catch(() => {})

  try {
    switch (command) {
      case 'bratclassic': {
        const imgBuffer = await ClassicEngine.generateImage(teks)
        const stickerBuffer = await makeStickerBuffer(imgBuffer)
        await diezy.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
        break
      }
      case 'bratclassicvid': {
        const rawBuffer = await ClassicEngine.generateSticker(teks)
        const stickerBuffer = await addStickerExif(rawBuffer)
        await diezy.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
        break
      }
      case 'bratgojo': {
        const imgBuffer = await GojoEngine.generateImage(teks)
        const stickerBuffer = await makeStickerBuffer(imgBuffer)
        await diezy.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
        break
      }
      case 'bratgojovid': {
        const rawBuffer = await GojoEngine.generateSticker(teks)
        const stickerBuffer = await addStickerExif(rawBuffer)
        await diezy.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
        break
      }
      case 'bratvermeil': {
        const rawBuffer = await VermeilEngine.generate(teks)
        const stickerBuffer = await addStickerExif(rawBuffer)
        await diezy.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
        break
      }
      case 'bratviral': {
        const rawBuffer = await ViralEngine.generate(teks)
        const stickerBuffer = await addStickerExif(rawBuffer)
        await diezy.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })
        break
      }
      default:
        return
    }
    await diezy.sendMessage(m.chat, { react: { text: '�?', key: m.key } })
  } catch (e) {
    console.error('[BRAT ERROR]', e)
    await diezy.sendMessage(m.chat, { react: { text: '�?', key: m.key } })
    return Reply(`�? Gagal membuat brat: ${e.message}`)
  }
}

handler.command = ['bratclassic', 'bratclassicvid', 'bratgojo', 'bratgojovid', 'bratvermeil', 'bratviral']
handler.help = ['brat <teks>']
handler.tags = ['sticker', 'maker']

module.exports = handler
