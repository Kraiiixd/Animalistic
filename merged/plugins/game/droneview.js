/**
 * © Kureza MD — Hitoshi MD V1
 * Created by Kureza
 */

let handler = async (m, { shorekeeper, Reply, isRegistered, isCreator, isPremium, checkLimit, addLimit }) => {
  if (!isRegistered(m.sender) && !isCreator) return Reply(global.mess.verifikasi);
  if (checkLimit(m.sender, isPremium, isCreator)) return Reply(global.mess.limit);
  addLimit(m.sender, isPremium, isCreator);

  await shorekeeper.sendMessage(m.chat, { react: { text: "🚁", key: m.key } });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Drone View Neon</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Manrope:wght@500;700;800&display=swap" rel="stylesheet">
</head>
<body>
<style>
  :root{
    --bg-0:#05030d; --bg-1:#0b0620;
    --panel:rgba(13,9,28,0.88); --panel-edge:rgba(255,255,255,0.06);
    --cyan:#00e5ff; --cyan-dim:rgba(0,229,255,0.28);
    --magenta:#ff2ea6; --violet:#8a4dff; --gold:#ffcb47;
    --text:#f1f2ff; --muted:rgba(241,242,255,0.52);
  }
  *{ -webkit-tap-highlight-color:transparent; -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; box-sizing:border-box; }
  html,body{ margin:0; width:100%; height:100%; overflow:hidden; background:var(--bg-0); font-family:'Manrope',system-ui,sans-serif; color:var(--text); touch-action:manipulation; }
  #dv-wrap{ position:relative; width:100%; height:100vh; max-width:520px; margin:0 auto; background:#000; overflow:hidden; }
  #canvas-container{ position:absolute; inset:0; z-index:1; }
  #hud{ position:absolute; inset:0; z-index:10; pointer-events:none; display:flex; flex-direction:column; justify-content:space-between; padding:14px; }
  #hud::before{
    content:''; position:absolute; inset:0; pointer-events:none; z-index:-1;
    background:
      radial-gradient(120% 40% at 0% 0%, rgba(0,229,255,0.10), transparent 55%),
      radial-gradient(120% 40% at 100% 100%, rgba(255,46,166,0.10), transparent 55%);
  }
  .dv-header{ display:flex; justify-content:space-between; align-items:flex-start; pointer-events:auto; }
  .dv-badge{ background:var(--panel); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); border:1px solid var(--panel-edge); border-radius:14px; padding:9px 14px; box-shadow:0 12px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,229,255,0.06) inset; }
  .dv-eyebrow{ font-family:'Orbitron',sans-serif; font-size:9.5px; letter-spacing:2.5px; color:var(--cyan); font-weight:700; display:flex; align-items:center; gap:5px; opacity:0.85; }
  .dv-title{ font-family:'Orbitron',sans-serif; font-size:17px; font-weight:800; color:#fff; margin-top:3px; letter-spacing:0.5px; text-shadow:0 0 18px rgba(0,229,255,0.45); }
  .dv-top-controls{ display:flex; gap:9px; }
  .dv-btn{ background:var(--panel); border:1px solid var(--panel-edge); color:var(--cyan); width:40px; height:40px; border-radius:12px; display:flex; justify-content:center; align-items:center; font-weight:800; font-size:12px; cursor:pointer; backdrop-filter:blur(18px); box-shadow:0 8px 20px rgba(0,0,0,0.4); transition:transform .15s ease, background .15s ease; }
  .dv-btn:active{ transform:scale(0.9); background:rgba(0,229,255,0.18); }

  .dv-telemetry{ position:absolute; top:64px; left:14px; background:var(--panel); border-left:3px solid var(--cyan); backdrop-filter:blur(14px); padding:8px 12px; border-radius:0 12px 12px 0; font-family:'Orbitron',sans-serif; font-size:10.5px; color:var(--text); pointer-events:none; box-shadow:0 8px 20px rgba(0,0,0,0.4); }
  .dv-telemetry div{ margin:3px 0; letter-spacing:0.4px; }
  .dv-telemetry span{ color:var(--cyan); font-weight:800; }

  .dv-recordbox{ position:absolute; top:64px; right:14px; background:var(--panel); backdrop-filter:blur(14px); border:1px solid var(--panel-edge); border-radius:12px; padding:8px 12px; text-align:right; box-shadow:0 8px 20px rgba(0,0,0,0.4); }
  .dv-record{ font-family:'Orbitron',sans-serif; font-size:10px; color:var(--muted); font-weight:700; display:flex; align-items:center; justify-content:flex-end; gap:4px; letter-spacing:0.3px; }
  .dv-record.new{ color:var(--gold); }
  .dv-record b{ color:var(--text); }

  .crosshair{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:26px; height:26px; border:1px solid rgba(0,229,255,0.3); border-radius:50%; pointer-events:none; display:flex; justify-content:center; align-items:center; }
  .crosshair::before{ content:''; width:4px; height:4px; background:rgba(0,229,255,0.8); border-radius:50%; box-shadow:0 0 8px var(--cyan); }

  .cam-indicator{ position:absolute; bottom:172px; right:14px; background:var(--panel); border:1px solid var(--panel-edge); backdrop-filter:blur(14px); padding:5px 11px; border-radius:20px; font-family:'Orbitron',sans-serif; font-size:9.5px; color:var(--cyan); letter-spacing:1px; box-shadow:0 8px 16px rgba(0,0,0,0.4); }

  .dv-watermark{ position:absolute; bottom:158px; left:14px; font-size:9px; color:rgba(0,229,255,0.4); font-weight:700; letter-spacing:1.5px; pointer-events:none; }

  .controls-area{ display:flex; justify-content:space-between; align-items:flex-end; padding-bottom:14px; pointer-events:auto; width:100%; }
  .joystick-zone{ width:124px; height:124px; background:rgba(13,9,28,0.55); border:2px dashed var(--cyan-dim); border-radius:50%; position:relative; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(6px); touch-action:none; }
  .joystick-zone.active{ border-color:var(--cyan); box-shadow:0 0 22px rgba(0,229,255,0.25); }
  .joystick-stick{ width:48px; height:48px; background:radial-gradient(circle, rgba(0,229,255,0.85) 0%, rgba(138,77,255,0.55) 100%); border:2px solid var(--cyan); border-radius:50%; position:absolute; box-shadow:0 0 16px rgba(0,229,255,0.55); transition:transform .05s ease-out; touch-action:none; }
  .joystick-label{ position:absolute; top:-21px; width:100%; text-align:center; font-size:9.5px; color:var(--muted); letter-spacing:1px; text-transform:uppercase; font-weight:700; }

  .dv-overlay{ position:absolute; inset:0; z-index:50; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; background:rgba(5,3,13,0.72); backdrop-filter:blur(6px); pointer-events:auto; }
  .dv-overlay h2{ font-family:'Orbitron',sans-serif; font-size:26px; font-weight:900; color:var(--cyan); text-shadow:0 0 20px rgba(0,229,255,0.55); letter-spacing:1px; }
  .dv-overlay p{ margin-top:10px; font-size:12.5px; color:rgba(255,255,255,0.75); max-width:260px; }
  .dv-overlay .tap-txt{ margin-top:22px; font-family:'Orbitron',sans-serif; font-size:14px; font-weight:800; color:var(--gold); text-shadow:0 0 14px rgba(255,203,71,0.6); }

  .dv-modal{ position:absolute; inset:0; background:rgba(5,3,13,0.85); backdrop-filter:blur(12px); z-index:100; display:flex; flex-direction:column; justify-content:center; align-items:center; opacity:0; pointer-events:none; transition:opacity .3s ease; padding:22px; }
  .dv-modal.active{ opacity:1; pointer-events:auto; }
  .dv-modal-card{ background:var(--panel); border:1px solid var(--panel-edge); border-radius:20px; padding:22px; width:100%; max-width:360px; box-shadow:0 10px 30px rgba(0,0,0,0.55), 0 0 20px rgba(0,229,255,0.15); }
  .dv-modal-title{ font-family:'Orbitron',sans-serif; font-size:18px; color:var(--cyan); text-align:center; margin-bottom:18px; letter-spacing:2px; font-weight:800; }
  .dv-setting-row{ margin-bottom:16px; }
  .dv-setting-label{ display:flex; justify-content:space-between; font-size:12px; margin-bottom:7px; color:#cbd5e1; font-weight:700; }
  .dv-slider{ width:100%; height:6px; border-radius:3px; background:#1e293b; outline:none; -webkit-appearance:none; }
  .dv-slider::-webkit-slider-thumb{ -webkit-appearance:none; width:17px; height:17px; border-radius:50%; background:var(--cyan); cursor:pointer; box-shadow:0 0 10px var(--cyan); }
  .dv-close-btn{ width:100%; padding:11px; background:linear-gradient(135deg, var(--cyan) 0%, var(--violet) 100%); border:none; border-radius:12px; color:#fff; font-family:'Orbitron',sans-serif; font-weight:800; font-size:13px; cursor:pointer; margin-top:6px; letter-spacing:0.5px; box-shadow:0 4px 15px rgba(0,229,255,0.35); }
  .svg-icon{ display:inline-block; vertical-align:middle; }
</style>

<div id="dv-wrap">
  <div id="canvas-container"></div>

  <div id="hud">
    <div class="dv-header">
      <div class="dv-badge">
        <div class="dv-eyebrow">
          <svg class="svg-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>
          HIRARA ARCADE
        </div>
        <div class="dv-title">Drone View Neon</div>
      </div>
      <div class="dv-top-controls">
        <button class="dv-btn" id="sound-btn" title="Suara">
          <svg id="icon-audio-on" class="svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          <svg id="icon-audio-off" class="svg-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="display:none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
        </button>
        <button class="dv-btn" id="cam-btn" title="Ganti Kamera">1</button>
        <button class="dv-btn" id="settings-btn" title="Pengaturan">⚙</button>
      </div>
    </div>

    <div class="dv-telemetry">
      <div>ALT <span id="tele-alt">0.0</span>m</div>
      <div>SPD <span id="tele-spd">0.0</span>km/h</div>
      <div>PITCH <span id="tele-pitch">0</span>°</div>
    </div>

    <div class="dv-recordbox">
      <div class="dv-record" id="record-alt"><b id="record-alt-val">BEST ALT 0.0m</b></div>
      <div class="dv-record" id="record-spd" style="margin-top:4px;"><b id="record-spd-val">BEST SPD 0.0km/h</b></div>
    </div>

    <div class="crosshair"></div>
    <div class="cam-indicator" id="cam-tag">CAM 1: CHASE 3D</div>
    <div class="dv-watermark">WM: Mommy Kyuu</div>

    <div class="controls-area">
      <div class="joystick-zone" id="stick-left">
        <div class="joystick-label">Naik / Putar</div>
        <div class="joystick-stick" id="knob-left"></div>
      </div>
      <div class="joystick-zone" id="stick-right">
        <div class="joystick-label">Maju / Miring</div>
        <div class="joystick-stick" id="knob-right"></div>
      </div>
    </div>
  </div>

  <div class="dv-overlay" id="start-overlay">
    <h2>DRONE VIEW</h2>
    <p>Tarik stick kiri untuk naik/putar, stick kanan untuk maju/miring. Terbang keliling kota neon ini.</p>
    <div class="tap-txt">TAP UNTUK TERBANG</div>
  </div>

  <div class="dv-modal" id="settings-modal">
    <div class="dv-modal-card">
      <div class="dv-modal-title">PENGATURAN</div>
      <div class="dv-setting-row">
        <div class="dv-setting-label"><span>Volume Audio Drone</span><span id="val-sound">80%</span></div>
        <input type="range" class="dv-slider" id="slider-sound" min="0" max="100" value="80">
      </div>
      <div class="dv-setting-row">
        <div class="dv-setting-label"><span>Sensitivitas Kontrol</span><span id="val-sens">1.0x</span></div>
        <input type="range" class="dv-slider" id="slider-sens" min="5" max="20" value="10">
      </div>
      <div class="dv-setting-row">
        <div class="dv-setting-label"><span>Kecepatan Drone</span><span id="val-speed">Normal</span></div>
        <input type="range" class="dv-slider" id="slider-speed" min="1" max="3" value="2">
      </div>
      <button class="dv-close-btn" id="close-settings">SIMPAN</button>
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function() {
  // ---------- audio ----------
  class DroneAudio {
    constructor() { this.ctx = null; this.oscillator = null; this.gainNode = null; this.isMuted = false; this.volume = 0.8; this.isInitialized = false; }
    init() {
      if (this.isInitialized) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.oscillator = this.ctx.createOscillator();
      this.gainNode = this.ctx.createGain();
      this.oscillator.type = 'sawtooth';
      this.oscillator.frequency.setValueAtTime(80, this.ctx.currentTime);
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(300, this.ctx.currentTime);
      this.oscillator.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.oscillator.start();
      this.isInitialized = true;
    }
    update(throttlePower, speed) {
      if (!this.isInitialized || this.isMuted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const targetFreq = 80 + (throttlePower * 150) + (speed * 15);
      const targetGain = 0.05 + (throttlePower * 0.25) * this.volume;
      this.oscillator.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
      this.filter.frequency.setTargetAtTime(300 + throttlePower * 800, this.ctx.currentTime, 0.1);
      this.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
    setVolume(vol) { this.volume = vol; this.isMuted = vol === 0; }
    setMuted(m) { this.isMuted = m; }
  }
  const audioSystem = new DroneAudio();
  window.addEventListener('touchstart', () => audioSystem.init(), { once: true });
  window.addEventListener('click', () => audioSystem.init(), { once: true });

  // small SFX blips reusing blockblast-style tone generator (uses same ctx once initialized)
  function blip(freq0, freq1, dur, type, gainVal) {
    if (!audioSystem.ctx || audioSystem.isMuted) return;
    try {
      const now = audioSystem.ctx.currentTime;
      const osc = audioSystem.ctx.createOscillator();
      const gain = audioSystem.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq0, now);
      if (freq1) osc.frequency.exponentialRampToValueAtTime(freq1, now + dur);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
      osc.connect(gain); gain.connect(audioSystem.ctx.destination);
      osc.start(now); osc.stop(now + dur);
    } catch (e) {}
  }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  // ---------- three.js setup ----------
  const container = document.getElementById('canvas-container');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.003);

  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
  dirLight.position.set(150, 250, 100);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 500;
  const d = 150;
  dirLight.shadow.camera.left = -d; dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d; dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  function buildOpenWorld() {
    const groundGeo = new THREE.PlaneGeometry(1000, 1000, 64, 64);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.02) * Math.cos(y * 0.02) * 3);
    }
    groundGeo.computeVertexNormals();
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x3d7833, roughness: 0.9, metalness: 0.1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const pad = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 20), new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 }));
    pad.position.set(0, 0.1, 0);
    pad.receiveShadow = true;
    scene.add(pad);

    const ring = new THREE.Mesh(new THREE.RingGeometry(4, 5, 32), new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.22, 0);
    scene.add(ring);

    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });

    for (let i = 0; i < 40; i++) {
      const h = 20 + Math.random() * 60, w = 12 + Math.random() * 15, dep = 12 + Math.random() * 15;
      const x = (Math.random() - 0.5) * 600, z = (Math.random() - 0.5) * 600;
      if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;
      const building = new THREE.Mesh(new THREE.BoxGeometry(w, h, dep), Math.random() > 0.4 ? buildingMat : glassMat);
      building.position.set(x, h / 2, z);
      building.castShadow = true; building.receiveShadow = true;
      scene.add(building);
    }
    for (let i = 0; i < 120; i++) {
      const x = (Math.random() - 0.5) * 700, z = (Math.random() - 0.5) * 700;
      if (Math.abs(x) < 25 && Math.abs(z) < 25) continue;
      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 4), trunkMat);
      trunk.position.y = 2; trunk.castShadow = true; treeGroup.add(trunk);
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(3.5, 8, 8), leafMat);
      leaves.position.y = 7; leaves.castShadow = true; treeGroup.add(leaves);
      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
    }
  }
  buildOpenWorld();

  function createDroneModel() {
    const droneGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.8), new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 }));
    body.castShadow = true; droneGroup.add(body);

    const topGeo = new THREE.SphereGeometry(0.5, 16, 16); topGeo.scale(1, 0.5, 1.5);
    const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ color: 0x00e5ff, metalness: 0.9, roughness: 0.1 }));
    top.position.y = 0.2; droneGroup.add(top);

    const armMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.5 });
    const propMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7 });
    const armPositions = [{ x: 1.2, z: 1.2 }, { x: -1.2, z: 1.2 }, { x: 1.2, z: -1.2 }, { x: -1.2, z: -1.2 }];
    droneGroup.rotors = [];
    armPositions.forEach(p => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.6), armMat);
      arm.rotation.z = Math.PI / 2; arm.rotation.y = Math.atan2(p.z, p.x);
      arm.position.set(p.x / 2, 0, p.z / 2); droneGroup.add(arm);

      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.3), body.material);
      motor.position.set(p.x, 0.1, p.z); droneGroup.add(motor);

      const propGroup = new THREE.Group();
      const bladeGeo = new THREE.BoxGeometry(1.6, 0.02, 0.15);
      const blade1 = new THREE.Mesh(bladeGeo, propMat);
      const blade2 = new THREE.Mesh(bladeGeo, propMat); blade2.rotation.y = Math.PI / 2;
      propGroup.add(blade1, blade2); propGroup.position.set(p.x, 0.28, p.z);
      droneGroup.add(propGroup); droneGroup.rotors.push(propGroup);
    });

    const frontLed = new THREE.PointLight(0x00ff00, 2, 5); frontLed.position.set(0, 0, -0.9); droneGroup.add(frontLed);
    const backLed = new THREE.PointLight(0xff0000, 2, 5); backLed.position.set(0, 0, 0.9); droneGroup.add(backLed);
    return droneGroup;
  }
  const drone = createDroneModel();
  drone.position.set(0, 0.5, 0);
  scene.add(drone);

  // ---------- physics ----------
  const physics = {
    position: new THREE.Vector3(0, 0.5, 0),
    velocity: new THREE.Vector3(),
    rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
    sensitivity: 1.0,
    speedMultiplier: 1.0
  };
  const input = { leftX: 0, leftY: 0, rightX: 0, rightY: 0 };

  // ---------- FIXED JOYSTICK GESTURE (Pointer Events + setPointerCapture) ----------
  function setupJoystick(zoneId, knobId, onMove) {
    const zone = document.getElementById(zoneId);
    const knob = document.getElementById(knobId);
    let activePointerId = null;
    let rect = null;

    function applyDelta(clientX, clientY) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let deltaX = clientX - centerX;
      let deltaY = clientY - centerY;
      const maxDist = rect.width / 2 - 10;
      const dist = Math.hypot(deltaX, deltaY);
      if (dist > maxDist) { deltaX = (deltaX / dist) * maxDist; deltaY = (deltaY / dist) * maxDist; }
      knob.style.transform = 'translate(' + deltaX + 'px,' + deltaY + 'px)';
      onMove(deltaX / maxDist, -deltaY / maxDist);
    }

    function onPointerDown(e) {
      if (activePointerId !== null) return; // ignore extra fingers, keep first stable
      activePointerId = e.pointerId;
      rect = zone.getBoundingClientRect();
      zone.setPointerCapture(activePointerId);
      zone.classList.add('active');
      applyDelta(e.clientX, e.clientY);
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (e.pointerId !== activePointerId) return;
      applyDelta(e.clientX, e.clientY);
      e.preventDefault();
    }
    function onPointerEnd(e) {
      if (e.pointerId !== activePointerId) return;
      try { zone.releasePointerCapture(activePointerId); } catch (err) {}
      activePointerId = null;
      zone.classList.remove('active');
      knob.style.transform = 'translate(0px, 0px)';
      onMove(0, 0);
    }

    zone.addEventListener('pointerdown', onPointerDown, { passive: false });
    zone.addEventListener('pointermove', onPointerMove, { passive: false });
    zone.addEventListener('pointerup', onPointerEnd, { passive: false });
    zone.addEventListener('pointercancel', onPointerEnd, { passive: false });
    zone.addEventListener('lostpointercapture', () => { if (activePointerId !== null) onPointerEnd({ pointerId: activePointerId }); });
  }

  setupJoystick('stick-left', 'knob-left', (x, y) => { input.leftX = x; input.leftY = y; });
  setupJoystick('stick-right', 'knob-right', (x, y) => { input.rightX = x; input.rightY = y; });

  // ---------- keyboard fallback (desktop testing) ----------
  const keys = {};
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);
  function updateKeyboardInput() {
    if (keys['KeyW']) input.rightY = 1; else if (keys['KeyS']) input.rightY = -1;
    if (keys['KeyD']) input.rightX = 1; else if (keys['KeyA']) input.rightX = -1;
    if (keys['ArrowUp']) input.leftY = 1; else if (keys['ArrowDown']) input.leftY = -1;
    if (keys['ArrowRight']) input.leftX = 1; else if (keys['ArrowLeft']) input.leftX = -1;
  }

  // ---------- camera modes ----------
  let cameraMode = 1;
  const camBtn = document.getElementById('cam-btn');
  const camTag = document.getElementById('cam-tag');
  const camNames = { 1: "CAM 1: CHASE 3D", 2: "CAM 2: FPV REALISTIS", 3: "CAM 3: CINEMATIC / ORBIT" };
  camBtn.addEventListener('click', () => {
    cameraMode = (cameraMode % 3) + 1;
    camBtn.innerText = cameraMode;
    camTag.innerText = camNames[cameraMode];
    blip(500, 700, 0.06, 'sine', 0.12);
  });
  function updateCamera() {
    if (cameraMode === 1) {
      const offset = new THREE.Vector3(0, 2.5, 6.0).applyQuaternion(drone.quaternion);
      camera.position.lerp(drone.position.clone().add(offset), 0.15);
      camera.lookAt(drone.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
    } else if (cameraMode === 2) {
      camera.position.copy(drone.position);
      camera.rotation.copy(drone.rotation);
    } else if (cameraMode === 3) {
      const offset = new THREE.Vector3(0, 15, 12);
      camera.position.lerp(drone.position.clone().add(offset), 0.08);
      camera.lookAt(drone.position);
    }
  }

  // ---------- best-record tracking (like blockblast BEST score) ----------
  let bestAlt = 0, bestSpd = 0;
  const recordAltEl = document.getElementById('record-alt');
  const recordAltVal = document.getElementById('record-alt-val');
  const recordSpdEl = document.getElementById('record-spd');
  const recordSpdVal = document.getElementById('record-spd-val');
  function checkRecords(alt, spdKmh) {
    if (alt > bestAlt + 0.3) {
      bestAlt = alt;
      recordAltVal.textContent = 'BEST ALT ' + bestAlt.toFixed(1) + 'm';
      recordAltEl.classList.add('new');
    }
    if (spdKmh > bestSpd + 1) {
      bestSpd = spdKmh;
      recordSpdVal.textContent = 'BEST SPD ' + bestSpd.toFixed(1) + 'km/h';
      recordSpdEl.classList.add('new');
    }
  }

  // ---------- start overlay ----------
  const startOverlay = document.getElementById('start-overlay');
  let started = false;
  startOverlay.addEventListener('pointerdown', () => {
    if (started) return;
    started = true;
    audioSystem.init();
    blip(420, 840, 0.12, 'sine', 0.16);
    startOverlay.style.opacity = '0';
    setTimeout(() => { startOverlay.style.display = 'none'; }, 250);
  });
  document.querySelectorAll('.dv-overlay').forEach(el => el.style.transition = 'opacity .25s ease');

  // ---------- physics update ----------
  const clock = new THREE.Clock();
  let wasAirborne = false;

  function updatePhysics(dt) {
    updateKeyboardInput();
    const sens = physics.sensitivity, spd = physics.speedMultiplier;

    const targetPitch = input.rightY * 0.45 * spd;
    const targetRoll = -input.rightX * 0.45 * spd;
    physics.rotation.x += (targetPitch - physics.rotation.x) * 6.0 * dt;
    physics.rotation.z += (targetRoll - physics.rotation.z) * 6.0 * dt;
    physics.rotation.y -= input.leftX * 2.2 * sens * dt;
    drone.rotation.set(physics.rotation.x, physics.rotation.y, physics.rotation.z, 'YXZ');

    const thrust = Math.max(0, input.leftY * 18.0 * spd);
    const gravity = 9.81;
    const accel = new THREE.Vector3(0, -gravity, 0);
    const liftForce = new THREE.Vector3(0, 1, 0).applyQuaternion(drone.quaternion).multiplyScalar(thrust + (input.leftY === 0 ? gravity : 0));
    accel.add(liftForce);

    physics.velocity.addScaledVector(accel, dt);
    physics.velocity.x *= 0.96; physics.velocity.z *= 0.96; physics.velocity.y *= 0.94;
    physics.position.addScaledVector(physics.velocity, dt);

    if (physics.position.y < 0.4) {
      if (wasAirborne) blip(180, 90, 0.08, 'triangle', 0.1);
      physics.position.y = 0.4;
      physics.velocity.y = 0;
      physics.velocity.x *= 0.8; physics.velocity.z *= 0.8;
      wasAirborne = false;
    } else {
      wasAirborne = true;
    }

    drone.position.copy(physics.position);

    const rotorSpeed = (input.leftY + 0.5 + Math.abs(input.rightX) + Math.abs(input.rightY)) * 35;
    drone.rotors.forEach(r => r.rotation.y += rotorSpeed * dt);

    const currentSpeed = physics.velocity.length();
    audioSystem.update(Math.max(0.1, input.leftY + Math.abs(input.rightY) * 0.5), currentSpeed);

    const spdKmh = currentSpeed * 3.6;
    checkRecords(physics.position.y, spdKmh);

    document.getElementById('tele-alt').innerText = physics.position.y.toFixed(1);
    document.getElementById('tele-spd').innerText = spdKmh.toFixed(1);
    document.getElementById('tele-pitch').innerText = Math.round(physics.rotation.x * (180 / Math.PI));
  }

  // ---------- settings modal ----------
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  document.getElementById('close-settings').addEventListener('click', () => settingsModal.classList.remove('active'));
  settingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));

  const soundBtn = document.getElementById('sound-btn');
  const iconAudioOn = document.getElementById('icon-audio-on');
  const iconAudioOff = document.getElementById('icon-audio-off');
  let uiMuted = false;
  soundBtn.addEventListener('click', () => {
    uiMuted = !uiMuted;
    audioSystem.setMuted(uiMuted);
    iconAudioOn.style.display = uiMuted ? 'none' : 'inline-block';
    iconAudioOff.style.display = uiMuted ? 'inline-block' : 'none';
  });

  document.getElementById('slider-sound').addEventListener('input', (e) => {
    document.getElementById('val-sound').innerText = e.target.value + '%';
    audioSystem.setVolume(e.target.value / 100);
  });
  document.getElementById('slider-sens').addEventListener('input', (e) => {
    const val = e.target.value / 10;
    document.getElementById('val-sens').innerText = val.toFixed(1) + 'x';
    physics.sensitivity = val;
  });
  document.getElementById('slider-speed').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('val-speed').innerText = ['Pelan', 'Normal', 'Agresif'][val - 1];
    physics.speedMultiplier = val * 0.7;
  });

  window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    updatePhysics(dt);
    updateCamera();
    renderer.render(scene, camera);
  }
  animate();
})();
</script>
</body>
</html>
`;

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
                messageText: "🚁 Drone View Neon"
              }
            ],
            unifiedResponse: {
              data: Buffer.from(
                JSON.stringify({
                  response_id: "droneview-" + Date.now(),
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

handler.command = ["drone", "droneview", "dv"];
handler.help = ["drone"];
handler.tags = ["game"];

module.exports = handler;
