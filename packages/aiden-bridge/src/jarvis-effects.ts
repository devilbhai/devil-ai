/**
 * JARVIS-style Animations and Sound Effects
 *
 * Visual effects, sound feedback, and immersive experience
 */

export interface AnimationConfig {
	duration: number
	easing: string
	delay: number
}

export interface SoundEffect {
	name: string
	frequency: number
	duration: number
	type: "sine" | "square" | "sawtooth" | "triangle"
}

export class JarvisEffects {
	private audioContext: AudioContext | null = null
	private isInitialized: boolean = false

	constructor() {
		this.initialize()
	}

	/**
	 * Initialize audio context
	 */
	private initialize(): void {
		if (typeof window !== "undefined") {
			this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
			this.isInitialized = true
		}
	}

	/**
	 * Play JARVIS-style sound effect
	 */
	async playSound(
		effect: "click" | "success" | "error" | "notification" | "thinking" | "complete",
	): Promise<void> {
		if (!this.isInitialized || !this.audioContext) {
			console.warn("Audio not initialized")
			return
		}

		const sounds: Record<string, SoundEffect> = {
			click: { name: "click", frequency: 800, duration: 0.05, type: "sine" },
			success: { name: "success", frequency: 523.25, duration: 0.2, type: "sine" },
			error: { name: "error", frequency: 200, duration: 0.3, type: "square" },
			notification: { name: "notification", frequency: 880, duration: 0.15, type: "sine" },
			thinking: { name: "thinking", frequency: 440, duration: 0.5, type: "triangle" },
			complete: { name: "complete", frequency: 659.25, duration: 0.3, type: "sine" },
		}

		const sound = sounds[effect]
		if (!sound) return

		try {
			const oscillator = this.audioContext.createOscillator()
			const gainNode = this.audioContext.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(this.audioContext.destination)

			oscillator.type = sound.type
			oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime)

			// Envelope
			gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime)
			gainNode.gain.exponentialRampToValueAtTime(
				0.01,
				this.audioContext.currentTime + sound.duration,
			)

			oscillator.start(this.audioContext.currentTime)
			oscillator.stop(this.audioContext.currentTime + sound.duration)
		} catch (error) {
			console.error("Sound playback error:", error)
		}
	}

	/**
	 * Play JARVIS boot sequence sound
	 */
	async playBootSequence(): Promise<void> {
		const notes = [261.63, 329.63, 392.0, 523.25] // C4, E4, G4, C5

		for (const note of notes) {
			if (!this.audioContext) break

			const oscillator = this.audioContext.createOscillator()
			const gainNode = this.audioContext.createGain()

			oscillator.connect(gainNode)
			gainNode.connect(this.audioContext.destination)

			oscillator.type = "sine"
			oscillator.frequency.setValueAtTime(note, this.audioContext.currentTime)

			gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime)
			gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3)

			oscillator.start(this.audioContext.currentTime)
			oscillator.stop(this.audioContext.currentTime + 0.3)

			await new Promise((resolve) => setTimeout(resolve, 350))
		}
	}

	/**
	 * Get CSS animations for JARVIS-style effects
	 */
	static getAnimations(): string {
		return `
      /* JARVIS-style animations */
      
      @keyframes jarvis-pulse {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      
      @keyframes jarvis-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6); }
      }
      
      @keyframes jarvis-scan {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }
      
      @keyframes jarvis-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes jarvis-fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes jarvis-slide-in {
        from { transform: translateX(-100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes jarvis-typing {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
        40% { transform: scale(1); opacity: 1; }
      }
      
      @keyframes jarvis-wave {
        0%, 100% { height: 4px; }
        50% { height: 20px; }
      }
      
      @keyframes jarvis-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes jarvis-breathe {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.1); opacity: 1; }
      }
      
      /* Animation classes */
      .jarvis-pulse { animation: jarvis-pulse 2s ease-in-out infinite; }
      .jarvis-glow { animation: jarvis-glow 2s ease-in-out infinite; }
      .jarvis-scan { animation: jarvis-scan 3s linear infinite; }
      .jarvis-rotate { animation: jarvis-rotate 10s linear infinite; }
      .jarvis-fade-in { animation: jarvis-fade-in 0.5s ease-out; }
      .jarvis-slide-in { animation: jarvis-slide-in 0.3s ease-out; }
      .jarvis-typing { animation: jarvis-typing 1.4s ease-in-out infinite; }
      .jarvis-wave { animation: jarvis-wave 1s ease-in-out infinite; }
      .jarvis-spin { animation: jarvis-spin 2s linear infinite; }
      .jarvis-breathe { animation: jarvis-breathe 3s ease-in-out infinite; }
      
      /* Hover effects */
      .jarvis-hover:hover {
        transform: scale(1.02);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        transition: all 0.3s ease;
      }
      
      /* JARVIS-style gradients */
      .jarvis-gradient {
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #8b5cf6 100%);
      }
      
      .jarvis-gradient-text {
        background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      /* JARVIS-style borders */
      .jarvis-border {
        border: 2px solid transparent;
        background: linear-gradient(#1f2937, #1f2937) padding-box,
                    linear-gradient(135deg, #3b82f6, #8b5cf6) border-box;
      }
      
      /* JARVIS-style shadows */
      .jarvis-shadow {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3),
                    0 0 40px rgba(139, 92, 246, 0.2);
      }
    `
	}

	/**
	 * Create JARVIS-style loading screen
	 */
	static createLoadingScreen(): string {
		return `
      <div class="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div class="text-center">
          <!-- JARVIS Logo -->
          <div class="relative w-32 h-32 mx-auto mb-8">
            <div class="absolute inset-0 rounded-full border-4 border-blue-500 jarvis-rotate"></div>
            <div class="absolute inset-2 rounded-full border-4 border-purple-500 jarvis-rotate" style="animation-direction: reverse;"></div>
            <div class="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center jarvis-pulse">
              <span class="text-4xl">🤖</span>
            </div>
          </div>
          
          <!-- Loading text -->
          <h1 class="text-3xl font-bold text-white mb-4 jarvis-gradient-text">
            Devil AI
          </h1>
          <p class="text-gray-400 mb-8">Initializing JARVIS-like system...</p>
          
          <!-- Loading bar -->
          <div class="w-64 h-2 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 to-purple-600 jarvis-slide-in" style="width: 60%;"></div>
          </div>
          
          <!-- Status -->
          <p class="text-sm text-gray-500 mt-4 jarvis-typing">
            Loading components...
          </p>
        </div>
      </div>
    `
	}

	/**
	 * Create JARVIS-style response animation
	 */
	static createResponseAnimation(): string {
		return `
      <div class="relative p-4 bg-gray-800 rounded-xl jarvis-fade-in">
        <!-- Scan line -->
        <div class="absolute inset-0 overflow-hidden rounded-xl">
          <div class="absolute w-full h-1 bg-blue-500 jarvis-scan opacity-50"></div>
        </div>
        
        <!-- Content -->
        <div class="relative z-10">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-3 h-3 rounded-full bg-green-500 jarvis-pulse"></div>
            <span class="text-sm text-gray-400">Devil AI responding...</span>
          </div>
          
          <div class="space-y-2">
            <div class="h-4 bg-gray-700 rounded jarvis-fade-in" style="width: 80%;"></div>
            <div class="h-4 bg-gray-700 rounded jarvis-fade-in" style="width: 60%; animation-delay: 0.1s;"></div>
            <div class="h-4 bg-gray-700 rounded jarvis-fade-in" style="width: 70%; animation-delay: 0.2s;"></div>
          </div>
        </div>
      </div>
    `
	}

	/**
	 * Create JARVIS-style voice animation
	 */
	static createVoiceAnimation(): string {
		return `
      <div class="flex items-center justify-center gap-1 h-12">
        ${Array.from({ length: 5 })
					.map(
						(_, i) => `
          <div 
            class="w-2 bg-blue-500 rounded-full jarvis-wave"
            style="animation-delay: ${i * 0.1}s;"
          ></div>
        `,
					)
					.join("")}
      </div>
    `
	}

	/**
	 * Create JARVIS-style success animation
	 */
	static createSuccessAnimation(): string {
		return `
      <div class="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/50 rounded-xl jarvis-fade-in">
        <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center jarvis-pulse">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p class="text-green-400 font-medium">Task Completed!</p>
          <p class="text-sm text-gray-400">Devil AI has finished the task.</p>
        </div>
      </div>
    `
	}

	/**
	 * Create JARVIS-style error animation
	 */
	static createErrorAnimation(): string {
		return `
      <div class="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl jarvis-fade-in">
        <div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center jarvis-pulse">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p class="text-red-400 font-medium">Error Occurred</p>
          <p class="text-sm text-gray-400">Something went wrong. Please try again.</p>
        </div>
      </div>
    `
	}
}

export default JarvisEffects
