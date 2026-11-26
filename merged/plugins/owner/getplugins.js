/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require("fs")
const path = require("path")

let handler = async (m, { shorekeeper, isCreator, Reply, text, example }) => {
if (!isCreator) return Reply(global.mess.owner)
if (!text) return m.reply(example("namafile plugins nya"))
if (!text.endsWith(".js")) return m.reply("Nama file harus berformat .js")

const filePath = "./plugins/" + text.toLowerCase()
if (!fs.existsSync(filePath)) return m.reply("File plugins tidak ditemukan!")

let fileBuffer = fs.readFileSync(filePath)
let fileName = path.basename(filePath)

await shorekeeper.sendMessage(m.chat, {
document: fileBuffer,
mimetype: "application/javascript",
fileName: fileName,
caption: `📦 *Plugin: ${fileName}*`
}, { quoted: m })
}

handler.command = ["getp", "gp", "getplugins", "getplugin"]

module.exports = handler