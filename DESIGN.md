# DESIGN.md — Diploma Tracking System (DTS)

> **Status**: Active · **Spec**: Google Labs Apache-2.0 DESIGN.md format
> **Brand**: Universidad Nacional de Córdoba (UNC) · **Stack**: React 19 + Vite 6 + MUI v7
> **Theme mode**: Light (default), Dark (optional)

---

## Design Tokens

### Color Palette

| Token                | Hex       | CSS Variable              | Usage                            |
| -------------------- | --------- | ------------------------- | -------------------------------- |
| `primary.main`       | `#7c3aed` | `--color-primary`         | Primary actions, headings, brand |
| `primary.light`      | `#a78bfa` | `--color-primary-light`   | Hover states, secondary emphasis |
| `primary.dark`       | `#5b21b6` | `--color-primary-dark`    | Active states, footer            |
| `secondary.main`     | `#0f172a` | `--color-secondary`       | Text, icons, borders             |
| `secondary.light`    | `#334155` | `--color-secondary-light` | Muted text, captions             |
| `background.default` | `#f8fafc` | `--color-bg`              | Page background                  |
| `background.paper`   | `#ffffff` | `--color-surface`         | Cards, dialogs, sheets           |
| `error.main`         | `#dc2626` | `--color-error`           | Validation, destructive actions  |
| `warning.main`       | `#f59e0b` | `--color-warning`         | Alerts, eligibility warnings     |
| `success.main`       | `#059669` | `--color-success`         | Completion badges, passed status |
| `info.main`          | `#2563eb` | `--color-info`            | Information banners              |
| `divider`            | `#e2e8f0` | `--color-divider`         | Separators, borders              |

### Typography

| Token     | Font Family         | Size            | Weight | Line Height |
| --------- | ------------------- | --------------- | ------ | ----------- |
| `h1`      | Segoe UI, system-ui | 2rem / 32px     | 700    | 1.2         |
| `h2`      | Segoe UI, system-ui | 1.5rem / 24px   | 600    | 1.3         |
| `h3`      | Segoe UI, system-ui | 1.25rem / 20px  | 600    | 1.4         |
| `h4`      | Segoe UI, system-ui | 1.125rem / 18px | 600    | 1.4         |
| `body1`   | Segoe UI, system-ui | 1rem / 16px     | 400    | 1.6         |
| `body2`   | Segoe UI, system-ui | 0.875rem / 14px | 400    | 1.5         |
| `caption` | Segoe UI, system-ui | 0.75rem / 12px  | 400    | 1.4         |
| `code`    | Consolas, monospace | 0.875rem / 14px | 400    | 1.5         |

### Spacing (4px base grid)

| Token | Value | Usage                              |
| ----- | ----- | ---------------------------------- |
| `xs`  | 4px   | Icon padding, tight gaps           |
| `sm`  | 8px   | Form field gaps, list item padding |
| `md`  | 16px  | Card padding, section gaps         |
| `lg`  | 24px  | Page margins, modal padding        |
| `xl`  | 32px  | Hero sections, major separations   |
| `2xl` | 48px  | Landing page blocks                |

### Border Radius

| Token  | Value  | Usage                            |
| ------ | ------ | -------------------------------- |
| `sm`   | 4px    | Inputs, chips, small buttons     |
| `md`   | 8px    | Cards, dialogs, standard buttons |
| `lg`   | 12px   | Modals, large containers         |
| `full` | 9999px | Pills, badges, avatar            |

### Shadow

| Token | Value                         | Usage                    |
| ----- | ----------------------------- | ------------------------ |
| `sm`  | `0 1px 2px rgba(0,0,0,0.05)`  | Cards (default)          |
| `md`  | `0 4px 6px rgba(0,0,0,0.07)`  | Cards (hover), dropdowns |
| `lg`  | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dialogs          |

### Breakpoints

| Token | Width  | Usage              |
| ----- | ------ | ------------------ |
| `xs`  | 0px    | Mobile (portrait)  |
| `sm`  | 600px  | Mobile (landscape) |
| `md`  | 900px  | Tablet             |
| `lg`  | 1200px | Desktop            |
| `xl`  | 1536px | Large desktop      |

---

## Component Primitives

### Buttons

| Variant               | Usage                                | Style                               |
| --------------------- | ------------------------------------ | ----------------------------------- |
| `contained` (primary) | Primary actions: login, submit, save | Purple fill, white text, 8px radius |
| `outlined`            | Secondary actions: cancel, back      | Purple border, transparent fill     |
| `text`                | Tertiary: language switch, help      | No border, purple text on hover     |

All buttons: `textTransform: none`, `fontWeight: 600`, `borderRadius: 8`.

### Text Fields

| State    | Border    | Background |
| -------- | --------- | ---------- |
| Default  | `#e2e8f0` | `#ffffff`  |
| Focus    | `#7c3aed` | `#ffffff`  |
| Error    | `#dc2626` | `#fef2f2`  |
| Disabled | `#e2e8f0` | `#f1f5f9`  |

Default: `variant: outlined`, `size: small`.

### Cards

| Property       | Value                        |
| -------------- | ---------------------------- |
| Background     | `#ffffff`                    |
| Border radius  | 12px                         |
| Shadow (idle)  | `0 1px 2px rgba(0,0,0,0.05)` |
| Shadow (hover) | `0 4px 6px rgba(0,0,0,0.07)` |
| Padding        | 16px (md)                    |

### Status Badges

| Status         | Color               | Style                  |
| -------------- | ------------------- | ---------------------- |
| `completado`   | `#059669` (success) | Green chip, white text |
| `en progreso`  | `#2563eb` (info)    | Blue chip, white text  |
| `pendiente`    | `#f59e0b` (warning) | Amber chip, dark text  |
| `inhabilitado` | `#dc2626` (error)   | Red chip, white text   |
| `habilitado`   | `#059669` (success) | Green chip, white text |

### Progress Bars

| Property      | Value               |
| ------------- | ------------------- |
| Track color   | `#e2e8f0` (divider) |
| Fill color    | `#7c3aed` (primary) |
| Height        | 8px                 |
| Border radius | 4px                 |

---

## Navigation

- **Top app bar**: Fixed, purple gradient (`#7c3aed` → `#5b21b6`), 56px height
- **Sidebar**: 240px width, collapsible on mobile (breakpoint `md`)
- **Sidebar items**: Icon + label, active state with purple left border (3px)
- **Breadcrumbs**: Not used (single-page dashboard layout)

---

## Iconography

- **Provider**: Material Icons (MUI default — `@mui/icons-material`)
- **Style**: Outlined variant (`fontSize: 'small'` for sidebar, `'medium'` for cards)
- **Key icons**: `Dashboard`, `Description`, `School`, `Settings`, `IntegrationInstructions`, `AdminPanelSettings`, `CheckCircle`, `Cancel`, `Warning`, `Info`

---

## Accessibility

- **Color contrast**: All text/background combos meet WCAG AA (4.5:1 minimum)
- **Focus indicators**: Purple outline on keyboard focus (`outline: 2px solid #7c3aed`)
- **Touch targets**: Minimum 44x44px for interactive elements (MUI default)
- **i18n**: Spanish default (`es-AR`), English toggle via LanguageSwitcher

---

## MUI Theme Configuration

```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
    secondary: { main: '#0f172a', light: '#334155' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    error: { main: '#dc2626' },
    warning: { main: '#f59e0b' },
    success: { main: '#059669' },
    info: { main: '#2563eb' },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
  },
  shape: { borderRadius: 8 },
  spacing: 4,
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontWeight: 500 },
      },
    },
  },
});
```

---

> _Generated by `/design-system` skill · Google Labs Apache-2.0 format · UNC · 2026-08-11_
