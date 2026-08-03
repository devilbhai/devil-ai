/** Vite-specific extensions to ImportMeta (renderer process only). */
interface ImportMetaEnv {
	readonly DEV: boolean
	readonly PROD: boolean
	readonly MODE: string
	readonly BASE_URL: string
	readonly SSR: boolean
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

/** Vite side-effect CSS imports (e.g. `import "xterm/css/xterm.css"`). */
declare module "*.css"
