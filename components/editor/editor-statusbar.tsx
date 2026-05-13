"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { SaveState } from "@/hooks/use-document"

interface Props {
  markdown: string
  saveState: SaveState
}

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).filter(Boolean).length
}

function readingTimeMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200))
}

export function EditorStatusbar({ markdown, saveState }: Props) {
  const words = React.useMemo(() => countWords(markdown), [markdown])
  const chars = markdown.length
  const readTime = readingTimeMinutes(words)

  const dotColor =
    saveState === "saving"
      ? "bg-amber-500"
      : saveState === "saved"
        ? "bg-green-500"
        : "bg-muted-foreground/40"

  const label =
    saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Idle"

  return (
    <div
      data-testid="editor-statusbar"
      className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground"
    >
      <div className="flex items-center gap-3">
        <span data-testid="word-count">Words: {words}</span>
        <span data-testid="char-count">Chars: {chars}</span>
        <span data-testid="read-time">~{readTime} min read</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", dotColor)} aria-hidden />
        <span data-testid="save-state">{label}</span>
      </div>
    </div>
  )
}
