# AGENTS.md

`@hoard-engine/audio` — a HOARD engine package (spec:
`docs/engine-packages.md` in the game repo). Sample playback and
intensity-driven music crossfade over the platform's `HTMLAudioElement`:
a `SoundEffectManager` (volume, muting, autoplay unlock, active-sample
tracking) and a `MusicManager` that crossfades between an explore and a
tension track driven by a `MusicIntensity` value.

## Commands

```bash
npm run build             # tsc declarations + esbuild ESM bundle to dist/
npm test                  # vitest (boundary, public-surface and unit tests)
npm run check             # tsc --noEmit (strict)
npm run lint               # eslint over src and vitest.config.ts
npm run prettier           # prettier check
npm run prettier:format    # prettier fix
```

Run `npm run check`, `npm test`, and `npm run lint` before considering
work done.

## Rules

- Dependency-free leaf: package sources use relative imports only — no
  game code, no Svelte, no i18n, no npm dependencies at runtime. The
  boundary test (`src/boundary.test.ts`) and lint enforce this.
- The public surface is `src/index.ts` only; every source module is
  re-exported there (completeness test `src/publicSurface.test.ts`).
- Game knowledge arrives as data: track URLs are injected
  (`MusicManagerOptions`), and which event plays which sample is the
  consumer's cue table — nothing here may reference game types, content
  or asset-base paths.
- The browser is reached only through the `Audio` constructor and the
  `window` unlock listeners; tests stub the global `Audio`, so the
  suite runs in plain Node without a DOM.
- Published to npm as `@hoard-engine/audio` (v0.1.0) and consumed by the
  game as a `^0.1.0` dependency, like the other HOARD engine packages.
