/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const path = require('path');

const sambutanPath = './library/database/sambutanowner.json';

if (!fs.existsSync(sambutanPath)) {
    fs.writeFileSync(sambutanPath, JSON.stringify({
        enabled: true,
        lastSeen: {},
        cooldown: 15
    }, null, 2));
}

function loadSambutan() {
    try {
        return JSON.parse(fs.readFileSync(sambutanPath));
    } catch (e) {
        return { enabled: true, lastSeen: {}, cooldown: 15 };
    }
}

function saveSambutan(data) {
    fs.writeFileSync(sambutanPath, JSON.stringify(data, null, 2));
}

function isSambutanEnabled() {
    const config = loadSambutan();
    return config.enabled === true;
}

function getCooldownMinutes() {
    const config = loadSambutan();
    return config.cooldown || 15;
}

function updateLastSeen(ownerJid) {
    const config = loadSambutan();
    if (!config.lastSeen) config.lastSeen = {};
    config.lastSeen[ownerJid] = Date.now();
    saveSambutan(config);
}

function shouldSendSambutan(ownerJid) {
    const config = loadSambutan();

    if (!config.enabled) return false;

    if (!config.lastSeen || !config.lastSeen[ownerJid]) {
        return true;
    }

    const lastSeen = config.lastSeen[ownerJid];
    const now = Date.now();
    const cooldownMs = (config.cooldown || 15) * 60 * 1000;
    const timeDiff = now - lastSeen;

    return timeDiff > cooldownMs;
}

const sambutanList = [
    `𐔈⃘ ֹ ׅ *WIH OWNER KU DATANG!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 @user siap nih mau disuruh apa? raja bot lagi online~`,

    `𐔈⃘ ֹ ׅ *KING BOT IS ONLINE!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 @user owner tercinta muncul, langsung auto sambut! ada yang bisa dibantu?`,

    `𐔈⃘ ֹ ׅ *YA AMPUN OWNER!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 gempar! gempar! @user yang punya bot lagi online nih~`,

    `𐔈⃘ ֹ ׅ *OWNER ONLINE!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 @user hadir! hadir! bos besar lagi active, siap-siap ngab!`,

    `𐔈⃘ ֹ ׅ *OMG OWNER!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 sensor owner: beep beep! @user yang punya bot lagi online nih`,

    `𐔈⃘ ֹ ׅ *RAJA BOT HADIR!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 yang lain pada minggir, @user owner ku datang! ada perlu apa nih?`,

    `𐔈⃘ ֹ ׅ *BOS BESAR ONLINE!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 auto sambut buat @user owner tersayang~ siap laksanakan perintah!`,

    `𐔈⃘ ֹ ׅ *THE KING HAS RETURNED!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 @user owner lagi online, mode: nyamanin bos! ada yang bisa dibantu?`,

    `𐔈⃘ ֹ ׅ *OWNER DETECTED!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 wih wih wih! @user yang punya bot muncul! langsung auto sambut deh~`,

    `𐔈⃘ ֹ ׅ *GEMPAR!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 @user owner bot lagi online! semuanya pada sujud dulu~ ada yang bisa dibantu bos?`,

    `𐔈⃘ ֹ ׅ *LAMA NGGAK ONLINE!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 akhirnya muncul juga! @user owner tersayang lagi online nih~`,

    `𐔈⃘ ֹ ׅ *RINDU BANGET!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 udah lama nungguin @user owner online, akhirnya dateng juga!`,

    `𐔈⃘ ֹ ׅ *AKHIRNYA!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 @user owner yang dulu hilang, sekarang muncul lagi! siap-siap ngab!`,

    `𐔈⃘ ֹ ׅ *BARU ONLINE LAGI!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 setelah sekian lama, @user owner akhirnya nongol juga!`,

    `𐔈⃘ ֹ ׅ *THE LEGEND RETURNS!* ֹ ׅ ୫
۫ ╰╼ ׅ ֹ𔖰᷼𔖮 @user owner legendaris akhirnya online lagi! auto sambut meriah!`
];

function getRandomSambutan(ownerJid, pushName) {
    const randomIndex = Math.floor(Math.random() * sambutanList.length);
    const sambutan = sambutanList[randomIndex];
    return sambutan.replace(/@user/g, `@${ownerJid.split('@')[0]}`);
}

module.exports = {
    loadSambutan,
    saveSambutan,
    isSambutanEnabled,
    getRandomSambutan,
    updateLastSeen,
    shouldSendSambutan,
    getCooldownMinutes
};