// src/content/platforms/index.ts

export type {
  PlatformDetector,
  PlatformState,
  PlatformConfig,
  InputElementResult
} from './basePlatformDetector';
export { ChatGPTDetector } from './chatGPTDetector';
export { DoubaoDetector } from './doubaoDetector';
export { GeminiDetector } from './geminiDetector';
export {
  DetectorFactory,
  getPlatformDetector,
  getPlatformName,
  getSupportedPlatforms
} from './detectorFactory';
export {
  findInputElement,
  fillContentEditable,
  fillTextElement,
  matchesDomain,
  clickSubmitButton,
  submitViaEnter,
  isProcessing
} from './detectorUtils';