# UI Style Guide

## Design Philosophy

NOEMI embodies luxury wellness through elegant, functional design. The interface should feel premium, calming, and trustworthy while maintaining accessibility and usability.

## Color Palette

### Primary Colors

- **Gold**: `#C6A25A` - Primary brand color for CTAs and accents
- **Gold Light**: `#E6C478` - Highlights and hover states
- **Gold Dark**: `#A5843A` - Pressed states and borders

### Text Colors

- **Primary Text**: `#1a2a4a` - Main body text
- **Secondary Text**: `#5a4333` - Headings and important text
- **Muted Text**: `#8B7355` - Captions and helper text

### Surface Colors

- **Surface**: `rgba(255, 255, 255, 0.85)` - Card backgrounds
- **Surface Elevated**: `rgba(255, 255, 255, 0.95)` - Modal/elevated content

## Typography

### Font Families

- **Serif**: `'Playfair Display'` - Headlines, titles, luxury touch
- **Sans-Serif**: `'Inter'` - Body text, UI elements, readability

### Usage Guidelines

- Use serif fonts for titles, questions, and branding elements
- Use sans-serif for UI controls, body text, and buttons
- Maintain 1.3-1.5 line height for readability
- Apply subtle text shadows for depth on headings

## Components

### Buttons

#### Primary Button (.lux-button-primary)

- Gold gradient background
- White text with subtle text shadow
- Elevated box shadow with gold tint
- Smooth hover animations with lift effect
- Used for main actions (Next, Submit)

#### Secondary Button (.lux-button-secondary)

- Elevated white background with gold border
- Gold text that becomes white on hover
- Used for secondary actions (Back, Skip)

### Form Elements

#### Radio Buttons & Checkboxes

- Gold accent color for consistency
- Larger size (1.25rem) for touch accessibility
- Smooth transitions and hover effects

#### Scale Questions

- Special styling with elevated background
- Gold border and subtle shadow
- Larger radio buttons for easier interaction
- Clear left/right labels for scale context

#### Text Inputs

- Gold border that intensifies on focus
- Elevated white background
- Soft focus glow effect
- Rounded corners for modern feel

### Cards & Containers

#### Survey Container

- Semi-transparent white background
- Backdrop blur for depth
- Subtle gold border
- Rounded corners and elevation shadow
- Responsive padding and layout

#### Swipe Game Cards

- Dark gradient background for design contrast
- Gold border with subtle glow
- Large rounded corners
- Dramatic shadows for depth
- Smooth hover animations

## Interactive Elements

### Swipe Game

- **Tutorial**: Smooth directional hints with rotation
- **Feedback**: Animated emoji with luxury timing
- **Labels**: Positioned outside card with clear typography
- **Progress**: Gold gradient progress bar

### Hover States

- Subtle lift animations (2px translateY)
- Enhanced shadows and glows
- Color intensity increases
- Smooth transitions (0.3s ease)

## Layout & Spacing

### Spacing Scale

- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-3`: 0.75rem (12px)
- `--space-4`: 1rem (16px)
- `--space-5`: 1.5rem (24px)
- `--space-6`: 2rem (32px)

### Container Guidelines

- Max width: 680px for optimal readability
- Responsive padding with safe area insets
- Centered layout with comfortable margins
- Stack spacing using CSS custom properties

## Accessibility

### Focus States

- Clear focus rings using brand colors
- High contrast for keyboard navigation
- Logical tab order throughout interface

### Color Contrast

- Maintain WCAG AA standards
- Use color + text/icons for meaning
- Test with color blindness tools

### Interactive Targets

- Minimum 44px touch targets
- Adequate spacing between clickable elements
- Clear hover and active states

## Animation Guidelines

### Timing

- Use `ease` for most transitions
- 0.3s for hover states
- 0.6s for complex animations
- Respect `prefers-reduced-motion`

### Effects

- Subtle transforms and opacity changes
- Avoid jarring or excessive movement
- Use backdrop blur for depth
- Apply smooth color transitions

## Responsive Design

### Breakpoints

- Mobile: < 480px
- Tablet: 481px - 768px
- Desktop: > 768px

### Adaptive Elements

- Smaller containers on mobile
- Adjusted spacing and typography
- Touch-friendly interactions
- Optimized card sizes

## Brand Voice in UI

### Tone

- Elegant but not intimidating
- Warm and approachable
- Premium quality feel
- Trustworthy and professional

### Copy Guidelines

- Use inclusive, empowering language
- Avoid technical jargon
- Keep instructions clear and concise
- Match the mystical wellness aesthetic
