# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js application for converting Markdown to PDF. Currently in early development with the UI foundation established using shadcn components.

## Development Commands

```bash
# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Tech Stack

- **Framework:** Next.js 16.1 with App Router (React 19)
- **Styling:** Tailwind CSS v4 with OKLCH color system
- **UI Components:** shadcn (using @base-ui/react, radix-ui primitives)
- **Icons:** lucide-react
- **Utilities:** clsx + tailwind-merge (via `cn()` helper in `lib/utils.ts`)

## Project Structure

```
mark-to-pdf/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with fonts (Geist, Inter)
│   ├── page.tsx            # Home page
│   └── globals.css         # Tailwind + shadcn theme (OKLCH colors)
├── components/
│   ├── ui/                 # shadcn primitives (button, card, input, etc.)
│   └── [feature]/          # Feature-specific components
├── lib/
│   └── utils.ts            # cn() helper for className merging
└── .claude/
    └── nextjs/template/    # Reference implementations (see below)
```

## Component Templates Reference

Reference implementations are stored in `.claude/nextjs/template/`. Use these as patterns when building new features.

| Template | Patterns Demonstrated |
|----------|----------------------|
| `components/example-wrapper.tsx` | Layout wrappers, data-slot attributes, cn() usage |
| `components/card-example.tsx` | Card + image overlay, AlertDialog, Badge, Button with icons |
| `components/form-example.tsx` | Form layout (FieldGroup/Field), Input, Select, Combobox, Textarea, nested DropdownMenu with checkboxes/radios |
| `page-showcase.tsx` | Page composition pattern |

### Quick Pattern Reference

**Button with icon:**
```tsx
<Button>
  <PlusIcon data-icon="inline-start" />
  Label
</Button>
```

**Form field:**
```tsx
<Field>
  <FieldLabel htmlFor="id">Label</FieldLabel>
  <Input id="id" placeholder="..." />
</Field>
```

**Combobox (searchable select):**
```tsx
<Combobox items={items}>
  <ComboboxInput placeholder="Select..." />
  <ComboboxContent>
    <ComboboxEmpty>No results.</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>
```

See `.claude/nextjs/template/README.md` for complete documentation.

## Conventions

### Component Patterns
- Use `"use client"` directive only when needed (interactivity, hooks)
- shadcn components use `data-slot` attributes for styling hooks
- Use `cn()` from `@/lib/utils` for conditional classNames
- Components use `class-variance-authority` (cva) for variant patterns

### Path Aliases
- `@/*` maps to project root (e.g., `@/components/ui/button`)

### Styling
- Theme colors defined as CSS variables in `globals.css` (both light and dark)
- Colors use OKLCH color space
- Dark mode via `.dark` class on ancestor element
