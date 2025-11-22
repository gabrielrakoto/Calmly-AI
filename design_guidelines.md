# CalmlyAI Design Guidelines

## Design Approach
**Reference-Based + Custom System**: Modern minimalist aesthetic inspired by productivity tools (Notion, Linear) with glassmorphism elements and calming communication focus.

## Core Design Specifications

### Color Palette
- **Primary**: Soft blue/lavender (#6366F1 or #7C3AED)
- **Secondary**: Light gray backgrounds (#F8FAFC, #F1F5F9)
- **Accent**: Calming green (#10B981)
- **Text**: Dark gray (#1F2937)
- **Borders**: Light gray (#E5E7EB)
- **Alert/Risky**: Red/orange for highlighted risky phrases
- **Success**: Green for improved rewrites

### Typography
- Friendly, accessible font families with clear hierarchy
- Clean, readable sans-serif throughout
- Varying sizes for headers, body text, and UI elements

### Layout System
- **Spacing**: Tailwind units of 4, 6, 8, 12, 16 for consistent rhythm (p-4, m-6, gap-8, py-12, etc.)
- **Border Radius**: 12-16px (rounded-xl, rounded-2xl)
- **Container**: max-w-7xl for main content areas
- **Responsive breakpoints**: Mobile-first (375px), tablet (768px), desktop (1440px)

### Visual Style
- Modern minimalist aesthetic with smooth transitions
- Glassmorphism effects: subtle frosted glass backgrounds on cards
- Subtle shadows only (no heavy drop shadows)
- Rounded corners consistently applied
- Light, airy feel with soft color palette

## Page-Specific Layouts

### Screen 1: Home/Landing Page
- **Hero Section**: 
  - Clean centered layout with CalmlyAI logo/branding
  - Headline: "De-escalate conflicts. Communicate with clarity."
  - Subheadline: "Improve communication, reduce misunderstandings, and manage group tasks seamlessly."
  - Abstract illustration or gradient-based visual (simple SVG, no complex hero image)
  - Prominent CTA: "Explore Features" button
- **Navigation**: Simple horizontal nav bar (Logo + links to all 4 pages)
- **Layout**: Single-column centered content, generous whitespace

### Screen 2: Features Page
- **Three Feature Cards** (vertically stacked or 3-column grid on desktop):
  
  **Feature 1: Safe Send Check**
  - Icon + title + description card
  - Interactive demo box with:
    - Input field with placeholder: "You ALWAYS forget to do your tasks! This is so frustrating!"
    - "Check Message" button
    - Output section showing side-by-side comparison:
      - Risky phrases highlighted in red/orange
      - Improved rewrite in green
      - Clear before/after visual distinction
  
  **Feature 2: Calm Rewrite**
  - Icon + title + description card
  - Interactive demo box with:
    - Input for stressful message
    - "Rewrite" button
    - Before/after output with visual distinction
  
  **Feature 3: Social Skills Coach**
  - Icon + title + description card
  - Mini chatbot interface mockup:
    - Chat bubbles showing greeting
    - Input field
    - 2-3 sample conversation examples
    - Collapsible/expandable design

- **CTA**: "Manage Your Groups" button at bottom

### Screen 3: Task Groups Page
- **Group Selection Grid**: 2-3 example group cards
  - "Roommates" (3 members)
  - "Family" (5 members)
  - "Work Team" (8 members)
  - "Create New Group" button with + icon

- **Expanded Group View** (one group shown as default):
  - Group header with name, member count, description
  - **Shared Tasks List**:
    - Checkboxes with tasks
    - Status badges (Completed-green, Pending-gray, Overdue-red)
    - Member assignments visible
  - **Messaging Helper Section**:
    - System-suggested gentle reminders
    - Example message shown
    - "Send Message" button
  - **Activity Feed**:
    - Timeline-style display
    - Recent completions and assignments
  - **Premium Badge**: Small indicator for Basic/Premium group status

- **CTA**: "Get in Touch" button at bottom

### Screen 4: Contact Us Page
- **Clean Support Form** (centered, max-w-2xl):
  - Full Name input
  - Email Address input
  - Message textarea (larger)
  - Category dropdown (Bug Report/Feature Request/General Inquiry)
  - "Send Message" primary CTA
  - Success toast/modal on submit
- **Footer**: Optional social links

## Component Library

### Navigation
- Horizontal nav bar on all pages
- Logo on left, page links on right
- Mobile: Hamburger menu
- Hover states with subtle color transitions

### Buttons
- Primary: Filled with primary color, white text, rounded-xl
- Secondary: Outlined, transparent background
- Hover: Slight scale and color intensity change
- On images: Blurred background (backdrop-blur)

### Cards
- Glassmorphism effect: backdrop-blur-md, semi-transparent backgrounds
- Subtle border (border-gray-200)
- Rounded-xl or rounded-2xl
- Padding: p-6 to p-8
- Hover: Subtle lift with shadow transition

### Forms
- Input fields: border-gray-300, rounded-lg, p-3
- Textarea: Larger for messages
- Validation: Red border on error, green on success
- Labels: Clear hierarchy above inputs

### Interactive Demos
- Input/output sections with clear visual separation
- Highlighted text: background colors for risky (red-100) and improved (green-100) phrases
- Before/after comparisons: Side-by-side on desktop, stacked on mobile

### Status Badges
- Pill-shaped, small, colored backgrounds
- Completed: green, Pending: gray, Overdue: red

### Animations
- Smooth transitions: 200-300ms ease-in-out
- Hover effects on cards and buttons
- Subtle page transition animations
- Task completion checkmark animation
- Toast notifications: Slide in from top

## Responsive Behavior
- **Mobile (375px)**: Single column, stacked cards, full-width elements
- **Tablet (768px)**: 2-column grids where appropriate, expanded spacing
- **Desktop (1440px)**: 3-column feature grids, side-by-side comparisons, max-width containers

## Key Interactions
- Message rewriting: Instant visual feedback with highlighted changes
- Task completion: Checkbox animation with status update
- Form submission: Toast notification ("Thank you! We'll get back to you soon.")
- Group expansion: Smooth accordion-style reveal
- Navigation: Active page indication in nav bar