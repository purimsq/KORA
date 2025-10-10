# KORA Medical Article System

## Overview

KORA is a medical knowledge application that enables users to search, view, download, and annotate scientific and medical articles. The system provides an elegant reading experience with offline capabilities, annotation tools, and customizable themes. It can be deployed as both a web application and an Electron desktop app.

The application fetches articles from external sources (Semantic Scholar API and Wikipedia), displays them with a typewriter animation effect, and allows users to download articles for offline reading with advanced annotation features including highlights, bookmarks, thought clouds, and sticky notes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System:**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Class Variance Authority (CVA) for component variants
- Support for multiple font families (Inter, Crimson Text, Playfair Display, Dancing Script, Lora, Cormorant Garamond, Merriweather)
- Two theme options: Default cream/beige theme and glassmorphism theme

**State Management:**
- React Query for server-side data fetching, caching, and synchronization
- React hooks for local component state
- Custom hooks for domain-specific logic (useSearch, useDownloads, useAnnotations, usePreferences)

**Key Features:**
- Real-time search with suggestions from multiple sources (PubMed, medRxiv, Semantic Scholar, Wikipedia)
- Full article content fetching (not just abstracts)
- Typewriter animation effect for article display
- Offline-first architecture with local data persistence
- Advanced annotation system:
  - Color highlights with 6 semantic colors:
    * Yellow - General highlights
    * Green - Definitions and key concepts
    * Red - Important/critical information
    * Blue - Data and statistics
    * Orange - Methods and procedures
    * Purple - Conclusions and findings
  - Enhanced bookmarks with text-based tracking:
    * Visual bookmark indicators (🔖) on bookmarked text
    * Blue highlight for bookmarked content
    * Full/partial bookmark states with visual indicators
    * Replace existing bookmark functionality
    * Scroll-to-position navigation
  - White bubble thought clouds (hover-only display):
    * Appears only on hover over highlighted text
    * White cloud design with thought bubble tail
    * Edit and save functionality
    * Auto-dismisses when not hovering
  - Realistic sticky notes sidebar:
    * Visual pin design with rotation effects
    * 5 color options (yellow, pink, blue, green, purple)
    * Scrollable container for multiple notes
    * Hide/minimize toggle
    * Click note to scroll to associated text with pop animation
    * Text highlighting in corresponding colors
  - Underline annotations with blue styling (2px thick)
- Scroll-to-top button:
  * Appears after scrolling 300px
  * Smooth scroll behavior
  * Fixed bottom-right position
- PDF export functionality using jsPDF
- Responsive design with mobile support
- Images displayed inline with text (first image floats right, text wraps)

### Backend Architecture

**Server Framework:**
- Express.js for HTTP server and API routing
- TypeScript for type safety across the stack
- ESM (ES Modules) for modern JavaScript module system

**API Design:**
- RESTful API endpoints for CRUD operations
- Endpoints for search, articles, downloads, highlights, bookmarks, thoughts, annotations, and user preferences
- Integration with external APIs (Semantic Scholar, Wikipedia)
- Axios for HTTP requests to external services

**Data Flow:**
1. User searches → Check local database first → If not found, query external APIs
2. Article display → Typewriter animation → Optional download to local storage
3. Annotations → Auto-save to local database → Retrieve on article open
4. Preferences → Persist theme and font choices → Apply globally

### Data Storage

**Local Database:**
- BetterSQLite3 for embedded, serverless SQL database
- Database file: `kora.db` stored in project root
- No external database server required - fully self-contained

**Database Schema:**
- `articles` - Temporary article cache from external sources
- `downloads` - Permanently saved articles for offline access with images
- `highlights` - Text highlights with 6 semantic colors (yellow/green/red/blue/orange/purple) visually displayed on text
- `bookmarks` - Text-based bookmarks with scroll position navigation
  - Stores bookmarked text for visual indicator display
  - Tracks scroll position for navigation
  - Supports full/partial bookmark states
- `thoughts` - User's thought clouds with text and associated highlight
  - White bubble design with hover-only display
  - Editable content with auto-save
- `annotations` - Sticky note and underline annotations with color, content, and position tracking
  - Type: 'underline' or 'sticky_note'
  - Color: 'yellow', 'pink', 'blue', 'green', 'purple' (for sticky notes)
  - Position: Scroll position for navigation
  - Visual pin design for sticky notes
- `user_preferences` - Theme and font family settings

**Data Persistence Strategy:**
- Articles are fetched and displayed in memory during search
- Only downloaded articles are persisted to the database
- All annotations auto-save to prevent data loss
- Foreign key relationships with cascade delete for data integrity

**Alternative Database Support:**
- Drizzle ORM configured for PostgreSQL (via drizzle.config.ts)
- Schema definitions compatible with PostgreSQL migrations
- Can be migrated to PostgreSQL by provisioning DATABASE_URL environment variable

### Electron Desktop Integration

**Desktop Application:**
- Electron framework for cross-platform desktop deployment
- Main process (`electron/main.js`) handles window management
- Preload script (`electron/preload.js`) for secure IPC communication
- Electron Builder for packaging and distribution

**Build Targets:**
- Windows: NSIS installer and portable executable
- macOS: DMG and ZIP distributions
- Configurable icons and application metadata

**Development vs Production:**
- Development: Loads from Vite dev server (localhost:5000)
- Production: Serves static files from `dist` directory

## External Dependencies

### Third-Party APIs

**Semantic Scholar API:**
- Source: `https://api.semanticscholar.org/graph/v1/paper/search`
- Purpose: Fetching scientific and medical research papers
- Data: Title, abstract, authors, URL
- Rate limiting and timeout handling implemented

**Wikipedia API:**
- Purpose: Fallback source for article summaries and images
- Data: Article content, images with captions
- Used when Semantic Scholar has no results

### External Libraries & Services

**Core Dependencies:**
- `better-sqlite3` - Local embedded database (v12.4.1)
- `@neondatabase/serverless` - Neon PostgreSQL adapter (for future migrations)
- `drizzle-orm` & `drizzle-kit` - TypeScript ORM for database operations

**UI & Styling:**
- `@radix-ui/*` - Accessible UI primitives (30+ components)
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` - Component variant management
- `lucide-react` - Icon library

**Frontend Utilities:**
- `@tanstack/react-query` - Server state management
- `wouter` - Lightweight routing
- `axios` - HTTP client
- `jspdf` - PDF generation for article export
- `date-fns` - Date formatting utilities

**Development Tools:**
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React support for Vite
- `typescript` - Type checking
- `@replit/vite-plugin-*` - Replit-specific development enhancements

**Desktop Application:**
- `electron` - Desktop application framework
- `electron-builder` - Application packaging and distribution
- `electron-is-dev` - Environment detection

### Font Resources

**Google Fonts Integration:**
- Inter (sans-serif)
- Crimson Text (serif)
- Playfair Display (display serif)
- Dancing Script (script/cursive)
- Lora (serif)
- Cormorant Garamond (elegant serif)
- Merriweather (reading-optimized serif)

All fonts loaded via Google Fonts CDN with preconnect optimization.