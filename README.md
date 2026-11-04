# @hoard-engine/audio

Sample playback and intensity-driven music crossfade for the HOARD
engine: a `SoundEffectManager` that plays one-off samples through the
platform's `HTMLAudioElement` (volume, muting, autoplay unlock, active
sample tracking), and a `MusicManager` that crossfades between two
registered tracks according to a `MusicIntensity` value. A
dependency-free leaf of the HOARD engine — pure audio I/O, no game,
framework or asset-path knowledge.

## Pluggable, interoperable, standalone

HOARD engine packages share the same design goals:

- **Pluggable.** Adopt a package on its own, or swap it out, without
  touching the rest of the engine — there is no central engine object
  to install and no package that owns the others.
- **Interoperable.** Packages compose with each other and with
  consumer code through data: minimal shapes, callback seams and plain
  values — never through shared state or a common framework.
- **As standalone as possible.** Each package is usable as-is in any
  project, HOARD-based or not; the leaf packages carry no dependencies
  and import no siblings.

This package meets all three by construction.

## Install

```bash
npm install @hoard-engine/audio
```

Requires Node 18+ (ESM only).

## Usage

```ts
import {
  SoundEffectManager,
  MusicManager,
  type MusicIntensity,
} from '@hoard-engine/audio';

// Which sample plays when is your cue table — the manager only plays
// and mixes the asset URLs you hand it.
const sfx = new SoundEffectManager();
sfx.playSound('sfx/door_open.mp3');
sfx.setVolume(0.8);
sfx.setMuted(false);
sfx.stop();

// Track fallbacks are injected (resolve asset URLs however your
// platform requires); per-call tracks override them.
const music = new MusicManager({
  defaultExploreTrack: '/music/explore.mp3',
  defaultTensionTrack: '/music/tension.mp3',
});

music.playDungeonMusic(); // starts the explore track
music.setIntensity('tension'); // crossfades over 1.5 s
music.setIntensity('explore');
music.setVolume(0.5);
music.stop();
```

The package never asks for your game state or your framework: it knows
nothing about sound cues, asset base paths or intensity heuristics —
consumers own those and pass plain track URLs.

## API

| Export                               | Description                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `SoundEffectManager`                 | Plays one-off samples through the platform's `HTMLAudioElement` — volume, muting, autoplay unlock, active-sample tracking |
| `MusicManager`                       | Crossfades between two registered tracks according to a `MusicIntensity` value, per-call tracks overriding the defaults   |
| `MusicManagerOptions`                | The `MusicManager` constructor options: default explore and tension track URLs                                            |
| `MusicIntensity`                     | The registered track intents: 'explore' and 'tension'                                                                     |
| `CROSSFADE_MS` / `CROSSFADE_TICK_MS` | Crossfade length (1500 ms) and step (50 ms)                                                                               |

## Design notes

- The crossfade runs over ~1.5 s in 50 ms steps (`CROSSFADE_MS`,
  `CROSSFADE_TICK_MS`), fades the outgoing track down from the level it
  started at (never louder), and honours volume and mute changes while a
  fade is in flight.
- Both managers pause active playback on mute, track their active
  elements for `stop()`, and become un-locked through the first user
  gesture (`window` pointerdown/keydown) as browser autoplay policies
  require.

## Development

```bash
npm test          # vitest
npm run check     # tsc --noEmit
npm run lint      # eslint over src
npm run prettier  # prettier --check (fix via prettier:format)
npm run build     # tsc declarations + esbuild ESM bundle to dist/
npm publish       # prepublishOnly runs check + build + test first
```
