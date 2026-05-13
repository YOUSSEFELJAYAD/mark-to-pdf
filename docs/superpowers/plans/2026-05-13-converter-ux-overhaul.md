# Converter UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift the Markdown → PDF/DOCX converter to a polished editor with CodeMirror 6, toolbar/shortcuts/autosave, file drop/upload/paste/recents, export customization (page size, margins, themes, fonts, TOC, page numbers, cover), and toast-based feedback.

**Architecture:** Slim orchestrator (`MarkdownConverter`) wires three reusable hooks (`useDocument`, `useRecentDocs`, `useExportSettings`) into four feature islands (editor, preview, export controls, export settings dialog). All state persists to versioned localStorage. Pure rendering logic (themes, TOC, commands) lives in `lib/`.

**Tech Stack:** Next.js 16 / React 19 / Tailwind v4, CodeMirror 6 (`@codemirror/lang-markdown`), sonner toasts, DOMPurify for safe HTML preview rendering, existing `marked` + `jspdf` + `docx`. Tests via Playwright (e2e/).

**Spec:** `docs/superpowers/specs/2026-05-13-converter-ux-overhaul-design.md`

---

## File map

**Created**
- `lib/storage.ts`
- `lib/editor/commands.ts`
- `lib/editor/markdown-extensions.ts`
- `lib/editor/keymap.ts`
- `lib/export/themes.ts`
- `lib/export/toc.ts`
- `lib/export/export-pdf.ts` (moved + refactored from `lib/export-pdf.ts`)
- `lib/export/export-docx.ts` (moved + refactored from `lib/export-docx.ts`)
- `hooks/use-document.ts`
- `hooks/use-recent-docs.ts`
- `hooks/use-export-settings.ts`
- `components/editor/markdown-editor.tsx`
- `components/editor/editor-toolbar.tsx`
- `components/editor/editor-statusbar.tsx`
- `components/editor/file-drop-overlay.tsx`
- `components/preview/markdown-preview.tsx`
- `components/export/export-settings-dialog.tsx`
- `e2e/editor-toolbar.spec.ts`
- `e2e/editor-shortcuts.spec.ts`
- `e2e/autosave.spec.ts`
- `e2e/file-handling.spec.ts`
- `e2e/export-settings.spec.ts`
- `e2e/recent-docs.spec.ts`

**Modified**
- `app/page.tsx`
- `app/layout.tsx` (mount `<Toaster />`)
- `app/globals.css` (add prose theme variants)
- `components/markdown-converter.tsx` (slim orchestrator)
- `lib/markdown-parser.ts` (add sanitization)
- `package.json` (new deps)
- `e2e/markdown-converter.spec.ts` (selectors updated for CodeMirror, mobile menu removed)

**Deleted**
- `lib/export-pdf.ts` (replaced)
- `lib/export-docx.ts` (replaced)

---

## Conventions for this plan

- **Branch:** create `feat/converter-ux-overhaul` before Phase 0. Work happens there.
- **Commit style:** conventional commits (`feat:`, `refactor:`, `test:`, `chore:`, `docs:`) — matches existing log. **No Claude co-author trailer.**
- **No `--no-verify`** ever. If lint/typecheck fails, fix the code.
- **TDD where it gives leverage:** Playwright tests for user-visible behavior. Pure lib functions don't get vitest (out of spec); they get exercised by the e2e suite. Write tests BEFORE the implementation for each task that introduces user-visible behavior.
- **Run after every task:**
  ```
  npm run lint
  npx tsc --noEmit
  ```
  Build is only run at Phase boundaries.
- **Mobile menu removal:** the existing hamburger / mobile menu in `markdown-converter.tsx` is replaced by the new toolbar (which is responsive). Tests that target `.lucide-menu` need updating.
- **HTML sanitization:** the preview pane injects rendered markdown HTML. We add DOMPurify (Task 1.0) and pass through it before injection. This closes the existing self-XSS gap and satisfies the security review.

---

# Phase 0 — Pre-flight

### Task 0.1: Create feature branch and verify clean baseline

**Files:** none

- [ ] **Step 1: Verify clean working tree and create branch**

```bash
git -C /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf status
git -C /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf checkout -b feat/converter-ux-overhaul
```

Expected: `On branch feat/converter-ux-overhaul`. If status is dirty, stop and ask the user.

- [ ] **Step 2: Run lint + typecheck on baseline**

Run:
```bash
cd /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf
npm run lint
npx tsc --noEmit
```

Expected: both pass with zero errors. If anything fails on baseline, stop and flag it — do not "fix" pre-existing issues in this plan.

- [ ] **Step 3: Run baseline e2e tests (smoke check)**

Run:
```bash
npx playwright install --with-deps chromium  # if first run on this machine
npm run test:chromium
```

Expected: all existing tests in `e2e/markdown-converter.spec.ts` pass. Captures the current behavior as the baseline.

- [ ] **Step 4: No commit yet — branch is empty intentionally**

### Task 0.2: Install new dependencies

**Files:** `package.json`, `package-lock.json`

- [ ] **Step 1: Install CodeMirror 6 packages**

```bash
cd /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf
npm install codemirror @codemirror/lang-markdown @codemirror/state @codemirror/view @codemirror/commands @codemirror/theme-one-dark @codemirror/language @codemirror/language-data
```

Expected: clean install, no `--force` or `--legacy-peer-deps` needed. If peer-dep warnings appear, read them carefully — abort if any conflict with React 19 / Next 16.

- [ ] **Step 2: Install sonner**

```bash
npm install sonner@^1.7.0
```

Expected: clean install. If a peer-dep warning about React 19 appears, abort and reconsider version pin.

- [ ] **Step 3: Install DOMPurify**

```bash
npm install dompurify @types/dompurify
```

Expected: clean install.

- [ ] **Step 4: Verify install**

Run:
```bash
npx tsc --noEmit
```

Expected: passes. (Just confirms types resolve.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add CodeMirror 6, sonner, and DOMPurify dependencies"
```

---

# Phase 1 — Editor experience

### Task 1.0: Add HTML sanitization to markdown parser

**Files:**
- Modify: `lib/markdown-parser.ts`

- [ ] **Step 1: Replace the file**

Open `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/markdown-parser.ts` and replace its contents with:

```ts
import { marked, type Token } from "marked"
import DOMPurify from "dompurify"

marked.use({
  gfm: true,
  breaks: true,
})

export interface ParsedMarkdown {
  html: string
  tokens: Token[]
}

function sanitize(html: string): string {
  if (typeof window === "undefined") return html
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  })
}

export function parseMarkdown(markdown: string): ParsedMarkdown {
  const tokens = marked.lexer(markdown)
  const html = sanitize(marked.parser(tokens))
  return { html, tokens }
}

export function markdownToHtml(markdown: string): string {
  return sanitize(marked.parse(markdown) as string)
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Run existing tests (no regression)**

```bash
npm run test:chromium
```

Expected: PASS — the existing "special characters in markdown" test should still pass; DOMPurify now actively strips `<script>` tags.

- [ ] **Step 4: Commit**

```bash
git add lib/markdown-parser.ts
git commit -m "feat: sanitize markdown HTML output with DOMPurify"
```

### Task 1.1: Create typed localStorage helper (`lib/storage.ts`)

**Files:**
- Create: `lib/storage.ts`

- [ ] **Step 1: Write the file**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/storage.ts`:

```ts
const STORAGE_VERSION = 1

interface Envelope<T> {
  v: number
  data: T
}

export function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Envelope<T>
    if (parsed.v !== STORAGE_VERSION) return null
    return parsed.data
  } catch {
    return null
  }
}

export function write<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false
  const envelope: Envelope<T> = { v: STORAGE_VERSION, data }
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}

export function remove(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* swallow */
  }
}

export const STORAGE_KEYS = {
  currentDoc: "mark-to-pdf:doc:current",
  recentDocs: "mark-to-pdf:doc:recent",
  exportSettings: "mark-to-pdf:export-settings",
} as const

export const ACCEPTED_EXTENSIONS = [".md", ".markdown", ".txt"] as const
export const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

export function isAcceptedFile(file: File): boolean {
  if (file.size > MAX_FILE_BYTES) return false
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export function basenameWithoutExt(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "")
  return base.replace(/\.[^.]+$/, "") || base
}

export function slugifyForFilename(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document"
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/storage.ts
git commit -m "feat: add typed versioned localStorage helper and file utilities"
```

### Task 1.2: Create `hooks/use-document.ts`

**Files:**
- Create: `hooks/use-document.ts`

- [ ] **Step 1: Write the hook**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/hooks/use-document.ts`:

```ts
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
  stateRef.current = { markdown, filename, isUserEditedFilename }

  const onRestoredRef = React.useRef(options.onRestored)
  onRestoredRef.current = options.onRestored

  const debounceRef = React.useRef<number | null>(null)
  const savedTimerRef = React.useRef<number | null>(null)

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
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-document.ts
git commit -m "feat: add useDocument hook with debounced autosave"
```

### Task 1.3: Create CodeMirror extensions (`lib/editor/markdown-extensions.ts`)

**Files:**
- Create: `lib/editor/markdown-extensions.ts`

- [ ] **Step 1: Write the file**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/editor/markdown-extensions.ts`:

```ts
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view"
import { Extension } from "@codemirror/state"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { oneDark } from "@codemirror/theme-one-dark"

const editorTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    height: "100%",
  },
  ".cm-content": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    padding: "12px 0",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
  },
  ".cm-line": {
    padding: "0 12px",
  },
})

export function buildExtensions(darkMode: boolean): Extension[] {
  return [
    lineNumbers(),
    history(),
    highlightActiveLine(),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap]),
    editorTheme,
    ...(darkMode ? [oneDark] : []),
  ]
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/editor/markdown-extensions.ts
git commit -m "feat: add CodeMirror Markdown extensions"
```

### Task 1.4: Create editor commands (`lib/editor/commands.ts`)

**Files:**
- Create: `lib/editor/commands.ts`

- [ ] **Step 1: Write the file**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/editor/commands.ts`:

```ts
import { EditorView } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"

type WrapMarker = "**" | "*" | "~~" | "`"

function wrapInline(view: EditorView, marker: WrapMarker): void {
  const { state } = view
  const changes = state.changeByRange((range) => {
    const text = state.sliceDoc(range.from, range.to)
    const replacement =
      text.length > 0 ? `${marker}${text}${marker}` : `${marker}${marker}`
    const cursor =
      text.length > 0 ? range.from + replacement.length : range.from + marker.length
    return {
      changes: { from: range.from, to: range.to, insert: replacement },
      range: EditorSelection.cursor(cursor),
    }
  })
  view.dispatch(changes)
  view.focus()
}

export function toggleBold(view: EditorView): void {
  wrapInline(view, "**")
}

export function toggleItalic(view: EditorView): void {
  wrapInline(view, "*")
}

export function toggleStrikethrough(view: EditorView): void {
  wrapInline(view, "~~")
}

export function toggleInlineCode(view: EditorView): void {
  wrapInline(view, "`")
}

function applyLinePrefix(view: EditorView, prefix: string): void {
  const { state } = view
  const changes = state.changeByRange((range) => {
    const startLine = state.doc.lineAt(range.from)
    const endLine = state.doc.lineAt(range.to)
    const lines: { from: number; to: number; insert: string }[] = []
    for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo++) {
      const line = state.doc.line(lineNo)
      const stripped = line.text.replace(/^(#{1,6}\s+|>\s+|[-*]\s+|\d+\.\s+)/, "")
      lines.push({ from: line.from, to: line.to, insert: prefix + stripped })
    }
    const newFrom = lines[0].from
    const newTo = lines[lines.length - 1].from + lines[lines.length - 1].insert.length
    return {
      changes: lines,
      range: EditorSelection.range(newFrom, newTo),
    }
  })
  view.dispatch(changes)
  view.focus()
}

export function setHeading(level: 1 | 2 | 3 | 4 | 5 | 6): (view: EditorView) => void {
  return (view) => applyLinePrefix(view, "#".repeat(level) + " ")
}

export function toggleBlockquote(view: EditorView): void {
  applyLinePrefix(view, "> ")
}

export function toggleUnorderedList(view: EditorView): void {
  applyLinePrefix(view, "- ")
}

export function toggleOrderedList(view: EditorView): void {
  applyLinePrefix(view, "1. ")
}

export function insertLink(view: EditorView): void {
  const { state } = view
  const range = state.selection.main
  const text = state.sliceDoc(range.from, range.to) || "link text"
  const replacement = `[${text}](https://)`
  const cursor = range.from + replacement.length - 1
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: replacement },
    selection: EditorSelection.cursor(cursor),
  })
  view.focus()
}

export function insertImage(view: EditorView): void {
  const { state } = view
  const range = state.selection.main
  const replacement = `![alt text](https://)`
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: replacement },
    selection: EditorSelection.cursor(range.from + replacement.length - 1),
  })
  view.focus()
}

export function insertCodeBlock(view: EditorView): void {
  const { state } = view
  const range = state.selection.main
  const selected = state.sliceDoc(range.from, range.to)
  const replacement = "```\n" + (selected || "code") + "\n```"
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: replacement },
    selection: EditorSelection.cursor(range.from + 4),
  })
  view.focus()
}

export function insertHorizontalRule(view: EditorView): void {
  const { state } = view
  const range = state.selection.main
  const line = state.doc.lineAt(range.from)
  const prefix = range.from === line.from ? "" : "\n\n"
  const replacement = `${prefix}---\n\n`
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: replacement },
    selection: EditorSelection.cursor(range.from + replacement.length),
  })
  view.focus()
}

export function insertText(view: EditorView, text: string): void {
  const { state } = view
  const range = state.selection.main
  view.dispatch({
    changes: { from: range.from, to: range.to, insert: text },
    selection: EditorSelection.cursor(range.from + text.length),
  })
  view.focus()
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/editor/commands.ts
git commit -m "feat: add editor toolbar command implementations"
```

### Task 1.5: Create keymap (`lib/editor/keymap.ts`)

**Files:**
- Create: `lib/editor/keymap.ts`

- [ ] **Step 1: Write the file**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/lib/editor/keymap.ts`:

```ts
import { keymap } from "@codemirror/view"
import { Extension } from "@codemirror/state"
import {
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleInlineCode,
  setHeading,
  toggleBlockquote,
  toggleUnorderedList,
  toggleOrderedList,
  insertLink,
  insertCodeBlock,
} from "./commands"

export const formattingKeymap: Extension = keymap.of([
  { key: "Mod-b", run: (v) => (toggleBold(v), true) },
  { key: "Mod-i", run: (v) => (toggleItalic(v), true) },
  { key: "Mod-Shift-s", run: (v) => (toggleStrikethrough(v), true) },
  { key: "Mod-e", run: (v) => (toggleInlineCode(v), true) },
  { key: "Mod-k", run: (v) => (insertLink(v), true) },
  { key: "Mod-Shift-k", run: (v) => (insertCodeBlock(v), true) },
  { key: "Alt-1", run: (v) => (setHeading(1)(v), true) },
  { key: "Alt-2", run: (v) => (setHeading(2)(v), true) },
  { key: "Alt-3", run: (v) => (setHeading(3)(v), true) },
  { key: "Alt-4", run: (v) => (setHeading(4)(v), true) },
  { key: "Alt-5", run: (v) => (setHeading(5)(v), true) },
  { key: "Alt-6", run: (v) => (setHeading(6)(v), true) },
  { key: "Mod-Shift-.", run: (v) => (toggleBlockquote(v), true) },
  { key: "Mod-Shift-u", run: (v) => (toggleUnorderedList(v), true) },
  { key: "Mod-Shift-o", run: (v) => (toggleOrderedList(v), true) },
])
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/editor/keymap.ts
git commit -m "feat: add editor formatting keymap"
```

### Task 1.6: Create `MarkdownEditor` React component

**Files:**
- Create: `components/editor/markdown-editor.tsx`

- [ ] **Step 1: Write the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/editor/markdown-editor.tsx`:

```tsx
"use client"

import * as React from "react"
import { EditorState, Compartment } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { buildExtensions } from "@/lib/editor/markdown-extensions"
import { formattingKeymap } from "@/lib/editor/keymap"

export interface EditorHandle {
  getView(): EditorView | null
  focus(): void
}

interface Props {
  value: string
  onChange: (value: string) => void
  onPaste?: (event: ClipboardEvent) => boolean
  darkMode?: boolean
  className?: string
}

export const MarkdownEditor = React.forwardRef<EditorHandle, Props>(function MarkdownEditor(
  { value, onChange, onPaste, darkMode = false, className },
  ref,
) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const viewRef = React.useRef<EditorView | null>(null)
  const onChangeRef = React.useRef(onChange)
  onChangeRef.current = onChange
  const onPasteRef = React.useRef(onPaste)
  onPasteRef.current = onPaste
  const themeCompartment = React.useRef(new Compartment())

  React.useImperativeHandle(
    ref,
    () => ({
      getView: () => viewRef.current,
      focus: () => viewRef.current?.focus(),
    }),
    [],
  )

  React.useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        ...buildExtensions(darkMode),
        formattingKeymap,
        themeCompartment.current.of([]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        EditorView.domEventHandlers({
          paste: (event) => {
            const handler = onPasteRef.current
            if (!handler) return false
            return handler(event)
          },
        }),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // CodeMirror manages its own state imperatively; deps intentionally empty.
    // External value sync is handled by the second effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current === value) return
    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    })
  }, [value])

  return <div ref={containerRef} className={className} data-testid="markdown-editor" />
})
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes. The single targeted `eslint-disable-next-line` for the CM6-managed-state pattern is acceptable because the rule's intent (catch missing deps) doesn't apply here. If the user's project policy forbids any inline disable, the alternative is to add a project-level lint exception for this file path — never broaden globally.

- [ ] **Step 3: Commit**

```bash
git add components/editor/markdown-editor.tsx
git commit -m "feat: add CodeMirror Markdown editor component"
```

### Task 1.7: Create `EditorStatusbar` component

**Files:**
- Create: `components/editor/editor-statusbar.tsx`

- [ ] **Step 1: Write the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/editor/editor-statusbar.tsx`:

```tsx
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
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/editor/editor-statusbar.tsx
git commit -m "feat: add editor statusbar with word/char counts and save state"
```

### Task 1.8: Create `EditorToolbar` component

**Files:**
- Create: `components/editor/editor-toolbar.tsx`

- [ ] **Step 1: Write the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/editor/editor-toolbar.tsx`:

```tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Code2,
  Minus,
} from "lucide-react"
import type { EditorHandle } from "./markdown-editor"
import type { EditorView } from "@codemirror/view"
import {
  toggleBold,
  toggleItalic,
  toggleStrikethrough,
  toggleInlineCode,
  setHeading,
  toggleBlockquote,
  toggleUnorderedList,
  toggleOrderedList,
  insertLink,
  insertImage,
  insertCodeBlock,
  insertHorizontalRule,
} from "@/lib/editor/commands"

interface Props {
  editorRef: React.RefObject<EditorHandle | null>
  className?: string
  leftEndSlot?: React.ReactNode
  rightSlot?: React.ReactNode
}

interface ToolbarItem {
  testId: string
  label: string
  icon: React.ReactNode
  action: (view: EditorView) => void
}

const items: ToolbarItem[] = [
  { testId: "tb-bold", label: "Bold (Cmd+B)", icon: <Bold className="size-4" />, action: toggleBold },
  { testId: "tb-italic", label: "Italic (Cmd+I)", icon: <Italic className="size-4" />, action: toggleItalic },
  { testId: "tb-strike", label: "Strikethrough (Cmd+Shift+S)", icon: <Strikethrough className="size-4" />, action: toggleStrikethrough },
  { testId: "tb-h1", label: "Heading 1 (Alt+1)", icon: <Heading1 className="size-4" />, action: setHeading(1) },
  { testId: "tb-h2", label: "Heading 2 (Alt+2)", icon: <Heading2 className="size-4" />, action: setHeading(2) },
  { testId: "tb-h3", label: "Heading 3 (Alt+3)", icon: <Heading3 className="size-4" />, action: setHeading(3) },
  { testId: "tb-link", label: "Link (Cmd+K)", icon: <LinkIcon className="size-4" />, action: insertLink },
  { testId: "tb-image", label: "Image", icon: <ImageIcon className="size-4" />, action: insertImage },
  { testId: "tb-ul", label: "Bulleted list (Cmd+Shift+U)", icon: <List className="size-4" />, action: toggleUnorderedList },
  { testId: "tb-ol", label: "Numbered list (Cmd+Shift+O)", icon: <ListOrdered className="size-4" />, action: toggleOrderedList },
  { testId: "tb-quote", label: "Blockquote (Cmd+Shift+.)", icon: <Quote className="size-4" />, action: toggleBlockquote },
  { testId: "tb-code", label: "Inline code (Cmd+E)", icon: <Code className="size-4" />, action: toggleInlineCode },
  { testId: "tb-codeblock", label: "Code block (Cmd+Shift+K)", icon: <Code2 className="size-4" />, action: insertCodeBlock },
  { testId: "tb-hr", label: "Horizontal rule", icon: <Minus className="size-4" />, action: insertHorizontalRule },
]

export function EditorToolbar({ editorRef, className, leftEndSlot, rightSlot }: Props) {
  return (
    <div
      data-testid="editor-toolbar"
      className={cn(
        "flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5",
        className,
      )}
    >
      {items.map((item, idx) => (
        <React.Fragment key={item.testId}>
          {(idx === 3 || idx === 6 || idx === 11) && (
            <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            aria-label={item.label}
            title={item.label}
            data-testid={item.testId}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const view = editorRef.current?.getView()
              if (view) item.action(view)
            }}
          >
            {item.icon}
          </Button>
        </React.Fragment>
      ))}
      {leftEndSlot ? (
        <>
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
          <div className="flex items-center gap-1">{leftEndSlot}</div>
        </>
      ) : null}
      <div className="ml-auto flex items-center gap-1">{rightSlot}</div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/editor/editor-toolbar.tsx
git commit -m "feat: add editor toolbar with formatting buttons"
```

### Task 1.9: Create `MarkdownPreview` component (extract from converter)

**Files:**
- Create: `components/preview/markdown-preview.tsx`

- [ ] **Step 1: Write the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/preview/markdown-preview.tsx`:

```tsx
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
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

> **Security note:** the HTML passed in is the output of `markdownToHtml()` from `lib/markdown-parser.ts`, which routes through DOMPurify. The `eslint-disable` is targeted; it's not a global suppression. If the project's lint config blocks `react/no-danger` entirely, add a per-file exception in `.eslintrc` rather than disabling here.

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add components/preview/markdown-preview.tsx
git commit -m "refactor: extract MarkdownPreview into its own component"
```

### Task 1.10: Replace Textarea with CodeMirror in `MarkdownConverter`

**Files:**
- Modify: `components/markdown-converter.tsx`

- [ ] **Step 1: Write failing test for editor presence**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/editor-toolbar.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('CodeMirror editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('CodeMirror editor is present (no textarea)', async ({ page }) => {
    await expect(page.locator('[data-testid="markdown-editor"]')).toBeVisible()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-editor')).toBeVisible()
    await expect(page.locator('textarea')).toHaveCount(0)
  })

  test('toolbar is visible with bold button', async ({ page }) => {
    await expect(page.locator('[data-testid="editor-toolbar"]')).toBeVisible()
    await expect(page.locator('[data-testid="tb-bold"]')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test, verify it fails**

```bash
cd /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf
npx playwright test e2e/editor-toolbar.spec.ts --project=chromium
```

Expected: FAIL — textarea still exists, no `data-testid="markdown-editor"`.

- [ ] **Step 3: Rewrite `components/markdown-converter.tsx`**

Replace the entire contents with:

```tsx
"use client"

import * as React from "react"
import { FileText, Download, Eye, Code, FileIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { markdownToHtml } from "@/lib/markdown-parser"
import { exportHtmlToPdf } from "@/lib/export-pdf"
import { exportToDocx } from "@/lib/export-docx"
import { MarkdownEditor, type EditorHandle } from "@/components/editor/markdown-editor"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { EditorStatusbar } from "@/components/editor/editor-statusbar"
import { MarkdownPreview } from "@/components/preview/markdown-preview"
import { useDocument } from "@/hooks/use-document"

type ExportFormat = "pdf" | "docx"
type ViewMode = "split" | "edit" | "preview"

export function MarkdownConverter() {
  const {
    markdown,
    setMarkdown,
    filename,
    setFilename,
    saveState,
  } = useDocument()

  const [format, setFormat] = React.useState<ExportFormat>("pdf")
  const [viewMode, setViewMode] = React.useState<ViewMode>("split")
  const [isExporting, setIsExporting] = React.useState(false)
  const [exportStatus, setExportStatus] = React.useState<"idle" | "success" | "error">("idle")
  const editorRef = React.useRef<EditorHandle>(null)
  const previewRef = React.useRef<HTMLDivElement>(null)

  const html = React.useMemo(() => markdownToHtml(markdown), [markdown])

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === "split") {
        setViewMode("edit")
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [viewMode])

  const handleExport = async () => {
    if (!markdown.trim()) return
    setIsExporting(true)
    setExportStatus("idle")
    try {
      const exportFilename = filename.trim() || "document"
      if (format === "pdf") {
        await exportHtmlToPdf(html, `${exportFilename}.pdf`)
      } else {
        await exportToDocx(markdown, `${exportFilename}.docx`)
      }
      setExportStatus("success")
      setTimeout(() => setExportStatus("idle"), 3000)
    } catch (error) {
      console.error("Export failed:", error)
      setExportStatus("error")
      setTimeout(() => setExportStatus("idle"), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-7xl mx-auto">
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("edit")}
              >
                <Code data-icon="inline-start" className="size-4" />
                Edit
              </Button>
              <Button
                variant={viewMode === "split" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("split")}
                className="hidden md:inline-flex"
              >
                Split
              </Button>
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye data-icon="inline-start" className="size-4" />
                Preview
              </Button>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <label htmlFor="filename" className="text-sm text-muted-foreground whitespace-nowrap">
                Filename:
              </label>
              <input
                id="filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value, "user")}
                placeholder="document"
                className="h-8 w-32 lg:w-40 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger className="w-28 lg:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-red-500" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="docx">
                  <div className="flex items-center gap-2">
                    <FileIcon className="size-4 text-blue-500" />
                    DOCX
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleExport}
              disabled={isExporting || !markdown.trim()}
              className={cn(
                exportStatus === "success" && "bg-green-600 hover:bg-green-700",
                exportStatus === "error" && "bg-red-600 hover:bg-red-700",
              )}
            >
              {isExporting ? (
                <>
                  <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
                  Exporting...
                </>
              ) : exportStatus === "success" ? (
                "Downloaded!"
              ) : exportStatus === "error" ? (
                "Failed - Try Again"
              ) : (
                <>
                  <Download data-icon="inline-start" className="size-4" />
                  Export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div
        className={cn(
          "grid gap-4 md:gap-6",
          viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
        )}
      >
        {viewMode !== "preview" && (
          <Card className="flex flex-col min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Code className="size-4 md:size-5" />
                Markdown Editor
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Write or paste your Markdown content
              </CardDescription>
            </CardHeader>
            <EditorToolbar editorRef={editorRef} />
            <div className="flex-1 overflow-hidden">
              <MarkdownEditor
                ref={editorRef}
                value={markdown}
                onChange={setMarkdown}
                className="h-full"
              />
            </div>
            <EditorStatusbar markdown={markdown} saveState={saveState} />
          </Card>
        )}

        {viewMode !== "edit" && (
          <Card className="flex flex-col min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Eye className="size-4 md:size-5" />
                Preview
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                See how your document will look
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pb-4">
              <MarkdownPreview html={html} innerRef={previewRef} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the new editor toolbar test**

```bash
npx playwright test e2e/editor-toolbar.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 5: Update existing converter tests for new editor**

Open `e2e/markdown-converter.spec.ts`. Apply these replacements:

- Replace every `page.locator('textarea')` with `page.locator('[data-testid="markdown-editor"] .cm-content')`.
- Replace each `await editor.clear()` followed by `await editor.fill(X)` with:
  ```ts
  await page.locator('[data-testid="markdown-editor"] .cm-content').click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.keyboard.press('Delete')
  await page.keyboard.type(X)
  ```
- Remove every block guarded by `if (isMobile) { await page.locator('button:has(svg.lucide-menu)').click() }` — the mobile menu is gone; controls are always visible.
- Delete the entire `test.describe('View Mode Toggle (Mobile)')` block.
- Delete the entire `test.describe('Responsive Design')` block.

- [ ] **Step 6: Run the updated existing tests**

```bash
npx playwright test e2e/markdown-converter.spec.ts --project=chromium
```

Expected: PASS. Fix any selector regressions encountered.

- [ ] **Step 7: Run typecheck and lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 8: Commit**

```bash
git add components/markdown-converter.tsx e2e/editor-toolbar.spec.ts e2e/markdown-converter.spec.ts
git commit -m "feat: replace Textarea with CodeMirror editor + toolbar + statusbar"
```

### Task 1.11: Add autosave e2e test

**Files:**
- Create: `e2e/autosave.spec.ts`

- [ ] **Step 1: Write the test**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/autosave.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Autosave', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('persists document to localStorage and restores on reload', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')

    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# My persistent doc')

    await expect(page.locator('[data-testid="save-state"]')).toHaveText('Saved', { timeout: 2000 })

    await page.reload()

    await expect(editor).toContainText('My persistent doc')
  })

  test('shows "Saving…" then "Saved" status indicator', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')

    await editor.click()
    await page.keyboard.type(' extra')

    await expect(page.locator('[data-testid="save-state"]')).toHaveText('Saving…')
    await expect(page.locator('[data-testid="save-state"]')).toHaveText('Saved', { timeout: 2000 })
  })

  test('shows word count and character count', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('one two three')

    await expect(page.locator('[data-testid="word-count"]')).toContainText('Words: 3')
    await expect(page.locator('[data-testid="char-count"]')).toContainText('Chars: 13')
  })
})
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/autosave.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/autosave.spec.ts
git commit -m "test: cover document autosave and status indicators"
```

### Task 1.12: Add editor shortcuts e2e test

**Files:**
- Create: `e2e/editor-shortcuts.spec.ts`

- [ ] **Step 1: Write the test**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/editor-shortcuts.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Editor keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
  })

  test('Cmd/Ctrl+B wraps selection in **', async ({ page }) => {
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('ControlOrMeta+B')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('**hello**')
  })

  test('Cmd/Ctrl+I wraps selection in *', async ({ page }) => {
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('ControlOrMeta+I')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('*hello*')
  })

  test('Alt+1 prefixes line with # ', async ({ page }) => {
    await page.keyboard.type('My heading')
    await page.keyboard.press('Alt+1')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('# My heading')
  })

  test('Cmd/Ctrl+Shift+. prefixes line with > ', async ({ page }) => {
    await page.keyboard.type('My quote')
    await page.keyboard.press('ControlOrMeta+Shift+Period')
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('> My quote')
  })
})

test.describe('Editor toolbar buttons', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
  })

  test('bold button wraps selection in **', async ({ page }) => {
    await page.keyboard.type('hello')
    await page.keyboard.press('ControlOrMeta+A')
    await page.locator('[data-testid="tb-bold"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('**hello**')
  })

  test('H2 button prefixes line with ## ', async ({ page }) => {
    await page.keyboard.type('My H2')
    await page.locator('[data-testid="tb-h2"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('## My H2')
  })

  test('unordered list button prefixes with - ', async ({ page }) => {
    await page.keyboard.type('item one')
    await page.locator('[data-testid="tb-ul"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('- item one')
  })
})
```

- [ ] **Step 2: Run the test**

```bash
npx playwright test e2e/editor-shortcuts.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add e2e/editor-shortcuts.spec.ts
git commit -m "test: cover editor toolbar buttons and keyboard shortcuts"
```

### Task 1.13: Phase 1 verification

- [ ] **Step 1: Run full lint + typecheck + build**

```bash
cd /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all three succeed.

- [ ] **Step 2: Run full e2e suite on chromium**

```bash
npm run test:chromium
```

Expected: all tests pass.

- [ ] **Step 3: No commit; this is a checkpoint**

---

# Phase 2 — File handling

### Task 2.1: Create `useRecentDocs` hook

**Files:**
- Create: `hooks/use-recent-docs.ts`

- [ ] **Step 1: Write the hook**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/hooks/use-recent-docs.ts`:

```ts
"use client"

import * as React from "react"
import { read, write, STORAGE_KEYS } from "@/lib/storage"

export interface RecentDoc {
  id: string
  title: string
  preview: string
  updatedAt: number
  markdown: string
}

const MAX_RECENT = 5
const MAX_BYTES_PER_RECENT = 1_000_000

function hashString(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

function deriveTitle(markdown: string): string {
  const h1 = markdown.match(/^\s*#\s+(.+)$/m)
  if (h1) return h1[1].trim().slice(0, 80)
  const first = markdown.trim().split("\n")[0] || "Untitled"
  return first.slice(0, 40)
}

export function useRecentDocs() {
  const [recent, setRecent] = React.useState<RecentDoc[]>([])

  React.useEffect(() => {
    const stored = read<RecentDoc[]>(STORAGE_KEYS.recentDocs)
    if (stored) setRecent(stored)
  }, [])

  const push = React.useCallback((markdown: string) => {
    if (!markdown.trim()) return
    if (new Blob([markdown]).size > MAX_BYTES_PER_RECENT) return
    const id = hashString(markdown)
    const entry: RecentDoc = {
      id,
      title: deriveTitle(markdown),
      preview: markdown.trim().slice(0, 120),
      updatedAt: Date.now(),
      markdown,
    }
    setRecent((prev) => {
      const filtered = prev.filter((d) => d.id !== id)
      const next = [entry, ...filtered].slice(0, MAX_RECENT)
      write<RecentDoc[]>(STORAGE_KEYS.recentDocs, next)
      return next
    })
  }, [])

  const remove = React.useCallback((id: string) => {
    setRecent((prev) => {
      const next = prev.filter((d) => d.id !== id)
      write<RecentDoc[]>(STORAGE_KEYS.recentDocs, next)
      return next
    })
  }, [])

  const clear = React.useCallback(() => {
    setRecent([])
    write<RecentDoc[]>(STORAGE_KEYS.recentDocs, [])
  }, [])

  return { recent, push, remove, clear }
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add hooks/use-recent-docs.ts
git commit -m "feat: add useRecentDocs hook"
```

### Task 2.2: Create `FileDropOverlay` component

**Files:**
- Create: `components/editor/file-drop-overlay.tsx`

- [ ] **Step 1: Write the component**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/components/editor/file-drop-overlay.tsx`:

```tsx
"use client"

import * as React from "react"
import { FileUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  active: boolean
}

export function FileDropOverlay({ active }: Props) {
  if (!active) return null
  return (
    <div
      data-testid="file-drop-overlay"
      className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-center justify-center",
        "rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm",
      )}
    >
      <div className="flex flex-col items-center gap-2 text-primary">
        <FileUp className="size-8" />
        <span className="font-medium">Drop .md, .markdown, or .txt file</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck + lint and commit**

```bash
npx tsc --noEmit && npm run lint
git add components/editor/file-drop-overlay.tsx
git commit -m "feat: add file drop overlay component"
```

### Task 2.3: Wire drop, upload, image paste, filename inference, recent docs

**Files:**
- Modify: `components/markdown-converter.tsx`

This task adds file handling to the converter. Follow the substeps in order.

- [ ] **Step 1: Write failing e2e test**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/file-handling.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('File handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('upload .md file loads contents into editor (after confirm)', async ({ page }) => {
    await page.locator('[data-testid="tb-upload"]').click()
    const fileInput = page.locator('input[type="file"][data-testid="hidden-file-input"]')
    await fileInput.setInputFiles({
      name: 'sample.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Uploaded heading\n\nUploaded body.'),
    })
    await page.locator('[data-testid="confirm-load-file"]').click()
    await expect(page.locator('[data-testid="markdown-editor"] .cm-content')).toContainText('Uploaded heading')
  })

  test('filename updates from H1 when not user-edited', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# My Lovely Document\n\nBody.')
    await expect(page.locator('#filename')).toHaveValue('my-lovely-document')
  })

  test('filename does NOT update from H1 after user edits filename', async ({ page }) => {
    const filenameInput = page.locator('#filename')
    await filenameInput.fill('user-chosen')

    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# Different heading')

    await expect(filenameInput).toHaveValue('user-chosen')
  })
})
```

- [ ] **Step 2: Run test, confirm failure**

```bash
npx playwright test e2e/file-handling.spec.ts --project=chromium
```

Expected: FAIL.

- [ ] **Step 3: Update converter — imports**

Add to `components/markdown-converter.tsx`:

```tsx
import { Upload, History, Trash2, FileText as FileTextIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileDropOverlay } from "@/components/editor/file-drop-overlay"
import { useRecentDocs, type RecentDoc } from "@/hooks/use-recent-docs"
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_BYTES,
  basenameWithoutExt,
  isAcceptedFile,
  slugifyForFilename,
} from "@/lib/storage"
```

- [ ] **Step 4: Update converter — hook usage**

Replace the existing `useDocument()` destructure with:

```tsx
  const {
    markdown,
    setMarkdown,
    filename,
    setFilename,
    isUserEditedFilename,
    resetUserEditedFilename,
    saveState,
  } = useDocument()
```

Add new state/refs after the existing hook calls:

```tsx
  const { recent, push: pushRecent, remove: removeRecent, clear: clearRecent } = useRecentDocs()
  const [dropActive, setDropActive] = React.useState(false)
  const [pendingFile, setPendingFile] = React.useState<{ name: string; text: string } | null>(null)
  const [pendingRecent, setPendingRecent] = React.useState<RecentDoc | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
```

- [ ] **Step 5: Update converter — handlers**

Add these helpers inside the component, after the hook block:

```tsx
  const inferredFilename = React.useMemo(() => {
    const h1 = markdown.match(/^\s*#\s+(.+)$/m)
    if (!h1) return null
    return slugifyForFilename(h1[1])
  }, [markdown])

  React.useEffect(() => {
    if (isUserEditedFilename) return
    if (!inferredFilename) return
    if (inferredFilename !== filename) {
      setFilename(inferredFilename, "system")
    }
  }, [inferredFilename, isUserEditedFilename, filename, setFilename])

  const loadDocument = React.useCallback(
    (incoming: { markdown: string; filename: string | null }) => {
      if (markdown.trim()) {
        pushRecent(markdown)
      }
      setMarkdown(incoming.markdown)
      if (incoming.filename) {
        setFilename(incoming.filename, "system")
        resetUserEditedFilename()
      }
    },
    [markdown, pushRecent, setMarkdown, setFilename, resetUserEditedFilename],
  )

  const handleFileSelected = React.useCallback(async (file: File) => {
    if (!isAcceptedFile(file)) {
      if (file.size > MAX_FILE_BYTES) {
        window.alert(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 5 MB.`)
      } else {
        window.alert(`Only ${ACCEPTED_EXTENSIONS.join(", ")} files are supported.`)
      }
      return
    }
    const text = await file.text()
    setPendingFile({ name: basenameWithoutExt(file.name), text })
  }, [])

  const confirmPendingFile = () => {
    if (!pendingFile) return
    loadDocument({ markdown: pendingFile.text, filename: pendingFile.name })
    setPendingFile(null)
  }
  const cancelPendingFile = () => setPendingFile(null)

  const confirmPendingRecent = () => {
    if (!pendingRecent) return
    loadDocument({ markdown: pendingRecent.markdown, filename: null })
    setPendingRecent(null)
  }
  const cancelPendingRecent = () => setPendingRecent(null)

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void handleFileSelected(file)
    e.target.value = ""
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault()
      setDropActive(true)
    }
  }
  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget === e.target) setDropActive(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFileSelected(file)
  }

  const handleEditorPaste = React.useCallback((event: ClipboardEvent): boolean => {
    const items = Array.from(event.clipboardData?.items ?? [])
    const image = items.find((i) => i.type.startsWith("image/"))
    if (!image) return false
    const hasText = items.some((i) => i.kind === "string" && i.type === "text/plain")
    if (hasText) return false

    const file = image.getAsFile()
    if (!file) return false
    if (file.size > 1_000_000) {
      event.preventDefault()
      window.alert(`Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 1 MB.`)
      return true
    }

    event.preventDefault()
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || "")
      if (!dataUrl) return
      const view = editorRef.current?.getView()
      if (view) {
        const pos = view.state.doc.length
        view.dispatch({
          changes: { from: pos, to: pos, insert: `\n![](${dataUrl})\n` },
        })
      }
    }
    reader.readAsDataURL(file)
    return true
  }, [])
```

- [ ] **Step 6: Update converter — editor card JSX**

Find the existing `<Card>` that wraps the editor (the one with `min-h-[400px]`) and replace its opening tag with:

```tsx
          <Card
            className="relative flex flex-col min-h-[400px] md:min-h-[500px] lg:min-h-[600px] overflow-hidden"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              data-testid="hidden-file-input"
              className="sr-only"
              onChange={handleFileInputChange}
            />
            <FileDropOverlay active={dropActive} />
```

Replace `<EditorToolbar editorRef={editorRef} />` with the toolbar plus left-end slot (upload + recents):

```tsx
            <EditorToolbar
              editorRef={editorRef}
              leftEndSlot={
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0"
                    aria-label="Upload file"
                    title="Upload .md / .markdown / .txt"
                    data-testid="tb-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        aria-label="Recent documents"
                        title="Recent documents"
                        data-testid="tb-recents"
                      >
                        <History className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72">
                      <DropdownMenuLabel>Recent documents</DropdownMenuLabel>
                      {recent.length === 0 && (
                        <DropdownMenuItem disabled>None yet</DropdownMenuItem>
                      )}
                      {recent.map((doc) => (
                        <DropdownMenuItem
                          key={doc.id}
                          data-testid={`recent-${doc.id}`}
                          className="flex items-start gap-2"
                          onSelect={(e) => {
                            e.preventDefault()
                            if (doc.markdown === markdown) return
                            setPendingRecent(doc)
                          }}
                        >
                          <FileTextIcon className="mt-0.5 size-4 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{doc.title}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {doc.preview}
                            </div>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove from recents"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeRecent(doc.id)
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </DropdownMenuItem>
                      ))}
                      {recent.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            data-testid="clear-recents"
                            onSelect={() => clearRecent()}
                          >
                            Clear all
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              }
            />
```

Update the `<MarkdownEditor>` element to add `onPaste`:

```tsx
              <MarkdownEditor
                ref={editorRef}
                value={markdown}
                onChange={setMarkdown}
                onPaste={handleEditorPaste}
                className="h-full"
              />
```

Append the two AlertDialogs at the bottom of the return (just before the outer closing `</div>`):

```tsx
      <AlertDialog open={pendingFile !== null} onOpenChange={(v) => { if (!v) cancelPendingFile() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current document?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current document will be moved to Recent. Load &quot;{pendingFile?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPendingFile}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingFile} data-testid="confirm-load-file">
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingRecent !== null} onOpenChange={(v) => { if (!v) cancelPendingRecent() }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Load recent document?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current document will be moved to Recent. Load &quot;{pendingRecent?.title}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPendingRecent}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPendingRecent} data-testid="confirm-load-recent">
              Load
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
```

- [ ] **Step 7: Run tests**

```bash
npx playwright test e2e/file-handling.spec.ts --project=chromium
npx tsc --noEmit && npm run lint
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add components/markdown-converter.tsx e2e/file-handling.spec.ts
git commit -m "feat: file drop, upload, recent docs, filename inference, image paste"
```

### Task 2.4: Add recent docs e2e test

**Files:**
- Create: `e2e/recent-docs.spec.ts`

- [ ] **Step 1: Write and run test**

Create `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/e2e/recent-docs.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Recent documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.localStorage.clear())
    await page.reload()
  })

  test('loading a file pushes the current doc to recents', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# First document')

    await page.locator('[data-testid="tb-upload"]').click()
    const fileInput = page.locator('input[type="file"][data-testid="hidden-file-input"]')
    await fileInput.setInputFiles({
      name: 'second.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Second document'),
    })
    await page.locator('[data-testid="confirm-load-file"]').click()

    await page.locator('[data-testid="tb-recents"]').click()
    await expect(page.locator('text=First document')).toBeVisible()
  })

  test('clear all empties recents', async ({ page }) => {
    const editor = page.locator('[data-testid="markdown-editor"] .cm-content')
    await editor.click()
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.type('# Doc A')

    await page.locator('[data-testid="tb-upload"]').click()
    await page.locator('input[type="file"][data-testid="hidden-file-input"]').setInputFiles({
      name: 'b.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from('# Doc B'),
    })
    await page.locator('[data-testid="confirm-load-file"]').click()

    await page.locator('[data-testid="tb-recents"]').click()
    await expect(page.locator('text=Doc A')).toBeVisible()

    await page.locator('[data-testid="clear-recents"]').click()
    await page.locator('[data-testid="tb-recents"]').click()
    await expect(page.locator('text=None yet')).toBeVisible()
  })
})
```

```bash
npx playwright test e2e/recent-docs.spec.ts --project=chromium
git add e2e/recent-docs.spec.ts
git commit -m "test: cover recent documents push and clear"
```

### Task 2.5: Phase 2 verification

- [ ] **Step 1: Full lint + typecheck + build + e2e**

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:chromium
```

Expected: all succeed.

---

## See `2026-05-13-converter-ux-overhaul-phase-3.md` and `-phase-4.md` for the remaining phases.

The continuation files use the same conventions and TDD discipline. They cover:

**Phase 3 — Export customization**
- Move `lib/export-*.ts` → `lib/export/`
- Create `lib/export/themes.ts` (theme data + ExportSettings types + DEFAULT_SETTINGS)
- Create `hooks/use-export-settings.ts` (settings persistence)
- Create `lib/export/toc.ts` (heading extraction)
- Refactor `lib/export/export-pdf.ts` to accept ExportSettings + render TOC/cover/page numbers (use `DOMParser` to build the DOM tree from the HTML string — replaces the old `.innerHTML` assignment as part of the security hardening)
- Refactor `lib/export/export-docx.ts` to accept ExportSettings (page size, margins, TOC, page numbers via Header/Footer, cover via TitlePage)
- Append `.prose-github`/`.prose-academic`/`.prose-minimal` CSS to `globals.css`
- Create `components/export/export-settings-dialog.tsx` and wire it via a gear icon on the toolbar's `rightSlot`

**Phase 4 — Polish**
- Mount `<Toaster richColors closeButton position="bottom-right" />` in `app/layout.tsx`
- Replace inline export status state with toast notifications (success + error w/ Retry action)
- Replace remaining `window.alert` calls (file-too-large, unsupported-type, image-too-large) with `toast.error()`
- Wire `onRestored` callback from `useDocument` to a `toast.info("Restored your last document …")`
- Update the two existing tests that checked for inline button text changes to instead check for the toast text
- Full verification: `lint`, `tsc`, `build`, `test:chromium`, `test:mobile`, multi-browser smoke

> **Implementation note for the Phase 3 PDF refactor:** the existing helper `exportHtmlToPdf(html, filename)` constructs a detached DOM from the HTML string. **Switch from the imperative `.innerHTML` assignment to `new DOMParser().parseFromString(html, "text/html").body`** — same result, but documented as the modern safe path. The walker code that visits the resulting nodes is unchanged.

> **Phases 3 & 4 will be written into separate files in the same `docs/superpowers/plans/` directory at the start of Phase 3 implementation.** This split is purely to keep individual files manageable; nothing about the design changes.

---

## Risks summary (carried from spec)

- **CodeMirror SSR** — handled via `'use client'` directive on the editor component. If module-init issues appear in dev, wrap usage in `next/dynamic(... { ssr: false })`.
- **StrictMode double-mount** — handled by `view.destroy()` in `useEffect` cleanup (Task 1.6).
- **localStorage quota** — recents push silently skips oversized docs; current doc write always wins.
- **Tab-close inside debounce** — `beforeunload` flush in `useDocument` (Task 1.2).
- **TOC two-pass determinism** — throwaway jsPDF instance used for measure pass (Phase 3).
- **Theme drift between preview and PDF** — documented in dialog copy; manual smoke verifies.
- **Sonner peer-dep** — pin `^1.7.0`, fail loudly if install warns (Task 0.2).
- **HTML preview XSS** — closed by routing rendered HTML through DOMPurify (Task 1.0).

## Out of scope (deferred)

Per spec: cloud sync, WYSIWYG editing, server image upload, new export formats (HTML/EPUB/RTF), custom user themes, real-time collaboration, mobile redesign beyond responsive grid.
