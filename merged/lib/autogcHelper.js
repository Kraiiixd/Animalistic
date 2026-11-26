/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const moment = require('moment-timezone');

const jadwalFile = './library/database/jadwalgc.json';

const pesanClose = `╭┈┈⬡「 ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ 」
┃ ✧ ᴍᴏᴅᴇ   : Hanya Admin
┃ ✧ sᴛᴀᴛᴜs : Grup Ditutup Otomatis
┃ ✧ ᴡᴀᴋᴛᴜ  : @waktu
╰┈┈┈┈┈┈┈┈┈⬡`;

const pesanOpen = `╭┈┈⬡「 ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ 」
┃ ✧ ᴍᴏᴅᴇ   : Semua Member
┃ ✧ sᴛᴀᴛᴜs : Grup Dibuka Otomatis
┃ ✧ ᴡᴀᴋᴛᴜ  : @waktu
╰┈┈┈┈┈┈┈┈┈⬡`;

const pesanCloseCustom = `╭┈┈⬡「 ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ 」
┃ ✧ ᴍᴏᴅᴇ   : Hanya Admin
┃ ✧ sᴛᴀᴛᴜs : Grup Ditutup Otomatis
┃ ✧ ᴡᴀᴋᴛᴜ  : @waktu
┃ ✧ ɪɴꜰᴏ   : @message
╰┈┈┈┈┈┈┈┈┈⬡`;

const pesanOpenCustom = `╭┈┈⬡「 ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ 」
┃ ✧ ᴍᴏᴅᴇ   : Semua Member
┃ ✧ sᴛᴀᴛᴜs : Grup Dibuka Otomatis
┃ ✧ ᴡᴀᴋᴛᴜ  : @waktu
┃ ✧ ɪɴꜰᴏ   : @message
╰┈┈┈┈┈┈┈┈┈⬡`;

function loadJadwal() {
    try {
        if (fs.existsSync(jadwalFile)) {
            return JSON.parse(fs.readFileSync(jadwalFile));
        }
    } catch (e) {}
    return {};
}

function saveJadwal(data) {
    try {
        const dir = './library/database';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(jadwalFile, JSON.stringify(data, null, 2));
    } catch (e) {}
}

module.exports = {
    loadJadwal,
    saveJadwal,
    pesanClose,
    pesanOpen,
    pesanCloseCustom,
    pesanOpenCustom
};
