# KORA Medical Article System - Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from educational platforms like Notion and Medium for reading experience, combined with medical interfaces like UpToDate and PubMed for credibility. The design balances professional medical aesthetics with modern, engaging visuals.

## Core Design Principles
- **Educational Elegance**: Professional medical credibility with warm, accessible aesthetics
- **Theme Flexibility**: Seamless transitions between default and glassmorphism themes
- **Typography Centricity**: Font choices that enhance readability while offering personality
- **Contextual Decoration**: Medical iconography that educates without distracting

## Color Palette

### Default Cream/Beige Theme
- **Primary Background**: 38 25% 92% (warm cream)
- **Secondary Background**: 35 20% 88% (lighter beige for cards)
- **Primary Accent**: 185 65% 25% (dark teal for buttons/CTAs)
- **Secondary Accent**: 185 50% 35% (medium teal for hover states)
- **Text Primary**: 0 0% 15% (near-black for body text)
- **Text Secondary**: 0 0% 40% (gray for metadata)
- **Success Green**: 142 70% 45% (for completion pulse/notifications)
- **Highlight Yellow**: 48 100% 70%
- **Highlight Green**: 142 50% 75%

### Glassmorphism Theme (Optional Toggle)
- **Glass Background**: 0 0% 100% with 20% opacity
- **Glass Border**: 0 0% 100% with 30% opacity
- **Backdrop Blur**: 12px
- **Shadow**: 0 8px 32px rgba(0,0,0,0.1)
- **Gradient Overlay**: 210 100% 95% to 280 100% 98% (subtle blue-purple)

## Typography

### Font System
**Primary Font Options** (User-Selectable):
1. **Default**: Inter (clean, medical professionalism)
2. **Serif Academic**: Crimson Text (scholarly articles)
3. **Elegant Serif**: Playfair Display (refined reading)
4. **Decorative Script**: Dancing Script (creative, engaging)
5. **Modern Serif**: Lora (balanced readability)

**Type Scale** (applies to selected font):
- Hero/Article Title: 2.5rem (40px), font-weight 700
- Section Headers: 1.875rem (30px), font-weight 600
- Subheadings: 1.25rem (20px), font-weight 600
- Body Text: 1rem (16px), font-weight 400, line-height 1.7
- Metadata: 0.875rem (14px), font-weight 400
- Thought Clouds: 0.875rem (14px), font-weight 400, italic

## Layout System

### Spacing Primitives
**Tailwind units**: 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section margins: my-12 to my-20
- Card spacing: gap-6 to gap-8
- Icon spacing: space-x-3 to space-x-4

### Grid Systems
- **Search Page**: Single column max-w-4xl centered
- **Downloads Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-6
- **Article Reader**: max-w-3xl centered with 16px side padding
- **Settings Panel**: Two-column on desktop (preview + controls)

## Component Library

### Search Interface
- **Search Bar**: Rounded-full design, h-14, shadow-lg on focus
- **Background Decorations**: Floating medical icons (books, DNA helixes, microscopes, stars) at 10% opacity, absolute positioned, gentle floating animation (3-5s duration)
- **Suggestions Dropdown**: Backdrop blur in glass theme, solid bg in default theme, max-h-96 with scroll
- **Downloaded Badge**: Teal background, rounded-full, text-xs, px-3 py-1

### Article Display
- **Loading Animation**: Character-by-character typing effect at 15ms per character
- **Image Fade-In**: Opacity 0→1 transition over 600ms
- **Completion Indicator**: Green pulse ring animation (scale 1→1.2, opacity 1→0, 2s duration)
- **Toast Notification**: Fixed bottom-right, slide-up animation, auto-dismiss 4s

### Downloads Page
- **Card Design**: aspect-video thumbnail, rounded-xl, shadow-md hover:shadow-xl transition
- **Thumbnail**: First article image or gradient placeholder with article category icon
- **Metadata Layout**: Title (font-semibold), category badge, date saved (text-sm text-gray-600)

### Offline Reader/Editor
- **Highlight Colors**: Yellow (48 100% 70%), Green (142 50% 75%) with 40% opacity, cursor pointer
- **Thought Cloud**: SVG cloud shape, position absolute, white bg, shadow-xl, p-4, max-w-xs
- **Bookmark Indicator**: Teal ribbon icon in margin, pulse on save
- **Sticky Notes**: Yellow post-it style, rotate-1 to rotate-2 for realism, shadow-md
- **Underline Style**: border-b-2 border-teal-500 with 2px offset

### Settings Page
- **Theme Toggle**: Switch component, teal when active, smooth transition 300ms
- **Font Preview**: Live preview panel showing article sample in selected font
- **Layout**: Left sidebar with options, right panel with preview, responsive stack on mobile

### Status Indicators
- **Online**: Green dot pulse, "Connected" text
- **Offline**: Red dot, "Offline Mode" with warning icon
- **Loading States**: Spinning teal circle, "Searching..." text animation

## Interactive Elements

### Buttons
- **Primary CTA**: bg-teal-600 hover:bg-teal-700, text-white, rounded-lg, px-6 py-3, shadow-md
- **Secondary**: border-2 border-teal-600, text-teal-600, backdrop-blur-sm on glass theme
- **Icon Buttons**: rounded-full, p-2, hover:bg-teal-100 (default) or hover:bg-white/20 (glass)

### Hover States
- **Cards**: scale-102 transform, shadow elevation increase
- **Highlights**: brightness increase, "View Thought" button fade-in
- **Icons**: rotate-6 transform for playful interaction

## Animations

### Background Decorations
- **Float Animation**: translateY(-20px) over 4s, infinite ease-in-out
- **Rotation**: rotate(0→360deg) over 20s for some icons
- **Opacity Pulse**: 8%→12% over 3s for depth

### Content Transitions
- **Page Navigation**: fade-in 300ms with slight slide-up (translateY(10px)→0)
- **Theme Switch**: All colors transition 500ms ease-in-out
- **Font Change**: fade-out/fade-in 200ms to prevent flash

### Micro-interactions
- **Download Success**: Checkmark scale-in from 0→1 with bounce
- **Delete Confirm**: Shake animation before removal
- **Bookmark Save**: Bookmark icon fills with teal color over 400ms

## Accessibility

### Color Contrast
- Text on cream background: minimum 7:1 ratio
- Teal buttons: ensure 4.5:1 with white text
- Glassmorphism mode: increase opacity if contrast fails

### Focus States
- Visible ring-2 ring-teal-500 ring-offset-2
- Keyboard navigation: clear focus indicators throughout

### Dark Mode Consideration
While not specified, maintain design consistency if implemented:
- Invert cream→dark-gray, keep teal accent
- Increase contrast ratios for text

## Image Strategy

### Hero Section
No traditional hero image. Instead, create an immersive search-first experience with decorative medical illustrations floating in the background (non-intrusive, educational icons).

### Article Images
- Embedded within content flow
- max-w-full, rounded-lg, shadow-md
- Figure captions in text-sm italic below images
- Fade-in animation on load

### Download Thumbnails
- Extract first article image or generate gradient with category icon
- Consistent aspect-ratio: 16/9
- Fallback: Teal gradient with stethoscope/book icon centered

## Responsive Behavior

### Breakpoints
- Mobile (<768px): Single column, stacked layout, hide decorative icons
- Tablet (768-1024px): Two columns for downloads, show minimal decorations
- Desktop (>1024px): Full three-column downloads, all decorations visible

### Touch Optimization
- Increase hit areas to 44×44px minimum
- Swipe gestures for navigation in offline reader
- Long-press for highlight/thought on mobile

## Design Assets

### Icon Library
Use Heroicons (outline style) via CDN for:
- Navigation: HomeIcon, DocumentIcon, Cog6ToothIcon
- Actions: DownloadIcon, BookmarkIcon, PencilIcon, TrashIcon
- Status: WifiIcon, CloudIcon, CheckCircleIcon

### Background Decorations
Custom SVG medical illustrations (simplified line art):
- Open book (rotated various angles)
- DNA helix (subtle spiral)
- Microscope (silhouette)
- Star bursts (4-point medical crosses)
- Beaker/flask outlines

Position: absolute, scattered across viewport at 10-15% opacity, sizes 60px to 120px

This comprehensive design system ensures KORA feels professional, educational, and delightfully engaging while maintaining flexibility for user customization.