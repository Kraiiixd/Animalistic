/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require("fs")
const path = require('path');

let handler = async (m, { shorekeeper, isCreator, text, Reply, example }) => {
if (!isCreator) return Reply(global.mess.owner)
const getAllPlugins = (dir) => {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(getAllPlugins(fullPath));
        } else if (file.endsWith('.js')) {
            results.push(path.relative(path.join(__dirname, '../..', 'plugins'), path.resolve(fullPath)));
        }
    }
    return results;
};
let dir = getAllPlugins('./plugins');
if (dir.length < 1) return m.reply("Tidak ada file plugins")
let teks = "\n"
for (let e of dir) {
teks += `* ${e}\n`
}
m.reply(teks)
}

handler.command = ["listplugin", "listplugins"]

module.exports = handler