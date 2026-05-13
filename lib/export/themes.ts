export type ThemeId = "github" | "academic" | "minimal"

export interface ThemeStyle {
  bodyFont: { sans: string; serif: string; mono: string }
  body: { size: number; lineHeight: number }
  headings: { sizes: [number, number, number, number, number, number]; weight: "bold" | "semibold" }
  code: { size: number; bg: [number, number, number] }
  quote: { color: [number, number, number]; borderColor: [number, number, number] }
  hr: { color: [number, number, number] }
  table: { borderColor: [number, number, number]; headerBg: [number, number, number] }
  spacing: { paragraph: number; headingTop: [number, number, number, number, number, number] }
}

export const THEMES: Record<ThemeId, ThemeStyle> = {
  github: {
    bodyFont: { sans: "helvetica", serif: "times", mono: "courier" },
    body: { size: 11, lineHeight: 5 },
    headings: { sizes: [24, 18, 14, 12, 12, 12], weight: "bold" },
    code: { size: 9, bg: [244, 244, 244] },
    quote: { color: [100, 100, 100], borderColor: [200, 200, 200] },
    hr: { color: [200, 200, 200] },
    table: { borderColor: [200, 200, 200], headerBg: [230, 230, 230] },
    spacing: { paragraph: 2, headingTop: [0, 4, 3, 2, 2, 2] },
  },
  academic: {
    bodyFont: { sans: "helvetica", serif: "times", mono: "courier" },
    body: { size: 11, lineHeight: 5.5 },
    headings: { sizes: [22, 17, 14, 12, 12, 12], weight: "bold" },
    code: { size: 9, bg: [248, 248, 248] },
    quote: { color: [80, 80, 80], borderColor: [180, 180, 180] },
    hr: { color: [180, 180, 180] },
    table: { borderColor: [180, 180, 180], headerBg: [240, 240, 240] },
    spacing: { paragraph: 3, headingTop: [0, 6, 4, 3, 3, 3] },
  },
  minimal: {
    bodyFont: { sans: "helvetica", serif: "times", mono: "courier" },
    body: { size: 11, lineHeight: 6 },
    headings: { sizes: [22, 16, 13, 12, 12, 12], weight: "bold" },
    code: { size: 9, bg: [252, 252, 252] },
    quote: { color: [120, 120, 120], borderColor: [220, 220, 220] },
    hr: { color: [220, 220, 220] },
    table: { borderColor: [220, 220, 220], headerBg: [245, 245, 245] },
    spacing: { paragraph: 3, headingTop: [0, 5, 4, 3, 3, 3] },
  },
}

export type PageSize = "A4" | "Letter" | "Legal"
export type MarginPreset = "narrow" | "normal" | "wide"
export type FontFamily = "sans" | "serif" | "mono"
export type HeadingFontFamily = FontFamily | "match"
export type TocDepth = "off" | "h1-h2" | "h1-h3"
export type PageNumbers = "off" | "footer-center" | "footer-right"

export interface ExportSettings {
  pageSize: PageSize
  margin: MarginPreset
  theme: ThemeId
  bodyFont: FontFamily
  headingFont: HeadingFontFamily
  toc: TocDepth
  pageNumbers: PageNumbers
  coverPage: boolean
}

export const DEFAULT_SETTINGS: ExportSettings = {
  pageSize: "A4",
  margin: "normal",
  theme: "github",
  bodyFont: "sans",
  headingFont: "match",
  toc: "off",
  pageNumbers: "off",
  coverPage: false,
}

export const MARGIN_MM: Record<MarginPreset, number> = {
  narrow: 10,
  normal: 20,
  wide: 30,
}

export function resolveBodyFont(theme: ThemeStyle, family: FontFamily): string {
  return theme.bodyFont[family]
}

export function resolveHeadingFont(
  theme: ThemeStyle,
  body: FontFamily,
  heading: HeadingFontFamily,
): string {
  return theme.bodyFont[heading === "match" ? body : heading]
}
