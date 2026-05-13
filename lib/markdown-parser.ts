import { marked, type Token } from "marked"
import DOMPurify from "dompurify"

marked.use({
  gfm: true,
  breaks: true,
})

export interface ParsedMarkdown {
  html: string
  tokens: Token[]
}

function sanitize(html: string): string {
  if (typeof window === "undefined") return html
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  })
}

export function parseMarkdown(markdown: string): ParsedMarkdown {
  const tokens = marked.lexer(markdown)
  const html = sanitize(marked.parser(tokens))
  return { html, tokens }
}

export function markdownToHtml(markdown: string): string {
  return sanitize(marked.parse(markdown) as string)
}
