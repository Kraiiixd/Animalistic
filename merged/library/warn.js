/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 *
 * Sistem Warn — diadaptasi dari Renzona MD V2
 * Data: library/database/warn.json
 *
 * Bentuk: { [groupId]: { maxWarn: 3, users: { [jid]: { count, history: [{reason, by, time}] } } } }
 */
'use strict'
const fs = require('fs')
const path = require('path')

const DB_DIR = path.join(process.cwd(), 'library', 'database')
const FILE = path.join(DB_DIR, 'warn.json')
const DEFAULT_MAX_WARN = 3

function ensureDir() {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
}

let cache = null
function load() {
    if (cache) return cache
    ensureDir()
    try {
        if (!fs.existsSync(FILE)) {
            cache = {}
            fs.writeFileSync(FILE, JSON.stringify(cache, null, 2))
        } else {
            cache = JSON.parse(fs.readFileSync(FILE, 'utf8'))
        }
    } catch (e) {
        cache = {}
    }
    return cache
}

let saveTimer = null
function save() {
    ensureDir()
    if (saveTimer) return
    saveTimer = setTimeout(() => {
        saveTimer = null
        try {
            fs.writeFileSync(FILE + '.tmp', JSON.stringify(cache, null, 2))
            fs.renameSync(FILE + '.tmp', FILE)
        } catch (e) { console.error('[WARN] gagal simpan:', e.message) }
    }, 500)
    saveTimer.unref?.()
}

function cleanJid(jid) {
    return (jid || '').toString().split(':')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
}

function getGroup(groupId) {
    const db = load()
    if (!db[groupId] || typeof db[groupId] !== 'object') db[groupId] = { maxWarn: DEFAULT_MAX_WARN, users: {} }
    if (!db[groupId].users) db[groupId].users = {}
    if (!('maxWarn' in db[groupId])) db[groupId].maxWarn = DEFAULT_MAX_WARN
    return db[groupId]
}

function getMaxWarn(groupId) {
    return getGroup(groupId).maxWarn || DEFAULT_MAX_WARN
}

function setMaxWarn(groupId, amount) {
    const g = getGroup(groupId)
    g.maxWarn = Math.max(1, Math.floor(Number(amount) || DEFAULT_MAX_WARN))
    save()
    return g.maxWarn
}

function getWarn(groupId, jid) {
    const g = getGroup(groupId)
    const key = cleanJid(jid)
    if (!g.users[key]) g.users[key] = { count: 0, history: [] }
    return g.users[key]
}

function addWarn(groupId, jid, reason, by) {
    const g = getGroup(groupId)
    const key = cleanJid(jid)
    const u = getWarn(groupId, jid)
    u.count = (u.count || 0) + 1
    u.history = u.history || []
    u.history.unshift({ reason: reason || '-', by: by || '-', time: Date.now() })
    u.history = u.history.slice(0, 20)
    save()
    const max = g.maxWarn || DEFAULT_MAX_WARN
    return { count: u.count, max, reachedMax: u.count >= max }
}

function removeWarn(groupId, jid, amount = 1) {
    const u = getWarn(groupId, jid)
    u.count = Math.max(0, (u.count || 0) - Math.max(1, Math.floor(Number(amount) || 1)))
    save()
    return { count: u.count, max: getMaxWarn(groupId) }
}

function resetWarn(groupId, jid) {
    const g = getGroup(groupId)
    const key = cleanJid(jid)
    delete g.users[key]
    save()
}

function resetAllWarn(groupId) {
    const g = getGroup(groupId)
    g.users = {}
    save()
}

function listWarn(groupId) {
    const g = getGroup(groupId)
    return Object.entries(g.users)
        .filter(([, u]) => (u.count || 0) > 0)
        .map(([jid, u]) => ({ jid, count: u.count }))
        .sort((a, b) => b.count - a.count)
}

module.exports = {
    FILE,
    DEFAULT_MAX_WARN,
    cleanJid,
    getGroup,
    getMaxWarn,
    setMaxWarn,
    getWarn,
    addWarn,
    removeWarn,
    resetWarn,
    resetAllWarn,
    listWarn
}
