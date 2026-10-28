# Coin Dash — Lab 3 starter

Collect coins, avoid drones, and survive a 45-second round. Move with arrow keys or WASD;
press P to pause or resume, and R to restart. Pausing freezes movement, drones, and the
round timer. This is deliberately small so you can add features during the lab.

Coin pickups play a rising chime; game over plays a descending tone. Click or press a
key to enable audio. Use the Mute / Unmute button to toggle all effects, including
across round restarts. Effects use the Web Audio API and require no audio assets.

Run the sound and high-score regression tests with Node.js 18 or newer:
`node --test sounds.test.cjs tests/highscore.test.cjs`.

**Play it here:** https://www.avivz.net/coin-dash/

## Run it locally

Clone the repository and open `index.html` in a browser. Everything is in the repository;
there is no package to install, no build step, no backend, and nothing is fetched from the network.
If your agent prefers a local server, let it serve this folder, for example with
`python3 -m http.server 8000`, and open `http://localhost:8000`.

Open `tests/pause.html` in a browser to run the pause and gameplay regression checks.
The page displays PASS or the first failed check.

## Test the four Lab 3 features manually

Open `index.html`, or serve this folder with `python -m http.server 8000` and
visit `http://localhost:8000`. Use the same address when checking saved records.

- **Pause:** Press P during a round. The PAUSED message appears and the player,
  drones, and countdown freeze. Hold P to confirm it toggles only once. Release
  and press P to resume without losing time. R also starts a fresh round while
  paused. P must not resume a finished round.
- **Theme:** Check the neon page, piece legend, separate coin/high-score and timer
  HUD, and bordered game-over panel. Resize to a narrow window and confirm the
  arena and movement, pause, restart, and mute controls remain usable.
- **High score:** Collect coins and check HIGH SCORE increases when you beat the
  record. Press R, then reload the page: the record remains while current coins
  reset. A lower score must not replace the record. Browser storage restrictions
  may limit the record to the current page session.
- **Sounds:** Click or press a key to enable audio. Collect a coin for a rising
  chime; hit a drone or let time expire for a descending effect. Mute silences
  effects and changes to Unmute; restart with R and confirm it stays muted.
  Unmute restores effects.

## Use it in the lab

This is a template repository. One partner creates the pair's own repository from it
(the **Use this template** button, or `gh repo create <name> --template avivz/coin-dash --public --clone`)
and adds the other partner as a collaborator. Both clone it and open `index.html`.

## Lab report

The repository includes a `lab-report` skill: use `/lab-report` in Claude Code or `$lab-report`
in Codex, for the pre-lab practice run and at the end of the lab. Give it your name, a unique
laptop label, and the session's start and end times with timezone. If it is not listed, ask
your agent to read `.claude/skills/lab-report/SKILL.md` and follow it.

The skill writes a JSON export and a report page under `reports/`, which Git ignores.
Open that page, load your JSON, and check the result. For the final pair report, load both
laptops' JSON files together and save the combined HTML. Use the same time window on both laptops.

## Files

- `.claude/skills/lab-report/`: reporting skill and offline HTML page.
- `.agents/skills/lab-report`: link to the same skill for Codex.
- `.gitignore`: keeps generated reports out of Git.
- `index.html`: page and script loading.
- `style.css`: page appearance.
- `settings.js`: round duration, speeds, colours and dimensions.
- `game.js`: scene, input, collisions, score and end-of-round behaviour.
- `vendor/phaser-3.90.0.min.js`: the pinned Phaser runtime, byte for byte the file published at
  `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`; `vendor/LICENSE.phaser.txt` is its MIT licence.

The game draws its own shapes; there are no image or audio assets. The authored files are under the
MIT licence in LICENSE.txt. Phaser documentation:
https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game
