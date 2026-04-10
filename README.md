# SmartQuote

Intelligent quoting system for support and incident tickets, built for Giacom.

Customers submit support, incident, or enhancement tickets. The system automatically generates cost and time estimates using a rule-based engine augmented by an XGBoost ML model. Admins review both estimates, approve or adjust quotes, and manage the full ticket lifecycle.

Live: https://smartquote.zayeer.dev

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [ML Model](#ml-model)
- [CI/CD](#cicd)

---

## Tech Stack

| Layer                  | Technology                                             |
| ---------------------- | ------------------------------------------------------ |
| Frontend               | React, TypeScript, Vite                                |
| Backend                | Node.js 22, Express, TypeScript                        |
| Database               | PostgreSQL 16 (AWS RDS)                                |
| Infrastructure         | AWS CDK (TypeScript)                                   |
| Compute                | AWS Lambda (Node.js zip + Python container)            |
| CDN                    | AWS CloudFront                                         |
| Storage                | AWS S3                                                 |
| Embeddings             | AWS Bedrock (Titan Text Embeddings V2)                 |
| ML Runtime             | XGBoost + scikit-learn (Python 3.12, Lambda container) |
| DNS                    | Cloudflare                                             |
| CI/CD                  | GitHub Actions                                         |
| E2E Tests              | Playwright                                             |
| Unit/Integration Tests | Vitest                                                 |

---

## Repository Structure

```
smartquote/
├── .github/workflows/      # CI (unit/integration + E2E) and CD pipelines
├── .github/actions/        # Reusable workflow actions
├── docs/                   # Project documentation
├── infra/                  # AWS CDK infrastructure (TypeScript)
│   ├── lib/app-stack.ts    # Main stack: Lambda, API Gateway, CloudFront, S3
│   ├── lib/database-stack.ts # VPC, RDS, security groups, VPC endpoints
│   ├── lib/config.ts       # Single source of truth for all infra config values
│   └── test/infra.test.ts  # CDK assertion tests
├── models/                 # ML model training pipeline (Python)
│   ├── scripts/            # Synthetic data generation
│   ├── notebooks/          # Jupyter training notebook
│   ├── data/               # Generated CSV (gitignored)
│   ├── output/             # Trained .pkl artifacts (gitignored)
│   └── handler/            # Python Lambda handler + Dockerfile
├── src/
│   ├── client/             # React frontend
│   │   ├── components/     # Pure reusable UI (no domain knowledge)
│   │   ├── features/       # Domain-scoped UI behaviour
│   │   ├── hooks/          # Thin API adapter hooks
│   │   ├── lib/api/        # API call layer (only place that knows endpoints)
│   │   └── pages/          # Route-level composition (no logic)
│   ├── server/             # Express backend
│   │   ├── bootstrap/      # App startup, Lambda handlers
│   │   ├── containers/     # Dependency injection wiring
│   │   ├── controllers/    # HTTP request/response only
│   │   ├── daos/           # Database access only
│   │   ├── services/       # All business logic
│   │   └── validators/     # Input shape validation (Zod)
│   └── shared/             # Contracts and constants shared by client + server
│       ├── contracts/      # TypeScript DTO types (frontend/backend stay in sync)
│       └── constants/      # Lookup values and API endpoints
└── tests/
    ├── e2e/                # Playwright smoke tests
    ├── integration/        # Route-level integration tests (Vitest)
    └── unit/               # Service-level unit tests (Vitest)
```

---

## Local Development Setup

### Prerequisites

- Node.js 22
- Python 3.12 + pip (only needed if working on the ML model)
- Docker (for the local PostgreSQL instance)
- pgAdmin4 (for the local PostgreSQL instance if not using Docker)

### Setup

## Docker Setup

```bash
# 1. Install dependencies, audit, copy env file, start the local database, and run migrations
npm run setup

# 2. Fill in .env.local (see Environment Variables section below)

# 3. Start the dev server (frontend + backend concurrently)
npm run dev
```

## Non-Docker Setup

```bash
# 1. Install dependencies, audit, copy env file, start the local database, and run migrations
npm i && npm audit fix --force && cp .env.example .env.local

# 2. Fill in .env.local (see Environment Variables section below)

# 3. Follow [database guide in docs folder](docs/guides/DB.md) for pgAdmin4 setup

# 4. Start the dev server (frontend + backend concurrently)
npm run dev
```

The app will be available at http://localhost:5173. The API runs at http://localhost:3000.

---

## Environment Variables

All variables are defined in `.env.example`. Copy to `.env.local` for local development. `.env.example` is already populated with dummy examples.

Note: In production, `DB_SECRET_ARN` and `APP_SECRET_ARN` are used instead of plain DB credentials. Secrets are fetched from AWS Secrets Manager at Lambda cold start.

---

## Running Tests

Refer to [testing guide](docs/guides/TESTS.md)

---

## Deployment/Infrastructure

Refer to [infrastructure guide](docs/guides/INFRA.md)

---

## ML Model

Refer to [ML guide](docs/guides/ML.md)

---

## CI/CD

Refer to [CI/CD guide](docs/guides/CICD.md)
