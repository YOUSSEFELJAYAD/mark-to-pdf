const STORAGE_VERSION = 1

interface Envelope<T> {
  v: number
  data: T
}

export function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Envelope<T>
    if (parsed.v !== STORAGE_VERSION) return null
    return parsed.data
  } catch {
    return null
  }
}

export function write<T>(key: string, data: T): boolean {
  if (typeof window === "undefined") return false
  const envelope: Envelope<T> = { v: STORAGE_VERSION, data }
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope))
    return true
  } catch {
    return false
  }
}

export function remove(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* swallow */
  }
}

export const STORAGE_KEYS = {
  currentDoc: "mark-to-pdf:doc:current",
  recentDocs: "mark-to-pdf:doc:recent",
  exportSettings: "mark-to-pdf:export-settings",
} as const

export const ACCEPTED_EXTENSIONS = [".md", ".markdown", ".txt"] as const
export const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

export function isAcceptedFile(file: File): boolean {
  if (file.size > MAX_FILE_BYTES) return false
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export function basenameWithoutExt(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "")
  return base.replace(/\.[^.]+$/, "") || base
}

export function slugifyForFilename(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "document"
  )
}
