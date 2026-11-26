/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const fetch = require('node-fetch');

const limitBonusPath = "./library/database/limit_bonus.json";

function getWIBTime() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 60 * 60000);
}

function safeReadJSON(path, fallback) {
    try {
        return JSON.parse(fs.readFileSync(path));
    } catch {
        fs.writeFileSync(path, JSON.stringify(fallback, null, 2));
        return fallback;
    }
}

const gameConfig = {
    caklontong: { file: "./data/game/caklontong.json", type: 'file' },
    family100: { file: "./data/game/family100.json", type: 'file' },
    tebakgambar: { file: "./data/game/tebakgambar.json", type: 'file' },
    tebaklogo: { file: "./data/game/tebaklogo.json", type: 'file' },
    tebakhero: { file: "./data/game/tebakhero.json", type: 'file' },
    tebakgenshin: { file: "./data/game/tebakgenshin.json", type: 'file' },
    tebakgame: { file: "./data/game/tebakgame.json", type: 'file' },
    tebakmakanan: { file: "./data/game/tebakmakanan.json", type: 'file' },
    tebakbendera: { file: "./data/game/tebakbendera.json", type: 'file' },
    tebaklagu: { file: "./data/game/tebaklagu.json", type: 'file' },
    sambungkata: { file: "./data/game/sambungkata.json", type: 'file' },
    tebakjkt: { api: "https://api.siputzx.my.id/api/games/tebakjkt", type: 'api' },
    tebaklirik: { file: "./data/game/tebaklirik.json", type: 'file' },
    asahotak: { file: "./data/game/asahotak.json", type: 'file' },
    lengkapikalimat: { file: "./data/game/lengkapikalimat.json", type: 'file' },
    siapakahaku: { file: "./data/game/siapakahaku.json", type: 'file' },
    susunkata: { file: "./data/game/susunkata.json", type: 'file' },
    tebakkata: { file: "./data/game/tebakkata.json", type: 'file' },
    tebakanime: { file: "./data/game/tebakanime.json", type: 'file' },
    tebakkalimat: { file: "./data/game/tebakkalimat.json", type: 'file' },
    tebakjorok: { file: "./data/game/tebakjorok.json", type: 'file' },
    tebakinggris: { file: "./data/game/tebakinggris.json", type: 'file' },
    tebakhewan: { file: "./data/game/tebakhewan.json", type: 'file' },
    tebakff: { api: "https://api.siputzx.my.id/api/games/karakter-freefire", type: 'api' },
};

async function startGame(gameType, m, diezy, Reply, isRegistered, isCreator) {
    global.gameSessions = global.gameSessions || {};
    if (global.gameSessions[m.chat]) {
        return Reply('⚠️ Masih ada game yang berlangsung di chat ini! Selesaikan dulu atau ketik *.nyerah*');
    }
    if (!isRegistered(m.sender) && !isCreator)
        return Reply(global.mess.verifikasi);

    const config = gameConfig[gameType];
    if (!config) return Reply("❌ Tipe game tidak valid.");

    try {
        let soalData;
        if (config.type === 'api') {
            const res = await fetch(config.api).then(res => res.json());
            if (!res || res.status !== true || !res.data) {
                throw new Error(`API response tidak valid atau gagal untuk game ${gameType}.`);
            }
            soalData = res.data;
        } else {
            const fileContent = fs.readFileSync(config.file, 'utf-8');
            const fileData = JSON.parse(fileContent);
            if (!Array.isArray(fileData) || fileData.length === 0) {
                throw new Error(`File ${config.file} kosong atau formatnya bukan array.`);
            }
            soalData = fileData[Math.floor(Math.random() * fileData.length)];
        }

        if (!soalData) {
            throw new Error("Gagal mendapatkan data soal (soalData is null/undefined).");
        }

        let questionText = soalData.soal || soalData.deskripsi || soalData.desk || "Tebak apakah ini?";
        if (gameType === 'tebakgenshin') {
            questionText = soalData.desk ? `Karakter: ${soalData.desk}` : "Tebak karakter Genshin Impact ini!";
        } else if (gameType === 'tebakff') {
            questionText = "Siapakah nama karakter Free Fire ini?";
        }
        const rawAnswer = soalData.jawaban || soalData.name || soalData.judul;

        let isAudio = false;
        if (questionText.includes('http') && (questionText.includes('mp3') || gameType === 'tebaklagu')) {
            isAudio = true;
            questionText = "Tebak judul lagu ini!";
        }

        if (!rawAnswer || (Array.isArray(rawAnswer) && rawAnswer.length === 0)) {
            throw new Error("Data soal yang diambil tidak memiliki jawaban yang valid.");
        }

        const jawaban = Array.isArray(rawAnswer)
            ? rawAnswer.map(j => String(j).toLowerCase().trim())
            : String(rawAnswer).toLowerCase().trim();

        const finalCaption = `🎮 *${gameType.toUpperCase()}*\n\n${questionText}\n\n⏳ Jawab dalam 60 detik!\n*📌 CARA JAWAB: Balas/Reply pesan ini dengan jawabanmu!*\n> gunakan .nyerah untuk menyerah.`;
        const imageUrl = soalData.gambar || soalData.img;
        const audioUrl = soalData.soal;

        let sentMsg;
        if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            sentMsg = await diezy.sendMessage(m.chat, {
                image: { url: imageUrl },
                caption: finalCaption
            }, { quoted: m });
        } else if (isAudio) {
            try {
                await diezy.sendMessage(m.chat, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    ptt: false
                }, { quoted: m });
                sentMsg = await Reply(finalCaption);
            } catch (sendError) {
                console.error("Gagal mengirim audio:", sendError);
                sentMsg = await Reply(finalCaption);
            }
        } else {
            sentMsg = await Reply(finalCaption);
        }

        const sentId = (sentMsg && sentMsg.key && sentMsg.key.id) ? sentMsg.key.id : null;
        global.gameSessions[m.chat] = {
            gameType: gameType,
            soal: questionText,
            jawaban: jawaban,
            messageId: sentId,
            caption: finalCaption,
            startTime: Date.now(),
            timeout: setTimeout(() => {
                if (global.gameSessions[m.chat]) {
                    let jawabanTampil = Array.isArray(jawaban) ? jawaban.join(" / ") : jawaban;
                    Reply(`⏰ Waktu habis! Jawaban yang benar adalah *${jawabanTampil}*`);
                    delete global.gameSessions[m.chat];
                }
            }, 60000)
        };

    } catch (e) {
        console.error(`[GAME ERROR] Gagal memulai game ${gameType}:`, e.message);
        Reply(`❌ Terjadi kesalahan saat memulai game *${gameType}*. Coba lagi nanti.`);
    }
}

module.exports = {
    startGame,
    getWIBTime,
    safeReadJSON,
    limitBonusPath,
    gameConfig
};
