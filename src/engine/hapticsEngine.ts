/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HapticType =
  | 'tap'
  | 'place'
  | 'move'
  | 'discDrop'
  | 'boxCapture'
  | 'turnChange'
  | 'medium'
  | 'heavy'
  | 'win'
  | 'draw'
  | 'loss'
  | 'error'
  | 'invalid'
  | 'countdown';

class HapticsEngine {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public trigger(type: HapticType) {
    if (!this.enabled || typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }

    try {
      switch (type) {
        case 'tap':
          navigator.vibrate(12);
          break;
        case 'place':
        case 'move':
          navigator.vibrate(24);
          break;
        case 'discDrop':
          navigator.vibrate([18, 25, 32]);
          break;
        case 'boxCapture':
          navigator.vibrate([28, 30, 45, 30, 60]);
          break;
        case 'turnChange':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(40);
          break;
        case 'heavy':
          navigator.vibrate([35, 40, 60]);
          break;
        case 'win':
          navigator.vibrate([40, 50, 70, 50, 130]);
          break;
        case 'draw':
          navigator.vibrate([45, 40, 45]);
          break;
        case 'loss':
          navigator.vibrate([60, 50, 40]);
          break;
        case 'error':
        case 'invalid':
          navigator.vibrate([25, 35, 25]);
          break;
        case 'countdown':
          navigator.vibrate(18);
          break;
      }
    } catch {
      // Ignore vibration permissions or unsupported device errors
    }
  }
}

export const hapticsEngine = new HapticsEngine();
