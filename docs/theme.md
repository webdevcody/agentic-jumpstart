# Admin Theme Design Patterns

## Layout & Structure

**Page Container:**
- Minimum height screen with background gradient: `min-h-screen bg-background`
- Subtle gradient overlay: `bg-gradient-to-br from-background via-theme-50/5 to-theme-100/10 dark:from-background dark:via-theme-950/10 dark:to-theme-900/20`
- Container: `container mx-auto px-6 py-20 pt-8 max-w-7xl`

**Page Headers:**
- Large titles: `text-4xl font-bold mb-4`
- Highlighted words: `text-gradient` class for theme gradients
- Descriptions: `text-description max-w-2xl`

## Color Scheme

**Primary Theme Colors:**
- Primary buttons: `bg-theme-600 text-white hover:bg-theme-600`
- Theme accents: `text-theme-500 dark:text-theme-400`
- Theme backgrounds: `bg-theme-500/10 dark:bg-theme-400/20`
- Selected states: `bg-theme-500 text-white`

**Status Colors:**
- Blue: `text-blue-500 dark:text-blue-400`, `bg-blue-500/10 dark:bg-blue-400/20`
- Green: `text-green-500 dark:text-green-400`, `bg-green-500/10 dark:bg-green-400/20`
- Orange: `text-orange-500 dark:text-orange-400`, `bg-orange-500/10 dark:bg-orange-400/20`
- Purple: `text-purple-500 dark:text-purple-400`, `bg-purple-500/10 dark:bg-purple-400/20`

**Background Colors:**
- Card hover states: `hover:bg-muted/50`
- Subtle backgrounds: `bg-muted/30`, `bg-muted/20`, `bg-muted/10`
- Table stripes: `bg-muted/10` for alternate rows

## Cards

**Module Cards:** Use `module-card` class for consistent styling
- Main cards: `module-card` with `border-b border-border/50` headers
- Stats cards: `module-card p-6 h-full`
- Hover effects: `hover:bg-muted/50 transition-colors`

**Card Headers:**
- Border separation: `border-b border-border/50`
- Icon + title pattern: Icons 24x24 (`h-6 w-6`) with theme colors
- Standard padding: `p-6`

## Buttons

**Primary Button:**
- Default: `bg-theme-600 text-white hover:shadow-elevation-3`
- Ghost variant: `hover:bg-theme-600 hover:text-white`
- Outline variant: `border border-theme-200 hover:bg-theme-100 hover:text-theme-700`

**Icon Buttons:**
- Size: `h-8 w-8` or `h-9 w-9`
- Ghost style for actions: `variant="ghost" size="sm"`

**Filter/Tab Buttons:**
- Active: `bg-theme-500 text-white`
- Inactive: `bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground`

## Tabs

**Tab Containers:**
- Background: `bg-gradient-to-r from-theme-50/50 to-theme-100/30 dark:from-theme-950/30 dark:to-theme-900/20`
- Border: `border border-theme-200/40 dark:border-theme-800/40`
- Padding: `p-1` with `rounded-lg`

**Tab Triggers:**
- Active state: `data-[state=active]:bg-gradient-to-r data-[state=active]:from-theme-500 data-[state=active]:to-theme-600 data-[state=active]:text-white`
- Hover: `hover:text-theme-700 dark:hover:text-theme-300`
- Shadow on active: `data-[state=active]:shadow-elevation-2`

## Lists & Tables

**List Items:**
- Container: `p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors`
- Ranking badges: Circular `w-8 h-8 rounded-full bg-[color]-500/10` with colored text

**Table Styling:**
- Header: `bg-muted/30`
- Row hover: `hover:bg-muted/20 transition-colors`
- Alternating rows: `bg-muted/10` for even rows
- Cell padding: `p-4`

## Spacing & Animations

**Grid Layouts:**
- Stats: `grid gap-6 md:grid-cols-2 lg:grid-cols-4`
- Content: `grid gap-6 lg:grid-cols-2`
- Spacing between sections: `mb-12`

**Animations:**
- Fade in: `animate-in fade-in slide-in-from-bottom-2 duration-500`
- Staggered delays: `animationDelay: "0.1s"` increments
- Loading skeletons: `animate-pulse` with `bg-muted/50`

## Typography

**Headings:**
- Page title: `text-4xl font-bold`
- Section titles: `text-2xl font-semibold`
- Card titles: `text-lg font-semibold`
- Large stats: `text-3xl font-bold`

**Text Colors:**
- Primary: `text-foreground`
- Secondary: `text-muted-foreground`
- Links: `hover:text-theme-600 dark:hover:text-theme-400`

## Spacing System

**Padding:**
- Page container: `px-6 py-20 pt-8`
- Card content: `p-6`
- List items: `p-3`
- Table cells: `p-4`

**Margins:**
- Section spacing: `mb-12`
- Element spacing: `mb-6`, `mb-4`, `mb-2`
- Component gaps: `gap-6`, `gap-4`, `gap-3`, `gap-2`