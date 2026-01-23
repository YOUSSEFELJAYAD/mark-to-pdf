# Next.js + shadcn UI Component Templates

This folder contains reference implementations showing how to structure and compose shadcn UI components in this project.

## Files

| File | Purpose |
|------|---------|
| `page-showcase.tsx` | Example page composing multiple component examples |
| `components/example-wrapper.tsx` | Layout components for displaying examples (ExampleWrapper, Example) |
| `components/card-example.tsx` | Card with image overlay, AlertDialog, Badge, Button patterns |
| `components/form-example.tsx` | Form with Input, Select, Combobox, Textarea, and complex DropdownMenu |

## Key Patterns Demonstrated

### Component Composition
- Use `ExampleWrapper` for grid layouts displaying multiple examples
- Use `Example` with `title` prop to label individual component showcases

### Card with Image Overlay
```tsx
<Card className="relative overflow-hidden pt-0">
  <div className="bg-primary absolute inset-0 z-30 opacity-50 mix-blend-color" />
  <img className="relative z-20 grayscale" ... />
  <CardHeader>...</CardHeader>
</Card>
```

### Button with Icon
```tsx
<Button>
  <PlusIcon data-icon="inline-start" />  {/* Adjusts padding */}
  Label
</Button>
```

### Form Field Layout
```tsx
<FieldGroup>
  <div className="grid grid-cols-2 gap-4">
    <Field>
      <FieldLabel htmlFor="id">Label</FieldLabel>
      <Input id="id" />
    </Field>
  </div>
</FieldGroup>
```

### Combobox (Searchable Select)
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

### Nested DropdownMenu
```tsx
<DropdownMenuSub>
  <DropdownMenuSubTrigger>
    <Icon />
    Submenu Label
  </DropdownMenuSubTrigger>
  <DropdownMenuPortal>
    <DropdownMenuSubContent>
      {/* Submenu items */}
    </DropdownMenuSubContent>
  </DropdownMenuPortal>
</DropdownMenuSub>
```

### Checkbox/Radio in Dropdown
```tsx
<DropdownMenuCheckboxItem
  checked={state}
  onCheckedChange={(checked) => setState(checked === true)}
>
  <Icon />
  Label
</DropdownMenuCheckboxItem>

<DropdownMenuRadioGroup value={value} onValueChange={setValue}>
  <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

## Usage

These templates are for **reference only**. To use a pattern:

1. Read the relevant template file
2. Copy the pattern you need into your component
3. Adjust imports to use `@/components/ui/...` paths
4. Modify styling and content for your use case
