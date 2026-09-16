# Language support — v1.1

The game supports **English** and **Español**. Select EN/ES in the top toolbar, or open Settings → Language during a paused game. Native language names stay recognizable regardless of the current selection.

## Behavior

- A previous explicit choice takes priority.
- On a first visit, the game selects the first supported language from the browser's preferences. Regional variants such as `en-GB`, `es-AR`, and `es-CL` resolve to their base language.
- Unsupported preferences fall back to English.
- The language choice is stored locally under `wolf3d-hd:language:v1`, independently of the saved game. Blocked storage does not prevent switching for the current session.
- Switching updates the UI and 3D exit/elevator lettering. It does not reload the level or change position, enemies, inventory, timers, or score.
- Existing v1 save files remain compatible. Language is not baked into the saved gameplay state.
- The document language and description update for accessibility. English and Spanish use localized number formatting and life-count plurals.

## Translation coverage

Both catalogs contain 183 matching entries: menus, difficulty names, level names/briefings, objectives, controls, weapon names, HUD, map, settings, results, errors, interaction prompts, pickups, accessibility labels, and 3D signage. WOLF3D, Castle Escape, key bindings, and standard abbreviations remain unchanged as identifiers.

Developer documentation is primarily Spanish, with this guide and an English quick start. The user interface itself is available in both languages.

## Architecture

| File | Responsibility |
|---|---|
| `lib/game/locales/en.js` | English messages |
| `lib/game/locales/es.js` | Spanish messages |
| `lib/game/i18n.js` | Language selection, interpolation, pluralization and formatting |
| `components/game/WolfGame.jsx` | Language selection and UI translation |
| `lib/game/simulation.js` | Language-neutral message keys and parameters |
| `lib/game/engine.js` | Localized snapshots and in-place signage updates |
| `tests/i18n.test.js` | Catalog consistency, preferences, runtime messages and save compatibility |

The simulation emits descriptors such as `{key: 'pickup.treasure', params: {amount: 500}}`. The renderer resolves them at display time, so an active message changes language immediately. World lettering replaces and disposes only its text texture, preserving gameplay and geometry.

## Add another language

1. Copy `lib/game/locales/en.js` to a new locale module.
2. Translate each value while preserving every key and `{placeholder}`.
3. Import the catalog in `i18n.js`, add it to `CATALOGS`, and register its code and native name in `LANGUAGES`.
4. Include the plural categories needed by that language; extend the simple one/other contract if necessary.
5. Run `pnpm test` and both builds, then review text lengths, keyboard/screen-reader labels and 3D signs in a browser.

No localization service, CDN or additional package is required. Current layouts support left-to-right English and Spanish; right-to-left support would need a dedicated layout change.

## Verification

Eighteen tests pass: the original twelve gameplay checks plus six localization checks. Static JSX inspection found no untranslated Spanish player-facing text in the component. Production and standalone bundles are rebuilt for this release. Actual browser interaction and GPU visual QA remain unperformed, as documented in `VALIDACION.md`.
