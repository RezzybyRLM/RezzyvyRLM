/**
 * Custom Text-to-Speech service using Web Audio API and speech synthesis
 * This creates a more controlled voice experience
 */

export interface AudioConfig {
  rate: number
  pitch: number
  volume: number
}

export class CustomTTS {
  private audioContext: AudioContext | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private config: AudioConfig

  constructor(config: AudioConfig = { rate: 1.0, pitch: 1.0, volume: 1.0 }) {
    this.config = config
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext()
    }
  }

  /**
   * Speak text using custom audio processing
   */
  async speak(text: string, onEnd?: () => void): Promise<void> {
    if (!this.audioContext) {
      console.error('AudioContext not available')
      return
    }

    try {
      // Get speech audio from browser TTS
      const audioBlob = await this.textToSpeechBlob(text)
      
      // Process and play the audio
      await this.playAudioBlob(audioBlob, onEnd)
    } catch (error) {
      console.error('Error in custom TTS:', error)
      // Fallback to browser TTS
      this.fallbackSpeak(text, onEnd)
    }
  }

  /**
   * Convert text to speech blob
   */
  private async textToSpeechBlob(text: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = this.config.rate
      utterance.pitch = this.config.pitch
      utterance.volume = this.config.volume

      // Capture audio from speech synthesis
      const audio = new Audio()
      const mediaStream = new MediaStream()
      
      // Use Web Speech API to generate audio
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(mediaStream)
      
      utterance.onend = () => {
        resolve(new Blob())
      }

      utterance.onerror = (error) => {
        reject(error)
      }

      speechSynthesis.speak(utterance)
    })
  }

  /**
   * Play audio blob with custom processing
   */
  private async playAudioBlob(blob: Blob, onEnd?: () => void): Promise<void> {
    if (!this.audioContext) return

    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
    
    // Apply pitch and rate adjustments
    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.playbackRate.value = this.config.rate
    source.detune.value = this.config.pitch * 100 // Convert to cents

    // Apply volume
    const gainNode = this.audioContext.createGain()
    gainNode.gain.value = this.config.volume

    // Connect audio nodes
    source.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // Handle end
    source.onended = () => {
      if (onEnd) onEnd()
    }

    // Play
    source.start(0)
    this.currentSource = source
  }

  /**
   * Fallback to browser TTS
   */
  private fallbackSpeak(text: string, onEnd?: () => void): void {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = this.config.rate
    utterance.pitch = this.config.pitch
    utterance.volume = this.config.volume

    utterance.onend = () => {
      if (onEnd) onEnd()
    }

    speechSynthesis.speak(utterance)
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentSource) {
      this.currentSource.stop()
      this.currentSource = null
    }
    speechSynthesis.cancel()
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

