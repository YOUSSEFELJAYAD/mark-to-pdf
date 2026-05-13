"use client"

import * as React from "react"
import { read, write, STORAGE_KEYS } from "@/lib/storage"

export interface RecentDoc {
  id: string
  title: string
  preview: string
  updatedAt: number
  markdown: string
}

const MAX_RECENT = 5
const MAX_BYTES_PER_RECENT = 1_000_000

function hashString(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

function deriveTitle(markdown: string): string {
  const h1 = markdown.match(/^\s*#\s+(.+)$/m)
  if (h1) return h1[1].trim().slice(0, 80)
  const first = markdown.trim().split("\n")[0] || "Untitled"
  return first.slice(0, 40)
}

export function useRecentDocs() {
  const [recent, setRecent] = React.useState<RecentDoc[]>([])

  React.useEffect(() => {
    const stored = read<RecentDoc[]>(STORAGE_KEYS.recentDocs)
    if (stored) setRecent(stored)
  }, [])

  const push = React.useCallback((markdown: string) => {
    if (!markdown.trim()) return
    if (new Blob([markdown]).size > MAX_BYTES_PER_RECENT) return
    const id = hashString(markdown)
    const entry: RecentDoc = {
      id,
      title: deriveTitle(markdown),
      preview: markdown.trim().slice(0, 120),
      updatedAt: Date.now(),
      markdown,
    }
    setRecent((prev) => {
      const filtered = prev.filter((d) => d.id !== id)
      const next = [entry, ...filtered].slice(0, MAX_RECENT)
      write<RecentDoc[]>(STORAGE_KEYS.recentDocs, next)
      return next
    })
  }, [])

  const remove = React.useCallback((id: string) => {
    setRecent((prev) => {
      const next = prev.filter((d) => d.id !== id)
      write<RecentDoc[]>(STORAGE_KEYS.recentDocs, next)
      return next
    })
  }, [])

  const clear = React.useCallback(() => {
    setRecent([])
    write<RecentDoc[]>(STORAGE_KEYS.recentDocs, [])
  }, [])

  return { recent, push, remove, clear }
}
