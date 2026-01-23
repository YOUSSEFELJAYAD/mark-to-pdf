import { marked, type Token } from 'marked'

// Configure marked for safe parsing
marked.use({
  gfm: true,
  breaks: true,
})

export interface ParsedMarkdown {
  html: string
  tokens: Token[]
}

export function parseMarkdown(markdown: string): ParsedMarkdown {
  const tokens = marked.lexer(markdown)
  const html = marked.parser(tokens)
  return { html, tokens }
}

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string
}
