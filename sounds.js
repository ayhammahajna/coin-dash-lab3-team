// Synthesized effects: no downloads or audio assets required.
window.coinDashSounds = (() => {
  let context;
  let output;
  let muted = false;
  const button = document.getElementById('mute');

  function unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      if (!context) {
        context = new AudioContext();
        output = context.createGain();
        output.gain.value = muted ? 0 : 1;
        output.connect(context.destination);
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch {
      // Audio being unavailable must never interrupt a round.
    }
  }

  function play(notes, type) {
    if (muted || !context || context.state !== 'running') return;
    const start = context.currentTime;
    notes.forEach(([frequency, offset, duration]) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, start + offset);
      envelope.gain.linearRampToValueAtTime(0.15, start + offset + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.001, start + offset + duration);
      oscillator.connect(envelope);
      envelope.connect(output);
      oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
      };
      oscillator.start(start + offset);
      oscillator.stop(start + offset + duration);
    });
  }

  document.addEventListener('keydown', unlock);
  document.addEventListener('pointerdown', unlock);
  button.addEventListener('click', () => {
    muted = !muted;
    unlock();
    if (output) output.gain.setValueAtTime(muted ? 0 : 1, context.currentTime);
    button.textContent = muted ? 'Unmute' : 'Mute';
    button.setAttribute('aria-pressed', String(muted));
    button.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
  });

  return {
    coin: () => play([[880, 0, 0.09], [1320, 0.07, 0.14]], 'sine'),
    gameOver: () => play([[440, 0, 0.18], [330, 0.15, 0.18], [220, 0.3, 0.35]], 'triangle')
  };
})();
