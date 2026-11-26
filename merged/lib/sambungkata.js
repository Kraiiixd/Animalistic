/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const sambungKataSessions = new Map();
const TIME_LIMIT = 30000;
const MAX_ERRORS = 3;

function getLastLetters(word) {
    word = word.toLowerCase();
    const letters = [];
    if (word.length > 0) {
        letters.push(word.slice(-1));
    }
    if (word.length >= 2) {
        letters.push(word.slice(-2));
    }
    return letters;
}

function getNextPlayer(currentPlayerJid, session) {
    const players = session.players;
    const currentIndex = players.indexOf(currentPlayerJid);
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex];
}

function endSession(chatId) {
    const session = sambungKataSessions.get(chatId);
    if (session && session.timeout) {
        clearTimeout(session.timeout);
    }
    sambungKataSessions.delete(chatId);
}

async function handleTimeout(diezy, chatId) {
    const session = sambungKataSessions.get(chatId);
    if (!session || session.status !== 'playing') return;
    const currentPlayerJid = session.currentPlayer;
    session.errors++;
    let message = `⏳ *Waktu @${currentPlayerJid.split('@')[0]} habis!* Kata sebelumnya: *${session.currentWord.toUpperCase()}*.`;

    if (session.errors >= MAX_ERRORS) {
        message += `\n\n❌ Batas kesalahan game telah mencapai ${MAX_ERRORS}. *@${currentPlayerJid.split('@')[0]}* kalah!`;
        message += `\n\n*Permainan Sambung Kata selesai!*`;
        await diezy.sendMessage(chatId, { text: message, mentions: session.players });
        endSession(chatId);
        return;
    } else {
        message += `\nTotal kesalahan game: ${session.errors}/${MAX_ERRORS}.\n`;
        const prevPlayer = session.currentPlayer;
        session.currentPlayer = getNextPlayer(prevPlayer, session);
        const nextPlayerJid = session.currentPlayer;
        const requiredLetters = getLastLetters(session.currentWord);

        message += `\nGiliran selanjutnya: *@${nextPlayerJid.split('@')[0]}*.\n`;
        message += `Anda harus menjawab dengan kata yang berawalan *${requiredLetters.join('*, atau *')}*.\n`;
        message += `*Waktu 30 detik dimulai!*`;
        session.timeout = setTimeout(() => handleTimeout(diezy, chatId), TIME_LIMIT);

        await diezy.sendMessage(chatId, { text: message, mentions: session.players });
    }
}

async function handleIncorrectSubmission(diezy, m, session, errorMessage) {
    session.errors++;
    clearTimeout(session.timeout);

    const currentPlayerJid = session.currentPlayer;
    let message = `${errorMessage}\n`;
    message += `Kesalahan: ${session.errors}/${MAX_ERRORS}.`;

    if (session.errors >= MAX_ERRORS) {
        message += `\n\n❌ Batas kesalahan game telah mencapai ${MAX_ERRORS}. *@${currentPlayerJid.split('@')[0]}* kalah!`;
        message += `\n\n*Permainan Sambung Kata selesai!*`;
        await diezy.sendMessage(m.chat, { text: message, mentions: session.players });
        endSession(m.chat);
        return;
    } else {
        const requiredLetters = getLastLetters(session.currentWord);
        message += `\nAnda masih punya kesempatan!\n`;
        message += `Anda harus menjawab dengan kata yang berawalan *${requiredLetters.join('*, atau *')}*.\n`;
        message += `*Waktu 30 detik dimulai!*`;

        session.timeout = setTimeout(() => handleTimeout(diezy, m.chat), TIME_LIMIT);

        await diezy.sendMessage(m.chat, {
            text: message,
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
    }
}

async function handleCreate(diezy, m) {
    const chatId = m.chat;
    const sender = m.sender;

    if (sambungKataSessions.has(chatId)) {
        await diezy.sendMessage(chatId, {
            text: '❌ Game Sambung Kata sudah ada di grup ini. Ketik *.sambungkata2 join* untuk bergabung.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }

    const newSession = {
        chatId: chatId,
        status: 'pending',
        creator: sender,
        players: [sender],
        currentWord: null,
        usedWords: new Set(),
        currentPlayer: null,
        errors: 0,
        timeout: null
    };

    sambungKataSessions.set(chatId, newSession);

    const message = `🎲 *Game Sambung Kata Dibuat!* 🎲\n\n👤 Pembuat: *@${sender.split('@')[0]}*\n\nKetik *.sambungkata2 join* untuk bergabung.\nMinimal ${MAX_ERRORS-1} pemain untuk memulai.\n\nSetelah cukup, ketik *.sambungkata2 start <kata_pertama>* untuk memulai permainan.`;
    await diezy.sendMessage(chatId, {
        text: message,
        mentions: [sender],
        contextInfo: {
            externalAdReply: {
                title: `💢 — ${global.botname} v${global.versi}`,
                body: `© Powered by ${global.namaOwner}`,
                thumbnailUrl: global.image?.reply || null,
                sourceUrl: global.linkMenu || null,
                mediaType: 1
            }
        }
    });
}

async function handleJoin(diezy, m) {
    const chatId = m.chat;
    const sender = m.sender;

    const session = sambungKataSessions.get(chatId);

    if (!session) {
        await diezy.sendMessage(chatId, {
            text: '❌ Tidak ada Game Sambung Kata yang aktif. Ketik *.sambungkata2 create* untuk membuat game baru.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }
    if (session.status !== 'pending') {
        await diezy.sendMessage(chatId, {
            text: '❌ Game sudah dimulai. Anda tidak bisa bergabung sekarang.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }
    if (session.players.includes(sender)) {
        await diezy.sendMessage(chatId, {
            text: 'Anda sudah bergabung dalam permainan ini.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }

    session.players.push(sender);

    const message = `✅ *${session.players.length}. *@${sender.split('@')[0]}* berhasil bergabung!\n\nTotal pemain: ${session.players.length} orang.\nKetik *.sambungkata2 start <kata_pertama>* untuk memulai.`;
    await diezy.sendMessage(chatId, {
        text: message,
        mentions: session.players,
        contextInfo: {
            externalAdReply: {
                title: `💢 — ${global.botname} v${global.versi}`,
                body: `© Powered by ${global.namaOwner}`,
                thumbnailUrl: global.image?.reply || null,
                sourceUrl: global.linkMenu || null,
                mediaType: 1
            }
        }
    });
}

async function handleStart(diezy, m, args) {
    const chatId = m.chat;
    const sender = m.sender;

    const session = sambungKataSessions.get(chatId);

    if (!session) {
        await diezy.sendMessage(chatId, {
            text: '❌ Tidak ada Game Sambung Kata yang aktif. Ketik *.sambungkata2 create* untuk membuat game baru.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }
    if (session.status === 'playing') {
        await diezy.sendMessage(chatId, {
            text: '❌ Game sudah berjalan.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }
    if (session.creator !== sender) {
        await diezy.sendMessage(chatId, {
            text: '❌ Hanya pembuat game (@' + session.creator.split('@')[0] + ') yang dapat memulai permainan.',
            mentions: [session.creator],
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }
    if (session.players.length < 2) {
        await diezy.sendMessage(chatId, {
            text: '❌ Minimal harus ada 2 pemain untuk memulai permainan. Saat ini baru ada ' + session.players.length + ' pemain.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }

    let firstWord = args[0] || 'bot';
    firstWord = firstWord.toLowerCase().trim();
    if (firstWord.length < 3) {
        await diezy.sendMessage(chatId, {
            text: '❌ Kata pertama minimal harus 3 huruf. Contoh: *.sambungkata2 start batu*',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }
    session.status = 'playing';
    session.currentWord = firstWord;
    session.usedWords.add(firstWord);
    session.currentPlayer = session.players[Math.floor(Math.random() * session.players.length)];

    const nextPlayerJid = session.currentPlayer;
    const requiredLetters = getLastLetters(firstWord);

    let message = `🌟 *Game Sambung Kata Dimulai!* 🌟\n`;
    message += `Pemain: ${session.players.length} orang.\n`;
    message += `Kata pertama: *${firstWord.toUpperCase()}*\n`;
    message += `\nGiliran pertama: *@${nextPlayerJid.split('@')[0]}*.\n`;
    message += `Anda harus menjawab dengan kata yang berawalan *${requiredLetters.join('*, atau *')}*.\n`;
    message += `\n*PERHATIAN: Tanpa API KBBI, bot hanya memeriksa aturan sambung kata dan duplikasi kata.*\n\n*Waktu 30 detik dimulai!*`;
    session.timeout = setTimeout(() => handleTimeout(diezy, chatId), TIME_LIMIT);

    await diezy.sendMessage(chatId, {
        text: message,
        mentions: session.players,
        contextInfo: {
            externalAdReply: {
                title: `💢 — ${global.botname} v${global.versi}`,
                body: `© Powered by ${global.namaOwner}`,
                thumbnailUrl: global.image?.reply || null,
                sourceUrl: global.linkMenu || null,
                mediaType: 1
            }
        }
    });
}

async function handleWordSubmission(diezy, m, text) {
    const chatId = m.chat;
    const sender = m.sender;

    const session = sambungKataSessions.get(chatId);

    if (!session || session.status !== 'playing') {
        return;
    }

    const newWord = text.toLowerCase().trim();
    if (newWord.length < 2) return;

    if (session.currentPlayer !== sender) {
        return;
    }

    const currentWord = session.currentWord;
    const requiredLetters = getLastLetters(currentWord);
    if (session.usedWords.has(newWord)) {
        return handleIncorrectSubmission(diezy, m, session, `❌ Kata *${newWord.toUpperCase()}* sudah digunakan! Coba kata lain.`);
    }
    if (newWord.length < 3) {
        return handleIncorrectSubmission(diezy, m, session, `❌ Kata minimal harus 3 huruf.`);
    }
    const isSambung = requiredLetters.some(letters => newWord.startsWith(letters));
    if (!isSambung) {
        return handleIncorrectSubmission(diezy, m, session, `❌ Kata *${newWord.toUpperCase()}* tidak nyambung! Harus berawalan *${requiredLetters.join('*, atau *')}* dari kata sebelumnya (*${currentWord.toUpperCase()}*).`);
    }
    clearTimeout(session.timeout);

    session.currentWord = newWord;
    session.usedWords.add(newWord);
    const prevPlayer = session.currentPlayer;
    session.currentPlayer = getNextPlayer(prevPlayer, session);
    const nextPlayerJid = session.currentPlayer;

    const nextRequiredLetters = getLastLetters(newWord);

    let message = `✅ Jawaban benar dari *@${prevPlayer.split('@')[0]}*:\nKata: *${newWord.toUpperCase()}*\n`;
    message += `\nGiliran selanjutnya: *@${nextPlayerJid.split('@')[0]}*.\n`;
    message += `Anda harus menjawab dengan kata yang berawalan *${nextRequiredLetters.join('*, atau *')}*.\n`;
    message += `*Waktu 30 detik dimulai!*`;
    session.timeout = setTimeout(() => handleTimeout(diezy, chatId), TIME_LIMIT);

    await diezy.sendMessage(chatId, {
        text: message,
        mentions: session.players,
        contextInfo: {
            externalAdReply: {
                title: `💢 — ${global.botname} v${global.versi}`,
                body: `© Powered by ${global.namaOwner}`,
                thumbnailUrl: global.image?.reply || null,
                sourceUrl: global.linkMenu || null,
                mediaType: 1
            }
        }
    });
}

function isWordSubmission(m, text, prefix) {
    const session = sambungKataSessions.get(m.chat);
    return session && session.status === 'playing' && text.length > 0 && !text.startsWith(prefix);
}

async function handleSambungKata(diezy, m, command, args) {
    if (!m.isGroup) {
        await diezy.sendMessage(m.chat, {
            text: '❌ Fitur ini hanya bisa digunakan di *dalam grup*.',
            contextInfo: {
                externalAdReply: {
                    title: `💢 — ${global.botname} v${global.versi}`,
                    body: `© Powered by ${global.namaOwner}`,
                    thumbnailUrl: global.image?.reply || null,
                    sourceUrl: global.linkMenu || null,
                    mediaType: 1
                }
            }
        });
        return;
    }

    const action = args[0] ? args[0].toLowerCase() : '';

    switch (action) {
        case 'create':
            await handleCreate(diezy, m);
            break;
        case 'join':
            await handleJoin(diezy, m);
            break;
        case 'start':
            await handleStart(diezy, m, args.slice(1));
            break;
        case 'end':
            const session = sambungKataSessions.get(m.chat);
            if (!session) {
                await diezy.sendMessage(m.chat, {
                    text: '❌ Tidak ada game aktif.',
                    contextInfo: {
                        externalAdReply: {
                            title: `💢 — ${global.botname} v${global.versi}`,
                            body: `© Powered by ${global.namaOwner}`,
                            thumbnailUrl: global.image?.reply || null,
                            sourceUrl: global.linkMenu || null,
                            mediaType: 1
                        }
                    }
                });
                return;
            }
            if (session.creator !== m.sender && !m.isAdmin) {
                await diezy.sendMessage(m.chat, {
                    text: '❌ Hanya pembuat game (@' + session.creator.split('@')[0] + ') atau admin grup yang dapat mengakhiri permainan.',
                    mentions: [session.creator],
                    contextInfo: {
                        externalAdReply: {
                            title: `💢 — ${global.botname} v${global.versi}`,
                            body: `© Powered by ${global.namaOwner}`,
                            thumbnailUrl: global.image?.reply || null,
                            sourceUrl: global.linkMenu || null,
                            mediaType: 1
                        }
                    }
                });
                return;
            }
            endSession(m.chat);
            await diezy.sendMessage(m.chat, {
                text: '✅ Game Sambung Kata telah diakhiri.',
                contextInfo: {
                    externalAdReply: {
                        title: `💢 — ${global.botname} v${global.versi}`,
                        body: `© Powered by ${global.namaOwner}`,
                        thumbnailUrl: global.image?.reply || null,
                        sourceUrl: global.linkMenu || null,
                        mediaType: 1
                    }
                }
            });
            break;
        default:
            const helpMessage = `
*🧩 SAMBUNG KATA (WORD CHAIN) 🧩*

Perintah:
1. *.sambungkata2 create* - Buat sesi permainan baru.
2. *.sambungkata2 join* - Bergabung ke sesi yang sudah ada.
3. *.sambungkata2 start <kata_pertama>* - Mulai permainan (minimal 2 pemain).
4. *.sambungkata2 end* - Akhiri permainan.

Saat bermain, langsung kirim kata jawabanmu tanpa prefix command (misal: *tukang*)

*Peraturan Singkat:*
- Ambil *1 atau 2 huruf terakhir* dari kata sebelumnya (contoh: batu -> *tu* atau *u*).
- Maksimal *3 kesalahan* per game.
- Batas waktu *30 detik* per giliran.
`.trim();
            await diezy.sendMessage(m.chat, {
                text: helpMessage,
                contextInfo: {
                    externalAdReply: {
                        title: `💢 — ${global.botname} v${global.versi}`,
                        body: `© Powered by ${global.namaOwner}`,
                        thumbnailUrl: global.image?.reply || null,
                        sourceUrl: global.linkMenu || null,
                        mediaType: 1
                    }
                }
            });
            break;
    }
}

module.exports = {
    handleSambungKata,
    handleWordSubmission,
    isWordSubmission,
};
