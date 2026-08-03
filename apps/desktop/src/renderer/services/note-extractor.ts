import { Part } from "../lib/types"

/**
 * Automatically extracts notes from assistant messages and saves them to Notes.
 * It looks for a specific markdown tag: <devil-ai-note title="...">...</devil-ai-note>
 */
export async function autoExtractNotes(flushedParts: Part[]): Promise<void> {
	try {
		for (const part of flushedParts) {
			if (part.type === "text" && part.text) {
				const text = typeof part.text === "string" ? part.text : ""
				if (!text) continue

				// Match <devil-ai-note title="Title">Content</devil-ai-note>
				const noteRegex = /<devil-ai-note\s+title="([^"]+)">([\s\S]*?)<\/devil-ai-note>/g
				let match
				while ((match = noteRegex.exec(text)) !== null) {
					const title = match[1] || "Untitled Note"
					const content = match[2].trim()

					// Check if a similar note already exists
					const searchResults = await window.devilAi.notes.search(title)
					const exists = searchResults.some((n: any) => n.title === title && n.content.trim() === content)
					
					if (!exists) {
						// Save the note and automatically include it in context
						await window.devilAi.notes.create({
							title,
							content,
							tags: "auto-extracted",
							includeInContext: true
						} as any)
						console.log(`[AutoNote] Automatically saved note: ${title}`)
					}
				}
			}
		}
	} catch (err) {
		console.error("[AutoNote] Error auto-extracting notes:", err)
	}
}
