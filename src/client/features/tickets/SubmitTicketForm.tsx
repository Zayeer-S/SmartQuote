import React, { useState } from 'react';
import { useCreateTicket } from '../../hooks/tickets/useCreateTicket';
import {
  TICKET_TYPES,
  TICKET_SEVERITIES,
  BUSINESS_IMPACTS,
  TICKET_PRIORITIES,
  LOOKUP_IDS,
} from '../../../shared/constants/lookup-values';
import type { CreateTicketRequest } from '../../../shared/contracts/ticket-contracts';
import './SubmitTicketForm.css';

interface SubmitTicketFormProps {
  onSuccess: () => void;
}

interface FormState {
  title: string;
  description: string;
  ticketTypeId: number;
  ticketSeverityId: number;
  businessImpactId: number;
  ticketPriorityId: number;
  deadline: string;
  usersImpacted: string;
}

const TICKET_TYPE_OPTIONS = [
  { id: LOOKUP_IDS.TICKET_TYPE.SUPPORT, label: TICKET_TYPES.SUPPORT },
  { id: LOOKUP_IDS.TICKET_TYPE.INCIDENT, label: TICKET_TYPES.INCIDENT },
  { id: LOOKUP_IDS.TICKET_TYPE.ENHANCEMENT, label: TICKET_TYPES.ENHANCEMENT },
] as const;

const TICKET_SEVERITY_OPTIONS = [
  { id: LOOKUP_IDS.TICKET_SEVERITY.LOW, label: TICKET_SEVERITIES.LOW },
  { id: LOOKUP_IDS.TICKET_SEVERITY.MEDIUM, label: TICKET_SEVERITIES.MEDIUM },
  { id: LOOKUP_IDS.TICKET_SEVERITY.HIGH, label: TICKET_SEVERITIES.HIGH },
  { id: LOOKUP_IDS.TICKET_SEVERITY.CRITICAL, label: TICKET_SEVERITIES.CRITICAL },
] as const;

const BUSINESS_IMPACT_OPTIONS = [
  { id: LOOKUP_IDS.BUSINESS_IMPACT.MINOR, label: BUSINESS_IMPACTS.MINOR },
  { id: LOOKUP_IDS.BUSINESS_IMPACT.MODERATE, label: BUSINESS_IMPACTS.MODERATE },
  { id: LOOKUP_IDS.BUSINESS_IMPACT.MAJOR, label: BUSINESS_IMPACTS.MAJOR },
  { id: LOOKUP_IDS.BUSINESS_IMPACT.CRITICAL, label: BUSINESS_IMPACTS.CRITICAL },
] as const;

const TICKET_PRIORITY_OPTIONS = [
  { id: LOOKUP_IDS.TICKET_PRIORITY.P1, label: TICKET_PRIORITIES.P1 },
  { id: LOOKUP_IDS.TICKET_PRIORITY.P2, label: TICKET_PRIORITIES.P2 },
  { id: LOOKUP_IDS.TICKET_PRIORITY.P3, label: TICKET_PRIORITIES.P3 },
  { id: LOOKUP_IDS.TICKET_PRIORITY.P4, label: TICKET_PRIORITIES.P4 },
] as const;

const INITIAL_FORM_STATE: FormState = {
  title: '',
  description: '',
  ticketTypeId: LOOKUP_IDS.TICKET_TYPE.SUPPORT,
  ticketSeverityId: LOOKUP_IDS.TICKET_SEVERITY.LOW,
  businessImpactId: LOOKUP_IDS.BUSINESS_IMPACT.MINOR,
  ticketPriorityId: LOOKUP_IDS.TICKET_PRIORITY.P4,
  deadline: '',
  usersImpacted: '',
};

const SubmitTicketForm: React.FC<SubmitTicketFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const { execute, loading, error, data } = useCreateTicket();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectNumber = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const usersImpacted = parseInt(form.usersImpacted, 10);
    if (isNaN(usersImpacted) || usersImpacted < 0) return;

    const payload: CreateTicketRequest = {
      title: form.title,
      description: form.description,
      ticketTypeId: form.ticketTypeId,
      ticketSeverityId: form.ticketSeverityId,
      businessImpactId: form.businessImpactId,
      ticketPriorityId: form.ticketPriorityId,
      deadline: new Date(form.deadline).toISOString(),
      usersImpacted,
    };

    await execute(payload);
  };

  React.useEffect(() => {
    if (data !== null) {
      onSuccess();
    }
  }, [data, onSuccess]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <form
      className="submit-ticket-form"
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      aria-label="Submit ticket form"
      data-testid="submit-ticket-form"
    >
      <div className="field-group">
        <label className="field-label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="field-input"
          value={form.title}
          onChange={handleChange}
          placeholder="Brief summary of the issue"
          required
          disabled={loading}
          aria-required="true"
          data-testid="field-title"
        />
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className="field-textarea"
          value={form.description}
          onChange={handleChange}
          placeholder="Detailed explanation of the issue or request"
          required
          disabled={loading}
          aria-required="true"
          rows={5}
          data-testid="field-description"
        />
      </div>

      <div className="submit-ticket-form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="ticketTypeId">
            Ticket Type
          </label>
          <select
            id="ticketTypeId"
            name="ticketTypeId"
            className="field-select"
            value={form.ticketTypeId}
            onChange={handleSelectNumber}
            required
            disabled={loading}
            data-testid="field-ticket-type"
          >
            {TICKET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="ticketSeverityId">
            Severity
          </label>
          <select
            id="ticketSeverityId"
            name="ticketSeverityId"
            className="field-select"
            value={form.ticketSeverityId}
            onChange={handleSelectNumber}
            required
            disabled={loading}
            data-testid="field-severity"
          >
            {TICKET_SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="businessImpactId">
            Business Impact
          </label>
          <select
            id="businessImpactId"
            name="businessImpactId"
            className="field-select"
            value={form.businessImpactId}
            onChange={handleSelectNumber}
            required
            disabled={loading}
            data-testid="field-business-impact"
          >
            {BUSINESS_IMPACT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="ticketPriorityId">
            Priority
          </label>
          <select
            id="ticketPriorityId"
            name="ticketPriorityId"
            className="field-select"
            value={form.ticketPriorityId}
            onChange={handleSelectNumber}
            required
            disabled={loading}
            data-testid="field-priority"
          >
            {TICKET_PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="deadline">
            Deadline
          </label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            className="field-input"
            value={form.deadline}
            onChange={handleChange}
            min={today}
            required
            disabled={loading}
            aria-required="true"
            data-testid="field-deadline"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="usersImpacted">
            Users Impacted
          </label>
          <input
            id="usersImpacted"
            name="usersImpacted"
            type="number"
            className="field-input"
            min={0}
            value={form.usersImpacted}
            onChange={handleChange}
            placeholder="Number of users affected"
            required
            disabled={loading}
            aria-required="true"
            data-testid="field-users-impacted"
          />
        </div>
      </div>

      {error && (
        <p className="feedback-error" role="alert" data-testid="submit-error">
          {error}
        </p>
      )}

      <div className="submit-ticket-form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          aria-busy={loading}
          data-testid="submit-ticket-btn"
        >
          {loading ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </div>
    </form>
  );
};

export default SubmitTicketForm;
