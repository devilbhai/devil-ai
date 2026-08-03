import { cn } from "@devil-ai/ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="skeleton"
			className={cn("bg-muted rounded-md animate-pulse", className)}
			{...props}
		/>
	)
}

export { Skeleton }
