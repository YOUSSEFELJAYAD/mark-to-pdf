"use client"

import * as React from "react"
import { read, write, STORAGE_KEYS } from "@/lib/storage"
import { DEFAULT_SETTINGS, type ExportSettings } from "@/lib/export/themes"

export function useExportSettings() {
  const [settings, setSettings] = React.useState<ExportSettings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    const stored = read<ExportSettings>(STORAGE_KEYS.exportSettings)
    if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored })
    setHydrated(true)
  }, [])

  const update = React.useCallback((partial: Partial<ExportSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      write<ExportSettings>(STORAGE_KEYS.exportSettings, next)
      return next
    })
  }, [])

  const reset = React.useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    write<ExportSettings>(STORAGE_KEYS.exportSettings, DEFAULT_SETTINGS)
  }, [])

  return { settings, update, reset, hydrated }
}
