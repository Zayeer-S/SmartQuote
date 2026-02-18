/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import { useAuth } from '../../hooks/auth/useAuth';
import { useCreateTicket } from '../../hooks/tickets/useCreateTicket';
import './CreateTicketPage.css';
import './CustomerPage.css';
import {
  BUSINESS_IMPACTS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_TYPES,
} from '../../../shared/constants';
import { CLIENT_ROUTES } from '../../constants/client.routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MenuKey = 'Dashboard' | 'My Tickets' | 'Quotes' | 'History' | 'Profile';

interface LookupOption {
  id: number;
  label: string;
}

interface TicketFormState {
  ticket_type_id: number;
  title: string;
  description: string;
  ticket_severity_id: number;
  business_impact_id: number;
  ticket_priority_id: number;
  deadline_date: string;
  users_impacted: number;
}

// ---------------------------------------------------------------------------
// Lookup options derived from shared constants (single source of truth)
// ---------------------------------------------------------------------------

const TICKET_TYPE_OPTIONS: LookupOption[] = Object.entries(TICKET_TYPES).map(([, label], i) => ({
  id: i + 1,
  label,
}));

const SEVERITY_OPTIONS: LookupOption[] = Object.entries(TICKET_SEVERITIES).map(([, label], i) => ({
  id: i + 1,
  label,
}));

const BUSINESS_IMPACT_OPTIONS: LookupOption[] = Object.entries(BUSINESS_IMPACTS).map(
  ([, label], i) => ({ id: i + 1, label })
);

const PRIORITY_OPTIONS: LookupOption[] = Object.entries(TICKET_PRIORITIES).map(([, label], i) => ({
  id: i + 1,
  label,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateToISOEndOfDay(dateStr: string): string {
  if (!dateStr) return '';
  const [yyyy, mm, dd] = dateStr.split('-').map(Number);
  const dt = new Date(yyyy, (mm ?? 1) - 1, dd ?? 1, 23, 59, 59, 0);
  return dt.toISOString();
}

const INITIAL_FORM: TicketFormState = {
  ticket_type_id: TICKET_TYPE_OPTIONS[0]?.id ?? 1,
  title: '',
  description: '',
  ticket_severity_id: SEVERITY_OPTIONS[1]?.id ?? 2,
  business_impact_id: BUSINESS_IMPACT_OPTIONS[1]?.id ?? 2,
  ticket_priority_id: PRIORITY_OPTIONS[1]?.id ?? 2,
  deadline_date: '',
  users_impacted: 1,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { execute: createTicket } = useCreateTicket();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('My Tickets');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [form, setForm] = useState<TicketFormState>(INITIAL_FORM);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((v) => !v);
  }, []);

  const setField = <K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to create a ticket.');
      return;
    }
    if (!form.title.trim()) {
      alert('Title is required.');
      return;
    }
    if (!form.description.trim()) {
      alert('Description is required.');
      return;
    }
    if (!form.deadline_date) {
      alert('Deadline is required.');
      return;
    }
    if (!Number.isFinite(form.users_impacted) || form.users_impacted < 1) {
      alert('Users impacted must be 1 or more.');
      return;
    }

    try {
      await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        ticketTypeId: form.ticket_type_id,
        ticketSeverityId: form.ticket_severity_id,
        businessImpactId: form.business_impact_id,
        ticketPriorityId: form.ticket_priority_id,
        deadline: dateToISOEndOfDay(form.deadline_date),
        usersImpacted: form.users_impacted,
      });

      alert('Ticket created successfully.');
      void navigate(CLIENT_ROUTES.CUSTOMER);
    } catch (err) {
      console.error(err);
      alert(`Failed to create ticket: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className={`customerPage ${isCollapsed ? 'sidebarCollapsed' : ''}`}>
      <CustomerSidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />

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

        <form className="formShell" onSubmit={void handleSubmit}>
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
                {TICKET_TYPE_OPTIONS.map((t) => (
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
                <span className="charCount">{form.description.length} characters</span>
              </div>
            </div>

            {/* Severity + Business Impact */}
            <div className="grid2">
              <div className="field">
                <label className="label">
                  Severity <span className="req">*</span>
                </label>
                <select
                  className="control"
                  value={form.ticket_severity_id}
                  onChange={(e) => setField('ticket_severity_id', Number(e.target.value))}
                >
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">
                  Business Impact <span className="req">*</span>
                </label>
                <select
                  className="control"
                  value={form.business_impact_id}
                  onChange={(e) => setField('business_impact_id', Number(e.target.value))}
                >
                  {BUSINESS_IMPACT_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline + Users Impacted */}
            <div className="grid2">
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
          </section>

          <div className="formActions">
            <button className="submitBtn" type="submit">
              💾 Submit Ticket
            </button>
            <button
              className="cancelBtn"
              type="button"
              onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER)}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateTicketPage;
