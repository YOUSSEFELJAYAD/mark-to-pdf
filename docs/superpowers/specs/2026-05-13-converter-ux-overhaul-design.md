# Converter UX Overhaul — Design

**Date:** 2026-05-13
**Status:** Approved, pending implementation plan
**Scope:** `app/page.tsx`, `components/markdown-converter.tsx`, `lib/export-pdf.ts`, `lib/export-docx.ts`, `lib/markdown-parser.ts`

## Goal

Lift the Markdown → PDF/DOCX converter from a working-but-bare textarea + preview into a polished editor that:

- Edits Markdown like a real editor (syntax highlighting, shortcuts, toolbar)
- Loads files (drag-and-drop, upload, paste) and never loses work on refresh
- Lets users tune export output (page size, margins, theme, font, TOC, page numbers)
- Communicates clearly (toasts, counts, save state, error reasons)

## Non-goals

- WYSIWYG editing (users write raw Markdown)
- Multi-user / cloud sync (everything is client-side, localStorage only)
- Image upload to a backend (images are pasted as base64; size-capped)
- New export formats beyond PDF/DOCX
- Rewriting the AdSense/SEO surface (out of scope)

## Architecture

### File layout

```
components/
  markdown-converter.tsx          slim orchestrator
  editor/
    markdown-editor.tsx           CodeMirror 6 wrapper, forwardRef for commands
    editor-toolbar.tsx            format buttons, upload, recent-docs menu, settings
    editor-statusbar.tsx          word/char count, reading time, save state, cursor
  export/
    export-controls.tsx           filename input, format select, export button
    export-settings-dialog.tsx    page size, margins, theme, font, TOC, page #, cover
  preview/
    markdown-preview.tsx          existing prose preview, accepts theme prop
hooks/
  use-document.ts                 markdown + filename state, autosave, restore
  use-recent-docs.ts              read/write last 5 docs in localStorage
  use-export-settings.ts          settings state, persist to localStorage
lib/
  storage.ts                      typed, versioned localStorage helpers
  editor/
    commands.ts                   toolbar actions (wrapText, toggleHeading, …)
    markdown-extensions.ts        CodeMirror config: lang, theme, keymap
  export/
    export-pdf.ts                 refactored, accepts ExportSettings
    export-docx.ts                refactored, accepts ExportSettings
    themes.ts                     GitHub / Academic / Minimal style maps
    toc.ts                        TOC generation from marked tokens
```

### Data flow

```
[CodeMirror state]
      │ debounced 500ms
      ▼
[useDocument] ──► localStorage["mark-to-pdf:doc:current"]
      │
      ▼
[markdownToHtml(markdown)]  ◄── memoized
      │
      ├──► [MarkdownPreview]
      │
      └──► on export click ──► exportHtmlToPdf(html, settings)  or  exportToDocx(markdown, settings)
                                          │
                                          ▼
                              [browser file download]
```

### Component contracts

- `MarkdownEditor` — props: `value: string`, `onChange(v): void`, `theme: 'light' | 'dark'`. Exposes `ref` with `applyCommand(cmd: EditorCommand)`. Internally owns the CodeMirror `EditorView`.
- `EditorToolbar` — props: `editorRef`, `onUpload(file): void`, `onLoadRecent(doc): void`, `onOpenSettings(): void`. Stateless beyond its menus.
- `MarkdownPreview` — props: `html: string`, `theme: ThemeId`. Renders with `prose` plus theme class. No state.
- `ExportControls` — props: `filename`, `onFilenameChange`, `format`, `onFormatChange`, `onExport`, `isExporting`. Pure.
- `ExportSettingsDialog` — uncontrolled dialog driven by `useExportSettings` hook.

### Hooks

- `useDocument()` returns `{ markdown, setMarkdown, filename, setFilename, saveState }`. Reads on mount, debounces writes 500ms, exposes `saveState: 'idle' | 'saving' | 'saved'`.
- `useRecentDocs()` returns `{ recent: RecentDoc[], push(doc), remove(id), clear() }`. Capped at 5, dedupes by content hash.
- `useExportSettings()` returns `{ settings, update(partial), reset() }`. Persists on every change.

### Types (canonical)

```ts
type ExportFormat = 'pdf' | 'docx'

type PageSize = 'A4' | 'Letter' | 'Legal'
type Margin = 'narrow' | 'normal' | 'wide'      // 10 / 20 / 30 mm
type ThemeId = 'github' | 'academic' | 'minimal'
type FontFamily = 'sans' | 'serif' | 'mono'
type TocDepth = 'off' | 'h1-h2' | 'h1-h3'
type PageNumbers = 'off' | 'footer-center' | 'footer-right'

interface ExportSettings {
  pageSize: PageSize
  margin: Margin
  theme: ThemeId
  bodyFont: FontFamily
  headingFont: FontFamily | 'match'
  toc: TocDepth
  pageNumbers: PageNumbers
  coverPage: boolean
}

interface RecentDoc {
  id: string                // content hash
  title: string             // first H1 or first 40 chars
  preview: string           // first 120 chars
  updatedAt: number         // epoch ms
  markdown: string
}
```

### Storage schema

All keys namespaced `mark-to-pdf:*`. Versioned envelope to allow future migrations:

```ts
interface Envelope<T> { v: 1; data: T }
```

Keys:

- `mark-to-pdf:doc:current` → `Envelope<{ markdown: string; filename: string; updatedAt: number }>`
- `mark-to-pdf:doc:recent` → `Envelope<RecentDoc[]>` (max 5)
- `mark-to-pdf:export-settings` → `Envelope<ExportSettings>`

`lib/storage.ts` exposes `read<T>(key, schema)` and `write<T>(key, data)`. Returns `null` on parse failure (corrupt data → silent reset).

## Phase 1 — Editor experience

### CodeMirror 6 setup

Dependencies: `codemirror`, `@codemirror/lang-markdown`, `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/theme-one-dark`.

Extensions enabled:

- `markdown({ codeLanguages: languages })` — syntax highlighting incl. fenced code blocks
- `EditorView.lineWrapping` — wrap long lines
- `keymap.of([...defaultKeymap, ...historyKeymap, ...formattingKeymap])`
- Custom theme matching shadcn tokens (`--background`, `--foreground`, `--muted`, etc.)
- Light/dark theme via `EditorView.theme` reactive to user system pref

Editor is a client component wrapped in `forwardRef` exposing:

```ts
interface EditorHandle {
  applyCommand(cmd: EditorCommand): void
  focus(): void
  getSelection(): { from: number; to: number; text: string }
}
```

### Toolbar commands

`lib/editor/commands.ts` exports pure functions that take `(view: EditorView)` and dispatch transactions. Commands: `toggleBold`, `toggleItalic`, `toggleStrikethrough`, `setHeading(level)`, `insertLink`, `insertImage`, `toggleUnorderedList`, `toggleOrderedList`, `toggleBlockquote`, `toggleInlineCode`, `insertCodeBlock`, `insertHorizontalRule`.

Behavior:

- Wrap-style commands (bold/italic/strike/code) wrap selection if present, otherwise insert markers with cursor between them
- Block-style commands (heading/quote/list) operate per-line within selection
- Smart toggle: if all selected lines already have the prefix, remove it; else add it

### Keyboard shortcuts

| Shortcut | Command |
|---|---|
| Cmd/Ctrl+B | toggleBold |
| Cmd/Ctrl+I | toggleItalic |
| Cmd/Ctrl+Shift+S | toggleStrikethrough |
| Cmd/Ctrl+K | insertLink |
| Cmd/Ctrl+E | toggleInlineCode |
| Cmd/Ctrl+Shift+K | insertCodeBlock |
| Cmd/Ctrl+1..6 | setHeading(1..6) |
| Cmd/Ctrl+Shift+. | toggleBlockquote |
| Cmd/Ctrl+Shift+8 | toggleUnorderedList |
| Cmd/Ctrl+Shift+7 | toggleOrderedList |

### Autosave

- Debounced 500ms after last keystroke
- Indicator in statusbar: `idle` (no recent change) / `saving` (timer pending or in-flight) / `saved` (just persisted)
- On mount, `useDocument` reads `mark-to-pdf:doc:current`; if absent or invalid, falls back to `SAMPLE_MARKDOWN` (preserved from current behavior)

## Phase 2 — File handling

### Drag and drop

The editor card (entire card surface) is the drop zone. Visual treatment: dashed border + tinted overlay on `dragover`. Accepted MIME / extensions: `text/markdown`, `text/plain`, `.md`, `.markdown`, `.txt`. Max file size: 5 MB (toast error if larger).

If the current document is non-empty and differs from sample, show `AlertDialog`:

> "Replace current document with `<filename>`?" — Cancel / Replace

After load:

1. Set markdown to file contents
2. Set filename to basename without extension (unless user-edited filename differs from default `document`)
3. Push previous document to recent docs (if non-empty)
4. Toast: "Loaded `<filename>` (2.3 KB)"

### Upload button

In toolbar (Upload icon). Triggers hidden `<input type="file" accept=".md,.markdown,.txt">`. Same load flow as drop.

### Filename inference

When markdown changes, derive `inferredFilename` from first H1 (slugified, max 60 chars). If user has not manually edited the filename (`filename === 'document'` or last-typed by user matches inferred from a prior parse), update it. Otherwise leave it alone. Tracked by an `isUserEdited` flag on filename input.

### Image paste

`onPaste` handler on the editor:

1. Check clipboard for `image/*` items
2. If found and size ≤ 1 MB → convert to base64 data URL, insert `![](data:image/png;base64,...)` at cursor
3. If > 1 MB → toast error: "Image too large (X.X MB). Limit is 1 MB. Resize before pasting."
4. If both text and image → prefer text (default paste behavior)

### Recent docs

`useRecentDocs` maintains `mark-to-pdf:doc:recent` (max 5). Push triggers on:

- Replacing current doc via drop/upload/recent
- Manual "Save as recent" action (toolbar overflow menu)

Recent docs dropdown (toolbar) shows: title, relative time ("2 min ago"). Item actions: Load · Delete. "Clear all" at bottom.

## Phase 3 — Export customization

### Settings dialog

Triggered by gear icon in toolbar. Sections:

1. **Page** — page size (radio), margins (radio)
2. **Typography** — theme (radio with preview swatches), body font (radio), heading font (radio)
3. **Extras** — TOC depth (select), page numbers (radio), cover page (switch)

Footer buttons: Reset to defaults · Close (auto-save on change).

### Themes

Themes are pure data — no runtime CSS-in-JS:

```ts
interface ThemeStyle {
  body: { font: string; size: number; lineHeight: number; color: string }
  heading: { font: string; sizes: [number, number, number, number, number, number]; weight: 'bold' | 'semibold' }
  code: { font: string; size: number; bg: string }
  quote: { color: string; borderColor: string }
  margins: { hr: { color: string }, table: { borderColor: string, headerBg: string } }
  spacing: { paragraph: number; heading: [number, number, number, number, number, number] }
}

const THEMES: Record<ThemeId, ThemeStyle> = {
  github: /* current behavior baseline — Helvetica 11pt, H1 24pt down to H6 12pt, gray code bg #F4F4F4 */,
  academic: /* Times serif body 11pt, indented paragraphs, larger heading whitespace */,
  minimal: /* Helvetica body 11pt, no code bg, more line-height, thinner rules */,
}
```

Concrete font/size/color values for each theme are defined in `lib/export/themes.ts` during implementation, but the contract above is fixed by this spec.

Themes affect both:

- Preview pane (via `prose-github` / `prose-academic` / `prose-minimal` CSS classes; styles in `globals.css`)
- PDF export (read from `THEMES[settings.theme]` inside `lib/export/export-pdf.ts`)

### PDF refactor (`lib/export/export-pdf.ts`)

`exportHtmlToPdf` signature changes:

```ts
export async function exportHtmlToPdf(
  html: string,
  filename: string,
  settings: ExportSettings
): Promise<void>
```

Page setup:

- Size: derived from `settings.pageSize` → jsPDF format string
- Margin: `{ narrow: 10, normal: 20, wide: 30 }[settings.margin]` in mm

If `settings.coverPage`:

- First page = first H1 centered vertically, 36pt, theme heading font
- Subtitle: second-level paragraph if present
- Page break before content begins

If `settings.toc !== 'off'`:

- Generate TOC from H1–H2 or H1–H3 headings (via `lib/export/toc.ts`)
- Render after cover, before body
- Each entry: heading text + dotted leader + page number (computed in second pass)

Two-pass rendering: first pass renders body to compute heading → page map. Second pass renders cover + TOC + body.

If `settings.pageNumbers !== 'off'`:

- After full render, iterate pages and stamp footer text
- Center / right per setting; skip page 1 if cover

### DOCX refactor (`lib/export/export-docx.ts`)

`exportToDocx` signature changes:

```ts
export async function exportToDocx(
  markdown: string,
  filename: string,
  settings: ExportSettings
): Promise<void>
```

DOCX maps:

- Page size → `Document.sections[].properties.page.size`
- Margins → `Document.sections[].properties.page.margin`
- Theme.body.font → `TextRun.font` defaults
- TOC → docx `TableOfContents` element
- Page numbers → header/footer with `PageNumber`
- Cover → first section with title `Paragraph`, section break before body

## Phase 4 — Polish

### Toast (sonner)

Install `sonner`. Mount `<Toaster richColors closeButton />` in `app/layout.tsx`.

Toasts:

- Export success → "Downloaded `<filename>.pdf`" (info, 4s)
- Export failure → "Export failed: `<reason>`" with Retry action (error, 8s)
- File loaded → "Loaded `<filename>` (X.X KB)" (info, 3s)
- Image too large → "Image too large (X.X MB). Limit is 1 MB." (error, 5s)
- Document restored → "Restored your last document" (info, 3s) — only on first mount when localStorage had content

### Statusbar

Fixed-height row below the editor (inside the same card):

```
Words: 142   Chars: 891   ~1 min read         Ln 4, Col 12   ● Saved
```

- Words: token-level count from CodeMirror state (split on `/\s+/`)
- Chars: `markdown.length` excluding newlines
- Read time: `Math.max(1, Math.round(words / 200))` minutes
- Ln/Col: from CodeMirror cursor selection
- Save state: dot color: gray (idle), amber (saving), green (saved)

### Loading & empty states

- Export button while exporting: spinner + "Generating PDF…" / "Generating DOCX…" — disable inputs
- Preview pane when markdown empty: centered placeholder "Start typing to see your preview"
- Preview pane on first mount before hydration: thin skeleton (3 rows)

### Error messages

Surface specific reasons instead of generic "Failed":

- jsPDF throws → "PDF generation failed (jsPDF: `<message>`)"
- docx throws → "DOCX generation failed (`<message>`)"
- File too large → "File too large (X MB). Limit is 5 MB."
- Unsupported file → "Only .md, .markdown, .txt files are supported."

## Testing

Existing test setup: Playwright. Tests added under `tests/`:

- `editor.spec.ts` — type text, click toolbar bold → assert `**text**` in editor; Cmd+B toggles
- `autosave.spec.ts` — type, reload page, assert content restored
- `file-load.spec.ts` — upload a `.md` file, assert editor content matches
- `export-pdf.spec.ts` — click export, assert download event with correct filename
- `export-settings.spec.ts` — change page size, verify settings persist after reload
- `recent-docs.spec.ts` — load file, load second, assert first appears in recent menu

No unit-test framework will be added; lib functions covered indirectly via Playwright. (If pure-function complexity in `lib/export/toc.ts` warrants it, vitest can be added in a follow-up — out of scope for this spec.)

## Migration & rollout

- Single PR, single deploy.
- No data migration: localStorage keys are new; old behavior had none.
- Bundle size impact: CodeMirror 6 (~50 KB gz), sonner (~5 KB gz). Total +~55 KB gz. Acceptable for a converter app.
- AdSense / GA / SEO untouched.

## Open questions resolved

| Question | Decision |
|---|---|
| Editor library | CodeMirror 6 (small, Markdown-native, themable) |
| Image upload to backend | No — base64 only, 1 MB cap |
| WYSIWYG | No — raw Markdown editing |
| New formats (HTML, EPUB) | Out of scope |
| Multi-doc tabs | Out of scope; recent docs covers the use case |
| Cloud sync | Out of scope |
| Custom CSS theme by user | Out of scope; 3 presets only |

## Risks

1. **CodeMirror SSR** — strict client-only. Wrapped in `'use client'` and dynamic import if needed.
2. **PDF two-pass cost** — for very long docs, rendering twice is slow. Mitigation: only two-pass if `settings.toc !== 'off' || settings.pageNumbers !== 'off' || settings.coverPage`. Otherwise single pass.
3. **localStorage quota** — base64 images plus recent docs can exceed 5 MB quota. On write failure, prune oldest recent doc and retry; if still fails, drop recents entirely with a toast.
4. **Theme drift between preview and PDF** — preview is CSS, PDF is manual jsPDF rendering. Themes share font/size tokens but the visual won't be pixel-identical; documented as expected.

## Out of scope (deferred)

- Cloud sync / accounts
- WYSIWYG editing mode
- Image upload to a server
- New export formats (HTML, EPUB, RTF)
- Custom user-defined themes
- Real-time collaboration
- Mobile-first redesign beyond what existing responsive grid covers
