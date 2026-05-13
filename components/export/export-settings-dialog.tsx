"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type {
  ExportSettings,
  PageSize,
  MarginPreset,
  ThemeId,
  FontFamily,
  HeadingFontFamily,
  TocDepth,
  PageNumbers,
} from "@/lib/export/themes"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: ExportSettings
  onChange: (partial: Partial<ExportSettings>) => void
  onReset: () => void
}

function RadioGroup<T extends string>({
  testIdPrefix,
  value,
  onChange,
  options,
}: {
  testIdPrefix: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <Button
          key={opt.value}
          type="button"
          variant={value === opt.value ? "secondary" : "outline"}
          size="sm"
          data-testid={`${testIdPrefix}-${opt.value}`}
          onClick={() => onChange(opt.value)}
          className={cn("h-8")}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}

export function ExportSettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
  onReset,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Export settings</AlertDialogTitle>
          <AlertDialogDescription>
            Tune how your PDF/DOCX is generated. Preview is approximate; PDF output may differ slightly.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Page</Label>
            <RadioGroup<PageSize>
              testIdPrefix="opt-pagesize"
              value={settings.pageSize}
              onChange={(v) => onChange({ pageSize: v })}
              options={[
                { value: "A4", label: "A4" },
                { value: "Letter", label: "Letter" },
                { value: "Legal", label: "Legal" },
              ]}
            />
            <RadioGroup<MarginPreset>
              testIdPrefix="opt-margin"
              value={settings.margin}
              onChange={(v) => onChange({ margin: v })}
              options={[
                { value: "narrow", label: "Narrow" },
                { value: "normal", label: "Normal" },
                { value: "wide", label: "Wide" },
              ]}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Typography</Label>
            <RadioGroup<ThemeId>
              testIdPrefix="opt-theme"
              value={settings.theme}
              onChange={(v) => onChange({ theme: v })}
              options={[
                { value: "github", label: "GitHub" },
                { value: "academic", label: "Academic" },
                { value: "minimal", label: "Minimal" },
              ]}
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">Body font</Label>
                <Select
                  value={settings.bodyFont}
                  onValueChange={(v) => onChange({ bodyFont: v as FontFamily })}
                >
                  <SelectTrigger data-testid="opt-bodyfont"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Heading font</Label>
                <Select
                  value={settings.headingFont}
                  onValueChange={(v) => onChange({ headingFont: v as HeadingFontFamily })}
                >
                  <SelectTrigger data-testid="opt-headingfont"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match body</SelectItem>
                    <SelectItem value="sans">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Mono</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Extras</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Table of contents</Label>
                <Select value={settings.toc} onValueChange={(v) => onChange({ toc: v as TocDepth })}>
                  <SelectTrigger data-testid="opt-toc"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="h1-h2">H1–H2</SelectItem>
                    <SelectItem value="h1-h3">H1–H3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Page numbers</Label>
                <Select
                  value={settings.pageNumbers}
                  onValueChange={(v) => onChange({ pageNumbers: v as PageNumbers })}
                >
                  <SelectTrigger data-testid="opt-pagenums"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="footer-center">Footer center</SelectItem>
                    <SelectItem value="footer-right">Footer right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="cover-page"
                type="checkbox"
                data-testid="opt-coverpage"
                checked={settings.coverPage}
                onChange={(e) => onChange({ coverPage: e.target.checked })}
                className="size-4"
              />
              <Label htmlFor="cover-page" className="text-sm">
                Include cover page (uses first H1 as title)
              </Label>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="flex items-center justify-between sm:justify-between">
          <Button type="button" variant="outline" onClick={onReset} data-testid="opt-reset">
            Reset to defaults
          </Button>
          <AlertDialogAction onClick={() => onOpenChange(false)}>Done</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
