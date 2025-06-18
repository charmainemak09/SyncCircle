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
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```