# ADR 007 — Language-neutral gameplay and local catalogs

**Status:** accepted. **Date:** 2026-09-16. **Release:** v1.1.

## Context

The game was originally Spanish-only. English must cover the complete playing experience, including messages emitted by simulation and text drawn into the 3D scene, while preserving existing progress.

## Decision

Use explicit English and Spanish catalogs keyed by stable identifiers. Translate at the presentation boundary. Simulation notifications contain a key and parameters, not a localized sentence. Store the language preference separately from game saves and apply it live. Repaint only the exit sign's texture when language changes. Use `Intl` for numbers and plurals, and set the document's language.

Use the saved preference first, then the browser's supported preferences, then English. Keep selection available in the game toolbar and settings, displaying each language's native name.

## Alternatives

- Translate only the React markup: leaves gameplay messages and 3D lettering in Spanish.
- Store translated messages in saves: couples saved progress to a language and makes switching inconsistent.
- Add a localization framework: unnecessary for two small, synchronous catalogs without routes or server translation.
- Reload the game to change language: risks resetting progress and needlessly recreates graphics resources.

## Consequences

Language changes preserve simulation state and v1 saves. The catalogs can grow to additional languages without changing gameplay. Tests check missing keys, placeholders, regional language selection, persistence, runtime messages and saved-game compatibility. The source documentation is not automatically translated; the game's player-facing text is. Complex future plural systems or right-to-left languages require explicit extensions.
