"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type ThemeId = "github" | "academic" | "minimal"

interface Props {
  html: string
  theme?: ThemeId
  innerRef?: React.RefObject<HTMLDivElement | null>
}

export function MarkdownPreview({ html, theme = "github", innerRef }: Props) {
  const themeClass = `prose-${theme}`
  const empty = html.trim().length === 0

  if (empty) {
    return (
      <div
        ref={innerRef}
        data-testid="markdown-preview"
        className="flex h-full items-center justify-center rounded-lg border bg-background p-6 text-sm text-muted-foreground"
      >
        Start typing to see your preview
      </div>
    )
  }

  // HTML comes from markdownToHtml() which sanitizes with DOMPurify (lib/markdown-parser.ts).
  // The injection prop below is safe because of that sanitization layer.
  return (
    <div
      ref={innerRef}
      data-testid="markdown-preview"
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none h-full overflow-auto rounded-lg border bg-background p-3 md:p-4",
        themeClass,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
