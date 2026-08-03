/**
 * OCR service using Tesseract.js (free, MIT license).
 * Extracts text from images via paste, drag-drop, or file upload.
 * Lazy-loaded to avoid adding ~2MB to initial bundle.
 */

export type OcrState = "idle" | "loading" | "processing" | "done" | "error"

export interface OcrResult {
	text: string
	confidence: number
	lines: { text: string; confidence: number }[]
}

let worker: Awaited<ReturnType<typeof import("tesseract.js").createWorker>> | null = null

async function getWorker() {
	if (worker) return worker

	const { createWorker } = await import("tesseract.js")
	worker = await createWorker("eng", 1, {
		logger: (m: { status: string; progress: number }) => {
			if (m.status === "recognizing text") {
				// Progress callback could be added here
			}
		},
	})

	return worker
}

export async function extractTextFromImage(
	imageSource: string | File,
): Promise<OcrResult> {
	const w = await getWorker()

	const result = await w.recognize(imageSource)
	const data = result.data as { text: string; confidence: number; lines?: { text: string; confidence: number }[] }

	return {
		text: (data.text || "").trim(),
		confidence: data.confidence || 0,
		lines: (data.lines || []).map((l) => ({
			text: (l.text || "").trim(),
			confidence: l.confidence || 0,
		})).filter((l) => l.text.length > 0),
	}
}

export function isOcrSupported(): boolean {
	return typeof window !== "undefined" && "FileReader" in window
}

export async function terminateOcr() {
	if (worker) {
		await worker.terminate()
		worker = null
	}
}
