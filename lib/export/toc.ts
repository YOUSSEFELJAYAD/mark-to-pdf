import { marked, type Token } from "marked"
import type { TocDepth } from "./themes"

export interface TocEntry {
  level: 1 | 2 | 3
  text: string
}

export function extractTocEntries(markdown: string, depth: TocDepth): TocEntry[] {
  if (depth === "off") return []
  const maxLevel = depth === "h1-h2" ? 2 : 3
  const tokens = marked.lexer(markdown)
  const entries: TocEntry[] = []
  for (const tok of tokens as Token[]) {
    if (tok.type === "heading" && typeof tok.depth === "number" && tok.depth >= 1 && tok.depth <= maxLevel) {
      entries.push({ level: tok.depth as 1 | 2 | 3, text: String(tok.text ?? "") })
    }
  }
  return entries
}
