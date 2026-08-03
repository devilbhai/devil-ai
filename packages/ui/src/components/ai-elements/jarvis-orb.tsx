export type VoiceRecognitionState = "idle" | "listening" | "processing" | "speaking" | "error"

interface JarvisOrbProps {
	state: VoiceRecognitionState
	size?: number
}

export function JarvisOrb({ state, size = 150 }: JarvisOrbProps) {
	// A sleek, premium OpenAI/Siri style CSS Orb
	
	const getOrbStyles = () => {
		switch (state) {
			case "listening":
				return "bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 animate-pulse shadow-[0_0_80px_rgba(56,189,248,0.8)] scale-110"
			case "processing":
				return "bg-gradient-to-tr from-amber-300 via-orange-500 to-rose-500 animate-spin shadow-[0_0_50px_rgba(251,146,60,0.6)]"
			case "error":
				return "bg-gradient-to-tr from-red-500 to-rose-700 shadow-[0_0_40px_rgba(244,63,94,0.5)]"
			case "idle":
			default:
				return "bg-gradient-to-tr from-slate-700 to-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
		}
	}

	return (
		<div className="relative flex items-center justify-center transition-all duration-700 ease-in-out" style={{ width: size, height: size }}>
			{/* Outer Glow Ring */}
			{state === "listening" && (
				<div className="absolute inset-0 rounded-full border-[6px] border-cyan-400/30 animate-ping opacity-50" />
			)}
			{state === "processing" && (
				<div className="absolute inset-0 rounded-full border-t-[6px] border-amber-400 animate-spin opacity-80" />
			)}
			
			{/* Inner Core */}
			<div 
				className={`relative rounded-full w-3/4 h-3/4 transition-all duration-700 ease-in-out ${getOrbStyles()}`}
			>
				{/* Glassmorphism reflection */}
				<div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-white opacity-20 blur-[8px]" />
			</div>
		</div>
	)
}
