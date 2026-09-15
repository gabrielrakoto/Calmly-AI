# CalmlyAI - Communication Assistant

## Overview

CalmlyAI is a modern web application designed to help users de-escalate relationship conflicts through AI-powered communication tools. The application provides core features around message analysis and rewriting (Safe Send Check / Calm Rewrite), an AI Social Skills Coach, and Task Groups for managing shared responsibilities within a relationship or household.

The application is a full-stack TypeScript solution: a React frontend and an Express backend, with real AI analysis powered by Groq and persistence in MongoDB (with an automatic in-memory fallback when no database is configured).

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
- A per-browser `clientUserId` (stored client-side) is used to scope data (analysis history, groups) without a real auth system

**UI Component System**
- shadcn/ui component library (Radix UI primitives + custom styling)
- Tailwind CSS for utility-first styling with custom design tokens
- Design system based on "new-york" style variant
- Glassmorphism effects and subtle shadows for modern aesthetic
- Custom color palette: Primary (soft blue/lavender #6366F1), Secondary (light grays), Accent (calming green #10B981)

**Key Design Decisions**
- Safe Send Check / Calm Rewrite and the Social Skills Coach call the backend (`/api/ai/analyze`, `/api/ai/coach`), which in turn calls Groq
- No real authentication: identity is a locally-generated `clientUserId`, which is enough for a demo/MVP but not for production multi-device accounts

### Backend Architecture

**Server Framework**
- Express.js with TypeScript, ESM module system throughout
- Shared Express app (`server/app.ts`) with request logging middleware and a JSON error handler
- Three entry points around that shared app:
  - `server/index-dev.ts`: local development, Vite middleware for HMR
  - `server/index-prod.ts`: production build, serves the static `dist/public` bundle, used for VPS/Docker-style hosting
  - `api/index.ts`: Vercel serverless entry point — registers routes and connects to MongoDB once per cold start, then forwards each request to the Express app (no `app.listen()`, since Vercel manages the request lifecycle)

**API Design**
- RESTful JSON endpoints under `/api/*`, defined in `server/routes.ts`:
  - `POST /api/ai/analyze`, `POST /api/ai/coach` — AI message analysis / coaching (Groq, with local fallback)
  - `GET/POST/DELETE /api/features/safety-checks` — analysis history, scoped by `clientUserId`
  - `POST/GET /api/contact` — contact form (internal, no longer uses Formspree)
  - `POST/GET/DELETE /api/groups`, `/api/groups/:id`, `/api/groups/invite/:token`, `/api/groups/join` — Task Groups CRUD, invites
  - `POST/DELETE /api/groups/:id/tasks`, `/api/groups/:id/messages`, `/api/groups/:id/typing` — tasks, group chat, typing indicators
  - `PATCH /api/groups/:id/members/:memberId/role`, `DELETE /api/groups/:id/members/:memberId` — membership management
  - `POST /api/reset` — wipes all data tied to a `clientUserId`
  - `GET /api/health` — reports whether MongoDB is connected or the app is running on the in-memory fallback
- Validation via Zod schemas (`shared/schema.ts`)

**AI Layer (`server/ai.ts`)**
- Primary path: Groq (`llama-3.3-70b-versatile`) for message analysis (risk score, risky phrases, rewrite) and for the conversational coach
- Fallback path (used when `GROQ_API_KEY` is unset, or if the Groq call throws): local regex-based analysis and rewriting, so the app stays functional without an API key
  - Absolute language ("you always" → "you often", "you never" → "you rarely") is softened while keeping the original sentence subject and capitalization, rather than swapping in a mismatched first-person clause (this used to produce grammatically broken rewrites)

### Data Storage

**Current Implementation**
- MongoDB (via Mongoose) is the primary store: `server/mongodb.ts` connects using `MONGODB_URI` and exposes models for groups and message analyses
- **In-memory fallback**: if `MONGODB_URI` is missing or the connection fails, `connectDB()` no longer crashes the process — it logs a warning and the app switches to `Map`-based in-memory storage (`server/storage.ts`, `MongoStorage` class checks `isDatabaseAvailable()` before every read/write). This keeps demos and previews working without a configured database, at the cost of state not surviving a server restart / serverless cold start
- Contact form submissions are always stored in memory (not user-specific, low volume, no need for persistence yet)

**Configured but Unused**
- Drizzle ORM + `@neondatabase/serverless` and `connect-pg-simple` are present in `package.json`/`drizzle.config.ts` from an earlier direction but are not wired into the current code path (MongoDB is the active store)

**Data Models** (`shared/schema.ts`)
- Contact form submissions
- Groups, group members, tasks, and chat messages (with read receipts and typing indicators)
- Message analysis results (risky phrases, conflict risk score, rewrite)

### Message Processing Logic

**Primary: Groq LLM**
- Detects language, scores conflict risk (0–1), extracts risky phrases with suggestions, and produces a calmer rewrite in the same language
- Coach responses are short (3–4 sentences), language-adapted, conversational

**Fallback: Pattern-Based Analysis** (no external calls, used only if Groq is unavailable)
- Risky phrase detection via regex (absolutes, insults/profanity, excessive punctuation)
- Deterministic rewrite rules that preserve sentence structure and capitalization
- Canned but language-adapted coach responses (en/fr/es)

## Deployment

- **Target: Vercel**. `vercel.json` builds the frontend with `vite build` (output `dist/public`) and routes all `/api/*` requests to a single serverless function (`api/index.ts`) that wraps the Express app
- Required environment variables on Vercel: `GROQ_API_KEY`, `MONGODB_URI` (both optional at runtime thanks to the fallbacks above, but needed to avoid demo mode / data loss between invocations)
- Legacy VPS/Docker path (`Dockerfile`, `DEPLOYMENT_HOSTINGER.md`, `server/index-prod.ts`, `npm run build && npm start`) is kept for reference but Hostinger is no longer the deployment target

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
- **Groq SDK**: LLM calls for message analysis and coaching
- **Mongoose**: MongoDB ODM, primary data store
- **Drizzle ORM / @neondatabase/serverless / connect-pg-simple**: configured but currently unused (see Data Storage)

### Build & Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type checking and compile-time safety
- **ESBuild**: Bundler for the legacy VPS/Docker production server build
- **PostCSS**: CSS processing with Tailwind
- **@replit/vite-plugin-***: Replit-specific development tooling (harmless no-ops outside Replit)

### Design System Assets
- **Inter font family**: Google Fonts integration
- Custom CSS variables for theming
- Responsive breakpoint system

### Third-Party Services
- **Groq**: LLM inference for message analysis/rewriting and the AI coach
- **MongoDB Atlas**: primary database (optional at runtime via the in-memory fallback)

**Future Integration Points**
- Real authentication/accounts (current identity model is a locally-generated `clientUserId`)
- Email notifications for the contact form and group invites
- Analytics/monitoring
