Three GitHub Actions workflows:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci-unit-integration.yml` | Push / PR to `main` | Lint, type-check, unit + integration tests |
| `ci-e2e.yml` | Push / PR to `main` | Playwright E2E smoke tests against a local stack |
| `cd.yml` | `workflow_run` on CI pass | CDK deploy + migrate Lambda invocation |

Sensitive values are stored in GitHub Secrets. Non-sensitive CI config lives in `.env.ci` at the repo root.

The CD pipeline is gated on both CI workflows passing. It will not deploy if either fails.