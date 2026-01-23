"use client"

import * as React from "react"

interface AdBannerProps {
  slot: string
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal"
  responsive?: boolean
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function AdBanner({
  slot,
  format = "auto",
  responsive = true,
  className = ""
}: AdBannerProps) {
  const adRef = React.useRef<HTMLModElement>(null)
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID

  React.useEffect(() => {
    if (!pubId) return

    try {
      if (adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error("AdSense error:", error)
    }
  }, [pubId])

  // Show placeholder only if not configured
  if (!pubId) {
    return (
      <div className={`bg-muted/30 border border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-sm text-muted-foreground ${className}`}>
        <span>Ad Space - Configure NEXT_PUBLIC_ADSENSE_PUB_ID</span>
      </div>
    )
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block ${className}`}
      style={{ display: "block", minHeight: "90px" }}
      data-ad-client={pubId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  )
}
