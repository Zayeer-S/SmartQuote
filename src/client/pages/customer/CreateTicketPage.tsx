/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from './CustomerLayout';
import { useAuth } from '../../hooks/auth/useAuth';
import { useCreateTicket } from '../../hooks/tickets/useCreateTicket';
import './CreateTicketPage.css';
import {
  BUSINESS_IMPACTS,
  LOOKUP_IDS,
  TICKET_PRIORITIES,
  TICKET_SEVERITIES,
  TICKET_TYPES,
} from '../../../shared/constants';
import { CLIENT_ROUTES } from '../../constants/client.routes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
// Lookup options
//
// IDs come from LOOKUP_IDS — the single source of truth that mirrors the seed
// insertion order. Labels come from the name constants for display only.
// ---------------------------------------------------------------------------

const TICKET_TYPE_OPTIONS: LookupOption[] = [
  { id: LOOKUP_IDS.TICKET_TYPE.SUPPORT, label: TICKET_TYPES.SUPPORT },
  { id: LOOKUP_IDS.TICKET_TYPE.INCIDENT, label: TICKET_TYPES.INCIDENT },
  { id: LOOKUP_IDS.TICKET_TYPE.ENHANCEMENT, label: TICKET_TYPES.ENHANCEMENT },
];

const SEVERITY_OPTIONS: LookupOption[] = [
  { id: LOOKUP_IDS.TICKET_SEVERITY.LOW, label: TICKET_SEVERITIES.LOW },
  { id: LOOKUP_IDS.TICKET_SEVERITY.MEDIUM, label: TICKET_SEVERITIES.MEDIUM },
  { id: LOOKUP_IDS.TICKET_SEVERITY.HIGH, label: TICKET_SEVERITIES.HIGH },
  { id: LOOKUP_IDS.TICKET_SEVERITY.CRITICAL, label: TICKET_SEVERITIES.CRITICAL },
];

const BUSINESS_IMPACT_OPTIONS: LookupOption[] = [
  { id: LOOKUP_IDS.BUSINESS_IMPACT.MINOR, label: BUSINESS_IMPACTS.MINOR },
  { id: LOOKUP_IDS.BUSINESS_IMPACT.MODERATE, label: BUSINESS_IMPACTS.MODERATE },
  { id: LOOKUP_IDS.BUSINESS_IMPACT.MAJOR, label: BUSINESS_IMPACTS.MAJOR },
  { id: LOOKUP_IDS.BUSINESS_IMPACT.CRITICAL, label: BUSINESS_IMPACTS.CRITICAL },
];

const PRIORITY_OPTIONS: LookupOption[] = [
  { id: LOOKUP_IDS.TICKET_PRIORITY.P1, label: TICKET_PRIORITIES.P1 },
  { id: LOOKUP_IDS.TICKET_PRIORITY.P2, label: TICKET_PRIORITIES.P2 },
  { id: LOOKUP_IDS.TICKET_PRIORITY.P3, label: TICKET_PRIORITIES.P3 },
  { id: LOOKUP_IDS.TICKET_PRIORITY.P4, label: TICKET_PRIORITIES.P4 },
];

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
  ticket_type_id: LOOKUP_IDS.TICKET_TYPE.SUPPORT,
  title: '',
  description: '',
  ticket_severity_id: LOOKUP_IDS.TICKET_SEVERITY.MEDIUM,
  business_impact_id: LOOKUP_IDS.BUSINESS_IMPACT.MODERATE,
  ticket_priority_id: LOOKUP_IDS.TICKET_PRIORITY.P2,
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

  const [form, setForm] = useState<TicketFormState>(INITIAL_FORM);

  const setField = useCallback(
    <K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSubmit = async (e: React.SyntheticEvent) => {
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
    <CustomerLayout>
      <header className="createTopBar" data-testid="create-ticket-header">
        <div>
          <h1 className="createTitle">Create New Ticket</h1>
          <p className="createSubtitle">
            Fill in the details below. A quote will be automatically generated based on your inputs.
          </p>
        </div>
      </header>

      <form
        className="formShell"
        onSubmit={(e) => void handleSubmit(e)}
        aria-labelledby="form-section-heading"
        noValidate
        data-testid="create-ticket-form"
      >
        <section className="formCard" aria-labelledby="form-section-heading">
          <div className="formHeader">
            <div>
              <h2 id="form-section-heading" className="formHeaderTitle">
                Ticket Information
              </h2>
              <p className="formHeaderSubtitle">
                Provide as much detail as possible to help us understand your request
              </p>
            </div>
          </div>

          {/* Ticket Type */}
          <div className="field">
            <label className="label" htmlFor="ticket-type">
              Ticket Type{' '}
              <span className="req" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="ticket-type"
              className="control"
              value={form.ticket_type_id}
              onChange={(e) => {
                setField('ticket_type_id', Number(e.target.value));
              }}
              aria-required="true"
              data-testid="ticket-type-select"
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
            <label className="label" htmlFor="ticket-title">
              Title{' '}
              <span className="req" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="ticket-title"
              className="control"
              placeholder="Brief summary of the issue or request"
              value={form.title}
              onChange={(e) => {
                setField('title', e.target.value);
              }}
              aria-required="true"
              required
              data-testid="ticket-title-input"
            />
          </div>

          {/* Description */}
          <div className="field">
            <label className="label" htmlFor="ticket-description">
              Description{' '}
              <span className="req" aria-hidden="true">
                *
              </span>
            </label>
            <textarea
              id="ticket-description"
              className="control textarea"
              placeholder="Provide a detailed explanation of the issue or request."
              value={form.description}
              onChange={(e) => {
                setField('description', e.target.value);
              }}
              aria-required="true"
              aria-describedby="description-char-count"
              required
              data-testid="ticket-description-input"
            />
            <div className="helpRow">
              <span id="description-char-count" className="charCount">
                {form.description.length} characters
              </span>
            </div>
          </div>

          {/* Severity + Business Impact */}
          <div className="grid2">
            <div className="field">
              <label className="label" htmlFor="ticket-severity">
                Severity{' '}
                <span className="req" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="ticket-severity"
                className="control"
                value={form.ticket_severity_id}
                onChange={(e) => {
                  setField('ticket_severity_id', Number(e.target.value));
                }}
                aria-required="true"
                data-testid="ticket-severity-select"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="ticket-business-impact">
                Business Impact{' '}
                <span className="req" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="ticket-business-impact"
                className="control"
                value={form.business_impact_id}
                onChange={(e) => {
                  setField('business_impact_id', Number(e.target.value));
                }}
                aria-required="true"
                data-testid="ticket-business-impact-select"
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
            <label className="label" htmlFor="ticket-priority">
              Priority{' '}
              <span className="req" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="ticket-priority"
              className="control"
              value={form.ticket_priority_id}
              onChange={(e) => {
                setField('ticket_priority_id', Number(e.target.value));
              }}
              aria-required="true"
              data-testid="ticket-priority-select"
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
              <label className="label" htmlFor="ticket-deadline">
                Deadline{' '}
                <span className="req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="ticket-deadline"
                type="date"
                className="control"
                value={form.deadline_date}
                onChange={(e) => {
                  setField('deadline_date', e.target.value);
                }}
                aria-required="true"
                required
                data-testid="ticket-deadline-input"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="ticket-users-impacted">
                Users Impacted{' '}
                <span className="req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="ticket-users-impacted"
                type="number"
                min={1}
                className="control"
                value={form.users_impacted}
                onChange={(e) => {
                  setField('users_impacted', Number(e.target.value));
                }}
                aria-required="true"
                required
                data-testid="ticket-users-impacted-input"
              />
            </div>
          </div>
        </section>

        <div className="formActions" data-testid="form-actions">
          <button className="submitBtn" type="submit" data-testid="create-ticket-submit">
            💾 Submit Ticket
          </button>
          <button
            className="cancelBtn"
            type="button"
            onClick={() => void navigate(CLIENT_ROUTES.CUSTOMER)}
            data-testid="create-ticket-cancel"
          >
            Cancel
          </button>
        </div>
      </form>
    </CustomerLayout>
  );
};

export default CreateTicketPage;
