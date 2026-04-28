# CampusBridge Frontend

Campus housing and peer-to-peer marketplace frontend built with Vite, React, TypeScript, and TanStack Router.

## Features

- **User Authentication**: Email/password registration, login, forgot/reset password flows with JWT-based session management
- **Campus Listings**: Post, search, and browse campus housing and services with filtering by type
- **Secure Messaging**: Real-time peer-to-peer chat using WebSocket/SignalR
- **Escrow Payments**: Hold funds safely until both parties are satisfied, with dispute/refund support
- **KYC Verification**: Student verification workflow (ID upload, face verification, phone verification)
- **Admin Dashboard**: User and KYC status management (admin-only)
- **Responsive Design**: Mobile-first UI with light/dark theme support

## Tech Stack

- **Framework**: React 19 + TypeScript 6
- **Build**: Vite
- **Routing**: TanStack Router v1
- **State Management**: React Query v5 + Context API
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS v4 with semantic token system
- **UI Components**: Custom primitives using Radix UI patterns
- **Icons**: Lucide React

## Quick Start

```bash
npm install
npm run dev
```

The app will run on `http://localhost:5173` by default.

## Environment

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_STORAGE_PREFIX=campusbridge
```

## Project Structure

```
src/
├── api/                    # API client, types, and domain DTOs
├── auth/                   # Session management and JWT handling
├── components/
│   ├── app/               # Reusable app-level components (CRUD page pattern)
│   └── ui/                # Semantic UI primitives
├── hooks/                 # Custom hooks (useAuth, useTheme, etc.)
├── layouts/               # Root, Auth, and AppShell layouts
├── pages/                 # Page components by feature
│   ├── auth/             # Login, register, password reset flows
│   ├── app/              # Dashboard, listings, chat, payments, KYC, admin
│   └── Landing/          # Public product homepage
├── services/             # Domain services (auth, listings, chat, etc.)
├── styles/               # Global CSS and semantic tokens
└── router.ts             # TanStack Router configuration
```

## Key Concepts

### API Layer

All requests go through `apiClient` in `src/api/client.ts`. Responses are wrapped in `ApiResponse<T>` or `PaginatedApiResponse<T>` envelopes with `succeeded` boolean status.

On 401 Unauthorized, the session is cleared and the user must re-authenticate (no refresh token endpoint).

### Auth State

Session state is managed via:
- `useAuth()` hook for login/register/logout/password operations
- `getAuthUser()` / `setAuthSession()` for localStorage persistence
- `isAuthenticated()` guard for protected routes

Admin role is checked via `useAuth().isAdmin` for admin-only UI elements and routes.

### Domain Types

Type definitions for all backend DTOs live in `src/api/types.ts`:
- `LoginResponseDTO`, `RegisterDTO`, `ChangePasswordDTO`
- `Listing`, `ListingRequestParameters`, `LISTING_TYPE`, `LISTING_STATUS`
- `Conversation`, `Message`, `StartConversationRequestDTO`
- `Payment`, `PaymentRequestParameters`, `PAYMENT_STATUS`
- `KycDocument`, `KYC_STATUS`
- `ApplicationUser` (admin)

### Theme System

The app supports three theme modes:
- **Light**: `oklch(0.98 0 0)` background with teal `oklch(0.52 0.15 200)` primary
- **Dark**: `oklch(0.12 0 0)` background with cyan `oklch(0.65 0.13 200)` primary
- **System**: Follows OS preference

Theme is persisted in localStorage and can be toggled via the sidebar selector.

## Development

```bash
# Run dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Building Domain Modules

The `CrudResourcePage` component provides a reusable pattern for list/detail/create/edit/delete flows. To build a new domain module:

1. Create service functions in `src/services/{domain}.service.ts` that wrap `apiClient` calls
2. Create page components in `src/pages/app/{Domain}Page.tsx` using `CrudResourcePage` as a template
3. Add routes to `src/router.ts` under the appShell route tree
4. Add nav items to `AppShellLayout` if user-facing

See `src/pages/app/DashboardPage.tsx` for an example dashboard, and look at the Items pattern for a complete CRUD example.

## Deployment

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, S3, etc.).

Ensure `VITE_API_BASE_URL` environment variable is set to point to the backend API before deployment.
