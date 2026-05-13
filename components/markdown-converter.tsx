"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { FileText, Download, Eye, Code, FileIcon, Loader2 } from "lucide-react"
import { Upload, History, Trash2, FileText as FileTextIcon } from "lucide-react"
import { Settings as SettingsIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { cn } from "@/lib/utils"
import { markdownToHtml } from "@/lib/markdown-parser"
import type { EditorHandle } from "@/components/editor/markdown-editor"
import { EditorToolbar } from "@/components/editor/editor-toolbar"
import { EditorStatusbar } from "@/components/editor/editor-statusbar"
import { MarkdownPreview } from "@/components/preview/markdown-preview"
import { useDocument, SAMPLE_MARKDOWN } from "@/hooks/use-document"
import { useExportSettings } from "@/hooks/use-export-settings"
import { ExportSettingsDialog } from "@/components/export/export-settings-dialog"

export type { EditorHandle }

const MarkdownEditor = dynamic(
  () => import("@/components/editor/markdown-editor").then((m) => m.MarkdownEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading editor…
      </div>
    ),
  },
)

type ExportFormat = "pdf" | "docx"
type ViewMode = "split" | "edit" | "preview"

interface MarkdownConverterProps {
  initialExample?: string | null
}

export function MarkdownConverter({ initialExample = null }: MarkdownConverterProps) {
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

  const [format, setFormat] = React.useState<ExportFormat>("pdf")
  const [viewMode, setViewMode] = React.useState<ViewMode>("split")
  const [isExporting, setIsExporting] = React.useState(false)
  const editorRef = React.useRef<EditorHandle>(null)
  const previewRef = React.useRef<HTMLDivElement>(null)

  const { recent, push: pushRecent, remove: removeRecent, clear: clearRecent } = useRecentDocs()
  const { settings: exportSettings, update: updateSettings, reset: resetSettings } = useExportSettings()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [dropActive, setDropActive] = React.useState(false)
  const [pendingFile, setPendingFile] = React.useState<{ name: string; text: string } | null>(null)
  const [pendingRecent, setPendingRecent] = React.useState<RecentDoc | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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

  const exampleAppliedRef = React.useRef(false)
  React.useEffect(() => {
    if (exampleAppliedRef.current) return
    if (!initialExample) return
    if (markdown !== SAMPLE_MARKDOWN) return
    setMarkdown(initialExample)
    exampleAppliedRef.current = true
  }, [initialExample, markdown, setMarkdown])

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
        toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 5 MB.`)
      } else {
        toast.error(`Only ${ACCEPTED_EXTENSIONS.join(", ")} files are supported.`)
      }
      return
    }
    const text = await file.text()
    setPendingFile({ name: basenameWithoutExt(file.name), text })
  }, [])

  const confirmPendingFile = () => {
    if (!pendingFile) return
    const size = new Blob([pendingFile.text]).size
    loadDocument({ markdown: pendingFile.text, filename: pendingFile.name })
    toast.success(`Loaded ${pendingFile.name} (${(size / 1024).toFixed(1)} KB)`)
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
      toast.error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Limit is 1 MB.`)
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
    try {
      const exportFilename = filename.trim() || "document"
      const fullName =
        format === "pdf" ? `${exportFilename}.pdf` : `${exportFilename}.docx`

      if (format === "pdf") {
        const { exportHtmlToPdf } = await import("@/lib/export/export-pdf")
        await exportHtmlToPdf(html, fullName, exportSettings)
      } else {
        const { exportToDocx } = await import("@/lib/export/export-docx")
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
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Code className="size-4 md:size-5" />
                Markdown Editor
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Write or paste your Markdown content
              </CardDescription>
            </CardHeader>
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
              rightSlot={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  aria-label="Export settings"
                  title="Export settings"
                  data-testid="tb-settings"
                  onClick={() => setSettingsOpen(true)}
                >
                  <SettingsIcon className="size-4" />
                </Button>
              }
            />
            <div className="flex-1 overflow-hidden">
              <MarkdownEditor
                ref={editorRef}
                value={markdown}
                onChange={setMarkdown}
                onPaste={handleEditorPaste}
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
              <MarkdownPreview html={html} innerRef={previewRef} theme={exportSettings.theme} />
            </CardContent>
          </Card>
        )}
      </div>

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

      <ExportSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={exportSettings}
        onChange={updateSettings}
        onReset={resetSettings}
      />
    </div>
  )
}
