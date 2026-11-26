/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const dbPath = path.join(__dirname, '../library/database/lastgempa.json');

function loadLastGempa() {
    if (fs.existsSync(dbPath)) {
        try {
            return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch {
            return null;
        }
    }
    return null;
}

function saveLastGempa(data) {
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Failed to save last gempa data:', e.message);
    }
}

function startGempaScheduler(diezy) {

    setInterval(async () => {
        try {
            const response = await axios.get(
                "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
                { timeout: 15000 }
            );

            if (!response.data || !response.data.Infogempa || !response.data.Infogempa.gempa) return;

            const g = response.data.Infogempa.gempa;
            const currentGempaId = `${g.Tanggal}-${g.Jam}-${g.Coordinates}`;

            const lastGempa = loadLastGempa();
            if (lastGempa && lastGempa.id === currentGempaId) {

                return;
            }

            saveLastGempa({ id: currentGempaId, data: g });

            const text =
                `🔔 *INFO GEMPA TERKINI (BMKG)* 🌍\n\n` +
                `> 📅 Tanggal: *${g.Tanggal}*\n` +
                `> 🕐 Jam: *${g.Jam}*\n` +
                `> 📐 Koordinat: *${g.Coordinates}*\n` +
                `> 📍 Lintang: *${g.Lintang}*\n` +
                `> 📍 Bujur: *${g.Bujur}*\n` +
                `> 💥 Magnitude: *${g.Magnitude}*\n` +
                `> 🔽 Kedalaman: *${g.Kedalaman}*\n` +
                `> 🗺️ Wilayah: *${g.Wilayah}*\n` +
                `> ⚠️ Potensi: *${g.Potensi}*\n` +
                `> 🏠 Dirasakan: *${g.Dirasakan}*\n\n` +
                `_Pemberitahuan otomatis BMKG_`;

            const shakemapUrl = g.Shakemap
                ? `https://data.bmkg.go.id/DataMKG/TEWS/${g.Shakemap}`
                : null;

            let imageBuffer = null;
            if (shakemapUrl) {
                try {
                    const imgRes = await axios.get(shakemapUrl, {
                        responseType: "arraybuffer",
                        timeout: 15000,
                    });
                    imageBuffer = Buffer.from(imgRes.data);
                } catch (imgErr) {
                    console.error('Failed to fetch shakemap image:', imgErr.message);
                }
            }

            if (!global.db || !global.db.groups) return;

            const groups = Object.keys(global.db.groups).filter(jid => global.db.groups[jid] && global.db.groups[jid].notifgempa === true);

            for (const groupJid of groups) {
                try {
                    if (imageBuffer) {
                        await diezy.sendMessage(groupJid, {
                            image: imageBuffer,
                            caption: text
                        });
                    } else {
                        await diezy.sendMessage(groupJid, {
                            text: text
                        });
                    }

                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (sendErr) {
                    console.error(`Failed to send gempa notification to group ${groupJid}:`, sendErr.message);
                }
            }

        } catch (err) {
            console.error('Error checking auto gempa:', err.message);
        }
    }, 120000);
}

module.exports = { startGempaScheduler };
