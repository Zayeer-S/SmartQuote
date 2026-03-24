import React, { useState } from 'react';
import { useGenerateQuote } from '../../hooks/quotes/useGenerateQuote';
import { useCreateManualQuote } from '../../hooks/quotes/useCreateManualQuote';
import { useUpdateQuote } from '../../hooks/quotes/useUpdateQuote';
import { useSubmitForApproval } from '../../hooks/quotes/useSubmitForApproval';
import { useGetRevisionHistory } from '../../hooks/quotes/useGetRevisionHistory';
import { useQuotePermissions } from '../../hooks/auth/useQuotePermissions';
import {
  LOOKUP_IDS,
  QUOTE_EFFORT_LEVELS,
  QUOTE_CONFIDENCE_LEVELS,
  QUOTE_CREATORS,
  TICKET_PRIORITIES,
  QUOTE_APPROVAL_STATUSES,
} from '../../../shared/constants/lookup-values';
import type { QuoteResponse } from '../../../shared/contracts/quote-contracts';

const EFFORT_LABEL: Record<number, string> = {
  [LOOKUP_IDS.QUOTE_EFFORT_LEVEL.LOW]: QUOTE_EFFORT_LEVELS.LOW,
  [LOOKUP_IDS.QUOTE_EFFORT_LEVEL.MEDIUM]: QUOTE_EFFORT_LEVELS.MEDIUM,
  [LOOKUP_IDS.QUOTE_EFFORT_LEVEL.HIGH]: QUOTE_EFFORT_LEVELS.HIGH,
};

const CONFIDENCE_LABEL: Record<number, string> = {
  [LOOKUP_IDS.QUOTE_CONFIDENCE_LEVEL.LOW]: QUOTE_CONFIDENCE_LEVELS.LOW,
  [LOOKUP_IDS.QUOTE_CONFIDENCE_LEVEL.MEDIUM]: QUOTE_CONFIDENCE_LEVELS.MEDIUM,
  [LOOKUP_IDS.QUOTE_CONFIDENCE_LEVEL.HIGH]: QUOTE_CONFIDENCE_LEVELS.HIGH,
};

const CREATOR_LABEL: Record<number, string> = {
  [LOOKUP_IDS.QUOTE_CREATOR.MANUAL]: QUOTE_CREATORS.MANUAL,
  [LOOKUP_IDS.QUOTE_CREATOR.AUTOMATED]: QUOTE_CREATORS.AUTOMATED,
};

const PRIORITY_LABEL: Record<number, string> = {
  [LOOKUP_IDS.TICKET_PRIORITY.P1]: TICKET_PRIORITIES.P1,
  [LOOKUP_IDS.TICKET_PRIORITY.P2]: TICKET_PRIORITIES.P2,
  [LOOKUP_IDS.TICKET_PRIORITY.P3]: TICKET_PRIORITIES.P3,
  [LOOKUP_IDS.TICKET_PRIORITY.P4]: TICKET_PRIORITIES.P4,
};

const APPROVAL_STATUS_LABEL: Record<number, string> = {
  [LOOKUP_IDS.QUOTE_APPROVAL_STATUS.PENDING]: QUOTE_APPROVAL_STATUSES.PENDING,
  [LOOKUP_IDS.QUOTE_APPROVAL_STATUS.APPROVED]: QUOTE_APPROVAL_STATUSES.APPROVED,
  [LOOKUP_IDS.QUOTE_APPROVAL_STATUS.REJECTED]: QUOTE_APPROVAL_STATUSES.REJECTED,
};

const APPROVAL_STATUS_BADGE: Record<number, string> = {
  [LOOKUP_IDS.QUOTE_APPROVAL_STATUS.PENDING]: 'badge badge-in-progress',
  [LOOKUP_IDS.QUOTE_APPROVAL_STATUS.APPROVED]: 'badge badge-resolved',
  [LOOKUP_IDS.QUOTE_APPROVAL_STATUS.REJECTED]: 'badge badge-cancelled',
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

/* ─── Inline admin quote display — shows every field ─── */

const AdminQuoteDisplay: React.FC<{ quote: QuoteResponse }> = ({ quote }) => (
  <div className="admin-quote-display" data-testid="admin-quote-display">
    <div className="admin-quote-display-header">
      <span className="admin-quote-version-badge">v{quote.version}</span>
      <span className={APPROVAL_STATUS_BADGE[quote.quoteApprovalId ?? 0] ?? 'badge badge-neutral'}>
        {quote.quoteApprovalId != null
          ? (APPROVAL_STATUS_LABEL[quote.quoteApprovalId] ?? 'Unknown')
          : 'Not Submitted'}
      </span>
      <span className="badge badge-neutral">
        {CREATOR_LABEL[quote.quoteCreatorId] ?? 'Unknown'}
      </span>
    </div>

    <dl className="admin-detail-dl">
      {/* ── Costs ── */}
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

      {/* ── Hours & time ── */}
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

      {/* ── Classification ── */}
      <div className="admin-detail-dl-row">
        <dt>Effort Level</dt>
        <dd data-testid="quote-effort">{EFFORT_LABEL[quote.quoteEffortLevelId] ?? '—'}</dd>
      </div>
      <div className="admin-detail-dl-row">
        <dt>Confidence Level</dt>
        <dd data-testid="quote-confidence">
          {quote.quoteConfidenceLevelId != null ? (
            (CONFIDENCE_LABEL[quote.quoteConfidenceLevelId] ?? '—')
          ) : (
            <em className="admin-detail-unassigned">Not set</em>
          )}
        </dd>
      </div>
      <div className="admin-detail-dl-row">
        <dt>Suggested Priority</dt>
        <dd data-testid="quote-suggested-priority">
          {PRIORITY_LABEL[quote.suggestedTicketPriorityId] ?? '—'}
        </dd>
      </div>

      {/* ── Timestamps ── */}
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
import './AdminQuotePanel.css';

interface AdminQuotePanelProps {
  ticketId: string;
  quotes: QuoteResponse[];
  onQuoteMutated: () => void;
}

const EFFORT_OPTIONS = [
  { id: LOOKUP_IDS.QUOTE_EFFORT_LEVEL.LOW, label: QUOTE_EFFORT_LEVELS.LOW },
  { id: LOOKUP_IDS.QUOTE_EFFORT_LEVEL.MEDIUM, label: QUOTE_EFFORT_LEVELS.MEDIUM },
  { id: LOOKUP_IDS.QUOTE_EFFORT_LEVEL.HIGH, label: QUOTE_EFFORT_LEVELS.HIGH },
] as const;

const CONFIDENCE_OPTIONS = [
  { id: LOOKUP_IDS.QUOTE_CONFIDENCE_LEVEL.LOW, label: QUOTE_CONFIDENCE_LEVELS.LOW },
  { id: LOOKUP_IDS.QUOTE_CONFIDENCE_LEVEL.MEDIUM, label: QUOTE_CONFIDENCE_LEVELS.MEDIUM },
  { id: LOOKUP_IDS.QUOTE_CONFIDENCE_LEVEL.HIGH, label: QUOTE_CONFIDENCE_LEVELS.HIGH },
] as const;

interface ManualQuoteFormState {
  estimatedHoursMinimum: string;
  estimatedHoursMaximum: string;
  hourlyRate: string;
  fixedCost: string;
  quoteEffortLevelId: number;
  quoteConfidenceLevelId: number;
}

const INITIAL_MANUAL_FORM: ManualQuoteFormState = {
  estimatedHoursMinimum: '',
  estimatedHoursMaximum: '',
  hourlyRate: '',
  fixedCost: '0',
  quoteEffortLevelId: LOOKUP_IDS.QUOTE_EFFORT_LEVEL.MEDIUM,
  quoteConfidenceLevelId: LOOKUP_IDS.QUOTE_CONFIDENCE_LEVEL.MEDIUM,
};

type ActivePanel = 'none' | 'manual' | 'update' | 'revisions';

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
  const [updateForm, setUpdateForm] = useState<Partial<ManualQuoteFormState>>({});

  const latestQuote =
    quotes.length > 0 ? quotes.reduce((a, b) => (a.version > b.version ? a : b)) : null;

  const handleGenerate = (): void => {
    void generate.execute(ticketId).then(onQuoteMutated);
  };

  const handleManualFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    // ID fields come back from <select> as strings — coerce them immediately
    const isIdField = name === 'quoteEffortLevelId' || name === 'quoteConfidenceLevelId';
    setManualForm((prev) => ({ ...prev, [name]: isIdField ? Number(value) : value }));
  };

  const handleManualSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void createManual
      .execute(ticketId, {
        estimatedHoursMinimum: Number(manualForm.estimatedHoursMinimum),
        estimatedHoursMaximum: Number(manualForm.estimatedHoursMaximum),
        hourlyRate: Number(manualForm.hourlyRate),
        fixedCost: Number(manualForm.fixedCost),
        quoteEffortLevelId: manualForm.quoteEffortLevelId,
        quoteConfidenceLevelId: manualForm.quoteConfidenceLevelId,
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
        ...(updateForm.quoteEffortLevelId !== undefined && {
          quoteEffortLevelId: updateForm.quoteEffortLevelId,
        }),
        ...(updateForm.quoteConfidenceLevelId !== undefined && {
          quoteConfidenceLevelId: updateForm.quoteConfidenceLevelId,
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

      {/* ── Existing quote display ── */}
      {latestQuote ? (
        <AdminQuoteDisplay quote={latestQuote} />
      ) : (
        <p className="loading-text" data-testid="admin-no-quote">
          No quote has been generated yet.
        </p>
      )}

      {/* ── Primary actions ── */}
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

      {/* ── Error states ── */}
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
                name="quoteEffortLevelId"
                value={manualForm.quoteEffortLevelId}
                onChange={handleManualFormChange}
                disabled={createManual.loading}
                data-testid="mq-effort"
              >
                {EFFORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
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
                name="quoteConfidenceLevelId"
                value={manualForm.quoteConfidenceLevelId}
                onChange={handleManualFormChange}
                disabled={createManual.loading}
                data-testid="mq-confidence"
              >
                {CONFIDENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
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
              {revisionHistory.data.revisions.map((rev) => {
                const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
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
                      <span
                        className="revision-date"
                        data-testid={`revision-date-${String(rev.id)}`}
                      >
                        {formattedDate}
                      </span>
                      <span
                        className="revision-user"
                        data-testid={`revision-user-${String(rev.id)}`}
                      >
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
                    <p
                      className="revision-reason"
                      data-testid={`revision-reason-${String(rev.id)}`}
                    >
                      {rev.reason}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}
    </section>
  );
};

export default AdminQuotePanel;
