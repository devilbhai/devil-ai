import { useCallback, useRef, useState } from "react"
import { useAtomValue } from "jotai"
import { ScanTextIcon, Loader2Icon } from "lucide-react"
import { ocrEnabledAtom } from "../../atoms/feature-flags"
import { PromptInputButton } from "@devil-ai/ui/components/ai-elements/prompt-input"

interface OcrButtonProps {
	onTextExtracted: (text: string) => void
	disabled?: boolean
}

const isOcrSupported = () => typeof window !== "undefined" && "FileReader" in window

export function OcrButton({ onTextExtracted, disabled }: OcrButtonProps) {
	const enabled = useAtomValue(ocrEnabledAtom)
	const [processing, setProcessing] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFile = useCallback(
		async (file: File) => {
			if (!file.type.startsWith("image/")) return
			setProcessing(true)
			try {
				const { extractTextFromImage } = await import("../../services/ocr-service")
				const result = await extractTextFromImage(file)
				if (result.text) {
					onTextExtracted(result.text)
				}
			} catch (err) {
				console.error("OCR failed:", err)
			} finally {
				setProcessing(false)
			}
		},
		[onTextExtracted],
	)

	const handleClick = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) handleFile(file)
			e.target.value = ""
		},
		[handleFile],
	)

	if (!enabled || !isOcrSupported()) return null

	return (
		<>
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleChange}
			/>
			<PromptInputButton
				tooltip="Extract text from image (OCR)"
				onClick={handleClick}
				disabled={disabled || processing}
				aria-label="Extract text from image (OCR)"
			>
				{processing ? (
					<Loader2Icon className="size-4 animate-spin" />
				) : (
					<ScanTextIcon className="size-4" />
				)}
			</PromptInputButton>
		</>
	)
}
