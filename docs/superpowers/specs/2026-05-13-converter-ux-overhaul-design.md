# Converter UX Overhaul — Design

**Date:** 2026-05-13
**Status:** Approved, pending implementation plan
**Scope:**
- `app/page.tsx` (mount Toaster, sidebar adjustments unchanged)
- `app/layout.tsx` (mount Toaster)
- `app/globals.css` (add `.prose-github`, `.prose-academic`, `.prose-minimal` theme variants)
- `components/markdown-converter.tsx` (slim down to orchestrator)
- `lib/export-pdf.ts` → **move to** `lib/export/export-pdf.ts`, refactor to accept `ExportSettings`
- `lib/export-docx.ts` → **move to** `lib/export/export-docx.ts`, refactor to accept `ExportSettings`
- `lib/markdown-parser.ts` (unchanged surface; consumed by export + preview)
- New: `lib/storage.ts`, `lib/editor/*`, `lib/export/themes.ts`, `lib/export/toc.ts`
- New: `components/editor/*`, `components/export/*`, `components/preview/markdown-preview.tsx`
- New: `hooks/use-document.ts`, `hooks/use-recent-docs.ts`, `hooks/use-export-settings.ts`

All callsites of moved modules (today only `components/markdown-converter.tsx`) must be updated. No re-export shims — clean rename.

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

- `useDocument()` returns `{ markdown, setMarkdown, filename, setFilename, isUserEditedFilename, saveState, flushNow }`.
  - Reads `mark-to-pdf:doc:current` on mount; falls back to `SAMPLE_MARKDOWN`.
  - Debounces writes 500ms.
  - `isUserEditedFilename: boolean` — flips to `true` the first time `setFilename` is called from a user input change. Stays `false` if filename was set by inference. Used by filename-inference logic to know when not to overwrite.
  - `saveState: 'idle' | 'saving' | 'saved'`.
  - `flushNow()` — synchronously writes pending state. Wired to a `beforeunload` listener so we never lose work to a tab close inside the debounce window.
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
// Cap at h3 intentionally — deeper TOCs become noise in the output and the
// dialog stays a clean radio group. Deeper depth is a deferred enhancement.
type PageNumbers = 'off' | 'footer-center' | 'footer-right'

interface ExportSettings {
  pageSize: PageSize
  margin: Margin
  theme: ThemeId
  bodyFont: FontFamily
  headingFont: FontFamily | 'match'   // 'match' = use bodyFont verbatim
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
| Alt+1..6 | setHeading(1..6) |
| Cmd/Ctrl+Shift+. | toggleBlockquote |
| Cmd/Ctrl+Shift+U | toggleUnorderedList |
| Cmd/Ctrl+Shift+O | toggleOrderedList |

Shortcuts are registered as CodeMirror keymap entries that return `true` from their handler, which prevents propagation to the browser. Cmd/Ctrl+K is the only one that overlaps a common browser shortcut (focus address bar in some browsers); the keymap stops propagation when the editor has focus only — outside the editor, browser shortcuts work normally. Heading shortcuts use `Alt+1..6` rather than `Cmd/Ctrl+1..6` to avoid the universal browser tab-switching binding.

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

When markdown changes, derive `inferredFilename` from first H1 (slugified, max 60 chars). Update `filename` to the inferred value **only if `isUserEditedFilename === false`** (from `useDocument`). Once the user types into the filename input, `isUserEditedFilename` flips to `true` and inference is disabled for the remainder of the session — even if the user clears the input back to empty. Reset only happens on "New document" action or on loading a different file (which also reassigns the filename to that file's basename and clears the flag).

### Image paste

`onPaste` handler on the editor:

1. Check clipboard for `image/*` items
2. If found and size ≤ 1 MB → convert to base64 data URL, insert `![](data:image/png;base64,...)` at cursor
3. If > 1 MB → toast error: "Image too large (X.X MB). Limit is 1 MB. Resize before pasting."
4. If both text and image → prefer text (default paste behavior)

### Recent docs

`useRecentDocs` maintains `mark-to-pdf:doc:recent` (max 5). The **current** (about-to-be-replaced) document is pushed to recents whenever the editor's contents are replaced by an external source. Triggers:

- Drop or upload of a file (push the current doc, then load the file)
- Loading a doc from the recent menu (push the current doc, then load the selected recent)
- Manual "Save as recent" toolbar action (push current doc, no replace)

The doc being **loaded** never gets pushed to recents — only the one being displaced. Deduped by content hash; loading a recent that equals the current is a no-op.

**Image bloat cap:** Each `RecentDoc.markdown` is capped at 1 MB serialized. If the current doc exceeds that (typically due to many pasted base64 images), the recent push is skipped silently — recents are a convenience, not a backup.

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

- Preview pane (via `prose-github` / `prose-academic` / `prose-minimal` CSS classes added in `app/globals.css` — extending the existing handwritten `.prose` rules; **no `@tailwindcss/typography` plugin** is introduced)
- PDF export (read from `THEMES[settings.theme]` inside `lib/export/export-pdf.ts`)
- DOCX export (read from `THEMES[settings.theme]` inside `lib/export/export-docx.ts` — body font and heading font map to `TextRun.font`; sizes map to `TextRun.size` in half-points)

### PDF refactor (`lib/export/export-pdf.ts`)

Current code: `exportHtmlToPdf(html, filename)` builds a detached `<div>` from the HTML string, then `exportToPdf(element, filename)` walks DOM nodes via jsPDF primitives. **The string-to-DOM bridge and the DOM-walking renderer are preserved verbatim** — only the renderer's hard-coded constants (margins, fonts, sizes, colors) are replaced with values read from `ExportSettings` + the active theme.

New signature:

```ts
export async function exportHtmlToPdf(
  html: string,
  filename: string,
  settings: ExportSettings
): Promise<void>
```

`exportToPdf(element, filename, settings)` keeps its `HTMLElement` input; only the inner DOM walk changes to read from `settings`/theme tokens instead of constants.

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

**Two-pass rendering** (only when `settings.toc !== 'off'`):

1. **Measure pass:** instantiate a throwaway `jsPDF` document with identical page/margin/theme/cover settings and render the body to it. Walk its internal state to extract `headingId → pageNumber` (jsPDF tracks `getNumberOfPages()`; we annotate each heading via `getCurrentPageInfo()` at render time). The throwaway document is discarded.
2. **Final pass:** instantiate the real `jsPDF`, render cover, render TOC entries using the heading→page map from pass 1, then render the body again.

Determinism note: jsPDF page breaks are a pure function of (settings, theme, html). The measure pass and final pass render identical body content with identical inputs, so the page map is stable. Pasted base64 images render to known pixel sizes (we resize to fit content width); they do not vary between passes.

If `settings.toc === 'off'`, single-pass rendering only — cover, then body, then optional page numbers.

**TOC dotted leader:** for each entry, compute `availableWidth = contentWidth - textWidth(title) - textWidth(pageNum)`, then render `.` characters spanning that width with `pdf.text()`. Width per dot is precomputed once.

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

Install `sonner@^1.7.0` (latest minor; verified compatible with React 19 — peer-dep widened in 1.5+). Mount `<Toaster richColors closeButton />` in `app/layout.tsx` as a client component island.

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

- Words: token-level count from CodeMirror state (split on `/\s+/`, filter empty)
- Chars: `markdown.length` (full string length; newlines and markdown syntax included — matches the convention users expect from text editors)
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

1. **CodeMirror SSR** — strict client-only. `MarkdownEditor` is loaded via `next/dynamic(() => import('@/components/editor/markdown-editor'), { ssr: false })`. The component file itself uses `'use client'`. We commit to `ssr: false` definitively — not "if needed" — because the `EditorView` constructor touches `document` at module init time.

2. **CodeMirror 6 + React 19 StrictMode double-mount** — React 19 dev StrictMode invokes effects twice. The `EditorView` is created imperatively inside a `useEffect`; we MUST call `view.destroy()` in the cleanup function, or two views accumulate. The wrapper follows the canonical CM6-in-React pattern: create on mount, destroy on unmount, use `effects.dispatch()` for external state sync.

3. **PDF two-pass cost** — for very long docs, rendering twice is slow. Mitigation: only two-pass if `settings.toc !== 'off'`. Page numbers and cover are single-pass (page numbers stamped after body render; cover prepended before body render with known page count = 1).

4. **localStorage quota** — base64 images plus recent docs can exceed 5 MB quota. On write failure: prune oldest recent doc and retry; if still fails, drop recents entirely with an error toast. The current document write always wins over recents.

5. **Tab close inside debounce window** — 500ms debounce can lose work on tab close. Mitigation: `useDocument` registers a `beforeunload` listener that calls `flushNow()` synchronously, persisting pending state before the tab unloads.

6. **Theme drift between preview and PDF** — preview is CSS, PDF is manual jsPDF rendering. Themes share font/size tokens but the visual won't be pixel-identical. Documented in the dialog ("Preview is approximate; PDF output may differ slightly").

7. **Keyboard shortcut conflicts** — Cmd/Ctrl+K conflicts with browser address-bar in some browsers; mitigated by `preventDefault` inside the editor only (browser shortcut works when editor isn't focused). Heading shortcuts use `Alt+1..6` to avoid the universal browser tab-switch binding on Cmd/Ctrl+1..9.

8. **sonner peer-dep** — sonner 1.5+ supports React 19; pin to `^1.7.0`. If install warns about peer-dep mismatch, fail loudly in CI rather than auto-resolving.

9. **`@tailwindcss/typography` is NOT installed** — the current `.prose` rules are handwritten in `globals.css`. Theme variants `.prose-github` / `.prose-academic` / `.prose-minimal` are added as additional CSS classes extending the existing manual rules. No plugin is added; this is intentional to keep bundle size minimal.

## Out of scope (deferred)

- Cloud sync / accounts
- WYSIWYG editing mode
- Image upload to a server
- New export formats (HTML, EPUB, RTF)
- Custom user-defined themes
- Real-time collaboration
- Mobile-first redesign beyond what existing responsive grid covers
