/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const { getWIBTime, safeReadJSON, limitBonusPath } = require('../../lib/game.js');

module.exports = async (m, { Reply, command, args }) => {
    global.gameSessions = global.gameSessions || {};
    if (command === "nyerah" || command === "menyerah") {
        if (global.gameSessions && global.gameSessions[m.chat]) {
            let session = global.gameSessions[m.chat];
            clearTimeout(session.timeout);
            let jawabanTampil = Array.isArray(session.jawaban) ? session.jawaban.join(" / ") : session.jawaban;
            Reply(`🏳️ Yah, kamu menyerah!\nJawabannya adalah: *${jawabanTampil}*`);
            delete global.gameSessions[m.chat];
        } else {
            Reply("Tidak ada game yang sedang berlangsung untuk diserahkan.");
        }
    } else if (command === "jawab") {
        if (global.gameSessions && global.gameSessions[m.chat]) {
            const session = global.gameSessions[m.chat];
            const answerInput = (args || []).join(' ').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!answerInput) return Reply("Ketik jawaban kamu! Contoh: *.jawab <jawaban>*");

            const jawabanBenar = session.jawaban;
            let benar = false;
            if (Array.isArray(jawabanBenar)) {
                benar = jawabanBenar.some(j => {
                    const jClean = String(j).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    return answerInput === jClean || answerInput.includes(jClean);
                });
            } else {
                const jClean = String(jawabanBenar).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                benar = (answerInput === jClean) || answerInput.includes(jClean);
            }

            if (benar) {
                clearTimeout(session.timeout);
                let jawabanTampil = Array.isArray(jawabanBenar) ? jawabanBenar.join(" / ") : jawabanBenar;
                const limitReward = Math.floor(Math.random() * 5) + 1;
                const bonusDB = safeReadJSON(limitBonusPath, {});
                const today = getWIBTime().toISOString().split('T')[0];
                if (!bonusDB[m.sender] || bonusDB[m.sender].date !== today) {
                    bonusDB[m.sender] = { bonus: 0, date: today };
                }
                bonusDB[m.sender].bonus += limitReward;
                fs.writeFileSync(limitBonusPath, JSON.stringify(bonusDB, null, 2));

                Reply(`✅ *Jawaban Benar!* \nJawabannya adalah: *${jawabanTampil}*\n\nSelamat kepada @${m.sender.split('@')[0]}! 🎉\n🎁 Kamu mendapatkan hadiah *+${limitReward} Limit Bot!*`, [m.sender]);
                delete global.gameSessions[m.chat];
            } else {
                Reply(`❌ *Jawaban Salah* untuk soal ini. Coba lagi!`);
            }
        } else {
            Reply("❌ Tidak ada game yang sedang aktif di chat ini.");
        }
    }
};

module.exports.command = ["nyerah", "menyerah", "jawab"];

module.exports.before = async (m, { Reply, botNumber, prefix }) => {
    global.gameSessions = global.gameSessions || {};
    if (!global.gameSessions[m.chat]) return;

    const session = global.gameSessions[m.chat];
    if (m.sender === botNumber) return;

    const quotedMsg = m.quoted ? m.quoted : null;
    const rawText = (m.text || m.body || "").trim();
    if (!rawText) return;

    // Check if the user is replying to the game question
    const isReplyToGame = quotedMsg && (
        (session.messageId && quotedMsg.id === session.messageId) ||
        quotedMsg.fromMe ||
        quotedMsg.sender === botNumber ||
        (quotedMsg.text && quotedMsg.text.includes('60 detik')) ||
        (quotedMsg.caption && quotedMsg.caption.includes('60 detik')) ||
        (quotedMsg.text && session.gameType && quotedMsg.text.toLowerCase().includes(session.gameType.toLowerCase())) ||
        (quotedMsg.caption && session.gameType && quotedMsg.caption.toLowerCase().includes(session.gameType.toLowerCase()))
    );

    // Normalize user's answer (remove .jawab or jawab if present)
    let cleanAnswer = rawText.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (prefix && cleanAnswer.startsWith(prefix.toLowerCase() + 'jawab ')) {
        cleanAnswer = cleanAnswer.slice((prefix + 'jawab ').length).trim();
    } else if (cleanAnswer.startsWith('.jawab ')) {
        cleanAnswer = cleanAnswer.slice(7).trim();
    } else if (cleanAnswer.startsWith('!jawab ')) {
        cleanAnswer = cleanAnswer.slice(7).trim();
    } else if (cleanAnswer.startsWith('jawab ')) {
        cleanAnswer = cleanAnswer.slice(6).trim();
    }

    const jawabanBenar = session.jawaban;
    let benar = false;

    if (Array.isArray(jawabanBenar)) {
        benar = jawabanBenar.some(j => {
            const jClean = String(j).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return cleanAnswer === jClean || cleanAnswer.includes(jClean) || (jClean.length >= 4 && cleanAnswer.startsWith(jClean));
        });
    } else {
        const jClean = String(jawabanBenar).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        benar = (cleanAnswer === jClean) || cleanAnswer.includes(jClean) || (jClean.length >= 4 && cleanAnswer.startsWith(jClean));
    }

    if (benar) {
        clearTimeout(session.timeout);
        let jawabanTampil = Array.isArray(jawabanBenar) ? jawabanBenar.join(" / ") : jawabanBenar;
        const limitReward = Math.floor(Math.random() * 5) + 1;

        const bonusDB = safeReadJSON(limitBonusPath, {});
        const today = getWIBTime().toISOString().split('T')[0];

        if (!bonusDB[m.sender] || bonusDB[m.sender].date !== today) {
            bonusDB[m.sender] = { bonus: 0, date: today };
        }

        bonusDB[m.sender].bonus += limitReward;
        fs.writeFileSync(limitBonusPath, JSON.stringify(bonusDB, null, 2));

        Reply(`✅ *Jawaban Benar!* \nJawabannya adalah: *${jawabanTampil}*\n\nSelamat kepada @${m.sender.split('@')[0]}! 🎉\n🎁 Kamu mendapatkan hadiah *+${limitReward} Limit Bot!*`, [m.sender]);

        delete global.gameSessions[m.chat];
    } else if (isReplyToGame) {
        // Only reply "Jawaban Salah" if the user explicitly replied to the bot's game message
        // Don't flag surrender command as wrong answer
        if (cleanAnswer !== 'nyerah' && cleanAnswer !== 'menyerah' && cleanAnswer !== '.nyerah') {
            Reply(`❌ *Jawaban Salah* untuk soal ini. Coba lagi!`);
        }
    }
};
