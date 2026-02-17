# Contributing to SmartQuote

## Getting Started

# Install Node and PgAdmin4
- https://nodejs.org/en/download
- https://www.pgadmin.org/download/

# Run these commands in order:

```bash
npm install
npm run setup          # Install deps, run migrations, and seed database
npm run dev:full       # Start both client and server in dev mode
```

## Development Workflow

### Manual Quality Checks

```bash
npm run validate       # Run all checks (lint, type-check, tests)
npm run check          # Lint, type-check, and format check
```

## Architecture Rules

- Consult STRUCTURE.md in docs to understand the architectural rules

## Key Principles

### 1. DRY (Don't Repeat Yourself)

- Extract repeated logic into utilities, services, or components
- Never copy-paste business rules

### 2. Single Responsibility

- Each module does only one thing
- If a file has multiple concerns, split it

### 3. Config as Single Source of Truth

- All config values in their own files
- No hardcoded values scattered throughout code
- Import from config

### 4. No Quick Workarounds

- Fix root causes, not symptoms
- If something feels hacky, it probably is - discuss alternatives

## Database Workflow

```bash
npm run db:migrate                        # Run pending migrations
npm run db:migrate:rollback               # Rollback last batch
npm run db:reset                          # Fresh database (rollback all + migrate + seed)
```

## Testing

```bash
npm run test           # Run unit tests in watch mode
npm run test:run       # Run unit tests once
npm run test:coverage  # Generate coverage report
npm run test:e2e       # Run Playwright E2E tests
npm run test:e2e:ui    # Run E2E tests with UI
```

## Questions

If unsure where code belongs, ask:

1. Does it make HTTP calls? => `lib/api/` (client) or `controllers/` (server)
2. Is it a business rule? => `services/`
3. Is it a database query? => `daos/`
4. Is it pure UI? => `components/`
5. Does it know about domain concepts? => Not in `lib/utils/`

When in doubt, open a discussion before implementing.
