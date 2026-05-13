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
