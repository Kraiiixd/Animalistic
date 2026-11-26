/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

/*
 * Menyimpan pilihan gaya tampilan untuk Reply() (v1-v5).
 */

const fs = require('fs');
const path = require('path');

const REPLY_STYLE_PATH = path.join(__dirname, '..', 'library', 'database', 'reply_style.json');
const VALID_STYLES = ['v1', 'v2', 'v3', 'v4', 'v5'];
const DEFAULT_STYLE = 'v1';

function ensureFile() {
    try {
        const dir = path.dirname(REPLY_STYLE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(REPLY_STYLE_PATH)) {
            fs.writeFileSync(REPLY_STYLE_PATH, JSON.stringify({ globalVersion: DEFAULT_STYLE }, null, 2));
        }
    } catch (e) {}
}

function loadReplyStyle() {
    ensureFile();
    try {
        return JSON.parse(fs.readFileSync(REPLY_STYLE_PATH));
    } catch (e) {
        return { globalVersion: DEFAULT_STYLE };
    }
}

function saveReplyStyle(data) {
    ensureFile();
    try {
        fs.writeFileSync(REPLY_STYLE_PATH, JSON.stringify(data, null, 2));
    } catch (e) {}
}

function getReplyStyle() {
    const data = loadReplyStyle();
    return VALID_STYLES.includes(data.globalVersion) ? data.globalVersion : DEFAULT_STYLE;
}

function setReplyStyle(version) {
    if (!VALID_STYLES.includes(version)) {
        throw new Error(`Reply style tidak valid: ${version}. Pakai salah satu dari ${VALID_STYLES.join(', ')}.`);
    }
    const data = loadReplyStyle();
    data.globalVersion = version;
    saveReplyStyle(data);
    return getReplyStyle();
}

module.exports = { getReplyStyle, setReplyStyle, VALID_STYLES, DEFAULT_STYLE };
