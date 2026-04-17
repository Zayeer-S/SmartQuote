# SmartQuote: Project Report

**Client:** Giacom
**Deployment:** https://smartquote.zayeer.dev

---

## 1. Project Overview

SmartQuote is a web-based ticketing and intelligent quoting system built for Giacom. Organisations submit support, incident, and enhancement/feature requests through a structured form. The system automatically evaluates each request and generates a cost and time estimate, which a support agent can review, adjust, and approve. Customers can then accept or reject the quote and track their ticket through to resolution.

The project fully implements all in-scope requirements from the brief and delivers the majority of the listed optional enhancements, including the stretch goal of AI-assisted quoting using machine learning.

---

## 2. System Architecture

The system is deployed entirely on AWS in the `eu-west-2` (London) region. The frontend is a static React SPA served via CloudFront from S3. All API traffic is proxied through CloudFront to API Gateway, which invokes the main application Lambda. The database is a private PostgreSQL 16 instance on RDS, accessible only from within the VPC.

A second Lambda (Python container) handles ML inference. It is invoked by the main Lambda via the AWS SDK and has no public endpoint.

[System design diagram](docs/diagrams/SYSTEM_DESIGN.png)

### Key architectural decisions

**Serverless compute.** Lambda with API Gateway was chosen over a persistent server (EC2, ECS) to eliminate idle costs and simplify scaling. The 29-second API Gateway hard limit is acceptable for all expected request types.

**Private networking.** All Lambdas run in `PRIVATE_ISOLATED` subnets with no NAT Gateway. AWS services (Secrets Manager, S3, Bedrock, Lambda) are reached via VPC interface and gateway endpoints, avoiding internet egress entirely. This keeps the architecture secure and cost-effective.

**Separate ML Lambda.** The ML inference function runs as a Python container image separate from the Node.js API Lambda. This keeps the runtimes decoupled — the Node bundle stays small and the Python container can be retrained and redeployed independently without touching the API.

**Shared contracts.** Frontend and backend share TypeScript type definitions in `src/shared/contracts/`. This eliminates an entire class of integration bugs: if the server changes a response shape, the client fails at compile time rather than at runtime.

---

## 3. Tech Stack

| Concern | Technology | Rationale |
|---|---|---|
| Frontend | React + TypeScript + Vite | Component model suits the admin dashboard; Vite gives fast local iteration |
| Backend | Node.js 22 + Express + TypeScript | Matches the frontend language; strong async I/O for Lambda workloads |
| Database | PostgreSQL 16 | Relational model suits structured ticket/quote data; strong JSONB support for embeddings and SLA contracts |
| ORM/Query builder | Knex | Lightweight; explicit SQL control without the overhead of a full ORM |
| Validation | Zod | Runtime schema validation with TypeScript type inference |
| Infrastructure | AWS CDK (TypeScript) | Infrastructure as code in the same language as the application |
| ML training | Python + XGBoost + scikit-learn | XGBoost is the standard for tabular ML; Python has the best ecosystem for model training |
| Embeddings | AWS Bedrock Titan Text V2 | Managed embedding service; no model hosting overhead; 1536-dim output captures rich semantic meaning from ticket text |
| DNS | Cloudflare | Free TLS + CNAME proxying; easy DNSSEC |
| CI/CD | GitHub Actions | Native to the repository; good CDK + Playwright support |

---

## 4. Backend Architecture

The backend follows a strict layered architecture enforced through code review and ESLint rules.

```
HTTP Request
    -> Routes          (URL to controller mapping only)
    -> Middleware      (auth, RBAC, error handling, rate limiting)
    -> Controllers     (HTTP in/out only; no business logic)
    -> Services        (all business rules and workflows)
    -> DAOs            (database access only)
    -> Database
```

Each layer has a single responsibility and may only call the layer directly below it. Services never touch HTTP. DAOs never enforce business rules. This makes the codebase straightforward to test — services can be unit-tested with mock DAOs, controllers can be integration-tested against a real database without touching business logic.

Dependency injection is handled through container classes (`src/server/containers/`). Each domain has one container that wires its DAOs, services, and controller together. The bootstrap module instantiates all containers once at cold start.

---

## 5. Frontend Architecture

The frontend uses a feature-based architecture.

```
Pages           (route-level composition; no logic)
  -> Features   (domain-scoped UI behaviour composed from components and hooks)
  -> Hooks      (thin API adapters; one hook per operation)
  -> Components (pure reusable UI; no domain knowledge)
  -> lib/api/   (only place that knows API endpoints)
```

Pages compose features; features never compose pages. Components have no knowledge of tickets, quotes, or any domain concept — they are generic UI primitives. This separation means UI components can be reused freely without pulling in domain dependencies.

CSS uses a design token system (`src/client/styles/globals.css`) with `var(--...)` throughout. Dark mode is implemented via a `[data-theme='dark']` attribute on the root element with no JavaScript colour calculations.

---

## 6. Quoting Logic

### 6.1 Rule-Based Engine

The rule-based engine is the primary quoting mechanism. It runs automatically on every auto-generate request and always produces a persisted quote.

**Step 1 — Rule matching.** The engine scans all active `QuoteCalculationRule` records ordered by `priority_order ASC`. It selects the first rule whose `ticket_severity_id`, `business_impact_id`, and `users_impacted` range match the ticket.

**Step 2 — Rate profile matching.** The engine finds the active `RateProfile` for the ticket's type, severity, and business impact combination, where the current date falls within the profile's effective date range.

**Step 3 — Rate selection.** If the current time is within business hours (09:00–17:00), `business_hours_rate` is used; otherwise `after_hours_rate` applies.

**Step 4 — Calculation.** The pure `computeQuote` function derives the final figures:

```
adjusted_min   = effort_hours_min * urgency_multiplier
adjusted_max   = effort_hours_max * urgency_multiplier
mid_hours      = (adjusted_min + adjusted_max) / 2
estimated_cost = mid_hours * hourly_rate
```

**Step 5 — Persistence.** The quote is saved as version `latest + 1`. The ticket's priority is updated to the rule's `suggested_ticket_priority_id`. The ticket creator is notified via email.

### 6.2 ML-Assisted Engine

The ML engine runs in parallel with the rule-based engine and produces a display-only estimate. Nothing is persisted from the ML estimate until an admin explicitly applies values.

**Inputs (38 features total):**

- 32 PCA-reduced dimensions from the ticket's Titan embedding (captures semantic meaning of the ticket title and description)
- 6 tabular features: `ticket_type_id`, `ticket_severity_id`, `business_impact_id`, `users_impacted`, `deadline_offset_days`, `is_after_hours`

**Models:**

- `XGBRegressor` with `multi_output_tree` strategy: predicts `estimated_hours_minimum`, `estimated_hours_maximum`, and `estimated_cost` simultaneously
- `XGBClassifier` with `multi:softprob` objective: predicts the suggested ticket priority (P1–P4) and returns the max class probability as a confidence score

**Training data:** 2,400 synthetic records generated with uniform distribution across all categorical combinations (3 ticket types × 4 severities × 4 business impacts × 2 after-hours states × 25 samples each). Targets are derived from the same business rules as the rule engine, with 5% Gaussian noise on cost to simulate real-world variance.

**Why uniform distribution?** Realistic ticket distributions skew heavily toward low/medium severity. A uniform distribution ensures the model sees equal training signal for critical/high combinations, which are the most important to quote accurately.

**Embeddings:** Titan Text Embeddings V2 produces 1536-dimensional vectors. PCA reduces these to 32 dimensions before XGBoost training. The PCA is fitted once on the training set and the transformer is serialised to `pca.pkl`. This is applied at inference time in the ML Lambda before the XGBoost models run.

**Model performance on held-out test set (20% split):**

| Target | MAE | R² |
|---|---|---|
| Hours minimum | 0.21 hrs | 0.997 |
| Hours maximum | 0.46 hrs | 0.997 |
| Estimated cost | £175 | 0.992 |
| Priority (accuracy) | — | 97% |

### 6.3 Admin Decision Flow

After auto-generate, the admin sees both estimates side-by-side in the quote panel:

- **Rule-based estimate** — full detail including hourly rate, effort level, confidence level, and approval history
- **ML estimate** — hours range, estimated cost, suggested priority, and a priority confidence percentage

The admin can accept the rule-based figures as-is, manually edit them to match the ML suggestion, or use their own judgement. The ML estimate is transient — it is not stored and disappears if the page is refreshed, ensuring the persisted quote always reflects a deliberate human decision.

---

## 7. Enhancements Implemented

All items below correspond to the optional enhancements listed in the project brief.

### Quote History & Revision Tracking
Every quote update creates an immutable `QuoteDetailRevision` record capturing the field name, old value, new value, reason, and actor. Admins can view the full revision history per quote version.

### Auto-Prioritisation Engine
A configurable point-scoring engine assigns ticket priority at submission time. Dimensions (severity, business impact, users affected, deadline proximity) each contribute a weighted score. Thresholds map total scores to P1–P4 priorities. The engine is seeded with configurable rules and thresholds stored in the database, making it adjustable without code changes.

### Service Level Agreements (SLA)
Admins can define SLA policies per user or organisation with configurable target resolution times. The SLA status component on the ticket detail page shows time remaining, whether the SLA is at risk, and whether it has been breached. SLA breach is calculated in real time from `ticket.created_at` against the policy's resolution target.

### Multi-User Support for Organisations
Customers belong to organisations. An organisation has members with `Member` or `Manager` org-local roles. Ticket visibility within an organisation is shared across members. Admins can manage organisations, members, and roles from the admin panel.

### Custom Rate Profiles
Admins define rate profiles combining ticket type, severity, business impact, business hours rate, after-hours rate, and an effective date range. The quoting engine automatically selects the active profile at quote generation time.

### Internal Comments & Collaboration
Tickets have a tabbed comment thread with three channel types: Internal (admin-only, hidden from customers), External (visible to all parties), and System (automated events). Admins and customers see only the channels appropriate to their role.

### Email Notifications
AWS SES sends transactional emails on three events: ticket received, quote generated, and ticket resolved. Email templates are plain TypeScript functions returning HTML strings (React Email is not compatible with the Lambda server runtime). SES runs through a VPC interface endpoint — no internet egress required.

### Quote Approval Workflow
Quotes follow a two-step workflow: Draft → Submitted → Approved/Rejected. Admins submit quotes for approval. Managers approve or reject with an optional comment. Customers can also reject an approved quote with a comment, triggering a revision cycle.

### Analytics & Reporting Dashboard
The admin analytics page provides three charts: ticket volume over time (by type), average resolution time by priority, and quote accuracy (estimated vs final cost). All charts are built with Recharts. Data can be exported as CSV or PDF.

### AI-Assisted Quoting (Stretch Goal)
Fully implemented as described in section 6.2. The XGBoost pipeline uses semantic embeddings from the ticket text alongside structured ticket attributes to produce independent cost and priority estimates. These are displayed alongside the rule-based quote to give the admin a second opinion.

---

## 8. Security

- Session-based authentication with bcrypt password hashing
- Role-based access control (RBAC) enforced at the middleware layer for system roles and at the service layer for org-local roles
- All database credentials stored in AWS Secrets Manager; never in environment variables or source control
- Lambda runs in `PRIVATE_ISOLATED` subnets; no public internet access
- S3 attachment bucket has public access blocked; files are accessed via Lambda execution role only
- Rate limiting on the login endpoint
- Input validation on all endpoints via Zod schemas

---

## 9. Testing Strategy

| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | Core services: auth, quote engine, password, session |
| Integration | Vitest + supertest | All route domains: auth, tickets, quotes, SLA, rate profiles |
| Infrastructure | CDK Assertions (Vitest) | Lambda config, VPC endpoints, security groups, IAM policies |
| E2E / Smoke | Playwright | Auth flows, ticket creation, admin comment thread, rate profiles, SLA |

Integration tests spin up a real PostgreSQL instance via Docker and run against the full Express app. E2E tests use per-role `storageState` files generated by setup projects to avoid re-authenticating on every test.

---

## 10. Known Limitations

- **Synthetic training data.** The ML model is trained on synthetic data derived from the same rule-based logic it is meant to augment. In production, retraining on real historical ticket and quote data would significantly improve prediction quality. The pipeline is designed to support this — replacing the synthetic CSV with real data and re-running the notebook is the only change required.

- **SES sandbox.** AWS SES is currently in sandbox mode, which restricts sending to verified email addresses only. Production sending requires submitting an AWS support request for SES production access.

- **ML estimate is transient.** The ML estimate is not persisted — it is only available immediately after auto-generate and disappears on page refresh. A future improvement would store the ML estimate alongside the rule-based quote in the database for audit purposes.