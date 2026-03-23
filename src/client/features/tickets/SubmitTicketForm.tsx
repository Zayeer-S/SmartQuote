import React, { useState } from 'react';
import { useCreateTicket } from '../../hooks/tickets/useCreateTicket.js';
import {
  TICKET_TYPES,
  TICKET_SEVERITIES,
  BUSINESS_IMPACTS,
  TICKET_PRIORITIES,
} from '../../../shared/constants/lookup-values.js';
import type {
  TicketType,
  TicketSeverity,
  BusinessImpact,
  TicketPriority,
} from '../../../shared/constants/lookup-values.js';
import type { CreateTicketRequest } from '../../../shared/contracts/ticket-contracts.js';
import './SubmitTicketForm.css';

interface SubmitTicketFormProps {
  onSuccess: () => void;
}

interface FormState {
  title: string;
  description: string;
  ticketType: TicketType;
  ticketSeverity: TicketSeverity;
  businessImpact: BusinessImpact;
  ticketPriority: TicketPriority;
  deadline: string;
  usersImpacted: string;
}

const TICKET_TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: TICKET_TYPES.SUPPORT, label: TICKET_TYPES.SUPPORT },
  { value: TICKET_TYPES.INCIDENT, label: TICKET_TYPES.INCIDENT },
  { value: TICKET_TYPES.ENHANCEMENT, label: TICKET_TYPES.ENHANCEMENT },
];

const TICKET_SEVERITY_OPTIONS: { value: TicketSeverity; label: string }[] = [
  { value: TICKET_SEVERITIES.LOW, label: TICKET_SEVERITIES.LOW },
  { value: TICKET_SEVERITIES.MEDIUM, label: TICKET_SEVERITIES.MEDIUM },
  { value: TICKET_SEVERITIES.HIGH, label: TICKET_SEVERITIES.HIGH },
  { value: TICKET_SEVERITIES.CRITICAL, label: TICKET_SEVERITIES.CRITICAL },
];

const BUSINESS_IMPACT_OPTIONS: { value: BusinessImpact; label: string }[] = [
  { value: BUSINESS_IMPACTS.MINOR, label: BUSINESS_IMPACTS.MINOR },
  { value: BUSINESS_IMPACTS.MODERATE, label: BUSINESS_IMPACTS.MODERATE },
  { value: BUSINESS_IMPACTS.MAJOR, label: BUSINESS_IMPACTS.MAJOR },
  { value: BUSINESS_IMPACTS.CRITICAL, label: BUSINESS_IMPACTS.CRITICAL },
];

const INITIAL_FORM_STATE: FormState = {
  title: '',
  description: '',
  ticketType: TICKET_TYPES.SUPPORT,
  ticketSeverity: TICKET_SEVERITIES.LOW,
  businessImpact: BUSINESS_IMPACTS.MINOR,
  ticketPriority: TICKET_PRIORITIES.P4,
  deadline: '',
  usersImpacted: '',
};

function validateForm(form: FormState): string | null {
  if (!form.title.trim()) return 'Title is required.';
  if (!form.description.trim()) return 'Description is required.';
  if (!form.deadline) return 'Deadline is required.';

  const today = new Date().toISOString().split('T')[0];
  if (form.deadline < today) return 'Deadline must be today or in the future.';

  if (!/^\d+$/.test(form.usersImpacted)) return 'Users impacted must be a whole number.';

  return null;
}

const SubmitTicketForm: React.FC<SubmitTicketFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { execute, loading, error, data } = useCreateTicket();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    if (name === 'usersImpacted' && value !== '' && !/^\d+$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setValidationError(null);

    const formError = validateForm(form);
    if (formError) {
      setValidationError(formError);
      return;
    }

    const payload: CreateTicketRequest = {
      title: form.title,
      description: form.description,
      ticketType: form.ticketType,
      ticketSeverity: form.ticketSeverity,
      businessImpact: form.businessImpact,
      deadline: new Date(form.deadline).toISOString(),
      usersImpacted: parseInt(form.usersImpacted, 10),
    };

    await execute(payload);
  };

  React.useEffect(() => {
    if (data !== null) {
      onSuccess();
    }
  }, [data, onSuccess]);

  const today = new Date().toISOString().split('T')[0];
  const displayError = validationError ?? error;

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
          <label className="field-label" htmlFor="ticketType">
            Ticket Type
          </label>
          <select
            id="ticketType"
            name="ticketType"
            className="field-select"
            value={form.ticketType}
            onChange={handleChange}
            required
            disabled={loading}
            data-testid="field-ticket-type"
          >
            {TICKET_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="ticketSeverity">
            Severity
          </label>
          <select
            id="ticketSeverity"
            name="ticketSeverity"
            className="field-select"
            value={form.ticketSeverity}
            onChange={handleChange}
            required
            disabled={loading}
            data-testid="field-severity"
          >
            {TICKET_SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="businessImpact">
            Business Impact
          </label>
          <select
            id="businessImpact"
            name="businessImpact"
            className="field-select"
            value={form.businessImpact}
            onChange={handleChange}
            required
            disabled={loading}
            data-testid="field-business-impact"
          >
            {BUSINESS_IMPACT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
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
            type="text"
            inputMode="numeric"
            className="field-input"
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

      {displayError && (
        <p className="feedback-error" role="alert" data-testid="submit-error">
          {displayError}
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
