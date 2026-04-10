smartquote/
├── .github/
│   ├── actions/
│   │   ├── code-quality/
│   │   └── setup/
│   └── workflows/
│       ├── cd.yml
│       ├── ci-e2e.yml
│       └── ci-unit-integration.yml
│
├── .husky/pre-commit/                              # Lint-staged
│
├── docs/
│   ├── STRUCTURE.md
│   └── TEAM_GUIDE.md
│
├── infra/                                          # CDK - only include custom files here
│   ├── bin/infra.ts
│   ├── lib/
│   │   ├── app-stack.ts
│   │   ├── certificate-stack.ts
│   │   ├── config.ts
│   │   └── database-stack.ts
│   └── test/infra.test.ts                          # CDK assertion tests
│
├── models/
│   ├── .venv/
│   ├── .gitignore
│   ├── requirements.txt
│   ├── handler/
│   │   ├── app.py                                  # Lambda entry point
│   │   ├── Dockerfile
│   │   └── artifacts
│   │       ├── pca.pkl
│   │       ├── regressor.pkl
│   │       ├── classifier.pkl
│   │       └── model_meta.json
│   └── notebooks/
│       ├── xgboost_quote_estimator.ipynb
│       └── generate_synthetic_data.py
│
├── src/
│   ├── client/
│   │   ├── main.tsx
│   │   ├── components/                             # Pure reusable UI elements; must not know about APIs, auths, or domain concepts
│   │   │   ├── Breadcrumb.css
│   │   │   ├── Breadcrumb.tsx
│   │   │   ├── Modal.css
│   │   │   ├── Modal.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Sidebar.css
│   │   │   ├── Sidebar.tsx
│   │   │   ├── SidePanel.css
│   │   │   ├── SidePanel.tsx
│   │   │   ├── TabNav.css
│   │   │   ├── TabNav.tsx
│   │   │   └── icons/
│   │   │       ├── giacom-logo-webp.ts
│   │   │       ├── MiscIcons.ts
│   │   │       └── LoginIcons.tsx
│   │   ├── config/env.frontend.ts                  # Environment and config values only; no runtime logic
│   │   ├── constants/client.routes.ts
│   │   ├── contexts/                               # Define types, hooks of context seperately for fast refresh
│   │   │   ├── auth.context.types.ts
│   │   │   ├── AuthContext.ts
│   │   │   ├── sidebar.context.types.ts
│   │   │   ├── SidebarContext.ts
│   │   │   ├── theme.context.types.ts
│   │   │   └── ThemeContext.ts
│   │   ├── features/                               # Feature scoped UI behaviour composed from components and hooks
│   │   │   ├── admin/
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── DateRangeFilter.tsx
│   │   │   │   │   ├── QuoteAccuracyChart.tsx
│   │   │   │   │   ├── ResolutionTimeChart.tsx
│   │   │   │   │   ├── TicketStatusChart.tsx
│   │   │   │   │   └── TicketVolumeChart.tsx
│   │   │   │   ├── quotes/
│   │   │   │   │   ├── AdminQuoteApproval.css
│   │   │   │   │   ├── AdminQuoteApproval.tsx
│   │   │   │   │   ├── AdminQuoteEditor.css
│   │   │   │   │   ├── AdminQuoteEditor.tsx
│   │   │   │   │   ├── AdminQuotePanel.tsx
│   │   │   │   │   ├── AdminQuotePanel.types.ts
│   │   │   │   │   ├── AdminQuoteRevisions.css
│   │   │   │   │   └── AdminQuoteRevisions.tsx
│   │   │   │   └── tickets/
│   │   │   │       ├── AdminTicketCard.css
│   │   │   │       ├── AdminTicketCard.tsx
│   │   │   │       ├── AdminTicketFilters.css
│   │   │   │       ├── AdminTicketFilters.tsx
│   │   │   │       ├── AssignTicketForm.css
│   │   │   │       ├── AssignTicketForm.tsx
│   │   │   │       ├── SimilarTicketsPanel.css
│   │   │   │       ├── SimilarTicketsPanel.tsx
│   │   │   │       ├── SlaStatus.css
│   │   │   │       └── SlaStatus.tsx
│   │   │   ├── collate/
│   │   │   │   ├── TicketFilters.css
│   │   │   │   ├── TicketFilters.tsx
│   │   │   │   ├── TicketPagination.css
│   │   │   │   └── TicketPagination.tsx
│   │   │   ├── customer/
│   │   │   │   ├── CustomerQuotePanel.tsx
│   │   │   │   ├── CustomerTicketCard.tsx
│   │   │   │   ├── QuoteActions.css
│   │   │   │   ├── QuoteActions.tsx
│   │   │   │   ├── SubmitTicketForm.css
│   │   │   │   └── SubmitTicketForm.tsx
│   │   │   └── shared/
│   │   │       ├── AttachmentList.css
│   │   │       ├── AttachmentList.tsx
│   │   │       ├── BaseLayout.css
│   │   │       ├── BaseLayout.tsx
│   │   │       ├── BaseTicketCard.css
│   │   │       ├── BaseTicketCard.tsx
│   │   │       ├── BaseTicketList.css
│   │   │       ├── BaseTicketList.tsx
│   │   │       ├── QuoteDetail.tsx
│   │   │       ├── StatsOverview.css
│   │   │       ├── StatsOverview.tsx
│   │   │       ├── TicketCommentThread.css
│   │   │       ├── TicketCommentThread.tsx
│   │   │       ├── TicketDetailCard.css
│   │   │       ├── TicketDetailCard.tsx
│   │   │       ├── TicketTitle.css
│   │   │       ├── TicketTitle.tsx
│   │   │       └── side-panels/                    # Wrappers around SidePanel component
│   │   │           ├── DashboardSidePanel.tsx
│   │   │           └── TicketDetailSidePanel.tsx
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
│   │   │   ├── context/                            # All context hooks
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
│   │   │   ├── rate-profiles/ 
│   │   │   │   ├── useCreateRateProfile.ts
│   │   │   │   ├── useDeleteRateProfile.ts
│   │   │   │   ├── useListRateProfile.ts
│   │   │   │   └── useUpdateRateProfile.ts
│   │   │   ├── sla/ 
│   │   │   │   ├── useCreateSlaPolicy.ts
│   │   │   │   ├── useDeleteSlaPolicy.ts
│   │   │   │   ├── useListSlaPolicy.ts
│   │   │   │   └── useUpdateSlaPolicy.ts
│   │   │   └── tickets/
│   │   │       ├── useAddComment.ts
│   │   │       ├── useAssignTicket.ts
│   │   │       ├── useCreateTicket.ts
│   │   │       ├── useDeleteTicket.ts
│   │   │       ├── useGetAttachmentUrl.ts
│   │   │       ├── useGetSimilarTicket.ts
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
│   │   │   │   ├── rate-profile.api.ts
│   │   │   │   ├── sla.api.ts
│   │   │   │   └── ticket.api.ts
│   │   │   ├── storage/                            # Browser persistence tokens
│   │   │   │   ├── keys.ts
│   │   │   │   └── tokenStorage.ts
│   │   │   └── utils/                              # Generic helpers only; if it knows about e.g. tickets, it doesn't belong here
│   │   │       ├── badge-utils.ts                  # Make lookup maps for XTicketCard and XTicketDetail files
│   │   │       ├── export-csv.ts
│   │   │       ├── export-pdf.ts
│   │   │       ├── formatters.ts                   # Use this for timestamp and currency formatting (can easily swap out locales through this)
│   │   │       ├── input-utils.ts
│   │   │       └── resolve-assignee-names.ts
│   │   ├── pages/                                  # Route level composition (no logic, only assemble features)
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboardPage.tsx
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── AdminTicketDetailPage.tsx
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── AdminAnalyticsPage.css
│   │   │   │   │   └── AdminAnalyticsPage.tsx
│   │   │   │   ├── orgs/
│   │   │   │   │   ├── AdminOrgsMembersPage.css
│   │   │   │   │   ├── AdminOrgsMembersPage.tsx
│   │   │   │   │   ├── AdminOrgsPage.css
│   │   │   │   │   └── AdminOrgsPage.tsx
│   │   │   │   ├── rate-profiles/
│   │   │   │   │   ├── AdminRateProfilesPage.css
│   │   │   │   │   └── AdminRateProfilesPage.tsx
│   │   │   │   ├── sla/
│   │   │   │   │   ├── AdminSLAPoliciesPage.css
│   │   │   │   │   └── AdminSLAPoliciesPage.tsx
│   │   │   │   ├── system-config/
│   │   │   │   │   ├── AdminSystemConfigPage.css
│   │   │   │   │   └── AdminSystemConfigPage.tsx
│   │   │   │   └── user-management/
│   │   │   │       ├── AdminUserManagementPage.css
│   │   │   │       └── AdminUserManagementPage.tsx
│   │   │   ├── customer/
│   │   │   │   ├── CustomerDashboardPage.tsx
│   │   │   │   ├── CustomerLayout.tsx
│   │   │   │   ├── CustomerOrgPage.css
│   │   │   │   ├── CustomerOrgPage.tsx
│   │   │   │   └── CustomerTicketDetailPage.tsx
│   │   │   ├── misc/
│   │   │   │   ├── CantAccessPage.css
│   │   │   │   ├── CantAccessPage.tsx
│   │   │   │   ├── InsufficientPermissionsPage.css
│   │   │   │   ├── InsufficientPermissionPage.tsx
│   │   │   │   ├── LoginPage.css
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── NotFoundPage.css
│   │   │   │   └── NotFoundPage.tsx
│   │   │   └── shared/
│   │   │       ├── SettingsPage.css
│   │   │       └── SettingsPage.tsx
│   │   └── styles/
│   │       ├── badges.css
│   │       ├── buttons.css
│   │       ├── cards.css
│   │       ├── DashboardPage.css
│   │       ├── forms.css
│   │       ├── globals.css
│   │       └── QuotePanel.css
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
│   │   │   ├── auth-config.ts
│   │   │   ├── database-config.ts
│   │   │   ├── email-config.ts
│   │   │   ├── env.backend.ts
│   │   │   └── index.ts
│   │   │   └── redis-config.ts
│   │   ├── containers/                             # Construct controllers by injecting dependencies; no business behaviour
│   │   │   ├── admin.container.ts
│   │   │   ├── analytics.container.ts
│   │   │   ├── auth.container.ts
│   │   │   ├── org.container.ts
│   │   │   ├── quote.container.ts
│   │   │   ├── rate-profiles.container.ts
│   │   │   ├── sla.container.ts
│   │   │   └── ticket.container.ts
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── org.controller.ts
│   │   │   ├── quote.controller.ts
│   │   │   ├── rate-profiles.controller.ts
│   │   │   ├── sla.controller.ts
│   │   │   └── ticket.controller.ts
│   │   ├── daos/                                   # Database persistence/access only - no validation, permissions, or workflow rules
│   │   │   ├── base/
│   │   │   │   ├── activatable.dao.ts
│   │   │   │   ├── base.dao.ts
│   │   │   │   ├── composite-key.dao.ts
│   │   │   │   ├── deletable.dao.ts
│   │   │   │   ├── lookup-table.dao.ts
│   │   │   │   └── types.ts
│   │   │   └── children/                           # Domain DAO = File with multiple DAOs grouped by similarity
│   │   │       ├── notification-types.dao.ts
│   │   │       ├── organizations-domain.dao.ts
│   │   │       ├── permissions.dao.ts
│   │   │       ├── quotes-domain.dao.ts
│   │   │       ├── rate-profiles.dao.ts
│   │   │       ├── roles-domain.dao.ts
│   │   │       ├── sessions.dao.ts
│   │   │       ├── sla-policies.dao.ts
│   │   │       ├── tickets-domain.dao.ts
│   │   │       └── users-domain.dao.ts
│   │   ├── database/                               # Connection, migrations, and schema definitions only.
│   │   │   ├── connection.ts
│   │   │   ├── migration.utils.ts
│   │   │   ├── config/table-names.ts
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_lookup_tables.ts
│   │   │   │   ├── 002_create_main_tables.ts
│   │   │   │   ├── 003_create_link_tables.ts
│   │   │   │   ├── 004_create_update_triggers.ts
│   │   │   │   ├── 005_create_priority_engine_tables.ts
│   │   │   │   ├── 006_fix_org_tables.ts
│   │   │   │   ├── 007_alter_ticket_attachments.ts
│   │   │   │   ├── 008_add_resolved_at_to_tickets.ts
│   │   │   │   ├── 009_alter_rate_profiles_table.ts
│   │   │   │   └── 010_alter_sla_policies_table.ts
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
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── routes/                                 # Map URLs to controllers only - no logic allowed.
│   │   │   ├── admin.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── org.routes.ts
│   │   │   ├── rate-profiles.routes.ts
│   │   │   └── ticket.routes.ts
│   │   ├── services/                               # All business rules/workflows here; nothing else enforces domain behaviour. No HTTP here.
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.errors.ts
│   │   │   │   └── analytics.service.ts
│   │   │   ├── auth/
│   │   │   │   ├── auth.config.types.ts
│   │   │   │   ├── auth.errors.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── password.service.ts
│   │   │   │   └── session.service.ts
│   │   │   ├── email/
│   │   │   │   ├── email.servcice.ts
│   │   │   │   └── templates/
│   │   │   │       ├── EmailLayout.ts
│   │   │   │       ├── QuoteGeneratedEmail.ts
│   │   │   │       ├── TicketReceivedEmail.ts
│   │   │   │       └── TicketResolvedEmail.ts
│   │   │   ├── notification/
│   │   │   │   ├── notification.errors.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── notification.service.types.ts
│   │   │   ├── org/
│   │   │   │   ├── org-members.service.ts
│   │   │   │   ├── org-members.service.types.ts
│   │   │   │   ├── org.errors.ts
│   │   │   │   ├── org.service.ts
│   │   │   │   └── org.service.types.ts
│   │   │   ├── quote/
│   │   │   │   ├── ml-quote.service.ts
│   │   │   │   ├── quote-approval.service.ts
│   │   │   │   ├── quote-engine.service.ts
│   │   │   │   ├── quote.errors.ts
│   │   │   │   └── quote.service.ts
│   │   │   ├── rate-profiles/
│   │   │   │   ├── rate-profiles.errors.ts
│   │   │   │   └── rate-profiles.service.ts
│   │   │   ├── rbac/
│   │   │   │   ├── org-rbac.service.ts             # Local/Org RBAC
│   │   │   │   └── rbac.service.ts                 # System RBAC
│   │   │   ├── sla/
│   │   │   │   ├── sla.errors.ts
│   │   │   │   ├── sla.service.ts
│   │   │   │   └── sla.service.types.ts
│   │   │   ├── storage/
│   │   │   │   ├── local-storage.service.ts
│   │   │   │   ├── s3-storage.service.ts
│   │   │   │   ├── storage.errors.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   └── storage.service.types.ts
│   │   │   └── ticket/
│   │   │       ├── attachment.service.ts
│   │   │       ├── comment.service.ts
│   │   │       ├── ticket.errors.ts
│   │   │       ├── ticket.service.ts
│   │   │       ├── ticket-priority-engine.service.ts
│   │   │       ├── ticket-priority-engine.service.types.ts
│   │   │       ├── ticket-service.types.ts
│   │   │       ├── ticket-similarity.service.ts
│   │   │       └── ticket-similarity.service.types.ts
│   │   └── validators/                             # Input shape validation only; must not access database or services.
│   │       ├── analytics.validator.ts
│   │       ├── auth.validator.ts
│   │       ├── org.validator.ts
│   │       ├── quote.validator.ts
│   │       ├── rate-profile.validator.ts
│   │       ├── sla.validator.ts
│   │       ├── ticket.validator.ts
│   │       ├── user.validator.ts
│   │       └── validation.utils.ts
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
│           ├── rate-profile-contracts.ts
│           ├── sla-contracts.ts
│           ├── ticket-contracts.ts
│           └── user-contracts.ts
│
├── tests/
│   ├── constants/
│   │   └── test.user.credentials.ts
│   ├── e2e/
│   │   ├── global.setup.ts
│   │   ├── constants/
│   │   │   ├── comment.smoke.data.ts
│   │   │   └── e2e.paths.ts
│   │   ├── setup/
│   │   │   ├── admin.setup.ts
│   │   │   └── customer.setup.ts
│   │   ├── smoke/
│   │   │   ├── admin.comment.smoke.test.ts
│   │   │   ├── auth.smoke.test.ts
│   │   │   ├── customer.comment.smoke.test.ts
│   │   │   ├── rate.profile.smoke.test.ts
│   │   │   ├── sla.smoke.test.ts
│   │   │   └── ticket.smoke.test.ts
│   │   └── utils/
│   │       └── login.utils.ts
│   ├── fixtures/
│   │   ├── sample.jpg
│   │   ├── sample.pdf
│   │   ├── sample.png
│   │   └── sample.txt
│   ├── helpers/
│   │   ├── setup.client.ts
│   │   ├── setup.integration.ts
│   │   └── setup.server.ts
│   ├── integration/
│   │   ├── auth.routes.test.ts
│   │   ├── quote.routes.test.ts
│   │   ├── rate.profiles.routes.test.ts
│   │   ├── sla.routes.test.ts
│   │   └── ticket.routes.test.ts
│   ├── unit/
│   │   └── server/
│   │       ├── auth.service.test.ts
│   │       ├── password.service.test.ts
│   │       ├── quote.engine.service.test.ts
│   │       ├── quote.service.test.ts
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
