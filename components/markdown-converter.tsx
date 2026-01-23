"use client"

import * as React from "react"
import { FileText, Download, Eye, Code, FileIcon, Loader2, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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

type ExportFormat = "pdf" | "docx"
type ViewMode = "split" | "edit" | "preview"

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

export function MarkdownConverter() {
  const [markdown, setMarkdown] = React.useState(SAMPLE_MARKDOWN)
  const [format, setFormat] = React.useState<ExportFormat>("pdf")
  const [viewMode, setViewMode] = React.useState<ViewMode>("split")
  const [isExporting, setIsExporting] = React.useState(false)
  const [filename, setFilename] = React.useState("document")
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [exportStatus, setExportStatus] = React.useState<"idle" | "success" | "error">("idle")
  const previewRef = React.useRef<HTMLDivElement>(null)

  const html = React.useMemo(() => markdownToHtml(markdown), [markdown])

  // Auto-switch to appropriate view on mobile
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
      {/* Header Controls */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between mb-4">
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={viewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("edit")}
              >
                <Code className="size-4" />
              </Button>
              <Button
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="size-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="flex md:hidden flex-col gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex flex-col gap-2">
                <label htmlFor="filename-mobile" className="text-sm text-muted-foreground">
                  Filename
                </label>
                <input
                  id="filename-mobile"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="document"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
                  <SelectTrigger className="flex-1">
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
                    "flex-1",
                    exportStatus === "success" && "bg-green-600 hover:bg-green-700",
                    exportStatus === "error" && "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {isExporting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : exportStatus === "success" ? (
                    "Downloaded!"
                  ) : exportStatus === "error" ? (
                    "Failed"
                  ) : (
                    <>
                      <Download className="size-4 mr-1" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Desktop Controls */}
          <div className="hidden md:flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
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

            {/* Filename Input */}
            <div className="flex items-center gap-2">
              <label htmlFor="filename" className="text-sm text-muted-foreground whitespace-nowrap">
                Filename:
              </label>
              <input
                id="filename"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="document"
                className="h-8 w-32 lg:w-40 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            {/* Format Select */}
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

            {/* Export Button */}
            <Button
              onClick={handleExport}
              disabled={isExporting || !markdown.trim()}
              className={cn(
                exportStatus === "success" && "bg-green-600 hover:bg-green-700",
                exportStatus === "error" && "bg-red-600 hover:bg-red-700"
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

      {/* Editor and Preview */}
      <div
        className={cn(
          "grid gap-4 md:gap-6",
          viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        )}
      >
        {/* Editor */}
        {viewMode !== "preview" && (
          <Card className="flex flex-col min-h-[400px] md:min-h-[500px] lg:min-h-[600px]">
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Code className="size-4 md:size-5" />
                Markdown Editor
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Write or paste your Markdown content
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Enter your Markdown here..."
                className="h-full min-h-[300px] md:min-h-[400px] lg:min-h-[450px] resize-none font-mono text-xs md:text-sm"
              />
            </CardContent>
          </Card>
        )}

        {/* Preview */}
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
              <div
                ref={previewRef}
                className="prose prose-sm dark:prose-invert max-w-none h-full overflow-auto rounded-lg border bg-background p-3 md:p-4"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tips - Hidden on mobile */}
      <Card className="hidden sm:block">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded text-[10px] md:text-xs font-mono">**bold**</kbd>
              <span>Bold</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded text-[10px] md:text-xs font-mono">*italic*</kbd>
              <span>Italic</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded text-[10px] md:text-xs font-mono"># Heading</kbd>
              <span>Headings</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded text-[10px] md:text-xs font-mono">`code`</kbd>
              <span>Code</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded text-[10px] md:text-xs font-mono">[text](url)</kbd>
              <span>Links</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded text-[10px] md:text-xs font-mono">- item</kbd>
              <span>Lists</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
