# SmartQuote: Test Cases
Note: These are a translation of the automated tests into manual use cases

## Overview

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Service-layer logic in isolation using mock DAOs |
| Integration | Vitest + Supertest | Full HTTP stack against a real local PostgreSQL instance |
| E2E Smoke | Playwright | UI flows against a local full-stack (frontend + backend + DB) |
| E2E Flow | Playwright | Multi-role end-to-end workflows |
| Infrastructure | CDK Assertions (Vitest) | Lambda config, VPC endpoints, IAM policies |

**Running tests:**

```bash
npm run test:unit:server        # unit tests - server
npm run test:unit:client        # unit tests - client
npm run test:integration        # integration tests (requires local DB)
npm run test:e2e                # all E2E tests (requires full local stack)
cd infra && npx jest test       # CDK assertion tests (Linux/macOS only)
```

---

## 1. Unit Tests

### 1.1 Quote Engine Service (`quote.engine.service.test.ts`)

Tests the pure `computeQuote` function and `isBusinessHours` helper in isolation. No database or I/O.

#### `computeQuote`

| # | Description | Input | Expected Output |
|---|---|---|---|
| U-QE-01 | Baseline calculation with multiplier 1.0 | hourlyRate=100, min=2, max=4, multiplier=1.0 | min=2, max=4, mid=3, cost=300, fixedCost=0 |
| U-QE-02 | Urgency multiplier scales hour estimates | hourlyRate=100, min=2, max=4, multiplier=2.0 | min=4, max=8, mid=6, cost=600 |
| U-QE-03 | Hourly rate passed through unmodified | hourlyRate=150, multiplier=1.0 | hourlyRate=150 in output |
| U-QE-04 | Suggested priority carried from rule | rule.suggested_ticket_priority_id=3 | output.suggested_ticket_priority_id=3 |
| U-QE-05 | Fixed cost is always 0 | any valid input | fixedCost=0 |
| U-QE-06 | Fractional multiplier produces correct rounded values | hourlyRate=80, min=2, max=6, multiplier=1.5 | min~=3, max~=9, mid~=6, cost~=480 |

#### `isBusinessHours`

| # | Description | Input | Expected |
|---|---|---|---|
| U-BH-01 | 09:00 is within business hours (inclusive lower boundary) | 09:00 | true |
| U-BH-02 | 12:00 is within business hours | 12:00 | true |
| U-BH-03 | 16:59:59 is within business hours (just before upper boundary) | 16:59:59.999 | true |
| U-BH-04 | 17:00 is outside business hours (exclusive upper boundary) | 17:00 | false |
| U-BH-05 | 08:59 is outside business hours (just before lower boundary) | 08:59:59 | false |
| U-BH-06 | Midnight is outside business hours | 00:00 | false |
| U-BH-07 | 23:00 is outside business hours | 23:00 | false |

---

### 1.2 Auth Service (`auth.service.test.ts`)

Tests `AuthService` business logic using mock DAOs and mock collaborators (`PasswordService`, `SessionService`). No database or HTTP.

#### `login`

| # | Description | Mock Setup | Expected |
|---|---|---|---|
| U-AU-01 | Valid credentials return token and user data | findByEmail returns user, verify=true, findWithRole returns user+role, create returns session | result.token set, result.user.email and role.name correct |
| U-AU-02 | Unknown email throws AuthError | findByEmail returns null | AuthError thrown |
| U-AU-03 | Soft-deleted user throws AuthError with INVALID_CREDS | findByEmail returns user with deleted_at set | AuthError with INVALID_CREDS message |
| U-AU-04 | Wrong password throws AuthError with INVALID_CREDS | findByEmail returns user, verify=false | AuthError with INVALID_CREDS message |
| U-AU-05 | Missing role throws AuthError with ROLE_NOT_FOUND | findByEmail returns user, verify=true, findWithRole returns null | AuthError with ROLE_NOT_FOUND message |
| U-AU-06 | Session is not created when credentials fail | findByEmail returns null | sessionService.create not called |

#### `logout`

| # | Description | Mock Setup | Expected |
|---|---|---|---|
| U-LO-01 | Valid token returns true | sessionService.invalidate returns true | result === true |
| U-LO-02 | Unknown token throws AuthError with INVALID_SESSION | sessionService.invalidate returns false | AuthError with INVALID_SESSION message |

#### `getCurrentUser`

| # | Description | Mock Setup | Expected |
|---|---|---|---|
| U-ME-01 | Valid session token returns user data | validate returns session, findWithRole returns user | result.id, email, role.name correct |
| U-ME-02 | Invalid/expired session token throws AuthError | validate returns null | AuthError thrown |
| U-ME-03 | Session valid but user no longer exists throws AuthError | validate returns session, findWithRole returns null | AuthError thrown |

#### `createUser`

| # | Description | Mock Setup | Expected |
|---|---|---|---|
| U-CU-01 | Valid new user is created and returned | findByEmail returns null, validate passes, hash resolves, create returns user | result.email correct, hash called with plaintext password |
| U-CU-02 | Duplicate email throws PasswordValidationError | findByEmail returns existing user | PasswordValidationError thrown |
| U-CU-03 | Weak password throws PasswordValidationError without hashing | findByEmail returns null, validate returns isValid=false | PasswordValidationError thrown, hash not called |

#### `changePassword`

| # | Description | Mock Setup | Expected |
|---|---|---|---|
| U-CP-01 | Valid change hashes new password and invalidates all sessions | getById returns user, validate passes, hash resolves, update resolves | hash called with new password, invalidateAllForUser called |
| U-CP-02 | Non-existent user throws AuthError without hashing | getById returns null | AuthError thrown, hash not called |
| U-CP-03 | Invalid new password throws PasswordValidationError without invalidating sessions | getById returns user, validate returns isValid=false | PasswordValidationError thrown, invalidateAllForUser not called |

---

## 2. Integration Tests

Integration tests spin up the full Express application against a real local PostgreSQL database seeded with known data. Tests interact via HTTP using Supertest.

### 2.1 Auth Routes (`auth.routes.test.ts`)

#### `POST /api/auth/login`

| # | Description | Input | Expected |
|---|---|---|---|
| I-AL-01 | Valid credentials return 200 with token and user data | Seeded admin email + password | 200, body.data.token (string), body.data.user.email, body.data.user.role.name |
| I-AL-02 | Wrong password returns 401 | Valid email, wrong password | 401 |
| I-AL-03 | Non-existent email returns 401 | Unknown email + any password | 401 |
| I-AL-04 | Malformed body returns 400 | email="not-an-email", password="" | 400 |
| I-AL-05 | Empty body returns 400 | {} | 400 |
| I-AL-06 | Password not present in response body | Seeded admin credentials | 200, response body does not contain plaintext password, user.password undefined |

#### `POST /api/auth/logout`

| # | Description | Input | Expected |
|---|---|---|---|
| I-LO-01 | Valid token is invalidated and returns 200 | Bearer token from prior login | 200 |
| I-LO-02 | No Authorization header returns 401 | No header | 401 |
| I-LO-03 | Invalid token returns 401 | Bearer "totally-fake-token" | 401 |
| I-LO-04 | Reusing an already-invalidated token returns 401 | Same token used twice | Second call returns 401 |

#### `GET /api/auth/me`

| # | Description | Input | Expected |
|---|---|---|---|
| I-ME-01 | Valid session returns 200 with user data | Bearer token | 200, email and role.name present, password absent |
| I-ME-02 | No token returns 401 | No header | 401 |
| I-ME-03 | Token invalidated via logout returns 401 | Token after logout | 401 |

---

### 2.2 Ticket Routes (`ticket.routes.test.ts`)

#### `GET /api/tickets/` (list)

| # | Description | Actor | Expected |
|---|---|---|---|
| I-TL-01 | Unauthenticated request returns 401 | None | 401 |
| I-TL-02 | Customer sees only their own org's tickets | Customer (Org 1) | 200; ticket1 and ticket2 present; ticket3 and ticket4 absent |
| I-TL-03 | Customer from Org 2 sees only Org 2 tickets | Customer (Org 2) | 200; ticket3 and ticket4 present; ticket1 and ticket2 absent |
| I-TL-04 | Agent sees all tickets across all orgs | Agent | 200; all four seeded tickets present |

#### `GET /api/tickets/:id`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-TG-01 | Unauthenticated returns 401 | None | 401 |
| I-TG-02 | Customer accesses own org ticket | Customer (Org 1), ticket1 | 200, id and title match |
| I-TG-03 | Customer accesses different org ticket returns 403 | Customer (Org 1), ticket3 (Org 2) | 403 |
| I-TG-04 | Agent accesses any ticket | Agent, ticket3 | 200, id matches |
| I-TG-05 | Non-existent ticket id returns 404 | Agent | 404 |

#### `POST /api/tickets/` (create)

| # | Description | Actor | Expected |
|---|---|---|---|
| I-TC-01 | Unauthenticated returns 401 | None | 401 |
| I-TC-02 | Valid ticket created by customer returns 201 | Customer (Org 1) | 201, title and creatorUserId in response |
| I-TC-03 | Admin (no org) creates ticket with null organizationId | Admin | 201, organizationId=null, success=true |
| I-TC-04 | Malformed body returns 400 | Customer (Org 1), title="" | 400 |

#### `POST /api/tickets/:id/attachments` (upload)

| # | Description | Actor | Expected |
|---|---|---|---|
| I-UA-01 | Unauthenticated returns 401 | None | 401 |
| I-UA-02 | No file in body returns 400 | Customer | 400 |
| I-UA-03 | Disallowed MIME type (.txt) returns 400 | Customer | 400 |
| I-UA-04 | File exceeding 5MB returns 400 | Customer | 400 |
| I-UA-05 | Valid PDF upload returns 201 with attachment metadata | Customer | 201, ticketId, originalName, mimeType, sizeBytes, storageKey, uploadedByUserId |
| I-UA-06 | Valid JPEG upload returns 201 | Customer | 201, mimeType="image/jpeg" |
| I-UA-07 | Valid PNG upload returns 201 | Customer | 201, mimeType="image/png" |
| I-UA-08 | 6th attachment upload (max=5) returns 400 | Customer | 400 |

#### `GET /api/tickets/:id` (attachments in detail response)

| # | Description | Actor | Expected |
|---|---|---|---|
| I-AD-01 | Ticket detail includes attachments array with correct shape | Customer | 200, attachments array length 1, originalName, mimeType, sizeBytes, storageKey, uploadedByUserId |

#### `PATCH /api/tickets/:id`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-TU-01 | Unauthenticated returns 401 | None | 401 |
| I-TU-02 | Customer updates own OPEN ticket | Customer (Org 1), ticket2 (OPEN) | 200, updated title in response |
| I-TU-03 | Customer updates IN_PROGRESS ticket returns 422 | Customer (Org 1), ticket1 (IN_PROGRESS) | 422 |
| I-TU-04 | Customer updates different org ticket returns 403 | Customer (Org 1), ticket4 (Org 2) | 403 |
| I-TU-05 | Agent updates any ticket regardless of status | Agent, ticket1 | 200 |
| I-TU-06 | Non-existent ticket id returns 404 | Agent | 404 |

#### `POST /api/tickets/:id/assign`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-TA-01 | Unauthenticated returns 401 | None | 401 |
| I-TA-02 | Customer tries to assign returns 403 | Customer | 403 |
| I-TA-03 | Agent assigns ticket to valid user | Agent | 200, assignedToUserId matches |
| I-TA-04 | Assign to non-existent user returns 404 | Agent | 404 |

#### `POST /api/tickets/:id/resolve`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-TR-01 | Unauthenticated returns 401 | None | 401 |
| I-TR-02 | Customer tries to resolve returns 403 | Customer | 403 |
| I-TR-03 | Agent resolves ticket | Agent | 200 |
| I-TR-04 | Non-existent ticket id returns 404 | Agent | 404 |

#### `DELETE /api/tickets/:id`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-TD-01 | Unauthenticated returns 401 | None | 401 |
| I-TD-02 | Customer tries to delete returns 403 | Customer | 403 |
| I-TD-03 | Agent tries to delete returns 403 | Agent | 403 |
| I-TD-04 | Admin deletes ticket | Admin | 200 |
| I-TD-05 | Non-existent ticket id returns 404 | Admin | 404 |

---

### 2.3 Quote Routes (`quote.routes.test.ts`)

#### `GET /api/tickets/:id/quotes/` (list)

| # | Description | Actor | Expected |
|---|---|---|---|
| I-QL-01 | Unauthenticated returns 401 | None | 401 |
| I-QL-02 | Agent lists quotes for any ticket | Agent | 200, quotes array non-empty |
| I-QL-03 | Customer lists quotes for own org ticket | Customer (Org 1) | 200, quotes array |
| I-QL-04 | Customer lists quotes for different org ticket returns 403 | Customer (Org 1), ticket4 (Org 2) | 403 |
| I-QL-05 | Non-existent ticket id returns 404 | Agent | 404 |

#### `GET /api/tickets/:id/quotes/:quoteId`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-QG-01 | Unauthenticated returns 401 | None | 401 |
| I-QG-02 | Agent fetches quote | Agent | 200, id, ticketId, version, estimatedCost in response |
| I-QG-03 | Customer fetches quote on own org ticket | Customer (Org 1) | 200 |
| I-QG-04 | Customer fetches quote on different org ticket returns 403 | Customer (Org 1), ticket4 (Org 2) | 403 |
| I-QG-05 | Non-existent quote id returns 404 | Agent | 404 |

#### `POST /api/tickets/:id/quotes/generate`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-QA-01 | Unauthenticated returns 401 | None | 401 |
| I-QA-02 | Customer tries to generate returns 403 | Customer | 403 |
| I-QA-03 | Agent generates quote for valid ticket | Agent | 201, ruleBased.ticketId, ruleBased.hourlyRate, ruleBased.quoteCreator="Automated", mlEstimate present |
| I-QA-04 | Non-existent ticket id returns 404 | Agent | 404 |

#### `POST /api/tickets/:id/quotes/manual`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-QM-01 | Unauthenticated returns 401 | None | 401 |
| I-QM-02 | Customer tries to create manual quote returns 403 | Customer | 403 |
| I-QM-03 | Agent creates valid manual quote | Agent | 201, ticketId, estimatedHoursMinimum=4, estimatedHoursMaximum=8, hourlyRate=100, quoteCreator="Manual" |
| I-QM-04 | max hours < min hours returns 400 | Agent | 400 |
| I-QM-05 | Missing required fields returns 400 | Agent | 400 |
| I-QM-06 | Non-existent ticket id returns 404 | Agent | 404 |

#### `PATCH /api/tickets/:id/quotes/:quoteId`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-QU-01 | Unauthenticated returns 401 | None | 401 |
| I-QU-02 | Customer tries to update returns 403 | Customer | 403 |
| I-QU-03 | Agent updates quote with reason | Agent | 200, updated hourlyRate, version incremented |
| I-QU-04 | Missing reason field returns 400 | Agent | 400 |
| I-QU-05 | Non-existent quote id returns 404 | Agent | 404 |

### 2.4 Quote Approval Routes (`quote.approval.routes.test.ts`)

All approval tests run against ticket1 (Org 1). Each `describe` block creates its own fresh quote in the appropriate state via helper functions before the tests run.

#### `POST /api/tickets/:id/quotes/:quoteId/submit`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-QS-01 | Unauthenticated returns 401 | None | 401 |
| I-QS-02 | Customer tries to submit returns 403 | Customer | 403 |
| I-QS-03 | Agent submits a draft quote | Agent | 201, approvalStatus="Approved By Agent" |
| I-QS-04 | Submitting an already-submitted quote returns 422 | Agent | 422 |

#### `POST /api/tickets/:id/quotes/:quoteId/manager-approve`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-MA-01 | Unauthenticated returns 401 | None | 401 |
| I-MA-02 | Agent tries to manager-approve returns 403 | Agent | 403 |
| I-MA-03 | Customer tries to manager-approve returns 403 | Customer | 403 |
| I-MA-04 | Manager approves a submitted quote with comment | Manager | 200, approvalStatus="Approved By Manager", comment in response |
| I-MA-05 | Manager-approving an already-approved quote returns 422 | Manager | 422 |

#### `POST /api/tickets/:id/quotes/:quoteId/manager-reject`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-MR-01 | Unauthenticated returns 401 | None | 401 |
| I-MR-02 | Agent tries to manager-reject returns 403 | Agent | 403 |
| I-MR-03 | Missing comment returns 400 | Manager | 400 |
| I-MR-04 | Manager rejects a submitted quote with comment | Manager | 200, approvalStatus="Rejected By Manager", comment in response |
| I-MR-05 | Manager-rejecting an already-rejected quote returns 422 | Manager | 422 |

#### `POST /api/tickets/:id/quotes/:quoteId/admin-approve`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-AA-01 | Unauthenticated returns 401 | None | 401 |
| I-AA-02 | Manager tries to admin-approve returns 403 | Manager | 403 |
| I-AA-03 | Admin approves a submitted quote | Admin | 200, approvalStatus="Approved By Admin" |
| I-AA-04 | Admin-approving an already-approved quote returns 422 | Admin | 422 |

#### `POST /api/tickets/:id/quotes/:quoteId/customer-approve`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-CA-01 | Unauthenticated returns 401 | None | 401 |
| I-CA-02 | Agent tries to customer-approve returns 403 | Agent | 403 |
| I-CA-03 | Customer from wrong org returns 403 | Customer (Org 2), ticket1 (Org 1) | 403 |
| I-CA-04 | Customer approves a manager-approved quote | Customer (Org 1) | 200, approvalStatus="Approved By Customer" |
| I-CA-05 | Customer-approving an already-approved quote returns 422 | Customer (Org 1) | 422 |

#### `POST /api/tickets/:id/quotes/:quoteId/customer-reject`

| # | Description | Actor | Expected |
|---|---|---|---|
| I-CR-01 | Unauthenticated returns 401 | None | 401 |
| I-CR-02 | Agent tries to customer-reject returns 403 | Agent | 403 |
| I-CR-03 | Missing comment returns 400 | Customer | 400 |
| I-CR-04 | Customer rejects a manager-approved quote with comment | Customer (Org 1) | 200, approvalStatus="Rejected By Customer", comment in response |
| I-CR-05 | Customer-rejecting an already-rejected quote returns 422 | Customer (Org 1) | 422 |

---

## 3. E2E Tests

E2E tests run against the full local stack. Each role uses a pre-authenticated `storageState` to avoid re-authenticating on every test.

### 3.1 Ticket Submission Smoke (`ticket.smoke.test.ts`)

All tests run as a pre-authenticated customer. Setup navigates to the customer dashboard and opens the new ticket modal before each test.

| # | Description | Action | Expected |
|---|---|---|---|
| E-TS-01 | Valid submission succeeds | Fill all required fields, click Submit | `ticket-submit-success` element visible |
| E-TS-02 | Valid submission with PDF attachment succeeds | Fill fields, attach sample.pdf, click Submit | `ticket-submit-success` visible |
| E-TS-03 | Valid submission with JPG attachment succeeds | Fill fields, attach sample.jpg, click Submit | `ticket-submit-success` visible |
| E-TS-04 | Valid submission with PNG attachment succeeds | Fill fields, attach sample.png, click Submit | `ticket-submit-success` visible |
| E-TS-05 | Missing title shows validation error | Fill all except title, click Submit | `submit-error` visible, contains "Title is required" |
| E-TS-06 | Missing description shows validation error | Fill all except description, click Submit | `submit-error` visible, contains "Description is required" |
| E-TS-07 | Past deadline shows validation error | Set deadline to 2000-01-01, click Submit | `submit-error` visible, contains "future" |
| E-TS-08 | Negative users affected shows validation error | Enter -69 for users affected, click Submit | `submit-error` visible, contains "whole number" |
| E-TS-09 | Non-numeric users affected is blocked | Enter "e" for users affected, click Submit | `submit-error` visible, contains "whole number" |
| E-TS-10 | Disallowed file type (.txt) shows validation error before submission | Attach sample.txt, click Submit | `submit-error` visible, contains "not an allowed file type" |

---

### 3.2 Quote Approval Flow (`quote.approval.flow.test.ts`)

Tests the full three-stage quote approval workflow across three roles: agent, manager, and customer. Each test creates a fresh ticket and quote via the API before navigating the UI.

#### Agent stage

| # | Description | Setup | Expected |
|---|---|---|---|
| E-QA-01 | Agent sees submit button on a draft quote and can submit it | Fresh ticket + manual quote | `submit-approval-btn` visible; after click, button hidden |
| E-QA-02 | Agent does not see submit button on an already-submitted quote | Fresh ticket + quote already submitted via API | `submit-approval-btn` hidden |

#### Manager stage

| # | Description | Setup | Expected |
|---|---|---|---|
| E-QM-01 | Manager sees approve and reject buttons on a submitted quote | Fresh ticket + quote submitted | Both `manager-approve-quote-btn` and `toggle-reject-quote-btn` visible |
| E-QM-02 | Manager approves quote: approval section disappears | Fresh ticket + quote submitted | After clicking approve, both approval buttons hidden |
| E-QM-03 | Manager reject requires a comment before submit is enabled | Fresh ticket + quote submitted | `reject-quote-submit-btn` disabled until `rq-notes` filled; after submit, form and reject button hidden |
| E-QM-04 | Manager does not see approval buttons on a non-submitted (draft) quote | Fresh ticket + manual quote not submitted | Both approval buttons hidden |

#### Customer stage

| # | Description | Setup | Expected |
|---|---|---|---|
| E-QC-01 | Customer sees accept and reject buttons after manager approval | Fresh ticket + quote submitted + manager approved | `approve-btn` and `open-reject-btn` visible |
| E-QC-02 | Customer accepts quote: success message shown, accept button hidden | Fresh ticket + approved quote | After clicking approve, `approve-success` visible, `approve-btn` hidden |
| E-QC-03 | Customer reject requires a comment before confirm is enabled; success shown after rejecting | Fresh ticket + approved quote | `confirm-reject-btn` disabled until comment filled; after submit, `reject-success` visible, `reject-form` hidden |
| E-QC-04 | Customer does not see accept/reject before manager approval | Fresh ticket + quote submitted but not manager approved | `approve-btn` and `open-reject-btn` hidden |
| E-QC-05 | Customer cancels reject form: form hides and original buttons reappear | Fresh ticket + approved quote | After cancel, `reject-form` hidden, `approve-btn` and `open-reject-btn` visible |