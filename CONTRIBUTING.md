# Contributing to SmartQuote

## Getting Started

Refer to local development setup in [README.md](./README.md)

## Development Workflow

## Architecture Rules

- TODO

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

Refer to [database guide](docs/guides/DB.md) for useful commands

## Testing

Refer to [testing guide](docs/guides/TESTS.md) for useful commands

## Questions

If unsure where code belongs, ask:

1. Does it make HTTP calls? => `lib/api/` (client) or `controllers/` (server)
2. Is it a business rule? => `services/`
3. Is it a database query? => `daos/`
4. Is it pure UI? => `components/`
5. Does it know about domain concepts? => Not in `lib/utils/`

When in doubt, open a discussion before implementing.
