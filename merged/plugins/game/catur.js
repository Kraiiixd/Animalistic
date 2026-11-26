/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

let handler = async (m, { shorekeeper, Reply, isRegistered, isCreator, isPremium, checkLimit, addLimit }) => {
  if (!isRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi);
  if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit);
  addLimit(m.sender, isPremium, isCreator);

  await shorekeeper.sendMessage(m.chat, { react: { text: "♟️", key: m.key } });

  const html = `<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
body{margin:0;padding:10px;background:radial-gradient(120% 100% at 50% -10%,#1c1330 0%,#0a0714 55%,#050308 100%);font-family:'Inter',Arial,sans-serif;color:#f1e9ff;touch-action:manipulation;cursor:pointer;display:flex;justify-content:center}
.container{width:100%;max-width:520px;margin:auto}
.card{position:relative;background:linear-gradient(180deg,rgba(30,20,52,.92) 0%,rgba(14,10,26,.96) 100%);border:1px solid rgba(212,175,90,.28);border-radius:22px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.03) inset,0 1px 0 rgba(255,255,255,.06) inset}
.card::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,215,140,.05),transparent 40%,transparent 60%,rgba(147,112,255,.06));pointer-events:none}
.header{position:relative;padding:16px 20px;border-bottom:1px solid rgba(212,175,90,.22);display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#241a3d,#150f28)}
.label{font-size:10px;letter-spacing:2.2px;color:#c9a86a;font-weight:700;font-family:'Poppins',sans-serif}
.title{font-size:21px;font-weight:800;letter-spacing:0.3px;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#f7e4b0,#fff6df 40%,#e0c17e);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 1px 6px rgba(230,190,110,.25))}
.pill{font-size:11.5px;font-weight:700;color:#1a1226;background:linear-gradient(135deg,#f4e2a8,#d9b465);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:7px 14px;white-space:nowrap;box-shadow:0 4px 12px rgba(217,180,101,.35)}
.body{padding:14px}
.controls{display:flex;gap:10px;margin-bottom:12px}
.diffBtn{flex:1;display:flex;align-items:center;gap:8px;background:linear-gradient(145deg,#1c1530,#120c22);border:1px solid rgba(212,175,90,.3);border-radius:14px;padding:11px 13px;color:#f1e9ff;font-size:13.5px;font-weight:700;font-family:'Poppins',sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.35),0 1px 0 rgba(255,255,255,.05) inset;transition:transform .15s ease}
.diffBtn:active{transform:scale(.97)}
.diffBtn .dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;box-shadow:0 0 8px currentColor}
.diffBtn .chev{margin-left:auto;color:#c9a86a;font-size:11px}
.newBtn{flex:1;border:none;border-radius:14px;padding:11px 14px;color:#1a1226;font-size:13.5px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(135deg,#f4e2a8,#d9b465 55%,#c99a4b);box-shadow:0 6px 16px rgba(217,180,101,.4),0 1px 0 rgba(255,255,255,.5) inset;transition:transform .15s ease}
.newBtn:active{transform:scale(.97)}
.boardWrap{position:relative;padding:6px;border-radius:16px;background:linear-gradient(145deg,#3a2a1a,#1a1208);box-shadow:0 12px 30px rgba(0,0,0,.55),0 0 0 1px rgba(212,175,90,.25)}
.board{display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);width:100%;aspect-ratio:1/1;border-radius:11px;overflow:hidden;border:1px solid rgba(0,0,0,.4);box-shadow:0 2px 18px rgba(0,0,0,.5) inset}
.sq{position:relative;display:flex;align-items:center;justify-content:center;transition:background-color .15s ease}
.sq.light{background:linear-gradient(155deg,#f3e2c2,#e8cf9f)}
.sq.dark{background:linear-gradient(155deg,#9a6b41,#7c5330)}
.sq.sel{outline:3px solid #ffd766;outline-offset:-3px;z-index:2;box-shadow:0 0 14px rgba(255,215,102,.55) inset}
.sq.lastfrom{background:linear-gradient(155deg,#e8cf6a,#d8b94f) !important}
.sq.lastto{background:linear-gradient(155deg,#f3dd82,#e3c463) !important}
.sq.chk{background:radial-gradient(circle,#ff6b5e,#c73327) !important;animation:chkPulse 1s ease-in-out infinite}
@keyframes chkPulse{0%,100%{box-shadow:0 0 6px rgba(255,80,60,.5) inset}50%{box-shadow:0 0 20px rgba(255,80,60,.9) inset}}
.sq .coord{position:absolute;font-size:9px;font-weight:700;opacity:.5;pointer-events:none;font-family:'Poppins',sans-serif}
.sq .coordFile{bottom:2px;right:3px}
.sq .coordRank{top:2px;left:3px}
.sq .piece{font-family:"DejaVu Sans","Segoe UI Symbol","Noto Sans Symbols","Arial Unicode MS",sans-serif;font-size:min(7.4vw,33px);line-height:1;user-select:none;pointer-events:none;position:relative;z-index:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))}
.piece.w{color:#fffdf6;-webkit-text-stroke:1px #2a1c08;text-shadow:0 1px 0 #2a1c08,0 -1px 0 #2a1c08,1px 0 0 #2a1c08,-1px 0 0 #2a1c08,0 2px 3px rgba(0,0,0,.4)}
.piece.b{color:#1c1420;-webkit-text-stroke:0.6px #e8d9ff;text-shadow:0 1px 0 rgba(255,255,255,.25),0 2px 4px rgba(0,0,0,.5)}
.dot-target{position:absolute;width:26%;height:26%;border-radius:50%;background:radial-gradient(circle,rgba(147,112,255,.75),rgba(80,50,180,.45));box-shadow:0 0 8px rgba(147,112,255,.6);pointer-events:none}
.dot-target.cap{width:84%;height:84%;background:transparent;border:4px solid rgba(255,90,70,.7);box-shadow:0 0 10px rgba(255,90,70,.5);box-sizing:border-box}
.stats{display:flex;gap:8px;margin-top:12px}
.statBox{flex:1;background:linear-gradient(145deg,#1c1530,#120c22);border:1px solid rgba(212,175,90,.22);border-radius:13px;padding:9px 4px;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.3)}
.statBox .val{font-size:16px;font-weight:800;font-family:'Poppins',sans-serif;background:linear-gradient(90deg,#f7e4b0,#d9b465);-webkit-background-clip:text;background-clip:text;color:transparent}
.statBox .lbl{font-size:10px;color:rgba(241,233,255,.5);margin-top:2px;letter-spacing:.4px}
.colorPick{display:flex;gap:10px;margin-top:12px;background:linear-gradient(145deg,#1c1530,#120c22);border:1px solid rgba(212,175,90,.22);border-radius:13px;padding:9px;justify-content:center;align-items:center;box-shadow:0 3px 10px rgba(0,0,0,.3)}
.colorPick .ctag{font-size:11px;color:rgba(241,233,255,.55);margin-right:4px;font-weight:600}
.cdot{width:27px;height:27px;border-radius:50%;border:2px solid rgba(255,255,255,.25);transition:transform .15s ease}
.cdot.white{background:linear-gradient(145deg,#fffef8,#e9e2cf)}
.cdot.black{background:linear-gradient(145deg,#332943,#141018)}
.cdot.selected{border-color:#ffd766;box-shadow:0 0 0 3px rgba(255,215,102,.35);transform:scale(1.08)}
.status{text-align:center;margin-top:12px;font-size:12.5px;font-weight:700;color:#f4e2ff;background:linear-gradient(90deg,rgba(147,90,255,.14),rgba(217,180,101,.1));border:1px solid rgba(212,175,90,.3);border-radius:12px;padding:9px 12px}
.actions{display:flex;gap:8px;margin-top:12px}
.actBtn{flex:1;background:linear-gradient(145deg,#1c1530,#120c22);border:1px solid rgba(212,175,90,.28);border-radius:13px;padding:10px 6px;color:#f1e9ff;font-size:12.5px;font-weight:700;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.3);transition:transform .15s ease}
.actBtn:active{transform:scale(.96)}
.overlay{position:fixed;inset:0;background:rgba(6,3,14,.65);backdrop-filter:blur(3px);display:none;align-items:flex-end;justify-content:center;z-index:50}
.overlay.open{display:flex}
.sheet{width:100%;max-width:520px;background:linear-gradient(180deg,#221a3a,#130d24);border-radius:20px 20px 0 0;overflow:hidden;border:1px solid rgba(212,175,90,.3);box-shadow:0 -10px 30px rgba(0,0,0,.5)}
.opt{display:flex;align-items:center;gap:12px;padding:15px 18px;font-size:14.5px;font-weight:600;color:#f1e9ff;border-bottom:1px solid rgba(255,255,255,.06)}
.opt .dot{width:12px;height:12px;border-radius:50%;box-shadow:0 0 8px currentColor}
.opt.active{background:linear-gradient(90deg,rgba(217,180,101,.16),transparent);font-weight:800;color:#f7e4b0}
</style>
<body>
<div class="container">
<div class="card">
  <div class="header">
    <div>
      <div class="label">Hitoshi MD GAME</div>
      <div class="title">♟️ Hitoshi Chess</div>
    </div>
    <div id="turnPill" class="pill">White turn</div>
  </div>
  <div class="body">
    <div class="controls">
      <button id="diffBtn" class="diffBtn"><span class="dot" id="diffDot" style="background:#3b82f6"></span><span id="diffLabel">Medium</span><span class="chev">▾</span></button>
      <button id="newGameBtn" class="newBtn">🔄 New Game</button>
    </div>
    <div class="boardWrap">
      <div id="board" class="board"></div>
    </div>
    <div class="stats">
      <div class="statBox"><div class="val" id="statTurn">White</div><div class="lbl">Giliran</div></div>
      <div class="statBox"><div class="val" id="statMoves">0</div><div class="lbl">Moves</div></div>
      <div class="statBox"><div class="val" id="statMode">Medium</div><div class="lbl">Mode</div></div>
    </div>
    <div class="colorPick" id="colorPick">
      <span class="ctag">Main sebagai</span>
      <button id="pickWhite" class="cdot white selected"></button>
      <button id="pickBlack" class="cdot black"></button>
    </div>
    <div id="status" class="status">White mulai dulu. Ayo kalahkan shorekeeper 😏</div>
    <div class="actions">
      <button id="undoBtn" class="actBtn">↩️ Undo</button>
      <button id="flipBtn" class="actBtn">🔁 Flip</button>
      <button id="resignBtn" class="actBtn">🏳️ Resign</button>
    </div>
  </div>
</div>
</div>
<div class="overlay" id="overlay">
  <div class="sheet" id="sheet"></div>
</div>
<script>
let audioCtx = null;
function initAudio() {
  if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  if (audioCtx.state === "suspended") { audioCtx.resume(); }
}
function beep(freq, dur, type, vol) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol || 0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur + 0.02);
  } catch (e) {}
}
function sndMove() { beep(320, 0.09, "sine", 0.2); }
function sndCapture() { beep(180, 0.13, "square", 0.25); }
function sndCheck() { beep(700, 0.12, "triangle", 0.3); setTimeout(function(){ beep(900,0.12,"triangle",0.25); }, 90); }
function sndWin() { beep(660,0.12,"triangle",0.3); setTimeout(function(){beep(880,0.14,"triangle",0.3);},120); setTimeout(function(){beep(1100,0.2,"triangle",0.3);},240); }
function sndLose() { beep(300,0.18,"sawtooth",0.25); setTimeout(function(){beep(220,0.22,"sawtooth",0.25);},150); setTimeout(function(){beep(150,0.3,"sawtooth",0.25);},320); }
function sndSelect() { beep(500, 0.05, "sine", 0.12); }
</script>
<script>
  // Pure chess engine - no DOM. Board: 8x8 array, row0=rank8(top/black) .. row7=rank1(white).
  // Square: null or {t:'p|n|b|r|q|k', c:'w|b'}
  
  function initialBoard() {
    const back = ['r','n','b','q','k','b','n','r'];
    const b = Array.from({length:8}, () => Array(8).fill(null));
    for (let i=0;i<8;i++){
      b[0][i] = {t:back[i], c:'b'};
      b[1][i] = {t:'p', c:'b'};
      b[6][i] = {t:'p', c:'w'};
      b[7][i] = {t:back[i], c:'w'};
    }
    return b;
  }
  
  function cloneBoard(b){ return b.map(row=>row.map(sq=>sq?{t:sq.t,c:sq.c}:null)); }
  
  function newState(){
    return {
      board: initialBoard(),
      turn: 'w',
      castling: {wK:true, wQ:true, bK:true, bQ:true},
      ep: null, // {r,c} en-passant target square (square behind the pawn that just moved 2)
      halfmove: 0,
      fullmove: 1,
      lastMove: null
    };
  }
  
  function cloneState(s){
    return {
      board: cloneBoard(s.board),
      turn: s.turn,
      castling: Object.assign({}, s.castling),
      ep: s.ep ? {r:s.ep.r,c:s.ep.c} : null,
      halfmove: s.halfmove,
      fullmove: s.fullmove,
      lastMove: s.lastMove ? Object.assign({}, s.lastMove) : null
    };
  }
  
  function inB(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
  function opp(c){ return c==='w'?'b':'w'; }
  
  const DIRS = {
    b: [[-1,-1],[-1,1],[1,-1],[1,1]],
    r: [[-1,0],[1,0],[0,-1],[0,1]],
    q: [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]],
    n: [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[-1,2],[1,-2],[1,2]],
    k: [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
  };
  
  function findKing(board, color){
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const s = board[r][c];
      if (s && s.t==='k' && s.c===color) return {r,c};
    }
    return null;
  }
  
  // Is square (r,c) attacked by byColor?
  function isAttacked(board, r, c, byColor){
    // pawn attacks
    const pdir = byColor==='w' ? 1 : -1; // white pawns attack upward (toward row-1), stored moving from row7->row0 means white pawn attacks r-1; a white pawn at (pr,pc) attacks (pr-1,pc-1)/(pr-1,pc+1)
    const pr = r + pdir;
    for (const dc of [-1,1]){
      const pc = c + dc;
      if (inB(pr,pc)){
        const s = board[pr][pc];
        if (s && s.t==='p' && s.c===byColor) return true;
      }
    }
    // knight
    for (const [dr,dc] of DIRS.n){
      const nr=r+dr, nc=c+dc;
      if (inB(nr,nc)){
        const s = board[nr][nc];
        if (s && s.t==='n' && s.c===byColor) return true;
      }
    }
    // king
    for (const [dr,dc] of DIRS.k){
      const nr=r+dr, nc=c+dc;
      if (inB(nr,nc)){
        const s = board[nr][nc];
        if (s && s.t==='k' && s.c===byColor) return true;
      }
    }
    // sliding: bishop/queen diagonals
    for (const [dr,dc] of DIRS.b){
      let nr=r+dr, nc=c+dc;
      while (inB(nr,nc)){
        const s = board[nr][nc];
        if (s){
          if (s.c===byColor && (s.t==='b'||s.t==='q')) return true;
          break;
        }
        nr+=dr; nc+=dc;
      }
    }
    // sliding: rook/queen straight
    for (const [dr,dc] of DIRS.r){
      let nr=r+dr, nc=c+dc;
      while (inB(nr,nc)){
        const s = board[nr][nc];
        if (s){
          if (s.c===byColor && (s.t==='r'||s.t==='q')) return true;
          break;
        }
        nr+=dr; nc+=dc;
      }
    }
    return false;
  }
  
  function inCheck(state, color){
    const k = findKing(state.board, color);
    if (!k) return false;
    return isAttacked(state.board, k.r, k.c, opp(color));
  }
  
  // Generate pseudo-legal moves (doesn't filter for leaving own king in check)
  function pseudoMoves(state, r, c){
    const board = state.board;
    const s = board[r][c];
    if (!s) return [];
    const moves = [];
    const color = s.c;
  
    if (s.t === 'p'){
      const dir = color==='w' ? -1 : 1;
      const startRow = color==='w' ? 6 : 1;
      const lastRow = color==='w' ? 0 : 7;
      const oneR = r+dir;
      if (inB(oneR,c) && !board[oneR][c]){
        if (oneR===lastRow) moves.push({from:{r,c},to:{r:oneR,c},promotion:'q'});
        else moves.push({from:{r,c},to:{r:oneR,c}});
        const twoR = r+2*dir;
        if (r===startRow && !board[twoR][c]){
          moves.push({from:{r,c},to:{r:twoR,c},double:true});
        }
      }
      for (const dc of [-1,1]){
        const nr=r+dir, nc=c+dc;
        if (!inB(nr,nc)) continue;
        const target = board[nr][nc];
        if (target && target.c!==color){
          if (nr===lastRow) moves.push({from:{r,c},to:{r:nr,c:nc},promotion:'q',capture:true});
          else moves.push({from:{r,c},to:{r:nr,c:nc},capture:true});
        } else if (!target && state.ep && state.ep.r===nr && state.ep.c===nc){
          moves.push({from:{r,c},to:{r:nr,c:nc},enPassant:true,capture:true});
        }
      }
    } else if (s.t === 'n' || s.t === 'k'){
      for (const [dr,dc] of DIRS[s.t]){
        const nr=r+dr, nc=c+dc;
        if (!inB(nr,nc)) continue;
        const target = board[nr][nc];
        if (!target) moves.push({from:{r,c},to:{r:nr,c:nc}});
        else if (target.c!==color) moves.push({from:{r,c},to:{r:nr,c:nc},capture:true});
      }
      if (s.t==='k'){
        // castling
        const row = color==='w'?7:0;
        if (r===row && c===4){
          const kSideRight = color==='w'?state.castling.wK:state.castling.bK;
          const qSideRight = color==='w'?state.castling.wQ:state.castling.bQ;
          if (kSideRight && !board[row][5] && !board[row][6] && board[row][7] && board[row][7].t==='r' && board[row][7].c===color){
            if (!isAttacked(board,row,4,opp(color)) && !isAttacked(board,row,5,opp(color)) && !isAttacked(board,row,6,opp(color))){
              moves.push({from:{r,c},to:{r:row,c:6},castle:'K'});
            }
          }
          if (qSideRight && !board[row][1] && !board[row][2] && !board[row][3] && board[row][0] && board[row][0].t==='r' && board[row][0].c===color){
            if (!isAttacked(board,row,4,opp(color)) && !isAttacked(board,row,3,opp(color)) && !isAttacked(board,row,2,opp(color))){
              moves.push({from:{r,c},to:{r:row,c:2},castle:'Q'});
            }
          }
        }
      }
    } else {
      // sliding pieces
      for (const [dr,dc] of DIRS[s.t]){
        let nr=r+dr, nc=c+dc;
        while (inB(nr,nc)){
          const target = board[nr][nc];
          if (!target){
            moves.push({from:{r,c},to:{r:nr,c:nc}});
          } else {
            if (target.c!==color) moves.push({from:{r,c},to:{r:nr,c:nc},capture:true});
            break;
          }
          nr+=dr; nc+=dc;
        }
      }
    }
    return moves;
  }
  
  function applyMove(state, move){
    const ns = cloneState(state);
    const board = ns.board;
    const {from, to} = move;
    const piece = board[from.r][from.c];
    const color = piece.c;
  
    let captured = board[to.r][to.c] ? board[to.r][to.c].t : null;
  
    // en passant capture
    if (move.enPassant){
      const capR = color==='w' ? to.r+1 : to.r-1;
      captured = board[capR][to.c] ? board[capR][to.c].t : 'p';
      board[capR][to.c] = null;
    }
  
    board[from.r][from.c] = null;
    board[to.r][to.c] = move.promotion ? {t:move.promotion, c:color} : piece;
  
    // castling: move rook too
    if (move.castle === 'K'){
      const row = to.r;
      board[row][5] = board[row][7];
      board[row][7] = null;
    } else if (move.castle === 'Q'){
      const row = to.r;
      board[row][3] = board[row][0];
      board[row][0] = null;
    }
  
    // update castling rights
    if (piece.t==='k'){
      if (color==='w'){ ns.castling.wK=false; ns.castling.wQ=false; }
      else { ns.castling.bK=false; ns.castling.bQ=false; }
    }
    if (piece.t==='r'){
      if (color==='w' && from.r===7 && from.c===0) ns.castling.wQ=false;
      if (color==='w' && from.r===7 && from.c===7) ns.castling.wK=false;
      if (color==='b' && from.r===0 && from.c===0) ns.castling.bQ=false;
      if (color==='b' && from.r===0 && from.c===7) ns.castling.bK=false;
    }
    // if a rook is captured on its home square, revoke rights
    if (to.r===7 && to.c===0) ns.castling.wQ=false;
    if (to.r===7 && to.c===7) ns.castling.wK=false;
    if (to.r===0 && to.c===0) ns.castling.bQ=false;
    if (to.r===0 && to.c===7) ns.castling.bK=false;
  
    // en passant target square
    ns.ep = null;
    if (move.double){
      ns.ep = { r: (from.r+to.r)/2, c: from.c };
    }
  
    // halfmove clock
    if (piece.t==='p' || move.capture) ns.halfmove = 0;
    else ns.halfmove = state.halfmove + 1;
  
    if (color==='b') ns.fullmove = state.fullmove + 1;
  
    ns.turn = opp(color);
    ns.lastMove = { from, to, piece: piece.t, color, capture: !!move.capture, castle: move.castle||null, promotion: move.promotion||null, capturedType: captured };
    return ns;
  }
  
  function legalMoves(state, color){
    const result = [];
    const board = state.board;
    for (let r=0;r<8;r++){
      for (let c=0;c<8;c++){
        const s = board[r][c];
        if (!s || s.c!==color) continue;
        const pm = pseudoMoves(state, r, c);
        for (const mv of pm){
          const ns = applyMove(state, mv);
          if (!inCheck(ns, color)) result.push(mv);
        }
      }
    }
    return result;
  }
  
  function gameStatus(state){
    const color = state.turn;
    const moves = legalMoves(state, color);
    const check = inCheck(state, color);
    if (moves.length===0){
      if (check) return { status:'checkmate', winner: opp(color) };
      return { status:'stalemate', winner:null };
    }
    if (state.halfmove >= 100) return { status:'draw50', winner:null };
    if (insufficientMaterial(state.board)) return { status:'insufficient', winner:null };
    return { status: check ? 'check' : 'normal', winner:null };
  }
  
  function insufficientMaterial(board){
    const pieces = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const s = board[r][c];
      if (s && s.t!=='k') pieces.push(s.t);
    }
    if (pieces.length===0) return true;
    if (pieces.length===1 && (pieces[0]==='n'||pieces[0]==='b')) return true;
    return false;
  }
  
  // ---------- AI ----------
  const PST = {
    p: [
      [0,0,0,0,0,0,0,0],
      [50,50,50,50,50,50,50,50],
      [10,10,20,30,30,20,10,10],
      [5,5,10,25,25,10,5,5],
      [0,0,0,20,20,0,0,0],
      [5,-5,-10,0,0,-10,-5,5],
      [5,10,10,-20,-20,10,10,5],
      [0,0,0,0,0,0,0,0]
    ],
    n: [
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,0,0,0,0,-20,-40],
      [-30,0,10,15,15,10,0,-30],
      [-30,5,15,20,20,15,5,-30],
      [-30,0,15,20,20,15,0,-30],
      [-30,5,10,15,15,10,5,-30],
      [-40,-20,0,5,5,0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b: [
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,0,0,0,0,0,0,-10],
      [-10,0,5,10,10,5,0,-10],
      [-10,5,5,10,10,5,5,-10],
      [-10,0,10,10,10,10,0,-10],
      [-10,10,10,10,10,10,10,-10],
      [-10,5,0,0,0,0,5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r: [
      [0,0,0,0,0,0,0,0],
      [5,10,10,10,10,10,10,5],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [0,0,0,5,5,0,0,0]
    ],
    q: [
      [-20,-10,-10,-5,-5,-10,-10,-20],
      [-10,0,0,0,0,0,0,-10],
      [-10,0,5,5,5,5,0,-10],
      [-5,0,5,5,5,5,0,-5],
      [0,0,5,5,5,5,0,-5],
      [-10,5,5,5,5,5,0,-10],
      [-10,0,5,0,0,0,0,-10],
      [-20,-10,-10,-5,-5,-10,-10,-20]
    ],
    k: [
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [20,20,0,0,0,0,20,20],
      [20,30,10,0,0,10,30,20]
    ]
  };
  const VAL = { p:100, n:320, b:330, r:500, q:900, k:20000 };
  
  function evaluate(state){
    const board = state.board;
    let score = 0;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const s = board[r][c];
      if (!s) continue;
      const pstRow = s.c==='w' ? r : 7-r;
      const val = VAL[s.t] + PST[s.t][pstRow][c];
      score += s.c==='w' ? val : -val;
    }
    return score; // positive favors white
  }
  
  function orderMoves(state, moves){
    return moves.slice().sort((a,b)=>{
      const av = a.capture ? (VAL[state.board[a.to.r][a.to.c]?.t]||0) - VAL[state.board[a.from.r][a.from.c].t]/10 : 0;
      const bv = b.capture ? (VAL[state.board[b.to.r][b.to.c]?.t]||0) - VAL[state.board[b.from.r][b.from.c].t]/10 : 0;
      return bv - av;
    });
  }
  
  function negamax(state, depth, alpha, beta, sign, deadline){
    if (deadline && Date.now() > deadline) return { score: sign*evaluate(state), timeout:true };
    const color = state.turn;
    const moves = legalMoves(state, color);
    if (moves.length===0){
      if (inCheck(state,color)) return { score: -100000 - depth }; // being mated is very bad, prefer longer survival
      return { score: 0 }; // stalemate
    }
    if (depth===0){
      return { score: sign*evaluate(state) };
    }
    const ordered = orderMoves(state, moves);
    let best = -Infinity, bestMove = ordered[0];
    for (const mv of ordered){
      const ns = applyMove(state, mv);
      const res = negamax(ns, depth-1, -beta, -alpha, -sign, deadline);
      const score = -res.score;
      if (score > best){ best = score; bestMove = mv; }
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
      if (res.timeout) break;
    }
    return { score: best, move: bestMove };
  }
  
  function findBestMove(state, opts){
    opts = opts || {};
    const maxDepth = opts.depth || 2;
    const randomness = opts.randomness || 0; // 0..1 chance to pick a random-ish (top-3) move instead of best
    const timeBudgetMs = opts.timeBudgetMs || 4000;
    const color = state.turn;
    const sign = color==='w' ? 1 : -1;
    const moves = legalMoves(state, color);
    if (moves.length===0) return null;
    if (moves.length===1) return moves[0];
  
    const deadline = Date.now() + timeBudgetMs;
    let best = moves[0];
    let lastScores = [];
    for (let d=1; d<=maxDepth; d++){
      const ordered = orderMoves(state, moves);
      let alpha=-Infinity, beta=Infinity;
      let bestScore=-Infinity, bestMv=ordered[0];
      const scored = [];
      for (const mv of ordered){
        const ns = applyMove(state, mv);
        const res = negamax(ns, d-1, -beta, -alpha, -sign, deadline);
        const score = -res.score;
        scored.push({mv, score});
        if (score > bestScore){ bestScore=score; bestMv=mv; }
        if (bestScore > alpha) alpha = bestScore;
        if (Date.now() > deadline) break;
      }
      best = bestMv;
      lastScores = scored;
      if (Date.now() > deadline) break;
    }
  
    if (randomness > 0 && lastScores.length > 1 && Math.random() < randomness){
      lastScores.sort((a,b)=>b.score-a.score);
      const pool = lastScores.slice(0, Math.min(3, lastScores.length));
      return pool[Math.floor(Math.random()*pool.length)].mv;
    }
    return best;
  }
  
// ---------- UI / game controller ----------
const DIFF = {
  easy:   { depth: 1, randomness: 0.55, color: "#22c55e", label: "Easy" },
  medium: { depth: 2, randomness: 0.18, color: "#3b82f6", label: "Medium" },
  hard:   { depth: 3, randomness: 0.06, color: "#a855f7", label: "Hard" },
  master: { depth: 4, randomness: 0,    color: "#ef4444", label: "Master" },
  "2p":   { depth: 0, randomness: 0,    color: "#3b82f6", label: "2 Player" }
};
const DIFF_ORDER = ["easy","medium","hard","master","2p"];

const FLAVOR_START = [
  "White mulai dulu. Ayo kalahkan shorekeeper 😏",
  "Papan sudah siap. Tunjukkan gaya bermainmu!",
  "Ayo catur! Pikirkan langkahmu baik-baik 🧠"
];
const FLAVOR_CAPTURE = ["Sikat! 🔥", "Makan bidak! 😈", "Tukar bidak, hati-hati balasannya!"];

let mode = "medium";
let humanColor = "w";
let flipped = false;
let state, history, selected, legalTargets, gameOver, moveCount, boardLocked;

const boardEl = document.getElementById("board");
const turnPillEl = document.getElementById("turnPill");
const statTurnEl = document.getElementById("statTurn");
const statMovesEl = document.getElementById("statMoves");
const statModeEl = document.getElementById("statMode");
const statusEl = document.getElementById("status");
const colorPickEl = document.getElementById("colorPick");
const pickWhiteBtn = document.getElementById("pickWhite");
const pickBlackBtn = document.getElementById("pickBlack");
const diffBtn = document.getElementById("diffBtn");
const diffDot = document.getElementById("diffDot");
const diffLabel = document.getElementById("diffLabel");
const overlay = document.getElementById("overlay");
const sheet = document.getElementById("sheet");

function setStatus(txt) { statusEl.textContent = txt; }
function randPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pieceGlyph(t, c) {
  // Use the bold "filled" glyph set for BOTH colors (distinguished purely via CSS
  // color/stroke below) - the thin "outline" codepoints render too fragile once
  // stroked, turning almost fully dark. The filled set stays crisp for both colors.
  const VS = "\uFE0E"; // text-presentation selector, avoids colorful emoji fallback
  const GLYPH = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };
  return GLYPH[t] + VS;
}

function buildBoard() {
  boardEl.innerHTML = "";
  const kingInCheckColor = inCheck(state, state.turn) ? state.turn : null;
  const kingPos = kingInCheckColor ? findKing(state.board, kingInCheckColor) : null;
  const last = state.lastMove;

  for (let vr = 0; vr < 8; vr++) {
    for (let vc = 0; vc < 8; vc++) {
      const r = flipped ? 7 - vr : vr;
      const c = flipped ? 7 - vc : vc;
      const sq = document.createElement("div");
      const isLight = (r + c) % 2 === 0;
      sq.className = "sq " + (isLight ? "light" : "dark");
      sq.setAttribute("data-r", r);
      sq.setAttribute("data-c", c);

      if (last && last.to.r === r && last.to.c === c) sq.classList.add("lastto");
      if (last && last.from.r === r && last.from.c === c) sq.classList.add("lastfrom");
      if (kingPos && kingPos.r === r && kingPos.c === c) sq.classList.add("chk");
      if (selected && selected.r === r && selected.c === c) sq.classList.add("sel");

      const piece = state.board[r][c];
      if (piece) {
        const span = document.createElement("span");
        span.className = "piece " + piece.c;
        span.textContent = pieceGlyph(piece.t, piece.c);
        sq.appendChild(span);
      }

      const target = legalTargets.find(function (m) { return m.to.r === r && m.to.c === c; });
      if (target) {
        const dot = document.createElement("div");
        dot.className = "dot-target" + (target.capture ? " cap" : "");
        sq.appendChild(dot);
      }

      if (vc === 0) {
        const rk = document.createElement("span");
        rk.className = "coord coordRank";
        rk.textContent = 8 - r;
        sq.appendChild(rk);
      }
      if (vr === 7) {
        const fl = document.createElement("span");
        fl.className = "coord coordFile";
        fl.textContent = "abcdefgh"[c];
        sq.appendChild(fl);
      }

      sq.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        onSquareClick(r, c);
      });
      boardEl.appendChild(sq);
    }
  }
}

function render() {
  buildBoard();
  turnPillEl.textContent = (state.turn === "w" ? "White turn" : "Black turn");
  statTurnEl.textContent = (state.turn === "w" ? "White" : "Black");
  statMovesEl.textContent = String(moveCount);
  statModeEl.textContent = DIFF[mode].label;
  diffDot.style.background = DIFF[mode].color;
  diffLabel.textContent = DIFF[mode].label;
  colorPickEl.style.display = (mode === "2p") ? "none" : "flex";
  pickWhiteBtn.classList.toggle("selected", humanColor === "w");
  pickBlackBtn.classList.toggle("selected", humanColor === "b");
}

function selectSquare(r, c) {
  selected = { r: r, c: c };
  const moves = legalMoves(state, state.turn);
  legalTargets = moves.filter(function (mv) { return mv.from.r === r && mv.from.c === c; });
  sndSelect();
  render();
}

function onSquareClick(r, c) {
  if (gameOver || boardLocked) return;
  if (mode !== "2p" && state.turn !== humanColor) return;
  const piece = state.board[r][c];

  if (selected) {
    const target = legalTargets.find(function (mv) { return mv.to.r === r && mv.to.c === c; });
    if (target) { doMove(target); return; }
    if (piece && piece.c === state.turn) { selectSquare(r, c); return; }
    selected = null; legalTargets = []; render();
    return;
  }
  if (piece && piece.c === state.turn) selectSquare(r, c);
}

function doMove(mv) {
  const wasCapture = !!mv.capture;
  history.push(state);
  state = applyMove(state, mv);
  moveCount++;
  selected = null; legalTargets = [];
  afterMove(wasCapture);
}

function afterMove(wasCapture) {
  const status = gameStatus(state);

  if (status.status === "checkmate") {
    gameOver = true;
    if (mode === "2p") {
      setStatus((status.winner === "w" ? "⚪ White" : "⚫ Black") + " menang! Skakmat 🏆");
      sndWin();
    } else if (status.winner === humanColor) {
      setStatus("🎉 Skakmat! Kamu berhasil mengalahkan shorekeeper!");
      sndWin();
    } else {
      setStatus("😵 Skakmat! Hitoshi menang. Coba lagi yuk!");
      sndLose();
    }
    render();
    return;
  }
  if (status.status === "stalemate") {
    gameOver = true;
    setStatus("🤝 Stalemate! Permainan seri.");
    render();
    return;
  }
  if (status.status === "insufficient" || status.status === "draw50") {
    gameOver = true;
    setStatus("🤝 Seri (materi tersisa tidak cukup untuk skakmat).");
    render();
    return;
  }

  if (status.status === "check") {
    sndCheck();
    setStatus("⚠️ Skak! Giliran " + (state.turn === "w" ? "White" : "Black"));
  } else if (wasCapture) {
    sndCapture();
    setStatus(randPick(FLAVOR_CAPTURE));
  } else {
    sndMove();
    setStatus((state.turn === "w" ? "Giliran White." : "Giliran Black.") + (mode !== "2p" && state.turn !== humanColor ? " Hitoshi jalan..." : ""));
  }

  render();

  if (mode !== "2p" && state.turn !== humanColor && !gameOver) {
    boardLocked = true;
    setStatus("🤖 Hitoshi sedang berpikir...");
    setTimeout(aiMove, 380);
  } else {
    boardLocked = false;
  }
}

function aiMove() {
  if (gameOver) { boardLocked = false; return; }
  const cfg = DIFF[mode];
  const best = findBestMove(state, { depth: cfg.depth, randomness: cfg.randomness, timeBudgetMs: 3500 });
  boardLocked = false;
  if (!best) return;
  doMove(best);
}

function startNewGame() {
  state = newState();
  history = [];
  selected = null; legalTargets = [];
  gameOver = false;
  moveCount = 0;
  boardLocked = false;
  render();
  setStatus(randPick(FLAVOR_START));
  if (mode !== "2p" && state.turn !== humanColor) {
    boardLocked = true;
    setTimeout(aiMove, 400);
  }
}

function undo() {
  if (history.length === 0) return;
  let s = history.pop();
  if (mode !== "2p" && s.turn !== humanColor && history.length > 0) {
    s = history.pop();
  }
  state = s;
  gameOver = false;
  selected = null; legalTargets = [];
  moveCount = Math.max(0, moveCount - (mode === "2p" ? 1 : 2));
  boardLocked = false;
  setStatus("↩️ Langkah dibatalkan.");
  render();
}

function resign() {
  if (gameOver) return;
  gameOver = true;
  boardLocked = true;
  if (mode === "2p") {
    const winner = state.turn === "w" ? "Black" : "White";
    setStatus("🏳️ " + (state.turn === "w" ? "White" : "Black") + " resign. " + winner + " menang!");
  } else {
    setStatus("🏳️ Kamu resign. Hitoshi menang!");
  }
  sndLose();
  render();
}

function toggleFlip() { flipped = !flipped; render(); }

function openSheet() {
  sheet.innerHTML = "";
  DIFF_ORDER.forEach(function (key) {
    const d = DIFF[key];
    const opt = document.createElement("div");
    opt.className = "opt" + (key === mode ? " active" : "");
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = d.color;
    const label = document.createElement("span");
    label.textContent = (key === "2p" ? "👥 " : "") + d.label;
    opt.appendChild(dot);
    opt.appendChild(label);
    opt.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      mode = key;
      closeSheet();
      startNewGame();
    });
    sheet.appendChild(opt);
  });
  overlay.classList.add("open");
}
function closeSheet() { overlay.classList.remove("open"); }

diffBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); openSheet(); });
overlay.addEventListener("pointerdown", function (e) { if (e.target === overlay) closeSheet(); });
document.getElementById("newGameBtn").addEventListener("pointerdown", function (e) { e.preventDefault(); startNewGame(); });
document.getElementById("undoBtn").addEventListener("pointerdown", function (e) { e.preventDefault(); undo(); });
document.getElementById("flipBtn").addEventListener("pointerdown", function (e) { e.preventDefault(); toggleFlip(); });
document.getElementById("resignBtn").addEventListener("pointerdown", function (e) { e.preventDefault(); resign(); });
pickWhiteBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); if (mode === "2p") return; humanColor = "w"; startNewGame(); });
pickBlackBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); if (mode === "2p") return; humanColor = "b"; startNewGame(); });

startNewGame();
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
                messageText: "♟️ Hitoshi Chess"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(
                JSON.stringify({
                  response_id: "shorekeeper-chess-" + Date.now(),
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

handler.command = ["catur", "chess", "gamecatur", "gamechess"];
handler.help = ["catur"];
handler.tags = ["game"];

module.exports = handler;
