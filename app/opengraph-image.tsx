import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Markdown to PDF Converter — Free Online Tool"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          padding: 80,
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2, display: "flex", alignItems: "center" }}>
          <span style={{ color: "#7c3aed" }}>Markdown</span>
          <span style={{ margin: "0 24px", opacity: 0.5 }}>→</span>
          <span>PDF</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 36, opacity: 0.85, textAlign: "center" }}>
          Free online converter with live preview
        </div>
        <div style={{ marginTop: 80, fontSize: 24, opacity: 0.5 }}>marktopdf.com</div>
      </div>
    ),
    { width: size.width, height: size.height },
  )
}
