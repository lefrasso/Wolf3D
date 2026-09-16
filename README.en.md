# WOLF3D — Castle Escape · HD Edition

An independently built, playable first-person shooter using HTML, JavaScript, React, CSS, and Three.js. It recreates classic Wolf3D-style mechanics with three original levels, four weapons, 39 enemies, six secrets, HD materials, and local saved games.

## Play

Use the published game, or extract the project ZIP and run:

```sh
node scripts/serve-playable.mjs
```

Then open `http://localhost:8080`. On Windows, you can run `start-game.bat`. Requires Node.js 22.13+ and a browser with WebGL 2. The included `playable/` directory is already built; no package installation is needed to play it. Serve it over HTTP rather than opening the HTML file directly.

## English / Spanish

Choose **EN / ES** in the top toolbar, or **Settings → Language**. The game remembers your selection. The initial language follows your browser preferences; unsupported languages fall back to English. Switching does not reset your game. Existing saves still work.

## Controls

| Action | Control |
|---|---|
| Move | WASD |
| Turn | Mouse or left/right arrows |
| Fire | Left click or Ctrl |
| Interact | E or Space |
| Run | Shift |
| Weapon | 1–4 or mouse wheel |
| Map | M or Tab |
| Pause | Escape or P |
| Save / Load | F5 / F9 during play |

Touchscreens have a left movement joystick, a right drag-to-turn area, and action buttons. If pointer capture is unavailable, turn with the arrow keys or drag with the right mouse button.

## Develop

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev:standalone
pnpm test
pnpm build:standalone
```

See [localization details](docs/LOCALIZATION.md), [technical documentation](docs/INDEX.md), and the [Spanish project README](README.md). The package includes two PRDs and seven ADRs, the source, original textures, a compiled version, and eighteen tests. Browser/GPU visual QA remains pending; the automated checks cover rules, campaign progression, translations and save compatibility.
