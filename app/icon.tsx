import { ImageResponse } from "next/og"

export const runtime = "nodejs"
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
          borderRadius: dim * 0.225,
        }}
      >
        <svg
          width={dim * 0.625}
          height={dim * 0.5}
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
    { width: dim, height: dim },
  )
}
