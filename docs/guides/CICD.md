Three GitHub Actions workflows run on push and PR to `main`:

| Workflow | What it does |
|---|---|
| `ci-unit-integration.yml` | Lint, type-check, unit + integration tests |
| `ci-e2e.yml` | Playwright smoke tests against a local stack |
| `cd.yml` | CDK deploy + migrate Lambda invocation (gated on both CI workflows passing) |

**Secrets vs config:** Sensitive values (AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY) go in GitHub Secrets. Non-sensitive CI configuration (ports, feature flags, log levels) goes in `.env.ci` at the repo root. If you add a new secret, add a placeholder to `.env.example` with a comment explaining what it is.

**SMTP / email vars** must be optional in the Zod backend schema (not required strings) because the email service is not available in CI. Gate the `EmailService` behind lazy initialization rather than throwing at module load time.