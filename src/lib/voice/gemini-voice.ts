import { geminiAI } from '@/lib/ai/gemini'

export interface VoiceProfile {
  name: string
  description: string
  rate: number // 0.5 to 2.0
  pitch: number // 0 to 2
  volume: number // 0 to 1
  voiceType: 'professional' | 'friendly' | 'authoritative' | 'casual' | 'energetic'
  language?: string // Language code (e.g., 'en-US', 'es-ES', 'fr-FR')
}

export interface LanguageSupport {
  code: string
  name: string
  nativeName: string
  voices: string[]
}

export const SUPPORTED_LANGUAGES: LanguageSupport[] = [
  { code: 'en-US', name: 'English (US)', nativeName: 'English', voices: ['en-US', 'en-GB'] },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español', voices: ['es-ES', 'es-MX'] },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', voices: ['fr-FR', 'fr-CA'] },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch', voices: ['de-DE', 'de-AT'] },
  { code: 'it-IT', name: 'Italian', nativeName: 'Italiano', voices: ['it-IT'] },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português', voices: ['pt-BR', 'pt-PT'] },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語', voices: ['ja-JP'] },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어', voices: ['ko-KR'] },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文', voices: ['zh-CN', 'zh-TW'] },
  { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية', voices: ['ar-SA', 'ar-EG'] },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', voices: ['hi-IN'] },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', voices: ['ru-RU'] },
  { code: 'nl-NL', name: 'Dutch', nativeName: 'Nederlands', voices: ['nl-NL', 'nl-BE'] },
  { code: 'pl-PL', name: 'Polish', nativeName: 'Polski', voices: ['pl-PL'] },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe', voices: ['tr-TR'] },
]

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    name: 'Professional Interviewer',
    description: 'Calm, professional voice for formal interviews',
    rate: 0.88, // Optimal for natural speech (0.85-0.95 range)
    pitch: 1.0, // Neutral pitch for professional tone
    volume: 0.92, // Clear but not too loud
    voiceType: 'professional'
  },
  {
    name: 'Friendly Coach',
    description: 'Warm, encouraging voice for supportive feedback',
    rate: 0.9, // Slightly faster for friendly tone
    pitch: 1.05, // Slightly higher for warmth
    volume: 0.88, // Comfortable volume
    voiceType: 'friendly'
  },
  {
    name: 'Executive',
    description: 'Authoritative, confident voice',
    rate: 0.82, // Slower for authority
    pitch: 0.95, // Slightly lower for depth
    volume: 0.95, // Strong presence
    voiceType: 'authoritative'
  },
  {
    name: 'Casual Mentor',
    description: 'Relaxed, conversational voice',
    rate: 0.93, // Natural conversation pace
    pitch: 1.02, // Slightly elevated for friendliness
    volume: 0.85, // Relaxed volume
    voiceType: 'casual'
  },
  {
    name: 'Energetic Motivator',
    description: 'Enthusiastic, upbeat voice',
    rate: 0.96, // Faster but still natural
    pitch: 1.08, // Higher for energy
    volume: 0.92, // Energetic but clear
    voiceType: 'energetic'
  }
]

export class GeminiVoiceService {
  private currentProfile: VoiceProfile = VOICE_PROFILES[0]
  private speechSynthesis: SpeechSynthesis | null = null
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private voicesLoaded: boolean = false
  private availableVoices: SpeechSynthesisVoice[] = []
  private currentLanguage: string = 'en-US'

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis
      this.loadVoices()
      this.detectLanguage()
    }
  }

  /**
   * Detect user's preferred language
   */
  private detectLanguage(): void {
    if (typeof window !== 'undefined' && navigator.language) {
      this.currentLanguage = navigator.language
      console.log('Detected language:', this.currentLanguage)
    }
  }

  /**
   * Set the language for speech
   */
  setLanguage(languageCode: string): void {
    this.currentLanguage = languageCode
    console.log('Language set to:', languageCode)
  }

  /**
   * Get current language
   */
  getLanguage(): string {
    return this.currentLanguage
  }

  /**
   * Load available voices (required for Chrome/Edge)
   */
  private loadVoices(): void {
    if (!this.speechSynthesis) return

    // Try to get voices immediately
    this.availableVoices = this.speechSynthesis.getVoices()
    
    if (this.availableVoices.length > 0) {
      this.voicesLoaded = true
      console.log(`Loaded ${this.availableVoices.length} voices`)
      return
    }

    // Voices load asynchronously in Chrome/Edge, so wait for the event
    if ('onvoiceschanged' in this.speechSynthesis) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.availableVoices = this.speechSynthesis!.getVoices()
        this.voicesLoaded = true
        console.log(`Loaded ${this.availableVoices.length} voices (async)`)
      }
    }

    // Fallback: try again after a short delay
    setTimeout(() => {
      if (!this.voicesLoaded) {
        this.availableVoices = this.speechSynthesis!.getVoices()
        this.voicesLoaded = true
        console.log(`Loaded ${this.availableVoices.length} voices (delayed)`)
      }
    }, 100)
  }

  /**
   * Set the voice profile to use for speech
   */
  setVoiceProfile(profile: VoiceProfile) {
    this.currentProfile = profile
  }

  /**
   * Generate conversational response using Gemini AI and speak it
   */
  async generateAndSpeakResponse(userInput: string, conversationContext: string): Promise<string> {
    if (!this.speechSynthesis) {
      console.error('Speech synthesis not available')
      return ''
    }

    try {
      // Use Gemini to generate a conversational response
      const aiResponse = await this.generateConversationalResponse(userInput, conversationContext)
      
      // Speak the AI response with the current voice profile
      this.speak(aiResponse)
      
      return aiResponse
    } catch (error) {
      console.error('Error in Gemini voice service:', error)
      // Fallback to a generic response
      const fallbackResponse = "I'm sorry, I didn't catch that. Could you please repeat?"
      // Apply natural speech patterns even for fallback
      const enhancedFallback = this.applyNaturalSpeechPatterns(fallbackResponse)
      this.speak(enhancedFallback)
      return enhancedFallback
    }
  }

  /**
   * Generate natural speech using Gemini AI and speak it (for pre-written text)
   * Falls back to enhanced text processing if Gemini is unavailable
   */
  async speakWithGemini(text: string, context?: string): Promise<void> {
    if (!this.speechSynthesis) {
      console.error('Speech synthesis not available')
      return
    }

    try {
      // Use Gemini to enhance the text for natural speech
      const enhancedText = await this.enhanceTextForSpeech(text, context)
      
      // Further enhance with natural speech patterns
      const finalText = this.applyNaturalSpeechPatterns(enhancedText)
      
      // Speak the enhanced text with the current voice profile
      this.speak(finalText)
    } catch (error) {
      console.error('Error in Gemini voice service:', error)
      // Fallback: apply natural speech patterns without Gemini
      const enhancedText = this.applyNaturalSpeechPatterns(text)
      this.speak(enhancedText)
    }
  }

  /**
   * Apply natural speech patterns to text to make it sound more human
   * Works even without Gemini API
   */
  private applyNaturalSpeechPatterns(text: string): string {
    let processed = text
    
    // Convert formal language to conversational
    processed = processed.replace(/\bPlease\s+describe\b/gi, "Tell me about")
    processed = processed.replace(/\bPlease\s+explain\b/gi, "Can you explain")
    processed = processed.replace(/\bI would like to\b/gi, "I'd like to")
    processed = processed.replace(/\bI will\b/gi, "I'll")
    processed = processed.replace(/\bIt is\b/gi, "It's")
    processed = processed.replace(/\bThat is\b/gi, "That's")
    processed = processed.replace(/\bYou are\b/gi, "You're")
    processed = processed.replace(/\bWe are\b/gi, "We're")
    processed = processed.replace(/\bCannot\b/gi, "Can't")
    processed = processed.replace(/\bDo not\b/gi, "Don't")
    processed = processed.replace(/\bWill not\b/gi, "Won't")
    
    // Add natural filler words for conversational flow
    // But only occasionally to avoid overdoing it
    const sentences = processed.match(/[^.!?]+[.!?]+/g) || []
    if (sentences.length > 1) {
      // Add "Well" or "So" to some sentences randomly (but not all)
      const modifiedSentences = sentences.map((sentence, index) => {
        if (index === 0 && Math.random() > 0.7) {
          return sentence.trim().replace(/^/, 'Well, ')
        }
        if (index > 0 && Math.random() > 0.8) {
          return sentence.trim().replace(/^/, 'So, ')
        }
        return sentence.trim()
      })
      processed = modifiedSentences.join(' ')
    }
    
    // Remove overly formal phrases
    processed = processed.replace(/\bThank you for\b/gi, "Thanks for")
    processed = processed.replace(/\bIn order to\b/gi, "To")
    processed = processed.replace(/\bDue to the fact that\b/gi, "Because")
    
    return processed.trim()
  }

  /**
   * Generate conversational response based on user input
   */
  private async generateConversationalResponse(userInput: string, conversationContext: string): Promise<string> {
    const prompt = `
You are a friendly, professional interview coach conducting a real interview. Your goal is to sound completely natural and human-like in your responses.

Conversation Context: ${conversationContext}

What the candidate just said: "${userInput}"

IMPORTANT GUIDELINES:
- Respond EXACTLY as a real human interviewer would speak
- Use natural speech patterns, contractions, and casual transitions
- Vary your sentence length (mix short and medium sentences)
- Sound warm, encouraging, and genuinely interested
- Avoid robotic phrases like "That's a great answer" or "Thank you for sharing"
- Use phrases like "Right, that makes sense" or "I see what you mean" or "That's interesting"
- If the answer is good: acknowledge naturally and smoothly transition
- If it needs work: give gentle, constructive feedback like a real person would
- Keep it conversational (2-3 sentences, max 150 words)
- Use natural pauses and flow
- Don't sound like an AI - sound like a friendly colleague

Example of GOOD natural response:
"Right, that's a really solid example. I like how you handled that situation. Let's move on to the next question - tell me about a time when you had to work under pressure."

Example of BAD robotic response:
"That is an excellent answer. Thank you for providing that information. Now I will ask you the next question."

Now generate your response as if you're speaking naturally to a friend:
`

    try {
      const response = await fetch('/api/ai/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          maxTokens: 300,
        }),
      })

      const data = await response.json()
      
      if (data.success && data.text) {
        return data.text.trim()
      }
      
      return "That's an interesting point. Can you tell me more about that?"
    } catch (error) {
      console.error('Error generating conversational response:', error)
      return "Thank you for that answer. Let's move on to the next question."
    }
  }

  /**
   * Enhance text using Gemini AI to make it more natural for speech
   */
  private async enhanceTextForSpeech(text: string, context?: string): Promise<string> {
    const prompt = `
Transform this text into natural, human-like speech that sounds like a real person talking, not a robot.

Original text: "${text}"
${context ? `Context: ${context}` : ''}

Your task:
- Convert formal text into natural conversational speech
- Use contractions (don't, can't, it's, that's)
- Add natural flow and rhythm
- Insert natural pauses where a human would pause (use ... for brief pauses)
- Remove robotic phrases and make it sound authentic
- Keep the core meaning exactly the same
- Make it sound like someone is genuinely speaking to you
- Use filler words naturally if appropriate (like "um", "you know", "so")
- Keep it concise and easy to follow when spoken

Example transformation:
Formal: "Please describe your experience with project management."
Natural: "So, tell me about your experience with project management. What kind of projects have you worked on?"

Now transform this text to sound like natural human speech:
`

    try {
      const response = await fetch('/api/ai/gemini-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          maxTokens: 500,
        }),
      })

      const data = await response.json()
      
      if (data.success && data.text) {
        return data.text.trim()
      }
      
      return text // Fallback to original text
    } catch (error) {
      console.error('Error enhancing text with Gemini:', error)
      return text
    }
  }

  /**
   * Speak text with the current voice profile
   * Uses browser's built-in SpeechSynthesis API (FREE, no API key needed)
   * Works in: Chrome, Edge, Safari, Firefox, Opera
   * Supports ALL languages with automatic voice selection
   * Enhanced with natural pauses and rhythm
   */
  speak(text: string, language?: string): void {
    if (!this.speechSynthesis) {
      console.error('Speech synthesis not available in this browser')
      return
    }

    // Cancel any ongoing speech
    this.stop()

    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      this.loadVoices()
    }

    // Use provided language or current language
    const targetLanguage = language || this.currentLanguage

    // Process text for natural pauses
    const processedText = this.addNaturalPauses(text)

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(processedText)
    
    // Apply voice profile settings with optimal ranges for natural speech
    // Rate: 0.8-1.0 is optimal (0.85-0.95 sounds most natural)
    utterance.rate = Math.max(0.8, Math.min(1.0, this.currentProfile.rate))
    
    // Pitch: 0.9-1.1 sounds most natural (1.0 is neutral)
    utterance.pitch = Math.max(0.9, Math.min(1.1, this.currentProfile.pitch))
    
    // Volume: 0.85-0.95 is optimal for clarity without being too loud
    utterance.volume = Math.max(0.85, Math.min(0.95, this.currentProfile.volume))

    // Set language - supports all languages
    utterance.lang = targetLanguage

    // Try to select a voice that matches the profile and language
    const matchingVoice = this.findMatchingVoice(this.availableVoices, targetLanguage)
    if (matchingVoice) {
      utterance.voice = matchingVoice
      console.log(`Using voice: ${matchingVoice.name} (${matchingVoice.lang}) - ${this.currentProfile.name}`)
    } else {
      console.log(`No matching voice found for ${targetLanguage}, using default`)
    }

    // Event handlers
    utterance.onstart = () => {
      console.log('Started speaking:', processedText.substring(0, 50))
    }

    utterance.onend = () => {
      console.log('Finished speaking')
      this.currentUtterance = null
    }

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error)
      this.currentUtterance = null
    }

    this.currentUtterance = utterance
    
    // Speak the text using browser's built-in TTS (FREE)
    // Works with all languages automatically
    try {
      this.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Error calling speechSynthesis.speak:', error)
    }
  }

  /**
   * Add natural pauses to text for more human-like speech
   * Uses advanced text processing to mimic natural human speech patterns
   */
  private addNaturalPauses(text: string): string {
    let processed = text
    
    // Replace ellipsis with natural pause markers
    processed = processed.replace(/\.\.\./g, '. ')
    
    // Add natural pauses after commas (but not too many)
    processed = processed.replace(/,\s*/g, ', ')
    
    // Add pause after semicolons
    processed = processed.replace(/;\s*/g, '. ')
    
    // Add pause after question marks
    processed = processed.replace(/\?\s*/g, '? ')
    
    // Add pause after exclamation marks
    processed = processed.replace(/!\s*/g, '! ')
    
    // Add natural pause after periods (sentence breaks)
    processed = processed.replace(/\.\s*([A-Z])/g, '. $1')
    
    // Add subtle pauses around conjunctions for natural flow
    processed = processed.replace(/\s+(and|but|or|so|then)\s+/gi, ' $1 ')
    
    // Add pauses after introductory phrases
    processed = processed.replace(/(^|\.)\s*(Well|So|Now|Right|Okay|Alright|Listen|See|Look)\s+/gi, '$1 $2, ')
    
    // Add pauses around numbers for clarity
    processed = processed.replace(/(\d+)\s+/g, '$1 ')
    
    // Clean up excessive spaces but preserve intentional pauses
    processed = processed.replace(/\s+/g, ' ').trim()
    
    // Split very long sentences into chunks for better intonation
    processed = this.splitLongSentences(processed)
    
    return processed
  }

  /**
   * Split very long sentences into smaller chunks for better speech intonation
   */
  private splitLongSentences(text: string): string {
    // If sentence is too long (> 150 chars), split at natural points
    if (text.length > 150) {
      // Split at commas, conjunctions, or relative clauses
      const chunks = text.match(/.{1,120}(?:\s+and\s+|\s+but\s+|\s+or\s+|,\s+|;\s+|$)/gi) || [text]
      
      if (chunks.length > 1) {
        // Add slight pause between chunks
        return chunks.join('. ')
      }
    }
    
    return text
  }

  /**
   * Find a voice that matches the current profile and language
   * Prioritizes neural/premium voices for better quality
   * Works across all browsers with intelligent fallbacks
   */
  private findMatchingVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | null {
    if (voices.length === 0) return null

    // Extract language code (e.g., 'en' from 'en-US')
    const langCode = language.split('-')[0]

    // Filter voices by language - supports all languages
    const languageVoices = voices.filter(v => {
      const voiceLang = v.lang.split('-')[0]
      return voiceLang === langCode
    })

    if (languageVoices.length === 0) {
      // Fallback 1: Try broader language match
      const broaderMatch = voices.find(v => v.lang.startsWith(langCode))
      if (broaderMatch) return broaderMatch
      
      // Fallback 2: Use any available voice
      console.warn(`No voice found for ${language}, using default`)
      return voices[0]
    }

    // Prioritize neural/premium voices (they sound more natural)
    const neuralVoices = languageVoices.filter(v => 
      v.name.toLowerCase().includes('neural') ||
      v.name.toLowerCase().includes('premium') ||
      v.name.toLowerCase().includes('enhanced') ||
      v.name.toLowerCase().includes('natural')
    )

    // Use neural voices if available, otherwise fall back to regular voices
    const voicePool = neuralVoices.length > 0 ? neuralVoices : languageVoices

    // Select voice based on profile type with better matching
    switch (this.currentProfile.voiceType) {
      case 'professional':
        // Prefer clear, professional neural voices
        return voicePool.find(v => 
          v.name.toLowerCase().includes('neural') && (
            v.name.toLowerCase().includes('karen') ||
            v.name.toLowerCase().includes('aria') ||
            v.name.toLowerCase().includes('jenny')
          )
        ) || voicePool.find(v => 
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('zira') ||
          v.name.toLowerCase().includes('susan')
        ) || voicePool[0]
      
      case 'friendly':
        // Prefer warm, friendly neural voices
        return voicePool.find(v => 
          v.name.toLowerCase().includes('neural') && (
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('aria') ||
            v.name.toLowerCase().includes('jenny')
          )
        ) || voicePool.find(v => 
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('susan')
        ) || voicePool[0]
      
      case 'authoritative':
        // Prefer deeper, confident voices
        return voicePool.find(v => 
          v.name.toLowerCase().includes('neural') && (
            v.name.toLowerCase().includes('guy') ||
            v.name.toLowerCase().includes('davis') ||
            v.name.toLowerCase().includes('mark')
          )
        ) || voicePool.find(v => 
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('mark') ||
          v.name.toLowerCase().includes('guy')
        ) || voicePool[0]
      
      case 'casual':
        // Prefer neural voices for natural conversation
        return neuralVoices.length > 0 
          ? neuralVoices[Math.floor(Math.random() * neuralVoices.length)]
          : voicePool[Math.floor(Math.random() * voicePool.length)]
      
      case 'energetic':
        // Prefer higher-pitched, energetic neural voices
        return voicePool.find(v => 
          v.name.toLowerCase().includes('neural') && (
            v.name.toLowerCase().includes('aria') ||
            v.name.toLowerCase().includes('jenny')
          )
        ) || voicePool.find(v => 
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('hazel') ||
          v.name.toLowerCase().includes('aria')
        ) || voicePool[0]
      
      default:
        // Default: prefer neural voices
        return neuralVoices.length > 0 ? neuralVoices[0] : voicePool[0]
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel()
    }
    this.currentUtterance = null
  }

  /**
   * Pause current speech
   */
  pause(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.pause()
    }
  }

  /**
   * Resume paused speech
   */
  resume(): void {
    if (this.speechSynthesis) {
      this.speechSynthesis.resume()
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.speechSynthesis ? this.speechSynthesis.speaking : false
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.speechSynthesis) return []
    
    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      this.loadVoices()
    }
    
    return this.availableVoices.length > 0 ? this.availableVoices : this.speechSynthesis.getVoices()
  }

  /**
   * Get available voices for a specific language
   */
  getVoicesForLanguage(languageCode: string): SpeechSynthesisVoice[] {
    const allVoices = this.getAvailableVoices()
    const langCode = languageCode.split('-')[0]
    
    return allVoices.filter(v => {
      const voiceLang = v.lang.split('-')[0]
      return voiceLang === langCode
    })
  }

  /**
   * Get all supported languages based on available voices
   */
  getSupportedLanguages(): string[] {
    const voices = this.getAvailableVoices()
    const languages = new Set<string>()
    
    voices.forEach(voice => {
      const langCode = voice.lang.split('-')[0]
      languages.add(langCode)
    })
    
    return Array.from(languages).sort()
  }

  /**
   * Check if speech synthesis is supported
   */
  isSupported(): boolean {
    return this.speechSynthesis !== null
  }

  /**
   * Get browser compatibility info
   */
  getBrowserInfo(): { supported: boolean; voicesCount: number; browser: string } {
    const supported = this.isSupported()
    const voicesCount = this.getAvailableVoices().length
    
    // Detect browser
    let browser = 'Unknown'
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent
      if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
      else if (ua.includes('Edg')) browser = 'Edge'
      else if (ua.includes('Firefox')) browser = 'Firefox'
      else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
      else if (ua.includes('Opera')) browser = 'Opera'
    }
    
    return { supported, voicesCount, browser }
  }

  /**
   * Create a custom voice profile
   */
  createCustomProfile(
    name: string,
    description: string,
    rate: number,
    pitch: number,
    volume: number,
    voiceType: VoiceProfile['voiceType']
  ): VoiceProfile {
    return {
      name,
      description,
      rate: Math.max(0.5, Math.min(2.0, rate)),
      pitch: Math.max(0, Math.min(2, pitch)),
      volume: Math.max(0, Math.min(1, volume)),
      voiceType
    }
  }
}

// Export singleton instance
export const geminiVoiceService = new GeminiVoiceService()

