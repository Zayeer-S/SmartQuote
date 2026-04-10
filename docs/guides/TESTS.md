# Useful Commands
- `npm run test:unit:server`: Run all unit tests for server
- `npm run test:unit:client`: Run all unit tests for client
- `npm run test:integration`: Run all integration tests
- `npm run test:e2e`: Run all E2E tests
- `cd infra && npx jest test`: Run CDK assertion tests (only work on Linux/MacOS - not Windows)

# Unit Tests
Test service-layer logic in isolation using mock DAOs from `tests/utils/mock.daos.ts`. Unit tests must not hit the database.

# Integration Tests
Test the full HTTP stack (routes => controllers => services => DAOs) against a real local database. Use `tests/helpers/setup.integration.ts` for the test database connection.

# E2E Smoke Tests (Playwright)
Smoke tests run against the full local stack. Each role (`admin`, `customer`) has a pre-authenticated `storageState` set up in `tests/e2e/setup/`. Use `data-testid` attributes as the primary selector strategy -- never select by class or text content unless there is no alternative. If you add a significant new user flow, add a smoke test for it.
