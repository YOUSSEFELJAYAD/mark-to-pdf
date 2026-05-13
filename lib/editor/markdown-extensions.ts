import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view"
import { Extension } from "@codemirror/state"
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands"
import { oneDark } from "@codemirror/theme-one-dark"

const editorTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    height: "100%",
  },
  ".cm-content": {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    padding: "12px 0",
  },
  ".cm-focused": {
    outline: "none",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
  },
  ".cm-line": {
    padding: "0 12px",
  },
})

export function buildExtensions(darkMode: boolean): Extension[] {
  return [
    lineNumbers(),
    history(),
    highlightActiveLine(),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap]),
    editorTheme,
    ...(darkMode ? [oneDark] : []),
  ]
}
