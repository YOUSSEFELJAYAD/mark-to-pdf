import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Markdown to PDF Converter. Free online tool.
          </p>
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground" aria-label="Site footer">
            <Link href="/how-to-convert-markdown-to-pdf" className="hover:text-foreground transition-colors">How to use</Link>
            <Link href="/markdown-cheatsheet" className="hover:text-foreground transition-colors">Cheatsheet</Link>
            <Link href="/examples" className="hover:text-foreground transition-colors">Examples</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
