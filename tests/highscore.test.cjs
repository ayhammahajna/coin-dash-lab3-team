const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Run the actual scene and coin overlap callback with lightweight Phaser stubs.
function loadGame(storage) {
  const context = vm.createContext({
    window: {}, localStorage: storage, coinDashSounds: { coin() {} },
    Phaser: {
      Scene: class {}, Game: class {}, Scale: {},
      Math: { Vector2: class {
        constructor(x, y) { this.x = x; this.y = y; }
        normalize() { return this; }
        scale() { return this; }
      } }
    },
    COIN_DASH: { width: 800, height: 500, roundSeconds: 45, droneCount: 0, colors: {} }
  });
  vm.runInContext(fs.readFileSync(require.resolve('../game.js'), 'utf8'), context);
  return () => {
    const scene = vm.runInContext('new CoinDash()', context);
    const shape = () => ({ setOrigin() { return this; }, body: { setCollideWorldBounds() {}, setCircle() {} } });
    scene.time = { now: 0 };
    scene.events = { once() {} };
    scene.physics = {
      world: { setBounds() {} },
      add: { existing() {}, group() {}, overlap(player, target, callback) {
        if (target === scene.coin) scene.collectCoin = callback;
      } }
    };
    scene.add = {
      grid() {}, rectangle: shape, circle: shape,
      text: () => ({ setOrigin() { return this; }, setDepth() { return this; }, setVisible() { return this; }, setText(value) { this.text = value; } })
    };
    scene.input = { keyboard: {
      createCursorKeys() {}, addKeys() {}, on() {}
    } };
    scene.placeCoin = () => {};
    scene.create();
    return scene;
  };
}

test('records persist across fresh scenes and lower scores never overwrite them', () => {
  const data = new Map();
  const freshScene = loadGame({
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value)
  });
  const first = freshScene();
  assert.equal(first.highScore, 0);
  first.collectCoin();
  first.collectCoin();
  assert.equal(data.get('coinDash.highScore'), '2');
  const refreshed = freshScene();
  assert.equal(refreshed.score, 0);
  assert.equal(refreshed.highScore, 2);
  refreshed.collectCoin();
  assert.equal(data.get('coinDash.highScore'), '2');
  refreshed.collectCoin();
  refreshed.collectCoin();
  assert.equal(data.get('coinDash.highScore'), '3');
  refreshed.finished = true;
  refreshed.collectCoin();
  assert.equal(refreshed.score, 3);
});

test('invalid stored records are ignored', () => {
  for (const value of ['garbage', '-1', '1.5', 'Infinity', '9007199254740992']) {
    const scene = loadGame({ getItem: () => value })();
    assert.equal(scene.highScore, 0, value);
  }
});

test('storage failures keep gameplay and records working across restarts', () => {
  const scene = loadGame({
    getItem() { throw new Error('Storage blocked'); },
    setItem() { throw new Error('Storage full'); }
  })();
  scene.collectCoin();
  assert.equal(scene.highScore, 1);
  scene.create();
  assert.equal(scene.score, 0);
  assert.equal(scene.highScore, 1);
});

test('HUD displays the current record', () => {
  const scene = loadGame({ getItem: () => '7' })();
  // End the update at HUD rendering; movement is unrelated to persistence.
  scene.cursors = Object.fromEntries(['right', 'left', 'up', 'down'].map(k => [k, {}]));
  scene.keys = Object.fromEntries(['W', 'A', 'S', 'D'].map(k => [k, {}]));
  scene.player.body.setVelocity = () => {};
  scene.update();
  assert.match(scene.hud.text, /COINS \/ 00\s+HIGH SCORE \/ 7/);
  assert.equal(scene.timer.text, 'TIME / 45s');
});
