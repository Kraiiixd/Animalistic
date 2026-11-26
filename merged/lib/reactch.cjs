/**
* React CH Scrape (dipakai fitur .rch, tanpa API key)
* Credit : Sakaxabell
*/
const https = require('https');
const { URL } = require('url');

const BASE = 'https://leovandzreach.vercel.app';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(BASE + path);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Origin': BASE,
        'Referer': BASE + '/'
      },
      timeout: 45000
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch {}
        resolve({ status: res.statusCode, body: text, json });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function validateChannelUrl(value) {
  try {
    const u = new URL(String(value).trim());
    const hostOk = u.hostname === 'whatsapp.com' || u.hostname.endsWith('.whatsapp.com');
    return (u.protocol === 'https:' || u.protocol === 'http:') && hostOk && /\/channel\/[^/]+\/[^/]+/i.test(u.pathname);
  } catch {
    return false;
  }
}

async function react(url, emojis) {
  if (!validateChannelUrl(url)) {
    return { ok: false, error: 'link channel post tidak valid', hint: 'format: https://whatsapp.com/channel/<id>/<postId>' };
  }
  const list = String(emojis || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!list.length) {
    return { ok: false, error: 'emoji kosong' };
  }
  const r = await post('/api/react', { url: url.trim(), emojis: list.join(', ') });
  const payload = r.json || { status: false, msg: r.body };
  return {
    ok: !!payload.status,
    mode: 'react',
    http: r.status,
    url: url.trim(),
    emojis: list,
    msg: payload.msg || '',
    raw: payload
  };
}

module.exports = { react, validateChannelUrl };
