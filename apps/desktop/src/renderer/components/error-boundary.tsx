import React, { Component, ReactNode } from "react"
import { Button } from "@devil-ai/ui/components/button"
import { AlertCircle } from "lucide-react"

interface Props {
	children?: ReactNode
}

interface State {
	hasError: boolean
	error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	}

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error }
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo)
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
					<AlertCircle className="w-12 h-12 text-destructive mb-4" />
					<h1 className="text-xl font-bold mb-2">Something went wrong</h1>
					<p className="text-muted-foreground mb-4">
						{this.state.error?.message || "An unexpected error occurred."}
					</p>
					<Button
						onClick={() => {
							this.setState({ hasError: false, error: undefined })
							window.location.reload()
						}}
					>
						Reload Application
					</Button>
				</div>
			)
		}

		return this.props.children
	}
}
