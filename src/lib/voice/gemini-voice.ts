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
      // Voices will be loaded when speak() is called via waitForVoices()
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
   * Wait for voices to be loaded (handles async loading in Chrome/Edge)
   * Always refreshes voices to ensure we have the latest list
   * CRITICAL: This ensures detected voices are always available
   */
  private async waitForVoices(): Promise<void> {
    if (!this.speechSynthesis) return

    // Always refresh voices - don't rely on cached list
    // This ensures we get the latest voices after page load
    // CRITICAL: Call getVoices() fresh each time to get all detected voices
    this.availableVoices = this.speechSynthesis.getVoices()
    
    if (this.availableVoices.length > 0) {
      this.voicesLoaded = true
      console.log(`✅ Voices loaded: ${this.availableVoices.length} voices available`)
      console.log(`📋 Available voices:`, this.availableVoices.map(v => `${v.name} (${v.lang})`).slice(0, 10))
      return
    }

    // If no voices yet, wait for them

    // Wait for voices to load asynchronously
    return new Promise((resolve) => {
      const checkVoices = () => {
        if (this.speechSynthesis) {
          this.availableVoices = this.speechSynthesis.getVoices()
          if (this.availableVoices.length > 0) {
            this.voicesLoaded = true
            resolve()
          } else {
            // Try again after a short delay
            setTimeout(checkVoices, 100)
          }
        }
      }

      if (this.speechSynthesis && 'onvoiceschanged' in this.speechSynthesis) {
        this.speechSynthesis.onvoiceschanged = () => {
          if (this.speechSynthesis) {
            // CRITICAL: Always refresh voices when they change
            this.availableVoices = this.speechSynthesis.getVoices()
            this.voicesLoaded = true
            console.log(`✅ Voices changed event: ${this.availableVoices.length} voices now available`)
            console.log(`📋 Updated voices:`, this.availableVoices.map(v => `${v.name} (${v.lang})`).slice(0, 10))
            resolve()
          }
        }
      }

      // Fallback: check periodically
      checkVoices()
      
      // Timeout after 2 seconds
      setTimeout(() => {
        if (!this.voicesLoaded) {
          // CRITICAL: Refresh voices one last time before resolving
          this.availableVoices = this.speechSynthesis!.getVoices()
          this.voicesLoaded = true
          console.log(`⏱️ Timeout: ${this.availableVoices.length} voices loaded`)
          resolve()
        }
      }, 2000)
    })
  }

  /**
   * Score voice quality based on name patterns
   * Higher score = more natural/human-like voice
   */
  private scoreVoiceQuality(voice: SpeechSynthesisVoice): number {
    let score = 0
    const name = voice.name.toLowerCase()
    const lang = voice.lang.toLowerCase()

    // Known natural-sounding voices - these should NEVER be penalized
    // Even if they're default, they're still good quality
    const naturalVoices = ['samantha', 'alex', 'victoria', 'david', 'mark', 'aria', 'jenny', 'guy', 'zira', 'daniel', 'susan', 'karen']
    const isNaturalVoice = naturalVoices.some(nv => name.includes(nv))
    
    if (isNaturalVoice) {
      score += 50 // Natural voices get high score regardless
    }

    // Neural voices are highest quality (score +100)
    if (name.includes('neural')) {
      score += 100
    }

    // Microsoft Neural voices are best on Windows/Edge
    if (name.includes('microsoft') && name.includes('neural')) {
      score += 50
    }

    // Premium/Enhanced voices (score +50)
    if (name.includes('premium') || name.includes('enhanced') || name.includes('natural')) {
      score += 50
    }

    // Microsoft voices (good quality on Windows) (score +20)
    if (name.includes('microsoft')) {
      score += 20
    }

    // Prefer local voices over remote (score +10)
    if (voice.localService) {
      score += 10
    }

    // Only penalize truly generic/robotic voices - NOT natural voices even if default
    if (!isNaturalVoice) {
      // Avoid generic/robotic voices (score -50)
      if (name.includes('desktop') || name.includes('system')) {
        score -= 50
      }

      // Default voices get lowest score ONLY if they're not natural voices
      if (name.includes('default') || (voice.default && !isNaturalVoice)) {
        score -= 100
      }
    }

    return score
  }

  /**
   * Detect browser and OS for platform-specific voice preferences
   */
  private detectPlatform(): { browser: string; os: string } {
    if (typeof window === 'undefined') {
      return { browser: 'unknown', os: 'unknown' }
    }

    const ua = navigator.userAgent
    let browser = 'unknown'
    let os = 'unknown'

    // Detect browser
    if (ua.includes('Edg')) browser = 'edge'
    else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'safari'
    else if (ua.includes('Firefox')) browser = 'firefox'

    // Detect OS
    if (ua.includes('Win')) os = 'windows'
    else if (ua.includes('Mac')) os = 'mac'
    else if (ua.includes('Linux')) os = 'linux'
    else if (ua.includes('Android')) os = 'android'
    else if (ua.includes('iOS')) os = 'ios'

    return { browser, os }
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
      
      // Speak the AI response with the current voice profile (now async)
      await this.speak(aiResponse)
      
      return aiResponse
    } catch (error) {
      console.error('Error in Gemini voice service:', error)
      // Fallback to a generic response
      const fallbackResponse = "I'm sorry, I didn't catch that. Could you please repeat?"
      // Apply natural speech patterns even for fallback
      const enhancedFallback = this.applyNaturalSpeechPatterns(fallbackResponse)
      await this.speak(enhancedFallback)
      return enhancedFallback
    }
  }

  /**
   * Generate natural speech using Gemini AI and speak it (for pre-written text)
   * Falls back to enhanced text processing if Gemini is unavailable
   */
  async speakWithGemini(text: string, context?: string, onEnd?: () => void): Promise<void> {
    if (!this.speechSynthesis) {
      console.error('Speech synthesis not available')
      return
    }

    try {
      // Use Gemini to enhance the text for natural speech
      const enhancedText = await this.enhanceTextForSpeech(text, context)
      
      // Further enhance with natural speech patterns
      const finalText = this.applyNaturalSpeechPatterns(enhancedText)
      
      // Speak the enhanced text with the current voice profile (now async)
      await this.speak(finalText, undefined, onEnd)
    } catch (error) {
      console.error('Error in Gemini voice service:', error)
      // Fallback: apply natural speech patterns without Gemini
      const enhancedText = this.applyNaturalSpeechPatterns(text)
      await this.speak(enhancedText, undefined, onEnd)
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
   * CRITICAL: Waits for voices to load and selects best natural voice
   */
  async speak(text: string, language?: string, onEnd?: () => void): Promise<void> {
    if (!this.speechSynthesis) {
      console.error('Speech synthesis not available in this browser')
      return
    }

    // Cancel any ongoing speech
    this.stop()

    // CRITICAL: Wait for voices to be loaded before speaking
    await this.waitForVoices()

    // CRITICAL: Refresh voices one more time right before selection
    // This ensures we always use the latest detected voices, not cached ones
    if (this.speechSynthesis) {
      this.availableVoices = this.speechSynthesis.getVoices()
    }

    // Log all available voices for debugging
    console.log(`🔊 Total voices available: ${this.availableVoices.length}`)
    console.log(`📋 All voices:`, this.availableVoices.map(v => `${v.name} (${v.lang})`).slice(0, 10))

    // Use provided language or current language
    const targetLanguage = language || this.currentLanguage

    // Process text for natural pauses
    const processedText = this.addNaturalPauses(text)

    // Create new utterance (use let so we can reassign if needed)
    let utterance = new SpeechSynthesisUtterance(processedText)
    
    // Apply voice profile settings with optimal ranges for natural speech
    // Rate: 0.8-1.0 is optimal (0.85-0.95 sounds most natural)
    utterance.rate = Math.max(0.8, Math.min(1.0, this.currentProfile.rate))
    
    // Pitch: 0.9-1.1 sounds most natural (1.0 is neutral)
    utterance.pitch = Math.max(0.9, Math.min(1.1, this.currentProfile.pitch))
    
    // Volume: 0.85-0.95 is optimal for clarity without being too loud
    utterance.volume = Math.max(0.85, Math.min(0.95, this.currentProfile.volume))

    // Set language - supports all languages
    utterance.lang = targetLanguage

    // CRITICAL: Select and set the best natural-sounding voice
    const matchingVoice = this.findMatchingVoice(this.availableVoices, targetLanguage)
    
    if (matchingVoice) {
      // Force voice assignment - create utterance with voice set immediately
      // This ensures the browser uses the selected voice, not a default
      const finalUtterance = new SpeechSynthesisUtterance(processedText)
      
      // Set voice FIRST before any other properties (critical for browser compatibility)
      finalUtterance.voice = matchingVoice
      
      // Then set all other properties
      finalUtterance.rate = Math.max(0.8, Math.min(1.0, this.currentProfile.rate))
      finalUtterance.pitch = Math.max(0.9, Math.min(1.1, this.currentProfile.pitch))
      finalUtterance.volume = Math.max(0.85, Math.min(0.95, this.currentProfile.volume))
      finalUtterance.lang = targetLanguage
      
      // Verify voice is actually set (prevent browser from using default)
      if (!finalUtterance.voice || finalUtterance.voice.name !== matchingVoice.name) {
        console.warn('⚠️ Voice not set correctly, retrying...')
        // Force retry by refreshing voices and reselecting
        this.availableVoices = this.speechSynthesis!.getVoices()
        const retryVoice = this.findMatchingVoice(this.availableVoices, targetLanguage)
        if (retryVoice) {
          finalUtterance.voice = retryVoice
        }
      }
      
      // Use the final utterance instead of the original
      utterance = finalUtterance
      
      console.log(`🎤 Using voice: ${matchingVoice.name} (${matchingVoice.lang}) - ${this.currentProfile.name}`)
      console.log(`📊 Voice quality score: ${this.scoreVoiceQuality(matchingVoice)}`)
      console.log(`🎯 Voice profile: ${this.currentProfile.voiceType}`)
    } else {
      console.warn(`⚠️ No matching voice found for ${targetLanguage}, using best available`)
      // Still try to find best available voice (but avoid default/robotic voices)
      const scoredVoices = this.availableVoices
        .map(v => ({ voice: v, score: this.scoreVoiceQuality(v) }))
        .sort((a, b) => b.score - a.score)
        .filter(sv => sv.score > -50) // Exclude low-quality voices
      
      if (scoredVoices.length > 0) {
        utterance.voice = scoredVoices[0].voice
        console.log(`🎤 Fallback voice: ${scoredVoices[0].voice.name} (score: ${scoredVoices[0].score})`)
      } else {
        console.error('❌ No suitable voices found, trying to find any non-default voice...')
        // Try to find any voice that's not default/system
        const bestVoice = this.availableVoices.find(v => {
          const name = v.name.toLowerCase()
          return !name.includes('default') && !name.includes('system')
        }) || this.availableVoices[0]
        if (bestVoice) {
          utterance.voice = bestVoice
          console.log(`🎤 Using fallback voice: ${bestVoice.name}`)
        }
      }
    }

    // CRITICAL: Final validation - ensure voice is actually set before speaking
    if (!utterance.voice) {
      console.error('❌ Failed to set voice, speech may sound robotic')
      console.error('Available voices:', this.availableVoices.map(v => `${v.name} (${v.lang})`).slice(0, 10))
      // Try one more time with first available voice
      if (this.availableVoices.length > 0) {
        utterance.voice = this.availableVoices.find(v => !v.name.toLowerCase().includes('default')) || this.availableVoices[0]
        console.log(`🔄 Last resort voice: ${utterance.voice?.name}`)
      }
    } else {
      console.log(`✅ Final voice confirmation: ${utterance.voice.name} (${utterance.voice.lang})`)
      
      // Additional check: verify we're not using a default robotic voice
      const voiceName = utterance.voice.name.toLowerCase()
      if (voiceName.includes('default') && !voiceName.includes('samantha') && !voiceName.includes('alex')) {
        console.warn('⚠️ Warning: Using default voice, trying to find better alternative...')
        const betterVoice = this.availableVoices.find(v => 
          v.lang.startsWith(targetLanguage.split('-')[0]) && 
          !v.name.toLowerCase().includes('default') &&
          !v.name.toLowerCase().includes('system')
        )
        if (betterVoice) {
          utterance.voice = betterVoice
          console.log(`✅ Switched to better voice: ${betterVoice.name}`)
        }
      }
    }

    // Event handlers
    utterance.onstart = () => {
      console.log('▶️ Started speaking:', processedText.substring(0, 50))
    }

    utterance.onend = () => {
      console.log('✅ Finished speaking')
      this.currentUtterance = null
      if (onEnd) onEnd()
    }

    utterance.onerror = (error) => {
      console.error('❌ Speech synthesis error:', error)
      this.currentUtterance = null
      if (onEnd) onEnd()
    }

    this.currentUtterance = utterance
    
    // Speak the text using browser's built-in TTS (FREE)
    // Works with all languages automatically
    try {
      this.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('❌ Error calling speechSynthesis.speak:', error)
      if (onEnd) onEnd()
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
   * Uses quality scoring to select the best natural-sounding voice
   * CRITICAL: Always returns detected voices, never default/robotic voices
   */
  private findMatchingVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | null {
    if (voices.length === 0) {
      console.warn('⚠️ No voices available')
      return null
    }

    console.log(`🔍 Searching for voice in ${voices.length} available voices`)

    // Extract language code (e.g., 'en' from 'en-US')
    const langCode = language.split('-')[0]

    // Filter voices by language - supports all languages
    // CRITICAL: Exclude default/system voices unless they're natural voices
    const naturalVoiceNames = ['samantha', 'alex', 'victoria', 'david', 'mark', 'aria', 'jenny', 'guy', 'zira', 'daniel', 'susan', 'karen']
    const languageVoices = voices.filter(v => {
      const voiceLang = v.lang.split('-')[0]
      const matchesLanguage = voiceLang === langCode
      
      // Exclude default/system voices unless they're known natural voices
      const voiceName = v.name.toLowerCase()
      const isDefault = voiceName.includes('default') || voiceName.includes('system')
      const isNatural = naturalVoiceNames.some(nv => voiceName.includes(nv))
      
      return matchesLanguage && (!isDefault || isNatural)
    })

    console.log(`🌍 Found ${languageVoices.length} voices for language ${langCode}`)

    if (languageVoices.length === 0) {
      // Fallback 1: Try broader language match (but still exclude defaults)
      const broaderMatch = voices.find(v => {
        const matchesLang = v.lang.startsWith(langCode)
        const voiceName = v.name.toLowerCase()
        const isDefault = voiceName.includes('default') || voiceName.includes('system')
        const isNatural = naturalVoiceNames.some(nv => voiceName.includes(nv))
        return matchesLang && (!isDefault || isNatural)
      })
      
      if (broaderMatch) {
        console.log(`✅ Using broader language match: ${broaderMatch.name}`)
        return broaderMatch
      }
      
      // Fallback 2: Score all voices and pick best (excluding defaults)
      const scoredVoices = voices
        .filter(v => {
          const voiceName = v.name.toLowerCase()
          const isDefault = voiceName.includes('default') || voiceName.includes('system')
          const isNatural = naturalVoiceNames.some(nv => voiceName.includes(nv))
          return !isDefault || isNatural
        })
        .map(v => ({
          voice: v,
          score: this.scoreVoiceQuality(v)
        }))
        .sort((a, b) => b.score - a.score)
      
      if (scoredVoices.length > 0) {
        console.warn(`⚠️ No voice found for ${language}, using best available: ${scoredVoices[0]?.voice.name}`)
        console.log(`📊 Top 5 voices:`, scoredVoices.slice(0, 5).map(sv => `${sv.voice.name} (score: ${sv.score})`))
        return scoredVoices[0]?.voice
      }
      
      // Last resort: use any voice except explicit defaults
      const anyVoice = voices.find(v => {
        const voiceName = v.name.toLowerCase()
        return !voiceName.includes('default') && !voiceName.includes('system')
      }) || voices[0]
      
      console.warn(`⚠️ Using fallback voice: ${anyVoice?.name}`)
      return anyVoice || null
    }

    // Score all language voices by quality
    const scoredVoices = languageVoices.map(v => ({
      voice: v,
      score: this.scoreVoiceQuality(v)
    })).sort((a, b) => b.score - a.score)

    console.log(`📊 Top 5 voices for ${language}:`, scoredVoices.slice(0, 5).map(sv => `${sv.voice.name} (score: ${sv.score})`))

    // Platform-specific preferences
    const platform = this.detectPlatform()
    console.log(`🖥️ Platform: ${platform.browser} on ${platform.os}`)

    // Select voice based on profile type with quality scoring
    // CRITICAL: Always prefer detected natural voices over default/system voices
    let selectedVoice: SpeechSynthesisVoice | null = null

    switch (this.currentProfile.voiceType) {
      case 'professional':
        // Prefer Microsoft Neural voices (Aria, Zira) or Samantha
        selectedVoice = scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('neural') && (
            sv.voice.name.toLowerCase().includes('aria') ||
            sv.voice.name.toLowerCase().includes('zira')
          )
        )?.voice || scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('samantha') ||
          sv.voice.name.toLowerCase().includes('zira') ||
          sv.voice.name.toLowerCase().includes('aria')
        )?.voice || scoredVoices.find(sv => sv.score > 0)?.voice || scoredVoices[0]?.voice
        break
      
      case 'friendly':
        // Prefer Microsoft Aria Neural, Samantha, or Alex
        selectedVoice = scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('neural') && (
            sv.voice.name.toLowerCase().includes('aria') ||
            sv.voice.name.toLowerCase().includes('samantha')
          )
        )?.voice || scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('samantha') ||
          sv.voice.name.toLowerCase().includes('alex') ||
          sv.voice.name.toLowerCase().includes('aria')
        )?.voice || scoredVoices.find(sv => sv.score > 0)?.voice || scoredVoices[0]?.voice
        break
      
      case 'authoritative':
        // Prefer Microsoft David/Guy Neural, or Mark
        selectedVoice = scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('neural') && (
            sv.voice.name.toLowerCase().includes('david') ||
            sv.voice.name.toLowerCase().includes('guy') ||
            sv.voice.name.toLowerCase().includes('mark')
          )
        )?.voice || scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('david') ||
          sv.voice.name.toLowerCase().includes('mark') ||
          sv.voice.name.toLowerCase().includes('guy')
        )?.voice || scoredVoices.find(sv => sv.score > 0)?.voice || scoredVoices[0]?.voice
        break
      
      case 'casual':
        // Prefer any neural voice, then best quality
        selectedVoice = scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('neural')
        )?.voice || scoredVoices.find(sv => sv.score > 0)?.voice || scoredVoices[0]?.voice
        break
      
      case 'energetic':
        // Prefer Microsoft Aria Neural or Victoria
        selectedVoice = scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('neural') && (
            sv.voice.name.toLowerCase().includes('aria') ||
            sv.voice.name.toLowerCase().includes('jenny')
          )
        )?.voice || scoredVoices.find(sv => 
          sv.voice.name.toLowerCase().includes('victoria') ||
          sv.voice.name.toLowerCase().includes('aria') ||
          sv.voice.name.toLowerCase().includes('jenny')
        )?.voice || scoredVoices.find(sv => sv.score > 0)?.voice || scoredVoices[0]?.voice
        break
      
      default:
        // Default: highest scoring voice (but never default/system voices)
        selectedVoice = scoredVoices.find(sv => sv.score > 0)?.voice || scoredVoices[0]?.voice || null
    }

    // Final validation: ensure we never return a default/robotic voice
    if (selectedVoice) {
      const voiceName = selectedVoice.name.toLowerCase()
      const isDefault = voiceName.includes('default') || voiceName.includes('system')
      const isNatural = naturalVoiceNames.some(nv => voiceName.includes(nv))
      
      // If we somehow got a default voice, try to find a better one
      if (isDefault && !isNatural) {
        console.warn(`⚠️ Selected voice "${selectedVoice.name}" is default, finding better alternative...`)
        const betterVoice = scoredVoices.find(sv => {
          const name = sv.voice.name.toLowerCase()
          return !name.includes('default') && !name.includes('system') && sv.score > -50
        })?.voice
        
        if (betterVoice) {
          selectedVoice = betterVoice
          console.log(`✅ Switched to better voice: ${betterVoice.name}`)
        }
      }
      
      console.log(`✅ Selected voice: ${selectedVoice.name} (${selectedVoice.lang}) - Score: ${this.scoreVoiceQuality(selectedVoice)}`)
    } else {
      console.error(`❌ Failed to select any voice`)
    }

    return selectedVoice
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
    
    // Ensure voices are loaded - sync version for compatibility
    if (!this.voicesLoaded || this.availableVoices.length === 0) {
      this.availableVoices = this.speechSynthesis.getVoices()
      if (this.availableVoices.length > 0) {
        this.voicesLoaded = true
      }
    }
    
    return this.availableVoices.length > 0 ? this.availableVoices : (this.speechSynthesis ? this.speechSynthesis.getVoices() : [])
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

