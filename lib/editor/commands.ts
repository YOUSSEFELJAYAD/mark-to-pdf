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
