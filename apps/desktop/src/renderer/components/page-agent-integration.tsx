import { useEffect } from "react"
import { useAtomValue } from "jotai"
import { pageAgentConfigAtom } from "../atoms/page-agent"

export function PageAgentIntegration() {
	const config = useAtomValue(pageAgentConfigAtom)

	useEffect(() => {
		if (config.enabled) {
			console.warn("PageAgent is currently disabled in the renderer because it requires Node.js integration (main process).")
		}
	}, [config.enabled])

	return null
}
