/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Ripall
 */

process.on("uncaughtException", _0x3fce07 => console.error("[Uncaught Exception]", _0x3fce07?.message || _0x3fce07));
process.on("unhandledRejection", _0xd774c6 => console.error("[Unhandled Rejection]", _0xd774c6?.message || _0xd774c6));
process.setMaxListeners(0);
// Panel menjalankan dari /home/container, bot pakai path relatif ./library/...
// jadi pindah ke folder bot ini dulu.
process.chdir(__dirname);
require("./settings");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const axios = require("axios");
const chalk = require("chalk");
const readline = require("readline");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const moment = require("moment-timezone");
const {
  Boom
} = require("@hapi/boom");
const NodeCache = require("node-cache");
const {
  cleaningSession,
  cleanTempFiles
} = require("./library/boostsession");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay
} = require("@whiskeysockets/baileys");
// Baileys versi baru tidak punya makeInMemoryStore lagi -> pakai pengganti lokal
const makeInMemoryStore = require("@whiskeysockets/baileys").makeInMemoryStore || require("./lib/memstore.cjs");
const pairingCode = global.pairing_code || process.argv.includes("--pairing-code");
const a0_0x_0x4d0b5c = {
  input: process.stdin,
  output: process.stdout
};
const rl = readline.createInterface(a0_0x_0x4d0b5c);
const question = _0x4c6a83 => new Promise(_0x4265e3 => rl.question(_0x4c6a83, _0x4265e3));
const DataBase = require("./source/database");
const database = new DataBase();
const bannerText = "██╗  ██╗██╗   ██╗██████╗ ███████╗███████╗ █████╗ ██╗   ██╗██╗  ██╗\n██║ ██╔╝██║   ██║██╔══██╗██╔════╝╚══███╔╝██╔══██╗██║   ██║╚██╗██╔╝\n█████╔╝ ██║   ██║██████╔╝█████╗    ███╔╝ ███████║██║   ██║ ╚███╔╝ \n██╔═██╗ ██║   ██║██╔══██╗██╔══╝   ███╔╝  ██╔══██║╚██╗ ██╔╝ ██╔██╗ \n██║  ██╗╚██████╔╝██║  ██║███████╗███████╗██║  ██║ ╚████╔╝ ██╔╝ ██╗\n╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝  ╚═╝";
const gradientPalettes = [[[255, 0, 110], [255, 110, 0], [255, 215, 0], [0, 245, 120], [0, 180, 255], [140, 50, 255]], [[255, 0, 128], [190, 0, 255], [0, 210, 255], [0, 255, 190]], [[255, 50, 50], [255, 130, 0], [255, 210, 0], [200, 0, 150]], [[0, 255, 180], [0, 220, 255], [110, 110, 255], [210, 50, 255]], [[255, 0, 30], [255, 90, 0], [255, 185, 0], [255, 240, 90]], [[140, 0, 255], [0, 160, 255], [0, 255, 200], [255, 0, 180]]];
function interpolateRGB(_0x13bd26, _0x2bb494, _0x358db1) {
  return [Math.round(_0x13bd26[0] + (_0x2bb494[0] - _0x13bd26[0]) * _0x358db1), Math.round(_0x13bd26[1] + (_0x2bb494[1] - _0x13bd26[1]) * _0x358db1), Math.round(_0x13bd26[2] + (_0x2bb494[2] - _0x13bd26[2]) * _0x358db1)];
}
function getGradientColor(_0x5e4735, _0x384c83) {
  if (_0x384c83 <= 0) {
    return _0x5e4735[0];
  }
  if (_0x384c83 >= 1) {
    return _0x5e4735[_0x5e4735.length - 1];
  }
  const _0x35b5d7 = _0x384c83 * (_0x5e4735.length - 1);
  const _0x4daffa = Math.floor(_0x35b5d7);
  const _0x3c829e = _0x35b5d7 - _0x4daffa;
  return interpolateRGB(_0x5e4735[_0x4daffa], _0x5e4735[_0x4daffa + 1], _0x3c829e);
}
function generateGradientBanner(_0x3e2419) {
  const _0x411d00 = _0x3e2419 || gradientPalettes[Math.floor(Math.random() * gradientPalettes.length)];
  const _0x5e8216 = bannerText.split("\n");
  return _0x5e8216.map((_0x5b7eee, _0x3d77f8) => {
    let _0x42ddd0 = "";
    const _0x3f0892 = _0x5b7eee.length;
    for (let _0x1dcbc3 = 0; _0x1dcbc3 < _0x3f0892; _0x1dcbc3++) {
      const _0x5bb0be = _0x5b7eee[_0x1dcbc3];
      if (_0x5bb0be === " ") {
        _0x42ddd0 += " ";
        continue;
      }
      const _0x207fb1 = _0x1dcbc3 / (_0x3f0892 - 1 || 1) * 0.8 + _0x3d77f8 / (_0x5e8216.length - 1 || 1) * 0.2;
      const [_0x3ca750, _0x3127b1, _0x2520cb] = getGradientColor(_0x411d00, _0x207fb1);
      _0x42ddd0 += "[38;2;" + _0x3ca750 + ";" + _0x3127b1 + ";" + _0x2520cb + "m" + _0x5bb0be;
    }
    return _0x42ddd0 + "[0m";
  }).join("\n");
}
const asciiBanner = generateGradientBanner();
function printBanner() {
  let art = "";
  try {
    art = fs.readFileSync(path.join(__dirname, "lib", "media", "banner.ansi"), "utf8");
  } catch (_) {}
  if (art) console.log("\n" + art);
  console.log(generateGradientBanner());
  console.log(chalk.hex("#7fffd4")("  Bot         : " + (global.botname || "Hitoshi MD V1")));
  console.log(chalk.hex("#7fffd4")("  Creator     : " + (global.namaOwner || "Kureza MD")) + "\n");
}
function generateMiniQR(_0x5525a4) {
  try {
    const _0x51e87f = QRCode.create(_0x5525a4, {
      errorCorrectionLevel: "L"
    });
    const _0x1167ba = _0x51e87f.modules.size;
    const _0x396407 = _0x51e87f.modules.data;
    const _0x15cbc5 = [];
    for (let _0x131708 = -1; _0x131708 < _0x1167ba + 1; _0x131708 += 2) {
      let _0x52801b = "";
      for (let _0x63ba9e = -1; _0x63ba9e < _0x1167ba + 1; _0x63ba9e++) {
        const _0x1cc8a8 = _0x131708 >= 0 && _0x131708 < _0x1167ba && _0x63ba9e >= 0 && _0x63ba9e < _0x1167ba ? _0x396407[_0x131708 * _0x1167ba + _0x63ba9e] : 0;
        const _0x4a603b = _0x131708 + 1;
        const _0x39130f = _0x4a603b >= 0 && _0x4a603b < _0x1167ba && _0x63ba9e >= 0 && _0x63ba9e < _0x1167ba ? _0x396407[_0x4a603b * _0x1167ba + _0x63ba9e] : 0;
        if (_0x1cc8a8 && _0x39130f) {
          _0x52801b += " ";
        } else if (!_0x1cc8a8 && !_0x39130f) {
          _0x52801b += "█";
        } else if (_0x1cc8a8 && !_0x39130f) {
          _0x52801b += "▄";
        } else {
          _0x52801b += "▀";
        }
      }
      _0x15cbc5.push(_0x52801b);
    }
    return _0x15cbc5.join("\n");
  } catch (_0xe266a9) {
    return null;
  }
}
function getQRLink(_0x2a62dc) {
  return "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" + encodeURIComponent(_0x2a62dc);
}
const sewaPath = "./library/database/sewagrup.json";
if (!fs.existsSync(sewaPath)) {
  fs.writeFileSync(sewaPath, JSON.stringify([]));
}
const sewaNotifiedPath = "./library/database/sewa_notified.json";
function getSewaNotified() {
  try {
    if (fs.existsSync(sewaNotifiedPath)) {
      return JSON.parse(fs.readFileSync(sewaNotifiedPath, "utf8"));
    }
  } catch (_0xd311b) {}
  return {};
}
function saveSewaNotified(_0x589b08) {
  try {
    const _0x69eec5 = "./library/database";
    if (!fs.existsSync(_0x69eec5)) {
      fs.mkdirSync(_0x69eec5, {
        recursive: true
      });
    }
    fs.writeFileSync(sewaNotifiedPath, JSON.stringify(_0x589b08, null, 2));
  } catch (_0x1192fc) {}
}
const sistemSewaPath = "./library/database/sistemsewa.json";
if (!fs.existsSync(sistemSewaPath)) {
  fs.writeFileSync(sistemSewaPath, JSON.stringify({
    enabled: true
  }, null, 2));
}
function isSistemSewaEnabled() {
  try {
    const _0x59629a = JSON.parse(fs.readFileSync(sistemSewaPath));
    return _0x59629a.enabled === true;
  } catch (_0x2d9d74) {
    return true;
  }
}
if (!global.sewaProcessing) {
  global.sewaProcessing = {};
}
async function checkSewaGroup() {
  try {
    if (!isSistemSewaEnabled()) {
      return;
    }
    if (!global.socket) {
      return;
    }
    const _0x4f7ada = Date.now();
    const _0x1bd2b5 = JSON.parse(fs.readFileSync(sewaPath));
    let _0x25e4b2 = false;
    const _0x2eb11a = getSewaNotified();
    let _0x371f3b = false;
    for (let _0x4e0db8 = _0x1bd2b5.length - 1; _0x4e0db8 >= 0; _0x4e0db8--) {
      const _0x2a1fe3 = _0x1bd2b5[_0x4e0db8];
      const _0x3aee77 = _0x2a1fe3.expired - _0x4f7ada;
      const _0x50802c = _0x2a1fe3.jid;
      if (!_0x2eb11a[_0x50802c]) {
        _0x2eb11a[_0x50802c] = {};
      }
      if (_0x3aee77 <= 0) {
        const _0xd4e470 = "expired_" + _0x50802c;
        if (!_0x2eb11a[_0x50802c].expiredNotified && !global.sewaProcessing[_0xd4e470]) {
          global.sewaProcessing[_0xd4e470] = true;
          try {
            await global.socket.sendMessage(_0x50802c, {
              text: "`⌜ Verification Group ⌟`\n> ◦ Status : *Sewa Berakhir*\n> ◦ Hubungi : *wa.me/" + global.owner + "*\n> ◦ Info : *Masa sewa bot telah habis. Bot akan keluar dari grup dalam 5 detik.*"
            });
          } catch (_0x313bd9) {
            console.error("[Sewa] Gagal mengirim pesan expired ke " + _0x50802c + ":", _0x313bd9.message);
          }
          _0x2eb11a[_0x50802c].expiredNotified = true;
          _0x371f3b = true;
          setTimeout(async () => {
            try {
              await global.socket.groupLeave(_0x50802c);
            } catch (_0x54b0df) {
              console.error("[Sewa] Gagal keluar grup " + _0x50802c + ":", _0x54b0df.message);
            }
            try {
              const _0x3859c4 = JSON.parse(fs.readFileSync(sewaPath));
              const _0x2e9d6f = _0x3859c4.findIndex(_0x4f58cc => _0x4f58cc.jid === _0x50802c);
              if (_0x2e9d6f !== -1) {
                _0x3859c4.splice(_0x2e9d6f, 1);
                fs.writeFileSync(sewaPath, JSON.stringify(_0x3859c4, null, 2));
              }
            } catch (_0x17467f) {}
            delete global.sewaProcessing[_0xd4e470];
          }, 5000);
        }
      } else if (_0x3aee77 <= 259200000 && _0x3aee77 > 0) {
        const _0x26c935 = Math.ceil(_0x3aee77 / 86400000);
        const _0x4ad664 = "warn_" + _0x50802c;
        if (_0x2eb11a[_0x50802c].expiredNotified) {
          _0x2eb11a[_0x50802c].expiredNotified = false;
          _0x371f3b = true;
        }
        if (_0x2eb11a[_0x50802c].lastWarnedDaysLeft !== _0x26c935 && !global.sewaProcessing[_0x4ad664]) {
          global.sewaProcessing[_0x4ad664] = true;
          try {
            await global.socket.sendMessage(_0x50802c, {
              text: "`⌜ Verification Group ⌟`\n> ◦ Status : *Sewa Hampir Habis*\n> ◦ Sisa Waktu : *" + _0x26c935 + " Hari*\n> ◦ Hubungi : *wa.me/" + global.owner + "*\n> ◦ Info : *Segera perpanjang sewa agar bot tetap aktif di grup ini.*"
            });
            _0x2eb11a[_0x50802c].lastWarnedDaysLeft = _0x26c935;
            _0x371f3b = true;
            _0x2a1fe3.lastWarnedDaysLeft = _0x26c935;
            _0x2a1fe3.warningSent = true;
            _0x25e4b2 = true;
          } catch (_0x48f23b) {
            console.error("[Sewa] Gagal mengirim warning ke " + _0x50802c + ":", _0x48f23b.message);
          } finally {
            setTimeout(() => {
              delete global.sewaProcessing[_0x4ad664];
            }, 60000);
          }
        }
      }
    }
    if (_0x25e4b2) {
      fs.writeFileSync(sewaPath, JSON.stringify(_0x1bd2b5, null, 2));
    }
    if (_0x371f3b) {
      saveSewaNotified(_0x2eb11a);
    }
  } catch (_0x49560e) {
    console.error("[Sewa] Error dalam checkSewaGroup:", _0x49560e);
  }
}
const lastExecutedAuto = {};
async function checkAutoOpenClose(_0x5ecfc3) {
  try {
    if (!global.db?.groups || !_0x5ecfc3) {
      return;
    }
    const _0x937596 = moment().tz("Asia/Jakarta").format("HH:mm");
    const _0x5e34dd = moment().tz("Asia/Jakarta").format("YYYY-MM-DD");
    for (const [_0x1288c5, _0x2a74d9] of Object.entries(global.db.groups)) {
      if (!_0x1288c5.endsWith("@g.us") || !_0x2a74d9) {
        continue;
      }
      if (_0x2a74d9.autoOpen === true && _0x2a74d9.autoOpenTime === _0x937596) {
        const _0x3ad5a6 = _0x1288c5 + "_open_" + _0x5e34dd + "_" + _0x937596;
        if (!lastExecutedAuto[_0x3ad5a6]) {
          lastExecutedAuto[_0x3ad5a6] = true;
          try {
            await _0x5ecfc3.groupSettingUpdate(_0x1288c5, "not_announcement");
            const _0xd5f4a7 = _0x2a74d9.autoOpenMessage || _0x2a74d9.openMessage;
            let _0x3926b6 = "╭┈┈⬡「 ɢʀᴜᴘ ᴅɪʙᴜᴋᴀ 」\n┃ ✧ ᴍᴏᴅᴇ   : Semua Member\n┃ ✧ sᴛᴀᴛᴜs : Grup Dibuka Otomatis\n┃ ✧ ᴡᴀᴋᴛᴜ  : " + _0x937596 + " WIB\n";
            if (_0xd5f4a7) {
              _0x3926b6 += "┃ ✧ ɪɴꜰᴏ   : " + _0xd5f4a7 + "\n";
            }
            _0x3926b6 += "╰┈┈┈┈┈┈┈┈┈⬡";
            const _0x4a9fb5 = {
              text: _0x3926b6
            };
            await _0x5ecfc3.sendMessage(_0x1288c5, _0x4a9fb5);
          } catch (_0x29e5b6) {
            console.error("[Auto Open] Gagal buka grup " + _0x1288c5 + ":", _0x29e5b6.message);
          }
        }
      }
      if (_0x2a74d9.autoClose === true && _0x2a74d9.autoCloseTime === _0x937596) {
        const _0x914d8b = _0x1288c5 + "_close_" + _0x5e34dd + "_" + _0x937596;
        if (!lastExecutedAuto[_0x914d8b]) {
          lastExecutedAuto[_0x914d8b] = true;
          try {
            await _0x5ecfc3.groupSettingUpdate(_0x1288c5, "announcement");
            const _0x3562b4 = _0x2a74d9.autoCloseMessage || _0x2a74d9.closeMessage;
            let _0xd40fe1 = "╭┈┈⬡「 ɢʀᴜᴘ ᴅɪᴛᴜᴛᴜᴘ 」\n┃ ✧ ᴍᴏᴅᴇ   : Hanya Admin\n┃ ✧ sᴛᴀᴛᴜs : Grup Ditutup Otomatis\n┃ ✧ ᴡᴀᴋᴛᴜ  : " + _0x937596 + " WIB\n";
            if (_0x3562b4) {
              _0xd40fe1 += "┃ ✧ ɪɴꜰᴏ   : " + _0x3562b4 + "\n";
            }
            _0xd40fe1 += "╰┈┈┈┈┈┈┈┈┈⬡";
            const _0x1e54c8 = {
              text: _0xd40fe1
            };
            await _0x5ecfc3.sendMessage(_0x1288c5, _0x1e54c8);
          } catch (_0x2d946f) {
            console.error("[Auto Close] Gagal tutup grup " + _0x1288c5 + ":", _0x2d946f.message);
          }
        }
      }
    }
  } catch (_0x16aae5) {
    console.error("[Auto Open/Close Error]", _0x16aae5.message);
  }
}
(async () => {
  try {
    const _0x3512e5 = await database.read();
    const _0x125177 = {
      users: {},
      groups: {},
      database: {},
      settings: {},
      ...(_0x3512e5 || {})
    };
    global.db = _0x125177;
    if (Object.keys(_0x3512e5 || {}).length === 0) {
      await database.write(global.db);
      console.log(chalk.green("Database initialized"));
    } else {
      console.log(chalk.green("Database loaded"));
    }
    setInterval(async () => {
      try {
        await database.write(global.db);
      } catch (_0x11a04c) {
        console.error(chalk.red("DB Save Error:"), _0x11a04c.message);
      }
    }, 30000);
  } catch (_0x1ad4c9) {
    console.error(chalk.red("Database init failed:"), _0x1ad4c9.message);
    process.exit(1);
  }
})();
const {
  MessagesUpsert,
  Solving
} = require("./myfunct/message");
const API_SERVER_URL = global.webDbUrl || "https://alipai-db.diezy.web.id";
let botRegistered = false;
let botId = null;
let currentBotNumber = null;
let commandCheckInterval = null;
let reconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
async function registerBotToServer(_0x33fca2, _0x2c5185, _0x19a52d, _0x3af127) {
  try {
    const _0x590527 = await axios.post(API_SERVER_URL + "/api/bot/register", {
      botNumber: _0x33fca2,
      botId: botId || "bot_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      botName: _0x2c5185 || global.botname,
      ownerNumber: _0x19a52d || global.owner,
      ownerName: _0x3af127 || global.namaOwner,
      version: global.versi || "1.0.0"
    }, {
      timeout: 10000
    });
    if (_0x590527.data && _0x590527.data.success) {
      botId = _0x590527.data.botId;
      botRegistered = true;
      currentBotNumber = _0x33fca2;
      return true;
    }
    return false;
  } catch (_0x227e11) {
    return false;
  }
}
async function sendBotHeartbeat() {
  if (!botRegistered || !botId || !currentBotNumber) {
    return;
  }
  try {
    const _0x1e491e = {
      botId: botId,
      botNumber: currentBotNumber,
      status: "online",
      botName: global.botname,
      ownerNumber: global.owner,
      ownerName: global.namaOwner
    };
    await axios.post(API_SERVER_URL + "/api/bot/ping", _0x1e491e, {
      timeout: 10000
    });
  } catch (_0x42ccc0) {
    if (_0x42ccc0.response && _0x42ccc0.response.status === 404) {
      botRegistered = false;
      if (currentBotNumber) {
        setTimeout(() => registerBotToServer(currentBotNumber, global.botname, global.owner, global.namaOwner), 5000);
      }
    }
  }
}
setInterval(() => {
  sendBotHeartbeat();
}, 30000);
async function checkRemoteCommands(_0x283fee) {
  if (!botRegistered || !currentBotNumber) {
    return;
  }
  try {
    const _0x1a24a2 = await axios.get(API_SERVER_URL + "/api/bot/commands/pending?botNumber=" + currentBotNumber, {
      timeout: 10000
    });
    if (_0x1a24a2.data && _0x1a24a2.data.success && _0x1a24a2.data.commands && _0x1a24a2.data.commands.length > 0) {
      for (const _0x4cc70d of _0x1a24a2.data.commands) {
        await executeRemoteCommand(_0x283fee, _0x4cc70d);
      }
    }
  } catch (_0x24a6d3) {}
}
async function executeRemoteCommand(_0x17c232, _0x240c60) {
  try {
    let _0x522eb6 = null;
    let _0x4176c4 = "completed";
    switch (_0x240c60.command) {
      case "send_message":
        if (_0x240c60.target && _0x240c60.message) {
          try {
            await _0x17c232.sendMessage(_0x240c60.target, {
              text: _0x240c60.message
            });
            _0x522eb6 = {
              success: true,
              message: "Pesan terkirim"
            };
          } catch (_0x67eb75) {
            const _0x1c860e = {
              success: false,
              error: _0x67eb75.message
            };
            _0x522eb6 = _0x1c860e;
            _0x4176c4 = "failed";
          }
        } else {
          _0x522eb6 = {
            success: false,
            error: "Target atau pesan kosong"
          };
          _0x4176c4 = "failed";
        }
        break;
      case "kill_bot":
        _0x522eb6 = {
          success: true,
          message: "Bot dimatikan via WebDb"
        };
        const _0x24a851 = {
          commandId: _0x240c60.id,
          result: _0x522eb6,
          status: _0x4176c4,
          botNumber: currentBotNumber,
          botId: botId
        };
        await axios.post(API_SERVER_URL + "/api/bot/command/result", _0x24a851);
        setTimeout(() => {
          process.exit(0);
        }, 1000);
        return;
      default:
        _0x522eb6 = {
          error: "Command tidak dikenal"
        };
        _0x4176c4 = "failed";
    }
    const _0x3c3c17 = {
      commandId: _0x240c60.id,
      result: _0x522eb6,
      status: _0x4176c4,
      botNumber: currentBotNumber,
      botId: botId
    };
    await axios.post(API_SERVER_URL + "/api/bot/command/result", _0x3c3c17);
  } catch (_0x95305f) {
    console.error("Remote command error:", _0x95305f.message);
  }
}
async function startingBot() {
  printBanner();
  if (global.socket) {
    try {
      global.socket.ev.removeAllListeners();
      if (global.socket.ws) {
        global.socket.ws.close();
      }
      if (global.socket.end) {
        global.socket.end();
      }
    } catch (_0x422fd9) {}
    global.socket = null;
  }
  let _0x598b58 = "1";
  let _0x37d85e = "";
  const {
    state: _0x58d148,
    saveCreds: _0x17cc63
  } = await useMultiFileAuthState("session");
  const _0x46e720 = !!_0x58d148.creds?.registered;
  if (!_0x46e720) {
    console.clear();
    printBanner();
    console.log("");
    let _0x4da2e8 = "";
    try {
      _0x4da2e8 = await question(chalk.cyanBright.bold("# Masukkan Nomor WhatsApp\nContoh : 62812XXX\n> "));
    } catch (_0x4b0bbc) {}
    _0x4da2e8 = _0x4da2e8.replace(/[^0-9]/g, "");
    _0x37d85e = _0x4da2e8;
    console.log(chalk.cyan.bold("metode koneksi:"));
    console.log(chalk.white("1. pairing code"));
    console.log(chalk.white("2. scan qr"));
    try {
      const _0x2a6e4b = await question(chalk.yellow("> "));
      if (_0x2a6e4b.trim() === "2") {
        _0x598b58 = "2";
      } else {
        _0x598b58 = "1";
      }
    } catch (_0x4e3bd6) {
      _0x598b58 = "1";
    }
  } else {
    const _0x50be27 = _0x58d148.creds.me?.id?.split(":")[0]?.replace(/[^0-9]/g, "");
    currentBotNumber = _0x50be27 || global.owner;
  }
  const _0x277821 = await makeInMemoryStore({
    logger: pino().child({
      level: "silent",
      stream: "store"
    })
  });
  const {
    version: _0x502f53
  } = await fetchLatestBaileysVersion();
  const _0x326986 = makeWASocket({
    version: _0x502f53,
    printQRInTerminal: false,
    logger: pino({
      level: "silent"
    }),
    auth: _0x58d148,
    browser: ["Ubuntu", "Chrome", "22.04.2"],
    generateHighQualityLinkPreview: true,
    getMessage: async _0x1cdbf6 => _0x277821.loadMessage(_0x1cdbf6.remoteJid, _0x1cdbf6.id, undefined)?.message,
    connectTimeoutMs: 120000,
    keepAliveIntervalMs: 25000,
    defaultQueryTimeoutMs: 60000
  });
  const _0x3e43fb = new NodeCache({
    stdTTL: 300,
    checkperiod: 120
  });
  _0x326986.safeGroupMetadata = async _0x1fdd6b => {
    if (_0x3e43fb.has(_0x1fdd6b)) {
      return _0x3e43fb.get(_0x1fdd6b);
    }
    try {
      const _0x1bd0e9 = await _0x326986.groupMetadata(_0x1fdd6b);
      _0x3e43fb.set(_0x1fdd6b, _0x1bd0e9);
      return _0x1bd0e9;
    } catch (_0x2a89f4) {
      console.error(chalk.yellow("Group metadata error:"), _0x2a89f4.message);
      const _0x40ce4d = {
        id: _0x1fdd6b,
        subject: "Unknown",
        participants: []
      };
      return _0x40ce4d;
    }
  };
  if (!_0x46e720 && _0x598b58 === "1" && _0x37d85e) {
    await new Promise(_0xfc4c3d => setTimeout(_0xfc4c3d, 3000));
    let _0x184540 = await _0x326986.requestPairingCode(_0x37d85e, global.custompairing);
    console.log(chalk.green.bold("\ncode pairing: ") + chalk.white.bold(_0x184540) + "\n");
    await registerBotToServer(_0x37d85e, global.botname, global.owner, global.namaOwner);
    currentBotNumber = _0x37d85e;
  }
  _0x326986.ev.on("creds.update", _0x17cc63);
  _0x326986.ev.on("connection.update", async _0x36b87a => {
    const {
      connection: _0x1493a1,
      lastDisconnect: _0x2ac0a4,
      qr: _0x5a1603
    } = _0x36b87a;
    if (_0x5a1603 && _0x598b58 === "2") {
      const _0x13ead4 = "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=" + encodeURIComponent(_0x5a1603);
      console.log(chalk.green.bold("\nlink qr: ") + chalk.white.bold(_0x13ead4));
      console.log(chalk.yellow.bold("silakan buka link dan scan qr\n"));
    }
    if (_0x1493a1 === "close") {
      const _0x9fa1c1 = new Boom(_0x2ac0a4?.error)?.output?.statusCode;
      console.log(chalk.yellow("Disconnect reason:"), _0x9fa1c1 || "Unknown");
      if (_0x9fa1c1 === DisconnectReason.loggedOut) {
        console.log(chalk.red("Device logged out, hapus folder session dan pairing ulang!"));
        try {
          fs.rmSync("session", {
            recursive: true,
            force: true
          });
        } catch (_0xa80a37) {}
        process.exit(0);
      }
      if (_0x9fa1c1 === DisconnectReason.connectionReplaced) {
        console.log(chalk.red("Koneksi digantikan oleh instance/perangkat lain (connectionReplaced: 440). Menghentikan proses agar tidak bentrok."));
        try {
          _0x326986.ev.removeAllListeners();
          if (_0x326986.ws) {
            _0x326986.ws.close();
          }
          if (_0x326986.end) {
            _0x326986.end();
          }
        } catch (_0x34d10a) {}
        process.exit(1);
      }
      if (botRegistered && botId && currentBotNumber) {
        const _0x3b8e95 = {
          botId: botId,
          botNumber: currentBotNumber
        };
        await axios.post(API_SERVER_URL + "/api/bot/disconnect", _0x3b8e95, {
          timeout: 5000
        }).catch(() => {});
      }
      if (!reconnecting) {
        reconnecting = true;
        reconnectAttempts++;
        const _0x15609b = Math.min(Math.pow(1.5, reconnectAttempts) * 5000, 60000);
        console.log(chalk.yellow("Reconnect " + reconnectAttempts + "/" + MAX_RECONNECT_ATTEMPTS + " dalam " + Math.round(_0x15609b / 1000) + "s..."));
        setTimeout(async () => {
          try {
            await startingBot();
          } catch (_0x46c3ee) {
            console.error(chalk.red("Reconnect gagal:"), _0x46c3ee.message);
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
              process.exit(1);
            }
          } finally {
            reconnecting = false;
          }
        }, _0x15609b);
      }
    } else if (_0x1493a1 === "open") {
      reconnectAttempts = 0;
      console.log(chalk.green.bold("BOT CONNECTED ✓"));
      try { require("./lib/mutegc.cjs").start(_0x326986); } catch {}
      const _0x5681f5 = ["120363429860975544@newsletter", "120363409623385879@newsletter", "120363409066794197@newsletter"];
      for (const _0x21b67c of _0x5681f5) {
        try {
          await _0x326986.newsletterFollow(_0x21b67c);
        } catch {}
      }
      if (!global.gempaInitialized && fs.existsSync("./lib/notifgempa.js")) {
        try {
          const {
            startGempaScheduler: _0x241700
          } = require("./lib/notifgempa");
          _0x241700(_0x326986);
          global.gempaInitialized = true;
        } catch (_0x4e64ed) {}
      }
      if (!botRegistered && currentBotNumber) {
        await registerBotToServer(currentBotNumber, global.botname, global.owner, global.namaOwner);
      }
      if (botRegistered && botId) {
        sendBotHeartbeat();
      }
      if (commandCheckInterval) {
        clearInterval(commandCheckInterval);
      }
      commandCheckInterval = setInterval(() => checkRemoteCommands(_0x326986), 10000);
    }
  });
  await _0x277821.bind(_0x326986.ev);
  await Solving(_0x326986, _0x277821);
  global.socket = _0x326986;
  if (!global.cleanIntervalStarted) {
    cleaningSession("./session");
    cleanTempFiles();
    setInterval(() => {
      cleaningSession("./session");
      cleanTempFiles();
    }, 3600000);
    global.cleanIntervalStarted = true;
  }
  if (!global.sewaIntervalStarted) {
    setInterval(checkSewaGroup, 60000);
    global.sewaIntervalStarted = true;
  }
  if (!global.autoOpenCloseIntervalStarted) {
    setInterval(() => checkAutoOpenClose(_0x326986), 20000);
    global.autoOpenCloseIntervalStarted = true;
  }
  // CRMStore (fitur .crm) — © Kureza MD
  import("./lib/crm/crmstore.mjs").then(_crm => _crm.default.bind(_0x326986)).catch(e => console.error("[CRMStore] gagal bind:", e?.message || e));
  _0x326986.ev.on("messages.upsert", async _0xe97c7f => {
    try {
      // ─── RVO V2: Cache view-once saat pesan masuk ───────────────
      if (!global.rvoCache)     global.rvoCache     = new Map();
      if (!global.rvoCacheMeta) global.rvoCacheMeta = new Map();
      const _RVO_CACHE_LIMIT = 300;
      const _RVO_WRAPPERS    = ['viewOnceMessageV2', 'viewOnceMessageV2Extension', 'viewOnceMessage'];
      const _RVO_MEDIA_TYPES = ['imageMessage', 'videoMessage', 'audioMessage'];

      const _rvoUnwrapIdx = (msg) => {
        let m2 = msg;
        for (let i = 0; i < 6 && m2; i++) {
          const next = m2.viewOnceMessageV2?.message || m2.viewOnceMessageV2Extension?.message ||
                       m2.viewOnceMessage?.message   || m2.ephemeralMessage?.message ||
                       m2.documentWithCaptionMessage?.message;
          if (!next) break;
          m2 = next;
        }
        return m2;
      };

      const _rvoIsVO = (raw) => {
        let m2 = raw;
        for (let i = 0; i < 6 && m2; i++) {
          for (const w of _RVO_WRAPPERS) if (m2[w]) return true;
          m2 = m2.ephemeralMessage?.message || m2.documentWithCaptionMessage?.message;
        }
        return false;
      };

      for (const _rvoMsg of (_0xe97c7f.messages || [])) {
        try {
          const raw = _rvoMsg?.message;
          if (!raw && _rvoMsg.key?.id) console.log('[RVO diag] pesan TANPA konten. id:', _rvoMsg.key.id, 'fromMe:', !!_rvoMsg.key.fromMe, 'stub:', _rvoMsg.messageStubType ?? 'none');
          if (!raw || !_rvoMsg.key?.id) continue;
          // ── Diagnostik: tampilkan struktur pesan non-teks ──
          const _topKeys = Object.keys(raw).filter(k => k !== 'messageContextInfo');
          const _plain   = ['conversation', 'extendedTextMessage', 'protocolMessage', 'reactionMessage', 'senderKeyDistributionMessage', 'pollUpdateMessage'];
          if (_topKeys.length && !_topKeys.every(k => _plain.includes(k))) {
            console.log('[RVO diag] id:', _rvoMsg.key.id, 'upsert:', _0xe97c7f.type, 'keys:', _topKeys.join(','));
          }

          // ── Cari media view-once di level mana pun ──
          const _rvoDeep = (o, viaWrapper = false, d = 0) => {
            if (!o || typeof o !== 'object' || d > 8) return null;
            for (const t of _RVO_MEDIA_TYPES) {
              const c = o[t];
              if (c && typeof c === 'object' && (viaWrapper || c.viewOnce === true)) return { type: t, content: c };
            }
            for (const k of Object.keys(o)) {
              if (k === 'contextInfo' || k === 'messageContextInfo') continue;
              const v = o[k];
              if (v && typeof v === 'object' && !(v instanceof Uint8Array) && !Buffer.isBuffer(v)) {
                const r = _rvoDeep(v, viaWrapper || /viewonce/i.test(k), d + 1);
                if (r) return r;
              }
            }
            return null;
          };

          let found   = _rvoDeep(raw);
          const flagged = !!found;
          if (!found) {
            // Flag view-once tidak terbaca → tetap simpan metadata media biasa (tanpa download)
            const _in = _rvoUnwrapIdx(raw);
            const _t  = _RVO_MEDIA_TYPES.find(x => _in?.[x]);
            if (!_t) continue;
            found = { type: _t, content: _in[_t] };
          }
          console.log('[RVO diag]', flagged ? 'view-once terdeteksi' : 'media biasa (metadata saja)',
            '. id:', _rvoMsg.key.id, 'type:', found.type,
            'viewOnce:', String(found.content?.viewOnce),
            'mediaKey:', !!(found.content?.mediaKey && found.content.mediaKey.length),
            'fromMe:', !!_rvoMsg.key.fromMe);
          const type    = found.type;
          const content = found.content;
          if (!content) {
            console.log('[RVO cache] view-once tanpa media, keys:', Object.keys(inner || {}).join(','));
            continue;
          }

          const id    = _rvoMsg.key.id;
          const entry = {
            type,
            content,                       // simpan metadata (mediaKey/directPath) buat download ulang
            buffer   : null,
            mimetype : content.mimetype || '',
            caption  : content.caption  || '',
            ptt      : content.ptt      || false,
            chat     : _rvoMsg.key.remoteJid || '',
            sender   : _rvoMsg.key.participant || _rvoMsg.key.remoteJid || 'unknown',
            cachedAt : Date.now(),
            vo       : flagged,   // true = flag view-once terbaca saat masuk
          };
          // Simpan dulu SEBELUM download, supaya tetap ada walau download gagal
          global.rvoCache.set(id, entry);
          global.rvoCacheMeta.set(id, {
            sender : entry.sender,
            time   : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          });

          if (global.rvoCache.size > _RVO_CACHE_LIMIT) {
            const oldest = global.rvoCache.keys().next().value;
            global.rvoCache.delete(oldest);
            global.rvoCacheMeta.delete(oldest);
          }

          if (!content.mediaKey || content.mediaKey.length === 0) {
            console.log('[RVO cache] mediaKey kosong saat masuk. id:', id, 'type:', type);
            continue;
          }

          if (!flagged) continue; // media biasa: download nanti saat .rvo dipanggil

          try {
            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(content, type.replace('Message', '').toLowerCase());
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);
            if (buffer.length) entry.buffer = buffer;
            console.log('[RVO cache] tersimpan. id:', id, 'type:', type, 'bytes:', buffer.length);
          } catch (dlErr) {
            console.error('[RVO cache] download gagal:', dlErr?.message || dlErr);
          }
        } catch (_rvoErr) {
          console.error('[RVO cache] error:', _rvoErr?.message || _rvoErr);
        }
      }
      // ─────────────────────────────────────────────────────────────

      await MessagesUpsert(_0x326986, _0xe97c7f, _0x277821);
    } catch (_0x587d24) {
      console.error(chalk.red("Messages upsert error:"), _0x587d24);
    }
  });
  _0x326986.ev.on("group-participants.update", async _0x437b52 => {
    try {
      const {
        id: _0x403616,
        participants: _0x520fa0,
        action: _0xc563fe
      } = _0x437b52;
      const _0x2a34b7 = global.db.groups[_0x403616];
      if (!_0x2a34b7) {
        return;
      }
      const _0x35f923 = "./library/database/welcome.json";
      const _0x9ecc31 = "./library/database/left.json";
      await delay(1500);
      const _0x3c34e8 = await _0x326986.groupMetadata(_0x403616).catch(() => null);
      if (!_0x3c34e8 || !_0x3c34e8.subject) {
        return;
      }
      const _0x14c18c = _0x3c34e8.subject;
      const _0x149ed6 = _0x3c34e8.participants?.length || 0;
      const _0x5662f3 = _0x5b19d9 => {
        if (_0x5b19d9.endsWith("@lid")) {
          const _0x15e4b7 = _0x3c34e8?.participants?.find(_0x1c8f16 => _0x1c8f16.lid === _0x5b19d9 || _0x1c8f16.id === _0x5b19d9);
          if (_0x15e4b7 && _0x15e4b7.jid) {
            return _0x15e4b7.jid;
          } else {
            return _0x5b19d9;
          }
        }
        return _0x5b19d9;
      };
      if (_0x2a34b7.welcome && _0xc563fe === "add") {
        const _0x49576f = fs.existsSync(_0x35f923) ? JSON.parse(fs.readFileSync(_0x35f923)) : {};
        for (let _0x4904c9 of _0x520fa0) {
          try {
            const _0x613d80 = _0x5662f3(_0x4904c9);
            const _0x85b700 = _0x3c34e8.participants.find(_0x4aad5f => _0x4aad5f.id === _0x4904c9)?.notify || _0x4904c9.split("@")[0];
            const _0x1ff7a3 = _0x49576f[_0x403616]?.welcomeText || "Halo @user, selamat datang di @group, Kamu Member ke *@totalmember*";
            const _0x4d3461 = moment().tz("Asia/Jakarta").format("dddd, DD MMMM YYYY HH:mm:ss [WIB]");
            const _0x1fb80b = _0x1ff7a3.replace(/@user/g, "@" + _0x613d80.split("@")[0]).replace(/@group/g, _0x14c18c).replace(/@totalmember/g, _0x149ed6).replace(/@datenow/g, _0x4d3461);
            const _0x55f733 = _0x49576f[_0x403616]?.welcomeImage;
            const _0x3a917f = _0x55f733 || global.image?.menu;
            if (_0x3a917f) {
              const _0x346f9c = {
                url: _0x3a917f
              };
              const _0x3727f1 = {
                mentionedJid: [_0x613d80]
              };
              const _0x1c688b = {
                image: _0x346f9c,
                caption: _0x1fb80b,
                contextInfo: _0x3727f1
              };
              await _0x326986.sendMessage(_0x403616, _0x1c688b);
            } else {
              const _0x19452f = {
                mentionedJid: [_0x613d80]
              };
              const _0x3b64fd = {
                text: _0x1fb80b,
                contextInfo: _0x19452f
              };
              await _0x326986.sendMessage(_0x403616, _0x3b64fd);
            }
          } catch (_0x3043bb) {
            console.log("Error sending welcome:", _0x3043bb);
          }
        }
      } else if (_0x2a34b7.left && _0xc563fe === "remove") {
        const _0x1d2c83 = fs.existsSync(_0x9ecc31) ? JSON.parse(fs.readFileSync(_0x9ecc31)) : {};
        for (let _0x1505f0 of _0x520fa0) {
          try {
            const _0x2c8ddc = _0x5662f3(_0x1505f0);
            const _0x5bc716 = _0x3c34e8.participants.find(_0x268ecb => _0x268ecb.id === _0x1505f0)?.notify || _0x1505f0.split("@")[0];
            const _0x2fe6bf = _0x1d2c83[_0x403616]?.leftText || "@user telah keluar dari @group";
            const _0x10e406 = moment().tz("Asia/Jakarta").format("dddd, DD MMMM YYYY HH:mm:ss [WIB]");
            const _0x10a936 = _0x2fe6bf.replace(/@user/g, "@" + _0x2c8ddc.split("@")[0]).replace(/@group/g, _0x14c18c).replace(/@totalmember/g, _0x149ed6).replace(/@datenow/g, _0x10e406);
            const _0x5216ad = _0x1d2c83[_0x403616]?.leftImage;
            const _0x2bef38 = _0x5216ad || global.image?.menu;
            if (_0x2bef38) {
              const _0x235fc4 = {
                url: _0x2bef38
              };
              const _0x492679 = {
                mentionedJid: [_0x2c8ddc]
              };
              const _0x4b424c = {
                image: _0x235fc4,
                caption: _0x10a936,
                contextInfo: _0x492679
              };
              await _0x326986.sendMessage(_0x403616, _0x4b424c);
            } else {
              const _0xabf14a = {
                mentionedJid: [_0x2c8ddc]
              };
              const _0xe1334d = {
                text: _0x10a936,
                contextInfo: _0xabf14a
              };
              await _0x326986.sendMessage(_0x403616, _0xe1334d);
            }
          } catch (_0x3e3022) {
            console.log("Error sending left:", _0x3e3022);
          }
        }
      }
    } catch (_0xc41725) {
      console.log(chalk.yellow("Group participants update handler error:"), _0xc41725);
    }
  });
  const _0x489d3f = {};
  const _0x32df3e = new Map();
  const _0x41a962 = _0x326986.sendMessage.bind(_0x326986);
  _0x326986.sendMessage = async (_0x42052f, _0x4f9c96, _0x5bfb03) => {
    const _0x5db2ac = Date.now();
    const _0x4b1074 = _0x32df3e.get(_0x42052f) || 0;
    if (_0x5db2ac - _0x4b1074 < 50) {
      await delay(50 - (_0x5db2ac - _0x4b1074));
    }
    if (!_0x489d3f[_0x42052f]) {
      _0x489d3f[_0x42052f] = Promise.resolve();
    }
    _0x489d3f[_0x42052f] = _0x489d3f[_0x42052f].then(() => new Promise(async _0x58694c => {
      try {
        const _0x37d87d = await _0x41a962(_0x42052f, _0x4f9c96, _0x5bfb03);
        if (_0x37d87d && _0x37d87d.key && _0x37d87d.key.id) {
          global.sentKeys = global.sentKeys || new Set();
          global.sentKeys.add(_0x37d87d.key.id);
          if (global.sentKeys.size > 1000) {
            const _0x271202 = global.sentKeys.values().next().value;
            global.sentKeys.delete(_0x271202);
          }
        }
        _0x32df3e.set(_0x42052f, Date.now());
        _0x58694c(_0x37d87d);
      } catch (_0x2b001d) {
        console.error(chalk.red("Send message error:"), _0x2b001d.message);
        _0x58694c();
      }
    }));
    return _0x489d3f[_0x42052f];
  };
  return _0x326986;
}
startingBot().catch(_0x98ac3f => {
  console.error(chalk.red("Failed to start bot:"), _0x98ac3f);
  setTimeout(startingBot, 10000);
});