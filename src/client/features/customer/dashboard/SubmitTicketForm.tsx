import React, { useState } from 'react';
import { useCreateTicket } from '../../../hooks/tickets/useCreateTicket.js';
import { ticketAPI } from '../../../lib/api/ticket.api.js';
import {
  TICKET_TYPES,
  TICKET_SEVERITIES,
  BUSINESS_IMPACTS,
  ATTACHMENT_CONFIG,
} from '../../../../shared/constants/lookup-values.js';
import type {
  TicketType,
  TicketSeverity,
  BusinessImpact,
} from '../../../../shared/constants/lookup-values.js';
import type { CreateTicketRequest } from '../../../../shared/contracts/ticket-contracts.js';
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
  deadline: string;
  usersImpacted: string;
  files: File[];
}

type SubmitPhase = 'idle' | 'creating' | 'uploading';

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
  deadline: '',
  usersImpacted: '',
  files: [],
};

const PHASE_LABEL: Record<SubmitPhase, string> = {
  idle: 'Submit Ticket',
  creating: 'Submitting...',
  uploading: 'Uploading files...',
};

function validateForm(form: FormState): string | null {
  if (!form.title.trim()) return 'Title is required.';
  if (!form.description.trim()) return 'Description is required.';
  if (!form.deadline) return 'Deadline is required.';

  const today = new Date().toISOString().split('T')[0];
  if (form.deadline < today) return 'Deadline must be today or in the future.';

  if (!/^\d+$/.test(form.usersImpacted)) return 'Users impacted must be a whole number.';

  if (form.files.length > ATTACHMENT_CONFIG.MAX_COUNT)
    return `You can attach a maximum of ${String(ATTACHMENT_CONFIG.MAX_COUNT)} files.`;

  for (const file of form.files) {
    if (file.size > ATTACHMENT_CONFIG.MAX_SIZE_BYTES)
      return `"${file.name}" exceeds the 5MB file size limit.`;
    if (!(ATTACHMENT_CONFIG.ALLOWED_MIME_TYPES as readonly string[]).includes(file.type))
      return `"${file.name}" is not an allowed file type. Please attach PDF, JPG, or PNG files only.`;
  }

  return null;
}

const SubmitTicketForm: React.FC<SubmitTicketFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const { execute } = useCreateTicket();

  const loading = phase !== 'idle';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    if (name === 'usersImpacted' && value !== '' && !/^\d+$/.test(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const selected = Array.from(e.target.files ?? []);
    setForm((prev) => ({ ...prev, files: selected }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setValidationError(null);
    setSubmitError(null);

    const formError = validateForm(form);
    if (formError) {
      setValidationError(formError);
      return;
    }

    try {
      setPhase('creating');
      const payload: CreateTicketRequest = {
        title: form.title,
        description: form.description,
        ticketType: form.ticketType,
        ticketSeverity: form.ticketSeverity,
        businessImpact: form.businessImpact,
        deadline: new Date(form.deadline).toISOString(),
        usersImpacted: parseInt(form.usersImpacted, 10),
      };

      const ticket = await execute(payload);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!ticket) {
        setPhase('idle');
        return;
      }

      if (form.files.length > 0) {
        setPhase('uploading');
        for (const file of form.files) {
          await ticketAPI.uploadAttachment(ticket.id, file);
        }
      }

      onSuccess();
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
      setPhase('idle');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const displayError = validationError ?? submitError;

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

      <div className="field-group">
        <label className="field-label" htmlFor="attachments">
          Attachments{' '}
          <span className="field-label-hint">(optional -- PDF, JPG, PNG, max 5MB each)</span>
        </label>
        <input
          id="attachments"
          name="attachments"
          type="file"
          className="field-input"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileChange}
          disabled={loading}
          data-testid="field-attachments"
        />
        {form.files.length > 0 && (
          <p className="field-hint" data-testid="attachment-count">
            {String(form.files.length)} file{form.files.length !== 1 ? 's' : ''} selected
          </p>
        )}
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
          {PHASE_LABEL[phase]}
        </button>
      </div>
    </form>
  );
};

export default SubmitTicketForm;
