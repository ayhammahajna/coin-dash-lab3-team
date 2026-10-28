const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup({ supported = true, suspended = false } = {}) {
  const events = {};
  const attributes = {};
  const tones = [];
  const gains = [];
  let creations = 0;
  const button = { addEventListener: (_, fn) => { events.click = fn; },
    setAttribute: (key, value) => { attributes[key] = value; } };
  class AudioContext {
    constructor() { creations++; this.state = suspended ? 'suspended' : 'running'; this.currentTime = 10; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    createGain() {
      const gain = { value: 1, setValueAtTime(value) { this.value = value; },
        linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
      gains.push(gain);
      return { gain, connect() {}, disconnect() {} };
    }
    createOscillator() {
      const tone = { frequency: {}, connect() {}, disconnect() {},
        start(time) { this.startTime = time; }, stop(time) { this.stopTime = time; } };
      tones.push(tone);
      return tone;
    }
  }
  const scope = { window: supported ? { AudioContext } : {}, document: {
    getElementById: () => button, addEventListener: (event, fn) => { events[event] = fn; }
  } };
  vm.runInNewContext(readFileSync('sounds.js', 'utf8'), scope);
  return { sounds: scope.window.coinDashSounds, events, attributes, tones, gains, button,
    creations: () => creations };
}

test('audio waits for a gesture, resumes, and reuses its context', () => {
  const app = setup({ suspended: true });
  app.sounds.coin();
  assert.equal(app.creations(), 0);
  app.events.keydown();
  app.events.pointerdown();
  app.sounds.coin();
  assert.equal(app.creations(), 1);
  assert.deepEqual(app.tones.map(t => t.frequency.value), [880, 1320]);
  assert.ok(app.tones.every(t => t.stopTime > t.startTime));
  app.tones.forEach(t => t.onended());
});

test('game over uses a distinct descending effect', () => {
  const app = setup();
  app.events.pointerdown();
  app.sounds.gameOver();
  assert.deepEqual(app.tones.map(t => t.frequency.value), [440, 330, 220]);
  assert.ok(app.tones.every(t => t.type === 'triangle'));
});

test('mute silences active and future effects and unmute restores audio', () => {
  const app = setup();
  app.events.keydown();
  app.sounds.coin();
  app.events.click();
  assert.equal(app.gains[0].value, 0);
  assert.equal(app.attributes['aria-pressed'], 'true');
  assert.equal(app.button.textContent, 'Unmute');
  app.sounds.coin();
  app.sounds.gameOver();
  assert.equal(app.tones.length, 2);
  app.events.click();
  assert.equal(app.gains[0].value, 1);
  assert.equal(app.attributes['aria-pressed'], 'false');
  app.sounds.coin();
  assert.equal(app.tones.length, 4);
});

test('unsupported audio does not interrupt gameplay or mute controls', () => {
  const app = setup({ supported: false });
  app.events.keydown();
  app.sounds.coin();
  app.events.click();
  app.sounds.gameOver();
  assert.equal(app.button.textContent, 'Unmute');
});

test('game over sound fires once even if finish is called repeatedly', () => {
  let played = 0;
  const scope = { window: {}, Phaser: { Scene: class {}, Game: class {}, AUTO: 0,
    Scale: { FIT: 0, CENTER_HORIZONTALLY: 0 } }, COIN_DASH: { colors: {} },
    coinDashSounds: { gameOver() { played++; } } };
  vm.runInNewContext(readFileSync('game.js', 'utf8') + '\nwindow.Scene = CoinDash;', scope);
  const scene = new scope.window.Scene();
  scene.physics = { pause() {} };
  scene.add = { rectangle() { return { setStrokeStyle() {} }; }, text() { return { setOrigin() {} }; } };
  scene.finish('Time is up!');
  scene.finish('A drone caught you!');
  assert.equal(played, 1);
});
