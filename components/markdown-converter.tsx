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
