const gc = document.querySelector('#game_console')
var gc_loc = gc.getBoundingClientRect()
const player = 'player2'
var pl;

// Always return a fresh bounding rect for the game console
function getGcLoc() {
  gc_loc = gc.getBoundingClientRect();
  return gc_loc;
}

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
  var totalSec = e / 45;
  var m  = Math.floor(totalSec / 60).toString().padStart(2, '0');
  var s  = Math.floor(totalSec % 60).toString().padStart(2, '0');
  var cs = Math.floor((totalSec % 1) * 100).toString().padStart(2, '0');
  return m + ':' + s + ':' + cs;
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
const GAME_WIDTH = 1000 // fixed internal game width in px
const tile_size = GAME_WIDTH / cols
const pl_size = tile_size * 2
document.body.style.setProperty('--tile-line-height', pl_size + 'px')

gc.style.width = GAME_WIDTH + 'px'
gc.style.height = tile_size * rows + 'px'

var gravity = 8,
  x_speed = 5,
  dead = false,
  keys = {},
  dbljump = false,
  dash = false,
  paused = false,
  transitioning = false,
  timer = 0,
  deaths = 0,
  level_num = -1,
  activeLoopId = 0;

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
    start: '2,2',
    map: [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 10, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 6, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 1, 1, 1, 1, 1, 1, 0,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 10, 1, 1, 0, 0, 1, 1, 1, 1, 1,
      0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 9, 0,
      0, 1, 1, 7, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 9, 0,
      0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ]
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

  }
]

function buildGame(shouldStart = true) {
  activeLoopId++;
  const localLoopId = activeLoopId;
  let loopRunning = false;
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
    if (levels[level_num].map[i] == 10) {
      tile.className = 'tile laser'
    }
    if (levels[level_num].map[i] == 11) {
      tile.className = 'tile laser-node'
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

  var px = tile_size * parseFloat(levels[level_num].start.split(',')[0]);
  var py = tile_size * parseFloat(levels[level_num].start.split(',')[1]);

  function getTileType(x, y) {
    if (x < 0 || x >= GAME_WIDTH || y < 0) return 1; // 1 is empty space
    var col = Math.floor(x / tile_size);
    var row = Math.floor(y / tile_size);
    if (row >= rows) return 1;
    var index = row * cols + col;
    return levels[level_num].map[index];
  }

  function tileAt(x, y, className) {
    var t = getTileType(x, y);
    if (className === 'ground') return t === 0;
    if (className === 'lava') return (t >= 2 && t <= 5) || t === 10 || t === 11;
    if (className === 'portal1') return t === 6;
    if (className === 'nextlevel') return t === 9;
    return false;
  }

  function updatePlayer() {
    if (localLoopId !== activeLoopId) {
      loopRunning = false;
      return;
    }
    if (paused) {
      loopRunning = false;
      return;
    }
    loopRunning = true;

    var cx = px + tile_size * 0.5;
    var cy = py + tile_size * 0.75;
    var x1 = px + tile_size * 0.25;
    var y12 = py + tile_size + (gravity > 0 ? gravity : 0);
    var x2 = px + tile_size * 0.75;
    var x3 = px - x_speed * 0.5;
    var y34 = py + tile_size * 0.5;
    var x4 = px + tile_size + x_speed * 0.5;
    var x5 = px + tile_size * 0.5;
    var y5 = py + (gravity < 0 ? gravity : 0);

    var is_center_lava = tileAt(cx, cy, 'lava');
    var is_center_portal1 = tileAt(cx, cy, 'portal1');
    var is_center_nextlevel = tileAt(cx, cy, 'nextlevel');
    
    var is_xy1_ground = tileAt(x1, y12, 'ground') && gravity >= 0;
    var is_xy2_ground = tileAt(x2, y12, 'ground') && gravity >= 0;
    var is_xy3_ground = tileAt(x3, y34, 'ground');
    var is_xy4_ground = tileAt(x4, y34, 'ground');
    var is_xy5_ground = tileAt(x5, y5, 'ground');

    if (dead) {
      // do nothing
    } else {
      if (is_xy1_ground || is_xy2_ground) {
        if (gravity > 3) sfx.land();
        py = Math.floor(y12 / tile_size) * tile_size - tile_size;
        gravity = 0;
        if (pl.classList.contains('jumping')) {
           pl.classList.remove('jumping');
           pl.style.transform = 'rotate(0deg)'; 
        }
      } else {
        if (gravity < 8) gravity += .51;
        else gravity = 8;
      }
      py += gravity;
      
      var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
      if (!gamepads) return;
      var gp = gamepads[0];

      if (((keys[38] || keys[32]) || (gp && (gp.buttons[0].pressed || gp.buttons[1].pressed || gp.buttons[2].pressed || gp.buttons[3].pressed))) && gravity == 0) {
        dbljump = false;
        gravity = -9;
        pl.classList.add('jumping');
        sfx.jump();
      }
      if (((keys[38] || keys[32]) || (gp && (gp.buttons[0].pressed || gp.buttons[1].pressed || gp.buttons[2].pressed || gp.buttons[3].pressed))) && gravity > 0) {
        if (!dbljump) {
          gravity = -9;
          pl.classList.add('jumping');
          sfx.jump();
        }
        dbljump = true;
      }

      var gpa = 0;
      if (gp) {
        gpa = Math.round(gp.axes[0]);
        if (gpa == 0 || gravity == 0) {
          pl.className = '';
          pl.style.transform = 'rotate(0deg)';
        }
      }

      if ((keys[37] || (gp && gpa == -1)) && px > 0) {
        if (!is_xy3_ground) {
          px -= x_speed;
          if (!pl.classList.contains('jumping')) {
             pl.className = '';
             pl.classList.add('goleft');
          }
        } else {
          px = Math.floor(x3 / tile_size) * tile_size + tile_size;
          if (gravity > 0) {
            dbljump = false;
            gravity = 1;
            pl.style.transform = 'rotate(90deg)';
            createWallSparks(px, py, 'left');
          }
          pl.className = '';
        }
      }

      if ((keys[39] || (gp && gpa == 1)) && px + tile_size < GAME_WIDTH) {
        if (!is_xy4_ground) {
          px += x_speed;
          if (!pl.classList.contains('jumping')) {
             pl.className = '';
             pl.classList.add('goright');
          }
        } else {
          px = Math.floor(x4 / tile_size) * tile_size - tile_size;
          if (gravity > 0) {
            dbljump = false;
            gravity = 1;
            pl.style.transform = 'rotate(-90deg)';
            createWallSparks(px, py, 'right');
          }
          pl.className = '';
        }
      }

      if (is_xy5_ground) {
        py = Math.floor(y5 / tile_size) * tile_size + tile_size;
        gravity = 8;
      }

      if (px < 0) px = 0;
      if (px + tile_size > GAME_WIDTH) px = GAME_WIDTH - tile_size;
      pl.style.left = px + 'px';

      var maxTop = (tile_size * rows) - tile_size;
      if (py < 0) py = 0;
      if (py > maxTop) py = maxTop;
      pl.style.top = py + 'px';

      if (is_center_lava) {
        sfx.die();
        createExplosion(px + tile_size/2, py + tile_size/2);
        screenShake();
        px = tile_size * parseFloat(levels[level_num].start.split(',')[0]);
        py = tile_size * parseFloat(levels[level_num].start.split(',')[1]);
        pl.style.top = py + 'px';
        pl.style.left = px + 'px';
        deaths++;
        dc.innerHTML = 'DEATHS<br>' + deaths;
      }

      if (is_center_portal1) {
        let p2 = document.querySelector('.portal2');
        if (p2) {
          px = parseFloat(p2.style.left);
          py = parseFloat(p2.style.top);
          pl.style.top = py + 'px';
          pl.style.left = px + 'px';
        }
      }

      if (is_center_nextlevel && !transitioning) {
        transitioning = true;
        sfx.win();
        createPortalWarp(px + tile_size/2, py + tile_size/2);
        setTimeout(() => {
          transitioning = false;
          buildGame();
        }, 400);
      }

      timer++;
      tc.innerHTML = 'TIME<br>' + secondsToTime(timer);

      playerTrail();
      if (!paused) requestAnimationFrame(gameLoop);
    }
  }

  let lastTime = 0;
  const interval = 1000 / 45;

  function gameLoop(timestamp) {
    if (localLoopId !== activeLoopId || paused) {
      loopRunning = false;
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;

    if (elapsed >= interval) {
      updatePlayer();
      lastTime = timestamp - (elapsed % interval);
    } else {
      requestAnimationFrame(gameLoop);
    }
  }

  function startGameLoopWrapper() {
    if (localLoopId !== activeLoopId) return;
    if (!loopRunning) {
      loopRunning = true;
      lastTime = 0;
      requestAnimationFrame(gameLoop);
    }
  }

  window.startGameLoop = startGameLoopWrapper;

  if (shouldStart !== false) {
    startGameLoopWrapper();
  }

  function playerTrail() {
    // Throttle trail creation to reduce DOM overhead and layout thrashing (especially on mobile)
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const throttleRate = isTouch ? 5 : 3;
    if (timer % throttleRate !== 0) return;

    if (player == 'player') {
      let b = document.createElement('div');
      b.className = 'trailBall';
      b.style.left = px + 11 + 'px';
      b.style.top = py + 5 + 'px';
      b.onanimationend = function () { b.remove(); };
      gc.appendChild(b);
    }

    if (player == 'player2') {
      let b = document.createElement('div');
      b.className = 'trailBall';
      let xx = Math.floor(Math.random() * 15) + 5;
      b.style.left = px + xx + 'px';
      b.style.top = py - 3 + 'px';
      b.onanimationend = function () { b.remove(); };
      gc.appendChild(b);
    }
  }

  // key tracking — register listeners only once
  if (!window._keyListenersAdded) {
    window._keyListenersAdded = true;
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
        return;
      }
      if (paused && e.code === 'KeyR') {
        location.reload();
        return;
      }
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
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

	const startLetters = container.querySelectorAll('.willem__h1-start .willem__letter');
	const endLetters = container.querySelectorAll('.willem__h1-end .willem__letter');
	const slides = container.querySelectorAll('.intro-slide');

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

	/* Start of Timeline (HAS from bottom, SAN from top) */
	if (startLetters.length) {
		tl.from(startLetters, {
			yPercent: 100,
			stagger: 0.025,
			duration: 1.25,
		}, 0)
	}

	if (endLetters.length) {
		tl.from(endLetters, {
			yPercent: -100,
			stagger: 0.025,
			duration: 1.25,
		}, 0)
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

    // انكماش الكلمة وإغلاق الصندوق بعد انتهاء الصور (عند الثانية 5.2)
    if (box.length) {
        tl.to(box, { width: '0em', duration: 1.0, ease: 'power2.inOut' }, 5.2);
        tl.to(growingImage, { width: '0%', duration: 1.0, ease: 'power2.inOut' }, 5.2);
    }
    if (headingStart.length) {
        tl.to(headingStart, { x: '0em', duration: 1.0, ease: 'power2.inOut' }, 5.2);
    }
    if (headingEnd.length) {
        tl.to(headingEnd, { x: '0em', duration: 1.0, ease: 'power2.inOut' }, 5.2);
    }

    // إبعاد كلمة HASSAN بعد الانكماش (الشمال لفوق واليمين لتحت مع الاختفاء) (عند الثانية 6.2)
    if (startLetters.length) {
        tl.to(startLetters, {
            yPercent: -120,
            opacity: 0,
            duration: 1.0,
            ease: 'power2.inOut'
        }, 6.2);
    }
    
    if (endLetters.length) {
        tl.to(endLetters, {
            yPercent: 120,
            opacity: 0,
            duration: 1.0,
            ease: 'power2.inOut'
        }, 6.2);
    }

    // عرض الصور واحدة تلو الأخرى بشكل احترافي (Slideshow cross-fade)
    if (slides.length >= 5) {
        tl.to(slides[0], { opacity: 0, duration: 0.4, ease: 'power1.inOut' }, 2.2);
        tl.to(slides[1], { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, 2.2);

        tl.to(slides[1], { opacity: 0, duration: 0.4, ease: 'power1.inOut' }, 3.0);
        tl.to(slides[2], { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, 3.0);

        tl.to(slides[2], { opacity: 0, duration: 0.4, ease: 'power1.inOut' }, 3.8);
        tl.to(slides[3], { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, 3.8);

        tl.to(slides[3], { opacity: 0, duration: 0.4, ease: 'power1.inOut' }, 4.6);
        tl.to(slides[4], { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, 4.6);
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
                 startBackgroundMusic();
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
        startBackgroundMusic();
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
    // Stop game loop first
    window.startGameLoop = null;
    stopBackgroundMusic();

    // Show cutscene (which now handles showing victory results internally on the same page)
    showCutscene();
}

function showCutscene() {
    const screen  = document.getElementById('cutscene_screen');
    const canvas  = document.getElementById('cutscene_canvas');
    const skipBtn = document.getElementById('cutscene_skip');

    if (skipBtn) skipBtn.style.display = 'block';

    // Lines to display — each is [text, delay_ms, classes]
    const lines = [
        { id: 'cs_line1', text: 'You survived every spike.',      delay: 400,  cls: 'cs-visible' },
        { id: 'cs_line2', text: 'Every fall.',                    delay: 1800, cls: 'cs-visible cs-dim' },
        { id: 'cs_line3', text: 'Every impossible moment.',       delay: 3000, cls: 'cs-visible' },
        { id: 'cs_line4', text: 'TIME: ' + secondsToTime(timer),  delay: 4200, cls: 'cs-visible cs-stat' },
        { id: 'cs_line5', text: 'DEATHS: ' + deaths,              delay: 5400, cls: 'cs-visible cs-stat' }
    ];

    screen.style.display = 'flex';

    // ── Starfield canvas ──
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.6 + 0.1,
        opacity: Math.random()
    }));

    let rafId;
    function drawStars() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach(s => {
            s.y += s.speed;
            if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,255,255,${(0.3 + s.opacity * 0.7).toFixed(2)})`;
            ctx.fill();
        });
        rafId = requestAnimationFrame(drawStars);
    }
    drawStars();

    const lineTimers = [];

    // ── Reveal each line ──
    lines.forEach(({ id, text, delay, cls }) => {
        const tId = setTimeout(() => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = text;
            el.className   = 'cutscene-line ' + cls;
        }, delay);
        lineTimers.push(tId);
    });

    // ── Function to finish cutscene showing results and playing sound ──
    function showResults() {
        if (skipBtn) skipBtn.style.display = 'none';

        // Play win sfx
        if (typeof sfx !== 'undefined' && sfx.win) sfx.win();
    }

    // ── After last line, wait then show results ──
    const AUTO_PROCEED = 6500; // Show final complete state after 6.5 seconds
    let autoTimer = setTimeout(showResults, AUTO_PROCEED);

    skipBtn.onclick = function () {
        clearTimeout(autoTimer);
        
        // Clear pending line animations
        lineTimers.forEach(tId => clearTimeout(tId));

        // Instantly show all lines
        lines.forEach(({ id, text, cls }) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = text;
                el.className   = 'cutscene-line ' + cls;
            }
        });

        // Show results
        showResults();
    };
}

// ============================================
// PAUSE SYSTEM
// ============================================
function togglePause() {
  if (!window.startGameLoop && !paused) return;
  paused = !paused;
  const pauseScreen = document.getElementById('pause_screen');
  if (pauseScreen) pauseScreen.style.display = paused ? 'flex' : 'none';
  if (!paused && window.startGameLoop) {
    window.startGameLoop();
  }
}

// ============================================
// BACKGROUND MUSIC (Web Audio API)
// ============================================
let bgMusicPlaying = false;
let bgMusicTimeout = null;

function startBackgroundMusic() {
  if (bgMusicPlaying) return;
  if (aCtx.state === 'suspended') aCtx.resume();
  bgMusicPlaying = true;
  const melody = [110, 146.8, 164.8, 130.8, 110, 123.5, 110, 146.8];
  let noteIdx = 0;
  function playBeat() {
    if (!bgMusicPlaying) return;
    const osc  = aCtx.createOscillator();
    const gain = aCtx.createGain();
    osc.connect(gain);
    gain.connect(aCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(melody[noteIdx % melody.length], aCtx.currentTime);
    gain.gain.setValueAtTime(0.04, aCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, aCtx.currentTime + 0.38);
    osc.start();
    osc.stop(aCtx.currentTime + 0.4);
    noteIdx++;
    bgMusicTimeout = setTimeout(playBeat, 420);
  }
  playBeat();
}

function stopBackgroundMusic() {
  bgMusicPlaying = false;
  if (bgMusicTimeout) { clearTimeout(bgMusicTimeout); bgMusicTimeout = null; }
}

// ============================================
// RESPONSIVE — update CSS scale on resize
// ============================================
function updateGameScale() {
  const maxW = GAME_WIDTH + 20;
  const scale = Math.min(1, (window.innerWidth - 20) / maxW);
  document.documentElement.style.setProperty('--game-scale', scale.toFixed(4));
  // Refresh gc_loc after scale change
  gc_loc = getGcLoc();
  // Re-sync player x position to the new gc_loc
  var currentPl = document.querySelector('#' + player);
  if (currentPl) {
    var plLeft = parseFloat(currentPl.style.left) || 0;
    // Clamp within game bounds (internal coordinates)
    if (plLeft < 0) currentPl.style.left = '0px';
    if (plLeft + tile_size > GAME_WIDTH) currentPl.style.left = (GAME_WIDTH - tile_size) + 'px';
    // Clamp top
    var plTop = parseFloat(currentPl.style.top) || 0;
    var maxTop = (tile_size * rows) - tile_size;
    if (plTop < 0) currentPl.style.top = '0px';
    if (plTop > maxTop) currentPl.style.top = maxTop + 'px';
  }
}
window.addEventListener('resize', function() {
  updateGameScale();
  // Force gc_loc refresh after a short delay for layout to settle
  setTimeout(function() {
    gc_loc = getGcLoc();
  }, 100);
});
updateGameScale();

window.focus()

// ============================================
// MOBILE TOUCH CONTROLS
// ============================================
;(function() {
  var btnLeft  = document.getElementById('btn_left');
  var btnRight = document.getElementById('btn_right');
  var btnJump  = document.getElementById('btn_jump');

  if (!btnLeft || !btnRight || !btnJump) return;

  // Map buttons to key codes: 37=ArrowLeft, 39=ArrowRight, 38=ArrowUp(jump)
  var buttonMap = [
    { el: btnLeft,  keyCode: 37 },
    { el: btnRight, keyCode: 39 },
    { el: btnJump,  keyCode: 38 }
  ];

  buttonMap.forEach(function(item) {
    item.el.addEventListener('touchstart', function(e) {
      e.preventDefault();
      keys[item.keyCode] = true;
      item.el.classList.add('pressed');
    }, { passive: false });

    item.el.addEventListener('touchend', function(e) {
      e.preventDefault();
      keys[item.keyCode] = false;
      item.el.classList.remove('pressed');
      // Reset player visual like keyup does
      var currentPl = document.querySelector('#' + player);
      if (currentPl) {
        currentPl.className = '';
        currentPl.style.transform = 'rotate(0deg)';
      }
    }, { passive: false });

    item.el.addEventListener('touchcancel', function(e) {
      keys[item.keyCode] = false;
      item.el.classList.remove('pressed');
    }, { passive: false });

    // Prevent context menu on long press
    item.el.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
  });

  // Prevent page scrolling when touching the game area on mobile
  document.addEventListener('touchmove', function(e) {
    if (document.getElementById('mobile_controls').style.display !== 'none') {
      e.preventDefault();
    }
  }, { passive: false });
})();