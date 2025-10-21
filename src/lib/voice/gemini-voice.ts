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
    rate: 0.85,
    pitch: 0.9,
    volume: 0.9,
    voiceType: 'professional'
  },
  {
    name: 'Friendly Coach',
    description: 'Warm, encouraging voice for supportive feedback',
    rate: 0.9,
    pitch: 1.1,
    volume: 0.85,
    voiceType: 'friendly'
  },
  {
    name: 'Executive',
    description: 'Authoritative, confident voice',
    rate: 0.75,
    pitch: 0.85,
    volume: 0.95,
    voiceType: 'authoritative'
  },
  {
    name: 'Casual Mentor',
    description: 'Relaxed, conversational voice',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voiceType: 'casual'
  },
  {
    name: 'Energetic Motivator',
    description: 'Enthusiastic, upbeat voice',
    rate: 1.1,
    pitch: 1.15,
    volume: 0.9,
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
      this.speak(fallbackResponse)
      return fallbackResponse
    }
  }

  /**
   * Generate natural speech using Gemini AI and speak it (for pre-written text)
   */
  async speakWithGemini(text: string, context?: string): Promise<void> {
    if (!this.speechSynthesis) {
      console.error('Speech synthesis not available')
      return
    }

    try {
      // Use Gemini to enhance the text for natural speech
      const enhancedText = await this.enhanceTextForSpeech(text, context)
      
      // Speak the enhanced text with the current voice profile
      this.speak(enhancedText)
    } catch (error) {
      console.error('Error in Gemini voice service:', error)
      // Fallback to regular speech
      this.speak(text)
    }
  }

  /**
   * Generate conversational response based on user input
   */
  private async generateConversationalResponse(userInput: string, conversationContext: string): Promise<string> {
    const prompt = `
You are an AI interview coach conducting a professional interview. You need to respond naturally to what the candidate just said.

Conversation Context: ${conversationContext}

What the candidate just said: "${userInput}"

Your task:
1. Analyze what the candidate said
2. Provide appropriate feedback or ask a follow-up question
3. Keep responses concise (2-3 sentences max)
4. Be professional but encouraging
5. If the answer is good, acknowledge it and move to the next question
6. If the answer needs improvement, provide constructive feedback
7. Speak naturally as if you're having a real conversation

Generate your response as if you're speaking aloud (natural, conversational tone):
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
You are a natural speech assistant. Convert this text into a more conversational, natural-sounding speech format.

Original text: "${text}"
${context ? `Context: ${context}` : ''}

Guidelines:
- Make it sound natural when spoken aloud
- Add appropriate pauses (use ... for short pauses, ... ... for longer pauses)
- Use conversational language
- Keep the meaning exactly the same
- Don't add extra information
- Return only the enhanced text, nothing else

Enhanced text:`

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

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Apply voice profile settings (rate, pitch, volume)
    utterance.rate = this.currentProfile.rate
    utterance.pitch = this.currentProfile.pitch
    utterance.volume = this.currentProfile.volume

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
      console.log('Started speaking:', text.substring(0, 50))
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
   * Find a voice that matches the current profile and language
   * Works across all browsers with intelligent fallbacks
   * Supports ALL languages automatically
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

    // Select voice based on profile type
    switch (this.currentProfile.voiceType) {
      case 'professional':
        // Prefer lower-pitched, clear voices
        return languageVoices.find(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('zira')
        ) || languageVoices[0]
      
      case 'friendly':
        // Prefer warmer voices
        return languageVoices.find(v => 
          v.name.toLowerCase().includes('samantha') || 
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('susan')
        ) || languageVoices[0]
      
      case 'authoritative':
        // Prefer deeper, male voices
        return languageVoices.find(v => 
          v.name.toLowerCase().includes('male') || 
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('mark')
        ) || languageVoices[0]
      
      case 'casual':
        // Any natural-sounding voice
        return languageVoices[Math.floor(Math.random() * languageVoices.length)]
      
      case 'energetic':
        // Prefer higher-pitched, energetic voices
        return languageVoices.find(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('hazel')
        ) || languageVoices[0]
      
      default:
        return languageVoices[0]
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

