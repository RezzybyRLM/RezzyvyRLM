import { GoogleGenerativeAI } from '@google/generative-ai'

export function getInterviewGemmaModelId(): string {
  const fromEnv = process.env.INTERVIEW_GEMMA_MODEL_ID?.trim()
  if (fromEnv) return fromEnv
  return 'gemma-2-2b-it'
}

/**
 * Text-in / text-out interview reply via Gemini API (hosted Gemma).
 * No audio or multimodal input.
 */
export async function generateInterviewReplyText(input: {
  userText: string
  conversationContext: string
  jobRole?: string
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: getInterviewGemmaModelId() })

  const roleLine = input.jobRole ? `Target role: ${input.jobRole}.` : ''

  const prompt = `You are an experienced hiring manager running a structured interview. ${roleLine}

Prior conversation (summary or transcript excerpt):
${input.conversationContext.slice(0, 12000)}

The candidate just said:
"${input.userText.slice(0, 4000)}"

Reply out loud as the interviewer would: brief (under 120 words), professional, one or two short paragraphs max. Ask at most one follow-up, or transition to the next topic. Do not mention that you are an AI. Plain text only, no markdown.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const trimmed = text?.trim()
  if (!trimmed) {
    return 'Thanks for that. Could you add a concrete example or metric that shows the outcome?'
  }
  return trimmed
}
