import { PlusIcon } from "lucide-react"
import { PromptInputButton, usePromptInputAttachments } from "@devil-ai/ui/components/ai-elements/prompt-input"

export function AttachButton({ disabled }: { disabled?: boolean }) {
	const attachments = usePromptInputAttachments()
	return (
		<PromptInputButton
			tooltip="Attach files"
			onClick={() => attachments.openFileDialog()}
			disabled={disabled}
			aria-label="Attach files"
		>
			<PlusIcon className="size-4" />
		</PromptInputButton>
	)
}
