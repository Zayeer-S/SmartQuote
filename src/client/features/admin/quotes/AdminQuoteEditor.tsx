import React, { useState } from 'react';
import { useGenerateQuote } from '../../../hooks/quotes/useGenerateQuote.js';
import { useCreateManualQuote } from '../../../hooks/quotes/useCreateManualQuote.js';
import { useUpdateQuote } from '../../../hooks/quotes/useUpdateQuote.js';
import { useQuotePermissions } from '../../../hooks/auth/useQuotePermissions.js';
import type { QuoteWithApprovalResponse } from '../../../../shared/contracts/quote-contracts.js';
import {
  EFFORT_OPTIONS,
  CONFIDENCE_OPTIONS,
  INITIAL_CREATE_FORM,
  isEditable,
  isCreatable,
} from './AdminQuotePanel.types.js';
import type { UpdateQuoteFormState } from './AdminQuotePanel.types.js';
import './AdminQuoteEditor.css';
import { checkDecimalInput, checkIntegerInput } from '../../../lib/utils/input-utils.js';

interface AdminCreateQuoteFormProps {
  ticketId: string;
  latestQuote: QuoteWithApprovalResponse | null;
  onSuccess: () => void;
}

export const AdminCreateQuoteForm: React.FC<AdminCreateQuoteFormProps> = ({
  ticketId,
  latestQuote,
  onSuccess,
}) => {
  const { canCreate } = useQuotePermissions();
  const generate = useGenerateQuote();
  const createManual = useCreateManualQuote();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_CREATE_FORM);

  const status = latestQuote?.approvalStatus ?? null;
  const quoteIsCreatable = isCreatable(status);
  if (!canCreate || !quoteIsCreatable) return null;

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIntegerFieldChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (checkIntegerInput(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDecimalFieldChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (checkDecimalInput(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = (): void => {
    void generate.execute(ticketId).then(() => {
      onSuccess();
    });
  };

  const handleManualSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void createManual
      .execute(ticketId, {
        estimatedHoursMinimum: Number(form.estimatedHoursMinimum),
        estimatedHoursMaximum: Number(form.estimatedHoursMaximum),
        hourlyRate: Number(form.hourlyRate),
        fixedCost: Number(form.fixedCost),
        quoteEffortLevel: form.quoteEffortLevel,
        quoteConfidenceLevel: form.quoteConfidenceLevel,
      })
      .then(() => {
        setForm(INITIAL_CREATE_FORM);
        setShowForm(false);
        onSuccess();
      });
  };

  return (
    <section aria-label="Create quote" data-testid="admin-create-quote-section">
      <div className="admin-quote-editor-actions" data-testid="admin-create-quote-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generate.loading}
          aria-busy={generate.loading}
          data-testid="generate-quote-btn"
        >
          {generate.loading ? 'Generating...' : 'Auto-Generate Quote'}
        </button>

        <button
          type="button"
          className={`btn ${showForm ? 'btn-ghost' : 'btn-secondary'}`}
          onClick={() => {
            setShowForm((prev) => !prev);
          }}
          data-testid="toggle-manual-quote-btn"
        >
          {showForm ? 'Cancel' : 'Create Manual Quote'}
        </button>
      </div>

      {generate.error && (
        <p className="feedback-error" role="alert" data-testid="generate-error">
          {generate.error}
        </p>
      )}
      {createManual.error && (
        <p className="feedback-error" role="alert" data-testid="manual-quote-error">
          {createManual.error}
        </p>
      )}

      {showForm && (
        <form
          className="admin-quote-create-panel"
          onSubmit={handleManualSubmit}
          aria-label="Create manual quote"
          data-testid="manual-quote-form"
        >
          <h3>Create Manual Quote</h3>

          <div className="admin-quote-form-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="mq-hours-min">
                Min Hours
              </label>
              <input
                className="field-input"
                id="mq-hours-min"
                name="estimatedHoursMinimum"
                type="text"
                inputMode="numeric"
                min={0}
                value={form.estimatedHoursMinimum}
                onChange={handleIntegerFieldChange}
                required
                placeholder="Minimum expected hours for quote"
                disabled={createManual.loading}
                data-testid="mq-hours-min"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mq-hours-max">
                Max Hours
              </label>
              <input
                className="field-input"
                id="mq-hours-max"
                name="estimatedHoursMaximum"
                type="text"
                inputMode="numeric"
                min={0}
                value={form.estimatedHoursMaximum}
                onChange={handleIntegerFieldChange}
                required
                placeholder="Maximum expected hours for quote"
                disabled={createManual.loading}
                data-testid="mq-hours-max"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mq-rate">
                Hourly Rate (GBP)
              </label>
              <input
                className="field-input"
                id="mq-rate"
                name="hourlyRate"
                type="text"
                inputMode="numeric"
                min={0}
                step="0.01"
                value={form.hourlyRate}
                onChange={handleDecimalFieldChange}
                required
                disabled={createManual.loading}
                data-testid="mq-rate"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mq-fixed-cost">
                Fixed Cost (GBP)
              </label>
              <input
                className="field-input"
                id="mq-fixed-cost"
                name="fixedCost"
                type="text"
                inputMode="numeric"
                min={0}
                step="0.01"
                value={form.fixedCost}
                onChange={handleDecimalFieldChange}
                required
                placeholder="Special or one-off costs"
                disabled={createManual.loading}
                data-testid="mq-fixed-cost"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mq-effort">
                Effort Level
              </label>
              <select
                className="field-select"
                id="mq-effort"
                name="quoteEffortLevel"
                value={form.quoteEffortLevel}
                onChange={handleFieldChange}
                disabled={createManual.loading}
                data-testid="mq-effort"
              >
                {EFFORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mq-confidence">
                Confidence Level
              </label>
              <select
                className="field-select"
                id="mq-confidence"
                name="quoteConfidenceLevel"
                value={form.quoteConfidenceLevel}
                onChange={handleFieldChange}
                disabled={createManual.loading}
                data-testid="mq-confidence"
              >
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={createManual.loading}
            aria-busy={createManual.loading}
            data-testid="manual-quote-submit-btn"
          >
            {createManual.loading ? 'Creating...' : 'Create Quote'}
          </button>
        </form>
      )}
    </section>
  );
};

interface AdminUpdateQuoteFormProps {
  ticketId: string;
  latestQuote: QuoteWithApprovalResponse;
  onSuccess: () => void;
}

export const AdminUpdateQuoteForm: React.FC<AdminUpdateQuoteFormProps> = ({
  ticketId,
  latestQuote,
  onSuccess,
}) => {
  const { canUpdate } = useQuotePermissions();
  const updateQuote = useUpdateQuote();

  const [form, setForm] = useState<UpdateQuoteFormState>({});
  const [reason, setReason] = useState('');

  const quoteIsEditable = isEditable(latestQuote.approvalStatus ?? null);

  if (!canUpdate || !quoteIsEditable) return null;

  const handleIntegerFieldChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (checkIntegerInput(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDecimalFieldChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    if (checkDecimalInput(value)) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = (): Omit<UpdateQuoteFormState, 'reason'> => {
    const changed: Omit<UpdateQuoteFormState, 'reason'> = {};

    if (
      form.estimatedHoursMinimum !== undefined &&
      form.estimatedHoursMinimum !== '' &&
      Number(form.estimatedHoursMinimum) !== latestQuote.estimatedHoursMinimum
    ) {
      changed.estimatedHoursMinimum = form.estimatedHoursMinimum;
    }
    if (
      form.estimatedHoursMaximum !== undefined &&
      form.estimatedHoursMaximum !== '' &&
      Number(form.estimatedHoursMaximum) !== latestQuote.estimatedHoursMaximum
    ) {
      changed.estimatedHoursMaximum = form.estimatedHoursMaximum;
    }
    if (
      form.hourlyRate !== undefined &&
      form.hourlyRate !== '' &&
      Number(form.hourlyRate) !== latestQuote.hourlyRate
    ) {
      changed.hourlyRate = form.hourlyRate;
    }
    if (
      form.fixedCost !== undefined &&
      form.fixedCost !== '' &&
      Number(form.fixedCost) !== latestQuote.fixedCost
    ) {
      changed.fixedCost = form.fixedCost;
    }
    if (
      form.quoteEffortLevel !== undefined &&
      form.quoteEffortLevel !== latestQuote.quoteEffortLevel
    ) {
      changed.quoteEffortLevel = form.quoteEffortLevel;
    }
    if (
      form.quoteConfidenceLevel !== undefined &&
      form.quoteConfidenceLevel !== latestQuote.quoteConfidenceLevel
    ) {
      changed.quoteConfidenceLevel = form.quoteConfidenceLevel;
    }

    return changed;
  };

  const hasValidChanges = (): boolean => Object.keys(buildPayload()).length > 0;

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!reason.trim() || !hasValidChanges()) return;

    const payload = buildPayload();
    void updateQuote
      .execute(ticketId, latestQuote.id, {
        ...(payload.estimatedHoursMinimum !== undefined && {
          estimatedHoursMinimum: Number(payload.estimatedHoursMinimum),
        }),
        ...(payload.estimatedHoursMaximum !== undefined && {
          estimatedHoursMaximum: Number(payload.estimatedHoursMaximum),
        }),
        ...(payload.hourlyRate !== undefined && {
          hourlyRate: Number(payload.hourlyRate),
        }),
        ...(payload.fixedCost !== undefined && {
          fixedCost: Number(payload.fixedCost),
        }),
        ...(payload.quoteEffortLevel !== undefined && {
          quoteEffortLevel: payload.quoteEffortLevel,
        }),
        ...(payload.quoteConfidenceLevel !== undefined && {
          quoteConfidenceLevel: payload.quoteConfidenceLevel,
        }),
        reason,
      })
      .then(() => {
        setForm({});
        setReason('');
        onSuccess();
      });
  };

  return (
    <section aria-label="Update quote" data-testid="admin-update-quote-section">
      {updateQuote.error && (
        <p className="feedback-error" role="alert" data-testid="update-quote-error">
          {updateQuote.error}
        </p>
      )}

      <form
        className="admin-quote-edit-panel"
        onSubmit={handleSubmit}
        aria-label="Update quote"
        data-testid="update-quote-form"
      >
        <h3 className="admin-quote-edit-subpanel-heading">
          Update Quote <span className="admin-quote-version">v{latestQuote.version}</span>
        </h3>
        <p className="admin-quote-edit-subpanel-hint">
          Only fill in the fields you want to change. Fields matching the current value will not be
          submitted.
        </p>

        <div className="admin-quote-form-grid">
          <div className="field-group">
            <label className="field-label" htmlFor="uq-hours-min">
              Min Hours
            </label>
            <input
              className="field-input"
              id="uq-hours-min"
              name="estimatedHoursMinimum"
              type="text"
              inputMode="numeric"
              min={0}
              maxLength={4}
              placeholder={String(latestQuote.estimatedHoursMinimum)}
              value={form.estimatedHoursMinimum ?? ''}
              onChange={handleIntegerFieldChange}
              disabled={updateQuote.loading}
              data-testid="uq-hours-min"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="uq-hours-max">
              Max Hours
            </label>
            <input
              className="field-input"
              id="uq-hours-max"
              name="estimatedHoursMaximum"
              type="text"
              inputMode="numeric"
              min={0}
              maxLength={4}
              placeholder={String(latestQuote.estimatedHoursMaximum)}
              value={form.estimatedHoursMaximum ?? ''}
              onChange={handleIntegerFieldChange}
              disabled={updateQuote.loading}
              data-testid="uq-hours-max"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="uq-rate">
              Hourly Rate (GBP)
            </label>
            <input
              className="field-input"
              id="uq-rate"
              name="hourlyRate"
              type="text"
              inputMode="numeric"
              min={0}
              maxLength={4}
              step="0.01"
              placeholder={String(latestQuote.hourlyRate)}
              value={form.hourlyRate ?? ''}
              onChange={handleDecimalFieldChange}
              disabled={updateQuote.loading}
              data-testid="uq-rate"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="uq-fixed-cost">
              Fixed Cost (GBP)
            </label>
            <input
              className="field-input"
              id="uq-fixed-cost"
              name="fixedCost"
              type="text"
              inputMode="numeric"
              min={0}
              maxLength={5}
              step="0.01"
              placeholder={String(latestQuote.fixedCost)}
              value={form.fixedCost ?? ''}
              onChange={handleDecimalFieldChange}
              disabled={updateQuote.loading}
              data-testid="uq-fixed-cost"
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="uq-reason">
            Reason for Change
          </label>
          <textarea
            className="field-textarea"
            id="uq-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
            }}
            placeholder="Described what changed and why..."
            required
            disabled={updateQuote.loading}
            rows={3}
            aria-required="true"
            data-testid="uq-reason"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={updateQuote.loading || !reason.trim() || !hasValidChanges()}
          aria-busy={updateQuote.loading}
          data-testid="update-quote-submit-btn"
        >
          {updateQuote.loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </section>
  );
};
