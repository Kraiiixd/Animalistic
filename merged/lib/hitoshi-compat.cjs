/**
 * © Kureza MD — Hitoshi MD V1
 *
 * Lapisan kompatibilitas: menjalankan plugin gaya Hitoshi MD (ESM, ctx.sock/ctx.reply)
 * di atas plugin runner Hitoshi (CommonJS, ctx.shorekeeper/ctx.Reply).
 *
 *  - adapt(handler)             -> bungkus handler Hitoshi jadi plugin Hitoshi
 *  - dioRegister / dioRun       -> kartu HTML rich (kumpulan modul `libs` + `feature.run`)
 *  - rbRegister / rbRun         -> fitur AI berpersona (factory async -> handler)
 *  - oneCommand / wrapClassic   -> helper penamaan command
 *  - liveDoc / legacyJson       -> penyimpanan JSON kecil (lib/database/hitoshi-ai.json)
 */
'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DB_FILE = path.join(ROOT, 'lib', 'database', 'hitoshi-ai.json')

// beberapa kartu Hitoshi membaca global.namebot
if (!global.namebot) global.namebot = global.botname || 'Hitoshi MD V1'

// ───────────────────────── penyimpanan ─────────────────────────
let _db = null
let _timer = null
const clone = (v) => JSON.parse(JSON.stringify(v))

function dbLoad() {
  if (_db) return _db
  try { _db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } catch { _db = {} }
  if (!_db || typeof _db !== 'object') _db = {}
  return _db
}

function dbSave() {
  clearTimeout(_timer)
  _timer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true })
      fs.writeFileSync(DB_FILE, JSON.stringify(_db))
    } catch (e) { console.error('[HITOSHI-COMPAT] gagal simpan database:', e.message) }
  }, 500)
  if (_timer.unref) _timer.unref()
}

// data fitur: objek langsung dari database; panggil save() setelah mengubah isinya
function liveDoc(key, fallback = {}) {
  const db = dbLoad()
  if (db[key] === undefined) db[key] = clone(fallback)
  return { data: db[key], save: dbSave }
}

// di Hitoshi membaca file lama ./data/*.json; di Hitoshi tidak ada
function legacyJson(_file, fallback = null) { return fallback }

// ───────────────────────── bentrok command ─────────────────────────
// Command yang sudah dipakai Hitoshi (case di kurezamd.js + plugin bawaan) tidak boleh ditimpa plugin hasil port.
let _reserved = null
function reservedCommands() {
  if (_reserved) return _reserved
  _reserved = new Set()
  try {
    const src = fs.readFileSync(path.join(ROOT, 'kurezamd.js'), 'utf8')
    for (const mm of src.matchAll(/case\s+["']([^"']+)["']/g)) _reserved.add(mm[1].toLowerCase())
  } catch {}
  const walk = (dir) => {
    let items = []
    try { items = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const it of items) {
      const full = path.join(dir, it.name)
      if (it.isDirectory()) { walk(full); continue }
      if (!it.name.endsWith('.js')) continue
      let src = ''
      try { src = fs.readFileSync(full, 'utf8') } catch { continue }
      if (src.includes('hitoshi-compat')) continue // plugin hasil port tidak dihitung
      for (const mm of src.matchAll(/(?:handler|module\.exports)\.command\s*=\s*\[([^\]]*)\]/g)) {
        for (const s of mm[1].matchAll(/['"`]([^'"`]+)['"`]/g)) _reserved.add(s[1].toLowerCase())
      }
    }
  }
  walk(path.join(ROOT, 'plugins'))
  return _reserved
}

// ───────────────────────── adapter handler ─────────────────────────
const num = (id) => String(id || '').split('@')[0].split(':')[0]

async function groupFlags(sock, m) {
  let isAdmin = false, isBotAdmin = false
  try {
    const meta = await sock.groupMetadata(m.chat)
    const admins = new Set()
    for (const p of meta.participants || []) {
      if (!p.admin) continue
      for (const id of [p.id, p.jid, p.lid, p.phoneNumber]) if (id) admins.add(num(id))
    }
    isAdmin = admins.has(num(m.sender))
    isBotAdmin = admins.has(num(sock.user?.id)) || admins.has(num(sock.user?.lid))
  } catch {}
  return { isAdmin, isBotAdmin }
}

async function buildCtx(m, c, handler) {
  const sock = c.shorekeeper
  // Hitoshi memakai m.type, Hitoshi memakai m.mtype
  if (!m.mtype) m.mtype = m.type
  if (m.quoted) {
    if (!m.quoted.mtype) m.quoted.mtype = m.quoted.type
    if (!m.quoted.mimetype) m.quoted.mimetype = m.quoted.msg?.mimetype || ''
  }
  let flags = { isAdmin: false, isBotAdmin: false }
  if (m.isGroup && (handler.admin || handler.botadmin || handler.needsAdmin)) flags = await groupFlags(sock, m)
  return {
    ...c,
    sock,
    conn: sock,
    reply: c.Reply,
    jid: m.chat,
    pushname: m.pushName || '',
    body: m.body || m.text || '',
    isOwner: c.isCreator,
    ...flags
  }
}

async function gate(handler, m, c, ctx) {
  const mess = global.mess || {}
  if (handler.owner && !c.isCreator) { await c.Reply(mess.owner || 'Khusus owner'); return false }
  if (handler.premium && !c.isPrem && !c.isCreator) { await c.Reply(mess.prem || 'Khusus premium'); return false }
  if (handler.group && !m.isGroup) { await c.Reply(mess.group || 'Khusus grup'); return false }
  if (handler.private && m.isGroup) { await c.Reply('Fitur ini hanya bisa dipakai di chat pribadi.'); return false }
  if (handler.admin && !(ctx.isAdmin || c.isCreator)) { await c.Reply(mess.admin || 'Khusus admin'); return false }
  if (handler.botadmin && !ctx.isBotAdmin) { await c.Reply(mess.botAdmin || 'Bot harus admin'); return false }
  return true
}

function adapt(handler, extra = {}) {
  const reserved = reservedCommands()
  const cmds = (Array.isArray(handler.command) ? handler.command : [])
    .map(String)
    .filter((x) => !reserved.has(x.toLowerCase()))

  const fn = async (m, c) => {
    const ctx = await buildCtx(m, c, handler)
    if (!(await gate(handler, m, c, ctx))) return
    if (handler.limit && c.checkLimit && c.checkLimit(m.sender, c.isCreator)) return c.Reply((global.mess || {}).limit || 'Limit habis')
    const res = await handler(m, ctx)
    if (handler.limit && c.addLimit && res !== false) { try { c.addLimit(m.sender, c.isCreator) } catch {} }
    return res
  }

  fn.command = cmds
  fn.help = handler.help || []
  fn.tags = handler.tags || []
  Object.assign(fn, extra)

  // pesan biasa tanpa command (mis. reply jawaban AI untuk lanjut ngobrol)
  if (handler.customPrefix || typeof handler.before === 'function') {
    fn.before = async (m, c) => {
      const ctx = await buildCtx(m, c, handler)
      ctx.command = ''
      const fnBefore = typeof handler.before === 'function' ? handler.before : handler
      return !!(await fnBefore(m, ctx))
    }
  }
  return fn
}

// satu command = nama file; command lama tetap jadi alias (kalau tidak bentrok)
function oneCommand(plugin, name) {
  const old = Array.isArray(plugin.command) ? plugin.command : []
  plugin.command = [...new Set([name, ...old])]
  return plugin
}
const wrapClassic = (handler) => handler

// ───────────────────────── kartu HTML rich ─────────────────────────
const registry = Object.create(null)

function dioRegister(name, feature, libs = {}) {
  registry[name] = { feature, libs, cache: Object.create(null), mod: null }
}

function makeRequire(libs, cache) {
  const req = (id) => {
    let key = libs[id] ? id : null
    if (!key) {
      const norm = String(id).replace(/^(\.{1,2}\/)+/, '').replace(/^lib\//, '')
      if (libs[norm]) key = norm
    }
    if (key) {
      if (!cache[key]) {
        const mod = { exports: {} }
        cache[key] = mod
        libs[key](mod, mod.exports, req)
      }
      return cache[key].exports
    }
    return require(id)
  }
  return req
}

function loadFeature(name) {
  const reg = registry[name]
  if (!reg) throw new Error(`Fitur "${name}" belum terdaftar`)
  if (!reg.mod) {
    const mod = { exports: {} }
    reg.feature(mod, mod.exports, makeRequire(reg.libs, reg.cache))
    reg.mod = mod.exports
  }
  return reg.mod
}

async function dioRun(name, m, ctx = {}) {
  const feat = loadFeature(name)
  return feat.run({ ...ctx, m })
}

// ───────────────────────── fitur AI berpersona ─────────────────────────
const rbReg = Object.create(null)

function rbRegister(name, factory) { rbReg[name] = { factory, handler: null } }

async function rbRun(name, m, ctx = {}) {
  const reg = rbReg[name]
  if (!reg) throw new Error(`Fitur "${name}" belum terdaftar`)
  if (!reg.handler) reg.handler = await reg.factory()
  return reg.handler(m, ctx)
}

// ───────────────────────── helper media (dari lib/core/file.js Hitoshi) ─────────────────────────
function pickMedia(m) {
  const q = m.quoted
  if (q?.isMedia && q.download) return { mtype: q.mtype || q.type, mime: q.mimetype || q.msg?.mimetype || '', download: q.download, node: q }
  if (m.isMedia && m.download) return { mtype: m.mtype || m.type, mime: m.msg?.mimetype || '', download: m.download, node: m.msg }
  return null
}

function pickImage(m) {
  const t = m.mtype || m.type
  if (t === 'imageMessage' && m.download) return { mtype: t, mime: m.msg?.mimetype || 'image/jpeg', download: m.download, node: m.msg }
  const qt = m.quoted?.mtype || m.quoted?.type
  if (qt === 'imageMessage' && m.quoted.download) return { mtype: qt, mime: m.quoted.mimetype || m.quoted.msg?.mimetype || 'image/jpeg', download: m.quoted.download, node: m.quoted }
  return null
}

async function reactTo(sock, m, emoji) {
  try { await sock.sendMessage(m.chat, { react: { text: emoji, key: m.key } }) } catch {}
}

// file-type v16 (CJS) memakai fromBuffer; v17+ memakai fileTypeFromBuffer
function fileTypeFromBuffer(buf) {
  const ft = require('file-type')
  const fn = ft.fileTypeFromBuffer || ft.fromBuffer
  return fn(buf)
}

module.exports = {
  adapt, oneCommand, wrapClassic,
  dioRegister, dioRun, rbRegister, rbRun,
  liveDoc, legacyJson,
  pickMedia, pickImage, reactTo, fileTypeFromBuffer
}
