# Quiz Platform

A modern quiz platform built with a monorepo architecture.

## Project Structure

```
quiz-platform/
├── apps/                 # Application packages
│   ├── web-app/         # User-facing web application
│   ├── admin-app/       # Admin dashboard
│   └── api-server/      # Backend API server
├── packages/            # Shared packages
│   ├── ui/             # Shared UI components
│   ├── db/             # Database schemas and utilities
│   ├── types/          # Shared TypeScript types
│   ├── api-client/     # API client library
│   └── config/         # Shared configuration
├── infra/              # Infrastructure as code
└── docs/               # Documentation
```

## Getting Started

This project uses:
- **pnpm** for package management
- **Turborepo** for build orchestration
- **TypeScript** for type safety

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

## License

TBD

