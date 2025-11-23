# CalmlyAI - Communication Assistant

## Overview

CalmlyAI is a modern web application designed to help users de-escalate relationship conflicts through AI-powered communication tools. The application provides three core features: Safe Send Check (message analysis and rewriting), Calm Rewrite (tone improvement), and Social Skills Coach (communication guidance). It also includes a Task Groups feature for managing shared responsibilities with gentle reminders.

The application is built as a full-stack JavaScript/TypeScript solution with a React frontend and Express backend, designed with a mobile-first, responsive approach following modern minimalist design principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- Mobile-first responsive design approach (breakpoints: 375px, 768px, 1440px)

**State Management**
- TanStack Query (React Query) for server state and data fetching
- React Hook Form with Zod for form validation
- Local component state using React hooks
- In-memory storage for demonstration features (no database persistence required for core features)

**UI Component System**
- shadcn/ui component library (Radix UI primitives + custom styling)
- Tailwind CSS for utility-first styling with custom design tokens
- Design system based on "new-york" style variant
- Glassmorphism effects and subtle shadows for modern aesthetic
- Custom color palette: Primary (soft blue/lavender #6366F1), Secondary (light grays), Accent (calming green #10B981)

**Key Design Decisions**
- All communication tools (Safe Send Check, Calm Rewrite, Social Skills Coach) use client-side logic with pattern matching algorithms
- No complex AI/ML integration - uses deterministic string pattern matching for message analysis
- Mock data for group management demonstrations
- Fully functional offline after initial load

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- ESM module system throughout
- Separate development and production entry points
- Development: Vite middleware integration for HMR
- Production: Serves static built assets

**API Design**
- RESTful endpoints for contact form submissions
- Minimal API surface area (only `/api/contact` endpoint currently active)
- JSON request/response format
- Basic validation using Zod schemas

**Session & State**
- In-memory storage implementation (MemStorage class)
- No authentication or user sessions currently implemented
- Stateless API design suitable for future scaling

**Development vs Production**
- Development: Vite dev server with hot module replacement
- Production: Pre-built static assets served by Express
- Environment-specific entry points (`index-dev.ts`, `index-prod.ts`)

### Data Storage

**Current Implementation**
- In-memory storage using Map data structures
- No persistent database currently configured
- Contact form submissions stored in application memory

**Configured but Unused**
- Drizzle ORM configured for PostgreSQL (via Neon serverless)
- Database schema defined in `shared/schema.ts`
- Migration tooling set up but not actively used
- Connection pooling via `@neondatabase/serverless`
- Session storage configured with `connect-pg-simple` (not actively used)

**Data Models**
- Contact form submissions with validation
- Group and task management interfaces (client-side only)
- Message analysis structures for risky phrase detection

**Design Rationale**
The application is intentionally designed to work without a database for MVP demonstration. Database infrastructure is provisioned for future features like user accounts, persistent task groups, and message history, but current functionality prioritizes quick interaction and client-side processing.

### Message Processing Logic

**Pattern-Based Analysis**
- Risky phrase detection using regex patterns
- Predefined transformation rules for calm rewrites
- No external AI services - fully self-contained algorithm
- Real-time client-side processing for instant feedback

**Supported Patterns**
- Absolute language ("you always", "you never")
- Emotional escalation indicators
- Blame-oriented phrasing
- Imperative/demanding language

## External Dependencies

### Core Frontend Libraries
- **React** (^18.x): UI component framework
- **Wouter**: Lightweight routing (alternative to React Router)
- **TanStack Query**: Server state management and data fetching
- **React Hook Form**: Form state and validation
- **Zod**: Runtime type validation and schema definition

### UI Component Libraries
- **Radix UI**: Headless accessible component primitives (accordion, dialog, dropdown, popover, etc.)
- **shadcn/ui**: Pre-styled components built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS variant management
- **Lucide React**: Icon library

### Backend Dependencies
- **Express**: Web server framework
- **Drizzle ORM**: Type-safe SQL ORM (configured for PostgreSQL)
- **@neondatabase/serverless**: PostgreSQL client for Neon serverless
- **connect-pg-simple**: PostgreSQL session store

### Build & Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type checking and compile-time safety
- **ESBuild**: Production bundler for server code
- **PostCSS**: CSS processing with Tailwind
- **@replit/vite-plugin-***: Replit-specific development tooling

### Design System Assets
- **Inter font family**: Google Fonts integration
- Custom CSS variables for theming
- Responsive breakpoint system

### Third-Party Services
Currently, the application does not integrate with any external APIs or services. All functionality is self-contained and runs client-side or on the Express server.

**Future Integration Points**
- Email service for contact form notifications
- Analytics/monitoring (configured variables suggest potential integration)
- PostgreSQL database (Neon) for persistent storage
- Potential AI/ML services for enhanced message analysis