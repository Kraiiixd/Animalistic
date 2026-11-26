/**
 * © Kureza MD — Hitoshi MD V1
 * Pengganti makeInMemoryStore untuk Baileys versi baru (fungsi aslinya sudah
 * dihapus dari paket). Hanya menyediakan yang dipakai bot:
 *   - store.bind(ev)          : kumpulkan kontak & chat dari event
 *   - store.contacts          : { jid: { id, name, notify } }
 *   - store.messages          : { jid: { array, keyId } } -> DIISI oleh
 *                               MessagesUpsert (myfunct/message.js), jadi
 *                               bind() sengaja TIDAK menambah pesan di sini
 *                               (kalau ikut menambah, MessagesUpsert akan
 *                               menganggap pesan duplikat dan membuangnya).
 *   - store.loadMessage(jid, id) : cari pesan di store.messages
 */

function makeInMemoryStore(_opts = {}) {
  const store = {
    chats: {},
    contacts: {},
    messages: {},
    presences: {}
  }

  const upsertContact = (c) => {
    if (!c || !c.id) return
    store.contacts[c.id] = Object.assign(store.contacts[c.id] || { id: c.id }, c)
  }

  store.bind = (ev) => {
    ev.on('contacts.upsert', (list) => { for (const c of list || []) upsertContact(c) })
    ev.on('contacts.update', (list) => { for (const c of list || []) upsertContact(c) })
    ev.on('messaging-history.set', ({ contacts, chats }) => {
      for (const c of contacts || []) upsertContact(c)
      for (const c of chats || []) if (c?.id) store.chats[c.id] = Object.assign(store.chats[c.id] || {}, c)
    })
    ev.on('chats.upsert', (list) => {
      for (const c of list || []) if (c?.id) store.chats[c.id] = Object.assign(store.chats[c.id] || {}, c)
    })
    ev.on('chats.update', (list) => {
      for (const c of list || []) if (c?.id) store.chats[c.id] = Object.assign(store.chats[c.id] || {}, c)
    })
    ev.on('presence.update', ({ id, presences }) => {
      if (id) store.presences[id] = Object.assign(store.presences[id] || {}, presences)
    })
  }

  store.loadMessage = (jid, id) => {
    const arr = store.messages[jid]?.array
    if (!Array.isArray(arr)) return undefined
    return arr.find((m) => m?.key?.id === id)
  }

  store.toJSON = () => ({ chats: store.chats, contacts: store.contacts })
  store.writeToFile = () => {}
  store.readFromFile = () => {}

  return store
}

module.exports = makeInMemoryStore
module.exports.makeInMemoryStore = makeInMemoryStore
