import { Part } from "../lib/types"

/**
 * Automatically extracts code blocks from assistant messages and saves them to Snippets.
 * Uses heuristic filtering to only save meaningful, reusable code.
 */
export async function autoExtractSnippets(flushedParts: Part[], projectPath?: string): Promise<void> {
	try {
		for (const part of flushedParts) {
			if (part.type === "text" && part.text) {
				const text = typeof part.text === "string" ? part.text : ""
				if (!text) continue

				const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
				let match
				while ((match = codeBlockRegex.exec(text)) !== null) {
					const language = match[1] || "text"
					const code = match[2].trim()
					const lines = code.split("\n")

					// Skip junk: too short, too long, or trivial
					if (lines.length < 5 || lines.length > 150) continue

					// Skip common junk patterns
					const trimmedCode = code.trim().toLowerCase()
					const junkPatterns = [
						/^import\s+/,           // import statements
						/^export\s+default\s+/, // export default
						/^console\.log/,        // console.log
						/^\/\/.*$/,              // single comment lines
						/^#.*$/,                 // single comment lines
						/^```/,                  // code fences
						/^---/,                  // yaml separators
						/^\s*$/,                  // empty lines
						/^npm\s+(install|i)\s+/, // npm install
						/^pip\s+install\s+/,     // pip install
						/^yarn\s+(add|install)/,  // yarn add
					]
					if (junkPatterns.some((p) => p.test(trimmedCode))) continue

					// Skip if mostly comments (more than 50% comment lines)
					const commentLines = lines.filter((l) => {
						const trimmed = l.trim()
						return trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")
					}).length
					if (commentLines / lines.length > 0.5) continue

					// Skip common trivial code
					const trivialPatterns = [
						/^console\.log\(/,
						/^print\(/,
						/^puts\s+/,
						/^fmt\.Print/,
						/^System\.out\.print/,
						/^document\.write/,
						/^alert\(/,
						/^echo\s+/,
					]
					if (trivialPatterns.some((p) => p.test(code.trim()))) continue

					// Generate smart title
					let title = generateSnippetTitle(lines, language)

					// Check for duplicate by content hash
					const searchResults = await window.devilAi.snippets.search(code.substring(0, 50))
					const exists = searchResults.some((s: any) => s.content.trim() === code)
					
					if (!exists) {
						await window.devilAi.snippets.create({
							title,
							content: code,
							language,
							tags: "auto-extracted",
							projectPath: projectPath || "",
						})
						console.log(`[AutoSnippet] Saved: ${title}`)
					}
				}
			}
		}
	} catch (err) {
		console.error("[AutoSnippet] Error auto-extracting snippets:", err)
	}
}

function generateSnippetTitle(lines: string[], language: string): string {
	const firstLine = lines[0].trim()

	// Try to extract function/class name
	const nameMatch = firstLine.match(/(?:function|class|const|let|var|export|async|interface|type|enum)\s+([a-zA-Z0-9_]+)/)
	if (nameMatch?.[1]) {
		return `${nameMatch[1]} (${language})`
	}

	// Try to extract from comment
	if (firstLine.startsWith("//") || firstLine.startsWith("#") || firstLine.startsWith("/*")) {
		const cleaned = firstLine.replace(/^[\/#*\s]+/, "").trim()
		if (cleaned.length > 3 && cleaned.length < 60) return cleaned
	}

	// Try React component
	const componentMatch = firstLine.match(/(?:export\s+)?(?:function|const)\s+([A-Z][a-zA-Z0-9]+)/)
	if (componentMatch?.[1]) {
		return `${componentMatch[1]} Component`
	}

	// Fallback
	return `${language} snippet (${lines.length} lines)`
}
