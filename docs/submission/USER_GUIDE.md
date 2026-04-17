# SmartQuote User Guide

**Deployment:** https://smartquote.zayeer.dev

---

## Roles

| Role | What they can do |
|---|---|
| Customer | Submit tickets, view quotes, accept/reject quotes, manage org |
| Support Agent | Review tickets, generate/edit quotes, add comments |
| Manager | Everything an agent can do, plus approve/reject quotes |
| Admin | Full system access including user management, SLA policies, rate profiles, analytics |

---

## Logging In

1. Go to https://smartquote.zayeer.dev
2. Enter your email and password
3. You will be redirected to your role-appropriate dashboard

To log out, click your avatar in the sidebar and select **Log out**.

---

## Customer Guide

### Submitting a Ticket

1. From the customer dashboard, click **New Ticket**
2. Fill in the form:
   - **Ticket Type** -- Support, Incident, or Enhancement/Feature
   - **Title** -- brief summary of the issue
   - **Description** -- full detail of the request
   - **Severity** -- Low, Medium, High, or Critical (technical urgency)
   - **Business Impact** -- Minor, Moderate, Major, or Critical (operational impact)
   - **Deadline** -- preferred resolution date
   - **Users Affected** -- number of users impacted
   - **Attachments** -- optional screenshots, logs, or documents (JPG, PNG, PDF, TXT)
3. Click **Submit**

You will receive a confirmation email and the ticket will appear in your dashboard immediately.

### Viewing Tickets

The customer dashboard lists all tickets for your organisation. Click any ticket to open the detail view, which shows:

- Current status and assigned agent
- SLA status (time remaining before breach)
- Quote panel (once a quote has been generated)
- Comment thread

### Accepting or Rejecting a Quote

Once an admin has approved a quote, you will see **Accept** and **Reject** buttons in the quote panel.

- **Accept** -- confirms the quote; the ticket moves to active resolution
- **Reject** -- opens a comment box; enter a reason and submit. The quote returns to the admin for revision.

### Organisation Management

From **My Organisation** in the sidebar you can view current members and their roles. If you have the Manager org-role, you can also invite new members and change member roles between Member and Manager.

---

## Admin / Agent Guide

### Reviewing the Ticket Queue

The admin dashboard lists all tickets across all organisations. Use the filters at the top to narrow by status, type, severity, priority, or assignee. Click any ticket to open the detail view.

### Assigning a Ticket

In the ticket detail view, click **Assign** and select an agent from the dropdown. The ticket status changes to **In Progress**.

### Generating a Quote

1. Open the ticket detail view
2. In the quote panel, click **Auto-Generate**
3. The system runs two estimates in parallel:
   - **Rule-based estimate** -- derived from the matching rate profile and calculation rule for this ticket's type, severity, and business impact
   - **ML estimate** -- an independent XGBoost prediction shown as a second-opinion panel with hours range, cost, suggested priority, and a confidence percentage
4. Review both estimates. You can:
   - Accept the rule-based figures as-is
   - Manually edit the fields to match the ML suggestion or your own judgement
   - Click **Create Manual Quote** to enter figures entirely from scratch without running auto-generate

### Editing a Quote

In the quote panel, click **Edit**. You can update:

- Estimated hours (min and max)
- Estimated cost
- Effort level
- Add a revision note explaining the change

Every edit creates an immutable revision record. Click **Revision History** to view the full audit trail for the quote.

### Submitting a Quote for Approval

Once the quote figures are correct, click **Submit for Approval**. This sends the quote to a Manager for sign-off.

### Approving or Rejecting a Quote (Manager)

Quotes pending approval appear in the ticket detail view with **Approve** and **Reject** buttons.

- **Approve** -- the quote is marked approved and the customer is notified
- **Reject** -- enter a reason; the quote returns to the agent for revision

### Comments

The ticket detail view has a comment thread with three tabs:

- **Internal** -- visible to admins and agents only; hidden from customers
- **External** -- visible to all parties including the customer
- **System** -- automated events (assignment, status changes, quote actions); read-only

Select the appropriate tab before posting.

### Resolving a Ticket

Once work is complete, click **Resolve** in the ticket detail view. The customer receives a resolution notification email and the ticket status changes to **Resolved**.

---

## Admin Configuration Guide

### Rate Profiles

**Settings > Rate Profiles**

Rate profiles define the hourly rates used by the quoting engine. Each profile covers a combination of ticket type, severity, and business impact, and has an effective date range.

To create a profile:
1. Click **New Rate Profile**
2. Select ticket type, severity, and business impact
3. Set business hours rate and after-hours rate (GBP/hr)
4. Set the effective from and to dates
5. Save

The quoting engine automatically selects the active profile at quote generation time based on the ticket's attributes and the current date.

### SLA Policies

**Settings > SLA Policies**

SLA policies define target resolution times for users or organisations.

To create a policy:
1. Click **New SLA Policy**
2. Select the scope (specific user or organisation)
3. Set the target resolution time in hours
4. Save

The SLA status component on each ticket shows time remaining, at-risk status, and breach status in real time.

### Organisations

**Settings > Organisations**

Lists all customer organisations. Click an organisation to view and manage its members. You can:

- Add new members by email
- Change a member's org-role between Member and Manager
- Remove members

### User Management

**Settings > User Management**

Lists all system users. You can create new accounts, change system roles, and deactivate users.

### Analytics

**Analytics** in the sidebar provides three charts:

- **Ticket Volume** -- ticket count over time, broken down by type
- **Resolution Time** -- average resolution time by priority
- **Quote Accuracy** -- estimated cost vs. final cost per ticket

Use the date range filter to scope the charts. Click **Export CSV** or **Export PDF** to download the underlying data.

---

## Email Notifications

The system sends automated emails on three events:

| Event | Recipient |
|---|---|
| Ticket submitted | Ticket creator |
| Quote generated and approved | Ticket creator |
| Ticket resolved | Ticket creator |

Notification preferences can be adjusted in **Settings > Notifications**.

---

## Settings

**Settings** (accessible from the sidebar for all roles) allows you to:

- Update your display name and password
- Toggle email notification preferences
- Switch between light and dark mode