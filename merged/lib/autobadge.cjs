/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// Stiker disimpan di lib/database/badge.webp, pengaturan on/off per nomor bot di lib/database/badge.json.

const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, 'database')
const FILE_STICKER = path.join(dir, 'badge.webp')
const FILE_META = path.join(dir, 'badge.json')

const digits = (jid) => String(jid || '').split(':')[0].split('@')[0].replace(/\D/g, '')

function readMeta() {
    try { return JSON.parse(fs.readFileSync(FILE_META, 'utf8')) } catch { return {} }
}
function writeMeta(meta) {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(FILE_META, JSON.stringify(meta, null, 2))
}

const hasBadge = () => fs.existsSync(FILE_STICKER)

function saveBadge(buffer, isAnimated) {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(FILE_STICKER, buffer)
    const meta = readMeta()
    meta.isAnimated = !!isAnimated
    meta.updatedAt = Date.now()
    writeMeta(meta)
}

// pengaturan hanya berlaku untuk bot (nomor) ini
function getAuto(sock) {
    const meta = readMeta()
    return meta.settings?.[digits(sock?.user?.id)]?.autobadge !== false
}
function setAuto(sock, value) {
    const meta = readMeta()
    meta.settings = meta.settings || {}
    const k = digits(sock?.user?.id)
    meta.settings[k] = { ...(meta.settings[k] || {}), autobadge: !!value }
    writeMeta(meta)
}

// kirim stiker badge yang "menempel" pada pesan perintah (associationType 11)
async function sendBadge(sock, m) {
    try {
        const { prepareWAMessageMedia } = require('@whiskeysockets/baileys')
        if (m.key?.fromMe || !hasBadge() || !getAuto(sock)) return
        const media = await prepareWAMessageMedia({ sticker: fs.readFileSync(FILE_STICKER) }, { upload: sock.waUploadToServer })
        await sock.relayMessage(m.chat, {
            messageContextInfo: { messageAssociation: { associationType: 11, parentMessageKey: m.key } },
            stickerMessage: media.stickerMessage
        }, {})
    } catch (e) {
        console.error('[AUTOBADGE ERROR]', e.message)
    }
}

// daftar command yang ada di switch case.js (dibaca sekali dari sumbernya)
let caseCmds = null
function isCaseCommand(cmd) {
    if (!caseCmds) {
        try {
            const src = fs.readFileSync(path.join(dir, '..', '..', 'kurezamd.js'), 'utf8')
            caseCmds = new Set([...src.matchAll(/^\s*case\s+["']([^"']+)["']\s*:/gm)].map((x) => x[1].toLowerCase()))
        } catch { caseCmds = new Set() }
    }
    return caseCmds.has(String(cmd).toLowerCase())
}

module.exports = { hasBadge, saveBadge, getAuto, setAuto, sendBadge, isCaseCommand }
