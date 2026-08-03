import { BrowserWindow, screen } from "electron"

let bannerWindow: BrowserWindow | null = null

export function showPcControlBanner() {
	if (bannerWindow) return

	const display = screen.getPrimaryDisplay()
	const { width, height } = display.bounds

	const bannerWidth = 350
	const bannerHeight = 50

	bannerWindow = new BrowserWindow({
		width: bannerWidth,
		height: bannerHeight,
		x: Math.floor(width / 2 - bannerWidth / 2),
		y: height - 100,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		focusable: false,
		hasShadow: false,
		skipTaskbar: true,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
		},
	})

	// Make the window completely ignore mouse events
	bannerWindow.setIgnoreMouseEvents(true, { forward: true })

	// Load simple styled HTML for the banner
	const html = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body {
					margin: 0;
					overflow: hidden;
					display: flex;
					justify-content: center;
					align-items: center;
					height: 100vh;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
				}
				.banner {
					background: rgba(15, 23, 42, 0.8);
					backdrop-filter: blur(10px);
					-webkit-backdrop-filter: blur(10px);
					border: 1px solid rgba(255, 255, 255, 0.1);
					color: #e2e8f0;
					padding: 10px 20px;
					border-radius: 9999px;
					font-size: 14px;
					font-weight: 500;
					display: flex;
					align-items: center;
					gap: 10px;
					box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
				}
				.pulse {
					width: 10px;
					height: 10px;
					background-color: #ef4444;
					border-radius: 50%;
					animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
				}
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: .5; }
				}
			</style>
		</head>
		<body>
			<div class="banner">
				<div class="pulse"></div>
				Devil AI Controlling your PC...
			</div>
		</body>
		</html>
	`

	bannerWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

	bannerWindow.on("closed", () => {
		bannerWindow = null
	})
}

export function hidePcControlBanner() {
	if (bannerWindow) {
		bannerWindow.close()
		bannerWindow = null
	}
}
