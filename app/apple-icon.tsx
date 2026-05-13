import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default async function AppleIcon() {
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
          fontSize: 108,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        M
      </div>
    ),
    { width: size.width, height: size.height },
  )
}
