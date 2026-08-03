import fs from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import type { Plugin } from "vite"

/**
 * Copies the drizzle migrations directory into the main process output.
 *
 * viteStaticCopy does not reliably fire during electron-vite's dev rebuilds,
 * so we use a plain Rollup writeBundle hook instead.
 */
function copyDrizzleMigrations(): Plugin {
	const src = path.resolve(__dirname, "drizzle")
	return {
		name: "copy-drizzle-migrations",
		writeBundle(options) {
			const dest = path.join(options.dir!, "drizzle")
			if (fs.existsSync(src)) {
				fs.cpSync(src, dest, { recursive: true })
			}
		},
	}
}

export default defineConfig({
	main: {
		plugins: [
			// @devilcode/sdk exports raw TypeScript (src/*.ts), not compiled JS. Left
			// external, the packaged app loads the .ts from node_modules and Node's
			// type-stripping refuses node_modules files
			// (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). Bundle it, like the
			// other workspace TS packages below.
			externalizeDepsPlugin({
				exclude: ["@devil-ai/configconv", "@devil-ai/agent-bridge", "@devilcode/sdk"],
			}),
			copyDrizzleMigrations(),
		],
		build: {
			sourcemap: true,
			rollupOptions: {
				input: { index: path.resolve(__dirname, "src/main/index.ts") },
			},
		},
	},
	preload: {
		// No externalizeDepsPlugin — sandboxed preloads must bundle all deps.
		// Output CJS because Electron sandboxed preloads cannot use ESM.
		build: {
			sourcemap: true,
			rollupOptions: {
				input: { index: path.resolve(__dirname, "src/preload/index.ts") },
				output: {
					format: "cjs",
				},
			},
		},
	},
	renderer: {
		root: path.resolve(__dirname, "src/renderer"),
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src/renderer"),
				"@devil-ai/ui": path.resolve(__dirname, "../../packages/ui/src"),
			},
		},
		worker: {
			format: "es",
		},
		server: {
			port: 1420,
			strictPort: true,
		},
		build: {
			chunkSizeWarningLimit: 1500,
			rollupOptions: {
				input: { index: path.resolve(__dirname, "src/renderer/index.html") },
				output: {
					manualChunks: {
						reactflow: ["reactflow", "@xyflow/react"],
						syntax: ["react-syntax-highlighter", "shiki"],
						motion: ["motion", "framer-motion"],
					},
				},
			},
		},
	},
})
