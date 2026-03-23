import React, { useState } from 'react';
import { useGenerateQuote } from '../../hooks/quotes/useGenerateQuote.js';
import { useCreateManualQuote } from '../../hooks/quotes/useCreateManualQuote.js';
import { useUpdateQuote } from '../../hooks/quotes/useUpdateQuote.js';
import { useSubmitForApproval } from '../../hooks/quotes/useSubmitForApproval.js';
import { useGetRevisionHistory } from '../../hooks/quotes/useGetRevisionHistory.js';
import { useQuotePermissions } from '../../hooks/auth/useQuotePermissions.js';
import {
  QUOTE_EFFORT_LEVELS,
  QUOTE_CONFIDENCE_LEVELS,
  QUOTE_APPROVAL_STATUSES,
} from '../../../shared/constants/lookup-values.js';
import type {
  QuoteEffortLevel,
  QuoteConfidenceLevel,
  QuoteApprovalStatus,
} from '../../../shared/constants/lookup-values.js';
import type { QuoteWithApprovalResponse } from '../../../shared/contracts/quote-contracts.js';
import './AdminQuotePanel.css';

const APPROVAL_STATUS_BADGE: Record<QuoteApprovalStatus, string> = {
  [QUOTE_APPROVAL_STATUSES.PENDING]: 'badge badge-in-progress',
  [QUOTE_APPROVAL_STATUSES.APPROVED]: 'badge badge-resolved',
  [QUOTE_APPROVAL_STATUSES.REJECTED]: 'badge badge-cancelled',
  [QUOTE_APPROVAL_STATUSES.REVISED]: 'badge badge-neutral',
};

const fmt = {
  currency: (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n),
  date: (s: string) =>
    new Date(s).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
};

const EFFORT_OPTIONS: { value: QuoteEffortLevel; label: string }[] = [
  { value: QUOTE_EFFORT_LEVELS.LOW, label: QUOTE_EFFORT_LEVELS.LOW },
  { value: QUOTE_EFFORT_LEVELS.MEDIUM, label: QUOTE_EFFORT_LEVELS.MEDIUM },
  { value: QUOTE_EFFORT_LEVELS.HIGH, label: QUOTE_EFFORT_LEVELS.HIGH },
];

const CONFIDENCE_OPTIONS: { value: QuoteConfidenceLevel; label: string }[] = [
  { value: QUOTE_CONFIDENCE_LEVELS.LOW, label: QUOTE_CONFIDENCE_LEVELS.LOW },
  { value: QUOTE_CONFIDENCE_LEVELS.MEDIUM, label: QUOTE_CONFIDENCE_LEVELS.MEDIUM },
  { value: QUOTE_CONFIDENCE_LEVELS.HIGH, label: QUOTE_CONFIDENCE_LEVELS.HIGH },
];

const AdminQuoteDisplay: React.FC<{ quote: QuoteWithApprovalResponse }> = ({ quote }) => {
  const approvalBadgeClass =
    quote.approvalStatus != null
      ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        (APPROVAL_STATUS_BADGE[quote.approvalStatus] ?? 'badge badge-neutral')
      : 'badge badge-neutral';

  const approvalLabel = quote.approvalStatus ?? 'Not Submitted';

  return (
    <div className="admin-quote-display" data-testid="admin-quote-display">
      <div className="admin-quote-display-header">
        <span className="admin-quote-version-badge">v{quote.version}</span>
        <span className={approvalBadgeClass}>{approvalLabel}</span>
        <span className="badge badge-neutral">{quote.quoteCreator}</span>
      </div>

      <dl className="admin-detail-dl">
        <div className="admin-detail-dl-row">
          <dt>Estimated Cost</dt>
          <dd data-testid="quote-estimated-cost">{fmt.currency(quote.estimatedCost)}</dd>
        </div>
        <div className="admin-detail-dl-row">
          <dt>Fixed Cost</dt>
          <dd data-testid="quote-fixed-cost">{fmt.currency(quote.fixedCost)}</dd>
        </div>
        <div className="admin-detail-dl-row">
          <dt>Final Cost</dt>
          <dd data-testid="quote-final-cost">
            {quote.finalCost != null ? (
              fmt.currency(quote.finalCost)
            ) : (
              <em className="admin-detail-unassigned">Not set</em>
            )}
          </dd>
        </div>

        <div className="admin-detail-dl-row">
          <dt>Estimated Hours</dt>
          <dd data-testid="quote-hours">
            {quote.estimatedHoursMinimum}–{quote.estimatedHoursMaximum} hrs
          </dd>
        </div>
        <div className="admin-detail-dl-row">
          <dt>Est. Resolution Time</dt>
          <dd data-testid="quote-resolution-time">{quote.estimatedResolutionTime} days</dd>
        </div>
        <div className="admin-detail-dl-row">
          <dt>Hourly Rate</dt>
          <dd data-testid="quote-hourly-rate">{fmt.currency(quote.hourlyRate)}/hr</dd>
        </div>

        <div className="admin-detail-dl-row">
          <dt>Effort Level</dt>
          <dd data-testid="quote-effort">{quote.quoteEffortLevel}</dd>
        </div>
        <div className="admin-detail-dl-row">
          <dt>Confidence Level</dt>
          <dd data-testid="quote-confidence">
            {quote.quoteConfidenceLevel ?? <em className="admin-detail-unassigned">Not set</em>}
          </dd>
        </div>
        <div className="admin-detail-dl-row">
          <dt>Suggested Priority</dt>
          <dd data-testid="quote-suggested-priority">{quote.suggestedTicketPriority}</dd>
        </div>

        <div className="admin-detail-dl-row">
          <dt>Created</dt>
          <dd data-testid="quote-created-at">{fmt.date(quote.createdAt)}</dd>
        </div>
        <div className="admin-detail-dl-row">
          <dt>Last Updated</dt>
          <dd data-testid="quote-updated-at">{fmt.date(quote.updatedAt)}</dd>
        </div>
      </dl>
    </div>
  );
};

// ─── Form state ───────────────────────────────────────────────────────────────

interface ManualQuoteFormState {
  estimatedHoursMinimum: string;
  estimatedHoursMaximum: string;
  hourlyRate: string;
  fixedCost: string;
  quoteEffortLevel: QuoteEffortLevel;
  quoteConfidenceLevel: QuoteConfidenceLevel;
}

const INITIAL_MANUAL_FORM: ManualQuoteFormState = {
  estimatedHoursMinimum: '',
  estimatedHoursMaximum: '',
  hourlyRate: '',
  fixedCost: '0',
  quoteEffortLevel: QUOTE_EFFORT_LEVELS.MEDIUM,
  quoteConfidenceLevel: QUOTE_CONFIDENCE_LEVELS.MEDIUM,
};

interface UpdateQuoteFormState {
  estimatedHoursMinimum?: string;
  estimatedHoursMaximum?: string;
  hourlyRate?: string;
  fixedCost?: string;
  quoteEffortLevel?: QuoteEffortLevel;
  quoteConfidenceLevel?: QuoteConfidenceLevel;
}

type ActivePanel = 'none' | 'manual' | 'update' | 'revisions';

// ─── Main component ───────────────────────────────────────────────────────────

interface AdminQuotePanelProps {
  ticketId: string;
  quotes: QuoteWithApprovalResponse[];
  onQuoteMutated: () => void;
}

const AdminQuotePanel: React.FC<AdminQuotePanelProps> = ({ ticketId, quotes, onQuoteMutated }) => {
  const { canCreate, canUpdate } = useQuotePermissions();

  const generate = useGenerateQuote();
  const createManual = useCreateManualQuote();
  const updateQuote = useUpdateQuote();
  const submitForApproval = useSubmitForApproval();
  const revisionHistory = useGetRevisionHistory();

  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [manualForm, setManualForm] = useState<ManualQuoteFormState>(INITIAL_MANUAL_FORM);
  const [updateReason, setUpdateReason] = useState('');
  const [updateForm, setUpdateForm] = useState<UpdateQuoteFormState>({});

  const latestQuote =
    quotes.length > 0 ? quotes.reduce((a, b) => (a.version > b.version ? a : b)) : null;

  const handleGenerate = (): void => {
    void generate.execute(ticketId).then(onQuoteMutated);
  };

  const handleManualFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void createManual
      .execute(ticketId, {
        estimatedHoursMinimum: Number(manualForm.estimatedHoursMinimum),
        estimatedHoursMaximum: Number(manualForm.estimatedHoursMaximum),
        hourlyRate: Number(manualForm.hourlyRate),
        fixedCost: Number(manualForm.fixedCost),
        quoteEffortLevel: manualForm.quoteEffortLevel,
        quoteConfidenceLevel: manualForm.quoteConfidenceLevel,
      })
      .then(() => {
        setManualForm(INITIAL_MANUAL_FORM);
        setActivePanel('none');
        onQuoteMutated();
      });
  };

  const handleUpdateFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!latestQuote || !updateReason.trim()) return;
    void updateQuote
      .execute(ticketId, latestQuote.id, {
        ...(updateForm.estimatedHoursMinimum !== undefined && {
          estimatedHoursMinimum: Number(updateForm.estimatedHoursMinimum),
        }),
        ...(updateForm.estimatedHoursMaximum !== undefined && {
          estimatedHoursMaximum: Number(updateForm.estimatedHoursMaximum),
        }),
        ...(updateForm.hourlyRate !== undefined && {
          hourlyRate: Number(updateForm.hourlyRate),
        }),
        ...(updateForm.fixedCost !== undefined && {
          fixedCost: Number(updateForm.fixedCost),
        }),
        ...(updateForm.quoteEffortLevel !== undefined && {
          quoteEffortLevel: updateForm.quoteEffortLevel,
        }),
        ...(updateForm.quoteConfidenceLevel !== undefined && {
          quoteConfidenceLevel: updateForm.quoteConfidenceLevel,
        }),
        reason: updateReason,
      })
      .then(() => {
        setUpdateForm({});
        setUpdateReason('');
        setActivePanel('none');
        onQuoteMutated();
      });
  };

  const handleSubmitForApproval = (): void => {
    if (!latestQuote) return;
    void submitForApproval.execute(ticketId, latestQuote.id).then(onQuoteMutated);
  };

  const handleShowRevisions = (): void => {
    if (!latestQuote) return;
    setActivePanel('revisions');
    void revisionHistory.execute(ticketId, latestQuote.id);
  };

  const handleTogglePanel = (panel: ActivePanel): void => {
    setActivePanel((prev) => (prev === panel ? 'none' : panel));
  };

  return (
    <section
      className="admin-quote-panel"
      aria-labelledby="admin-quote-heading"
      data-testid="admin-quote-panel"
    >
      <h2 className="admin-detail-section-heading" id="admin-quote-heading">
        Quote Management
      </h2>

      {latestQuote ? (
        <AdminQuoteDisplay quote={latestQuote} />
      ) : (
        <p className="loading-text" data-testid="admin-no-quote">
          No quote has been generated yet.
        </p>
      )}

      <div className="admin-quote-actions" data-testid="admin-quote-actions">
        {canCreate && (
          <>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={generate.loading}
              aria-busy={generate.loading}
              data-testid="generate-quote-btn"
            >
              {generate.loading ? 'Generating...' : 'Auto-Generate Quote'}
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activePanel === 'manual' ? 'btn-ghost' : 'btn-secondary'}`}
              onClick={() => {
                handleTogglePanel('manual');
              }}
              data-testid="toggle-manual-quote-btn"
            >
              {activePanel === 'manual' ? 'Cancel' : 'Create Manual Quote'}
            </button>
          </>
        )}

        {canUpdate && latestQuote && (
          <>
            <button
              type="button"
              className={`btn btn-sm ${activePanel === 'update' ? 'btn-ghost' : 'btn-secondary'}`}
              onClick={() => {
                handleTogglePanel('update');
              }}
              data-testid="toggle-update-quote-btn"
            >
              {activePanel === 'update' ? 'Cancel' : 'Update Quote'}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSubmitForApproval}
              disabled={submitForApproval.loading}
              aria-busy={submitForApproval.loading}
              data-testid="submit-approval-btn"
            >
              {submitForApproval.loading ? 'Submitting...' : 'Submit for Approval'}
            </button>

            <button
              type="button"
              className={`btn btn-sm ${activePanel === 'revisions' ? 'btn-ghost' : 'btn-secondary'}`}
              onClick={handleShowRevisions}
              data-testid="show-revisions-btn"
            >
              Revision History
            </button>
          </>
        )}
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
      {updateQuote.error && (
        <p className="feedback-error" role="alert" data-testid="update-quote-error">
          {updateQuote.error}
        </p>
      )}
      {submitForApproval.error && (
        <p className="feedback-error" role="alert" data-testid="submit-approval-error">
          {submitForApproval.error}
        </p>
      )}

      {/* ── Manual quote form ── */}
      {activePanel === 'manual' && (
        <form
          className="admin-quote-subpanel"
          onSubmit={handleManualSubmit}
          aria-label="Create manual quote"
          data-testid="manual-quote-form"
        >
          <h3 className="admin-quote-subpanel-heading">Create Manual Quote</h3>

          <div className="admin-quote-form-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="mq-hours-min">
                Min Hours
              </label>
              <input
                className="field-input"
                id="mq-hours-min"
                name="estimatedHoursMinimum"
                type="number"
                min={0}
                value={manualForm.estimatedHoursMinimum}
                onChange={handleManualFormChange}
                required
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
                type="number"
                min={0}
                value={manualForm.estimatedHoursMaximum}
                onChange={handleManualFormChange}
                required
                disabled={createManual.loading}
                data-testid="mq-hours-max"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mq-rate">
                Hourly Rate (£)
              </label>
              <input
                className="field-input"
                id="mq-rate"
                name="hourlyRate"
                type="number"
                min={0}
                step="0.01"
                value={manualForm.hourlyRate}
                onChange={handleManualFormChange}
                required
                disabled={createManual.loading}
                data-testid="mq-rate"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="mq-fixed-cost">
                Fixed Cost (£)
              </label>
              <input
                className="field-input"
                id="mq-fixed-cost"
                name="fixedCost"
                type="number"
                min={0}
                step="0.01"
                value={manualForm.fixedCost}
                onChange={handleManualFormChange}
                required
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
                value={manualForm.quoteEffortLevel}
                onChange={handleManualFormChange}
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
                value={manualForm.quoteConfidenceLevel}
                onChange={handleManualFormChange}
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
            className="btn btn-primary btn-sm"
            disabled={createManual.loading}
            aria-busy={createManual.loading}
            data-testid="manual-quote-submit-btn"
          >
            {createManual.loading ? 'Creating...' : 'Create Quote'}
          </button>
        </form>
      )}

      {/* ── Update quote form ── */}
      {activePanel === 'update' && latestQuote && (
        <form
          className="admin-quote-subpanel"
          onSubmit={handleUpdateSubmit}
          aria-label="Update quote"
          data-testid="update-quote-form"
        >
          <h3 className="admin-quote-subpanel-heading">
            Update Quote <span className="admin-quote-version">v{latestQuote.version}</span>
          </h3>
          <p className="admin-quote-subpanel-hint">Only fill in the fields you want to change.</p>

          <div className="admin-quote-form-grid">
            <div className="field-group">
              <label className="field-label" htmlFor="uq-hours-min">
                Min Hours
              </label>
              <input
                className="field-input"
                id="uq-hours-min"
                name="estimatedHoursMinimum"
                type="number"
                min={0}
                value={updateForm.estimatedHoursMinimum ?? ''}
                onChange={handleUpdateFormChange}
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
                type="number"
                min={0}
                value={updateForm.estimatedHoursMaximum ?? ''}
                onChange={handleUpdateFormChange}
                disabled={updateQuote.loading}
                data-testid="uq-hours-max"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="uq-rate">
                Hourly Rate (£)
              </label>
              <input
                className="field-input"
                id="uq-rate"
                name="hourlyRate"
                type="number"
                min={0}
                step="0.01"
                value={updateForm.hourlyRate ?? ''}
                onChange={handleUpdateFormChange}
                disabled={updateQuote.loading}
                data-testid="uq-rate"
              />
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="uq-fixed-cost">
                Fixed Cost (£)
              </label>
              <input
                className="field-input"
                id="uq-fixed-cost"
                name="fixedCost"
                type="number"
                min={0}
                step="0.01"
                value={updateForm.fixedCost ?? ''}
                onChange={handleUpdateFormChange}
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
              value={updateReason}
              onChange={(e) => {
                setUpdateReason(e.target.value);
              }}
              placeholder="Required — describe what changed and why"
              required
              disabled={updateQuote.loading}
              rows={3}
              aria-required="true"
              data-testid="uq-reason"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={updateQuote.loading || !updateReason.trim()}
            aria-busy={updateQuote.loading}
            data-testid="update-quote-submit-btn"
          >
            {updateQuote.loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* ── Revision history ── */}
      {activePanel === 'revisions' && (
        <section
          className="admin-quote-subpanel"
          aria-labelledby="revisions-heading"
          data-testid="revision-history"
        >
          <h3 className="admin-quote-subpanel-heading" id="revisions-heading">
            Revision History
          </h3>

          {revisionHistory.loading && (
            <p className="loading-text" data-testid="revisions-loading">
              Loading revisions...
            </p>
          )}
          {revisionHistory.error && (
            <p className="feedback-error" role="alert" data-testid="revisions-error">
              {revisionHistory.error}
            </p>
          )}
          {!revisionHistory.loading && revisionHistory.data?.revisions.length === 0 && (
            <p className="loading-text" data-testid="revisions-empty">
              No revisions recorded yet.
            </p>
          )}

          {revisionHistory.data && revisionHistory.data.revisions.length > 0 && (
            <ol className="revision-list" role="list" data-testid="revisions-list">
              {revisionHistory.data.revisions.map((rev) => (
                <li
                  key={rev.id}
                  className="revision-item"
                  data-testid={`revision-${String(rev.id)}`}
                >
                  <div className="revision-meta">
                    <span
                      className="revision-field"
                      data-testid={`revision-field-${String(rev.id)}`}
                    >
                      {rev.fieldName}
                    </span>
                    <span className="revision-date" data-testid={`revision-date-${String(rev.id)}`}>
                      {fmt.date(rev.createdAt)}
                    </span>
                    <span className="revision-user" data-testid={`revision-user-${String(rev.id)}`}>
                      {rev.changedByUserId}
                    </span>
                  </div>
                  <div className="revision-diff">
                    <span className="revision-old" data-testid={`revision-old-${String(rev.id)}`}>
                      {rev.oldValue}
                    </span>
                    <span className="revision-arrow" aria-hidden="true">
                      →
                    </span>
                    <span className="revision-new" data-testid={`revision-new-${String(rev.id)}`}>
                      {rev.newValue}
                    </span>
                  </div>
                  <p className="revision-reason" data-testid={`revision-reason-${String(rev.id)}`}>
                    {rev.reason}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </section>
  );
};

export default AdminQuotePanel;
