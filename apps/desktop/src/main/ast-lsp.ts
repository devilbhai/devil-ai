import * as ts from "typescript"
import fs from "node:fs/promises"

export interface AstSymbol {
	name: string
	kind: string
	line: number
}

/**
 * Parses a TypeScript/JavaScript file and extracts structural symbols.
 * This is used for AST-based RAG indexing.
 */
export async function extractAstSymbols(filePath: string): Promise<AstSymbol[]> {
	try {
		const code = await fs.readFile(filePath, "utf-8")
		const sourceFile = ts.createSourceFile(
			filePath,
			code,
			ts.ScriptTarget.Latest,
			true
		)

		const symbols: AstSymbol[] = []

		function visit(node: ts.Node) {
			if (ts.isClassDeclaration(node) && node.name) {
				const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
				symbols.push({ name: node.name.text, kind: "Class", line: line + 1 })
			} else if (ts.isFunctionDeclaration(node) && node.name) {
				const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
				symbols.push({ name: node.name.text, kind: "Function", line: line + 1 })
			} else if (ts.isInterfaceDeclaration(node)) {
				const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart())
				symbols.push({ name: node.name.text, kind: "Interface", line: line + 1 })
			}
			ts.forEachChild(node, visit)
		}

		visit(sourceFile)
		return symbols
	} catch (err) {
		try { console.error(`[AST] Failed to parse ${filePath}:`, err) } catch {}
		return []
	}
}

/**
 * Gets real-time TypeScript diagnostics (errors) for a given file content.
 * Used for pre-commit verification by the agent.
 */
export function getDiagnostics(fileName: string, content: string): string[] {
	const options: ts.CompilerOptions = {
		noEmit: true,
		target: ts.ScriptTarget.Latest,
		moduleResolution: ts.ModuleResolutionKind.NodeJs,
		allowJs: true,
	}

	const compilerHost = ts.createCompilerHost(options)
	const originalGetSourceFile = compilerHost.getSourceFile
	
	compilerHost.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) => {
		if (name === fileName) {
			return ts.createSourceFile(name, content, languageVersion)
		}
		return originalGetSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile)
	}

	const program = ts.createProgram([fileName], options, compilerHost)
	const diagnostics = ts.getPreEmitDiagnostics(program)

	return diagnostics.map(diag => {
		if (diag.file) {
			const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start!)
			const message = ts.flattenDiagnosticMessageText(diag.messageText, "\n")
			return `[Line ${line + 1}:${character + 1}] ${message}`
		}
		return ts.flattenDiagnosticMessageText(diag.messageText, "\n")
	})
}
