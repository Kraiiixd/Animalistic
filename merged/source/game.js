/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const axios = require('axios');
const { addBonusLimit } = require('./limit');

global.gameSessions = global.gameSessions || {};

const gamesConfig = {
    asahotak: { title: 'Asah Otak', type: 'text', time: 60 },
    caklontong: { title: 'Cak Lontong', type: 'text', time: 60 },
    family100: { title: 'Family 100', type: 'family100', time: 90 },
    lengkapikalimat: { title: 'Lengkapi Kalimat', type: 'text', time: 60 },
    sambungkata: { title: 'Sambung Kata', type: 'text', time: 60 },
    siapakahaku: { title: 'Siapakah Aku', type: 'text', time: 60 },
    susunkata: { title: 'Susun Kata', type: 'text', time: 60 },
    tebakkata: { title: 'Tebak Kata', type: 'text', time: 60 },
    tebakkalimat: { title: 'Tebak Kalimat', type: 'text', time: 60 },
    tebakinggris: { title: 'Tebak Bahasa Inggris', type: 'text', time: 60 },
    tebakjorok: { title: 'Tebak Tebakan Jorok', type: 'text', time: 60 },
    tebaklirik: { title: 'Tebak Lirik', type: 'text', time: 60 },
    tebakhewan: { title: 'Tebak Hewan', type: 'text', time: 60 },
    tebakgambar: { title: 'Tebak Gambar', type: 'image', time: 60 },
    tebakbendera: { title: 'Tebak Bendera', type: 'image', time: 60 },
    tebaklogo: { title: 'Tebak Logo', type: 'image', time: 60 },
    tebakanime: { title: 'Tebak Anime', type: 'image', time: 60 },
    tebakgame: { title: 'Tebak Game', type: 'image', time: 60 },
    tebakhero: { title: 'Tebak Hero', type: 'image', time: 60 },
    tebakmakanan: { title: 'Tebak Makanan', type: 'image', time: 60 },
    tebakgenshin: { title: 'Tebak Genshin', type: 'image', time: 60 },
    tebaklagu: { title: 'Tebak Lagu', type: 'audio', time: 60 }
};

const makeClue = (ans) => {
    if (!ans) return '';
    return String(ans)
        .replace(/[a-zA-Z0-9]/g, (char, index) => (index % 2 === 0 ? char : '_'))
        .split('')
        .join(' ');
};

const similarity = (s1, s2) => {
    s1 = (s1 || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    s2 = (s2 || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    const track = Array(s2.length + 1).fill(null).map(() =>
        Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
    
    for (let j = 1; j <= s2.length; j += 1) {
        for (let i = 1; i <= s1.length; i += 1) {
            const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator
            );
        }
    }
    const distance = track[s2.length][s1.length];
    return 1 - (distance / Math.max(s1.length, s2.length));
};

const startGame = async (diezy, m, gameKey) => {
    const config = gamesConfig[gameKey];
    if (!config) return;

    const chatId = m.chat;
    if (global.gameSessions[chatId]) {
        return diezy.sendMessage(chatId, {
            text: `\`⌜ Game Sedang Berjalan ⌟\`\n> ◦ Masih ada sesi game *${global.gameSessions[chatId].title}* yang belum selesai!\n> ◦ Ketik jawabannya langsung di chat, ketik *clue* untuk bantuan, atau ketik *nyerah* untuk menyerah.`
        }, { quoted: m });
    }

    const baseUrl = global.apiClutch;
    const apiKey = global.Apikeyclutch;

    let randomItem = null;
    try {
        const res = await axios.get(`${baseUrl}/game/${gameKey}?apikey=${apiKey}`, { timeout: 15000 });
        randomItem = res.data?.result;
    } catch (e) {
        console.error('[GAME API ERROR]', e.message);
    }

    if (!randomItem) {
        return diezy.sendMessage(chatId, { text: `❌ Gagal mengambil soal game *${config.title}* dari server API.` }, { quoted: m });
    }

    let soal = randomItem.soal || randomItem.pertanyaan || '';
    let jawaban = randomItem.jawaban || randomItem.name || randomItem.judul || '';
    let deskripsi = randomItem.deskripsi || randomItem.desk || '';
    let imageUrl = randomItem.img || randomItem.image || randomItem.fullimg || null;
    let audioUrl = randomItem.soal && randomItem.soal.startsWith('http') ? randomItem.soal : (randomItem.audio || null);
    let extraInfo = '';

    if (gameKey === 'susunkata' && randomItem.tipe) {
        extraInfo = `\n> ◦ *Tipe :* ${randomItem.tipe}`;
    }
    if (gameKey === 'tebaklagu' && randomItem.artis) {
        extraInfo = `\n> ◦ *Artis :* ${randomItem.artis}`;
    }

    let sessionObj = {
        key: gameKey,
        title: config.title,
        type: config.type,
        soal: soal,
        jawaban: jawaban,
        deskripsi: deskripsi,
        answeredList: [],
        allAnswers: Array.isArray(jawaban) ? jawaban.map(v => String(v).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")) : [],
        messageId: null,
        timeoutId: null
    };

    const timeoutSec = config.time || 60;
    sessionObj.timeoutId = setTimeout(async () => {
        if (global.gameSessions[chatId]) {
            const currentSession = global.gameSessions[chatId];
            delete global.gameSessions[chatId];
            const answerDisplay = Array.isArray(currentSession.jawaban)
                ? currentSession.jawaban.join(', ')
                : currentSession.jawaban;
            let endMsg = `\`⌜ Waktu Game Habis ⏰ ⌟\`\n> ◦ *Game :* ${currentSession.title}\n> ◦ *Jawaban :* *${answerDisplay}*`;
            if (currentSession.deskripsi) {
                endMsg += `\n> ◦ *Penjelasan :* ${currentSession.deskripsi}`;
            }
            endMsg += `\n\n💡 *Ketik ${gameKey} untuk bermain kembali*`;
            await diezy.sendMessage(chatId, { text: endMsg }).catch(() => {});
        }
    }, timeoutSec * 1000);

    global.gameSessions[chatId] = sessionObj;

    const header = `\`⌜ Game ${config.title} ⌟\``;
    const clueText = Array.isArray(jawaban) ? `${jawaban.length} Jawaban Tersedia` : (randomItem.clue || makeClue(jawaban));
    const petunjukFooter = `\n\n💡 *Ketik jawabanmu langsung di chat, ketik clue untuk bantuan, atau ketik nyerah*`;
    let sentMsg = null;

    if (config.type === 'family100') {
        const textMsg = `${header}\n> ◦ *Soal :* ${soal}\n> ◦ *Tersedia :* ${jawaban.length} Jawaban\n> ◦ *Waktu :* ${timeoutSec} Detik${petunjukFooter}`;
        sentMsg = await diezy.sendMessage(chatId, { text: textMsg }, { quoted: m });
    } else if (config.type === 'image' && imageUrl) {
        const captionMsg = `${header}\n> ◦ *Soal :* ${soal || 'Tebak gambar di atas'}${extraInfo}\n> ◦ *Clue :* \`${clueText}\`\n> ◦ *Waktu :* ${timeoutSec} Detik${petunjukFooter}`;
        try {
            sentMsg = await diezy.sendMessage(chatId, { image: { url: imageUrl }, caption: captionMsg }, { quoted: m });
        } catch (e) {
            sentMsg = await diezy.sendMessage(chatId, { text: captionMsg }, { quoted: m });
        }
    } else if (config.type === 'audio' && audioUrl) {
        const captionMsg = `${header}\n> ◦ *Soal :* Dengarkan audio di bawah ini!${extraInfo}\n> ◦ *Clue :* \`${clueText}\`\n> ◦ *Waktu :* ${timeoutSec} Detik${petunjukFooter}`;
        await diezy.sendMessage(chatId, { text: captionMsg }, { quoted: m });
        sentMsg = await diezy.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
    } else {
        const textMsg = `${header}\n> ◦ *Soal :* ${soal}${extraInfo}\n> ◦ *Clue :* \`${clueText}\`\n> ◦ *Waktu :* ${timeoutSec} Detik${petunjukFooter}`;
        sentMsg = await diezy.sendMessage(chatId, { text: textMsg }, { quoted: m });
    }

    if (sentMsg && sentMsg.key) {
        sessionObj.messageId = sentMsg.key.id;
    }
    return sentMsg;
};

const handleGameAnswer = async (diezy, m, bodyText, isCmd = false, command = '') => {
    if (!m.chat || !bodyText) return false;
    const session = global.gameSessions[m.chat];
    if (!session) return false;

    const rawInput = String(bodyText).trim();

    // STRICT NO-PREFIX: Jika pesan diawali prefix atau titik (.), abaikan dan JANGAN proses sebagai game!
    if (/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^/]/i.test(rawInput)) {
        return false;
    }

    const trimmed = rawInput.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. Menyerah (Hanya jika diketik murni "nyerah" atau "surrender" tanpa titik)
    if (trimmed === 'nyerah' || trimmed === 'surrender') {
        clearTimeout(session.timeoutId);
        delete global.gameSessions[m.chat];
        const answerDisplay = Array.isArray(session.jawaban) ? session.jawaban.join(', ') : session.jawaban;
        let surrenderMsg = `\`⌜ Game Berakhir (Menyerah) 🏳️ ⌟\`\n> ◦ *Game :* ${session.title}\n> ◦ *Jawaban :* *${answerDisplay}*`;
        if (session.deskripsi) {
            surrenderMsg += `\n> ◦ *Penjelasan :* ${session.deskripsi}`;
        }
        surrenderMsg += `\n\n💡 *Ketik ${session.key} untuk bermain lagi*`;
        await diezy.sendMessage(m.chat, { text: surrenderMsg }, { quoted: m });
        return true;
    }

    // 2. Minta Clue (Hanya jika diketik murni "clue" atau "bantuan" tanpa titik)
    if (trimmed === 'clue' || trimmed === 'bantuan') {
        if (Array.isArray(session.jawaban)) {
            const remaining = session.jawaban.filter(j => !session.answeredList.includes(j.toLowerCase()));
            await diezy.sendMessage(m.chat, {
                text: `\`⌜ Clue Family 100 ⌟\`\n> ◦ *Tersisa ${remaining.length} Jawaban:*\n> ◦ ${remaining.map(r => makeClue(r)).join('\n> ◦ ')}`
            }, { quoted: m });
        } else {
            await diezy.sendMessage(m.chat, {
                text: `\`⌜ Clue Bantuan ⌟\`\n> ◦ *Clue :* \`${makeClue(session.jawaban)}\``
            }, { quoted: m });
        }
        return true;
    }

    // 3. Cek apakah ini command bot lain (jangan ganggu)
    const knownGeneralCommands = [
        'menu', 'allmenu', 'help', 'ping', 'owner', 'creator', 'info',
        'tiktok', 'tt', 'tiktokmp3', 'ttmp3', 'ig', 'instagram', 'play', 'playmusic',
        'yts', 'ytsearch', 'pinterest', 'pin', 'ai', 'gemini', 'bananaai', 'brat',
        'hd', 'remini', 'removebg', 'tofigure', 'tobotak', 'tohitam', 'fakeff',
        'artinama', 'artimimpi', 'jodohnama', 'ramalanjodoh', 'weton', 'haribaik', 'rejekiweton'
    ];
    if (knownGeneralCommands.includes(trimmed)) {
        return false;
    }

    // 4. Mode Family 100
    if (session.type === 'family100') {
        let matchedIndex = -1;
        for (let i = 0; i < session.jawaban.length; i++) {
            const cleanAns = String(session.jawaban[i]).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (trimmed === cleanAns || similarity(trimmed, cleanAns) >= 0.85) {
                if (!session.answeredList.includes(cleanAns)) {
                    matchedIndex = i;
                    break;
                }
            }
        }

        if (matchedIndex !== -1) {
            const matchedAnswer = session.jawaban[matchedIndex];
            session.answeredList.push(String(matchedAnswer).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
            addBonusLimit(m.sender, 1);

            const remaining = session.jawaban.length - session.answeredList.length;
            if (remaining === 0) {
                clearTimeout(session.timeoutId);
                delete global.gameSessions[m.chat];
                addBonusLimit(m.sender, 3); // Bonus selesai semua

                let finishMsg = `\`⌜ Family 100 Selesai! 🎉 ⌟\`\n> ◦ *Hebat! Semua jawaban berhasil ditebak!*\n> ◦ Penebak Terakhir : *@${m.sender.split('@')[0]}*\n> ◦ *Hadiah :* +3 Limit Harian 🎁\n\n> ◦ *Semua Jawaban:*\n${session.jawaban.map((j, i) => `> ${i + 1}. ${j}`).join('\n')}`;
                await diezy.sendMessage(m.chat, { text: finishMsg, mentions: [m.sender] }, { quoted: m });
                return true;
            } else {
                let correctMsg = `\`⌜ Jawaban Benar! ✨ ⌟\`\n> ◦ *@${m.sender.split('@')[0]}* berhasil menebak: *${matchedAnswer}* (+1 Limit 🎁)\n> ◦ Tersisa *${remaining}* jawaban lagi!\n\n> ◦ *Terjawab:* ${session.answeredList.join(', ')}`;
                await diezy.sendMessage(m.chat, { text: correctMsg, mentions: [m.sender] }, { quoted: m });
                return true;
            }
        }
        return false;
    }

    // 5. Mode Single Answer Game
    const targetJawaban = String(session.jawaban).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const score = similarity(trimmed, targetJawaban);

    if (trimmed === targetJawaban || score >= 0.90) {
        clearTimeout(session.timeoutId);
        delete global.gameSessions[m.chat];
        addBonusLimit(m.sender, 2);

        let winMsg = `\`⌜ Jawaban Benar! 🎉 ⌟\`
> ◦ *Game :* ${session.title}
> ◦ *Pemenang :* @${m.sender.split('@')[0]}
> ◦ *Jawaban :* *${session.jawaban}*
> ◦ *Hadiah :* +2 Limit Harian 🎁`;

        if (session.deskripsi) {
            winMsg += `\n> ◦ *Penjelasan :* ${session.deskripsi}`;
        }
        winMsg += `\n\n💡 *Ketik ${session.key} untuk bermain lagi*`;

        await diezy.sendMessage(m.chat, { text: winMsg, mentions: [m.sender] }, { quoted: m });
        return true;
    } else if (score >= 0.70) {
        await diezy.sendMessage(m.chat, { text: `\`⌜ Dikit Lagi! 🤏 ⌟\`\n> ◦ Jawabanmu sudah hampir benar, coba lagi!` }, { quoted: m });
        return true;
    }

    return false;
};

module.exports = {
    gamesConfig,
    startGame,
    handleGameAnswer
};
