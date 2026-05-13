import { ImageResponse } from "next/og"

export const runtime = "edge"
export const contentType = "image/png"

export function generateImageMetadata() {
  return [
    { id: "small",  size: { width: 32,  height: 32 },  contentType: "image/png" },
    { id: "medium", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "large",  size: { width: 512, height: 512 }, contentType: "image/png" },
  ]
}

export default async function Icon({ id }: { id: string }) {
  const dim = id === "small" ? 32 : id === "medium" ? 192 : 512
  const fontSize = Math.round(dim * 0.6)
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7c3aed",
          color: "white",
          fontSize,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          borderRadius: dim * 0.2,
        }}
      >
        M
      </div>
    ),
    { width: dim, height: dim },
  )
}
