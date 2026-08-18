import { AIProvider } from '../modules/ai/ai.provider.js';
import { GeminiProvider } from '../modules/ai/gemini.provider.js';

let aiProvider: AIProvider;

export function getAIProvider(): AIProvider {
  if (!aiProvider) {
    // Instantiates GeminiProvider (which falls back internally to mock if API key is not configured)
    aiProvider = new GeminiProvider();
  }
  return aiProvider;
}
