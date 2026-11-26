/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Ripall
 */

/**

 SC BOT : HITOSHI MD V1
 VERSION : 1.3

**/

const fs = require('fs');
const chalk = require('chalk');
const { version } = require("./package.json");

// Settings Bot 
global.owner = "6285869514660";
global.versi = version;
global.namaOwner = "Ripall MD";
global.packname = "Hitoshi MD V1";
global.botname = "Hitoshi MD V1";
global.botname2 = "Hitoshi MD V1";
global.uiMode = 'rich'; // 'rich' = kartu menu HTML, 'text' = menu teks lama
global.linkOwner = "https://wa.me/6285869514660";
global.linkGrup = "https://chat.whatsapp.com/CUGkYst9qgmCagf0iWDSBR?s=cl&p=a&mlu=4&ilr=4&iam=2";
global.linkSaluran = "https://whatsapp.com/channel/0029VaBOlsv002TEjlntTE2D";
global.idSaluran = "120363186130999681@newsletter";
global.namaSaluran = "Hitoshi MD V1";

// Telegram & Backup Config
global.telegramToken = ""; // Token bot Telegram dari @BotFather
global.telegramChatId = ""; // Chat ID Telegram dari @userinfobot
global.idgc = ""; // ID grup WhatsApp default untuk backup/getsc (opsional)

// Konfigurasi Status Saluran WhatsApp (SWCH)
global.swchConfig = {
	idSaluran: global.idSaluran || "120363186130999681@newsletter",
	namaSaluran: global.namaSaluran || "# channel Hitoshi MD V1",
	requireAdmin: true,          // Validasi ketat: bot wajib admin di saluran
	statusAttribution: true,     // Sertakan atribusi resmi status saluran WhatsApp
	resolveServerId: true,       // Tunggu server ID dari WhatsApp
	ackTimeoutMs: 15000,         // Timeout ACK (ms)
	defaultBgColor: "#25D366",   // Background default status teks WhatsApp (Hex)
	postToFeed: true             // Terbitkan juga ke feed chat saluran agar pasti muncul & terbaca follower
};

// Settings Connection & Database
global.custompairing = "KUREZAMD"; // 8 karakter, huruf besar
global.pairing_code = true;
global.tempatDB = 'database.json';

// Settings API
global.apiClutch = "https://api.clutch.web.id";
global.Apikeyclutch = "alipaiapikeybaru";
global.apidiezy = "https://api-diezy.clutch.ai.id";
global.apikeydiezy = "alipaiapikeybaru";
global.jakyKey = "diezy-jakydev404";

// API Kureza Tools (fitur .rch) — ambil key di https://kurezatools.my.id
global.kurezaKey = ""; // tidak dipakai lagi oleh .rch (sekarang pakai scraper, tanpa key)

// API Termai — dipakai fitur AI gambar/filter/suara/chat (.gpt3 .deepseek .bard .elevenlabs .songai .autoai dll)
// Ambil key di https://termai.cc (atau env TERMAI_KEY). Fitur AI lain (claude, gpt4, blackbox, googleans, qwerty, hitoshi) tidak butuh key ini.
global.termai = { url: "https://api.termai.cc", key: "" };

// Fitur .play2 — sumber audio cadangan (opsional). Urutan: savetube -> yt-dlp (otomatis) -> API ini
// Contoh: global.playFallbackApi = "https://host/api/ytmp3?apikey=KEY&url={url}"
global.playFallbackApi = "";
// global.play2PayloadMB = 1.2; // batas ukuran audio di kartu .play2 (MB). Besar = kualitas naik, tapi kartu bisa gagal terkirim
// global.ytdlpPath = "/path/ke/yt-dlp"; // opsional, kalau yt-dlp sudah terpasang di tempat lain

// Settings Image Url
global.image = {
	menu: "https://files.catbox.moe/jsb28n.jpg",
	menuv3: "https://files.catbox.moe/jsb28n.jpg",
	reply: "https://files.catbox.moe/uhhobg.png",
	qris: "https://u.pone.rs/lljqakzc.jpg"
};

// Settings Payment
global.payment = {
	qris: "",
	dana: "085869514660",
	gopay: "085869514660",
	an: "L***h"
};

// Message Command
global.mess = {
	owner: `\`⌜ Access Denied ⌟\`\n> ◦ Status : *Gagal*\n> ◦ Info : *Fitur khusus Owner Bot*`,
	admin: `\`⌜ Access Denied ⌟\`\n> ◦ Status : *Gagal*\n> ◦ Info : *Fitur khusus Admin Grup*`,
	botAdmin: `\`⌜ Access Denied ⌟\`\n> ◦ Status : *Gagal*\n> ◦ Info : *Bot harus menjadi Admin Grup*`,
	group: `\`⌜ Access Denied ⌟\`\n> ◦ Status : *Gagal*\n> ◦ Info : *Fitur khusus di dalam Grup*`,
	wait: `\`⌜ Processing ⌟\`\n> ◦ Status : *Mohon tunggu...*\n> ◦ Info : *Permintaan sedang diproses*`,
	error: `\`⌜ Error ⌟\`\n> ◦ Status : *Gagal*\n> ◦ Info : *Terjadi kesalahan sistem*`,
	done: `\`⌜ Success ⌟\`\n> ◦ Status : *Berhasil*\n> ◦ Info : *Proses selesai dengan sukses*`,
	prem: `\`⌜ Access Denied ⌟\`\n> ◦ Status : *Gagal*\n> ◦ Info : *Fitur ini khusus Pengguna Premium (VIP)*`,
	limit: `\`⌜ Limit Habis ⌟\`\n> ◦ Status : *Limit Harian Habis*\n> ◦ Info : *Kamu telah mencapai batas penggunaan hari ini. Limit di-reset jam 00:00 WIB.*\n> ◦ Tips : *Ketik claim untuk klaim +5 bonus limit harian gratis.*`
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
	fs.unwatchFile(file);
	console.log(chalk.redBright(`Update ${__filename}`));
	delete require.cache[file];
	require(file);
});
