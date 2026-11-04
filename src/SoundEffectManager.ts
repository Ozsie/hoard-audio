// Sample playback through the platform's HTMLAudioElement: volume,
// muting, autoplay unlock and active-sample tracking. Consumers own
// which sample plays when — this class knows nothing about cues,
// assets or game events.

export class SoundEffectManager {
  private volume = 0.8;
  private isMuted = false;
  private isUnlocked = false;
  private activeAudios: Set<HTMLAudioElement> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.isUnlocked = true;
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };

      window.addEventListener('pointerdown', unlock);
      window.addEventListener('keydown', unlock);
    }
  }

  public playSound(soundPath?: string | null): HTMLAudioElement | null {
    if (!soundPath) {
      return null;
    }
    if (typeof window === 'undefined' && typeof Audio === 'undefined') {
      return null;
    }

    try {
      const audio = new Audio(soundPath);
      audio.volume = this.isMuted ? 0 : this.volume;
      this.activeAudios.add(audio);

      const cleanup = () => {
        this.activeAudios.delete(audio);
        audio.removeEventListener('ended', cleanup);
        audio.removeEventListener('pause', cleanup);
      };
      audio.addEventListener('ended', cleanup);
      audio.addEventListener('pause', cleanup);

      if (!this.isMuted) {
        void audio.play().catch(() => {});
      }

      return audio;
    } catch {
      return null;
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    for (const audio of this.activeAudios) {
      if (!this.isMuted) {
        audio.volume = this.volume;
      }
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    for (const audio of this.activeAudios) {
      audio.volume = muted ? 0 : this.volume;
      if (muted) {
        audio.pause();
      }
    }
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }

  public unlock(): void {
    this.isUnlocked = true;
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked;
  }

  public stop(): void {
    for (const audio of this.activeAudios) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Ignore errors on stopping
      }
    }
    this.activeAudios.clear();
  }

  public stopAll(): void {
    this.stop();
  }
}
