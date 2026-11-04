import type { MusicIntensity } from './MusicIntensity';

// Duration of the crossfade between two tracks and how often the fading
// volumes are stepped during it.
export const CROSSFADE_MS = 1500;
export const CROSSFADE_TICK_MS = 50;

// Track fallbacks are injected by the consumer, whose platform resolves
// asset URLs — the package never touches an asset base path itself.
export interface MusicManagerOptions {
  defaultExploreTrack?: string;
  defaultTensionTrack?: string;
}

export class MusicManager {
  private readonly defaultExploreTrack: string | undefined;
  private readonly defaultTensionTrack: string | undefined;
  private audio: HTMLAudioElement | null = null;
  private fadingAudio: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private currentTrack: string | null = null;
  private exploreTrack: string | null = null;
  private tensionTrack: string | null = null;
  private intensity: MusicIntensity = 'explore';
  private volume = 0.5;
  private isMuted = false;
  private isUnlocked = false;

  constructor(options: MusicManagerOptions = {}) {
    this.defaultExploreTrack = options.defaultExploreTrack;
    this.defaultTensionTrack = options.defaultTensionTrack;

    if (typeof window !== 'undefined') {
      // Unlock audio on first user gesture to comply with browser autoplay policies
      const unlock = () => {
        this.isUnlocked = true;
        if (this.audio && this.audio.paused) {
          this.audio.play().catch(() => {});
        }
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };

      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
    }
  }

  // Registers the explore and tension tracks of the current track set and
  // starts playing the explore track. Called when a track set loads;
  // switching track sets restarts the music at explore intensity. Without
  // an explore track (passed or injected) nothing plays.
  public playDungeonMusic(exploreTrack?: string, tensionTrack?: string) {
    const explore = exploreTrack ?? this.defaultExploreTrack;
    const tension = tensionTrack ?? this.defaultTensionTrack ?? null;
    if (!explore) {
      return; // No explore track configured or passed: nothing to play
    }

    if (this.exploreTrack === explore && this.tensionTrack === tension) {
      return; // Same track set: keep the current intensity and track
    }

    this.exploreTrack = explore;
    this.tensionTrack = tension;
    this.intensity = 'explore';
    this.startTrack(explore);
  }

  // Crossfades to the registered track for the given intensity. No-op when
  // the intensity is unchanged or no tracks are registered.
  public setIntensity(intensity: MusicIntensity) {
    if (intensity === this.intensity || !this.exploreTrack) {
      return;
    }

    const track =
      intensity === 'tension' ? this.tensionTrack : this.exploreTrack;
    if (!track) {
      return;
    }

    this.intensity = intensity;
    this.startTrack(track);
  }

  public getIntensity(): MusicIntensity {
    return this.intensity;
  }

  public unlock(): void {
    this.isUnlocked = true;
    if (this.audio && this.audio.paused && !this.isMuted) {
      this.audio.play().catch(() => {});
    }
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }

  private startTrack(trackPath: string) {
    if (this.currentTrack === trackPath) {
      return;
    }
    this.finishFade();

    const previous = this.audio;
    const previousVolume = previous ? previous.volume : 0;

    const audio = new Audio(trackPath);
    audio.loop = true;
    audio.volume = 0;
    this.audio = audio;
    this.currentTrack = trackPath;
    this.fadingAudio = previous;

    if (this.isUnlocked && !this.isMuted) {
      audio.play().catch(() => {});
    }

    const startedAt = Date.now();
    const step = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / CROSSFADE_MS);
      audio.volume = this.targetVolume() * progress;
      if (previous) {
        // The outgoing track fades down from the level it had when the
        // crossfade started, clamped to the current volume setting — so
        // setVolume(0) silences it immediately without breaking the fade
        // progression, and it never jumps louder than it started.
        previous.volume =
          Math.min(previousVolume, this.targetVolume()) * (1 - progress);
      }
      if (progress >= 1) {
        this.finishFade();
      }
    };
    this.fadeTimer = setInterval(step, CROSSFADE_TICK_MS);
    step();
  }

  // Stops the volume automation and silences the track that was fading out.
  private finishFade() {
    if (this.fadeTimer !== null) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.fadingAudio) {
      this.fadingAudio.pause();
      this.fadingAudio.currentTime = 0;
      this.fadingAudio = null;
    }
  }

  private targetVolume(): number {
    return this.isMuted ? 0 : this.volume;
  }

  public stop() {
    this.finishFade();
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.currentTrack = null;
    this.exploreTrack = null;
    this.tensionTrack = null;
    this.intensity = 'explore';
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio && !this.isMuted && this.fadeTimer === null) {
      this.audio.volume = this.volume;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.volume;
      if (muted) {
        this.audio.pause();
      } else if (this.isUnlocked && this.audio.paused) {
        this.audio.play().catch(() => {});
      }
    }
    if (muted && this.fadingAudio) {
      this.fadingAudio.pause();
    }
  }
}
