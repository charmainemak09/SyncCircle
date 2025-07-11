# Replit.md

## Overview

SyncCircle is a team check-in application that enables organizations to create spaces for regular team surveys and feedback collection. The application allows admins to create custom forms with various question types, schedule them for regular distribution, and analyze responses to track team health and progress over time.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store

### Deployment Strategy
- **Platform**: Replit hosting with autoscale deployment
- **Environment**: Containerized Node.js application
- **Database**: Neon PostgreSQL (serverless)
- **Build Process**: Vite for frontend, esbuild for backend bundling

## Key Components

### Authentication System
- Integrated Replit Auth using OpenID Connect protocol
- Session-based authentication with PostgreSQL session storage
- User profile management with automatic user creation on first login
- Secure session handling with HTTP-only cookies

### Database Schema
- **Users**: Store user profiles from Replit Auth
- **Spaces**: Team workspaces with invite-based membership
- **Space Members**: Role-based access control (admin/participant)
- **Forms**: Custom surveys with JSON-stored questions and scheduling
- **Responses**: User submissions with draft/submitted states
- **Sessions**: Secure session storage for authentication

### Form Builder
- Dynamic form creation with multiple question types:
  - Text input (short and long)
  - Multiple choice (single and multi-select)
  - Rating scales (1-5 and 1-10)
  - Yes/No questions
- Scheduling system for recurring forms (daily, weekly, monthly)
- Form activation/deactivation controls

### Response System
- Draft saving for incomplete responses
- Submission tracking and analytics
- Response aggregation and statistics
- Historical response viewing

### Permission System
- Space-level role-based access control
- Admin permissions: create/edit forms, manage members, view all responses
- Participant permissions: fill forms, view aggregated results
- Invite code system for space membership

## Data Flow

1. **Authentication Flow**:
   - User logs in through Replit Auth
   - Session created and stored in PostgreSQL
   - User profile synchronized with local database

2. **Space Management**:
   - Admins create spaces with unique invite codes
   - Users join spaces via invite codes
   - Role-based permissions enforced at API level

3. **Form Lifecycle**:
   - Admins create forms with custom questions
   - Forms scheduled for automatic distribution
   - Participants receive and complete forms
   - Responses aggregated for analysis

4. **File Upload**:
   - Multer middleware for file handling
   - Local file storage in uploads directory
   - Image validation for avatars and attachments

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **passport**: Authentication middleware
- **openid-client**: OIDC authentication
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form state management
- **wouter**: Lightweight routing
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **tsx**: TypeScript execution
- **esbuild**: Fast JavaScript bundler
- **vite**: Frontend build tool
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Development Environment
- Hot module replacement via Vite
- Automatic TypeScript compilation
- Replit development banner integration
- Error overlay for debugging

### Production Build
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Static file serving from built frontend
- Environment-based configuration

### Database Management
- Drizzle migrations in `/migrations` directory
- Schema definitions in `shared/schema.ts`
- Database URL from environment variables
- Automatic schema synchronization

## Changelog
```
Changelog:
- June 13, 2025. Initial setup
- June 13, 2025. Implemented role-based access control for UI buttons
- June 13, 2025. Added 5-form limit per space with backend validation
- June 13, 2025. Fixed mobile UI display with responsive design
- June 17, 2025. Fixed form status update errors with proper PATCH endpoint
- June 17, 2025. Enhanced form update functionality to prevent NaN errors
- June 17, 2025. Added proper ID validation for all database endpoints
- June 17, 2025. Fixed TypeScript errors in SpaceDetail component
- June 17, 2025. Confirmed form response submission functionality is complete
- June 17, 2025. Implemented recurring response functionality allowing multiple submissions per user per form
- June 17, 2025. Added draft-only system for form responses to support recurring submissions
- June 17, 2025. Enhanced UI to indicate multiple responses are allowed
- June 17, 2025. Added Submit Response button for each check-in form on space detail page
- June 17, 2025. Implemented deadline duration setting in form configuration (1 hour to 1 week options)
- June 17, 2025. Implemented comprehensive notification system with form reminder and new response notifications
- June 17, 2025. Added notification database schema with read/unread states and notification types
- June 17, 2025. Created notification dropdown UI component in header with unread count badge
- June 17, 2025. Integrated automatic notification creation when forms are activated and responses submitted
- June 17, 2025. Fixed notification triggers for new form creation and added click-to-navigate functionality
- June 17, 2025. Completed notification system testing - all space members receive form reminders and response alerts
- June 23, 2025. Fixed edit functionality to prevent duplicate records - backend now automatically updates existing responses instead of creating new ones
- June 23, 2025. Enhanced edit URL parsing and added debugging logs to track edit mode detection
- June 23, 2025. Improved auto-save functionality to work for both new responses and edits
- June 27, 2025. Implemented comprehensive three-mode form submission system with distinct Save, Submit, and Update actions
- June 27, 2025. Refactored backend response handling to properly manage drafts vs final submissions
- June 27, 2025. Created separate mutations for each submission type with proper validation and user feedback
- June 27, 2025. Enhanced form UI with conditional button display based on edit mode detection
- June 27, 2025. Added delete functionality allowing users to delete their own responses with proper permission checks
- June 27, 2025. Implemented DELETE /api/responses/:id endpoint with user ownership validation
- June 27, 2025. Added delete button to response view with confirmation dialog and error handling
- June 27, 2025. Fixed clear button functionality with confirmation dialog and improved state management
- June 27, 2025. Enhanced form clearing to prevent auto-reload of saved data after clearing
- June 27, 2025. Added isCleared flag to properly manage form state after clear action
- June 27, 2025. Implemented automated scheduled notification system based on form frequency, send time, and start date
- June 27, 2025. Added lastNotificationSent field to forms schema to prevent duplicate notifications
- June 27, 2025. Created notification scheduler that runs every minute checking for forms due for notifications
- June 27, 2025. Enhanced notification system to support recurring reminders (daily, weekly, biweekly, monthly)
- July 2, 2025. Implemented "Pending Submission" notification badge system for form cards based on frequency and last submission
- July 2, 2025. Added API endpoint to check pending submissions with frequency-based logic
- July 2, 2025. Enhanced image display in forms and responses to show images directly instead of view buttons
- July 2, 2025. Fixed static file serving for uploads directory using express.static middleware
- July 7, 2025. Added Google AdSense script to HTML head section for monetization
- July 11, 2025. Enhanced visual design with vibrant gradient backgrounds and vector illustrations
- July 11, 2025. Added engaging SVG placeholder illustrations for team collaboration, forms, analytics, and empty states
- July 11, 2025. Updated color scheme with purple, pink, and blue gradients for more modern appearance
- July 11, 2025. Enhanced space cards with glass morphism effects, hover animations, and colorful gradient icons
- July 11, 2025. Redesigned dashboard with hero section featuring gradient text and improved layout
- July 11, 2025. Fixed create space modal accessibility with better contrast, clear text, and improved styling
- July 11, 2025. Enhanced image display in forms and responses with error handling and consistent styling
- July 11, 2025. Fixed image serving with improved express.static middleware and proper content-type headers
- July 11, 2025. Enhanced modal accessibility across the app with better contrast, focus management, and ARIA attributes
- July 11, 2025. Replaced window.confirm with accessible AlertDialog for delete confirmations
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```