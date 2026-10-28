/* global Phaser, COIN_DASH, coinDashSounds */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.highScore = this.highScore || 0;
    try {
      const saved = Number(localStorage.getItem('coinDash.highScore'));
      if (Number.isSafeInteger(saved) && saved >= 0) {
        this.highScore = Math.max(this.highScore, saved);
      }
    } catch {
      // Keep playing with an in-memory record if browser storage is unavailable.
    }
    this.finished = false;
    this.paused = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x263c58, 0.35);
    this.add.rectangle(0, 0, c.width, 44, 0x141f35).setOrigin(0);
    this.add.rectangle(0, 43, c.width, 1, 0x53ffe1, 0.3).setOrigin(0);
    this.hud = this.add.text(18, 12, '', { font: 'bold 18px monospace', color: '#ffda65' });
    this.timer = this.add.text(c.width - 18, 12, '', { font: 'bold 18px monospace', color: '#53ffe1' }).setOrigin(1, 0);
    this.pauseMessage = this.add.text(c.width / 2, c.height / 2,
      'PAUSED\nPress P to resume',
      { font: '28px monospace', color: '#ffffff', backgroundColor: '#0a1120', align: 'center', padding: { x: 24, y: 16 } }
    ).setOrigin(0.5).setDepth(10).setVisible(false);
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        try {
          localStorage.setItem('coinDash.highScore', String(this.highScore));
        } catch {
          // The record still lasts until the page is closed or refreshed.
        }
      }
      coinDashSounds.coin();
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    // Track P's down/up state so a held key can only toggle once, even when
    // repeated keydown events arrive without the browser's repeat flag.
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R,P');
    const restart = () => this.scene.restart();
    const pause = (event) => {
      if (!event.repeat) this.togglePause();
    };
    this.input.keyboard.on('keydown-R', restart);
    this.input.keyboard.on('keydown-P', pause);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown-R', restart);
      this.input.keyboard.off('keydown-P', pause);
    });
  }

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
    } else {
      this.deadline += this.time.now - this.pausedAt;
      this.physics.resume();
    }
    this.pauseMessage.setVisible(this.paused);
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  update() {
    if (this.finished || this.paused) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`COINS / ${String(this.score).padStart(2, '0')}       HIGH SCORE / ${this.highScore}`);
    this.timer.setText(`TIME / ${String(seconds).padStart(2, '0')}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished || this.paused) return;
    this.finished = true;
    coinDashSounds.gameOver();
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x10182d, 0.97).setStrokeStyle(1, 0x53ffe1, 0.7);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
