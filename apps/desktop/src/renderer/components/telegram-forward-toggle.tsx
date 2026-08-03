import { useAtomValue, useSetAtom } from "jotai"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { ForwardIcon } from "lucide-react"
import { toggleTelegramForwardAtom, telegramForwardSessionsAtom } from "../atoms/telegram-forward"
import { Tooltip, TooltipContent, TooltipTrigger } from "@devil-ai/ui/components/tooltip"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@devil-ai/ui/components/alert-dialog"

interface TelegramForwardToggleProps {
	sessionId: string
}

export function TelegramForwardToggle({ sessionId }: TelegramForwardToggleProps) {
	const forwardSessions = useAtomValue(telegramForwardSessionsAtom)
	const toggleForward = useSetAtom(toggleTelegramForwardAtom)
	const isForwarding = forwardSessions.has(sessionId)
	const [hasToken, setHasToken] = useState(false)
	const [showNoTokenDialog, setShowNoTokenDialog] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		window.devilAi?.getSettings?.().then((s) => {
			setHasToken(!!s?.telegramBotToken)
		})
	}, [])

	const handleClick = useCallback(() => {
		if (!hasToken) {
			setShowNoTokenDialog(true)
			return
		}
		toggleForward(sessionId)
	}, [hasToken, sessionId, toggleForward])

	const handleGoToSettings = useCallback(() => {
		setShowNoTokenDialog(false)
		navigate({ to: "/settings/setup" })
	}, [navigate])

	return (
		<>
			<Tooltip>
				<TooltipTrigger
					render={
						<button
							type="button"
							onClick={handleClick}
							className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
								isForwarding
									? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25"
									: "text-muted-foreground hover:bg-muted hover:text-foreground"
							}`}
						/>
					}
				>
					<ForwardIcon className="size-3.5" />
					<span className="hidden lg:inline">Telegram</span>
				</TooltipTrigger>
				<TooltipContent>
					{isForwarding ? "Forwarding to Telegram (click to stop)" : "Forward session messages to Telegram"}
				</TooltipContent>
			</Tooltip>

			<AlertDialog open={showNoTokenDialog} onOpenChange={setShowNoTokenDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Telegram Bot Token Required</AlertDialogTitle>
						<AlertDialogDescription>
							To use Telegram forwarding, you need to add your Telegram Bot Token first. 
							Go to Settings → Setup to configure your bot token.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleGoToSettings}>
							Go to Settings
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
