# Tailwind Design System Guide

## Quick Start for Developers

### Using Our Predefined Colors

We have a set of semantic colors that automatically adapt to light/dark mode. Use these instead of hardcoding colors:

```html
<!-- Background & Text -->
<div className="bg-background text-foreground">Main content</div>
<div className="bg-muted text-muted-foreground">Secondary content</div>
<div className="bg-card text-card-foreground">Card container</div>

<!-- Borders & Dividers -->
<div className="border border-border">Box with border</div>
<hr className="border-border" />
```

### Available Semantic Colors

| Color Name                               | Usage                               | Example Classes                                 |
| ---------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| `background` / `foreground`              | Page background & main text         | `bg-background`, `text-foreground`              |
| `muted` / `muted-foreground`             | Subtle backgrounds & secondary text | `bg-muted`, `text-muted-foreground`             |
| `card` / `card-foreground`               | Card components                     | `bg-card`, `text-card-foreground`               |
| `primary` / `primary-foreground`         | Primary buttons & links             | `bg-primary`, `text-primary-foreground`         |
| `secondary` / `secondary-foreground`     | Secondary actions                   | `bg-secondary`, `text-secondary-foreground`     |
| `destructive` / `destructive-foreground` | Dangerous actions                   | `bg-destructive`, `text-destructive-foreground` |
| `accent` / `accent-foreground`           | Highlighted elements                | `bg-accent`, `text-accent-foreground`           |
| `border`                                 | All borders                         | `border-border`                                 |
| `input`                                  | Form inputs                         | `bg-input`                                      |
| `ring`                                   | Focus rings                         | `ring-ring`                                     |

### Real-World Examples

#### Card Component

```html
<div
  className="bg-card text-card-foreground border border-border rounded-lg p-4"
>
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-muted-foreground">Supporting text that's less prominent</p>
</div>
```

#### Form Input

```html
<input
  type="text"
  className="bg-input border border-border text-foreground px-3 py-2 rounded-md
             focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  placeholder="Enter text..."
/>
```

#### Alert/Destructive Action

```html
<div
  className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md"
>
  <p className="font-semibold">Warning!</p>
  <p>This action cannot be undone.</p>
</div>
```

## Adding New Colors

### Step 1: Define the HSL values in `app.css`

```css
:root {
  /* Add your custom color (HSL values only, no hsl() wrapper) */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
}

.dark {
  /* Dark mode version */
  --success: 142 76% 60%;
  --success-foreground: 0 0% 100%;
}
```

### Step 2: Map to Tailwind in the @theme block

```css
@theme inline {
  /* This makes it available as a Tailwind utility */
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
}
```

### Step 3: Use in your components

```html
<div className="bg-success text-success-foreground p-4 rounded-md">
  ✓ Operation successful!
</div>
```

## Best Practices

### ✅ DO

- Use semantic color names (`bg-primary` not `bg-blue-500`)
- Always pair background and foreground colors (`bg-card text-card-foreground`)
- Include focus states for all interactive elements
- Test in both light and dark modes

### ❌ DON'T

- Hardcode hex/rgb colors (`bg-[#1a73e8]`)
- Mix semantic and literal colors (`bg-primary text-gray-900`)
- Forget accessibility (focus rings, contrast ratios)
- Create one-off colors without adding to the theme

## How It Works (Technical Details)

1. **CSS Variables**: Define raw HSL values (`--ring: 199 89% 35%`)
2. **@theme Mapping**: Wrap in `hsl()` function (`--color-ring: hsl(var(--ring))`)
3. **Tailwind Classes**: Use via utility classes (`ring-ring`, `bg-primary`, etc.)

The double-layer system allows theme switching while keeping consistent class names.
