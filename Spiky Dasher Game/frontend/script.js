const gc = document.querySelector('#game_console')
const gc_loc = gc.getBoundingClientRect()
const player = 'player2'
var pl;

// Visual Effects
function screenShake() {
  gc.classList.add('shake');
  setTimeout(() => gc.classList.remove('shake'), 500);
}

function createWallSparks(x, y, direction = 'right') {
  for (let i = 0; i < 5; i++) {
    const spark = document.createElement('div');
    spark.classList.add('wall-spark');
    spark.style.left = x + (direction === 'right' ? 25 : 0) + 'px';
    spark.style.top = (y + Math.random() * 20) + 'px';
    
    gc.appendChild(spark);
    
    setTimeout(() => spark.remove(), 500);
  }
}

function createLevelFlash() {
  const flash = document.createElement('div');
  flash.classList.add('level-flash');
  gc.appendChild(flash);
  
  setTimeout(() => flash.remove(), 600);
}

function createPortalWarp(x, y) {
  // Create warp effect
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.classList.add('warp-particle');
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    
    const angle = (Math.PI * 2 * i) / 15;
    const distance = 50;
    particle.style.setProperty('--warp-x', Math.cos(angle) * distance + 'px');
    particle.style.setProperty('--warp-y', Math.sin(angle) * distance + 'px');
    
    gc.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

function secondsToTime(e) {
  var totalSeconds = Math.floor(e / 45); // Convert frames (45fps) to seconds
  var m = Math.floor(totalSeconds / 60).toString().padStart(2, '0'),
    s = (totalSeconds % 60).toString().padStart(2, '0');
  return m + ':' + s;
}

function createExplosion(x, y, color = 'cyan') {
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.background = color;
    
    // Random velocity
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 5 + 2;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity;
    
    gc.appendChild(p);
    
    let life = 1.0;
    
    function updateParticle() {
      life -= 0.05;
      if (life <= 0) {
        p.remove();
        return;
      }
      
      const currentLeft = parseFloat(p.style.left);
      const currentTop = parseFloat(p.style.top);
      
      p.style.left = (currentLeft + vx) + 'px';
      p.style.top = (currentTop + vy) + 'px';
      p.style.opacity = life;
      p.style.transform = `scale(${life})`;
      
      requestAnimationFrame(updateParticle);
    }
    requestAnimationFrame(updateParticle);
  }
}

// --- Sound Controller (Web Audio API) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const aCtx = new AudioContext();

const sfx = {
  jump: () => {
    if (aCtx.state === 'suspended') aCtx.resume();
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.connect(gain);
    gain.connect(aCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, aCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, aCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, aCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime + 0.1);
    osc.start();
    osc.stop(aCtx.currentTime + 0.1);
  },
  land: () => {
    if (aCtx.state === 'suspended') aCtx.resume();
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.connect(gain);
    gain.connect(aCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, aCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, aCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, aCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime + 0.1);
    osc.start();
    osc.stop(aCtx.currentTime + 0.1);
  },
  die: () => {
    if (aCtx.state === 'suspended') aCtx.resume();
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.connect(gain);
    gain.connect(aCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, aCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, aCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, aCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime + 0.3);
    osc.start();
    osc.stop(aCtx.currentTime + 0.3);
  },
  win: () => {
    if (aCtx.state === 'suspended') aCtx.resume();
    [440, 554, 659].forEach((freq, i) => {
      const osc = aCtx.createOscillator();
      const gain = aCtx.createGain();
      osc.connect(gain);
      gain.connect(aCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, aCtx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.1, aCtx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime + i * 0.1 + 0.3);
      osc.start(aCtx.currentTime + i * 0.1);
      osc.stop(aCtx.currentTime + i * 0.1 + 0.3);
    });
  },
  start: () => {
    if (aCtx.state === 'suspended') aCtx.resume();
    const osc = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.connect(gain);
    gain.connect(aCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, aCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, aCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, aCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, aCtx.currentTime + 0.5);
    osc.start();
    osc.stop(aCtx.currentTime + 0.5);
  }
};
// -------------------------------------

var cols = 40 // multiple of 16
var rows = 22 // multiple of 9
const tile_size = gc_loc.width * (100 / cols / 100)
const pl_size = tile_size * 2
document.body.style.setProperty('--tile-line-height', pl_size + 'px')

gc.style.width = '1000px'
gc.style.height = tile_size * rows + 'px'

var gravity = 8,
  kd,
  x_speed = 5,
  pb_y = 0,
  score = 0,
  rot = 0,
  data_p = 0,
  bonus = 1,
  dead = false,
  kd_list = [],
  keys = {},
  gp,
  gpa,
  dbljump = false,
  dash = false,
  transitioning = false,
  timer = 0,
  deaths = 0,
  level_num = -1;

const levels = [
  {
    start: '19.5,0',
    map: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
      8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 9, 9, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]
  },
  {
    start: '19.5,0',
    map: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 8, 8, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      9, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8,
      8, 8, 8, 8, 0, 2, 2, 2, 2, 2, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 2, 2, 2, 2, 2, 0, 8, 8, 8, 8,
      8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8]
  },
  {
    start: '2,13',
    map: [8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      8, 0, 0, 0, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 8, 8, 0, 0, 0, 0, 0, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 0, 0, 0, 1, 1, 1, 0, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 0, 1, 1, 1, 1, 1, 0, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 8, 8, 8, 8, 8,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 8, 8, 8, 8, 8,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 0, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 8, 8, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 0, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 8,
      0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 8, 0, 2, 2, 2, 2, 2, 0, 8, 8, 8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
      8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 0, 8, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 0, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      8, 8, 8, 8, 0, 2, 2, 2, 2, 2, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0,
      8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  },
  {
    start: '1,2',
    map: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 6, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 0, 2, 2, 0, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 0, 2, 2, 0, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 9,
      0, 1, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 9,
      0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0,
      8, 8, 8, 8, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 8, 8, 8, 8,
      8, 8, 8, 8, 0, 2, 2, 2, 0, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 0, 2, 2, 2, 0, 8, 8, 8, 8,
      8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8]


  },
  {
    start: '1,2',
    map: [0, 0, 0, 0, 0, 8, 8, 8, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 0, 0, 0, 0, 0, 4, 4, 4, 4, 0, 8, 8, 8, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0,
      0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0,
      0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 9,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 9,
      0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 0, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8,
      8, 8, 8, 8, 0, 2, 2, 2, 2, 2, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8,
      8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8]
  },
  {
    start: '2,13',
    map: [8, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      8, 0, 0, 0, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 8, 8, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 8, 0, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 8, 8, 8, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9,
      8, 0, 1, 1, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8, 8, 8, 8, 8, 8,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 8, 8, 8, 8, 8,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 8, 8, 8, 8, 8,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 0, 0, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 8, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 8, 8,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 8,
      0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0,
      8, 8, 8, 8, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      8, 8, 8, 8, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0,
      8, 8, 8, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
]

function buildGame(shouldStart = true) {
  // clear tiles and update level number
  gc.innerHTML = "<div id='" + player + "'></div><div id='deaths_counter'></div><div id='time_counter'></div>"
  if (level_num < levels.length - 1) {
    level_num++
  } else {
    showVictory();
    return; // Stop building next level
  }

  // Level transition flash
  if (level_num > 0) {
    createLevelFlash();
  }

  let tc = document.querySelector('#time_counter')
  let dc = document.querySelector('#deaths_counter')
  tc.innerHTML = 'TIME<br>' + secondsToTime(timer)
  dc.innerHTML = 'DEATHS<br>' + deaths

  // set random level color
  document.body.style.setProperty('--root-clr', 'hsl(' + Math.random() * 360 + 'deg,75%,50%)')

  // add tiles for new level
  for (var i = 0; i < cols * rows; i++) {
    var tile = document.createElement('div')
    tile.className = 'tile'

    if (levels[level_num].map[i] == 0) {
      tile.className = 'tile ground'
    }
    if (levels[level_num].map[i] == 2) {
      tile.className = 'tile lava'
    }
    if (levels[level_num].map[i] == 3) {
      tile.className = 'tile lava spleft'
    }
    if (levels[level_num].map[i] == 4) {
      tile.className = 'tile lava sptop'
    }
    if (levels[level_num].map[i] == 5) {
      tile.className = 'tile lava spright'
    }
    if (levels[level_num].map[i] == 6) {
      tile.className = 'tile portal1'
    }
    if (levels[level_num].map[i] == 7) {
      tile.className = 'tile portal2'
    }
    if (levels[level_num].map[i] == 8) {
      tile.className = 'tile innerwall'
    }
    if (levels[level_num].map[i] == 9) {
      tile.className = 'tile nextlevel'
    }
    tile.setAttribute('grid_loc', [i % cols, Math.floor(i / cols)])
    tile.style.width = tile_size + 'px'
    tile.style.height = tile_size + 'px'
    tile.style.position = 'absolute'
    tile.style.left = (i % cols) * tile_size + 'px'
    tile.style.top = Math.floor(i / cols) * tile_size + 'px'

    gc.appendChild(tile)
  }

  // add player stuff
  var pl = document.querySelector('#' + player)
  pl.style.width = tile_size + 'px'
  pl.style.height = tile_size + 'px'
  pl.style.top = (tile_size * levels[level_num].start.split(',')[1]) + 'px'
  pl.style.left = (tile_size * levels[level_num].start.split(',')[0]) + 'px'

  var pl_loc = pl.getBoundingClientRect()
  var x = pl_loc.left

  function updatePlayer() {
    // get points based on player location
    var pl_loc = pl.getBoundingClientRect()
    var pl_center = document.elementFromPoint(pl_loc.x + (tile_size * .5), pl_loc.y + (tile_size * .75))
    var pl_xy1 = document.elementFromPoint(pl_loc.x + (pl_loc.width * .25), pl_loc.y + pl_loc.height + gravity)
    var pl_xy2 = document.elementFromPoint(pl_loc.x + (pl_loc.width * .75), pl_loc.y + pl_loc.height + gravity)
    var pl_xy3 = document.elementFromPoint(pl_loc.x - (x_speed * .5), pl_loc.y + (pl_loc.height * .5))
    var pl_xy4 = document.elementFromPoint(pl_loc.x + pl_loc.width + (x_speed * .5), pl_loc.y + (pl_loc.height * .5))
    var pl_xy5 = document.elementFromPoint(pl_loc.x + (pl_loc.width * .5), pl_loc.y - (gravity * .5))
    var pl_xy6 = document.elementFromPoint(pl_loc.x + (pl_size * .5), pl_loc.y + pl_size)

    // console.log(pl_center)

    function endGame() {
      alert('you died')
    }

    //if dead stop, else update player and everything else
    if (!pl_xy1 || !pl_xy2 || dead) {
      // endGame()
    } else {

      // set player top   
      // if player on ground set new top
      if (pl_xy1.classList.contains('ground') ||
        pl_xy2.classList.contains('ground')) {
        // Better landing check: if we were previously in air (gravity > 0)
        if (gravity > 3) {
          sfx.land();
        }
        
        gravity = 0
        if (pl.classList.contains('jumping')) {
           pl.classList.remove('jumping');
           pl.style.transform = 'rotate(0deg)'; // Snap to flat on landing
        }
      } else {
        if (gravity < 8) {
          gravity += .51
        } else {
          gravity = 8
        }
      }
      pl.style.top = pl_loc.top - 6.25 - gc_loc.top + gravity + 'px'
      // console.log(gravity)    

      var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
      if (!gamepads) {
        return;
      }
      var gp = gamepads[0];

      // add jump-force (change the gravity)
      if ((keys[38]
        || (gp && (gp.buttons[0].pressed
          || gp.buttons[1].pressed
          || gp.buttons[2].pressed
          || gp.buttons[3].pressed)))
        && gravity == 0) {
        dbljump = false
        gravity = -9
        pl.classList.add('jumping'); // Start spinning
        sfx.jump(); // Sound effect
      }
      if ((keys[38]
        || (gp && (gp.buttons[0].pressed
          || gp.buttons[1].pressed
          || gp.buttons[2].pressed
          || gp.buttons[3].pressed)))
        && gravity > 0) {
        if (!dbljump) {
          gravity = -9
          pl.classList.add('jumping'); // Start spinning on double jump
          sfx.jump(); // Sound effect
        }
        dbljump = true
      }

      if (gp) {
        var gpa = Math.round(gp.axes[0])
        if (gpa == 0 || gravity == 0) {
          pl.className = ''
          pl.style.transform = 'rotate(0deg)'
        }
      }

      // track left/right movement
      if ((keys[37] || (gp && gpa == -1)) && x > gc_loc.x) {
        if (!pl_xy3.classList.contains('ground')) {
          x -= x_speed
          // Only add goleft if NOT jumping (jumping overrides rotation)
          if (!pl.classList.contains('jumping')) {
             pl.className = ''
             pl.classList.add('goleft')
          }
        } else {
          if (gravity > 0) {
            dbljump = false
            gravity = 1
            pl.style.transform = 'rotate(90deg)'
            // Wall slide sparks
            createWallSparks(pl_loc.left - gc_loc.left, pl_loc.top - gc_loc.top, 'left');
          }
          pl.className = ''
        }
      }

      // console.log(x_speed)
      if ((keys[39] || (gp && gpa == 1)) && x + pl_loc.width < gc_loc.x + gc_loc.width) {
        if (!pl_xy4.classList.contains('ground')) {
          x += x_speed
          // Only add goright if NOT jumping
             if (!pl.classList.contains('jumping')) {
                pl.className = ''
                pl.classList.add('goright')
             }
        } else {
          if (gravity > 0) {
            dbljump = false
            gravity = 1
            pl.style.transform = 'rotate(-90deg)'
            // Wall slide sparks
            createWallSparks(pl_loc.left - gc_loc.left, pl_loc.top - gc_loc.top, 'right');
          }
          pl.className = ''
        }
      }

      pl.style.left = x - gc_loc.left + 'px'
      // pl.style.left = x + x_speed - gc_loc.left + 'px'

      // set different interactions based on tile type
      if (pl_xy5.classList.contains('ground')) {
        gravity = 8
      }

      if (pl_center.classList.contains('lava')) {
        sfx.die(); // Death sound
        
        // Visual Effects
        let pl_rect = pl.getBoundingClientRect();
        createExplosion(pl_rect.left - gc_loc.left + 12.5, pl_rect.top - gc_loc.top + 12.5);
        screenShake();

        // console.log('lava')
        pl.style.top = (tile_size * levels[level_num].start.split(',')[1]) + 'px'
        pl.style.left = (tile_size * levels[level_num].start.split(',')[0]) + 'px'
        pl_loc = pl.getBoundingClientRect()
        x = pl_loc.left
        deaths++
        dc.innerHTML = 'DEATHS<br>' + deaths
      }

      if (pl_center.classList.contains('portal1')) {
        let p2 = document.querySelector('.portal2')
        let p2_loc = p2.getBoundingClientRect()
        pl.style.top = p2_loc.top - gc_loc.top + 'px'
        pl.style.left = p2_loc.left - gc_loc.left + 'px'
        pl_loc = pl.getBoundingClientRect()
        x = pl_loc.left
      }

      if (pl_center.classList.contains('nextlevel') && !transitioning) {
        transitioning = true;
        sfx.win(); // Win sound
        // Portal warp effect
        createPortalWarp(pl_loc.left - gc_loc.left + 12.5, pl_loc.top - gc_loc.top + 12.5);
        setTimeout(() => {
          transitioning = false;
          buildGame();
        }, 400);
      }

      timer++
      tc.innerHTML = 'TIME<br>' + secondsToTime(timer)

      playerTrail()
      setTimeout(updatePlayer, 1000 / 45) // update player 30-60 times a second
    }
  }

  // Expose the loop function so we can start it externally
  window.startGameLoop = updatePlayer;

  // Only start the loop if allowed (default is true)
  if (shouldStart !== false) {
    updatePlayer()
  }

  // add trail behind player b/c it's fun
  function playerTrail() {
    if (player == 'player') {
      let x = pl.getBoundingClientRect().x
      let y = pl.getBoundingClientRect().y
      let b = document.createElement('div')
      b.className = 'trailBall'
      b.style.left = x + 11 - gc_loc.left + 'px'
      b.style.top = y + 5 - gc_loc.top + 'px'
      b.onanimationend = function () {
        b.remove()
      }
      gc.appendChild(b)
    }

    if (player == 'player2') {
      let x = pl.getBoundingClientRect().x
      let y = pl.getBoundingClientRect().y
      let b = document.createElement('div')
      b.className = 'trailBall'
      let xx = Math.floor(Math.random() * 15) + 5
      b.style.left = x + xx - gc_loc.left + 'px'
      b.style.top = y - 3 - gc_loc.top + 'px'
      b.onanimationend = function () {
        b.remove()
      }
      gc.appendChild(b)
    }

  }

  // key tracking — register listeners only once
  if (!window._keyListenersAdded) {
    window._keyListenersAdded = true;
    window.addEventListener('keydown', function (e) {
      keys[e.which] = true;
    });
    window.addEventListener('keyup', function (e) {
      keys[e.which] = false;
      var currentPl = document.querySelector('#' + player);
      if (currentPl) {
        currentPl.className = '';
        currentPl.style.transform = 'rotate(0deg)';
      }
    });
    window.addEventListener('gamepadconnected', function (e) {
      var gp = navigator.getGamepads()[e.gamepad.index];
    });
  }
  if (level_num === 0) {
    timer = 0;
    deaths = 0;
  }
}

// Intro & Start Screen Logic
function initWillemLoadingAnimation(onComplete) {
	const container = document.querySelector('.willem-header')
    if (!container) { if(onComplete) onComplete(); return; } // Safety check

	const loadingLetter = container.querySelectorAll('.willem__letter')
	const box = container.querySelectorAll('.willem-loader__box')
	const growingImage = container.querySelectorAll('.willem__growing-image')
	const headingStart = container.querySelectorAll('.willem__h1-start')
	const headingEnd = container.querySelectorAll('.willem__h1-end')
	const coverImageExtra = container.querySelectorAll('.willem__cover-image-extra')
	const headerLetter = container.querySelectorAll('.willem__letter-white')
	const navLinks = container.querySelectorAll('.willen-nav a, .osmo-credits__p')

	/* GSAP Timeline */
	const tl = gsap.timeline({
		defaults: {
			ease: 'expo.inOut',
		},
		onStart: () => {
			container.classList.remove('is--hidden')
		},
        onComplete: onComplete
	})

	/* Start of Timeline */
	if (loadingLetter) {
		tl.from(loadingLetter, {
			yPercent: 100,
			stagger: 0.025,
			duration: 1.25,
		})
	}

	if (box.length) {
		tl.fromTo(box, { width: '0em' }, { width: '1em', duration: 1.25 }, '< 1.25')
	}

	if (box.length) {
		tl.fromTo(growingImage, { width: '0%' }, { width: '100%', duration: 1.25 }, '<')
	}

	if (headingStart.length) {
		tl.fromTo(headingStart, { x: '0em' }, { x: '-0.05em', duration: 1.25 }, '<')
	}

	if (headingEnd.length) {
		tl.fromTo(headingEnd, { x: '0em' }, { x: '0.05em', duration: 1.25 }, '<')
	}

	if (coverImageExtra.length) {
		tl.fromTo(coverImageExtra, { opacity: 1 }, { opacity: 0, duration: 0.05, ease: 'none', stagger: 0.5 }, '-=0.05')
	}

    // المرحلة الأولى: Zoom بسيط
    if (box.length) {
        tl.to(box, {
            scale: 2.5,
            duration: 1.2,
            ease: 'power2.inOut'
        }, '+=0.3');
    }

    // إبعاد كلمة HASSAN أثناء الزوم
    if (headingStart.length) {
        tl.to(headingStart, {
            x: '-200%',
            duration: 1.2,
            ease: 'power2.inOut'
        }, '<');
    }
    
    if (headingEnd.length) {
        tl.to(headingEnd, {
            x: '200%',
            duration: 1.2,
            ease: 'power2.inOut'
        }, '<');
    }
}

window.addEventListener('load', function() {
  document.body.classList.add('intro-mode');

  const loadingScreen = document.getElementById('loading_screen');
  const gameConsole = document.getElementById('game_console');
  const startBtn = document.getElementById('start_btn');
  const willemHeader = document.querySelector('.willem-header');
  
  // Build the game immediately (paused)
  buildGame(false);
  
  // Start Osmo Animation
  initWillemLoadingAnimation(() => {
     // Transition from Osmo DIRECTLY to Game
     if (willemHeader) {
         gsap.to(willemHeader, {
             opacity: 0,
             duration: 1,
             onComplete: () => {
                 willemHeader.style.display = 'none';
                 // Hide loading screen entirely
                 if(loadingScreen) {
                     loadingScreen.style.display = 'none';
                     loadingScreen.remove(); // Remove it from DOM
                 }
                 document.body.classList.remove('intro-mode');
                 
                 // Show Game Console
                 gameConsole.style.opacity = '1';
                 
                 // Start Game Loop
                 if (window.startGameLoop) window.startGameLoop();
                 
                 // Optional: Play start sound
                 if(sfx && sfx.start) sfx.start();
             }
         });
     } else {
         // Fallback if no header
         if(loadingScreen) loadingScreen.style.display = 'flex';
         document.body.classList.remove('intro-mode');
     }
  });

  // Handle Start Button Click (Backup/Dev)
  if (startBtn) {
      startBtn.addEventListener('click', function() {
        if (loadingScreen.style.opacity === '0') return; // Prevent double clicks
        sfx.start(); // Sound effect
        startBtn.style.transform = 'scale(0.9)'; // Click effect
        
        // Fade out intro
        loadingScreen.style.opacity = '0';
        gameConsole.style.opacity = '1';
        
        // Remove intro and START game
        setTimeout(function() {
          loadingScreen.remove();
          if (window.startGameLoop) window.startGameLoop();
        }, 1000);
      });
  }

  // Handle Spacebar to Start (Backup/Dev)
  window.addEventListener('keydown', function(e) {
    if ((e.code === 'Space' || e.key === ' ') && loadingScreen && loadingScreen.parentElement && loadingScreen.style.opacity !== '0' && loadingScreen.style.display !== 'none') {
      e.preventDefault(); // Prevent scrolling
      if(startBtn) startBtn.click();
    }
  });

  // Handle Restart Button
  const restartBtn = document.getElementById('restart_btn');
  if (restartBtn) {
      restartBtn.addEventListener('click', function() {
        location.reload(); // Simple reload to restart game clean
      });
  }

  // Debug Shortcut: Press 'E' to Win
  window.addEventListener('keydown', function(e) {
    if (e.code === 'KeyE') {
       showVictory();
    }
  });
});

function showVictory() {
    // GAME COMPLETED
    document.getElementById('victory_screen').style.display = 'flex';
    document.getElementById('final_time').innerText = secondsToTime(timer);
    document.getElementById('final_deaths').innerText = deaths;
    
    if (typeof sfx !== 'undefined' && sfx.win) sfx.win();
    
    // Stop game loop
    window.startGameLoop = null; 
}

window.focus()