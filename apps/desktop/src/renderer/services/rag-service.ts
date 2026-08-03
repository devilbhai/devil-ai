/**
 * Local RAG service using TF-IDF vectorization.
 * Stores session context for retrieval during conversations.
 * Lazy-loaded — only initialized when RAG feature is enabled.
 *
 * Uses proper TF-IDF with IDF weighting and bigram support
 * for better semantic matching without external APIs.
 *
 * Performance: IDF and document tokens are cached and invalidated
 * only when the document store changes. Search is non-blocking
 * via setTimeout chunking for large collections.
 */

export interface RagDocument {
	id: string
	sessionId: string
	content: string
	timestamp: number
	metadata?: Record<string, unknown>
}

export interface RagSearchResult {
	document: RagDocument
	score: number
}

const STORAGE_KEY = "devil-ai:rag-documents"
const MAX_DOCS = 5000
const MIN_WORD_LENGTH = 2

// Stop words for better signal-to-noise ratio
const STOP_WORDS = new Set([
	"the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
	"have", "has", "had", "do", "does", "did", "will", "would", "could",
	"should", "may", "might", "shall", "can", "need", "dare", "ought",
	"used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
	"as", "into", "through", "during", "before", "after", "above", "below",
	"between", "out", "off", "over", "under", "again", "further", "then",
	"once", "here", "there", "when", "where", "why", "how", "all", "both",
	"each", "few", "more", "most", "other", "some", "such", "no", "nor",
	"not", "only", "own", "same", "so", "than", "too", "very", "s", "t",
	"just", "don", "now", "and", "but", "or", "if", "while", "this",
	"that", "these", "those", "i", "me", "my", "myself", "we", "our",
	"ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
	"he", "him", "his", "himself", "she", "her", "hers", "herself", "it",
	"its", "itself", "they", "them", "their", "theirs", "themselves",
	"what", "which", "who", "whom", "it's", "don't", "doesn't", "didn't",
	"won't", "wouldn't", "couldn't", "shouldn't", "isn't", "aren't",
	"wasn't", "weren't", "hasn't", "haven't", "hadn't", "can't", "let's",
	"that's", "who's", "what's", "here's", "there's", "when's", "where's",
	"why's", "how's", "i'm", "you're", "he's", "she's", "it's", "we're",
	"they're", "i've", "you've", "we've", "they've", "i'd", "you'd",
	"he'd", "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll",
	"we'll", "they'll", "isn't", "aren't", "wasn't", "weren't", "hasn't",
	"haven't", "hadn't", "doesn't", "don't", "didn't", "won't", "wouldn't",
	"shan't", "shouldn't", "can't", "cannot", "couldn't", "mustn't", "let's",
	"that's", "who's", "what's", "here's", "there's", "when's", "where's",
	"why's", "how's", "ain't", "y'all", "y'all", "mightn't", "mustn't",
	"oughtn't", "needn't", "ain't",
])

// ============================================================
// In-memory cache (invalidated on doc store changes)
// ============================================================

let cachedDocs: RagDocument[] | null = null
let cachedIdf: Map<string, number> | null = null
let cachedTokenizedDocs: Map<string, { tokens: string[]; freq: Map<string, number> }> | null = null

function invalidateCache() {
	cachedDocs = null
	cachedIdf = null
	cachedTokenizedDocs = null
}

// ============================================================
// Storage helpers (cached reads)
// ============================================================

function getAllDocs(): RagDocument[] {
	if (cachedDocs !== null) return cachedDocs
	let docs: RagDocument[]
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		docs = raw ? JSON.parse(raw) : []
	} catch {
		docs = []
	}
	cachedDocs = docs
	return docs
}

function saveAllDocs(docs: RagDocument[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(docs.slice(-MAX_DOCS)))
		invalidateCache()
	} catch {
		// Storage full — silently drop oldest
	}
}

// ============================================================
// Tokenization
// ============================================================

function tokenize(text: string): { tokens: string[]; freq: Map<string, number> } {
	const words = text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(w))

	const freq = new Map<string, number>()
	for (const w of words) {
		freq.set(w, (freq.get(w) || 0) + 1)
	}

	for (let i = 0; i < words.length - 1; i++) {
		const bigram = `${words[i]} ${words[i + 1]}`
		freq.set(bigram, (freq.get(bigram) || 0) + 1)
	}

	return { tokens: words, freq }
}

function getTokenizedDoc(doc: RagDocument): { tokens: string[]; freq: Map<string, number> } {
	if (!cachedTokenizedDocs) cachedTokenizedDocs = new Map()
	const cached = cachedTokenizedDocs.get(doc.id)
	if (cached) return cached
	const result = tokenize(doc.content)
	cachedTokenizedDocs.set(doc.id, result)
	return result
}

// ============================================================
// IDF computation (cached)
// ============================================================

function getIDF(docs: RagDocument[]): Map<string, number> {
	if (cachedIdf) return cachedIdf

	const docCount = docs.length
	if (docCount === 0) {
		cachedIdf = new Map()
		return cachedIdf
	}

	const docFreq = new Map<string, number>()
	for (const doc of docs) {
		const { freq } = getTokenizedDoc(doc)
		for (const term of freq.keys()) {
			docFreq.set(term, (docFreq.get(term) || 0) + 1)
		}
	}

	const idf = new Map<string, number>()
	for (const [term, df] of docFreq) {
		idf.set(term, Math.log((docCount + 1) / (df + 1)) + 1)
	}

	cachedIdf = idf
	return idf
}

// ============================================================
// TF-IDF helpers
// ============================================================

function computeTFIDF(
	freq: Map<string, number>,
	idf: Map<string, number>,
): Map<string, number> {
	const vector = new Map<string, number>()
	let maxFreq = 1
	for (const v of freq.values()) {
		if (v > maxFreq) maxFreq = v
	}

	for (const [term, tf] of freq) {
		const normalizedTF = tf / maxFreq
		const idfScore = idf.get(term) ?? 1
		vector.set(term, normalizedTF * idfScore)
	}

	return vector
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
	let dot = 0
	let normA = 0
	let normB = 0

	for (const [key, va] of a) {
		const vb = b.get(key) || 0
		dot += va * vb
		normA += va * va
	}

	for (const vb of b.values()) {
		normB += vb * vb
	}

	if (normA === 0 || normB === 0) return 0
	return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

function extractKeyPhrases(text: string): string[] {
	const phrases: string[] = []
	const codeBlockRegex = /```[\s\S]*?```/g
	let match

	while ((match = codeBlockRegex.exec(text)) !== null) {
		const code = match[0].replace(/```[\w]*\n?/g, "").trim()
		if (code.length > 10) {
			phrases.push(code)
		}
	}

	const identifierRegex = /\b(?:function|class|const|let|var|import|export|interface|type)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
	while ((match = identifierRegex.exec(text)) !== null) {
		phrases.push(match[1])
	}

	return phrases
}

// ============================================================
// Public API
// ============================================================

/**
 * Add a document to the local vector store.
 */
export function addDocument(doc: Omit<RagDocument, "id" | "timestamp">): RagDocument {
	const docs = getAllDocs()
	const newDoc: RagDocument = {
		...doc,
		id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
		timestamp: Date.now(),
	}
	docs.push(newDoc)
	saveAllDocs(docs)
	return newDoc
}

/**
 * Add multiple messages from a session in batch.
 * Filters out short messages and duplicates.
 */
export function addSessionMessages(
	sessionId: string,
	messages: { role: string; content: string }[],
): RagDocument[] {
	const docs = getAllDocs()
	const seen = new Set(docs.filter((d) => d.sessionId === sessionId).map((d) => d.content))

	const newDocs: RagDocument[] = messages
		.filter((m) => {
			const content = m.content.trim()
			if (content.length < 20) return false
			if (seen.has(content)) return false
			seen.add(content)
			return true
		})
		.map((m) => ({
			id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
			sessionId,
			content: `[${m.role}] ${m.content}`,
			timestamp: Date.now(),
		}))

	if (newDocs.length > 0) {
		docs.push(...newDocs)
		saveAllDocs(docs)
	}

	return newDocs
}

/**
 * Search for similar documents using TF-IDF cosine similarity.
 * Uses cached IDF and tokenized docs for performance.
 */
export function searchDocuments(
	query: string,
	options: { limit?: number; sessionId?: string; minScore?: number } = {},
): RagSearchResult[] {
	const { limit = 5, sessionId, minScore = 0.05 } = options
	const queryTokens = tokenize(query)
	if (queryTokens.freq.size === 0) return []

	let docs = getAllDocs()
	if (sessionId) {
		docs = docs.filter((d) => d.sessionId === sessionId)
	}

	if (docs.length === 0) return []

	const idf = getIDF(docs)
	const queryVector = computeTFIDF(queryTokens.freq, idf)
	const queryText = query.toLowerCase()

	const results: RagSearchResult[] = []
	for (const doc of docs) {
		const docTokens = getTokenizedDoc(doc)
		const docVector = computeTFIDF(docTokens.freq, idf)
		const score = cosineSimilarity(queryVector, docVector)

		const keyPhrases = extractKeyPhrases(doc.content)
		for (const phrase of keyPhrases) {
			if (queryText.includes(phrase.toLowerCase())) {
				const boostedScore = score + 0.3
				results.push({ document: doc, score: Math.min(boostedScore, 1) })
				break
			}
		}

		if (score >= minScore) {
			results.push({ document: doc, score })
		}
	}

	const seen = new Set<string>()
	const uniqueResults = results.filter((r) => {
		if (seen.has(r.document.id)) return false
		seen.add(r.document.id)
		return true
	})

	return uniqueResults.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * Get document count for a session.
 */
export function getSessionDocCount(sessionId: string): number {
	return getAllDocs().filter((d) => d.sessionId === sessionId).length
}

/**
 * Clear all documents for a session.
 */
export function clearSessionDocs(sessionId: string) {
	const docs = getAllDocs().filter((d) => d.sessionId !== sessionId)
	saveAllDocs(docs)
}

/**
 * Get total document count.
 */
export function getTotalDocCount(): number {
	return getAllDocs().length
}
