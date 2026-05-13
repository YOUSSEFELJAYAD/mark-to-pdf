"use client"

import * as React from "react"
import { read, write, STORAGE_KEYS } from "@/lib/storage"

const SAMPLE_MARKDOWN = `# Welcome to Markdown Converter

This is a **powerful** tool to convert your Markdown to PDF or DOCX.

## Features

- Live preview
- Multiple export formats
- Clean formatting

### Code Support

\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Lists

1. First item
2. Second item
3. Third item

> This is a blockquote that can contain **formatted text**.

---

Learn more at [example.com](https://example.com).
`

interface PersistedDoc {
  markdown: string
  filename: string
  isUserEditedFilename: boolean
  updatedAt: number
}

export type SaveState = "idle" | "saving" | "saved"

interface UseDocumentOptions {
  onRestored?: (info: { filename: string }) => void
}

const DEBOUNCE_MS = 500
const SAVED_INDICATOR_MS = 1500

export function useDocument(options: UseDocumentOptions = {}) {
  const [markdown, setMarkdownState] = React.useState<string>(SAMPLE_MARKDOWN)
  const [filename, setFilenameState] = React.useState<string>("document")
  const [isUserEditedFilename, setIsUserEditedFilename] = React.useState(false)
  const [saveState, setSaveState] = React.useState<SaveState>("idle")
  const [hydrated, setHydrated] = React.useState(false)

  const stateRef = React.useRef({ markdown, filename, isUserEditedFilename })
  const onRestoredRef = React.useRef(options.onRestored)
  const debounceRef = React.useRef<number | null>(null)
  const savedTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    stateRef.current = { markdown, filename, isUserEditedFilename }
    onRestoredRef.current = options.onRestored
  })

  React.useEffect(() => {
    const stored = read<PersistedDoc>(STORAGE_KEYS.currentDoc)
    if (stored) {
      setMarkdownState(stored.markdown)
      setFilenameState(stored.filename || "document")
      setIsUserEditedFilename(Boolean(stored.isUserEditedFilename))
      onRestoredRef.current?.({ filename: stored.filename || "document" })
    }
    setHydrated(true)
  }, [])

  const flushNow = React.useCallback(() => {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const { markdown, filename, isUserEditedFilename } = stateRef.current
    write<PersistedDoc>(STORAGE_KEYS.currentDoc, {
      markdown,
      filename,
      isUserEditedFilename,
      updatedAt: Date.now(),
    })
    setSaveState("saved")
    if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current)
    savedTimerRef.current = window.setTimeout(
      () => setSaveState("idle"),
      SAVED_INDICATOR_MS,
    )
  }, [])

  const scheduleSave = React.useCallback(() => {
    setSaveState("saving")
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      flushNow()
    }, DEBOUNCE_MS)
  }, [flushNow])

  React.useEffect(() => {
    if (!hydrated) return
    scheduleSave()
  }, [markdown, filename, isUserEditedFilename, hydrated, scheduleSave])

  React.useEffect(() => {
    const handler = () => flushNow()
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [flushNow])

  const setMarkdown = React.useCallback((next: string) => {
    setMarkdownState(next)
  }, [])

  const setFilename = React.useCallback(
    (next: string, source: "user" | "system" = "user") => {
      setFilenameState(next)
      if (source === "user") setIsUserEditedFilename(true)
    },
    [],
  )

  const resetUserEditedFilename = React.useCallback(() => {
    setIsUserEditedFilename(false)
  }, [])

  return {
    markdown,
    setMarkdown,
    filename,
    setFilename,
    isUserEditedFilename,
    resetUserEditedFilename,
    saveState,
    flushNow,
    hydrated,
  }
}
