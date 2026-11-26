/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

let handler = async (m, { shorekeeper, Reply, isRegistered, isCreator, isPremium, checkLimit, addLimit }) => {
  if (!isRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi);
  if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit);
  addLimit(m.sender, isPremium, isCreator);

  await shorekeeper.sendMessage(m.chat, { react: { text: "🀄", key: m.key } });

  const html = `<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
body{margin:0;padding:10px;background:radial-gradient(120% 100% at 50% -10%,#1a0f2e 0%,#0a0714 55%,#050308 100%);font-family:'Inter',Arial,sans-serif;color:#f1e9ff;touch-action:manipulation;cursor:pointer;display:flex;justify-content:center}
.container{width:100%;max-width:520px;margin:auto;position:relative}
.card{position:relative;background:linear-gradient(180deg,rgba(32,18,50,.94) 0%,rgba(12,8,22,.97) 100%);border:1px solid rgba(255,190,60,.28);border-radius:24px;overflow:hidden;box-shadow:0 22px 55px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.03) inset}
.lights{position:absolute;left:0;right:0;top:0;height:6px;background:repeating-linear-gradient(90deg,#ffd766 0 10px,transparent 10px 20px,#8dffb0 20px 30px,transparent 30px 40px,#5fd0ff 40px 50px,transparent 50px 60px);opacity:.85;animation:lightsMove 1.4s linear infinite}
@keyframes lightsMove{0%{background-position-x:0}100%{background-position-x:60px}}
.header{position:relative;padding:16px 20px 14px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#28173f,#170e28);border-bottom:1px solid rgba(255,190,60,.2)}
.label{font-size:10px;letter-spacing:2.2px;color:#ffcf7a;font-weight:700;font-family:'Poppins',sans-serif}
.title{font-size:21px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#ffe8a8,#fff6df 40%,#8dffb0);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 1px 6px rgba(255,170,120,.25))}
.pill{font-size:12px;font-weight:800;color:#1a1226;background:linear-gradient(135deg,#ffe9a8,#ffcf6a);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:7px 14px;white-space:nowrap;box-shadow:0 4px 12px rgba(255,190,80,.35);font-family:'Poppins',sans-serif}
.body{padding:14px}
.statusBar{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(90deg,rgba(141,255,176,.14),rgba(255,207,106,.14));border:1px solid rgba(255,190,60,.3);border-radius:12px;padding:10px 12px;margin-bottom:12px;font-family:'Poppins',sans-serif;font-size:12.5px;font-weight:700;color:#ffe6c2;text-align:center;min-height:16px}
.controls{display:flex;gap:8px;margin-bottom:12px}
.ctrlBtn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(145deg,#1e1533,#120c22);border:1px solid rgba(255,190,60,.28);border-radius:14px;padding:10px 6px;color:#f1e9ff;font-size:11.5px;font-weight:700;font-family:'Poppins',sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.35)}
.ctrlBtn:active{transform:scale(.96)}
.ctrlBtn .dot{width:8px;height:8px;border-radius:50%;box-shadow:0 0 8px currentColor;flex-shrink:0}
.sectionLbl{display:flex;justify-content:space-between;align-items:center;padding:0 2px 6px;font-size:10px;letter-spacing:1px;color:rgba(241,233,255,.55);font-weight:700;font-family:'Poppins',sans-serif}
.table{position:relative;padding:12px 10px;border-radius:20px;background:linear-gradient(155deg,#123d1f,#0a2413);box-shadow:0 14px 34px rgba(0,0,0,.6),0 0 0 1px rgba(255,190,60,.25)}
.aiRow{display:flex;justify-content:center;gap:4px;margin-bottom:10px;flex-wrap:wrap;min-height:40px}
.boardWrap{background:#0a0710;border-radius:14px;padding:10px 6px;box-shadow:0 4px 18px rgba(0,0,0,.6) inset;border:1px solid rgba(0,0,0,.5);display:flex;align-items:center;gap:6px}
.boardScroll{flex:1;display:flex;gap:3px;overflow-x:auto;padding:4px 2px;scrollbar-width:none}
.boardScroll::-webkit-scrollbar{display:none}
.boardHint{flex:1;text-align:center;font-size:11px;color:rgba(241,233,255,.35);padding:20px 0}
.endTag{flex:0 0 auto;font-size:11px;font-weight:800;color:#8dffb0;background:rgba(141,255,176,.1);border:1px solid rgba(141,255,176,.35);border-radius:8px;padding:3px 7px;font-family:'Poppins',sans-serif}
.lastMoveBar{text-align:center;font-size:11.5px;font-weight:700;color:#ffe0a3;margin:-4px 0 10px;min-height:14px}
.domino.newest{box-shadow:0 0 0 2px #ffd766,0 0 10px rgba(255,215,102,.7),0 3px 6px rgba(0,0,0,.4)}
.boneRow{display:flex;justify-content:center;margin-top:10px}
.boneyard{display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(241,233,255,.6);font-weight:700}
.domino{position:relative;display:flex;flex-direction:column;width:30px;height:56px;flex:0 0 auto;background:linear-gradient(180deg,#fdf6e3,#f0e4c4);border-radius:6px;border:1px solid #b89b5e;box-shadow:0 3px 6px rgba(0,0,0,.4);overflow:hidden}
.domino.lg{width:46px;height:88px}
.domino.double{border-color:#ffcf6a;box-shadow:0 0 8px rgba(255,190,60,.55),0 3px 6px rgba(0,0,0,.4)}
.domino .mid{height:2px;margin:0 4px;background:#b89b5e}
.half{flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:2px;padding:5px}
.dot{border-radius:50%}
.dot.on{background:#241a12;box-shadow:inset 0 1px 1px rgba(0,0,0,.35)}
.tileBack{width:22px;height:40px;flex:0 0 auto;border-radius:5px;background:linear-gradient(155deg,#3a2a1a,#1c1408);border:1px solid rgba(255,190,60,.4);box-shadow:0 2px 5px rgba(0,0,0,.4)}
.tileBack::after{content:"";display:block;margin:6px auto 0;width:10px;height:10px;border-radius:50%;background:rgba(255,190,60,.3)}
.handWrap{margin-top:12px}
.handScroll{display:flex;gap:8px;overflow-x:auto;padding:6px 2px 10px;scrollbar-width:none}
.handScroll::-webkit-scrollbar{display:none}
.handTile{background:none;border:none;padding:0;position:relative;border-radius:8px;flex:0 0 auto}
.handTile.playable .domino{animation:pulseGlow 1s ease-in-out infinite alternate}
.handTile.selected .domino{outline:2px solid #5fd0ff;outline-offset:2px}
@keyframes pulseGlow{0%{box-shadow:0 0 0 rgba(141,255,176,0),0 3px 6px rgba(0,0,0,.4)}100%{box-shadow:0 0 10px rgba(141,255,176,.65),0 3px 6px rgba(0,0,0,.4)}}
.handTile:active{transform:scale(.94)}
.handTile.shake{animation:shakeTile .35s}
@keyframes shakeTile{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.chooseBar{display:none;align-items:center;gap:8px;background:linear-gradient(90deg,rgba(95,208,255,.16),rgba(141,255,176,.1));border:1px solid rgba(95,208,255,.4);border-radius:14px;padding:9px 10px;margin-top:10px}
.chooseBar.show{display:flex}
.chooseBar .cLbl{font-size:11px;font-weight:700;color:#bfe9ff;flex-shrink:0}
.sideBtn{flex:1;border:1px solid rgba(95,208,255,.45);border-radius:10px;padding:9px 4px;font-size:12px;font-weight:800;font-family:'Poppins',sans-serif;color:#0d2b16;background:linear-gradient(135deg,#bfe9ff,#8dffb0)}
.sideBtn:active{transform:scale(.95)}
.sideBtn.cancel{background:linear-gradient(145deg,#241a3d,#150f28);color:#ffb3b3;border-color:rgba(255,150,150,.4);flex:0 0 64px}
.actionRow{display:flex;gap:8px;margin-top:10px}
.actBtn{flex:1;border:1px solid rgba(255,190,60,.3);border-radius:14px;padding:11px;color:#ffe0a3;font-size:12.5px;font-weight:700;font-family:'Poppins',sans-serif;background:linear-gradient(145deg,#1e1533,#120c22)}
.actBtn:disabled{opacity:.35}
.actBtn:active:not(:disabled){transform:scale(.96)}
.betRow{display:flex;align-items:center;gap:8px;margin-top:12px;background:linear-gradient(145deg,#1e1533,#120c22);border:1px solid rgba(255,190,60,.22);border-radius:14px;padding:9px 10px}
.betRow .betLbl{font-size:10px;color:rgba(241,233,255,.55);letter-spacing:.5px;font-weight:700}
.betRow .betVal{flex:1;text-align:center;font-size:17px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#ffe8a8,#ffcf6a);-webkit-background-clip:text;background-clip:text;color:transparent}
.stepBtn{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,190,60,.3);background:linear-gradient(145deg,#241a3d,#150f28);color:#ffe0a3;font-size:18px;font-weight:800;display:flex;align-items:center;justify-content:center}
.stepBtn:active{transform:scale(.92)}
.chips{display:flex;gap:6px;margin-top:8px}
.chip{flex:1;text-align:center;padding:7px 0;border-radius:10px;font-size:11.5px;font-weight:700;color:#1a1226;background:linear-gradient(135deg,#f4e2a8,#d9b465);box-shadow:0 3px 8px rgba(217,180,101,.35)}
.chip.alt{background:linear-gradient(135deg,#c9c9e8,#8f8fbf);color:#1a1226}
.mainBtn{width:100%;margin-top:12px;border:none;border-radius:16px;padding:15px;color:#0d2b16;font-size:16px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#ffe8a8,#ffcf6a 45%,#8dffb0);box-shadow:0 8px 20px rgba(120,220,160,.35),0 1px 0 rgba(255,255,255,.5) inset;letter-spacing:.5px}
.mainBtn:active{transform:scale(.97)}
.mainBtn:disabled{opacity:.45;filter:grayscale(.4)}
.stats{display:flex;gap:8px;margin-top:12px}
.statBox{flex:1;background:linear-gradient(145deg,#1e1533,#120c22);border:1px solid rgba(255,190,60,.2);border-radius:13px;padding:9px 4px;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.3)}
.statBox .val{font-size:15px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#ffe8a8,#8dffb0);-webkit-background-clip:text;background-clip:text;color:transparent}
.statBox .lbl{font-size:9.5px;color:rgba(241,233,255,.5);margin-top:2px;letter-spacing:.4px}
.footnote{text-align:center;font-size:10px;color:rgba(241,233,255,.4);margin-top:10px;line-height:1.5}
.overlay{position:absolute;inset:0;background:rgba(6,3,14,.82);display:none;align-items:flex-end;justify-content:center;z-index:50;border-radius:24px;overflow:hidden}
.overlay.open{display:flex}
.sheet{width:100%;max-width:520px;max-height:78vh;overflow-y:auto;background:linear-gradient(180deg,#241735,#130d24);border-radius:20px 20px 0 0;border:1px solid rgba(255,190,60,.3);box-shadow:0 -10px 30px rgba(0,0,0,.5)}
.sheetHead{padding:14px 18px;font-size:13px;font-weight:800;color:#ffcf7a;font-family:'Poppins',sans-serif;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,.08)}
.ruleItem{padding:12px 18px;font-size:12.5px;line-height:1.6;color:rgba(241,233,255,.85);border-bottom:1px solid rgba(255,255,255,.06)}
.opt{display:flex;align-items:center;gap:12px;padding:14px 18px;font-size:14px;font-weight:600;color:#f1e9ff;border-bottom:1px solid rgba(255,255,255,.06)}
.opt .dot{width:12px;height:12px;border-radius:50%;box-shadow:0 0 8px currentColor;flex-shrink:0}
.opt .info{flex:1}
.opt .sub{font-size:10.5px;color:rgba(241,233,255,.5);margin-top:2px}
.opt.active{background:linear-gradient(90deg,rgba(255,190,60,.16),transparent)}
.histRow{display:flex;align-items:center;justify-content:space-between;padding:9px 18px;font-size:12.5px;border-bottom:1px solid rgba(255,255,255,.06);color:rgba(241,233,255,.8)}
.histRow .w{color:#8dffb0;font-weight:700}
.histRow .l{color:#ff9a9a;font-weight:700}
.histRow .d{color:#ffe0a3;font-weight:700}
</style>
<body>
<div class="container">
<div class="card">
  <div class="lights"></div>
  <div class="header">
    <div>
      <div class="label">Hitoshi MD GAME</div>
      <div class="title">🀄 Hitoshi Gaple</div>
    </div>
    <div id="balPill" class="pill">💰 5000</div>
  </div>
  <div class="body">
    <div class="statusBar" id="statusBar">Pilih tingkat kesulitan, atur taruhan, lalu tekan MULAI.</div>
    <div class="lastMoveBar" id="lastMoveBar"></div>
    <div class="controls">
      <button id="diffBtn" class="ctrlBtn"><span class="dot" id="diffDot" style="background:#5fd0ff"></span><span id="diffLabel">Normal</span></button>
      <button id="ruleBtn" class="ctrlBtn">📜 Aturan</button>
      <button id="histBtn" class="ctrlBtn">🕘 Riwayat</button>
    </div>
    <div class="table">
      <div class="sectionLbl"><span>🤖 KARTU AI</span><span id="aiCount">- kartu</span></div>
      <div class="aiRow" id="aiRow"></div>
      <div class="boardWrap">
        <span class="endTag" id="leftEndTag">-</span>
        <div class="boardScroll" id="boardScroll"><div class="boardHint" id="boardHint">Papan masih kosong</div></div>
        <span class="endTag" id="rightEndTag">-</span>
      </div>
      <div class="boneRow"><div class="boneyard">🂠 Sisa tumpukan: <span id="boneCount">-</span></div></div>
    </div>
    <div class="handWrap">
      <div class="sectionLbl"><span>🎴 KARTUMU</span><span id="handCount">- kartu</span></div>
      <div class="handScroll" id="handScroll"></div>
    </div>
    <div class="chooseBar" id="chooseBar">
      <span class="cLbl">Pasang di:</span>
      <button class="sideBtn" id="sideLeftBtn">◀ KIRI</button>
      <button class="sideBtn" id="sideRightBtn">KANAN ▶</button>
      <button class="sideBtn cancel" id="sideCancelBtn">Batal</button>
    </div>
    <div class="actionRow">
      <button id="drawBtn" class="actBtn" disabled>🂠 Ambil Kartu</button>
      <button id="passBtn" class="actBtn" disabled>⏭ Pass</button>
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
    <button id="mainBtn" class="mainBtn">🀄 MULAI PERMAINAN</button>
    <div class="stats">
      <div class="statBox"><div class="val" id="statGames">0</div><div class="lbl">Main</div></div>
      <div class="statBox"><div class="val" id="statWin">0</div><div class="lbl">Total Menang</div></div>
      <div class="statBox"><div class="val" id="statBest">0</div><div class="lbl">Menang Terbesar</div></div>
    </div>
    <div class="footnote">🎮 Hiburan koin virtual, tidak bisa ditukar uang asli. Bermain sewajarnya.</div>
  </div>
</div>
<div class="overlay" id="overlay"><div class="sheet" id="sheet"></div></div>
</div>
<script>
(function(){
  var DIFF = {
    easy:   { label:'Mudah',  color:'#8dffb0', mult:1.8, desc:'AI memilih kartu secara acak. Cocok untuk pemula. Menang membayar 1.8x taruhan.' },
    normal: { label:'Normal', color:'#5fd0ff', mult:2,   desc:'AI bermain wajar, memasang kartu cocok pertama yang ditemukan. Menang membayar 2x taruhan.' },
    hard:   { label:'Sulit',  color:'#ff5fae', mult:2.5, desc:'AI bermain strategis: mendahulukan kartu ganda dan kartu berat. Menang membayar 2.5x taruhan.' }
  };
  var difficulty = 'normal';
  var balance = 5000, bet = 100;
  var deck=[], playerHand=[], aiHand=[], boneyard=[], board=[];
  var leftEnd=null, rightEnd=null, turn='player', gameActive=false, passStreak=0;
  var stats = { games:0, totalWin:0, best:0 };
  var history = [];
  var pendingIdx = -1;
  var lastMove = null;

  var balPill=document.getElementById('balPill'), betVal=document.getElementById('betVal');
  var statusBar=document.getElementById('statusBar'), mainBtn=document.getElementById('mainBtn');
  var drawBtn=document.getElementById('drawBtn'), passBtn=document.getElementById('passBtn');
  var handScroll=document.getElementById('handScroll'), aiRow=document.getElementById('aiRow');
  var boardScroll=document.getElementById('boardScroll'), leftEndTag=document.getElementById('leftEndTag');
  var rightEndTag=document.getElementById('rightEndTag'), boneCount=document.getElementById('boneCount');
  var aiCount=document.getElementById('aiCount'), handCount=document.getElementById('handCount');
  var overlay=document.getElementById('overlay'), sheet=document.getElementById('sheet');
  var diffBtn=document.getElementById('diffBtn'), diffDot=document.getElementById('diffDot'), diffLabel=document.getElementById('diffLabel');
  var chooseBar=document.getElementById('chooseBar');
  var lastMoveBar=document.getElementById('lastMoveBar');

  function fmt(n){ return Math.round(n).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g,'.'); }
  function setStatus(t){ statusBar.textContent = t; }

  var PATTERNS = {0:[],1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
  function pipHTML(n){
    var p = PATTERNS[n] || [];
    var html = '';
    for (var i=1;i<=9;i++){ html += '<span class="dot' + (p.indexOf(i)>-1?' on':'') + '"></span>'; }
    return html;
  }
  function dominoHTML(a,b,big,newest){
    var cls = 'domino' + (big?' lg':'') + (a===b?' double':'') + (newest?' newest':'');
    return '<div class="' + cls + '"><div class="half">' + pipHTML(a) + '</div><div class="mid"></div><div class="half">' + pipHTML(b) + '</div></div>';
  }

  function createDeck(){
    var d = [];
    for (var i=0;i<=6;i++){ for (var j=i;j<=6;j++){ d.push({a:i,b:j}); } }
    return d;
  }
  function shuffle(arr){
    for (var i=arr.length-1;i>0;i--){
      var j = Math.floor(Math.random()*(i+1));
      var tmp = arr[i]; arr[i]=arr[j]; arr[j]=tmp;
    }
    return arr;
  }
  function sumHand(hand){ return hand.reduce(function(s,t){ return s+t.a+t.b; },0); }

  function fitsLeft(t){ return t.a===leftEnd || t.b===leftEnd; }
  function fitsRight(t){ return t.a===rightEnd || t.b===rightEnd; }

  function determineStarter(){
    function highestDouble(hand){
      var best=-1;
      hand.forEach(function(t){ if (t.a===t.b && t.a>best) best=t.a; });
      return best;
    }
    var pd = highestDouble(playerHand), ad = highestDouble(aiHand);
    if (pd>=0 || ad>=0) return pd>=ad ? 'player' : 'ai';
    return sumHand(playerHand)<=sumHand(aiHand) ? 'player' : 'ai';
  }

  function hasPlayable(hand){
    if (board.length===0) return hand.length>0;
    return hand.some(function(t){ return fitsLeft(t) || fitsRight(t); });
  }

  function doPlace(side, tile, by){
    if (side==='start'){ board.push({a:tile.a,b:tile.b}); leftEnd=tile.a; rightEnd=tile.b; }
    else if (side==='right'){
      if (tile.a===rightEnd){ board.push({a:tile.a,b:tile.b}); rightEnd=tile.b; }
      else { board.push({a:tile.b,b:tile.a}); rightEnd=tile.a; }
    } else {
      if (tile.b===leftEnd){ board.unshift({a:tile.a,b:tile.b}); leftEnd=tile.a; }
      else { board.unshift({a:tile.b,b:tile.a}); leftEnd=tile.b; }
    }
    lastMove = { a:tile.a, b:tile.b, side:side, by:by, pos: (side==='left') ? 'first' : 'last' };
  }

  function closeChoose(){ pendingIdx=-1; chooseBar.classList.remove('show'); }

  function renderAll(){
    balPill.textContent = '💰 ' + fmt(balance);
    betVal.textContent = fmt(bet);
    diffDot.style.background = DIFF[difficulty].color;
    diffLabel.textContent = DIFF[difficulty].label;
    document.getElementById('statGames').textContent = stats.games;
    document.getElementById('statWin').textContent = fmt(stats.totalWin);
    document.getElementById('statBest').textContent = fmt(stats.best);

    aiRow.innerHTML = '';
    for (var k=0;k<aiHand.length;k++){ aiRow.innerHTML += '<div class="tileBack"></div>'; }
    aiCount.textContent = (gameActive ? aiHand.length : '-') + ' kartu';

    boardScroll.innerHTML = '';
    if (board.length===0){
      boardScroll.innerHTML = '<div class="boardHint">Papan masih kosong</div>';
    } else {
      board.forEach(function(t,i){
        var isNewest = lastMove && ((lastMove.pos==='first' && i===0) || (lastMove.pos!=='first' && i===board.length-1));
        boardScroll.innerHTML += dominoHTML(t.a,t.b,false,isNewest);
      });
    }
    leftEndTag.textContent = leftEnd===null ? '-' : leftEnd;
    rightEndTag.textContent = rightEnd===null ? '-' : rightEnd;
    boneCount.textContent = gameActive ? boneyard.length : '-';

    if (lastMove){
      var who = lastMove.by==='player' ? 'Kamu' : 'AI';
      var sideTxt = lastMove.side==='start' ? 'kartu pembuka' : ('sisi ' + (lastMove.side==='left' ? 'kiri' : 'kanan'));
      lastMoveBar.textContent = '🔎 Terakhir: ' + who + ' memasang [' + lastMove.a + '|' + lastMove.b + '] di ' + sideTxt;
    } else {
      lastMoveBar.textContent = '';
    }

    handScroll.innerHTML = '';
    handCount.textContent = (gameActive ? playerHand.length : '-') + ' kartu';
    playerHand.forEach(function(t,idx){
      var playable = gameActive && turn==='player' && (board.length===0 || fitsLeft(t) || fitsRight(t));
      var btn = document.createElement('button');
      btn.className = 'handTile' + (playable?' playable':'') + (idx===pendingIdx?' selected':'');
      btn.innerHTML = dominoHTML(t.a,t.b,true);
      btn.dataset.idx = idx;
      btn.addEventListener('click', function(e){ e.preventDefault(); onHandTap(parseInt(this.dataset.idx,10), this); });
      handScroll.appendChild(btn);
    });

    var canDraw = gameActive && turn==='player' && pendingIdx===-1 && !hasPlayable(playerHand) && boneyard.length>0;
    var canPass = gameActive && turn==='player' && pendingIdx===-1 && !hasPlayable(playerHand) && boneyard.length===0;
    drawBtn.disabled = !canDraw;
    passBtn.disabled = !canPass;
    mainBtn.disabled = gameActive;
    mainBtn.textContent = gameActive ? '🎲 PERMAINAN BERLANGSUNG...' : '🀄 MULAI PERMAINAN';

    boardScroll.scrollLeft = boardScroll.scrollWidth;
  }

  function playTile(idx, side){
    var tile = playerHand[idx];
    doPlace(side, tile, 'player');
    playerHand.splice(idx,1);
    passStreak = 0;
    closeChoose();
    if (playerHand.length===0){ renderAll(); endRound('player'); return; }
    turn='ai';
    setStatus('🤖 Giliran AI...');
    renderAll();
    setTimeout(aiTurn, 700);
  }

  function onHandTap(idx, el){
    if (!gameActive || turn!=='player') return;
    if (pendingIdx===idx){ closeChoose(); renderAll(); return; }
    var tile = playerHand[idx];
    var canLeft = board.length===0 || fitsLeft(tile);
    var canRight = board.length===0 || fitsRight(tile);
    if (!canLeft && !canRight){
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      setStatus('❌ Kartu itu tidak cocok dengan ujung manapun.');
      return;
    }
    if (board.length===0){ playTile(idx, 'start'); return; }
    if (canLeft && canRight){
      pendingIdx = idx;
      setStatus('👉 Kartu ini cocok di dua sisi, pilih mau dipasang di mana.');
      chooseBar.classList.add('show');
      renderAll();
      return;
    }
    playTile(idx, canRight ? 'right' : 'left');
  }

  document.getElementById('sideLeftBtn').addEventListener('click', function(e){ e.preventDefault(); if (pendingIdx>-1) playTile(pendingIdx,'left'); });
  document.getElementById('sideRightBtn').addEventListener('click', function(e){ e.preventDefault(); if (pendingIdx>-1) playTile(pendingIdx,'right'); });
  document.getElementById('sideCancelBtn').addEventListener('click', function(e){ e.preventDefault(); closeChoose(); renderAll(); });

  function pickAiIndex(){
    var candidates = [];
    if (board.length===0){ if (aiHand.length>0) candidates.push(0); return candidates.length? candidates[0] : -1; }
    for (var i=0;i<aiHand.length;i++){
      if (fitsLeft(aiHand[i]) || fitsRight(aiHand[i])) candidates.push(i);
    }
    if (candidates.length===0) return -1;
    if (difficulty==='easy'){
      return candidates[Math.floor(Math.random()*candidates.length)];
    }
    if (difficulty==='hard'){
      candidates.sort(function(ia,ib){
        var ta=aiHand[ia], tb=aiHand[ib];
        var da = ta.a===ta.b ? 1 : 0, db = tb.a===tb.b ? 1 : 0;
        if (da!==db) return db-da;
        return (tb.a+tb.b) - (ta.a+ta.b);
      });
      return candidates[0];
    }
    return candidates[0];
  }

  function aiTurn(){
    if (!gameActive) return;
    var idx = pickAiIndex();
    while (idx===-1 && boneyard.length>0){
      aiHand.push(boneyard.pop());
      idx = pickAiIndex();
    }
    if (idx===-1){
      passStreak++;
      setStatus('🤖 AI tidak punya kartu cocok dan pass.');
      renderAll();
      if (passStreak>=2){ endRound('blocked'); return; }
      turn='player';
      setStatus('🎲 Giliranmu!');
      renderAll();
      return;
    }
    var tile = aiHand[idx];
    var side;
    if (board.length===0) side='start';
    else side = fitsRight(tile) ? 'right' : 'left';
    doPlace(side, tile, 'ai');
    aiHand.splice(idx,1);
    passStreak = 0;
    if (aiHand.length===0){ renderAll(); endRound('ai'); return; }
    turn='player';
    setStatus('🎲 Giliranmu!');
    renderAll();
  }

  function endRound(winner){
    gameActive = false;
    closeChoose();
    stats.games++;
    var mult = DIFF[difficulty].mult;
    var resultTag, profit=0;
    if (winner==='player'){
      profit = Math.round(bet*(mult-1));
      balance += bet + profit;
      resultTag='w';
      setStatus('🎉 Menang! Kartumu habis duluan. +' + fmt(profit) + ' koin');
    } else if (winner==='ai'){
      resultTag='l';
      setStatus('😢 Kalah. AI menghabiskan kartu duluan. -' + fmt(bet) + ' koin');
    } else {
      var pSum = sumHand(playerHand), aSum = sumHand(aiHand);
      if (pSum<aSum){
        profit = Math.round(bet*(mult-1));
        balance += bet + profit;
        resultTag='w';
        setStatus('🔒 Buntu! Sisa kartumu lebih sedikit, kamu menang +' + fmt(profit) + ' koin');
      } else if (pSum>aSum){
        resultTag='l';
        setStatus('🔒 Buntu! Sisa kartu AI lebih sedikit, kamu kalah -' + fmt(bet) + ' koin');
      } else {
        balance += bet;
        resultTag='d';
        setStatus('🔒 Buntu dan seri, taruhan dikembalikan.');
      }
    }
    if (profit>stats.best) stats.best = profit;
    stats.totalWin += profit;
    history.unshift({ tag:resultTag, bet:bet, profit:profit });
    if (history.length>15) history.pop();
    renderAll();
  }

  function startRound(){
    if (gameActive) return;
    if (balance<bet){ setStatus('💸 Saldo tidak cukup untuk taruhan ini.'); return; }
    balance -= bet;
    deck = shuffle(createDeck());
    playerHand = deck.slice(0,7);
    aiHand = deck.slice(7,14);
    boneyard = deck.slice(14);
    board = []; leftEnd=null; rightEnd=null; passStreak=0; gameActive=true; lastMove=null;
    var starter = determineStarter();
    if (starter==='ai'){
      turn='ai';
      setStatus('🤖 AI mulai duluan...');
      renderAll();
      setTimeout(aiTurn, 700);
    } else {
      turn='player';
      setStatus('🎲 Kamu mulai duluan! Ketuk salah satu kartu.');
      renderAll();
    }
  }

  function openDiffSheet(){
    sheet.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'sheetHead';
    head.textContent = 'TINGKAT KESULITAN';
    sheet.appendChild(head);
    Object.keys(DIFF).forEach(function(key){
      var d = DIFF[key];
      var row = document.createElement('div');
      row.className = 'opt' + (key===difficulty ? ' active' : '');
      row.innerHTML = '<span class="dot" style="background:' + d.color + '"></span><div class="info"><div>' + d.label + '</div><div class="sub">' + d.desc + '</div></div>';
      row.addEventListener('click', function(e){
        e.preventDefault();
        if (gameActive){ setStatus('⚠️ Tidak bisa ganti tingkat saat permainan berlangsung.'); closeSheet(); return; }
        difficulty = key;
        closeSheet();
        renderAll();
      });
      sheet.appendChild(row);
    });
    overlay.classList.add('open');
  }

  function openRules(){
    sheet.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'sheetHead';
    head.textContent = 'ATURAN GAPLE';
    sheet.appendChild(head);
    var rules = [
      'Kamu dan AI masing-masing mendapat 7 kartu domino dari total 28 kartu.',
      'Kartu bergiliran dipasang di ujung kiri atau kanan papan, mengikuti angka yang sama.',
      'Jika kartu di tanganmu cocok di dua sisi sekaligus, kamu akan diminta memilih mau dipasang di kiri atau kanan.',
      'Jika tidak punya kartu cocok, ambil kartu dari tumpukan sisa sampai dapat kartu yang cocok.',
      'Jika tumpukan sisa habis dan tetap tidak ada kartu cocok, kamu harus pass.',
      'Menang jika kartumu habis duluan. Jika permainan buntu (kedua pemain pass berturut-turut), pemenang adalah yang jumlah angka sisa kartunya paling sedikit.',
      'Besar kemenangan mengikuti tingkat kesulitan yang dipilih sebelum MULAI: Mudah 1.8x, Normal 2x, Sulit 2.5x taruhan.'
    ];
    rules.forEach(function(r){
      var row = document.createElement('div');
      row.className = 'ruleItem';
      row.textContent = '• ' + r;
      sheet.appendChild(row);
    });
    overlay.classList.add('open');
  }

  function openHistory(){
    sheet.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'sheetHead';
    head.textContent = 'RIWAYAT PERMAINAN TERAKHIR';
    sheet.appendChild(head);
    if (history.length===0){
      var empty = document.createElement('div');
      empty.className = 'histRow';
      empty.textContent = 'Belum ada riwayat.';
      sheet.appendChild(empty);
    }
    history.forEach(function(h){
      var row = document.createElement('div');
      row.className = 'histRow';
      var txt = h.tag==='w' ? '<span class="w">+' + fmt(h.profit) + '</span>' : (h.tag==='l' ? '<span class="l">-' + fmt(h.bet) + '</span>' : '<span class="d">Seri</span>');
      row.innerHTML = '<span>Taruhan ' + fmt(h.bet) + '</span><span>' + txt + '</span>';
      sheet.appendChild(row);
    });
    overlay.classList.add('open');
  }

  function closeSheet(){ overlay.classList.remove('open'); }

  function changeBet(delta){
    bet = Math.max(50, Math.min(5000, bet + delta));
    renderAll();
  }

  diffBtn.addEventListener('click', function(e){ e.preventDefault(); openDiffSheet(); });
  document.getElementById('ruleBtn').addEventListener('click', function(e){ e.preventDefault(); openRules(); });
  document.getElementById('histBtn').addEventListener('click', function(e){ e.preventDefault(); openHistory(); });
  overlay.addEventListener('click', function(e){ if (e.target===overlay) closeSheet(); });
  document.getElementById('betMinus').addEventListener('click', function(e){ e.preventDefault(); if (!gameActive) changeBet(-50); });
  document.getElementById('betPlus').addEventListener('click', function(e){ e.preventDefault(); if (!gameActive) changeBet(50); });
  document.querySelectorAll('.chip').forEach(function(ch){
    ch.addEventListener('click', function(e){
      e.preventDefault();
      if (gameActive) return;
      bet = Math.min(5000, parseInt(ch.getAttribute('data-v'),10));
      renderAll();
    });
  });
  drawBtn.addEventListener('click', function(e){
    e.preventDefault();
    if (drawBtn.disabled) return;
    playerHand.push(boneyard.pop());
    setStatus('🂠 Kamu mengambil satu kartu dari tumpukan.');
    renderAll();
  });
  passBtn.addEventListener('click', function(e){
    e.preventDefault();
    if (passBtn.disabled) return;
    passStreak++;
    setStatus('⏭ Kamu pass.');
    if (passStreak>=2){ renderAll(); endRound('blocked'); return; }
    turn='ai';
    renderAll();
    setTimeout(aiTurn, 700);
  });
  mainBtn.addEventListener('click', function(e){ e.preventDefault(); startRound(); });

  balPill.addEventListener('click', function(e){
    if (balance<=0 && !gameActive){
      e.preventDefault();
      balance = 5000;
      setStatus('💰 Saldo virtual di-reset ke 5000 koin.');
      renderAll();
    }
  });

  renderAll();
})();
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
                messageText: "🀄 Hitoshi Gaple"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(
                JSON.stringify({
                  response_id: "shorekeeper-gaple-" + Date.now(),
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

handler.command = ["gaple", "domino", "dominogame"];
handler.help = ["gaple"];
handler.tags = ["game"];

module.exports = handler;
