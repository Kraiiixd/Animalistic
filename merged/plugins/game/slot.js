/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

let handler = async (m, { shorekeeper, Reply, isRegistered, isCreator, isPremium, checkLimit, addLimit }) => {
  if (!isRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi);
  if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit);
  addLimit(m.sender, isPremium, isCreator);

  await shorekeeper.sendMessage(m.chat, { react: { text: "🎰", key: m.key } });

  const html = `<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
body{margin:0;padding:10px;background:radial-gradient(120% 100% at 50% -10%,#1a0f2e 0%,#0a0714 55%,#050308 100%);font-family:'Inter',Arial,sans-serif;color:#f1e9ff;touch-action:manipulation;cursor:pointer;display:flex;justify-content:center}
.container{width:100%;max-width:520px;margin:auto}
.card{position:relative;background:linear-gradient(180deg,rgba(32,18,50,.94) 0%,rgba(12,8,22,.97) 100%);border:1px solid rgba(255,190,60,.28);border-radius:24px;overflow:hidden;box-shadow:0 22px 55px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.03) inset}
.lights{position:absolute;left:0;right:0;top:0;height:6px;background:repeating-linear-gradient(90deg,#ffd766 0 10px,transparent 10px 20px,#ff5fae 20px 30px,transparent 30px 40px,#5fd0ff 40px 50px,transparent 50px 60px);opacity:.85;animation:lightsMove 1.4s linear infinite}
@keyframes lightsMove{0%{background-position-x:0}100%{background-position-x:60px}}
.header{position:relative;padding:16px 20px 14px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#28173f,#170e28);border-bottom:1px solid rgba(255,190,60,.2)}
.label{font-size:10px;letter-spacing:2.2px;color:#ffcf7a;font-weight:700;font-family:'Poppins',sans-serif}
.title{font-size:21px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#ffe8a8,#fff6df 40%,#ff9ad0);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 1px 6px rgba(255,170,120,.25))}
.pill{font-size:12px;font-weight:800;color:#1a1226;background:linear-gradient(135deg,#ffe9a8,#ffcf6a);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:7px 14px;white-space:nowrap;box-shadow:0 4px 12px rgba(255,190,80,.35);font-family:'Poppins',sans-serif}
.body{padding:14px}
.jackbar{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(90deg,rgba(255,95,174,.14),rgba(255,207,106,.14));border:1px solid rgba(255,190,60,.3);border-radius:12px;padding:8px;margin-bottom:12px;font-family:'Poppins',sans-serif}
.jackbar .jlabel{font-size:10px;letter-spacing:1.5px;color:#ffcf7a;font-weight:700}
.jackbar .jval{font-size:15px;font-weight:800;background:linear-gradient(90deg,#ffe8a8,#ff9ad0);-webkit-background-clip:text;background-clip:text;color:transparent}
.controls{display:flex;gap:10px;margin-bottom:12px}
.ctrlBtn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(145deg,#1e1533,#120c22);border:1px solid rgba(255,190,60,.28);border-radius:14px;padding:11px 10px;color:#f1e9ff;font-size:12.5px;font-weight:700;font-family:'Poppins',sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.35);transition:transform .12s ease}
.ctrlBtn:active{transform:scale(.96)}
.ctrlBtn .dot{width:9px;height:9px;border-radius:50%;box-shadow:0 0 8px currentColor}
.machine{position:relative;padding:14px 10px 16px;border-radius:20px;background:linear-gradient(155deg,#3a2a1a,#171008);box-shadow:0 14px 34px rgba(0,0,0,.6),0 0 0 1px rgba(255,190,60,.25)}
.machine::before,.machine::after{content:"";position:absolute;top:8px;bottom:8px;width:10px;border-radius:6px;background:linear-gradient(180deg,#ffd766,#a9741f);box-shadow:0 0 10px rgba(255,190,60,.6)}
.machine::before{left:6px}
.machine::after{right:6px}
.reels{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#0a0710;border-radius:14px;padding:8px;box-shadow:0 4px 18px rgba(0,0,0,.6) inset;border:1px solid rgba(0,0,0,.5)}
.reelWin{position:relative;height:222px;overflow:hidden;border-radius:10px;background:linear-gradient(180deg,#161022,#0c0816 50%,#161022);box-shadow:0 0 0 1px rgba(255,255,255,.06) inset}
.reelWin::before{content:"";position:absolute;left:0;right:0;top:74px;height:74px;background:linear-gradient(180deg,rgba(255,215,102,.14),rgba(255,215,102,.04));border-top:1px solid rgba(255,215,102,.35);border-bottom:1px solid rgba(255,215,102,.35);z-index:3;pointer-events:none}
.strip{position:absolute;left:0;right:0;top:0;will-change:transform}
.strip.blur{filter:blur(2px)}
.cell{height:74px;display:flex;align-items:center;justify-content:center;font-size:38px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}
.winGlow .cell.payline{animation:cellWin .5s ease-in-out infinite alternate}
@keyframes cellWin{0%{transform:scale(1)}100%{transform:scale(1.15)}}
.betRow{display:flex;align-items:center;gap:8px;margin-top:12px;background:linear-gradient(145deg,#1e1533,#120c22);border:1px solid rgba(255,190,60,.22);border-radius:14px;padding:9px 10px}
.betRow .betLbl{font-size:10px;color:rgba(241,233,255,.55);letter-spacing:.5px;font-weight:700}
.betRow .betVal{flex:1;text-align:center;font-size:17px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#ffe8a8,#ffcf6a);-webkit-background-clip:text;background-clip:text;color:transparent}
.stepBtn{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,190,60,.3);background:linear-gradient(145deg,#241a3d,#150f28);color:#ffe0a3;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center}
.stepBtn:active{transform:scale(.92)}
.chips{display:flex;gap:6px;margin-top:8px}
.chip{flex:1;text-align:center;padding:7px 0;border-radius:10px;font-size:11.5px;font-weight:700;color:#1a1226;background:linear-gradient(135deg,#f4e2a8,#d9b465);box-shadow:0 3px 8px rgba(217,180,101,.35)}
.chip.alt{background:linear-gradient(135deg,#c9c9e8,#8f8fbf);color:#1a1226}
.spinRow{display:flex;gap:8px;margin-top:12px}
.spinBtn{flex:1;border:none;border-radius:16px;padding:15px;color:#2a1608;font-size:16px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#ffe8a8,#ffcf6a 45%,#ff9ad0);box-shadow:0 8px 20px rgba(255,170,150,.4),0 1px 0 rgba(255,255,255,.5) inset;letter-spacing:.5px}
.spinBtn:active{transform:scale(.97)}
.spinBtn:disabled{opacity:.45;filter:grayscale(.4)}
.maxBtn{flex:0 0 84px;border:1px solid rgba(255,190,60,.3);border-radius:16px;background:linear-gradient(145deg,#1e1533,#120c22);color:#ffe0a3;font-size:12.5px;font-weight:700}
.maxBtn:active{transform:scale(.96)}
.stats{display:flex;gap:8px;margin-top:12px}
.statBox{flex:1;background:linear-gradient(145deg,#1e1533,#120c22);border:1px solid rgba(255,190,60,.2);border-radius:13px;padding:9px 4px;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.3)}
.statBox .val{font-size:15px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#ffe8a8,#ff9ad0);-webkit-background-clip:text;background-clip:text;color:transparent}
.statBox .lbl{font-size:9.5px;color:rgba(241,233,255,.5);margin-top:2px;letter-spacing:.4px}
.status{text-align:center;margin-top:12px;font-size:12.5px;font-weight:700;color:#ffe6c2;background:linear-gradient(90deg,rgba(255,95,174,.14),rgba(255,207,106,.12));border:1px solid rgba(255,190,60,.3);border-radius:12px;padding:9px 12px;min-height:16px}
.footnote{text-align:center;font-size:10px;color:rgba(241,233,255,.4);margin-top:10px;line-height:1.5}
.overlay{position:fixed;inset:0;background:rgba(6,3,14,.65);backdrop-filter:blur(3px);display:none;align-items:flex-end;justify-content:center;z-index:50}
.overlay.open{display:flex}
.sheet{width:100%;max-width:520px;max-height:78vh;overflow-y:auto;background:linear-gradient(180deg,#241735,#130d24);border-radius:20px 20px 0 0;border:1px solid rgba(255,190,60,.3);box-shadow:0 -10px 30px rgba(0,0,0,.5)}
.sheetHead{padding:14px 18px;font-size:13px;font-weight:800;color:#ffcf7a;font-family:'Poppins',sans-serif;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,.08)}
.opt{display:flex;align-items:center;gap:12px;padding:14px 18px;font-size:14px;font-weight:600;color:#f1e9ff;border-bottom:1px solid rgba(255,255,255,.06)}
.opt .dot{width:12px;height:12px;border-radius:50%;box-shadow:0 0 8px currentColor;flex-shrink:0}
.opt .info{flex:1}
.opt .sub{font-size:10.5px;color:rgba(241,233,255,.5);margin-top:2px}
.opt.active{background:linear-gradient(90deg,rgba(255,190,60,.16),transparent)}
.payRow{display:flex;align-items:center;justify-content:space-between;padding:10px 18px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.06)}
.payRow .sym{font-size:22px;width:40px}
.payRow .mult{font-weight:800;color:#ffe0a3}
.histRow{display:flex;align-items:center;justify-content:space-between;padding:9px 18px;font-size:12.5px;border-bottom:1px solid rgba(255,255,255,.06);color:rgba(241,233,255,.8)}
.histRow .w{color:#8dffb0;font-weight:700}
.histRow .l{color:#ff9a9a;font-weight:700}
</style>
<body>
<div class="container">
<div class="card">
  <div class="lights"></div>
  <div class="header">
    <div>
      <div class="label">Hitoshi MD GAME</div>
      <div class="title">🎰 Hitoshi Slot</div>
    </div>
    <div id="balPill" class="pill">💰 5000</div>
  </div>
  <div class="body">
    <div class="jackbar">
      <span class="jlabel">JACKPOT</span>
      <span class="jval" id="jackVal">12,480</span>
    </div>
    <div class="controls">
      <button id="diffBtn" class="ctrlBtn"><span class="dot" id="diffDot" style="background:#5fd0ff"></span><span id="diffLabel">Normal</span></button>
      <button id="payBtn" class="ctrlBtn">📜 Tabel Menang</button>
      <button id="histBtn" class="ctrlBtn">🕘 Riwayat</button>
    </div>
    <div class="machine">
      <div class="reels" id="reels">
        <div class="reelWin"><div class="strip" id="strip0"></div></div>
        <div class="reelWin"><div class="strip" id="strip1"></div></div>
        <div class="reelWin"><div class="strip" id="strip2"></div></div>
      </div>
    </div>
    <div class="betRow">
      <button id="betMinus" class="stepBtn">−</button>
      <div><div class="betLbl" style="text-align:center">TARUHAN</div><div class="betVal" id="betVal">100</div></div>
      <button id="betPlus" class="stepBtn">+</button>
    </div>
    <div class="chips">
      <button class="chip" data-v="50">50</button>
      <button class="chip" data-v="100">100</button>
      <button class="chip alt" data-v="500">500</button>
      <button class="chip alt" data-v="1000">1000</button>
    </div>
    <div class="spinRow">
      <button id="maxBtn" class="maxBtn">MAX BET</button>
      <button id="spinBtn" class="spinBtn">🎲 SPIN</button>
    </div>
    <div class="stats">
      <div class="statBox"><div class="val" id="statSpins">0</div><div class="lbl">Spin</div></div>
      <div class="statBox"><div class="val" id="statWin">0</div><div class="lbl">Total Menang</div></div>
      <div class="statBox"><div class="val" id="statBest">0</div><div class="lbl">Menang Terbesar</div></div>
    </div>
    <div id="status" class="status">Atur taruhanmu lalu tekan SPIN. Semoga beruntung! 🍀</div>
    <div class="footnote">🎮 Hiburan semata — koin virtual, tidak bisa ditukar uang asli. RTP setiap mode ditampilkan transparan di menu Mode.</div>
  </div>
</div>
</div>
<div class="overlay" id="overlay">
  <div class="sheet" id="sheet"></div>
</div>
<script>
let audioCtx = null;
function initAudio(){ if(!audioCtx){ audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } if(audioCtx.state==="suspended"){ audioCtx.resume(); } }
function beep(freq,dur,type,vol){ try{ initAudio(); const osc=audioCtx.createOscillator(); const gain=audioCtx.createGain(); osc.type=type||"sine"; osc.frequency.setValueAtTime(freq,audioCtx.currentTime); gain.gain.setValueAtTime(vol||0.2,audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime+dur+0.02); }catch(e){} }
function sndTick(){ beep(520,0.04,"square",0.1); }
function sndStop(){ beep(260,0.07,"triangle",0.18); }
function sndWin(){ beep(660,0.1,"triangle",0.28); setTimeout(function(){beep(880,0.12,"triangle",0.28);},100); setTimeout(function(){beep(1100,0.16,"triangle",0.28);},220); }
function sndJackpot(){ [660,880,1100,1320,1568].forEach(function(f,i){ setTimeout(function(){beep(f,0.18,"triangle",0.3);}, i*140); }); }
function sndLose(){ beep(220,0.12,"sawtooth",0.15); }
function sndClick(){ beep(440,0.04,"sine",0.12); }
</script>
<script>
  // ===== Konfigurasi simbol & peluang (transparan, RNG murni Math.random) =====
  const SYMBOLS = [
    { k:"cherry",     e:"🍒", pay:2,  w:{ santai:30, normal:32, sultan:34 } },
    { k:"lemon",      e:"🍋", pay:3,  w:{ santai:24, normal:26, sultan:28 } },
    { k:"watermelon", e:"🍉", pay:4,  w:{ santai:18, normal:19, sultan:20 } },
    { k:"grape",      e:"🍇", pay:5,  w:{ santai:14, normal:13, sultan:12 } },
    { k:"star",       e:"⭐", pay:10, w:{ santai:8,  normal:6,  sultan:4  } },
    { k:"diamond",    e:"💎", pay:20, w:{ santai:4,  normal:3,  sultan:1.6} },
    { k:"seven",      e:"7️⃣", pay:50, w:{ santai:2,  normal:1,  sultan:0.4} }
  ];
  const MODES = {
    santai: { label:"Santai",  color:"#8dffb0", rtp:"±96%", desc:"Peluang simbol besar lebih sering muncul." },
    normal: { label:"Normal",  color:"#5fd0ff", rtp:"±92%", desc:"Seimbang antara peluang & tantangan." },
    sultan: { label:"Sultan",  color:"#ff5fae", rtp:"±85%", desc:"Lebih sulit, tapi jackpot 7️⃣7️⃣7️⃣ makin berkilau." }
  };
  const MODE_ORDER = ["santai","normal","sultan"];
  const ROWH = 74;
  const STRIP_LEN = 18; // jumlah simbol acak sebelum hasil akhir

  function pickSymbol(mode){
    const total = SYMBOLS.reduce(function(s,x){ return s + x.w[mode]; }, 0);
    let r = Math.random() * total;
    for (let i=0;i<SYMBOLS.length;i++){
      r -= SYMBOLS[i].w[mode];
      if (r <= 0) return SYMBOLS[i];
    }
    return SYMBOLS[SYMBOLS.length-1];
  }

  let balance = 5000;
  let bet = 100;
  let mode = "normal";
  let spinsCount = 0;
  let totalWin = 0;
  let bestWin = 0;
  let jackpotPool = 12480;
  let history = [];
  let spinning = false;

  const balPill = document.getElementById("balPill");
  const betVal = document.getElementById("betVal");
  const statusEl = document.getElementById("status");
  const statSpins = document.getElementById("statSpins");
  const statWin = document.getElementById("statWin");
  const statBest = document.getElementById("statBest");
  const spinBtn = document.getElementById("spinBtn");
  const maxBtn = document.getElementById("maxBtn");
  const diffBtn = document.getElementById("diffBtn");
  const diffDot = document.getElementById("diffDot");
  const diffLabel = document.getElementById("diffLabel");
  const payBtn = document.getElementById("payBtn");
  const histBtn = document.getElementById("histBtn");
  const overlay = document.getElementById("overlay");
  const sheet = document.getElementById("sheet");
  const jackVal = document.getElementById("jackVal");
  const reelEls = [document.getElementById("strip0"), document.getElementById("strip1"), document.getElementById("strip2")];
  const reelWins = document.querySelectorAll(".reelWin");

  function fmt(n){ return Math.round(n).toLocaleString("id-ID"); }

  function setStatus(t){ statusEl.textContent = t; }

  function renderTop(){
    balPill.textContent = "💰 " + fmt(balance);
    betVal.textContent = fmt(bet);
    statSpins.textContent = String(spinsCount);
    statWin.textContent = fmt(totalWin);
    statBest.textContent = fmt(bestWin);
    jackVal.textContent = fmt(jackpotPool);
    diffDot.style.background = MODES[mode].color;
    diffLabel.textContent = MODES[mode].label;
    spinBtn.disabled = spinning || balance < bet;
  }

  function buildStaticStrip(el, symbol){
    el.innerHTML = "";
    el.style.transition = "none";
    el.style.transform = "translateY(0px)";
    for (let i=0;i<3;i++){
      const c = document.createElement("div");
      c.className = "cell" + (i===1 ? " payline" : "");
      c.textContent = symbol.e;
      el.appendChild(c);
    }
  }

  function initReels(){
    reelEls.forEach(function(el){ buildStaticStrip(el, pickSymbol(mode)); });
  }

  function buildSpinStrip(el, finalSymbol, durationMs){
    const items = [];
    for (let i=0;i<STRIP_LEN;i++) items.push(pickSymbol(mode));
    items.push(pickSymbol(mode));   // atas (dekoratif)
    items.push(finalSymbol);        // payline (menentukan hasil)
    items.push(pickSymbol(mode));   // bawah (dekoratif)

    el.innerHTML = "";
    el.classList.add("blur");
    el.style.transition = "none";
    el.style.transform = "translateY(0px)";
    items.forEach(function(sym, idx){
      const c = document.createElement("div");
      c.className = "cell";
      c.textContent = sym.e;
      el.appendChild(c);
    });
    // paksa reflow supaya transition berikutnya berjalan
    void el.offsetHeight;
    const targetIndex = STRIP_LEN; // index simbol payline (posisi tengah triplet akhir)
    const offset = targetIndex * ROWH;
    el.style.transition = "transform " + durationMs + "ms cubic-bezier(.17,.67,.32,1.02)";
    el.style.transform = "translateY(-" + offset + "px)";
    setTimeout(function(){ el.classList.remove("blur"); }, durationMs * 0.75);
  }

  function evaluate(symbols){
    const [a,b,c] = symbols;
    if (a.k === b.k && b.k === c.k){
      return { type:"triple", symbol:a, mult:a.pay };
    }
    const cherries = symbols.filter(function(s){ return s.k === "cherry"; }).length;
    if (cherries >= 2){
      return { type:"pair", symbol:SYMBOLS[0], mult:1 };
    }
    return { type:"none", mult:0 };
  }

  function pushHistory(entry){
    history.unshift(entry);
    if (history.length > 20) history.pop();
  }

  function spin(){
    if (spinning) return;
    if (balance < bet){ setStatus("💸 Saldo tidak cukup. Kurangi taruhan atau reset saldo."); return; }
    spinning = true;
    balance -= bet;
    renderTop();
    setStatus("🎰 Menggulung reel...");
    reelWins.forEach(function(rw){ rw.classList.remove("winGlow"); });

    const finals = [pickSymbol(mode), pickSymbol(mode), pickSymbol(mode)];
    const durations = [900, 1150, 1400];
    reelEls.forEach(function(el, i){
      sndTick();
      buildSpinStrip(el, finals[i], durations[i]);
      setTimeout(function(){ sndStop(); }, durations[i]);
    });

    setTimeout(function(){
      spinning = false;
      const result = evaluate(finals);
      spinsCount++;
      const win = result.mult * bet;

      // sedikit menyumbang ke jackpot progresif tiap spin (visual saja)
      jackpotPool += Math.round(bet * 0.02);

      if (result.mult > 0){
        balance += win;
        totalWin += win;
        if (win > bestWin) bestWin = win;
        reelWins.forEach(function(rw){ rw.classList.add("winGlow"); });
      }

      if (result.type === "triple" && result.symbol.k === "seven"){
        jackpotPool = Math.round(jackpotPool * 0.4) + 5000;
        setStatus("🎉💎 JACKPOT 777! Kamu menang " + fmt(win) + " koin!");
        sndJackpot();
      } else if (result.mult > 0){
        setStatus("✨ Menang! +" + fmt(win) + " koin (" + (result.type === "triple" ? "3x " + result.symbol.e : "2x 🍒") + ")");
        sndWin();
      } else {
        setStatus(randPick([
          "Belum beruntung, coba lagi! 🍀",
          "Dikit lagi! Ayo spin sekali lagi.",
          "Reel belum berpihak. Semangat!"
        ]));
        sndLose();
      }

      pushHistory({ bet:bet, win:win, mode:mode, symbols:finals.map(function(s){return s.e;}).join(" ") });
      renderTop();
    }, Math.max.apply(null, durations) + 60);
  }

  function randPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function openModeSheet(){
    sheet.innerHTML = "";
    const head = document.createElement("div");
    head.className = "sheetHead";
    head.textContent = "PILIH MODE (RTP TRANSPARAN)";
    sheet.appendChild(head);
    MODE_ORDER.forEach(function(key){
      const d = MODES[key];
      const opt = document.createElement("div");
      opt.className = "opt" + (key === mode ? " active" : "");
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = d.color;
      const info = document.createElement("span");
      info.className = "info";
      info.innerHTML = "<div>" + d.label + " &nbsp;<span style='color:" + d.color + ";font-weight:800'>" + d.rtp + "</span></div><div class='sub'>" + d.desc + "</div>";
      opt.appendChild(dot);
      opt.appendChild(info);
      opt.addEventListener("pointerdown", function(e){
        e.preventDefault();
        mode = key;
        sndClick();
        closeSheet();
        renderTop();
        setStatus("Mode diganti ke " + d.label + " (" + d.rtp + ").");
      });
      sheet.appendChild(opt);
    });
    overlay.classList.add("open");
  }

  function openPayTable(){
    sheet.innerHTML = "";
    const head = document.createElement("div");
    head.className = "sheetHead";
    head.textContent = "TABEL KEMENANGAN (x TARUHAN)";
    sheet.appendChild(head);
    SYMBOLS.slice().reverse().forEach(function(s){
      const row = document.createElement("div");
      row.className = "payRow";
      row.innerHTML = "<span class='sym'>" + s.e + s.e + s.e + "</span><span class='mult'>" + s.pay + "x</span>";
      sheet.appendChild(row);
    });
    const row2 = document.createElement("div");
    row2.className = "payRow";
    row2.innerHTML = "<span class='sym'>🍒🍒 + acak</span><span class='mult'>1x</span>";
    sheet.appendChild(row2);
    overlay.classList.add("open");
  }

  function openHistory(){
    sheet.innerHTML = "";
    const head = document.createElement("div");
    head.className = "sheetHead";
    head.textContent = "RIWAYAT SPIN TERAKHIR";
    sheet.appendChild(head);
    if (history.length === 0){
      const empty = document.createElement("div");
      empty.className = "histRow";
      empty.textContent = "Belum ada riwayat.";
      sheet.appendChild(empty);
    }
    history.forEach(function(h){
      const row = document.createElement("div");
      row.className = "histRow";
      const resultTxt = h.win > 0 ? "<span class='w'>+" + fmt(h.win) + "</span>" : "<span class='l'>-" + fmt(h.bet) + "</span>";
      row.innerHTML = "<span>" + h.symbols + "</span><span>" + resultTxt + "</span>";
      sheet.appendChild(row);
    });
    overlay.classList.add("open");
  }

  function closeSheet(){ overlay.classList.remove("open"); }

  function changeBet(delta){
    bet = Math.max(50, Math.min(5000, bet + delta));
    sndClick();
    renderTop();
  }

  diffBtn.addEventListener("pointerdown", function(e){ e.preventDefault(); openModeSheet(); });
  payBtn.addEventListener("pointerdown", function(e){ e.preventDefault(); sndClick(); openPayTable(); });
  histBtn.addEventListener("pointerdown", function(e){ e.preventDefault(); sndClick(); openHistory(); });
  overlay.addEventListener("pointerdown", function(e){ if (e.target === overlay) closeSheet(); });
  document.getElementById("betMinus").addEventListener("pointerdown", function(e){ e.preventDefault(); changeBet(-50); });
  document.getElementById("betPlus").addEventListener("pointerdown", function(e){ e.preventDefault(); changeBet(50); });
  document.querySelectorAll(".chip").forEach(function(ch){
    ch.addEventListener("pointerdown", function(e){
      e.preventDefault();
      bet = Math.min(5000, parseInt(ch.getAttribute("data-v"), 10));
      sndClick();
      renderTop();
    });
  });
  maxBtn.addEventListener("pointerdown", function(e){
    e.preventDefault();
    bet = Math.max(50, Math.min(5000, balance));
    sndClick();
    renderTop();
  });
  spinBtn.addEventListener("pointerdown", function(e){ e.preventDefault(); spin(); });

  balPill.addEventListener("pointerdown", function(e){
    if (balance <= 0){
      e.preventDefault();
      balance = 5000;
      sndClick();
      setStatus("💰 Saldo virtual di-reset ke 5000 koin.");
      renderTop();
    }
  });

  initReels();
  renderTop();
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
                messageText: "🎰 Hitoshi Slot"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(
                JSON.stringify({
                  response_id: "shorekeeper-slot-" + Date.now(),
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

handler.command = ["slot", "slotmachine", "gameslot"];
handler.help = ["slot"];
handler.tags = ["game"];

module.exports = handler;
