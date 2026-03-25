smartquote/
├── .github/
│   ├── actions/
│   │   └── actions/
│   │       ├── code-quality/
│   │       └── setup/
│   └── workflows/
│       ├── cd.yml
│       ├── ci-e2e.yml
│       └── ci-unit-integaration.yml
│
├── .husky/
│   └── pre-commit/                                 # Lint-staged
│
├── docs/
│   ├── STRUCTURE.md
│   └── TEAM_GUIDE.md
│
├── infra/                                          # CDK - only include custom files here
│   ├── bin/
│   │   └── infra.ts
│   └── lib/
│       ├── app-stack.ts
│       ├── certificate-stack.ts
│       ├── config.ts
│       └── database-stack.ts
│
├── src/
│   ├── client/
│   │   ├── main.tsx
│   │   ├── components/                             # Pure reusable UI elements; must not know about APIs, auths, or domain concepts
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── auth/
│   │   │       └── LoginIcons.tsx
│   │   ├── config/                                 # Environment and config values only; no runtime logic
│   │   │   ├── index.ts
│   │   │   └── env.frontend.ts
│   │   ├── constants/
│   │   │   └── client.routes.ts
│   │   ├── context/
│   │   │   ├── auth/
│   │   │   │   ├── auth.context.types.ts
│   │   │   │   └── AuthContext.ts
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.context.types.ts
│   │   │   │   └── SidebarContext.ts
│   │   │   └── theme/
│   │   │       ├── index.ts # TODO REMOVE
│   │   │       ├── theme.context.types.ts
│   │   │       └── ThemeContext.ts
│   │   ├── features/                               # Feature scoped UI behaviour composed from components and hooks
│   │   │   ├── dashboard/
│   │   │   │   ├── DateRangeFilter.tsx
│   │   │   │   ├── QuoteAccuracyChart.tsx
│   │   │   │   ├── ResolutionTimeChart.tsx
│   │   │   │   ├── StatsOverview.css
│   │   │   │   ├── StatsOverview.tsx
│   │   │   │   ├── TicketStatusChart.tsx
│   │   │   │   └── TicketVolumeChart.tsx
│   │   │   └── tickets/
│   │   │       ├── AdminQuotePanel.css
│   │   │       ├── AdminQuotePanel.tsx
│   │   │       ├── AdminTicketCard.css
│   │   │       ├── AdminTicketCard.tsx
│   │   │       ├── AdminTicketDetail.css
│   │   │       ├── AdminTicketDetail.tsx
│   │   │       ├── AdminTicketList.css
│   │   │       ├── AdminTicketList.tsx
│   │   │       ├── AdminTicketForm.css
│   │   │       ├── AdminTicketForm.tsx
│   │   │       ├── CommentThread.css
│   │   │       ├── CommentThread.tsx
│   │   │       ├── CustomerTicketCard.css
│   │   │       ├── CustomerTicketCard.tsx
│   │   │       ├── CustomerTicketDetail.css
│   │   │       ├── CustomerTicketDetail.tsx
│   │   │       ├── QuoteActions.css
│   │   │       ├── QuoteActions.tsx
│   │   │       ├── QuotePanel.css
│   │   │       ├── QuotePanel.tsx
│   │   │       ├── SubmitTicketForm.css
│   │   │       ├── SubmitTicketForm.tsx
│   │   │       ├── TicketFilters.css
│   │   │       ├── TicketFilters.tsx
│   │   │       ├── TicketList.css
│   │   │       ├── TicketList.tsx
│   │   │       ├── TicketPagination.css
│   │   │       ├── TicketPagination.tsx
│   │   │       ├── TicketTimeline.css
│   │   │       └── TicketTimeline.tsx
│   │   ├── hooks/                                  # Thin adapters between UI and API layers. No business rules. All context hooks
│   │   │   ├── useLogin.ts
│   │   │   ├── useTicketFilters.ts
│   │   │   ├── analytics/
│   │   │   │   ├── useQuoteAccuracy.ts
│   │   │   │   ├── useResolutionTime.ts
│   │   │   │   └── useTicketVolume.ts
│   │   │   ├── auth/
│   │   │   │   ├── useQuotePermissions.ts
│   │   │   │   ├── useTicketPermissions.ts
│   │   │   │   └── useUserPermissions.ts
│   │   │   ├── context/                                 All context hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useSidebar.ts
│   │   │   │   └── useTheme.ts
│   │   │   ├── org/
│   │   │   │   ├── useAddOrgMembers.ts
│   │   │   │   ├── useCreateOrg.ts
│   │   │   │   ├── useDeleteOrg.ts
│   │   │   │   ├── useGetMyOrg.ts
│   │   │   │   ├── useGetOrg.ts
│   │   │   │   ├── useListOrgMembers.ts
│   │   │   │   ├── useListOrgs.ts
│   │   │   │   ├── useRemoveOrgMember.ts
│   │   │   │   └── useUpdateOrg.ts
│   │   │   ├── quotes/ 
│   │   │   │   ├── useApproveQuote.ts
│   │   │   │   ├── useCreateManualQuote.ts
│   │   │   │   ├── useGenerateQuote.ts
│   │   │   │   ├── useGetQuote.ts
│   │   │   │   ├── useGetRevisionHistory.ts
│   │   │   │   ├── useListQuote.ts
│   │   │   │   ├── useRejectQuote.ts
│   │   │   │   ├── useSubmitForApproval.ts
│   │   │   │   └── useUpdateForQuote.ts
│   │   │   └── tickets/
│   │   │       ├── useAddComment.ts
│   │   │       ├── useAssignTicket.ts
│   │   │       ├── useCreateTicket.ts
│   │   │       ├── useDeleteTicket.ts
│   │   │       ├── useGetTicket.ts
│   │   │       ├── useListComments.ts
│   │   │       ├── useListTicket.ts
│   │   │       ├── useResolveTicket.ts
│   │   │       └── useUpdateTicket.ts
│   │   ├── lib/
│   │   │   ├── api/                                # Only place that knows endpoints in client
│   │   │   │   ├── admin.api.ts
│   │   │   │   ├── analytics.api.ts
│   │   │   │   ├── auth.api.ts
│   │   │   │   ├── http-client.ts
│   │   │   │   ├── org.api.ts
│   │   │   │   ├── quote.api.ts
│   │   │   │   └── ticket.api.ts
│   │   │   ├── storage/                            # Browser persistence tokens
│   │   │   │   ├── keys.ts
│   │   │   │   └── tokenStorage.ts
│   │   │   └── utils/                              # Generic helpers only; if it knows about e.g. tickets, it doesn't belong here
│   │   │       ├── badge-utils.ts                  # Make lookup maps for XTicketCard and XTicketDetail files
│   │   │       ├── export-csv.ts
│   │   │       └── export-pdf.ts
│   │   ├── pages/                                  # Route level composition (no logic, only assemble features)
│   │   │   ├── admin/
│   │   │   │   ├── AdminAnalyticsPage.css
│   │   │   │   ├── AdminAnalyticsPage.tsx
│   │   │   │   ├── AdminLayout.css
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── AdminQuoteDetailPage.css
│   │   │   │   ├── AdminQuoteDetailPage.tsx
│   │   │   │   ├── AdminQuotesPage.css
│   │   │   │   ├── AdminQuotesPage.tsx
│   │   │   │   ├── AdminSettingsPage.css
│   │   │   │   ├── AdminSettingsPage.tsx
│   │   │   │   ├── AdminSLAPoliciesPage.css
│   │   │   │   ├── AdminSLAPoliciesPage.tsx
│   │   │   │   ├── AdminTicketDetailPage.css
│   │   │   │   ├── AdminTicketDetailPage.tsx
│   │   │   │   ├── AdminTicketsPage.css
│   │   │   │   └── AdminTicketsPage.tsx
│   │   │   ├── customer/
│   │   │   │   ├── CustomerLayout.css
│   │   │   │   ├── CustomerLayout.tsx
│   │   │   │   ├── CustomerSettingsPage.css
│   │   │   │   ├── CustomerSettingsPage.tsx
│   │   │   │   ├── DashboardPage.css
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── NewTicketPage.tsx
│   │   │   │   ├── TicketDetailPage.tsx
│   │   │   │   └── TicketsPage.tsx
│   │   │   └── login/
│   │   │       ├── CantAccessPage.css
│   │   │       ├── CantAccessPage.tsx
│   │   │       ├── LoginPage.css
│   │   │       └── LoginPage.tsx
│   │   └── styles/                                 # Global styling and design tokens only; no component-specific styling
│   │       └── globals.css
│   │
│   ├── server/
│   │   ├── bootstrap/                              # Application startup and dependency wiring, no where else creates services.
│   │   │   ├── app.bootstrap.ts
│   │   │   ├── database.bootstrap.ts
│   │   │   ├── lambda.handler.ts
│   │   │   ├── lambda.migrate.ts
│   │   │   ├── lambda.seed.ts
│   │   │   ├── secrets.ts
│   │   │   └── server.ts
│   │   ├── config/                                 # Environment and config values only; no runtime logic
│   │   │   ├── index.ts
│   │   │   ├── auth-config.ts
│   │   │   ├── database-config.ts
│   │   │   ├── email-config.ts
│   │   │   ├── env.backend.ts
│   │   │   └── redis-config.ts
│   │   ├── containers/                             # Construct controllers by injecting dependencies; no business behaviour
│   │   │   ├── admin.container.ts
│   │   │   ├── analytics.container.ts
│   │   │   ├── auth.container.ts
│   │   │   ├── org.container.ts
│   │   │   ├── quote.container.ts
│   │   │   └── ticket.container.ts
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── org.controller.ts
│   │   │   ├── quote.controller.ts
│   │   │   └── ticket.controller.ts
│   │   ├── daos/                                   # Database persistence/access only - no validation, permissions, or workflow rules
│   │   │   ├── base/
│   │   │   │   ├── activatable.dao.ts
│   │   │   │   ├── base.dao.ts
│   │   │   │   ├── composite.key.dao.ts
│   │   │   │   ├── deletable.dao.ts
│   │   │   │   ├── lookup.table.dao.ts
│   │   │   │   └── types.ts
│   │   │   └── children/
│   │   │       ├── organizations.domain.dao.ts
│   │   │       ├── permissions.dao.ts
│   │   │       ├── quote.approvals.dao.ts
│   │   │       ├── quote.calculation.rules.dao.ts
│   │   │       ├── quote.detail.revisions.dao.ts
│   │   │       ├── quotes.dao.ts
│   │   │       ├── rate.profiles.dao.ts
│   │   │       ├── roles.dao.ts
│   │   │       ├── sessions.dao.ts
│   │   │       ├── ticket.attachments.dao.ts
│   │   │       ├── ticket.comments.dao.ts
│   │   │       ├── ticket.priority.dao.ts
│   │   │       ├── tickets.dao.ts
│   │   │       └── users.dao.ts
│   │   ├── database/                               # Connection, migrations, and schema definitions only.
│   │   │   ├── connection.ts
│   │   │   ├── migration-utils.ts
│   │   │   ├── config/table-names.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_lookup_tables.ts
│   │   │   │   ├── 002_create_main_tables.ts
│   │   │   │   ├── 003_create_link_tables.ts
│   │   │   │   ├── 004_create_update_triggers.ts
│   │   │   │   ├── 005_create_priority_engine_tables.ts
│   │   │   │   ├── 006_fix_org_tables.ts
│   │   │   │   ├── 007_alter_ticket_attachments.ts
│   │   │   │   └── 008_add_resolved_at_to_tickets.ts
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
│   │   │   ├── nlp/
│   │   │   │   ├── bert-embedder.ts
│   │   │   │   └── cosine-similarity.ts
│   │   │   ├── lookup-maps.ts
│   │   │   ├── lookup-resolver.ts
│   │   │   └── respond.ts
│   │   ├── middleware/                             # Cross-cutting HTTP behaviour (auth, errors, logging), never business decisions.
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── rate.limit.middleware.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── routes/                                 # Map URLs to controllers only - no logic allowed.
│   │   │   ├── admin.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── org.routes.ts
│   │   │   └── ticket.routes.ts
│   │   ├── services/                               # All business rules/workflows here; nothing else enforces domain behaviour. No HTTP here.
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.errors.ts
│   │   │   │   └── analytics.service.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.config.types.ts
│   │   │   │   ├── auth.errors.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── password.service.ts
│   │   │   │   └── session.service.ts
│   │   │   ├── email/
│   │   │   ├── notification/
│   │   │   ├── org/
│   │   │   │   ├── org.errors.ts
│   │   │   │   ├── org.members.service.ts
│   │   │   │   ├── org.members.service.types.ts
│   │   │   │   ├── org.service.ts
│   │   │   │   └── org.service.types.ts
│   │   │   ├── quote/
│   │   │   │   ├── quote.engine.service.ts
│   │   │   │   ├── quote.errors.ts
│   │   │   │   └── quote.service.ts
│   │   │   ├── rbac/
│   │   │   │   ├── org.rbac.service.ts             # Local/Org RBAC
│   │   │   │   └── rbac.service.ts                 # System RBAC
│   │   │   ├── storage/
│   │   │   │   ├── local.storage.service.ts
│   │   │   │   ├── s3.storage.service.ts
│   │   │   │   ├── storage.errors.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   └── storage.service.types.ts
│   │   │   └── ticket/
│   │   │       ├── comment.service.ts
│   │   │       ├── ticket.errors.ts
│   │   │       ├── ticket.service.ts
│   │   │       ├── ticket.priority.engine.ts
│   │   │       ├── ticket.priority.engine.types.ts
│   │   │       └── ticket.service.types.ts
│   │   └── validators/                             # Input shape validation only; must not access database or services.
│   │       ├── auth.validator.ts
│   │       ├── org.validator.ts
│   │       ├── quote.validator.ts
│   │       ├── ticket.validator.ts
│   │       ├── user.validator.ts
│   │       └── validation-utils.ts
│   │
│   └── shared/
│       ├── constants/                              # Define all seed lookup table data here so frontend/backend stay in sync
│       │   ├── index.ts
│       │   ├── endpoints.ts
│       │   └── lookup-values.ts
│       └── contracts/                              # Define all DTO types here so frontend/backend share to prevent drift
│           ├── analytics-contracts.ts
│           ├── auth-contracts.ts
│           ├── org-contracts.ts
│           ├── quote-contracts.ts
│           ├── ticket-contracts.ts
│           └── user-contracts.ts
│
├── tests/
│   ├── e2e/
│   │   ├── global.setup.ts
│   │   ├── constants/
│   │   │   ├── comment.smoke.data.ts
│   │   │   ├── e2e.paths.ts
│   │   │   └── test.user.credentials.ts
│   │   ├── flows/
│   │   ├── setup/
│   │   │   ├── admin.setup.ts
│   │   │   └── customer.setup.ts
│   │   ├── smoke/
│   │   │   ├── admin.comment.smoke.test.ts
│   │   │   ├── auth.smoke.test.ts
│   │   │   ├── customer.comment.smoke.test.ts
│   │   │   └── ticket.smoke.test.ts
│   │   └── utils/
│   │       └── login.utils.ts
│   ├── helpers/
│   │   ├── setup.client.ts
│   │   ├── setup.integration.ts
│   │   └── setup.server.ts
│   ├── integration/
│   │   ├── auth.routes.test.ts
│   │   └── ticket.routes.test.ts
│   ├── unit/
│   │   └── server/
│   │       ├── auth.service.test.ts
│   │       ├── password.service.test.ts
│   │       └── session.service.test.ts
│   └── utils/
│       ├── mock.daos.ts
│       ├── mock.services.ts
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
├── tsconfig.migrations.json
├── tsconfig.node.json
├── tsconfig.server.json
└── vite.config.ts
