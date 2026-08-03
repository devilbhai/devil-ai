/**
 * Onboarding Step 1: Welcome.
 *
 * Brief introduction to Devil-ai and what the setup will cover.
 */

import { Button } from "@devil-ai/ui/components/button"
import { ArrowRightIcon } from "lucide-react"
import { DevilAiWordmark } from "../../devil-ai-wordmark"

interface WelcomeStepProps {
	onContinue: () => void
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center px-6">
			<div className="w-full max-w-md space-y-8 text-center">
				{/* Logo */}
				<div className="flex justify-center">
					<DevilAiWordmark className="h-6 w-auto text-foreground" />
				</div>

				{/* Description */}
				<div className="space-y-3">
					<p className="text-lg text-muted-foreground">Your AI-powered coding companion.</p>
					<p className="text-sm leading-relaxed text-muted-foreground/70">
						Devil AI gives you a native experience for managing AI coding sessions across all your
						projects, with real-time streaming, native notifications, and multi-session support.
					</p>
				</div>

				{/* CTA */}
				<div className="space-y-3">
					<Button size="lg" onClick={onContinue} className="gap-2">
						Get Started
						<ArrowRightIcon aria-hidden="true" className="size-4" />
					</Button>
					<p className="text-xs text-muted-foreground/50">This takes less than a minute.</p>
				</div>
			</div>
		</div>
	)
}
