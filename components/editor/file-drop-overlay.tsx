"use client"

import * as React from "react"
import { FileUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  active: boolean
}

export function FileDropOverlay({ active }: Props) {
  if (!active) return null
  return (
    <div
      data-testid="file-drop-overlay"
      className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-center justify-center",
        "rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm",
      )}
    >
      <div className="flex flex-col items-center gap-2 text-primary">
        <FileUp className="size-8" />
        <span className="font-medium">Drop .md, .markdown, or .txt file</span>
      </div>
    </div>
  )
}
