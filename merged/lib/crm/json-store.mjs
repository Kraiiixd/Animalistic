/**
 * © Kureza MD — Hitoshi MD V1 — Created by Kureza
 * Pengganti ichigo-sqlite-store: penyimpanan JSON sederhana (tanpa dependency better-sqlite3).
 * Antarmuka sama: load / save / clear / checkpoint / close.
 */
import fs from 'fs'
import path from 'path'

export function openStore(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  const readAll = () => { try { return JSON.parse(fs.readFileSync(filePath, 'utf8')) || {} } catch { return {} } }
  const writeAll = (obj) => {
    const tmp = filePath + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(obj))
    fs.renameSync(tmp, filePath)
  }
  return {
    load(name, defaults) { const all = readAll(); return all[name] === undefined ? defaults : all[name] },
    save(name, data) { const all = readAll(); all[name] = data; writeAll(all) },
    clear(name) { const all = readAll(); delete all[name]; writeAll(all) },
    checkpoint() {},
    close() {},
  }
}
