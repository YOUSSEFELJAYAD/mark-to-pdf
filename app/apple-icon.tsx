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
          backgroundImage: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
        }}
      >
        <svg
          width={113}
          height={90}
          viewBox="0 0 40 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 28 V4 L20 22 L36 4 V28"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { width: size.width, height: size.height },
  )
}
