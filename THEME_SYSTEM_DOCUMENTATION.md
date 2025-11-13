# Conductor Platform Theme System

## Overview

The Conductor Platform Theme System is a comprehensive, production-ready theming solution that allows users to fully customize the appearance of the Conductor application. The system uses CSS variables for dynamic styling and React Context for state management.

## Features

### Core Features
- **Live Theme Editing**: Changes apply instantly as you modify theme properties
- **6 Built-in Presets**: Default Dark, Light, High Contrast, Cyberpunk, Ocean, Forest
- **Live Preview**: See changes before saving with a dedicated preview pane
- **Import/Export**: Download and share themes as JSON files
- **Undo/Redo**: Full history management for theme changes
- **Persistence**: Themes are saved per-user in the database
- **Type-Safe**: Full TypeScript support with interfaces

### Customization Categories
1. **Typography**: Fonts, sizes, weights, colors
2. **Colors**: Primary, secondary, accent, danger, success, warning, info
3. **Buttons**: Background, text, borders, hover states, border radius
4. **Cards**: Background, borders, shadows, padding
5. **Inputs**: Colors, borders, focus states
6. **Badges**: Styling for status indicators
7. **Navigation**: Background, colors, active states
8. **Layout**: Page backgrounds, container widths, spacing

## Architecture

### File Structure

```
/lib/platform-theme/
├── index.ts                 # Main exports
├── types.ts                 # TypeScript interfaces
├── apply-theme.ts           # CSS variable generation
├── context.tsx              # React context & state management
└── presets.ts               # Built-in theme presets

/components/
├── theme-provider.tsx       # Root theme provider wrapper
├── theme-preview.tsx        # Live preview component
├── theme-import-export.tsx  # Import/export functionality
└── appearance-settings.tsx  # Settings page UI

/components/ui/
├── button.tsx               # Updated to use CSS variables
├── card.tsx                 # Updated to use CSS variables
├── input.tsx                # Updated to use CSS variables
└── nav.tsx                  # Updated to use CSS variables

/app/
├── layout.tsx               # Root layout with ThemeProvider
└── settings/page.tsx        # Settings page with appearance tab
```

### How It Works

1. **Theme Loading**: On app load, `ThemeContextProvider` fetches the user's theme from `/api/platform-theme`
2. **CSS Variable Generation**: `applyThemeToDocument()` creates a `<style>` tag with CSS variables
3. **Component Consumption**: UI components use `var(--conductor-*)` for styling
4. **Real-time Updates**: Changes to theme state immediately update CSS variables
5. **Persistence**: Save button commits changes to the database

## Usage

### Using the Theme System in Components

All UI components should use CSS variables for styling:

```tsx
// Button component
<button
  style={{
    backgroundColor: 'var(--conductor-button-primary-bg)',
    color: 'var(--conductor-button-primary-text)',
    borderRadius: 'var(--conductor-button-radius)',
  }}
>
  Click Me
</button>

// Card component
<div
  style={{
    backgroundColor: 'var(--conductor-card-background)',
    border: '1px solid var(--conductor-card-border)',
    borderRadius: 'var(--conductor-card-radius)',
  }}
>
  Content
</div>
```

### Accessing Theme Context

```tsx
import { useTheme } from '@/lib/platform-theme'

function MyComponent() {
  const {
    theme,              // Current theme object
    setTheme,           // Update theme
    saveTheme,          // Save to database
    resetTheme,         // Reset to default
    loading,            // Loading state
    error,              // Error message
    canUndo,            // Can undo?
    canRedo,            // Can redo?
    undo,               // Undo last change
    redo,               // Redo undone change
    previewTheme,       // Show preview
    clearPreview,       // Hide preview
    isPreview,          // Is preview active?
  } = useTheme()

  return (
    <div>
      <button onClick={() => setTheme(newTheme)}>Change Theme</button>
      <button onClick={saveTheme}>Save</button>
      <button onClick={undo} disabled={!canUndo}>Undo</button>
    </div>
  )
}
```

### Creating Custom Themes

```typescript
import { PlatformTheme } from '@/lib/platform-theme'

const myCustomTheme: PlatformTheme = {
  id: 'my-custom-theme',
  name: 'My Custom Theme',
  typography: {
    titleFont: 'Georgia, serif',
    titleSize: '2rem',
    titleWeight: '700',
    titleColor: '#ffffff',
    // ... other typography properties
  },
  colors: {
    primary: '#ff6b6b',
    primaryHover: '#ee5a6f',
    // ... other color properties
  },
  // ... other theme properties
}

// Apply the theme
setTheme(myCustomTheme)
```

## Available CSS Variables

### Typography
- `--conductor-title-font`: Title font family
- `--conductor-title-size`: Title font size
- `--conductor-title-weight`: Title font weight
- `--conductor-title-color`: Title text color
- `--conductor-body-font`: Body font family
- `--conductor-body-size`: Body font size
- `--conductor-body-weight`: Body font weight
- `--conductor-body-color`: Body text color
- `--conductor-muted-color`: Muted/secondary text color
- `--conductor-line-height`: Default line height

### Colors
- `--conductor-primary`: Primary brand color
- `--conductor-primary-hover`: Primary hover state
- `--conductor-secondary`: Secondary color
- `--conductor-secondary-hover`: Secondary hover state
- `--conductor-accent`: Accent color
- `--conductor-accent-hover`: Accent hover state
- `--conductor-danger`: Danger/error color
- `--conductor-danger-hover`: Danger hover state
- `--conductor-success`: Success color
- `--conductor-success-hover`: Success hover state
- `--conductor-warning`: Warning color
- `--conductor-warning-hover`: Warning hover state
- `--conductor-info`: Info color
- `--conductor-info-hover`: Info hover state

### Buttons
- `--conductor-button-radius`: Border radius
- `--conductor-button-border-width`: Border width
- `--conductor-button-primary-bg`: Primary button background
- `--conductor-button-primary-text`: Primary button text
- `--conductor-button-primary-border`: Primary button border
- `--conductor-button-primary-hover-bg`: Primary button hover background
- `--conductor-button-secondary-bg`: Secondary button background
- `--conductor-button-secondary-text`: Secondary button text
- `--conductor-button-secondary-border`: Secondary button border
- `--conductor-button-secondary-hover-bg`: Secondary button hover background
- `--conductor-button-font-size`: Button font size
- `--conductor-button-font-weight`: Button font weight

### Cards
- `--conductor-card-background`: Card background color
- `--conductor-card-border`: Card border color
- `--conductor-card-radius`: Card border radius
- `--conductor-card-border-width`: Card border width
- `--conductor-card-shadow`: Card box shadow
- `--conductor-card-hover-shadow`: Card hover box shadow
- `--conductor-card-padding`: Card inner padding

### Inputs
- `--conductor-input-background`: Input background color
- `--conductor-input-border`: Input border color
- `--conductor-input-radius`: Input border radius
- `--conductor-input-border-width`: Input border width
- `--conductor-input-text`: Input text color
- `--conductor-input-placeholder`: Input placeholder color
- `--conductor-input-focus-border`: Input focus border color
- `--conductor-input-focus-shadow`: Input focus box shadow

### Navigation
- `--conductor-nav-background`: Navigation background color
- `--conductor-nav-border`: Navigation border color
- `--conductor-nav-item-color`: Nav item text color
- `--conductor-nav-item-hover-bg`: Nav item hover background
- `--conductor-nav-item-active-bg`: Nav item active background
- `--conductor-nav-item-active-color`: Nav item active text color

### Layout
- `--conductor-page-background`: Page background color
- `--conductor-container-max-width`: Container max width
- `--conductor-border-radius`: Default border radius
- `--conductor-spacing`: Default spacing unit

## API Endpoints

### GET /api/platform-theme
Fetches the current user's theme

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "custom-theme",
    "name": "My Theme",
    "typography": { ... },
    "colors": { ... },
    // ... other properties
  }
}
```

### PATCH /api/platform-theme
Updates the current user's theme

**Request Body:**
```json
{
  "id": "custom-theme",
  "name": "My Theme",
  "typography": { ... },
  "colors": { ... },
  // ... other properties
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* saved theme */ }
}
```

### DELETE /api/platform-theme
Resets to default theme

**Response:**
```json
{
  "success": true,
  "data": { /* default theme */ }
}
```

## Database Schema

```sql
CREATE TABLE platform_theme_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Theme Presets

### 1. Default Dark
Classic dark mode with blue accents. Professional and easy on the eyes.

### 2. Light
Clean light mode for daylight use. High contrast and clear.

### 3. High Contrast
Maximum accessibility with strong borders and contrast ratios. WCAG AAA compliant.

### 4. Cyberpunk
Neon colors with sharp edges. Futuristic aesthetic with magenta and cyan.

### 5. Ocean Depths
Cool blue palette inspired by the ocean. Calming and professional.

### 6. Forest Canopy
Green nature-inspired theme. Earthy and organic feel.

## Best Practices

### 1. Always Use CSS Variables
```tsx
// Good
<div style={{ color: 'var(--conductor-body-color)' }}>Text</div>

// Bad
<div style={{ color: '#e5e5e5' }}>Text</div>
```

### 2. Provide Fallbacks in Global CSS
```css
:root {
  --conductor-primary: #3b82f6; /* Default fallback */
}
```

### 3. Test with Multiple Themes
Always test your components with different theme presets to ensure they work correctly.

### 4. Respect User Preferences
The theme system is user-specific. Don't override user themes without explicit consent.

### 5. Use Semantic Variables
Use semantic variable names (e.g., `--conductor-danger`) rather than specific colors.

## Troubleshooting

### Theme Changes Don't Apply
1. Check browser DevTools to verify CSS variables are being set
2. Ensure `ThemeProvider` wraps your app in layout.tsx
3. Clear browser cache and reload

### Components Don't Respect Theme
1. Verify component uses CSS variables, not hardcoded values
2. Check for Tailwind classes that might override inline styles
3. Use `!important` sparingly and only when necessary

### Theme Not Persisting
1. Check user is authenticated
2. Verify database table exists and has correct permissions
3. Check network tab for API errors

### Import/Export Issues
1. Verify JSON structure matches `PlatformTheme` interface
2. Check browser console for parsing errors
3. Ensure all required fields are present

## Performance Considerations

- **CSS Variable Updates**: Very fast, no re-render required
- **Context Updates**: Only components using `useTheme()` re-render
- **Database Saves**: Debounced to prevent excessive writes
- **Preview Mode**: Uses temporary CSS variables, no database writes

## Future Enhancements

Potential improvements for future versions:

1. **Theme Marketplace**: Share themes with the community
2. **Smart Contrast**: Automatically adjust colors for accessibility
3. **Animation Presets**: Customize transition speeds and easing
4. **Dark Mode Toggle**: Quick switch between light/dark variants
5. **Color Palette Generator**: AI-powered color scheme suggestions
6. **Theme Scheduling**: Auto-switch themes based on time of day
7. **Gradient Backgrounds**: Support for gradient backgrounds
8. **Font Pairing**: Suggested font combinations
9. **CSS Export**: Export theme as standalone CSS file
10. **Theme Inheritance**: Create themes based on existing ones

## Contributing

When adding new themeable elements:

1. Add CSS variables to `apply-theme.ts`
2. Add properties to `PlatformTheme` interface in `types.ts`
3. Update default theme and presets in `presets.ts`
4. Update component to use new CSS variables
5. Update this documentation

## Support

For issues or questions:
- Check this documentation first
- Review the code in `/lib/platform-theme/`
- Test with different theme presets
- Check browser console for errors
- Verify database connectivity

---

**Version**: 1.0.0
**Last Updated**: 2025-11-13
**Maintainer**: Conductor Team
