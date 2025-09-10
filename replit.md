# Overview

This is a full-stack AI SaaS application built with React, Express, and PostgreSQL. The application provides an AI-powered platform where users can purchase credits and consume AI services through API calls. It features a comprehensive dashboard for managing credits, payments, user profiles, and settings, with integrated payment processing through Razorpay.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library with Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **State Management**: TanStack React Query for server state management and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod schema validation

## Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy using session-based authentication
- **Password Security**: Built-in crypto module with scrypt for password hashing
- **Session Management**: Express sessions with in-memory storage (MemoryStore)

## Data Layer
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod schemas for runtime type checking and validation
- **Migrations**: Drizzle Kit for database migrations and schema management

## Project Structure
- **Monorepo Design**: Shared schemas between client and server via `/shared` directory
- **Client**: React application in `/client` directory
- **Server**: Express API in `/server` directory  
- **Shared**: Common TypeScript types and Zod schemas in `/shared` directory

## Core Features
- **Credit System**: Users purchase credit packages to consume AI services
- **Dashboard**: Real-time stats showing credit usage, API calls, and success rates
- **Payment Processing**: Integrated with Razorpay for Indian and international payments
- **User Management**: Profile management, settings, and preferences
- **Support System**: Built-in ticketing system for customer support
- **API Usage Tracking**: Monitoring and analytics for API consumption

## Security & Authentication
- **Session-based Authentication**: Secure session management with CSRF protection
- **Password Hashing**: Crypto-based password hashing with salt
- **Protected Routes**: Client-side route protection for authenticated users
- **API Security**: Server-side authentication middleware for API endpoints

# External Dependencies

## Payment Integration
- **Razorpay**: Primary payment gateway for processing credit purchases in USD and INR

## Database & Hosting
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Replit**: Development environment with integrated deployment

## UI & Styling
- **Radix UI**: Headless UI components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **Lucide React**: Icon library for consistent iconography
- **Google Fonts**: Typography including Space Grotesk, Noto Sans, and Material Symbols

## Development Tools
- **Vite**: Build tool with React plugin and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Production bundling for the server
- **Drizzle Kit**: Database schema management and migrations