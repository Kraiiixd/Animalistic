/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

let handler = async (m, { shorekeeper, Reply, isRegistered, isCreator, isPremium, checkLimit, addLimit }) => {
  if (!isRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi);
  if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit);
  addLimit(m.sender, isPremium, isCreator);

  await shorekeeper.sendMessage(m.chat, { react: { text: "🔢", key: m.key } });

  const html = `<style>
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
body{margin:0;padding:6px;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:manipulation;display:flex;justify-content:center}
.container{width:100%;max-width:480px;margin:auto}
.card{background:#111422;border:1px solid rgba(255,211,42,.25);border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.6)}
.header{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;background:#0a0c16}
.body{padding:10px}
#game{width:100%;height:auto;aspect-ratio:1;background:#0d0f1a;border:1px solid rgba(255,211,42,.15);border-radius:12px;display:block}
.dpad{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;max-width:180px;margin:10px auto 0 auto}
.dbtn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-size:18px;font-weight:bold;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.dbtn:active{background:rgba(255,211,42,.3);transform:scale(.95)}
.status{text-align:center;margin-top:6px;font-size:12px;color:rgba(255,255,255,.7)}
</style>
<body>
<div class="container">
<div class="card">
<div class="header">
  <div>
    <div style="font-size:10px;letter-spacing:1.5px;color:#ffd32a;font-weight:bold">Hitoshi MD V1 GAME</div>
    <div style="font-size:20px;font-weight:bold;color:#fff">🔢 2048 Neon</div>
  </div>
  <div style="text-align:right">
    <div id="score" style="font-size:24px;font-weight:bold;color:#ffd32a">0</div>
    <div id="best" style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px">BEST 0</div>
  </div>
</div>
<div class="body">
<canvas id="game" width="400" height="400"></canvas>
<div class="dpad">
  <div></div>
  <div class="dbtn" id="btnU">⬆️</div>
  <div></div>
  <div class="dbtn" id="btnL">⬅️</div>
  <div class="dbtn" id="btnD">⬇️</div>
  <div class="dbtn" id="btnR">➡️</div>
</div>
<div id="status" class="status">Swipe atau tap tombol untuk geser balok!</div>
</div></div></div>
<script>
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playSlideSound() {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  } catch(e) {}
}

function playMergeSound(val) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    let baseFreq = 440 + Math.min(800, Math.log2(val) * 60);
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc.frequency.setValueAtTime(baseFreq * 1.5, audioCtx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.19);
  } catch(e) {}
}

function playDeadSound() {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.26);
  } catch(e) {}
}

const c = document.getElementById("game");
const x = c.getContext("2d");
const scEl = document.getElementById("score");
const bsEl = document.getElementById("best");
const stEl = document.getElementById("status");

const SIZE = 4;
const CELL = 88;
const GAP = 9;
let grid, score = 0, best = 0, state = "play";

try {
  best = parseInt(localStorage.getItem("2048_best")) || 0;
  bsEl.textContent = "BEST " + best;
} catch(e) {}

function saveB() {
  try { localStorage.setItem("2048_best", best); } catch(e) {}
}

const COLORS = {
  2: { bg: "#2c3e50", text: "#ecf0f1" },
  4: { bg: "#34495e", text: "#ecf0f1" },
  8: { bg: "#e67e22", text: "#fff" },
  16: { bg: "#d35400", text: "#fff" },
  32: { bg: "#e74c3c", text: "#fff" },
  64: { bg: "#c0392b", text: "#fff" },
  128: { bg: "#f39c12", text: "#fff" },
  256: { bg: "#f1c40f", text: "#fff" },
  512: { bg: "#1abc9c", text: "#fff" },
  1024: { bg: "#16a085", text: "#fff" },
  2048: { bg: "#9b59b6", text: "#fff" },
  4096: { bg: "#8e44ad", text: "#fff" }
};

function addRandomTile() {
  let empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let col = 0; col < SIZE; col++) {
      if (grid[r][col] === 0) empty.push({ r, col });
    }
  }
  if (empty.length > 0) {
    let rand = empty[Math.floor(Math.random() * empty.length)];
    grid[rand.r][rand.col] = Math.random() < 0.9 ? 2 : 4;
  }
}

function reset() {
  grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
  score = 0;
  state = "play";
  addRandomTile();
  addRandomTile();
  scEl.textContent = "0";
  stEl.textContent = "Gabungkan angka sampai 2048!";
  draw();
}

function slide(row) {
  let arr = row.filter(v => v !== 0);
  let merged = false;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      playMergeSound(arr[i]);
      arr.splice(i + 1, 1);
      merged = true;
    }
  }
  while (arr.length < SIZE) arr.push(0);
  return { row: arr, merged };
}

function rotateGrid(g) {
  return g[0].map((_, i) => g.map(row => row[i]).reverse());
}

function move(dir) {
  if (state === "dead") {
    reset();
    return;
  }
  initAudio();
  let rotated = grid;
  let rotations = 0;
  if (dir === "up") { rotations = 3; }
  else if (dir === "right") { rotations = 2; }
  else if (dir === "down") { rotations = 1; }

  for (let i = 0; i < rotations; i++) rotated = rotateGrid(rotated);

  let moved = false;
  let newGrid = rotated.map(row => {
    let res = slide(row);
    if (JSON.stringify(res.row) !== JSON.stringify(row)) moved = true;
    return res.row;
  });

  let backRotations = (4 - rotations) % 4;
  for (let i = 0; i < backRotations; i++) newGrid = rotateGrid(newGrid);

  if (moved) {
    playSlideSound();
    grid = newGrid;
    addRandomTile();
    scEl.textContent = score;
    if (score > best) {
      best = score;
      saveB();
      bsEl.textContent = "BEST " + best;
    }
    if (checkGameOver()) {
      state = "dead";
      playDeadSound();
      stEl.textContent = "GAME OVER - Skor: " + score + " (Tap tombol untuk main lagi)";
    }
    draw();
  }
}

function checkGameOver() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
    }
  }
  return true;
}

document.getElementById("btnU").onclick = function(e) { e.preventDefault(); move("up"); };
document.getElementById("btnD").onclick = function(e) { e.preventDefault(); move("down"); };
document.getElementById("btnL").onclick = function(e) { e.preventDefault(); move("left"); };
document.getElementById("btnR").onclick = function(e) { e.preventDefault(); move("right"); };

let touchStartX = 0, touchStartY = 0;
c.addEventListener("touchstart", function(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

c.addEventListener("touchend", function(e) {
  let dx = e.changedTouches[0].clientX - touchStartX;
  let dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 20) move("right");
    else if (dx < -20) move("left");
  } else {
    if (dy > 20) move("down");
    else if (dy < -20) move("up");
  }
}, { passive: true });

document.addEventListener("keydown", function(e) {
  if (e.code === "ArrowUp" || e.code === "KeyW") move("up");
  else if (e.code === "ArrowDown" || e.code === "KeyS") move("down");
  else if (e.code === "ArrowLeft" || e.code === "KeyA") move("left");
  else if (e.code === "ArrowRight" || e.code === "KeyD") move("right");
});

function draw() {
  x.fillStyle = "#0d0f1a";
  x.fillRect(0, 0, 400, 400);

  for (let r = 0; r < SIZE; r++) {
    for (let col = 0; col < SIZE; col++) {
      let val = grid[r][col];
      let px = GAP + col * (CELL + GAP);
      let py = GAP + r * (CELL + GAP);

      if (val === 0) {
        x.fillStyle = "rgba(255, 255, 255, 0.04)";
        x.beginPath();
        x.roundRect(px, py, CELL, CELL, 10);
        x.fill();
      } else {
        let conf = COLORS[val] || { bg: "#8e44ad", text: "#fff" };
        x.fillStyle = conf.bg;
        x.beginPath();
        x.roundRect(px, py, CELL, CELL, 10);
        x.fill();

        x.fillStyle = conf.text;
        let fontSize = val >= 1024 ? 24 : (val >= 128 ? 28 : 34);
        x.font = "900 " + fontSize + "px Arial Black, Arial";
        x.textAlign = "center";
        x.textBaseline = "middle";
        x.fillText(val, px + CELL / 2, py + CELL / 2);
      }
    }
  }

  if (state === "dead") {
    x.fillStyle = "rgba(0, 0, 0, 0.65)";
    x.fillRect(0, 0, 400, 400);

    x.font = "900 24px Arial Black, Arial";
    x.textAlign = "center";
    x.fillStyle = "#ffd32a";
    x.fillText("G A M E   O V E R", 200, 180);

    x.font = "900 13px Arial";
    x.fillStyle = "#fff";
    x.fillText("Tap tombol untuk main lagi", 200, 220);
  }
}

reset();
</script>
</body>`;

  await shorekeeper.relayMessage(
    m.chat,
    {
      messageContextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        botMetadata: {}
      },
      botForwardedMessage: {
        message: {
          richResponseMessage: {
            messageType: 1,
            submessages: [
              {
                messageType: 2,
                messageText: "🔢 2048 Neon Puzzle"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(
                JSON.stringify({
                  response_id: "2048-" + Date.now(),
                  sections: [
                    {
                      view_model: {
                        primitive: {
                          __typename: "GenAIaeacdsnwHtmlPrimitive",
                          payload: html,
                          trusted_sources: []
                        },
                        __typename: "GenAISingleLayoutViewModel"
                      }
                    }
                  ]
                })
              ).toString("base64")
            },
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedAiBotMessageInfo: {
                botJid: "867051314767696@bot"
              },
              forwardOrigin: 4
            }
          }
        }
      }
    },
    {}
  );
};

handler.command = ["2048", "game2048", "puzzle2048"];
handler.help = ["2048"];
handler.tags = ["game"];

module.exports = handler;
