"use client"

import * as React from "react"

interface AdSidebarProps {
  slot: string
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export function AdSidebar({ slot, className = "" }: AdSidebarProps) {
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

  if (!pubId) {
    return (
      <div className={`bg-muted/30 border border-dashed border-muted-foreground/30 rounded-lg p-4 text-center text-sm text-muted-foreground min-h-[250px] flex items-center justify-center ${className}`}>
        <span>Sidebar Ad</span>
      </div>
    )
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block ${className}`}
      style={{ display: "block", minHeight: "250px" }}
      data-ad-client={pubId}
      data-ad-slot={slot}
      data-ad-format="vertical"
      data-full-width-responsive="false"
    />
  )
}
