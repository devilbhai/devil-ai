import { defineConfig } from "drizzle-kit"

export default defineConfig({
	schema: [
		"./src/main/automation/schema.ts",
		"./src/main/notes/schema.ts",
		"./src/main/memory/schema.ts",
		"./src/main/prompts/schema.ts",
		"./src/main/snippets/schema.ts",
		"./src/main/session-templates/schema.ts",
		"./src/main/keyboard-shortcuts/schema.ts",
	],
	out: "./drizzle",
	dialect: "sqlite",
})
