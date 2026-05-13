# Phase 4 — Polish (continuation)

**Parent plan:** `2026-05-13-converter-ux-overhaul.md`
**Prerequisites:** Phase 0, 1, 2, 3 complete.

---

### Task 4.1: Mount sonner Toaster

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add Toaster**

Open `/Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf/app/layout.tsx`. Add:

```tsx
import { Toaster } from "sonner"
```

Inside `<body>`, after `{children}`:

```tsx
        {children}
        <Toaster richColors closeButton position="bottom-right" />
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add app/layout.tsx
git commit -m "feat: mount sonner Toaster in root layout"
```

### Task 4.2: Replace inline export status with toasts

**Files:**
- Modify: `components/markdown-converter.tsx`

- [ ] **Step 1: Update converter — handleExport**

Add at the top of `components/markdown-converter.tsx`:

```tsx
import { toast } from "sonner"
```

Replace `handleExport` with:

```tsx
  const handleExport = async () => {
    if (!markdown.trim()) return
    setIsExporting(true)
    try {
      const exportFilename = filename.trim() || "document"
      const fullName =
        format === "pdf" ? `${exportFilename}.pdf` : `${exportFilename}.docx`

      if (format === "pdf") {
        await exportHtmlToPdf(html, fullName, exportSettings)
      } else {
        await exportToDocx(markdown, fullName, exportSettings)
      }
      toast.success(`Downloaded ${fullName}`)
    } catch (error) {
      console.error("Export failed:", error)
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`Export failed: ${message}`, {
        action: {
          label: "Retry",
          onClick: () => void handleExport(),
        },
      })
    } finally {
      setIsExporting(false)
    }
  }
```

- [ ] **Step 2: Remove `exportStatus` state**

Delete:

```tsx
  const [exportStatus, setExportStatus] = React.useState<"idle" | "success" | "error">("idle")
```

And any remaining references to `exportStatus` / `setExportStatus`.

- [ ] **Step 3: Replace the Export `<Button>` element**

Find the existing Export button (with conditional `Downloaded!` / `Failed - Try Again` text) and replace its JSX with:

```tsx
            <Button onClick={handleExport} disabled={isExporting || !markdown.trim()}>
              {isExporting ? (
                <>
                  <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
                  {format === "pdf" ? "Generating PDF…" : "Generating DOCX…"}
                </>
              ) : (
                <>
                  <Download data-icon="inline-start" className="size-4" />
                  Export
                </>
              )}
            </Button>
```

Remove the `cn(... && "bg-green-600...")` styling — toast handles feedback.

- [ ] **Step 4: Replace `window.alert` with toasts**

In `confirmPendingFile`:

```tsx
  const confirmPendingFile = () => {
    if (!pendingFile) return
    const size = new Blob([pendingFile.text]).size
    loadDocument({ markdown: pendingFile.text, filename: pendingFile.name })
    toast.success(`Loaded ${pendingFile.name} (${(size / 1024).toFixed(1)} KB)`)
    setPendingFile(null)
  }
```

In `handleFileSelected`, swap the `window.alert` lines:

```tsx
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 5 MB.`)
      } else {
        toast.error(`Only ${ACCEPTED_EXTENSIONS.join(", ")} files are supported.`)
      }
```

In `handleEditorPaste`:

```tsx
    if (file.size > 1_000_000) {
      event.preventDefault()
      toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 1 MB.`)
      return true
    }
```

- [ ] **Step 5: Update existing tests for new feedback**

Open `e2e/markdown-converter.spec.ts`.

Replace the `'should show success state after export'` test body:

```ts
    test('should show success state after export', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /Export/i }).first().click()
      await downloadPromise
      await expect(page.locator('text=Downloaded').first()).toBeVisible({ timeout: 5000 })
    })
```

Replace the `'should show loading state during export'` test body:

```ts
    test('should show loading state during export', async ({ page }) => {
      await page.getByRole('button', { name: /Export/i }).first().click()
      await expect(
        page.getByRole('button', { name: /Generating PDF/i }).or(page.locator('text=Downloaded').first())
      ).toBeVisible({ timeout: 5000 })
    })
```

- [ ] **Step 6: Run e2e + lint + tsc**

```bash
npm run test:chromium
npx tsc --noEmit && npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/markdown-converter.tsx e2e/markdown-converter.spec.ts
git commit -m "feat: replace inline export status with sonner toasts"
```

### Task 4.3: Add document-restored toast

**Files:**
- Modify: `components/markdown-converter.tsx`

- [ ] **Step 1: Wire `onRestored`**

Update the `useDocument()` call:

```tsx
  const {
    markdown,
    setMarkdown,
    filename,
    setFilename,
    isUserEditedFilename,
    resetUserEditedFilename,
    saveState,
  } = useDocument({
    onRestored: ({ filename }) => {
      toast.info(`Restored your last document (${filename})`, { duration: 3000 })
    },
  })
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add components/markdown-converter.tsx
git commit -m "feat: toast when document is restored from autosave"
```

### Task 4.4: Final verification + branch finish

- [ ] **Step 1: Full local check**

```bash
cd /Users/jd/Documents/MarkdownTO-PDF/mark-to-pdf
npm run lint
npx tsc --noEmit
npm run build
npm run test:chromium
```

Expected: all pass.

- [ ] **Step 2: Multi-browser smoke**

```bash
npx playwright test --project=firefox --project=webkit
```

Expected: pass. Document any browser-specific quirks.

- [ ] **Step 3: Mobile smoke**

```bash
npm run test:mobile
```

Expected: pass. Address any toolbar wrapping or dropdown placement issues before declaring complete.

- [ ] **Step 4: Manual dev verification**

```bash
npm run dev
```

Golden path: open page, type markdown, see preview, change theme to Academic in settings, export PDF, open PDF and confirm serif font. Drag-and-drop a real `.md` file. Confirm autosave restored on reload (toast appears).

Edge cases to spot-check manually:
- Empty editor → preview placeholder appears
- Paste a tiny PNG → markdown gets `![](data:image/png;base64,...)`
- Paste a >1 MB PNG → error toast, no insertion
- Change every setting one by one → preview updates where applicable, PDF respects on next export
- TOC with H1–H3, page numbers footer-right, cover page on → PDF has cover + TOC + body + page numbers

- [ ] **Step 5: Open PR (only on user request)**

The plan ends with the branch ready. Whether to merge to `main` directly or open a PR is the user's call. Do not push or open a PR unprompted.

---

## Final risks recap

- **CodeMirror SSR** — `'use client'` directive. If module init fails in dev, wrap usage in `next/dynamic(... { ssr: false })`.
- **StrictMode double-mount** — `view.destroy()` cleanup in `useEffect` (Phase 1 Task 1.6).
- **localStorage quota** — recents push silently skips oversized docs.
- **Tab-close inside debounce** — `beforeunload` flush (Phase 1 Task 1.2).
- **TOC two-pass determinism** — throwaway jsPDF for measure pass (Phase 3 Task 3.5).
- **Theme drift between preview and PDF** — documented in dialog copy.
- **Sonner peer-dep** — pinned `^1.7.0` (Phase 0 Task 0.2).
- **HTML preview XSS** — closed by DOMPurify in `lib/markdown-parser.ts` (Phase 1 Task 1.0).
