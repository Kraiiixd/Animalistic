/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { generateAmPremiumCard } = require('./amNotifCard');

const statePath = path.join(__dirname, '../library/database/amnotifstate.json');

function loadState() {
    if (fs.existsSync(statePath)) {
        try {
            return JSON.parse(fs.readFileSync(statePath, 'utf8'));
        } catch (e) {
            return { lastId: 0 };
        }
    }
    return { lastId: 0 };
}

function saveState(state) {
    try {
        const dir = path.dirname(statePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('[AM NOTIF] Gagal simpan state:', e.message);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOpenConnection(diezy, maxWaitMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        const wsState = diezy?.ws?.socket?.readyState ?? diezy?.ws?.readyState;
        const isOpen = wsState === 1 || (wsState === undefined && !!diezy?.user);
        if (isOpen) return true;
        await sleep(500);
    }
    return false;
}

function isConnectionError(e) {
    const msg = String(e?.message || e || '').toLowerCase();
    return msg.includes('connection closed')
        || msg.includes('connection terminated')
        || msg.includes('timed out')
        || msg.includes('timeout')
        || msg.includes('econnreset')
        || msg.includes('socket closed');
}

async function sendWithRetry(diezy, jid, payload, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await waitForOpenConnection(diezy);
            await diezy.sendMessage(jid, payload);
            return true;
        } catch (e) {
            const lastAttempt = attempt === retries;
            const willRetry = isConnectionError(e) && !lastAttempt;
            console.error(
                `[AM NOTIF] Gagal kirim ke ${jid} (percobaan ${attempt}/${retries}): ${e.message}`
                + (willRetry ? ' -> retry...' : '')
            );
            if (e.stack) console.error(e.stack);
            if (!willRetry) return false;
            await sleep(attempt * 3000); 
        }
    }
    return false;
}

async function sendPremiumNotif(diezy, ev) {
    const channels = global.idSaluran ? [global.idSaluran] : [];

    if (!channels.length) {
        console.log(chalk.yellow('[AM NOTIF] global.idSaluran belum diset, notif dilewati.'));
        return;
    }

    let imageBuffer = null;
    try {
        imageBuffer = generateAmPremiumCard(ev);
    } catch (e) {
        console.error('[AM NOTIF] Gagal generate kartu:', e.message);
    }

    for (const jid of channels) {
        const payload = imageBuffer
            ? { image: imageBuffer, caption: ev.caption }
            : { text: ev.caption };

        const ok = await sendWithRetry(diezy, jid, payload, 1);

        if (ok) {
            console.log(chalk.green(`[AM NOTIF] Berhasil kirim notif ke ${jid}`));
        } else {
            console.error(chalk.red(`[AM NOTIF] Gagal kirim ke ${jid}.`));
        }
        await sleep(1500);
    }
}

function startAmNotifWatcher(diezy) {
    const intervalMs = global.amNotifIntervalMs || 30000;

    setInterval(async () => {
        const panelUrl = String(global.panelBaseUrl || '').replace(/\/+$/, '');
        const apiKey = global.apikeyNotifAm;
        if (!panelUrl || !apiKey) return; 

        const state = loadState();

        try {
            const res = await axios.get(`${panelUrl}/api/v1/alightmotion/notifications`, {
                params: { since: state.lastId || 0 },
                headers: { 'x-api-key': apiKey },
                timeout: 15000
            });

            const body = res.data;
            if (!body || body.success !== true) return;

            const events = Array.isArray(body.data) ? body.data : [];
            const sorted = [...events].sort((a, b) => (a.id || 0) - (b.id || 0));
            for (const ev of sorted) {
                if (!ev || typeof ev.id !== 'number' || ev.id <= (state.lastId || 0)) continue;
                await sendPremiumNotif(diezy, ev);
                state.lastId = Math.max(state.lastId || 0, ev.id);
                saveState(state);
            }

            if (typeof body.lastId === 'number' && body.lastId > (state.lastId || 0)) {
                state.lastId = body.lastId;
                saveState(state);
            }
        } catch (e) {
        }
    }, intervalMs);
}

module.exports = { startAmNotifWatcher };
