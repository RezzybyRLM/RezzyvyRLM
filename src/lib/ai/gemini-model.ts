/**
 * Model ID for Google AI Studio `@google/generative-ai` generateContent.
 * `gemini-1.5-flash` (unversioned) and `gemini-pro` are often retired on v1; default to a current Flash model.
 * Override with GEMINI_MODEL in env if your project requires a specific ID (e.g. gemini-2.5-flash).
 */
export function getGeminiTextModelId(): string {
  const fromEnv = process.env.GEMINI_MODEL?.trim()
  if (fromEnv) return fromEnv
  return 'gemini-2.0-flash'
}
