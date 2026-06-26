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

function secondsToTime(e) {
  var totalSec = e / 45;
  var m  = Math.floor(totalSec / 60).toString().padStart(2, '0');
  var s  = Math.floor(totalSec % 60).toString().padStart(2, '0');
  var cs = Math.floor((totalSec % 1) * 100).toString().padStart(2, '0');
  return m + ':' + s + ':' + cs;
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

  // Clear and rebuild layout with the transparent FX Canvas and updated counters
  gc.innerHTML = `
    <div id="${player}"></div>
    <div id="deaths_counter">DEATHS<br><span class="value">${deaths}</span></div>
    <div id="time_counter">TIME<br><span class="value">${secondsToTime(timer)}</span></div>
    <canvas id="fx_canvas" width="1000" height="550" style="position: absolute; top: 0; left: 0; width: 1000px; height: 550px; pointer-events: none; z-index: 15000;"></canvas>
  `;

  if (level_num < levels.length - 1) {
    level_num++;
  } else {
    showVictory();
    return; // Stop building next level
  }

  // Setup Canvas and arrays for Visual Effects
  const fxCanvas = document.getElementById('fx_canvas');
  const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
  const trails = [];
  const particles = [];
  const sparks = [];
  const warpParticles = [];
  let flashOpacity = 0.0;

  // Local effect triggers
  function createExplosion(x, y, color = 'cyan') {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5 + 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        color: color,
        size: 5
      });
    }
  }

  function createWallSparks(x, y, direction = 'right') {
    const sparkX = x + (direction === 'right' ? 25 : 0);
    for (let i = 0; i < 5; i++) {
      sparks.push({
        x: sparkX,
        y: y + Math.random() * 20,
        life: 1.0,
        decay: 0.05,
        speedY: Math.random() * 1.5 + 0.5
      });
    }
  }

  function createLevelFlash() {
    flashOpacity = 1.0;
  }

  function createPortalWarp(x, y) {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const distance = 50;
      warpParticles.push({
        startX: x,
        startY: y,
        targetX: Math.cos(angle) * distance,
        targetY: Math.sin(angle) * distance,
        life: 1.0,
        decay: 1 / 36
      });
    }
  }

  // Level transition flash
  if (level_num > 0) {
    createLevelFlash();
  }

  let tcValue = gc.querySelector('#time_counter .value');
  let dcValue = gc.querySelector('#deaths_counter .value');
  if (tcValue) tcValue.textContent = secondsToTime(timer);
  if (dcValue) dcValue.textContent = deaths;

  // set random level color
  document.body.style.setProperty('--root-clr', 'hsl(' + Math.random() * 360 + 'deg,75%,50%)');

  // Add tiles using DocumentFragment to prevent multiple reflows
  const fragment = document.createDocumentFragment();
  for (var i = 0; i < cols * rows; i++) {
    var tile = document.createElement('div');
    tile.className = 'tile';

    var mapVal = levels[level_num].map[i];
    if (mapVal == 0) tile.className = 'tile ground';
    else if (mapVal == 2) tile.className = 'tile lava';
    else if (mapVal == 3) tile.className = 'tile lava spleft';
    else if (mapVal == 4) tile.className = 'tile lava sptop';
    else if (mapVal == 5) tile.className = 'tile lava spright';
    else if (mapVal == 6) tile.className = 'tile portal1';
    else if (mapVal == 7) tile.className = 'tile portal2';
    else if (mapVal == 8) tile.className = 'tile innerwall';
    else if (mapVal == 9) tile.className = 'tile nextlevel';
    else if (mapVal == 10) tile.className = 'tile laser';
    else if (mapVal == 11) tile.className = 'tile laser-node';

    tile.setAttribute('grid_loc', [i % cols, Math.floor(i / cols)]);
    tile.style.width = tile_size + 'px';
    tile.style.height = tile_size + 'px';
    tile.style.position = 'absolute';
    tile.style.left = (i % cols) * tile_size + 'px';
    tile.style.top = Math.floor(i / cols) * tile_size + 'px';

    fragment.appendChild(tile);
  }
  gc.appendChild(fragment);

  // add player stuff
  var pl = document.querySelector('#' + player);
  if (pl) {
    pl.style.width = tile_size + 'px';
    pl.style.height = tile_size + 'px';
    pl.style.top = (tile_size * levels[level_num].start.split(',')[1]) + 'px';
    pl.style.left = (tile_size * levels[level_num].start.split(',')[0]) + 'px';
  }

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
        if (pl && pl.classList.contains('jumping')) {
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
        if (pl) pl.classList.add('jumping');
        sfx.jump();
      }
      if (((keys[38] || keys[32]) || (gp && (gp.buttons[0].pressed || gp.buttons[1].pressed || gp.buttons[2].pressed || gp.buttons[3].pressed))) && gravity > 0) {
        if (!dbljump) {
          gravity = -9;
          if (pl) pl.classList.add('jumping');
          sfx.jump();
        }
        dbljump = true;
      }

      var gpa = 0;
      if (gp) {
        gpa = Math.round(gp.axes[0]);
        if (gpa == 0 || gravity == 0) {
          if (pl) {
            pl.className = '';
            pl.style.transform = 'rotate(0deg)';
          }
        }
      }

      if ((keys[37] || (gp && gpa == -1)) && px > 0) {
        if (!is_xy3_ground) {
          px -= x_speed;
          if (pl && !pl.classList.contains('jumping')) {
             pl.className = '';
             pl.classList.add('goleft');
          }
        } else {
          px = Math.floor(x3 / tile_size) * tile_size + tile_size;
          if (gravity > 0) {
            dbljump = false;
            gravity = 1;
            if (pl) pl.style.transform = 'rotate(90deg)';
            createWallSparks(px, py, 'left');
          }
          if (pl) pl.className = '';
        }
      }

      if ((keys[39] || (gp && gpa == 1)) && px + tile_size < GAME_WIDTH) {
        if (!is_xy4_ground) {
          px += x_speed;
          if (pl && !pl.classList.contains('jumping')) {
             pl.className = '';
             pl.classList.add('goright');
          }
        } else {
          px = Math.floor(x4 / tile_size) * tile_size - tile_size;
          if (gravity > 0) {
            dbljump = false;
            gravity = 1;
            if (pl) pl.style.transform = 'rotate(-90deg)';
            createWallSparks(px, py, 'right');
          }
          if (pl) pl.className = '';
        }
      }

      if (is_xy5_ground) {
        py = Math.floor(y5 / tile_size) * tile_size + tile_size;
        gravity = 8;
      }

      if (px < 0) px = 0;
      if (px + tile_size > GAME_WIDTH) px = GAME_WIDTH - tile_size;
      if (pl) pl.style.left = px + 'px';

      var maxTop = (tile_size * rows) - tile_size;
      if (py < 0) py = 0;
      if (py > maxTop) py = maxTop;
      if (pl) pl.style.top = py + 'px';

      if (is_center_lava) {
        sfx.die();
        createExplosion(px + tile_size/2, py + tile_size/2);
        screenShake();
        px = tile_size * parseFloat(levels[level_num].start.split(',')[0]);
        py = tile_size * parseFloat(levels[level_num].start.split(',')[1]);
        if (pl) {
          pl.style.top = py + 'px';
          pl.style.left = px + 'px';
        }
        deaths++;
        if (dcValue) dcValue.textContent = deaths;
      }

      if (is_center_portal1) {
        let p2 = document.querySelector('.portal2');
        if (p2) {
          px = parseFloat(p2.style.left);
          py = parseFloat(p2.style.top);
          if (pl) {
            pl.style.top = py + 'px';
            pl.style.left = px + 'px';
          }
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
      if (tcValue) tcValue.textContent = secondsToTime(timer);

      playerTrail();
    }
  }

  let lastTime = 0;
  const interval = 1000 / 45;

  function updateAndRenderFXCanvas() {
    if (!fxCtx) return;
    
    // Clear canvas
    fxCtx.clearRect(0, 0, 1000, 550);
    
    // Update and draw trails
    for (let i = trails.length - 1; i >= 0; i--) {
      const t = trails[i];
      t.life -= t.decay;
      if (t.life <= 0) {
        trails.splice(i, 1);
        continue;
      }
      fxCtx.fillStyle = `rgba(0, 255, 255, ${t.life})`;
      fxCtx.beginPath();
      fxCtx.arc(t.x, t.y - (1 - t.life) * 25, t.size, 0, Math.PI * 2);
      fxCtx.fill();
    }
    
    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      fxCtx.fillStyle = p.color;
      fxCtx.globalAlpha = p.life;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      fxCtx.fill();
    }
    fxCtx.globalAlpha = 1.0;
    
    // Update and draw sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= s.decay;
      if (s.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      s.y += s.speedY;
      fxCtx.globalAlpha = s.life;
      const grad = fxCtx.createLinearGradient(s.x, s.y, s.x, s.y + 8);
      grad.addColorStop(0, 'orange');
      grad.addColorStop(1, 'transparent');
      fxCtx.fillStyle = grad;
      fxCtx.fillRect(s.x, s.y, 3 * s.life, 8);
    }
    fxCtx.globalAlpha = 1.0;
    
    // Update and draw warp particles
    for (let i = warpParticles.length - 1; i >= 0; i--) {
      const w = warpParticles[i];
      w.life -= w.decay;
      if (w.life <= 0) {
        warpParticles.splice(i, 1);
        continue;
      }
      const progress = 1.0 - w.life;
      let curX, curY, scale;
      if (progress < 0.5) {
        const p = progress * 2;
        curX = w.startX + w.targetX * 0.5 * p;
        curY = w.startY + w.targetY * 0.5 * p;
        scale = 1.0 + 0.5 * p;
      } else {
        const p = (progress - 0.5) * 2;
        curX = w.startX + w.targetX * 0.5 + w.targetX * 0.5 * p;
        curY = w.startY + w.targetY * 0.5 + w.targetY * 0.5 * p;
        scale = 1.5 - 1.3 * p;
      }
      fxCtx.globalAlpha = w.life;
      fxCtx.fillStyle = 'cyan';
      fxCtx.beginPath();
      fxCtx.arc(curX, curY, 3 * scale, 0, Math.PI * 2);
      fxCtx.fill();
    }
    fxCtx.globalAlpha = 1.0;
    
    // Draw level transition flash
    if (flashOpacity > 0) {
      flashOpacity -= 0.035;
      if (flashOpacity < 0) flashOpacity = 0;
      fxCtx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
      fxCtx.fillRect(0, 0, 1000, 550);
    }
  }

  function gameLoop(timestamp) {
    if (localLoopId !== activeLoopId || paused) {
      loopRunning = false;
      return;
    }

    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;

    // 1. Render all Canvas FX at native screen refresh rate
    updateAndRenderFXCanvas();

    // 2. Run physics ticks if enough time has passed
    if (elapsed >= interval) {
      updatePlayer();
      lastTime = timestamp - (elapsed % interval);
    }

    // 3. Request next frame
    requestAnimationFrame(gameLoop);
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
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const throttleRate = isTouch ? 5 : 3;
    if (timer % throttleRate !== 0) return;

    if (player === 'player') {
      trails.push({
        x: px + 11,
        y: py + 5,
        size: 3,
        life: 1.0,
        decay: 1 / (45 * 0.75)
      });
    }

    if (player === 'player2') {
      let xx = Math.floor(Math.random() * 15) + 5;
      trails.push({
        x: px + xx,
        y: py - 3,
        size: 3,
        life: 1.0,
        decay: 1 / (45 * 0.75)
      });
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
  const maxW = GAME_WIDTH;
  const maxH = 550; // tile_size * rows = 25 * 22
  const paddingX = 24;
  
  // Detect if touch is supported (which usually means mobile controls are visible)
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const paddingY = isTouch ? 130 : 40; // reserve space for mobile controls at bottom
  
  const scaleX = (window.innerWidth - paddingX) / maxW;
  const scaleY = (window.innerHeight - paddingY) / maxH;
  
  // Clamp scale between 0.2 and 1.0
  const scale = Math.max(0.2, Math.min(1.0, scaleX, scaleY));
  
  document.documentElement.style.setProperty('--game-scale', scale.toFixed(4));
  
  // Refresh gc_loc after scale change
  gc_loc = getGcLoc();
  
  // Re-sync player position clamping
  var currentPl = document.querySelector('#' + player);
  if (currentPl) {
    var plLeft = parseFloat(currentPl.style.left) || 0;
    if (plLeft < 0) currentPl.style.left = '0px';
    if (plLeft + tile_size > GAME_WIDTH) currentPl.style.left = (GAME_WIDTH - tile_size) + 'px';
    
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