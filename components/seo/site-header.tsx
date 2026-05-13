import Link from "next/link"
import { Logo } from "./logo"

const NAV_LINKS = [
  { label: "Cheatsheet", href: "/markdown-cheatsheet" },
  { label: "Examples", href: "/examples" },
  { label: "How-to", href: "/how-to-convert-markdown-to-pdf" },
] as const

export function SiteHeader() {
  return (
    <header className="border-b bg-background" data-testid="site-header">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link
            href="/"
            aria-label="Mark to PDF — home"
            className="flex items-center gap-2.5"
            data-testid="site-header-home"
          >
            <Logo size={32} />
            <span className="text-lg font-semibold tracking-tight">
              Mark to PDF
            </span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1 text-sm sm:gap-2">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
