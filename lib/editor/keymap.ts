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
