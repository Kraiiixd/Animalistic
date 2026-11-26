/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

/**
 * Plugin : installdeps v2 — Install yt-dlp / ffmpeg / npm (multi-strategy)
 * Lokasi : plugins/owner/installdeps.js
 * Akses  : Owner only
 *
 * Commands:
 *   .checkdeps           — cek status semua dep
 *   .installdeps         — auto install (root → system, user → user-local)
 *   .installytdlp        — install yt-dlp saja
 *   .installffmpeg       — install ffmpeg saja
 *   .updatedeps          — update yt-dlp ke versi terbaru
 *   .installscript       — generate shell script untuk copy-paste ke SSH
 *   .npm i <package>     — install npm package
 *   .npmlist             — lihat package yang terinstall
 */

'use strict';

const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const path = require('path');
const os = require('os');

function which(bin) {
    try {
        const r = require('child_process').execSync(`command -v ${bin} 2>/dev/null`, { stdio: 'pipe' });
        return r.length > 0;
    } catch { return false; }
}

function detectEnv() {
    const env = {
        isTermux: false,
        isDebian: false,
        isArch: false,
        isAlpine: false,
        isMac: false,
        isRoot: false,
        canSudo: false,
        hasSudo: false,
        hasApt: false,
        hasPkg: false,
        hasPip: false,
        hasPip3: false,
        hasNpm: false,
        hasCurl: false,
        hasWget: false,
        hasBash: false,
        username: process.env.USER || process.env.USERNAME || 'unknown',
        homeDir: os.homedir(),
        platform: process.platform,
        arch: process.arch
    };

    if (process.env.PREFIX && process.env.PREFIX.includes('com.termux')) env.isTermux = true;
    if (fs.existsSync('/data/data/com.termux/files/usr')) env.isTermux = true;

    if (process.platform === 'darwin') env.isMac = true;
    if (process.platform === 'linux') {
        if (fs.existsSync('/etc/debian_version')) env.isDebian = true;
        if (fs.existsSync('/etc/arch-release')) env.isArch = true;
        if (fs.existsSync('/etc/alpine-release')) env.isAlpine = true;
    }

    try {
        const uid = require('child_process').execSync('id -u', { stdio: 'pipe' }).toString().trim();
        env.isRoot = uid === '0';
    } catch {}

    env.hasSudo = which('sudo');
    env.hasApt = which('apt') || which('apt-get');
    env.hasPkg = which('pkg');
    env.hasPip = which('pip');
    env.hasPip3 = which('pip3');
    env.hasNpm = which('npm');
    env.hasCurl = which('curl');
    env.hasWget = which('wget');
    env.hasBash = which('bash');

    if (env.hasSudo && !env.isRoot) {
        try {
            require('child_process').execSync('sudo -n true 2>/dev/null', { stdio: 'pipe', timeout: 3000 });
            env.canSudo = true;
        } catch {
            env.canSudo = false;
        }
    }

    return env;
}

async function checkBinary(bin) {
    try {
        const { stdout } = await execAsync(`command -v ${bin} 2>/dev/null && ${bin} --version 2>&1 | head -1`, {
            timeout: 5000
        });
        return { installed: true, version: stdout.trim().split('\n').pop() || stdout.trim() };
    } catch {
        return { installed: false, version: null };
    }
}

async function checkAllDeps() {
    const [ytdlp, ffmpeg, node, npm] = await Promise.all([
        checkBinary('yt-dlp'),
        checkBinary('ffmpeg'),
        checkBinary('node'),
        checkBinary('npm')
    ]);

    const npmPkgs = ['yt-search', 'ytmusic-api', 'sharp', 'youtube-dl-exec'];
    const npmStatus = npmPkgs.map(p => {
        try {
            const pkg = require(`${p}/package.json`);
            return { name: p, installed: true, version: pkg.version };
        } catch {
            return { name: p, installed: false, version: null };
        }
    });

    return { ytdlp, ffmpeg, node, npm, npmStatus };
}

function runStream(cmd, { onData, cwd = process.cwd(), timeout = 300000, env: extraEnv = {} } = {}) {
    return new Promise((resolve, reject) => {
        const shell = process.platform === 'win32' ? 'cmd.exe' : (which('bash') ? 'bash' : 'sh');
        const args = shell === 'cmd.exe' ? ['/c', cmd] : ['-c', cmd];

        const proc = spawn(shell, args, {
            cwd,
            env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive', ...extraEnv }
        });

        let out = '';
        let errOut = '';
        let finished = false;

        const timer = setTimeout(() => {
            if (!finished) {
                try { proc.kill('SIGKILL'); } catch {}
                reject(new Error('Timeout — perintah terlalu lama'));
            }
        }, timeout);

        proc.stdout.on('data', d => {
            const s = d.toString();
            out += s;
            if (onData) s.split('\n').filter(l => l.trim()).forEach(line => onData(line, 'stdout'));
        });
        proc.stderr.on('data', d => {
            const s = d.toString();
            errOut += s;
            if (onData) s.split('\n').filter(l => l.trim()).forEach(line => onData(line, 'stderr'));
        });
        proc.on('error', err => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            reject(err);
        });
        proc.on('close', code => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            if (code === 0) resolve({ stdout: out, stderr: errOut });
            else reject(new Error(`Exit code ${code}: ${errOut.slice(-300) || out.slice(-300)}`));
        });
    });
}

async function installYtDlpUserLocal(env, log) {
    const localBin = path.join(env.homeDir, '.local', 'bin');
    try { fs.mkdirSync(localBin, { recursive: true }); } catch {}

    const target = path.join(localBin, 'yt-dlp');

    let downloadCmd;
    if (env.hasCurl) {
        downloadCmd = `curl -fsSL "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux" -o "${target}"`;
    } else if (env.hasWget) {
        downloadCmd = `wget -qO "${target}" "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux"`;
    } else {

        log('📥 Download via Node fetch...');
        const res = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux');
        if (!res.ok) throw new Error('Gagal download yt-dlp binary');
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(target, buf);
        downloadCmd = null;
    }

    if (downloadCmd) {
        log(`📥 Download yt-dlp ke ${target}...`);
        await runStream(downloadCmd, { timeout: 180000 });
    }

    await runStream(`chmod +x "${target}"`, { timeout: 10000 });

    if (!process.env.PATH.includes(localBin)) {
        process.env.PATH = `${localBin}:${process.env.PATH}`;
    }

    try {
        const ver = await runStream(`"${target}" --version`, { timeout: 15000 });
        log(`✅ yt-dlp terinstall (user-local): ${ver.stdout.trim()}`);
        return { ok: true, path: target };
    } catch (e) {
        throw new Error(`Binary tidak bisa dijalankan: ${e.message}`);
    }
}

async function installFfmpegUserLocal(env, log) {
    if (env.platform !== 'linux') {
        throw new Error('User-local ffmpeg hanya support Linux. Untuk OS lain pakai install system (root).');
    }

    const localBin = path.join(env.homeDir, '.local', 'bin');
    try { fs.mkdirSync(localBin, { recursive: true }); } catch {}

    const tmpDir = path.join(os.tmpdir(), `ffmpeg-install-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const tarball = path.join(tmpDir, 'ffmpeg.tar.xz');
    const url = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';

    log('📥 Download ffmpeg static build (~40 MB)...');
    log('⚠️ Ini butuh koneksi stabil, sabar ya...');

    try {

        if (env.hasCurl) {
            await runStream(`curl -fL "${url}" -o "${tarball}" --progress-bar 2>&1 | tail -1`, { timeout: 600000 });
        } else if (env.hasWget) {
            await runStream(`wget -q "${url}" -O "${tarball}"`, { timeout: 600000 });
        } else {
            log('📥 Download via Node fetch...');
            const res = await fetch(url);
            if (!res.ok) throw new Error('Download gagal');
            const buf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(tarball, buf);
        }

        if (!fs.existsSync(tarball) || fs.statSync(tarball).size < 1000000) {
            throw new Error('File download corrupt/kosong');
        }

        log('📦 Extract ffmpeg...');
        await runStream(`cd "${tmpDir}" && tar -xJf "${tarball}"`, { timeout: 120000 });

        const entries = fs.readdirSync(tmpDir).filter(f => f.startsWith('ffmpeg-') && fs.statSync(path.join(tmpDir, f)).isDirectory());
        if (!entries.length) throw new Error('Folder hasil extract tidak ditemukan');

        const srcDir = path.join(tmpDir, entries[0]);
        const ffmpegSrc = path.join(srcDir, 'ffmpeg');
        const ffprobeSrc = path.join(srcDir, 'ffprobe');

        if (!fs.existsSync(ffmpegSrc)) throw new Error('Binary ffmpeg tidak ada di archive');

        log('📦 Copy ffmpeg ke ~/.local/bin...');
        fs.copyFileSync(ffmpegSrc, path.join(localBin, 'ffmpeg'));
        try { fs.chmodSync(path.join(localBin, 'ffmpeg'), 0o755); } catch {}

        if (fs.existsSync(ffprobeSrc)) {
            fs.copyFileSync(ffprobeSrc, path.join(localBin, 'ffprobe'));
            try { fs.chmodSync(path.join(localBin, 'ffprobe'), 0o755); } catch {}
        }

        if (!process.env.PATH.includes(localBin)) {
            process.env.PATH = `${localBin}:${process.env.PATH}`;
        }

        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

        const ver = await runStream(`"${localBin}/ffmpeg" -version | head -1`, { timeout: 15000 });
        log(`✅ ffmpeg terinstall (user-local): ${ver.stdout.trim()}`);

        return { ok: true, path: path.join(localBin, 'ffmpeg') };

    } catch (e) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        throw e;
    }
}

async function installYtDlpSystem(env, log) {
    const steps = [];

    if (env.isTermux) {
        steps.push({ name: 'pkg install yt-dlp', cmd: 'pkg install -y yt-dlp' });
        steps.push({ name: 'pip install yt-dlp', cmd: 'pip install -U yt-dlp 2>&1 || python -m pip install -U yt-dlp 2>&1' });
    }
    if (env.isDebian && !env.isTermux) {
        const sudo = env.isRoot ? '' : 'sudo -n ';
        steps.push({ name: 'apt install yt-dlp', cmd: `${sudo}apt-get update -qq && ${sudo}apt-get install -y yt-dlp` });
        steps.push({ name: 'pip install yt-dlp', cmd: `${sudo}pip3 install -U yt-dlp 2>&1 || ${sudo}pip install -U yt-dlp 2>&1` });
    }
    if (env.isArch) {
        const sudo = env.isRoot ? '' : 'sudo -n ';
        steps.push({ name: 'pacman install yt-dlp', cmd: `${sudo}pacman -S --noconfirm yt-dlp` });
    }
    if (env.isAlpine) {
        steps.push({ name: 'apk add yt-dlp', cmd: 'apk add --no-cache yt-dlp' });
    }
    if (env.isMac) {
        steps.push({ name: 'brew install yt-dlp', cmd: 'brew install yt-dlp' });
    }

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        log(`📦 [${i + 1}/${steps.length}] ${step.name}...`);
        try {
            await runStream(step.cmd, { timeout: 300000 });
            const check = await checkBinary('yt-dlp');
            if (check.installed) { log(`✅ Sukses: ${check.version}`); return true; }
        } catch (err) {
            log(`❌ ${step.name}: ${String(err.message).slice(0, 150)}`);
        }
    }
    throw new Error('Semua metode system install gagal');
}

async function installFfmpegSystem(env, log) {
    const steps = [];

    if (env.isTermux) steps.push({ name: 'pkg install ffmpeg', cmd: 'pkg install -y ffmpeg' });
    if (env.isDebian && !env.isTermux) {
        const sudo = env.isRoot ? '' : 'sudo -n ';
        steps.push({ name: 'apt install ffmpeg', cmd: `${sudo}apt-get update -qq && ${sudo}apt-get install -y ffmpeg` });
    }
    if (env.isArch) {
        const sudo = env.isRoot ? '' : 'sudo -n ';
        steps.push({ name: 'pacman install ffmpeg', cmd: `${sudo}pacman -S --noconfirm ffmpeg` });
    }
    if (env.isAlpine) steps.push({ name: 'apk add ffmpeg', cmd: 'apk add --no-cache ffmpeg' });
    if (env.isMac) steps.push({ name: 'brew install ffmpeg', cmd: 'brew install ffmpeg' });

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        log(`📦 [${i + 1}/${steps.length}] ${step.name}...`);
        try {
            await runStream(step.cmd, { timeout: 600000 });
            const check = await checkBinary('ffmpeg');
            if (check.installed) { log(`✅ Sukses: ${check.version}`); return true; }
        } catch (err) {
            log(`❌ ${step.name}: ${String(err.message).slice(0, 150)}`);
        }
    }
    throw new Error('Semua metode system install gagal');
}

async function smartInstallYtDlp(env, log) {

    if (env.isRoot || env.canSudo) {
        log(`🔐 Mode: *System install* (${env.isRoot ? 'root' : 'sudo NOPASSWD'})`);
        try {
            await installYtDlpSystem(env, log);
            return true;
        } catch (e) {
            log(`⚠️ System install gagal: ${e.message.slice(0, 100)}`);
            log(`🔄 Fallback ke user-local install...`);
        }
    } else {
        log(`👤 Mode: *User-local install* (bukan root, install ke ~/.local/bin)`);
    }

    await installYtDlpUserLocal(env, log);
    return true;
}

async function smartInstallFfmpeg(env, log) {
    if (env.isRoot || env.canSudo) {
        log(`🔐 Mode: *System install*`);
        try {
            await installFfmpegSystem(env, log);
            return true;
        } catch (e) {
            log(`⚠️ System install gagal: ${e.message.slice(0, 100)}`);
            if (env.platform === 'linux') {
                log(`🔄 Fallback ke user-local install (static build ~40 MB)...`);
            } else {
                throw e;
            }
        }
    } else {
        log(`👤 Mode: *User-local install*`);
    }

    if (env.platform !== 'linux') {
        throw new Error('Tidak bisa install user-local di OS ini. Butuh sudo/root.');
    }

    await installFfmpegUserLocal(env, log);
    return true;
}

function generateInstallScript(env) {
    const sudoPrefix = env.isRoot ? '' : 'sudo ';

    if (env.isTermux) {
        return `#!/data/data/com.termux/files/usr/bin/bash
# Hitoshi MD — Auto Install Script (Termux)
# Copy-paste ke Termux:

pkg update -y
pkg install -y yt-dlp ffmpeg python nodejs

pip install -U yt-dlp

echo "✅ Selesai! Test dengan: yt-dlp --version && ffmpeg -version"
`;
    }

    if (env.isDebian) {
        return `#!/bin/bash
# Hitoshi MD — Auto Install Script (Debian/Ubuntu)
# Copy-paste ke SSH VPS:

set -e

echo "📦 Update apt..."
${sudoPrefix}apt-get update

echo "📦 Install yt-dlp + ffmpeg..."
${sudoPrefix}apt-get install -y yt-dlp ffmpeg python3-pip

echo "📦 Install yt-dlp (versi terbaru dari pip)..."
${sudoPrefix}pip3 install -U yt-dlp --break-system-packages 2>/dev/null || ${sudoPrefix}pip3 install -U yt-dlp

echo "✅ Selesai!"
echo "   yt-dlp version: $(yt-dlp --version)"
echo "   ffmpeg version: $(ffmpeg -version | head -1)"
`;
    }

    if (env.isArch) {
        return `#!/bin/bash
# Hitoshi MD — Auto Install Script (Arch)
${sudoPrefix}pacman -S --noconfirm yt-dlp ffmpeg python-pip
${sudoPrefix}pip install -U yt-dlp
echo "✅ Selesai!"
`;
    }

    if (env.isAlpine) {
        return `#!/bin/sh
# Hitoshi MD — Auto Install Script (Alpine)
apk add --no-cache yt-dlp ffmpeg python3 py3-pip
pip3 install -U yt-dlp
echo "✅ Selesai!"
`;
    }

    if (env.isMac) {
        return `#!/bin/bash
# Hitoshi MD — Auto Install Script (macOS)
brew install yt-dlp ffmpeg
echo "✅ Selesai!"
`;
    }

    return `#!/bin/bash
# Hitoshi MD — Auto Install Script (Generic)
# Deteksi otomatis & install yt-dlp + ffmpeg
# Copy-paste ke terminal VPS:

if command -v apt-get >/dev/null; then
    sudo apt-get update && sudo apt-get install -y yt-dlp ffmpeg
elif command -v pacman >/dev/null; then
    sudo pacman -S --noconfirm yt-dlp ffmpeg
elif command -v apk >/dev/null; then
    apk add --no-cache yt-dlp ffmpeg
elif command -v brew >/dev/null; then
    brew install yt-dlp ffmpeg
else
    echo "❌ Package manager tidak dikenali"
    exit 1
fi

pip3 install -U yt-dlp 2>/dev/null || pip install -U yt-dlp

echo "✅ Selesai!"
`;
}

const handler = async (m, {
    shorekeeper,
    Reply,
    text,
    prefix,
    command,
    isCreator
}) => {
    if (!isCreator) return Reply('❌ Fitur ini hanya untuk *Owner*!');

    const env = detectEnv();

    if (command === 'checkdeps') {
        await shorekeeper.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
        const deps = await checkAllDeps();

        const icon = (b) => b.installed ? '✅' : '❌';
        const ver = (b) => b.installed ? `_${b.version || 'installed'}_` : '—';

        let aksesInfo = '👤 User biasa';
        if (env.isRoot) aksesInfo = '🔐 Root';
        else if (env.canSudo) aksesInfo = '🔑 Sudo NOPASSWD';
        else if (env.hasSudo) aksesInfo = '⚠️ Sudo butuh password';

        let teks =
`╭─❏ *🔍 STATUS DEPENDENCIES*
│▣
│▣ *🖥️ Environment*
│▣ • Platform : \`${env.platform} ${env.arch}\`
│▣ • User     : \`${env.username}\`
│▣ • Akses    : ${aksesInfo}
│▣ • Termux   : ${env.isTermux ? '✅' : '❌'}
│▣ • Debian   : ${env.isDebian ? '✅' : '❌'}
│▣ • MacOS    : ${env.isMac ? '✅' : '❌'}
│▣
│▣ *🧰 System Binary*
│▣ ${icon(deps.ytdlp)} yt-dlp    : ${ver(deps.ytdlp)}
│▣ ${icon(deps.ffmpeg)} ffmpeg    : ${ver(deps.ffmpeg)}
│▣ ${icon(deps.node)} node      : ${ver(deps.node)}
│▣ ${icon(deps.npm)} npm       : ${ver(deps.npm)}
│▣
│▣ *📦 NPM Packages*
`;

        for (const p of deps.npmStatus) {
            teks += `│▣ ${p.installed ? '✅' : '❌'} ${p.name.padEnd(18)} : ${p.installed ? `_v${p.version}_` : '—'}\n`;
        }

        teks += `╰──────────❏\n\n`;
        teks += `📌 Install : \`${prefix}installdeps\`\n`;
        teks += `📌 Script manual : \`${prefix}installscript\``;

        return Reply(teks);
    }

    if (command === 'installscript') {
        const script = generateInstallScript(env);

        const tmpFile = path.join(os.tmpdir(), `diezy-install-${Date.now()}.sh`);
        fs.writeFileSync(tmpFile, script);

        try {
            await shorekeeper.sendMessage(m.chat, {
                document: fs.readFileSync(tmpFile),
                fileName: 'install-deps.sh',
                mimetype: 'text/x-shellscript',
                caption:
`╭─❏ *📜 INSTALL SCRIPT (Manual)*
│▣ Platform : \`${env.platform}\`
│▣ User     : \`${env.username}\` ${env.isRoot ? '(ROOT ✅)' : '(bukan root)'}
│▣
│▣ *Cara pakai:*
│▣ 1. Download file \`install-deps.sh\` di atas
│▣ 2. Upload ke VPS / copy isinya
│▣ 3. Jalankan:
│▣    \`bash install-deps.sh\`
│▣
│▣ *Atau copy-paste manual ke SSH:*
╰──────────❏

\`\`\`
${script}
\`\`\``
            });
        } catch (e) {
            await Reply(`❌ Gagal generate script: ${e.message}\n\nScript:\n\`\`\`\n${script}\n\`\`\``);
        } finally {
            try { fs.unlinkSync(tmpFile); } catch {}
        }
        return;
    }

    if (command === 'installdeps') {
        await shorekeeper.sendMessage(m.chat, { react: { text: '🚀', key: m.key } });

        let aksesInfo = '👤 User';
        if (env.isRoot) aksesInfo = '🔐 Root';
        else if (env.canSudo) aksesInfo = '🔑 Sudo NOPASSWD';
        else if (env.hasSudo) aksesInfo = '⚠️ Sudo (butuh pass)';

        const msg = await Reply(
`╭─❏ *🚀 INSTALL DEPENDENCIES*
│▣ Platform : \`${env.platform} ${env.arch}\`
│▣ Akses    : ${aksesInfo}
│▣ User     : \`${env.username}\`
│▣
│▣ Status : ⏳ Memulai...
╰──────────❏`);

        let logBuf = '';
        let lastSent = 0;
        let sending = false;

        const log = (line) => {
            logBuf += `\n${line}`;
            const now = Date.now();
            if (now - lastSent > 3500 && !sending) {
                sending = true;
                const cur = logBuf;
                logBuf = '';
                lastSent = now;
                shorekeeper.sendMessage(m.chat, {
                    text: `╭─❏ *🚀 INSTALL DEPS*\n│▣ Status : ⏳ Proses...\n╰──────────❏${cur}`,
                    edit: msg.key
                }).catch(() => {}).finally(() => { sending = false; });
            }
        };

        try {

            const ytdlpCheck = await checkBinary('yt-dlp');
            if (ytdlpCheck.installed) {
                log(`✅ yt-dlp sudah ada (${ytdlpCheck.version})`);
            } else {
                await smartInstallYtDlp(env, log);
            }

            const ffmpegCheck = await checkBinary('ffmpeg');
            if (ffmpegCheck.installed) {
                log(`✅ ffmpeg sudah ada (${ffmpegCheck.version})`);
            } else {
                await smartInstallFfmpeg(env, log);
            }

            log(`\n📦 Install npm packages...`);
            const npmPkgs = ['yt-search', 'ytmusic-api', 'sharp', 'youtube-dl-exec'];
            for (const pkg of npmPkgs) {
                try {
                    require.resolve(pkg);
                    log(`✅ ${pkg} — sudah ada`);
                } catch {
                    log(`📥 Install ${pkg}...`);
                    try {
                        await runStream(`npm install ${pkg} --no-audit --no-fund`, {
                            timeout: 300000
                        });
                        log(`✅ ${pkg} — OK`);
                    } catch (e) {
                        log(`⚠️ ${pkg} gagal: ${e.message.slice(0, 100)}`);
                    }
                }
            }

            const localBin = path.join(env.homeDir, '.local', 'bin');
            if (!process.env.PATH.includes(localBin)) {
                process.env.PATH = `${localBin}:${process.env.PATH}`;
            }

            const finalCheck = await checkAllDeps();
            log(`\n🎉 *SELESAI!*`);
            log(`> yt-dlp : ${finalCheck.ytdlp.installed ? '✅ ' + (finalCheck.ytdlp.version || '') : '❌'}`);
            log(`> ffmpeg : ${finalCheck.ffmpeg.installed ? '✅ ' + (finalCheck.ffmpeg.version || '') : '❌'}`);

            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            return Reply(
`╭─❏ *✅ INSTALL SELESAI*
│▣ yt-dlp  : ${finalCheck.ytdlp.installed ? '✅ ' + (finalCheck.ytdlp.version || '') : '❌ GAGAL'}
│▣ ffmpeg  : ${finalCheck.ffmpeg.installed ? '✅ ' + (finalCheck.ffmpeg.version || '') : '❌ GAGAL'}
│▣
│▣ Coba: \`${prefix}play2 another love\`
│▣
│▣ ⚠️ *Restart bot* dulu biar PATH baru kepakai:
│▣ \`${prefix}restart\`
╰──────────❏`);

        } catch (err) {
            console.error('[installdeps]', err);
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            const script = generateInstallScript(env);

            return Reply(
`╭─❏ *❌ AUTO INSTALL GAGAL*
│▣ Error : ${err.message.slice(0, 200)}
│▣
│▣ Bot bukan root & gak punya sudo NOPASSWD.
│▣ Install manual via SSH VPS:
│▣
│▣ 1️⃣ Jalankan: \`${prefix}installscript\`
│▣ 2️⃣ Download & copy scriptnya
│▣ 3️⃣ Jalankan di SSH: \`bash install-deps.sh\`
│▣
│▣ *Atau* kasih sudo NOPASSWD ke user bot:
│▣ \`sudo visudo\`
│▣ Tambahkan: \`${env.username} ALL=(ALL) NOPASSWD: ALL\`
╰──────────❏`);
        }
    }

    if (command === 'installytdlp') {
        await shorekeeper.sendMessage(m.chat, { react: { text: '🚀', key: m.key } });

        const check = await checkBinary('yt-dlp');
        if (check.installed) {
            return Reply(`╭─❏ *✅ yt-dlp*\n│▣ Versi : ${check.version}\n│▣ Update : \`${prefix}updatedeps\`\n╰──────────❏`);
        }

        const msg = await Reply('⏳ Menginstall yt-dlp...');
        const log = (line) => {
            shorekeeper.sendMessage(m.chat, {
                text: `*[yt-dlp install]*\n${line}`,
                edit: msg.key
            }).catch(() => {});
        };

        try {
            await smartInstallYtDlp(env, log);
            const final = await checkBinary('yt-dlp');
            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return Reply(
`╭─❏ *✅ yt-dlp TERINSTALL*
│▣ Versi : ${final.version}
│▣
│▣ ⚠️ Restart bot: \`${prefix}restart\`
╰──────────❏`);
        } catch (err) {
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return Reply(
`❌ Gagal install yt-dlp: ${err.message.slice(0, 250)}

📌 Coba manual: \`${prefix}installscript\``);
        }
    }

    if (command === 'installffmpeg') {
        await shorekeeper.sendMessage(m.chat, { react: { text: '🚀', key: m.key } });

        const check = await checkBinary('ffmpeg');
        if (check.installed) {
            return Reply(`╭─❏ *✅ ffmpeg*\n│▣ Versi : ${check.version}\n╰──────────❏`);
        }

        const msg = await Reply('⏳ Menginstall ffmpeg (bisa 1-5 menit)...');
        const log = (line) => {
            shorekeeper.sendMessage(m.chat, {
                text: `*[ffmpeg install]*\n${line}`,
                edit: msg.key
            }).catch(() => {});
        };

        try {
            await smartInstallFfmpeg(env, log);
            const final = await checkBinary('ffmpeg');
            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return Reply(
`╭─❏ *✅ ffmpeg TERINSTALL*
│▣ Versi : ${final.version}
│▣
│▣ ⚠️ Restart bot: \`${prefix}restart\`
╰──────────❏`);
        } catch (err) {
            await shorekeeper.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return Reply(
`❌ Gagal install ffmpeg: ${err.message.slice(0, 250)}

📌 Coba manual: \`${prefix}installscript\``);
        }
    }

    if (command === 'updatedeps') {
        const check = await checkBinary('yt-dlp');
        if (!check.installed) return Reply(`❌ yt-dlp belum terinstall. Pakai \`${prefix}installdeps\` dulu.`);

        await shorekeeper.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });
        await Reply(`⏳ Update yt-dlp dari ${check.version}...`);

        try {

            try {
                await runStream('yt-dlp -U', { timeout: 120000 });
            } catch {

                try {
                    await installYtDlpUserLocal(env, () => {});
                } catch {
                    await runStream('pip install -U yt-dlp 2>&1 || pip3 install -U yt-dlp 2>&1', { timeout: 180000 });
                }
            }

            const after = await checkBinary('yt-dlp');
            await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return Reply(
`╭─❏ *✅ UPDATE YT-DLP*
│▣ Sebelum : ${check.version}
│▣ Sesudah : ${after.version}
╰──────────❏`);
        } catch (err) {
            return Reply(`❌ Gagal update: ${err.message.slice(0, 200)}`);
        }
    }

    if (command === 'npm') {
        const sub = (text || '').trim().split(/\s+/);
        const action = sub[0]?.toLowerCase();

        if (action === 'i' || action === 'install') {
            const pkgs = sub.slice(1).filter(Boolean);
            if (!pkgs.length) return Reply(`❌ Contoh: \`${prefix}npm i axios chalk\``);

            await shorekeeper.sendMessage(m.chat, { react: { text: '📦', key: m.key } });
            const msg = await Reply(`⏳ Install: ${pkgs.join(', ')}...`);

            try {
                await runStream(`npm install ${pkgs.map(p => `"${p}"`).join(' ')} --no-audit --no-fund`, {
                    onData: (line) => {
                        if (/added|updated|error|warn/i.test(line) && line.length < 150) {
                            shorekeeper.sendMessage(m.chat, { text: `📦 ${line}`, edit: msg.key }).catch(() => {});
                        }
                    },
                    timeout: 300000
                });
                await shorekeeper.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                return Reply(`✅ Berhasil:\n${pkgs.map(p => `• ${p}`).join('\n')}`);
            } catch (err) {
                return Reply(`❌ Gagal: ${err.message.slice(0, 300)}`);
            }
        }

        if (['uninstall', 'remove', 'rm'].includes(action)) {
            const pkgs = sub.slice(1).filter(Boolean);
            if (!pkgs.length) return Reply(`❌ Contoh: \`${prefix}npm uninstall axios\``);
            try {
                await runStream(`npm uninstall ${pkgs.map(p => `"${p}"`).join(' ')}`, { timeout: 120000 });
                return Reply(`✅ Uninstall: ${pkgs.join(', ')}`);
            } catch (err) {
                return Reply(`❌ Gagal: ${err.message.slice(0, 200)}`);
            }
        }

        return Reply(
`╭─❏ *📦 NPM MANAGER*
│▣ \`${prefix}npm i <pkg>\`           — install
│▣ \`${prefix}npm uninstall <pkg>\`   — hapus
│▣ \`${prefix}npmlist\`               — daftar
╰──────────❏`);
    }

    if (command === 'npmlist') {
        try {
            const pkgPath = path.join(process.cwd(), 'package.json');
            if (!fs.existsSync(pkgPath)) return Reply('❌ package.json tidak ditemukan');

            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const deps = Object.entries(pkg.dependencies || {});
            const devDeps = Object.entries(pkg.devDependencies || {});
            if (!deps.length && !devDeps.length) return Reply('📭 Tidak ada dependency');

            let teks = `╭─❏ *📦 NPM PACKAGES*\n│▣\n`;
            teks += `│▣ *Dependencies* (${deps.length})\n`;
            for (const [name, ver] of deps) {
                let realVer = ver;
                try { realVer = `v${require(`${name}/package.json`).version}`; } catch {}
                teks += `│▣ • ${name.padEnd(24)} \`${realVer}\`\n`;
            }
            if (devDeps.length) {
                teks += `│▣\n│▣ *DevDependencies* (${devDeps.length})\n`;
                for (const [name, ver] of devDeps) teks += `│▣ • ${name.padEnd(24)} \`${ver}\`\n`;
            }
            teks += `╰──────────❏`;
            return Reply(teks);
        } catch (err) {
            return Reply(`❌ ${err.message}`);
        }
    }
};

handler.command = [
    'checkdeps',
    'installdeps',
    'installytdlp',
    'installffmpeg',
    'updatedeps',
    'installscript',
    'npm',
    'npmlist'
];
handler.help = ['installdeps'];
handler.tags = ['owner'];
handler.limit = false;

module.exports = handler;