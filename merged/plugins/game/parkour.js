/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

let handler = async (m, { shorekeeper, Reply, isRegistered, isCreator, isPremium, checkLimit, addLimit }) => {
  if (!isRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi);
  if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit);
  addLimit(m.sender, isPremium, isCreator);

  await shorekeeper.sendMessage(m.chat, { react: { text: "🏃", key: m.key } });

  const html = `<style>
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
body{margin:0;padding:6px;background:transparent;font-family:Arial,sans-serif;color:#eee;touch-action:manipulation;display:flex;justify-content:center}
.container{width:100%;max-width:520px;margin:auto}
.card{background:#0a0f1d;border:1px solid rgba(0,240,255,.25);border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.6),0 0 20px rgba(0,240,255,.1)}
.header{padding:12px 18px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;background:#060a14}
.body{padding:10px}
.stage{position:relative;width:100%;aspect-ratio:480/280;border-radius:14px;overflow:hidden;border:1px solid rgba(0,240,255,.2);background:#0a0f1d}
#game{width:100%;height:100%;display:block}
.progwrap{margin-top:8px;height:6px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden}
.progbar{height:100%;width:0%;background:linear-gradient(90deg,#00f0ff,#ff0055);transition:width .1s linear}
.status{text-align:center;margin-top:6px;font-size:12px;font-weight:bold;color:rgba(255,255,255,.75)}
.hint{position:absolute;bottom:6px;left:0;width:100%;text-align:center;font-size:10px;color:rgba(255,255,255,.55);pointer-events:none;z-index:5}
.screen{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(5,11,20,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;padding:14px;text-align:center}
.hidden{display:none!important}
h1{font-size:26px;color:#00f0ff;text-shadow:0 0 12px #00f0ff;margin:0 0 4px 0;letter-spacing:2px}
.sub{font-size:11px;color:#ff0055;margin-bottom:16px;letter-spacing:1px;font-weight:bold}
.btn{background:linear-gradient(45deg,#ff0055,#ff5500);color:#fff;border:none;padding:9px 22px;font-size:13px;font-weight:bold;border-radius:20px;cursor:pointer;box-shadow:0 0 12px rgba(255,0,85,.5);margin:4px}
.btn.alt{background:#243247;box-shadow:none}
.lvlgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-height:140px;overflow-y:auto;width:100%;padding:8px;background:rgba(0,0,0,.35);border-radius:10px;margin-bottom:12px}
.lvlbtn{aspect-ratio:1;background:#141d2e;border:1px solid #33475e;color:#fff;font-size:11px;font-weight:bold;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.lvlbtn.unlocked{border-color:#00f0ff;color:#00f0ff;box-shadow:0 0 5px rgba(0,240,255,.3)}
.lvlbtn.locked{opacity:.35;cursor:not-allowed}
</style>
<body>
<div class="container">
<div class="card">
<div class="header">
  <div>
    <div style="font-size:10px;letter-spacing:1.5px;color:#00f0ff;font-weight:bold">Hitoshi MD GAME</div>
    <div style="font-size:19px;font-weight:bold;color:#fff">🏃 Cyber Parkour</div>
  </div>
  <div style="text-align:right">
    <div id="levelDisplay" style="font-size:20px;font-weight:bold;color:#ffd32a">LVL 1</div>
    <div id="bestDisplay" style="font-size:10px;color:rgba(255,255,255,.5);margin-top:2px">BEST LVL 1</div>
  </div>
</div>
<div class="body">
  <div class="stage" id="stage">
    <canvas id="game" width="480" height="280"></canvas>
    <div class="hint">Ketuk layar atau SPASI untuk lompat</div>

    <div id="mainMenu" class="screen">
      <h1>PARKOUR</h1>
      <div class="sub">BY Hitoshi MD</div>
      <button class="btn" id="btnPlay">MAIN</button>
    </div>

    <div id="levelSelectMenu" class="screen hidden">
      <div style="font-size:13px;color:#00f0ff;font-weight:bold;margin-bottom:8px">PILIH LEVEL</div>
      <div class="lvlgrid" id="levelGrid"></div>
      <button class="btn alt" id="btnBackMenu">KEMBALI</button>
    </div>

    <div id="gameOverMenu" class="screen hidden">
      <div style="font-size:20px;color:#ff0055;font-weight:bold;margin-bottom:6px">GAME OVER</div>
      <div id="goInfo" style="font-size:12px;color:#aaa;margin-bottom:14px">Anda menabrak rintangan!</div>
      <button class="btn" id="btnRetry">COBA LAGI</button>
      <button class="btn alt" id="btnGoLevel">LEVEL</button>
    </div>

    <div id="levelCompleteMenu" class="screen hidden">
      <div style="font-size:20px;color:#00f0ff;font-weight:bold;margin-bottom:6px">LEVEL SELESAI!</div>
      <div id="ldInfo" style="font-size:12px;color:#aaa;margin-bottom:14px">Kerja bagus!</div>
      <button class="btn" id="btnNext">LEVEL BERIKUTNYA</button>
      <button class="btn alt" id="btnLdLevel">LEVEL</button>
    </div>
  </div>
  <div class="progwrap"><div class="progbar" id="progbar"></div></div>
  <div id="status" class="status">Ketuk MAIN buat mulai berlari!</div>
</div>
</div>
</div>
<script>
var audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") { audioCtx.resume(); }
}

function playJumpSound() {
  try {
    initAudio();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.16);
  } catch (e) {}
}

function playCrashSound() {
  try {
    initAudio();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.31);
  } catch (e) {}
}

function playWinSound() {
  try {
    initAudio();
    var notes = [261.63, 329.63, 392.00, 523.25];
    for (var i = 0; i < notes.length; i++) {
      (function(freq, idx) {
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.2);
      })(notes[i], i);
    }
  } catch (e) {}
}

var bgmInterval = null;
function startBGM() {
  if (bgmInterval || !audioCtx) return;
  var step = 0;
  var bassNotes = [65.41, 65.41, 87.31, 73.42];
  bgmInterval = setInterval(function() {
    if (!audioCtx || gameMode !== "PLAYING") return;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(bassNotes[step % bassNotes.length], audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
    step++;
  }, 250);
}

var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var W = 480, H = 280;

var levelDisplayEl = document.getElementById("levelDisplay");
var bestDisplayEl = document.getElementById("bestDisplay");
var statusEl = document.getElementById("status");
var progbarEl = document.getElementById("progbar");

var currentLevel = 1;
var maxUnlockedLevel = 1;
try { maxUnlockedLevel = parseInt(localStorage.getItem("parkour_max_level")) || 1; } catch (e) {}
var TOTAL_LEVELS = 50;

var gameMode = "MENU";
var cameraX = 0;
var levelLength = 2000;
var finishLine = 0;

var player = {
  x: 50, y: 0, width: 26, height: 52, vx: 0, vy: 0,
  speed: 5.5, jumpForce: -13.5, isGrounded: false,
  history: [], animTime: 0,
  reset: function(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.isGrounded = false; this.history = []; this.animTime = 0;
  },
  update: function() {
    this.vy += 0.65;
    this.x += this.speed;
    this.y += this.vy;
    this.animTime += 0.25;
    this.history.push({ x: this.x, y: this.y, animTime: this.animTime });
    if (this.history.length > 5) this.history.shift();
  },
  draw: function(c, camX) {
    for (var i = 0; i < this.history.length; i++) {
      var h = this.history[i];
      var alpha = (i + 1) / (this.history.length * 2.5);
      c.save();
      c.globalAlpha = alpha;
      c.fillStyle = i % 2 === 0 ? "#00f0ff" : "#ff0055";
      drawHumanoid(c, h.x - camX, h.y, h.animTime, false, true);
      c.restore();
    }
    drawHumanoid(c, this.x - camX, this.y, this.animTime, this.isGrounded, false);
  }
};

function drawHumanoid(c, x, y, time, isGrounded, isShadow) {
  c.save();
  c.translate(x + 13, y + 26);

  var mainColor = isShadow ? c.fillStyle : "#0a0a0a";
  var accentColor = isShadow ? c.fillStyle : "#ff0055";

  var runCycle = Math.sin(time);
  var leg1 = runCycle * 0.8;
  var leg2 = -runCycle * 0.8;
  var arm1 = -runCycle * 0.9;
  var arm2 = runCycle * 0.9;

  if (!isGrounded) {
    leg1 = -0.8; leg2 = 0.5; arm1 = -1.2; arm2 = 0.8;
  }

  c.strokeStyle = mainColor;
  c.lineWidth = 5;
  c.lineCap = "round";

  drawLimb(c, 0, -9, arm2, 15, 13, accentColor);
  drawLimb(c, 0, 9, leg2, 17, 15, accentColor);

  c.beginPath();
  c.moveTo(0, -13);
  c.lineTo(0, 9);
  c.stroke();

  c.beginPath();
  c.arc(2, -19, 6, 0, Math.PI * 2);
  c.fillStyle = mainColor;
  c.fill();

  if (!isShadow) {
    c.fillStyle = "#ff0055";
    c.fillRect(4, -21, 3, 3);
  }

  drawLimb(c, 0, 9, leg1, 17, 15, accentColor);
  drawLimb(c, 0, -9, arm1, 15, 13, accentColor);

  c.restore();
}

function drawLimb(c, startX, startY, angle, len1, len2, bandColor) {
  c.save();
  c.translate(startX, startY);
  c.rotate(angle);

  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, len1);
  c.stroke();

  c.strokeStyle = bandColor;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-3, len1 / 2);
  c.lineTo(3, len1 / 2);
  c.stroke();

  c.strokeStyle = c.fillStyle;
  c.lineWidth = 4;
  c.translate(0, len1);
  c.rotate(-Math.abs(angle) * 0.5);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, len2);
  c.stroke();

  c.restore();
}

var platforms = [];
var obstacles = [];

function generateLevel(level) {
  platforms = [];
  obstacles = [];

  var baseSpeed = 5.5 + (level * 0.06);
  player.speed = Math.min(baseSpeed, 8.5);

  levelLength = 1500 + level * 180;
  finishLine = levelLength;

  var currentX = 0;
  var currentY = H - 120;

  while (currentX < levelLength + 400) {
    var platWidth = 260 + Math.random() * 200;
    platforms.push({ x: currentX, y: currentY, w: platWidth, h: 200 });

    if (currentX > 250 && currentX < levelLength) {
      var numObs = Math.floor(1 + Math.random() * (1 + level * 0.12));
      for (var i = 0; i < numObs; i++) {
        var obsX = currentX + 80 + (i * 100) + Math.random() * 40;
        var type = Math.floor(Math.random() * 3);
        if (type === 0) {
          obstacles.push({ x: obsX, y: currentY - 38, w: 16, h: 38, type: "laser" });
        } else if (type === 1) {
          obstacles.push({ x: obsX, y: currentY - 22, w: 26, h: 22, type: "box" });
        }
      }
    }

    var gap = 70 + Math.random() * (50 + Math.min(level * 1.5, 60));
    currentX += platWidth + gap;
    currentY = Math.min(H - 80, Math.max(H - 180, currentY + (Math.random() * 50 - 25)));
  }
}

function handleJump() {
  initAudio();
  if (gameMode === "PLAYING" && player.isGrounded) {
    player.vy = player.jumpForce;
    player.isGrounded = false;
    playJumpSound();
  }
}

document.getElementById("stage").addEventListener("pointerdown", function(e) {
  if (e.target.tagName === "BUTTON") return;
  handleJump();
});
document.addEventListener("keydown", function(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    handleJump();
  }
});

function drawCyberpunkCity(c, camX) {
  c.fillStyle = "#0a0f1d";
  c.fillRect(0, 0, W, H);

  c.fillStyle = "#131e32";
  for (var i = 0; i < 10; i++) {
    var bgX = (i * 90) - (camX * 0.2) % 90;
    c.fillRect(bgX, H - 150 - (i % 3 * 20), 55, 200);
  }

  c.fillStyle = "#1c2d42";
  for (var j = 0; j < 8; j++) {
    var fgX = (j * 130) - (camX * 0.5) % 130;
    c.fillRect(fgX, H - 200 + (j % 2 * 25), 70, 260);
    c.fillStyle = "rgba(0,240,255,0.15)";
    c.fillRect(fgX + 10, H - 185, 14, 90);
    c.fillStyle = "#1c2d42";
  }
}

function updateGame() {
  if (gameMode !== "PLAYING") return;

  player.update();
  cameraX = player.x - 90;

  player.isGrounded = false;
  for (var p = 0; p < platforms.length; p++) {
    var plat = platforms[p];
    if (player.x + player.width > plat.x && player.x < plat.x + plat.w) {
      if (player.y + player.height >= plat.y && player.y + player.height <= plat.y + 15 && player.vy >= 0) {
        player.isGrounded = true;
        player.vy = 0;
        player.y = plat.y - player.height;
      }
    }
  }

  if (player.y > H + 100) {
    triggerGameOver();
    return;
  }

  for (var o = 0; o < obstacles.length; o++) {
    var obs = obstacles[o];
    if (player.x + player.width - 5 > obs.x && player.x + 5 < obs.x + obs.w &&
        player.y + player.height > obs.y && player.y < obs.y + obs.h) {
      triggerGameOver();
      return;
    }
  }

  progbarEl.style.width = Math.min(100, (player.x / finishLine) * 100) + "%";

  if (player.x >= finishLine) {
    triggerLevelWin();
  }
}

function triggerGameOver() {
  if (gameMode !== "PLAYING") return;
  gameMode = "GAMEOVER";
  playCrashSound();
  document.getElementById("goInfo").textContent = "Level " + currentLevel + " - Menabrak rintangan!";
  showScreen("gameOverMenu");
  statusEl.textContent = "GAME OVER - Ketuk COBA LAGI";
}

function triggerLevelWin() {
  if (gameMode !== "PLAYING") return;
  gameMode = "WIN";
  playWinSound();
  if (currentLevel >= maxUnlockedLevel && maxUnlockedLevel < TOTAL_LEVELS) {
    maxUnlockedLevel = currentLevel + 1;
    try { localStorage.setItem("parkour_max_level", maxUnlockedLevel); } catch (e) {}
    bestDisplayEl.textContent = "BEST LVL " + maxUnlockedLevel;
  }
  document.getElementById("ldInfo").textContent = "Level " + currentLevel + " selesai!";
  showScreen("levelCompleteMenu");
  statusEl.textContent = "LEVEL SELESAI!";
}

function renderGame() {
  ctx.clearRect(0, 0, W, H);
  drawCyberpunkCity(ctx, cameraX);

  for (var p = 0; p < platforms.length; p++) {
    var plat = platforms[p];
    var drawX = plat.x - cameraX;
    if (drawX > W + 50 || drawX < -plat.w - 50) continue;
    ctx.fillStyle = "#080d14";
    ctx.fillRect(drawX, plat.y, plat.w, plat.h);
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(drawX, plat.y, plat.w, 3);
    ctx.fillRect(drawX + 8, plat.y + 8, 6, plat.h);
    ctx.fillRect(drawX + plat.w - 14, plat.y + 8, 6, plat.h);
  }

  for (var o = 0; o < obstacles.length; o++) {
    var obs = obstacles[o];
    var ox = obs.x - cameraX;
    if (ox > W + 30 || ox < -50) continue;
    ctx.fillStyle = obs.type === "laser" ? "#ff0055" : "#00f0ff";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.fillRect(ox, obs.y, obs.w, obs.h);
    ctx.shadowBlur = 0;
  }

  var finishX = finishLine - cameraX;
  if (finishX > -20 && finishX < W + 20) {
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(finishX, 0, 6, H);
  }

  if (gameMode === "PLAYING") {
    player.draw(ctx, cameraX);
  }

  requestAnimationFrame(function() {
    updateGame();
    renderGame();
  });
}

function showScreen(id) {
  var screens = document.querySelectorAll(".screen");
  for (var i = 0; i < screens.length; i++) screens[i].classList.add("hidden");
  document.getElementById(id).classList.remove("hidden");
}

function hideAllScreens() {
  var screens = document.querySelectorAll(".screen");
  for (var i = 0; i < screens.length; i++) screens[i].classList.add("hidden");
}

function startGame(level) {
  initAudio();
  currentLevel = level;
  levelDisplayEl.textContent = "LVL " + currentLevel;
  bestDisplayEl.textContent = "BEST LVL " + maxUnlockedLevel;
  generateLevel(currentLevel);

  var startPlat = platforms[0];
  player.reset(startPlat.x + 20, startPlat.y - player.height);

  hideAllScreens();
  gameMode = "PLAYING";
  progbarEl.style.width = "0%";
  statusEl.textContent = "Lari! Ketuk layar buat lompat";
  startBGM();
}

function openLevelSelect() {
  hideAllScreens();
  showScreen("levelSelectMenu");

  var grid = document.getElementById("levelGrid");
  grid.innerHTML = "";
  for (var i = 1; i <= TOTAL_LEVELS; i++) {
    (function(lvl) {
      var btn = document.createElement("button");
      btn.className = "lvlbtn " + (lvl <= maxUnlockedLevel ? "unlocked" : "locked");
      btn.textContent = lvl;
      if (lvl <= maxUnlockedLevel) {
        btn.addEventListener("pointerdown", function(e) {
          e.stopPropagation();
          startGame(lvl);
        });
      }
      grid.appendChild(btn);
    })(i);
  }
}

document.getElementById("btnPlay").addEventListener("pointerdown", function(e) { e.stopPropagation(); initAudio(); openLevelSelect(); });
document.getElementById("btnBackMenu").addEventListener("pointerdown", function(e) { e.stopPropagation(); hideAllScreens(); showScreen("mainMenu"); });
document.getElementById("btnRetry").addEventListener("pointerdown", function(e) { e.stopPropagation(); startGame(currentLevel); });
document.getElementById("btnGoLevel").addEventListener("pointerdown", function(e) { e.stopPropagation(); openLevelSelect(); });
document.getElementById("btnNext").addEventListener("pointerdown", function(e) {
  e.stopPropagation();
  if (currentLevel < TOTAL_LEVELS) startGame(currentLevel + 1);
  else openLevelSelect();
});
document.getElementById("btnLdLevel").addEventListener("pointerdown", function(e) { e.stopPropagation(); openLevelSelect(); });

bestDisplayEl.textContent = "BEST LVL " + maxUnlockedLevel;
requestAnimationFrame(function(time) {
  renderGame();
});
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
                messageText: "🏃 Cyber Parkour"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(
                JSON.stringify({
                  response_id: "parkour-" + Date.now(),
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

handler.command = ["parkour", "parkourgame", "gameparkour"];
handler.help = ["parkour"];
handler.tags = ["game"];

module.exports = handler;
