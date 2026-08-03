import { atomWithStorage } from "jotai/utils"

export interface PageAgentConfig {
	enabled: boolean
	/** Always true — Page Agent uses the chat model (no separate API key needed) */
	useChatProvider: boolean
	/** Only used when useChatProvider is false (kept for backwards compat) */
	apiKey: string
	/** Only used when useChatProvider is false (kept for backwards compat) */
	baseURL: string
	/** Only used when useChatProvider is false (kept for backwards compat) */
	model: string
}

export const pageAgentConfigAtom = atomWithStorage<PageAgentConfig>("devil-ai-page-agent-config", {
	enabled: false,
	useChatProvider: true,
	apiKey: "",
	baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
	model: "qwen-max",
})
