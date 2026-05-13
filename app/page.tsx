import { MarkdownConverter } from "@/components/markdown-converter"
import { AdBanner } from "@/components/ads/ad-banner"
import { AdSidebar } from "@/components/ads/ad-sidebar"

export default function Page() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Markdown to PDF Converter
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Free online tool to convert Markdown to PDF or DOCX
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Top Ad Banner */}
      <div className="container mx-auto px-4 pt-4">
        <AdBanner slot="4914775433" format="horizontal" className="min-h-[90px]" />
      </div>

      {/* Main Content with Sidebar Ad */}
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Converter */}
          <div className="flex-1">
            <MarkdownConverter />
          </div>

          {/* Sidebar Ad - Hidden on mobile/tablet */}
          <aside className="hidden xl:block w-[300px] flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              <AdSidebar slot="4914775433" />
              <AdSidebar slot="4914775433" />
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom Ad Banner */}
      <div className="container mx-auto px-4 pb-4">
        <AdBanner slot="4914775433" format="horizontal" className="min-h-[90px]" />
      </div>

      {/* SEO Content Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">
            Free Markdown to PDF Converter
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-2">Easy to Use</h3>
              <p>
                Simply paste or type your Markdown content and instantly see a live preview.
                Export to PDF or DOCX with one click. No signup or installation required.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Full Markdown Support</h3>
              <p>
                Supports all standard Markdown syntax including headings, bold, italic,
                code blocks, lists, blockquotes, tables, and links.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-2">Professional Output</h3>
              <p>
                Generate clean, professionally formatted PDF and DOCX documents
                perfect for documentation, reports, and presentations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Markdown to PDF Converter. Free online tool.
            </p>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  )
}
