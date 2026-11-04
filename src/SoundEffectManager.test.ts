import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { SoundEffectManager } from './SoundEffectManager';

describe('SoundEffectManager', () => {
  let playSpy: Mock;
  let pauseSpy: Mock;
  let mockAudioInstance: {
    play: Mock;
    pause: Mock;
    volume: number;
    currentTime: number;
    addEventListener: Mock;
    removeEventListener: Mock;
  };

  beforeEach(() => {
    playSpy = vi.fn().mockImplementation(() => Promise.resolve());
    pauseSpy = vi.fn();
    mockAudioInstance = {
      play: playSpy,
      pause: pauseSpy,
      volume: 1,
      currentTime: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    // Mock global Audio
    vi.stubGlobal(
      'Audio',
      // Vitest 5 only constructs mocks whose implementation is a
      // `function`/`class`, and SoundEffectManager calls `new Audio(...)`.
      vi.fn().mockImplementation(function () {
        return mockAudioInstance;
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default volume and not muted', () => {
    const manager = new SoundEffectManager();
    expect(manager.getVolume()).toBe(0.8);
    expect(manager.isSoundMuted()).toBe(false);
  });

  it('updates volume clamped between 0 and 1', () => {
    const manager = new SoundEffectManager();
    manager.setVolume(0.8);
    expect(manager.getVolume()).toBe(0.8);
    manager.setVolume(1.5);
    expect(manager.getVolume()).toBe(1);
    manager.setVolume(-0.5);
    expect(manager.getVolume()).toBe(0);
  });

  it('updates muted state', () => {
    const manager = new SoundEffectManager();
    manager.setMuted(true);
    expect(manager.isSoundMuted()).toBe(true);
    manager.setMuted(false);
    expect(manager.isSoundMuted()).toBe(false);
  });

  it('plays sound file when unmuted', () => {
    const manager = new SoundEffectManager();
    const audio = manager.playSound('/sounds/sword_slash.mp3');

    expect(Audio).toHaveBeenCalledWith('/sounds/sword_slash.mp3');
    expect(playSpy).toHaveBeenCalled();
    expect(audio).toBeDefined();
  });

  it('does not call play() when muted', () => {
    const manager = new SoundEffectManager();
    manager.setMuted(true);
    manager.playSound('/sounds/sword_slash.mp3');

    expect(Audio).toHaveBeenCalledWith('/sounds/sword_slash.mp3');
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('returns null if sound path is empty or undefined', () => {
    const manager = new SoundEffectManager();
    expect(manager.playSound('')).toBeNull();
    expect(manager.playSound(undefined)).toBeNull();
    expect(manager.playSound(null)).toBeNull();
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('stops active sounds on stop() / stopAll()', () => {
    const manager = new SoundEffectManager();
    manager.playSound('/sounds/test.mp3');
    manager.stop();
    expect(pauseSpy).toHaveBeenCalled();
  });

  it('applies volume changes to active sounds', () => {
    const manager = new SoundEffectManager();
    manager.playSound('/sounds/test.mp3');
    manager.setVolume(0.3);
    expect(mockAudioInstance.volume).toBe(0.3);
  });

  it('silences and pauses active sounds when muted', () => {
    const manager = new SoundEffectManager();
    manager.playSound('/sounds/test.mp3');
    manager.setMuted(true);
    expect(mockAudioInstance.volume).toBe(0);
    expect(pauseSpy).toHaveBeenCalled();
  });
});
