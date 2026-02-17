/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-deprecated */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTicketPage.css';
import './CustomerPage.css';

type MenuKey = 'Dashboard' | 'My Tickets' | 'Quotes' | 'History' | 'Profile';

// Matches ERD lookup tables: ticket_types, ticket_severities, business_impacts,
// ticket_statuses, ticket_priorities, sla_policies, users/org members etc.
type LookupOption = { id: number; label: string };

// ---- ERD-aligned payload shape (client -> server) ----
// NOTE: ticket_number, created_at, updated_at are NOT NULL in ERD,
// but best practice is the BACKEND generates them.
type CreateTicketPayload = {
  // NOT NULL (ERD)
  creator_user_id: number;
  organization_id: number;
  title: string;
  description: string;
  ticket_type_id: number;
  ticket_severity_id: number;
  business_impact_id: number;
  ticket_status_id: number;
  ticket_priority_id: number;
  deadline: string; // timestamp NOT NULL (send ISO)
  users_impacted: number;
  is_deleted: boolean;

  // NULLABLE (ERD)
  assigned_to_user_id: number | null;
  resolved_by_user_id: number | null;
  sla_policy_id: number | null;

  // These exist in ERD as nullable; type varies by implementation.
  // Keep null unless your backend expects timestamps/ints.
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;

  // NOT NULL (ERD) but recommended server-side generation:
  // ticket_number?: string;
  // created_at?: string;
  // updated_at?: string;
};

type TicketFormState = {
  ticket_type_id: number;
  title: string;
  description: string;
  ticket_severity_id: number;
  business_impact_id: number;
  ticket_priority_id: number;
  ticket_status_id: number;

  deadline_date: string; // "YYYY-MM-DD" from <input type="date" />
  users_impacted: number;

  // Optional fields from ERD
  assigned_to_user_id: number | 'unassigned';
  sla_policy_id: number | 'none';
};

// ---- Example lookup lists (IDs MUST match your DB tables) ----
// Replace these IDs with real DB IDs or load them from backend.
const TICKET_TYPES: LookupOption[] = [
  { id: 1, label: 'Support - Technical assistance or help' },
  { id: 2, label: 'Incident - Service outage or disruption' },
  { id: 3, label: 'Request - Change or access request' },
  { id: 4, label: 'Billing - Invoices, charges, payments' },
];

const SEVERITIES: LookupOption[] = [
  { id: 1, label: 'Low - Minor issue' },
  { id: 2, label: 'Medium - Notable issue' },
  { id: 3, label: 'High - Major issue' },
  { id: 4, label: 'Critical - System down' },
];

const BUSINESS_IMPACTS: LookupOption[] = [
  { id: 1, label: 'Low - Little to no disruption' },
  { id: 2, label: 'Moderate - Some disruption' },
  { id: 3, label: 'High - Significant disruption' },
  { id: 4, label: 'Severe - Business halted' },
];

const PRIORITIES: LookupOption[] = [
  { id: 1, label: 'Low' },
  { id: 2, label: 'Medium' },
  { id: 3, label: 'High' },
  { id: 4, label: 'Urgent' },
];

const STATUSES: LookupOption[] = [
  { id: 1, label: 'New' },
  { id: 2, label: 'Open' },
  { id: 3, label: 'In Progress' },
  { id: 4, label: 'Resolved' },
  { id: 5, label: 'Closed' },
];

// Optional ERD table: sla_policies
const SLA_POLICIES: LookupOption[] = [
  { id: 1, label: 'Standard SLA' },
  { id: 2, label: 'Premium SLA' },
];

// Optional ERD user list for assignee (organization members)
const ASSIGNEES: LookupOption[] = [
  { id: 201, label: 'Support Agent 1' },
  { id: 202, label: 'Support Agent 2' },
  { id: 203, label: 'Support Agent 3' },
];

// Convert "YYYY-MM-DD" to ISO timestamp.
// Using end-of-day reduces “deadline accidentally starts at midnight” confusion.
function dateToISOEndOfDay(dateStr: string): string {
  if (!dateStr) return '';
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const dt = new Date(yyyy, (mm ?? 1) - 1, dd ?? 1, 23, 59, 59, 0);
  return dt.toISOString();
}

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('My Tickets');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // In a real app, get these from auth/session (JWT, /me endpoint, etc.)
  // ERD requires creator_user_id and organization_id (NOT NULL).
  const authContext = useMemo(
    () => ({
      userId: 123,
      organizationId: 456,
      name: 'Guest',
      email: 'guest@giacom',
    }),
    []
  );

  const [form, setForm] = useState<TicketFormState>({
    ticket_type_id: TICKET_TYPES[0]?.id ?? 1,
    title: '',
    description: '',
    ticket_severity_id: SEVERITIES[1]?.id ?? 2, // default medium
    business_impact_id: BUSINESS_IMPACTS[1]?.id ?? 2, // default moderate
    ticket_priority_id: PRIORITIES[1]?.id ?? 2, // default medium
    ticket_status_id: STATUSES[0]?.id ?? 1, // default New
    deadline_date: '',
    users_impacted: 1,

    // Optional fields:
    assigned_to_user_id: 'unassigned',
    sla_policy_id: 'none',
  });

  const descriptionCount = form.description.length;

  const setField = <K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required ERD fields that the UI supplies
    if (!authContext.userId) return alert('Missing creator_user_id (not logged in).');
    if (!authContext.organizationId) return alert('Missing organization_id.');
    if (!form.title.trim()) return alert('Title is required.');
    if (!form.description.trim()) return alert('Description is required.');
    if (!form.deadline_date) return alert('Deadline is required.');
    if (!Number.isFinite(form.users_impacted) || form.users_impacted < 1) {
      return alert('Users impacted must be 1 or more.');
    }

    // ERD-aligned payload
    const payload: CreateTicketPayload = {
      creator_user_id: authContext.userId,
      organization_id: authContext.organizationId,

      title: form.title.trim(),
      description: form.description.trim(),

      ticket_type_id: form.ticket_type_id,
      ticket_severity_id: form.ticket_severity_id,
      business_impact_id: form.business_impact_id,
      ticket_status_id: form.ticket_status_id,
      ticket_priority_id: form.ticket_priority_id,

      deadline: dateToISOEndOfDay(form.deadline_date),
      users_impacted: form.users_impacted,

      // ERD: is_deleted NOT NULL
      is_deleted: false,

      // ERD: nullable fields
      assigned_to_user_id:
        form.assigned_to_user_id === 'unassigned' ? null : form.assigned_to_user_id,
      resolved_by_user_id: null,
      sla_policy_id: form.sla_policy_id === 'none' ? null : form.sla_policy_id,
      sla_response_due_at: null,
      sla_resolution_due_at: null,
    };

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed (${res.status})`);
      }

      alert('Ticket created successfully.');
      navigate('/customer');
    } catch (err) {
      console.error(err);
      alert(`Failed to create ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleCancel = () => navigate('/customer');

  return (
    <div className={`customerPage ${isCollapsed ? 'sidebarCollapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brandRow">
          <div className="brand">
            <div className="brandTitle">{isCollapsed ? 'G' : 'GIACOM'}</div>
            {!isCollapsed && <div className="brandSub">Customer Portal</div>}
          </div>

          <button
            className="collapseBtn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            type="button"
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        <nav className="menu">
          <button
            className={`menuItem ${activeMenu === 'Dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/customer')}
            title={isCollapsed ? 'Dashboard' : undefined}
            type="button"
          >
            <span className="menuIcon">🏠</span>
            {!isCollapsed && <span className="menuLabel">Dashboard</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'My Tickets' ? 'active' : ''}`}
            onClick={() => setActiveMenu('My Tickets')}
            title={isCollapsed ? 'My Tickets' : undefined}
            type="button"
          >
            <span className="menuIcon">🎫</span>
            {!isCollapsed && <span className="menuLabel">My Tickets</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Quotes' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Quotes')}
            title={isCollapsed ? 'Quotes' : undefined}
            type="button"
          >
            <span className="menuIcon">£</span>
            {!isCollapsed && <span className="menuLabel">Quotes</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'History' ? 'active' : ''}`}
            onClick={() => setActiveMenu('History')}
            title={isCollapsed ? 'History' : undefined}
            type="button"
          >
            <span className="menuIcon">🧾</span>
            {!isCollapsed && <span className="menuLabel">History</span>}
          </button>

          <button
            className={`menuItem ${activeMenu === 'Profile' ? 'active' : ''}`}
            onClick={() => setActiveMenu('Profile')}
            title={isCollapsed ? 'Profile' : undefined}
            type="button"
          >
            <span className="menuIcon">👤</span>
            {!isCollapsed && <span className="menuLabel">Profile</span>}
          </button>
        </nav>

        <div className="sidebarFooter">
          <div className="userAvatar">👤</div>
          {!isCollapsed && (
            <div className="userMeta">
              <div className="userName">{authContext.name}</div>
              <div className="userEmail">{authContext.email}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="createTopBar">
          <div>
            <h1 className="createTitle">Create New Ticket</h1>
            <p className="createSubtitle">
              Fill in the details below. A quote will be automatically generated based on your
              inputs.
            </p>
          </div>
        </header>

        <form className="formShell" onSubmit={handleSubmit}>
          <section className="formCard">
            <div className="formHeader">
              <div>
                <div className="formHeaderTitle">Ticket Information</div>
                <div className="formHeaderSubtitle">
                  Provide as much detail as possible to help us understand your request
                </div>
              </div>
            </div>

            {/* Ticket Type */}
            <div className="field">
              <label className="label">
                Ticket Type <span className="req">*</span>
              </label>
              <select
                className="control"
                value={form.ticket_type_id}
                onChange={(e) => setField('ticket_type_id', Number(e.target.value))}
              >
                {TICKET_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="field">
              <label className="label">
                Title <span className="req">*</span>
              </label>
              <input
                className="control"
                placeholder="Brief summary of the issue or request"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="field">
              <label className="label">
                Description <span className="req">*</span>
              </label>
              <textarea
                className="control textarea"
                placeholder="Provide a detailed explanation of the issue or request."
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                required
              />
              <div className="helpRow">
                <span className="charCount">{descriptionCount} characters</span>
              </div>
            </div>

            <div className="grid2">
              {/* Severity */}
              <div className="field">
                <label className="label">
                  Severity <span className="req">*</span>
                </label>
                <select
                  className="control"
                  value={form.ticket_severity_id}
                  onChange={(e) => setField('ticket_severity_id', Number(e.target.value))}
                >
                  {SEVERITIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Impact */}
              <div className="field">
                <label className="label">
                  Business Impact <span className="req">*</span>
                </label>
                <select
                  className="control"
                  value={form.business_impact_id}
                  onChange={(e) => setField('business_impact_id', Number(e.target.value))}
                >
                  {BUSINESS_IMPACTS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid2">
              {/* Priority */}
              <div className="field">
                <label className="label">
                  Priority <span className="req">*</span>
                </label>
                <select
                  className="control"
                  value={form.ticket_priority_id}
                  onChange={(e) => setField('ticket_priority_id', Number(e.target.value))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="field">
                <label className="label">
                  Status <span className="req">*</span>
                </label>
                <select
                  className="control"
                  value={form.ticket_status_id}
                  onChange={(e) => setField('ticket_status_id', Number(e.target.value))}
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid2">
              {/* Deadline */}
              <div className="field">
                <label className="label">
                  Deadline <span className="req">*</span>
                </label>
                <input
                  type="date"
                  className="control"
                  value={form.deadline_date}
                  onChange={(e) => setField('deadline_date', e.target.value)}
                  required
                />
              </div>

              {/* Users impacted */}
              <div className="field">
                <label className="label">
                  Users Impacted <span className="req">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  className="control"
                  value={form.users_impacted}
                  onChange={(e) => setField('users_impacted', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Optional ERD fields */}
            <div className="grid2">
              <div className="field">
                <label className="label">Assign To</label>
                <select
                  className="control"
                  value={form.assigned_to_user_id}
                  onChange={(e) => {
                    const v = e.target.value;
                    setField('assigned_to_user_id', v === 'unassigned' ? 'unassigned' : Number(v));
                  }}
                >
                  <option value="unassigned">Unassigned</option>
                  {ASSIGNEES.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">SLA Policy</label>
                <select
                  className="control"
                  value={form.sla_policy_id}
                  onChange={(e) => {
                    const v = e.target.value;
                    setField('sla_policy_id', v === 'none' ? 'none' : Number(v));
                  }}
                >
                  <option value="none">None</option>
                  {SLA_POLICIES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <div className="formActions">
            <button className="submitBtn" type="submit">
              💾 Submit Ticket
            </button>
            <button className="cancelBtn" type="button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateTicketPage;
