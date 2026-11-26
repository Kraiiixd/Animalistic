/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

// lib/richmenu.cjs — kartu .menu / .allmenu mode RICH (versi CommonJS dari richmenu.js).
// Data menu diambil dari global.menu* (source/menu-shore.js) + plugins/ + daftar command bawaan,
// jadi fitur baru yang ditambah ke salah satunya langsung tampil.

const fs = require('fs')
const path = require('path')
const richui = require('./rich/richui.cjs')
const uimode = require('./rich/uimode.cjs')
const cats = require('./rich/categories.cjs')
const { createStore } = require('./rich/store.cjs')


const ROOT = path.join(__dirname, '..')

// [kategori, command, deskripsi, ownerOnly]
const CASE_MENU = [
  ['info', 'menu', 'Tampilkan daftar perintah', false],
  ['info', 'allmenu', 'Tampilkan semua fitur', false],
  ['info', 'ping', 'Cek kecepatan & status server', false],
  ['info', 'sc', 'Link script bot', false],
  ['jadibot', 'jadibot', 'Jadi bot sementara', false],
  ['jadibot', 'stopjadibot', 'Hentikan jadibot', false],
  ['jadibot', 'listjadibot', 'Daftar jadibot aktif', false],
  ['owner', 'addowner', 'Tambah owner', true],
  ['owner', 'delowner', 'Hapus owner', true],
  ['owner', 'addprem', 'Tambah premium', true],
  ['owner', 'delprem', 'Hapus premium', true],
  ['owner', 'public', 'Mode public', true],
  ['owner', 'self', 'Mode self', true]
]

const LOCAL_ALIAS = { stk: 'maker', enc: 'tools', list: 'store', join: 'group', prem: 'premium', jadibot: 'tools' }

function readPluginFiles(dir, base = dir) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const it of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, it.name)
    if (it.isDirectory()) out.push(...readPluginFiles(full, base))
    else if (it.name.endsWith('.js')) out.push({ full, folder: path.relative(base, path.dirname(full)).split(path.sep)[0] || 'tools' })
  }
  return out
}

// ambil kategori + command dari global.menuXXX ("┃ 〄 .command")
function fromGlobalMenus() {
  const res = []
  for (const key of Object.keys(global)) {
    const m = key.match(/^menu([a-z0-9]+)$/i)
    if (!m || typeof global[key] !== 'string') continue
    const cat = m[1].toLowerCase()
    for (const line of global[key].split('\n')) {
      const c = line.match(/[〄▢◦•]\s*[.!#/]?([^\s]+)/)
      if (c && /^[\w-]+$/.test(c[1])) res.push([cat, c[1].toLowerCase()])
    }
  }
  return res
}

function collect(isOwner) {
  const groups = {}
  const seen = new Set()
  const add = (cat, c, d, i) => {
    if (!c || seen.has(c)) return
    seen.add(c)
    const k = cats.canon(LOCAL_ALIAS[cat] || cat)
    ;(groups[k] = groups[k] || []).push({ i: i || cats.iconOf(k), c, d: d || '' })
  }
  for (const [cat, c, d, ownerOnly] of CASE_MENU) if (!ownerOnly || isOwner) add(cat, c, d)
  for (const [cat, c] of fromGlobalMenus()) if (cat !== 'owner' || isOwner) add(cat, c)

  for (const { full, folder } of readPluginFiles(path.join(ROOT, 'plugins'))) {
    try {
      const src = fs.readFileSync(full, 'utf8')
      const cm = src.match(/\b(?:command|cmd)\s*:\s*(\[[^\]]*\]|(['"`])[^'"`]*\2)/)
      if (!cm) continue
      const cmds = [...cm[1].matchAll(/(['"`])([^'"`]+)\1/g)].map((x) => x[2].toLowerCase()).filter((x) => x && !/\s/.test(x))
      if (!cmds.length) continue
      if (/\bowner\s*:\s*true\b/.test(src) && !isOwner) continue
      const str = (k) => (src.match(new RegExp(`\\b${k}\\s*:\\s*(['"\`])([^'"\`]*)\\1`)) || [])[2]
      add(str('category') || folder, cmds[0], str('desc') || str('description') || '', str('emoji'))
    } catch (e) {
      console.log('[RICHMENU] lewati plugin', path.basename(full), '-', e.message)
    }
  }
  const order = cats.sortCats(Object.keys(groups))
  for (const k of order) groups[k].sort((a, b) => a.c.localeCompare(b.c))
  return { groups, order }
}

const users = createStore('rich-users', { users: {} })
const expNeeded = (lvl) => 100 + (lvl - 1) * 50
function touchUser(id, name) {
  const u = (users.data.users[id] = users.data.users[id] || { exp: 0, level: 1, name: '' })
  if (name) u.name = name
  u.exp += 5
  while (u.exp >= expNeeded(u.level)) { u.exp -= expNeeded(u.level); u.level++ }
  users.save()
  return u
}

const fmt = (n) => Math.floor(Number(n) || 0).toLocaleString('id-ID')
function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
  return h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam'
}
const maskNumber = (n) => (String(n).length > 7 ? `${String(n).slice(0, 4)}••••${String(n).slice(-4)}` : String(n))
async function avatarOf(sock, jid) {
  try {
    const url = await sock.profilePictureUrl(jid, 'image')
    return Buffer.from(await (await fetch(url)).arrayBuffer())
  } catch { return null }
}

// Return true kalau kartu terkirim; false kalau pemanggil harus memakai menu lama.
async function send(ctx) {
  if (!uimode.isRich()) return false
  try {
    const { sock, m, isOwner, isPremium, prefix = '.', sub = '' } = ctx
    const from = m.chat || m.key.remoteJid
    const sender = m.sender
    const { groups, order } = collect(isOwner)
    const popular = new Set([...order].filter((c) => groups[c].length >= 10).sort((a, b) => groups[b].length - groups[a].length).slice(0, 2))
    const catList = order.map((c) => ({ id: c, icon: cats.iconOf(c), label: cats.labelOf(c), desc: cats.descOf(c), hot: popular.has(c), items: groups[c] }))

    const key = String(sub || '').trim().toLowerCase()
    const hit = order.find((c) => c === cats.canon(key))
    const start = key === 'all' ? 'all' : hit ? 'cat' : 'home'

    const num = String(sender).split('@')[0]
    const u = touchUser(num, m.pushName)
    const need = expNeeded(u.level)
    const ranked = Object.entries(users.data.users).sort((a, b) => b[1].level - a[1].level || b[1].exp - a[1].exp)
    const pos = ranked.findIndex(([id]) => id === num) + 1

    let avatar = ''
    try { avatar = await richui.avatarUri(await avatarOf(sock, sender)) } catch {}

    const total = catList.reduce((a, c) => a + c.items.length, 0)
    const buildArgs = {
      prefix, start, cat: hit || '', link: '',
      user: {
        greeting: greeting(),
        name: u.name || m.pushName || maskNumber(num),
        status: isOwner ? 'OWNER' : isPremium ? 'PREMIUM' : 'MEMBER',
        chat: from.endsWith('@g.us') ? 'Grup' : 'Pribadi',
        avatar, level: u.level,
        pct: Math.min(100, Math.floor((u.exp / need) * 100)),
        exp: fmt(u.exp), expNeed: fmt(need),
        money: 'Rp0', bank: 'Rp0',
        limit: isOwner || isPremium ? 'Unlimited' : 'Free',
        rank: pos, rankTotal: ranked.length
      },
      info: { mode: sock.public === false ? 'Self' : 'Public', users: ranked.length, total, uptime: Math.floor(process.uptime()) },
      legal: null,
      cats: catList
    }

    const card = richui.menuApp(buildArgs)
    await richui.sendHtml(sock, from, card.html, card.label)

    // Audio menu dikirim sebagai pesan terpisah setelah kartu (kalau `.setaudiomenu on`).
    // Tidak ditempel di dalam kartu: kartu HTML tidak punya akses jaringan dan batas ukurannya ketat.
    // File: source/media/menu.mp3 (yang sama dengan menu lama; bisa diganti lewat `.setaudiomenu` + reply audio).
    if (start === 'home' && global.db?.settings?.audiomenu) {
      try {
        const audioPath = path.join(process.cwd(), 'source/media/menu.mp3')
        if (fs.existsSync(audioPath)) {
          await sock.sendMessage(from, { audio: fs.readFileSync(audioPath), mimetype: 'audio/mp4', ptt: true }, { quoted: m })
        }
      } catch (e) {
        console.log('[RICHMENU] gagal kirim audio menu:', e.message)
      }
    }
    return true
  } catch (err) {
    console.log('[RICHMENU] gagal kirim kartu menu, pakai menu lama:', err.message)
    return false
  }
}

module.exports = { send, collect, uimode }
