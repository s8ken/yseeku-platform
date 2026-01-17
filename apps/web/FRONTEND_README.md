# yseeku-platform Frontend

Enterprise AI Trust Platform - Frontend Application

## Overview

The yseeku-platform frontend is a sophisticated enterprise dashboard built with Next.js 14, React 18, TypeScript, and modern UI libraries. It provides comprehensive monitoring, orchestration, and trust management for AI agents with constitutional AI governance and quantum-grade security.

### Key Features

- **Dashboard Overview**: Real-time KPIs and platform metrics
- **Agent Management**: Full CRUD operations for AI agents with DID support
- **Monitoring & Health**: Comprehensive system health checks and metrics
- **Orchestration**: Workflow management and execution
- **Lab**: Research sandbox with Bedau Index, emergence detection, and SYMBI analysis
- **Trust & Compliance**: Trust analytics, receipts, risk assessment, and compliance reporting
- **Brain**: AI memory management with action effectiveness tracking
- **Alerts**: Real-time alert management and resolution
- **Audit**: Complete audit trails and compliance tracking
- **Tenants**: Multi-tenant management
- **Settings**: Comprehensive configuration including API keys, LLM providers, and security

## Technology Stack

### Core Framework
- **Next.js 14.2.35** (App Router)
- **React 18.3.1**
- **TypeScript 5.x**
- **Node.js 20+**

### UI & Styling
- **Tailwind CSS 4** (latest version)
- **Radix UI** (headless components)
- **Shadcn/ui** (component library)
- **Lucide React** (icon library)
- **Recharts** & **Chart.js** (data visualization)
- **GSAP 3.14.2** (animations)
- **Three.js 0.182.0** (3D graphics)

### State Management
- **TanStack Query (React Query 5.90.12)** - Server state and data fetching
- **Zustand 5.0.9** - Client state
- **React Hooks** (useState, useEffect, useContext)

### Data & Real-time
- **Socket.IO Client 4.8.3** - WebSocket for real-time updates
- **ioredis 5.8.2** - Redis client
- **Supabase JS 2.89.0** - Database client

### Utilities
- **Sonner 2.0.7** - Toast notifications
- **React Hook Form 7.68.0** - Form management
- **clsx** & **tailwind-merge** - Class name utilities

## Project Structure

```
apps/web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── dashboard/           # Dashboard pages (24 pages)
│   │   │   ├── overview/       # Dashboard overview
│   │   │   ├── agents/         # Agent management
│   │   │   ├── monitoring/     # System monitoring
│   │   │   ├── orchestrate/    # Workflow orchestration
│   │   │   ├── lab/            # Research lab (4 sub-pages)
│   │   │   ├── trust/          # Trust analytics & receipts
│   │   │   ├── risk/           # Risk assessment
│   │   │   ├── brain/          # Brain/memory management
│   │   │   ├── alerts/         # Alert management
│   │   │   ├── audit/          # Audit trails
│   │   │   ├── tenants/        # Tenant management
│   │   │   ├── receipts/       # Trust receipts
│   │   │   ├── api/            # API key management
│   │   │   ├── docs/           # Documentation
│   │   │   ├── glossary/       # Glossary
│   │   │   ├── verify/         # Verification tools
│   │   │   ├── settings/       # Settings (2 sub-pages)
│   │   │   ├── chat/           # Chat interface
│   │   │   └── overrides/      # Override management
│   │   ├── demo/               # Demo pages (6 pages)
│   │   ├── api/                # API routes (8 endpoints)
│   │   └── health/             # Health endpoint
│   ├── components/              # React components
│   │   ├── ui/                 # 22 UI components (Shadcn/ui)
│   │   ├── agents/             # Agent modals
│   │   ├── chat/               # Chat components
│   │   ├── trust-receipt/      # Trust receipt components
│   │   └── tutorial/           # Tutorial components
│   ├── lib/                     # Utilities & libraries
│   │   ├── api.ts              # API client (30+ methods)
│   │   ├── stores/             # Zustand stores
│   │   ├── security-utils.ts   # Security utilities
│   │   ├── socket.ts           # WebSocket client
│   │   └── validation.ts       # Input validation
│   ├── middleware/              # Next.js middleware
│   │   ├── auth-middleware.ts
│   │   ├── route-protection.ts
│   │   └── monitoring-middleware.ts
│   ├── hooks/                   # Custom React hooks
│   └── __tests__/              # Test files (7 test suites)
├── public/                      # Static assets
├── tests/                       # E2E tests
└── scripts/                     # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/s8ken/yseeku-platform.git
cd yseeku-platform
```

2. **Install dependencies:**
```bash
cd apps/web
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
INTERNAL_API_URL=http://localhost:3001
```

4. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Available Scripts

```bash
# Development
npm run dev              # Start development server on port 5000
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:e2e         # Run E2E tests

# Linting
npm run lint             # Run ESLint
```

## Architecture

### Frontend Architecture

The frontend follows a **layered architecture** with clear separation of concerns:

#### 1. Presentation Layer (Components)
- **UI Components**: Reusable Shadcn/ui components
- **Feature Components**: Domain-specific components (agents, trust receipts, etc.)
- **Page Components**: Page-level components using React Query for data

#### 2. Data Layer (API Client)
- **API Client**: Centralized API client (`src/lib/api.ts`)
- **30+ Methods**: Comprehensive API coverage
- **Error Handling**: Automatic error handling and retry logic
- **Type Safety**: TypeScript interfaces for all responses

#### 3. State Management
- **Server State**: TanStack Query for API data
- **Client State**: Zustand for UI state
- **Local State**: React hooks for component state

#### 4. Middleware Layer
- **Authentication**: JWT token management
- **Route Protection**: Protected routes middleware
- **Monitoring**: Performance and error tracking

### Key Design Patterns

1. **Server Components**: Next.js App Router for performance
2. **Client Components**: 'use client' directive for interactivity
3. **Data Fetching**: TanStack Query with caching and refetching
4. **Error Boundaries**: Comprehensive error handling
5. **Optimistic Updates**: Improved UX for mutations

## API Integration

### API Client

The frontend uses a centralized API client (`src/lib/api.ts`) with 30+ methods covering all platform features.

### Authentication

The frontend handles authentication automatically:
1. **Guest Login**: Auto-provisions guest user if no token exists
2. **Token Storage**: Securely stores JWT tokens in localStorage
3. **Token Refresh**: Automatic token refresh on expiration
4. **401 Handling**: Clears session and attempts re-authentication

### API Methods

**Authentication & User:**
- `getMe()` - Get current user
- `getAuthToken()` - Get authentication token

**KPIs & Metrics:**
- `getKPIs(tenant?)` - Get platform KPIs
- `getDemoKpis()` - Get demo KPIs

**Agents:**
- `getAgents(tenant?, status?)` - List agents
- `getAgent(id)` - Get agent details
- `deleteAgent(id)` - Delete agent
- `getDemoAgents()` - Get demo agents

**Alerts:**
- `getAlerts(tenant?)` - Get alerts
- `getAlertsManagement(filters?)` - Get alerts with management
- `getDemoAlerts()` - Get demo alerts

**Trust:**
- `getTrustAnalytics(conversationId?, days?, limit?)` - Get trust analytics
- `getTrustReceipts(conversationId?, sessionId?, limit?, offset?)` - Get trust receipts
- `getTrustReceiptsList(limit?, offset?)` - Get trust receipts list
- `getTrustReceiptByHash(hash)` - Get trust receipt by hash

**Brain:**
- `getBrainMemories(tenantId, kind?, limit?)` - Get brain memories
- `getBrainMemoriesByTags(tenantId, tags, limit?)` - Get memories by tags
- `deleteBrainMemory(memoryId)` - Delete memory
- `getActionEffectiveness(tenantId, actionType?, days?)` - Get action effectiveness
- `getActionRecommendations(tenantId)` - Get recommendations
- `getBrainCycles(tenantId, limit?)` - Get brain cycles

**Orchestration:**
- `getWorkflows()` - Get workflows
- `executeWorkflow(workflowId, input)` - Execute workflow

**Risk:**
- `getRisk(tenant?)` - Get risk assessment
- `getDemoRisk()` - Get demo risk

**Audit:**
- `getAuditTrails(params?)` - Get audit trails
- `getAuditLogs(params)` - Get audit logs

**Tenants:**
- `getTenants(limit, offset)` - Get tenants
- `getDemoTenants()` - Get demo tenants

**Experiments:**
- `getExperiments()` - Get experiments
- `getDemoExperiments()` - Get demo experiments

**API Keys:**
- `getLLMKeys()` - Get LLM API keys
- `saveApiKey(provider, key)` - Save API key
- `deleteApiKey(provider)` - Delete API key
- `getPlatformApiKeys()` - Get platform API keys

### Error Handling

All API calls include comprehensive error handling:
- Automatic retry logic
- User-friendly error messages
- Toast notifications
- Fallback to demo data

## State Management

### TanStack Query (Server State)

Used for API data fetching and caching:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['agents'],
  queryFn: () => api.getAgents(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true,
});
```

**Features:**
- Automatic caching
- Background refetching
- Optimistic updates
- Query invalidation

### Zustand (Client State)

Used for UI state and preferences:

```typescript
import { useTutorialStore } from '@/lib/stores/tutorial-store';

const { showTutorial, setShowTutorial } = useTutorialStore();
```

**Features:**
- Lightweight state management
- TypeScript support
- DevTools integration

## Routing

### Dashboard Routes

The dashboard uses Next.js App Router with 24 pages:

**Core Dashboard:**
- `/dashboard` - Main dashboard
- `/dashboard/overview` - Overview with KPIs
- `/dashboard/agents` - Agent management
- `/dashboard/monitoring` - System monitoring
- `/dashboard/orchestrate` - Workflow orchestration

**Lab:**
- `/dashboard/lab/bedau` - Bedau Index analysis
- `/dashboard/lab/emergence` - Emergence detection
- `/dashboard/lab/experiments` - Experiments
- `/dashboard/lab/symbi` - SYMBI analysis

**Trust & Compliance:**
- `/dashboard/trust` - Trust analytics
- `/dashboard/risk` - Risk assessment
- `/dashboard/receipts` - Trust receipts

**Management:**
- `/dashboard/brain` - Brain management
- `/dashboard/alerts` - Alert management
- `/dashboard/audit` - Audit trails
- `/dashboard/tenants` - Tenant management

**Configuration:**
- `/dashboard/api` - API keys
- `/dashboard/settings` - Settings
- `/dashboard/settings/trust` - Trust settings

**Other:**
- `/dashboard/chat` - Chat interface
- `/dashboard/overrides` - Overrides
- `/dashboard/overrides/history` - Override history
- `/dashboard/docs` - Documentation
- `/dashboard/glossary` - Glossary
- `/dashboard/verify` - Verification

### Demo Routes

- `/demo` - Demo landing
- `/demo/lab` - Lab demo
- `/demo/orchestration` - Orchestration demo
- `/demo/resonance` - Resonance demo
- `/demo/symbi` - SYMBI demo
- `/demo/trust` - Trust demo

## Styling

### Tailwind CSS

The application uses Tailwind CSS 4 with custom configuration:

**Theme Colors:**
- Primary: Cyan (`cyan-500`, `cyan-600`)
- Secondary: Purple (`purple-500`, `purple-600`)
- Lab: Custom lab colors
- Detect: Custom detect colors

**Responsive Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Dark Mode:**
- Full dark mode support
- Automatic theme switching
- Persisted theme preference

## Component Library

### Shadcn/ui Components

The application uses 22+ Shadcn/ui components:

**Form Components:**
- Input, Textarea, Select
- Checkbox, Switch, Slider
- Button, Label

**Layout Components:**
- Card, Separator, Tabs
- Dialog, Sheet, Scroll Area

**Feedback Components:**
- Badge, Progress, Avatar
- Tooltip, Alert

### Custom Components

**Feature Components:**
- `ChatContainer` - Chat interface
- `ChatMessage` - Message component
- `TrustReceiptCard` - Trust receipt display
- `TrustReceiptCompact` - Compact receipt view
- `AgentCreateModal` - Agent creation
- `AgentEditModal` - Agent editing
- `ResonanceExplorer` - 3D resonance visualization
- `ConstitutionalPrinciples` - Principles display
- `TutorialTour` - Interactive tutorial

## Security

### Authentication

- JWT token-based authentication
- Automatic guest login
- Token refresh on expiration
- Protected routes middleware
- Role-based access control (RBAC)

### CSRF Protection

- CSRF token generation and validation
- Secure cookie handling
- Double-submit cookie pattern

### Security Headers

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### Input Validation

- Client-side validation
- Server-side validation
- XSS prevention
- SQL injection prevention
- Sanitization libraries

## Testing

### Unit Tests

Run unit tests:
```bash
npm test
```

**Current Coverage:**
- 115 tests passing
- 7 test files
- 0 tests failing

**Test Areas:**
- Authentication
- Authorization/RBAC
- API responses
- Validation
- Security
- Routes

### E2E Tests

Run E2E tests:
```bash
npm run test:e2e
```

## Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Environment Variables

Required environment variables for production:
```env
NEXT_PUBLIC_API_URL=https://api.yourseekuplatform.com
INTERNAL_API_URL=http://backend:3001
NODE_ENV=production
```

### Vercel Deployment

The application is configured for Vercel deployment:

1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

## Performance Optimization

### Code Splitting

- Automatic code splitting with Next.js
- Dynamic imports for heavy components
- Route-based splitting

### Caching

- TanStack Query caching
- Image optimization (Next.js Image)
- Static asset caching

### Lazy Loading

- Component lazy loading
- Route lazy loading
- Dynamic imports

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -ti:5000 | xargs kill -9
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build errors:**
```bash
npm run lint -- --fix
```

## Development Guidelines

### Code Style

- Use TypeScript for all files
- Follow ESLint rules
- Use Prettier for formatting
- Write descriptive component names

### Component Guidelines

- Use functional components
- Use TypeScript interfaces for props
- Implement proper error handling
- Add loading and error states
- Make components reusable

### API Integration

- Use centralized API client
- Handle errors gracefully
- Implement retry logic
- Show loading states
- Use optimistic updates

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests if applicable
4. Run tests and linting
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For support and questions:
- GitHub Issues: https://github.com/s8ken/yseeku-platform/issues
- Documentation: /dashboard/docs

---

**Last Updated:** January 17, 2025  
**Version:** 1.4.0  
**Framework:** Next.js 14.2.35