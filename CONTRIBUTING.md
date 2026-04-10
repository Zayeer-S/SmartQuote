# Contributing to SmartQuote

## Getting Started

Refer to the local development setup in [README.md](./README.md).

---

## Development Workflow

### Branching

Use feature branches off `main`. Name them descriptively: `feat/quote-approval-ui`, `fix/sla-breach-calc`, `chore/update-deps`.

### Commits

Follow conventional commits (https://www.conventionalcommits.org/en/v1.0.0/) and write imperative-mood commit messages: `feat: Add SLA breach alert`, not `feat: Added SLA breach alert`.

### Pull Requests

- Keep PRs focused on one concern
- The pre-commit hook (Husky + lint-staged) runs ESLint and Prettier on staged files automatically
- Both CI workflows (`ci-unit-integration` and `ci-e2e`) must pass before CD will deploy

---

## Architecture Rules

### Backend: Strict Layering

The backend enforces a one-way dependency chain. Each layer has a single responsibility and must not reach into a lower layer's concerns:

```
Routes => Controllers => Services => DAOs => Database
```

| Layer          | Responsibility                                 | Must NOT                                            |
| -------------- | ---------------------------------------------- | --------------------------------------------------- |
| `routes/`      | Map URLs to controllers, apply middleware      | Contain any logic                                   |
| `controllers/` | Parse HTTP request, call service, map response | Contain business rules                              |
| `services/`    | All business logic and workflow                | Make HTTP calls or know about Express               |
| `daos/`        | Database queries only                          | Validate input, check permissions, or call services |
| `validators/`  | Input shape validation (Zod)                   | Access the database or call services                |

**If you are unsure where code belongs, ask:**

1. Is it an HTTP concern (parsing, status codes, headers)? => `controllers/`
2. Is it a business rule or workflow decision? => `services/`
3. Is it a database query? => `daos/`
4. Is it input shape validation? => `validators/`
5. Is it wiring dependencies together? => `containers/`

### Dependency Injection

Services are never instantiated directly outside `containers/`. The container files are the only place that wires dependencies together. If you add a new service, register it in the appropriate container and inject it via constructor.

### Shared Contracts

`src/shared/contracts/` is the single source of truth for all request/response types. Frontend and backend both import from here. **If you add or change a field in an API response, update the contract first, then update both sides.**

`src/shared/constants/lookup-values.ts` defines all enumerated domain values (ticket types, severities, statuses, etc.) used in both seed data and frontend display. Never hardcode a lookup string in application code -- import from here.

`src/shared/constants/endpoints.ts` defines all API endpoint paths. The frontend's `lib/api/` layer and the backend's `routes/` layer both import from here. Never write an endpoint path string in two places.

### Lookup Resolution

The backend stores enumerated values as integer foreign keys in the database (e.g. `ticket_severity_id: 3`). The `LookupResolver` class (`src/server/lib/lookup-resolver.ts`) converts between IDs and human-readable names. Controllers use it to map outgoing rows to contract types. **Never expose raw integer IDs in API responses** -- always resolve to the string name via `LookupResolver` before returning.

### Branded ID Types

Database IDs are branded TypeScript types (`TicketId`, `UserId`, etc.) defined in `src/server/database/types/ids.ts`. Use these instead of plain `string` wherever an ID is expected. This prevents accidentally passing the wrong ID type to a function.

---

## Frontend Architecture Rules

### Feature-Based Structure

```
components/   -- Pure reusable UI. No API calls, no auth, no domain knowledge.
features/     -- Domain-scoped behaviour. Composed from components and hooks.
hooks/        -- Thin adapters between UI and API. No business rules.
lib/api/      -- The only place that knows API endpoint URLs.
pages/        -- Route-level composition only. No logic, only assemble features.
```

The dependency direction is: `pages => features => hooks => lib/api`. Pages compose features. Features do not compose other features. Components do not know about features.

### Hooks

Each hook covers one operation (e.g. `useGetTicket`, `useCreateTicket`). Do not merge unrelated operations into a single hook -- this forces consumers to take on state they do not need. Hooks live in `src/client/hooks/` grouped by domain.

### CSS Design Tokens

`src/client/styles/globals.css` is the single source of truth for all design tokens. Always use `var(--)` custom properties -- never hardcode colors, spacing, font sizes, shadows, or radii.

| Token group   | Prefix                                    |
| ------------- | ----------------------------------------- |
| Colors        | `--color-`                                |
| Spacing       | `--space-`                                |
| Typography    | `--font-`                                 |
| Border radius | `--radius-`                               |
| Shadows       | `--shadow-`                               |
| Transitions   | `--transition-`, `--duration-`, `--ease-` |
| Z-index       | `--z-`                                    |

Dark mode is implemented via `[data-theme='dark']` on the root element. **Never write a `@media (prefers-color-scheme)` block** -- theme state is user-controlled via `ThemeContext`. All color tokens already have dark values declared; use semantic tokens (`--color-bg`, `--color-text-primary`, etc.), not palette tokens (`--color-black`, `--color-white`).

### Testing Attributes

Every interactive element and every meaningful container that a test needs to locate must have a `data-testid` attribute. This is the primary selector strategy for Playwright. Use kebab-case IDs that describe role and context: `data-testid="admin-ticket-detail-page"`, `data-testid="submit-ticket-form"`.

---

## Adding a New Feature End-to-End

This is the full-stack path for a new endpoint. Follow this order to avoid drift between layers.

### 1. Database (if needed)

Add a migration in `src/server/database/migrations/`. Migrations are numbered sequentially. Run `npm run db:migrate` locally to verify it applies cleanly. If you add a new lookup table, populate it in `src/server/database/seeds/` and add the values to `src/shared/constants/lookup-values.ts`.

### 2. DAO

Add a method to the appropriate DAO in `src/server/daos/children/`. DAOs extend `BaseDAO` or one of its children (`DeletableDAO`, `ActivatableDAO`). Keep methods focused on a single query. Document parameters and return types with JSDoc.

If you are adding a new `findWithDetails`-style join query, follow the `buildDetailsQuery` pattern -- extract the shared join logic into a private builder so `findOne` and `findMany` variants cannot drift apart.

Note: `pg` returns `DECIMAL`/`NUMERIC` columns as strings. Always coerce with `Number()` in mapper methods.

### 3. Service

Add business logic to the appropriate service in `src/server/services/`. Services receive dependencies via constructor injection -- never instantiate a DAO directly inside a service. Permission checks go here using `RBACService.hasPermission`. Throw domain-specific errors (e.g. `TicketError`, `ForbiddenError`) not generic `Error`.

Fire-and-forget side effects (notifications, embedding generation) must use `void` and must never be able to fail the primary operation.

### 4. Contract

Add request/response types to the appropriate file in `src/shared/contracts/`. This is the handshake between client and server. Agree on the shape before implementing either side.

### 5. Validator

Add a Zod schema to `src/server/validators/`. Validators check input shape only -- no database access, no service calls. Use `z.string().regex(...)` for query-string date fields, not `z.date()`.

### 6. Controller

Add a method to the appropriate controller. Controllers: parse the request using `validateOrThrow`, call the service, map the result to the contract type using `LookupResolver`, and call `success()` or `error()`. Keep mapping logic in private `map*` methods.

### 7. Route

Register the endpoint in the appropriate routes file. Apply `authenticate` and `can(PERMISSIONS.X)` middleware. Endpoint paths must come from `src/shared/constants/endpoints.ts` -- never write a path string directly.

### 8. API Client

Add a method to the appropriate file in `src/client/lib/api/`. Import the endpoint constant from `src/shared/constants/endpoints.ts` and the request/response types from `src/shared/contracts/`.

### 9. Hook

Add a hook in `src/client/hooks/`. One hook per operation. The hook calls the API function and manages loading/error state. No business logic here.

### 10. UI

Compose the feature from components and hooks in `src/client/features/`. Add `data-testid` attributes to all interactive and structurally important elements.

---

## Key Principles

### DRY (Don't Repeat Yourself)

Extract repeated logic into utilities, services, or components. Never copy-paste business rules. If a query shape is shared between two DAO methods, extract a private builder (see `buildDetailsQuery` in `TicketsDAO`).

### Single Responsibility

Each module does only one thing. If a file has multiple concerns, split it.

### Config as Single Source of Truth

All config values live in their own files. No hardcoded values scattered through code. Import from config.

### No Quick Workarounds

Fix root causes, not symptoms. If something feels hacky, it probably is -- discuss alternatives before merging.

---

## Testing

Refer to [testing guide](docs/guides/TESTS.md)

---

## CI/CD

Refer to [CI/CD guide](docs/guides/CICD.md)

---

## Questions

When in doubt, open a discussion before implementing. The architecture is deliberate -- a misplaced file is harder to fix after the fact than a conversation upfront.
