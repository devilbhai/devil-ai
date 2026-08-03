/**
 * Image generation via Pollinations.ai (free, no API key required).
 *
 * Uses GET https://image.pollinations.ai/prompt/{encodedPrompt}
 * with optional query params: width, height, model, seed, nologo, enhance.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { net } from "electron";
import { createLogger } from "./logger";

const log = createLogger("image-gen");

// ============================================================
// Types
// ============================================================

export interface GenerateImageInput {
	prompt: string;
	width?: number;
	height?: number;
	model?: "flux" | "turbo" | "stable-diffusion";
	seed?: number;
	enhance?: boolean;
}

export interface GenerateImageResult {
	filePath: string;
	width: number;
	height: number;
	model: string;
}

// ============================================================
// Constants
// ============================================================

const BASE_URL = "https://image.pollinations.ai/prompt";
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const DEFAULT_MODEL = "flux";
const TIMEOUT_MS = 60_000;

// ============================================================
// Helpers
// ============================================================

function getImageDir(): string {
	const dir = join(tmpdir(), "devil-ai-images");
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	return dir;
}

// ============================================================
// Public API
// ============================================================

/**
 * Generate an image using Pollinations.ai free API.
 * Returns the local file path of the downloaded image.
 */
export async function generateImage(
	input: GenerateImageInput,
): Promise<GenerateImageResult> {
	const {
		prompt,
		width = DEFAULT_WIDTH,
		height = DEFAULT_HEIGHT,
		model = DEFAULT_MODEL,
		seed,
		enhance,
	} = input;

	const encodedPrompt = encodeURIComponent(prompt);
	const params = new URLSearchParams({
		width: String(width),
		height: String(height),
		model,
		nologo: "true",
	});
	if (seed !== undefined) params.set("seed", String(seed));
	if (enhance) params.set("enhance", "true");

	const url = `${BASE_URL}/${encodedPrompt}?${params.toString()}`;

	log.info("Generating image", {
		prompt: prompt.slice(0, 80),
		width,
		height,
		model,
	});

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

	let response: Response;
	try {
		response = await net.fetch(url, {
			method: "GET",
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timeoutId);
	}

	if (!response.ok) {
		const text = await response.text().catch(() => "unknown");
		throw new Error(`Pollinations.ai returned ${response.status}: ${text}`);
	}

	const arrayBuffer = await response.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	if (buffer.length < 100) {
		throw new Error("Pollinations.ai returned an empty or invalid image");
	}

	const filename = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
	const filePath = join(getImageDir(), filename);
	writeFileSync(filePath, buffer);

	log.info("Image saved", { filePath, sizeBytes: buffer.length });

	return { filePath, width, height, model };
}

