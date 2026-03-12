// src/content/platforms/detectorFactory.ts

import { PlatformDetector, PlatformState } from './basePlatformDetector';
import { ChatGPTDetector } from './chatGPTDetector';
import { DoubaoDetector } from './doubaoDetector';
import { GeminiDetector } from './geminiDetector';

/**
 * Factory for creating platform detectors
 *
 * The factory is responsible for:
 * 1. Detecting which platform the current page is on
 * 2. Creating the appropriate detector
 * 3. Managing the detector lifecycle
 */
export class DetectorFactory {
  private static detectors: PlatformDetector[] = [
    new ChatGPTDetector(),
    new DoubaoDetector(),
    new GeminiDetector(),
  ];

  private static activeDetector: PlatformDetector | null = null;

  /**
   * Detect the current platform and return the appropriate detector
   */
  public static getDetector(): PlatformDetector | null {
    // Check if we already have an active detector that still matches
    if (this.activeDetector && this.activeDetector.matches()) {
      return this.activeDetector;
    }

    const oldDetector = this.activeDetector;

    // Find a new detector that matches the current page
    for (const detector of this.detectors) {
      if (detector.matches()) {
        if (this.activeDetector !== detector) {
          console.log(`[Detector Factory] Detected platform: ${detector.getPlatformName()}`);
          this.activeDetector = detector;
        }
        return this.activeDetector;
      }
    }

    if (this.activeDetector !== null && this.activeDetector !== oldDetector) {
      console.log(`[Detector Factory] No matching detector found`);
    }
    this.activeDetector = null;
    return null;
  }

  /**
   * Get the current platform name
   */
  public static getPlatformName(): string | null {
    const detector = this.getDetector();
    return detector ? detector.getPlatformName() : null;
  }

  /**
   * Get all available platform names
   */
  public static getSupportedPlatforms(): string[] {
    return this.detectors.map(d => d.getPlatformName());
  }

  /**
   * Cleanup all detectors
   */
  public static cleanup(): void {
    for (const detector of this.detectors) {
      detector.cleanup();
    }
    this.activeDetector = null;
  }

  /**
   * Get the current state from the active detector
   */
  public static getState(): PlatformState | null {
    const detector = this.getDetector();
    if (detector) {
      return detector.getState();
    }
    return null;
  }
}

/**
 * Convenience function to get the current detector
 */
export function getPlatformDetector(): PlatformDetector | null {
  return DetectorFactory.getDetector();
}

/**
 * Convenience function to get the current platform name
 */
export function getPlatformName(): string | null {
  return DetectorFactory.getPlatformName();
}

/**
 * Convenience function to get supported platforms
 */
export function getSupportedPlatforms(): string[] {
  return DetectorFactory.getSupportedPlatforms();
}