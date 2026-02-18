smartquote/
├── .github/
│   ├── actions/
│   │   └── actions/
│   │       └── setup/
│   └── workflows/
│       └── push.yml
│
├── .husky/
│   └── pre-commit/                                 # Lint-staged
│
├── docs/
│   ├── STRUCTURE.md
│   └── TEAM_GUIDE.md
│
├── src/
│   ├── client/
│   │   ├── main.tsx
│   │   ├── components/                             # Pure reusable UI elements; must not know about APIs, auths, or domain concepts
│   │   ├── config/                                 # Environment and config values only; no runtime logic
│   │   │   ├── index.ts
│   │   │   ├── env.frontend.ts
│   │   ├── constants/
│   │   │   ├── index.ts
│   │   │   ├── client.routes.ts
│   │   ├── context/
│   │   │   └── auth/
│   │   │       ├── auth.context.types.ts
│   │   │       └── AuthContext.ts
│   │   ├── features/                               # Feature scoped UI behaviour composed from components and hooks
│   │   ├── hooks/                                  # Thin adapters between UI and API layers. No business rules.
│   │   │   ├── useLogin.ts
│   │   │   └── auth/
│   │   │       ├── useAuth.ts
│   │   │       ├── useQuotePermissions.ts
│   │   │       ├── useTicketPermissions.ts
│   │   │       └── useUserPermissions.ts
│   │   ├── lib/
│   │   │   ├── api/                                # Only place that knows endpoints in client
│   │   │   │   ├── admin.api.ts
│   │   │   │   ├── auth.api.ts
│   │   │   │   └── http-client.ts
│   │   │   ├── storage/                            # Browser persistence tokens
│   │   │   │   ├── keys.ts
│   │   │   │   └── tokenStorage.ts
│   │   │   └── utils/                              # Generic helpers only; if it knows about e.g. tickets, it doesn't belong here
│   │   ├── pages/                                  # Route level composition (no logic, only assemble features)
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.css
│   │   │   │   └── AdminDashboard.tsx
│   │   │   ├── customer/
│   │   │   │   ├── CustomerDashboard.css
│   │   │   │   └── CustomerDashboard.tsx
│   │   │   └── login/
│   │   │       ├── LoginPage.css
│   │   │       └── LoginPage.tsx
│   │   └── styles/                                 # Global styling and design tokens only; no component-specific styling
│   │       └── globals.css
│   │
│   ├── server/
│   │   ├── bootstrap/                              # Application startup and dependency wiring, no where else creates services.
│   │   │   ├── app.bootstrap.ts
│   │   │   ├── database.bootstrap.ts
│   │   │   └── server.ts
│   │   ├── config/                                 # Environment and config values only; no runtime logic
│   │   │   ├── index.ts
│   │   │   ├── auth-config.ts
│   │   │   ├── database-config.ts
│   │   │   ├── env.backend.ts
│   │   │   └── redis-config.ts
│   │   ├── containers/                             # Construct controllers by injecting dependencies; no business behaviour
│   │   │   ├── admin.container.ts
│   │   │   └── auth.container.ts
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   └── auth.controller.ts
│   │   ├── daos/                                   # Database persistence/access only - no validation, permissions, or workflow rules
│   │   │   ├── index.ts
│   │   │   ├── dao.factory.ts
│   │   │   ├── base/
│   │   │   │   ├── activatable.dao.ts
│   │   │   │   ├── base.dao.ts
│   │   │   │   ├── composite.key.dao.ts
│   │   │   │   ├── deletable.dao.ts
│   │   │   │   ├── lookup.table.dao.ts
│   │   │   │   └── types.ts
│   │   │   └── children/
│   │   │       ├── permissions.dao.ts
│   │   │       ├── roles.dao.ts
│   │   │       ├── sessions.dao.ts
│   │   │       └── users.dao.ts
│   │   ├── database/                               # Connection, migrations, and schema definitions only.
│   │   │   ├── connection.ts
│   │   │   ├── config/table-names.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_lookup_tables.ts
│   │   │   │   ├── 002_create_main_tables.ts
│   │   │   │   ├── 003_create_link_tables.ts
│   │   │   │   └── 004_create_update_triggers.ts
│   │   │   ├── seeds/
│   │   │   │   ├── 001_insert_seed_data.ts
│   │   │   │   └── helpers
│   │   │   │       ├── index.ts
│   │   │   │       ├── data-generators.ts
│   │   │   │       ├── lookup-data.ts
│   │   │   │       ├── lookup-id-maps.ts
│   │   │   │       └── password.helper.ts
│   │   │   └── types/
│   │   │       ├── ids.ts
│   │   │       └── tables.ts
│   │   ├── lib/
│   │   │   └── respond.ts
│   │   ├── middleware/                             # Cross-cutting HTTP behaviour (auth, errors, logging), never business decisions.
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── rate.limit.middleware.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── routes/                                 # Map URLs to controllers only - no logic allowed.
│   │   │   ├── admin.routes.ts
│   │   │   └── auth.routes.ts
│   │   ├── services/                               # All business rules/workflows here; nothing else enforces domain behaviour. No HTTP here.
│   │   │   ├── auth/
│   │   │   │   ├── auth.config.types.ts
│   │   │   │   ├── auth.errors.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── password.service.ts
│   │   │   │   └── session.service.ts
│   │   │   └── rbac/
│   │   │       └── rbac.service.ts
│   │   └── validators/                             # Input shape validation only; must not access database or services.
│   │       ├── auth.validator.ts
│   │       ├── user.validator.ts
│   │       └── validation-utils.ts
│   │
│   └── shared/
│       ├── constants/                              # Define all seed lookup table data here so frontend/backend stay in sync
│       │   ├── index.ts
│       │   ├── endpoints.ts
│       │   └── lookup-values.ts
│       └── contracts/                              # Define all DTO types here so frontend/backend share to prevent drift
│           ├── auth-contracts.ts
│           └── user-contracts.ts
│
├── tests/
│
├── .dockerignore
├── .env.example
├── .env.local
├── .gitignore
├── .prettierignore
├── .prettiererc
├── CONTRIBUTING.md
├── docker-compose.yml
├── DockerFile.dev
├── DockerFile.prod
├── eslint.config.js
├── index.html
├── knexfile.ts
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
