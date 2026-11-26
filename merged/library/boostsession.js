/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

function cleaningSession(direktori = './session') {
    if (!fs.existsSync(direktori)) return;

    fs.readdir(direktori, (err, files) => {
        if (err || !files) return;

        let count = 0;
        const now = Date.now();
        const maxAgeMs = 2 * 60 * 60 * 1000; // 2 jam

        files.forEach(file => {
            // Wajib lindungi creds.json
            if (file === 'creds.json' || file.includes('creds')) return;

            // Bersihkan file pre-key dan cache state lama
            if (file.startsWith('pre-key-') || file.startsWith('app-state-sync-') || file.startsWith('session-')) {
                const filePath = path.join(direktori, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (now - stats.mtimeMs > maxAgeMs) {
                        fs.unlinkSync(filePath);
                        count++;
                    }
                } catch (e) {}
            }
        });

        if (count > 0) {
            console.log(chalk.cyan.bold(`[AUTO CLEANER] Berhasil membersihkan ${count} file cache sesi lama.`));
        }
    });
}

function cleanTempFiles() {
    const tempDirs = ['./library/database/sampah', './tmp'];
    const now = Date.now();
    const maxAgeMs = 30 * 60 * 1000; // 30 menit

    tempDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.readdir(dir, (err, files) => {
                if (err || !files) return;
                files.forEach(file => {
                    const filePath = path.join(dir, file);
                    try {
                        const stats = fs.statSync(filePath);
                        if (now - stats.mtimeMs > maxAgeMs) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (e) {}
                });
            });
        }
    });
}

module.exports = { cleaningSession, cleanTempFiles };
