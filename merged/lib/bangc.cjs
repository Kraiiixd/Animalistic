/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// lib/bangc.cjs — daftar grup yang di-ban (bot tidak merespons command di grup itu, kecuali dari owner)

const fs = require('fs')
const path = require('path')

const FILE = path.join(__dirname, 'database', 'bangc.json')

function read() {
    try {
        const d = JSON.parse(fs.readFileSync(FILE, 'utf8'))
        return d && typeof d === 'object' ? d : {}
    } catch {
        return {}
    }
}
function write(d) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(d, null, 2))
}

const isBanned = (jid) => !!read()[jid]
function ban(jid, info = {}) {
    const d = read()
    if (d[jid]) return false
    d[jid] = { at: Date.now(), ...info }
    write(d)
    return true
}
function unban(jid) {
    const d = read()
    if (!d[jid]) return false
    delete d[jid]
    write(d)
    return true
}
const list = () => read()

module.exports = { isBanned, ban, unban, list }
