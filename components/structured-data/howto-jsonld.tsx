import { safeJsonLd } from "@/lib/seo/json-ld"

const HOWTO_JSONLD = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to convert Markdown to PDF",
  description: "Convert Markdown text to a downloadable PDF or DOCX file in four steps.",
  totalTime: "PT1M",
  tool: [{ "@type": "HowToTool", name: "Web browser" }],
  step: [
    { "@type": "HowToStep", name: "Open the converter", text: "Visit marktopdf.com — no signup required." },
    { "@type": "HowToStep", name: "Paste or type your Markdown", text: "Use the editor on the left. Live preview appears on the right." },
    { "@type": "HowToStep", name: "Choose your output format", text: "Select PDF or DOCX from the format dropdown. Customize page size, theme, and other settings via the gear icon." },
    { "@type": "HowToStep", name: "Export", text: "Click Export. Your file downloads instantly." },
  ],
}

export function HowToJsonLd() {
  return <script type="application/ld+json">{safeJsonLd(HOWTO_JSONLD)}</script>
}
