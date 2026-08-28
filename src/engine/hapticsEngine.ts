/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HapticType = 'tap' | 'place' | 'move' | 'medium' | 'win' | 'draw' | 'error' | 'countdown';

class HapticsEngine {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public trigger(type: HapticType) {
    if (!this.enabled || typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }

    try {
      switch (type) {
        case 'tap':
          navigator.vibrate(15);
          break;
        case 'place':
        case 'move':
          navigator.vibrate(30);
          break;
        case 'medium':
          navigator.vibrate(45);
          break;
        case 'win':
          navigator.vibrate([40, 60, 80, 60, 140]);
          break;
        case 'draw':
          navigator.vibrate([50, 40, 50]);
          break;
        case 'error':
          navigator.vibrate([30, 40, 30]);
          break;
        case 'countdown':
          navigator.vibrate(20);
          break;
      }
    } catch {
      // Ignore vibration permissions or unsupported device errors
    }
  }
}

export const hapticsEngine = new HapticsEngine();
