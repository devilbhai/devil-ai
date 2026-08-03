/**
 * MCP Auto-Add Progress Component
 * 
 * Shows todo-style progress when MCP servers are being auto-added
 * 
 * @module mcp-auto-add-progress
 */

import { useState, useEffect, useCallback } from "react"
import { CheckCircleIcon, CircleIcon, AlertCircleIcon, PlugIcon, LoaderIcon } from "lucide-react"
import { cn } from "@devil-ai/ui/lib/utils"
import {
  detectAndAddWithProgress,
  type MCProgressUpdate,
  type AwesomeMCPServer,
} from "../lib/mcp-auto-detect"

// ============================================================
// Types
// ============================================================

interface MCPAutoAddProgressProps {
  /** User prompt to analyze */
  prompt: string
  /** Called when all MCPs are added */
  onComplete?: (servers: AwesomeMCPServer[]) => void
  /** Called on error */
  onError?: (error: string) => void
  /** Auto-start detection */
  autoStart?: boolean
}

interface ProgressItem {
  server: AwesomeMCPServer
  status: "pending" | "detecting" | "adding" | "added" | "error"
  error?: string
}

// ============================================================
// Component
// ============================================================

export function MCPAutoAddProgress({
  prompt,
  onComplete,
  onError,
  autoStart = true,
}: MCPAutoAddProgressProps) {
  const [items, setItems] = useState<ProgressItem[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const startDetection = useCallback(async () => {
    if (isRunning || isComplete) return
    
    setIsRunning(true)
    setItems([])

    try {
      const addedServers = await detectAndAddWithProgress(
        prompt,
        (update: MCProgressUpdate) => {
          setItems((prev) => {
            const existing = prev.find((item) => item.server.id === update.server.id)
            if (existing) {
              return prev.map((item) =>
                item.server.id === update.server.id
                  ? { ...item, status: update.status, error: update.error }
                  : item
              )
            }
            return [
              ...prev,
              {
                server: update.server,
                status: update.status,
                error: update.error,
              },
            ]
          })
        }
      )

      setIsComplete(true)
      onComplete?.(addedServers)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Failed to detect MCPs")
    } finally {
      setIsRunning(false)
    }
  }, [prompt, isRunning, isComplete, onComplete, onError])

  useEffect(() => {
    if (autoStart && prompt) {
      startDetection()
    }
  }, [autoStart, prompt, startDetection])

  if (items.length === 0 && !isRunning) {
    return null
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <PlugIcon className="h-3.5 w-3.5 text-purple-500" />
        <span className="text-muted-foreground">Auto-detecting MCP servers...</span>
        {isRunning && <LoaderIcon className="h-3 w-3 animate-spin text-purple-500" />}
      </div>

      {/* Progress Items */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <div
            key={item.server.id}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
              item.status === "added" && "bg-green-500/5",
              item.status === "error" && "bg-red-500/5"
            )}
          >
            {/* Status Icon */}
            {item.status === "pending" && (
              <CircleIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            {item.status === "detecting" && (
              <LoaderIcon className="h-3.5 w-3.5 text-yellow-500 animate-spin shrink-0" />
            )}
            {item.status === "adding" && (
              <LoaderIcon className="h-3.5 w-3.5 text-blue-500 animate-spin shrink-0" />
            )}
            {item.status === "added" && (
              <CheckCircleIcon className="h-3.5 w-3.5 text-green-500 shrink-0" />
            )}
            {item.status === "error" && (
              <AlertCircleIcon className="h-3.5 w-3.5 text-red-500 shrink-0" />
            )}

            {/* Server Name */}
            <span className={cn(
              "font-medium",
              item.status === "added" && "text-green-600",
              item.status === "error" && "text-red-600"
            )}>
              {item.server.name}
            </span>

            {/* Status Text */}
            <span className="text-muted-foreground">
              {item.status === "pending" && "Pending..."}
              {item.status === "detecting" && "Detecting..."}
              {item.status === "adding" && "Adding..."}
              {item.status === "added" && "Added"}
              {item.status === "error" && (item.error || "Failed")}
            </span>
          </div>
        ))}
      </div>

      {/* Summary */}
      {isComplete && (
        <div className="pt-1 text-xs text-muted-foreground">
          {items.filter((i) => i.status === "added").length} server(s) added
        </div>
      )}
    </div>
  )
}

// ============================================================
// Inline Progress (for chat messages)
// ============================================================

interface MCPInlineProgressProps {
  servers: AwesomeMCPServer[]
  status: "detecting" | "adding" | "added" | "error"
}

export function MCPInlineProgress({
  servers,
  status,
}: MCPInlineProgressProps) {
  if (servers.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {servers.map((server) => (
        <div
          key={server.id}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
            status === "added" && "border-green-500/30 bg-green-500/10 text-green-600",
            status === "error" && "border-red-500/30 bg-red-500/10 text-red-600",
            status === "detecting" && "border-yellow-500/30 bg-yellow-500/10 text-yellow-600",
            status === "adding" && "border-blue-500/30 bg-blue-500/10 text-blue-600"
          )}
        >
          {status === "added" && <CheckCircleIcon className="h-2.5 w-2.5" />}
          {status === "error" && <AlertCircleIcon className="h-2.5 w-2.5" />}
          {status === "detecting" && <LoaderIcon className="h-2.5 w-2.5 animate-spin" />}
          {status === "adding" && <LoaderIcon className="h-2.5 w-2.5 animate-spin" />}
          {server.name}
        </div>
      ))}
    </div>
  )
}
