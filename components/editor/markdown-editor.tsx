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
  const onPasteRef = React.useRef(onPaste)

  // Sync callback refs in an effect (react-hooks/refs forbids ref writes during render)
  React.useEffect(() => {
    onChangeRef.current = onChange
    onPasteRef.current = onPaste
  })
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
