import React, { useEffect, useMemo, useState } from 'react';

import { useListRateProfiles } from '../../../hooks/rate-profiles/useListRateProfiles.js';
import { useUpdateRateProfile } from '../../../hooks/rate-profiles/useUpdateRateProfile.js';
import './AdminRateProfilesPage.css';
import {
  RateProfileResponse,
  UpdateRateProfileRequest,
} from '../../../../shared/contracts/rate-profile-contracts.js';

const RATE_PROFILE_COLUMNS = [
  'Ticket Type',
  'Severity',
  'Business Impact',
  'Business Hours (GBP/hr)',
  'After Hours (GBP/hr)',
  'Multiplier',
  'Effective From',
  'Effective To',
  '', // actions column
] as const;

const COL_SPAN = RATE_PROFILE_COLUMNS.length;

const DECIMAL_RE = /^\d*\.?\d{0,2}$/;

// ------------------------------------------------------------------
// Validation
// ------------------------------------------------------------------

interface EditFormState {
  businessHoursRate: string;
  afterHoursRate: string;
  multiplier: string;
  effectiveFrom: string;
  effectiveTo: string;
}

type FormErrors = Partial<Record<keyof EditFormState, string>>;

function isValidDecimal(val: string): boolean {
  return DECIMAL_RE.test(val) && val !== '' && val !== '.';
}

function validateEdit(state: EditFormState): FormErrors {
  const errors: FormErrors = {};
  if (!isValidDecimal(state.businessHoursRate)) errors.businessHoursRate = 'Enter a valid amount';
  if (!isValidDecimal(state.afterHoursRate)) errors.afterHoursRate = 'Enter a valid amount';
  if (!isValidDecimal(state.multiplier)) errors.multiplier = 'Enter a valid multiplier';
  if (!state.effectiveFrom) errors.effectiveFrom = 'Required';
  if (!state.effectiveTo) errors.effectiveTo = 'Required';
  if (state.effectiveFrom && state.effectiveTo && state.effectiveTo <= state.effectiveFrom) {
    errors.effectiveTo = 'Must be after effective from date';
  }
  return errors;
}

function initFormState(profile: RateProfileResponse): EditFormState {
  return {
    businessHoursRate: profile.businessHoursRate.toFixed(2),
    afterHoursRate: profile.afterHoursRate.toFixed(2),
    multiplier: profile.multiplier.toFixed(2),
    effectiveFrom: profile.effectiveFrom.slice(0, 10),
    effectiveTo: profile.effectiveTo.slice(0, 10),
  };
}

// ------------------------------------------------------------------
// Inline edit row
// ------------------------------------------------------------------

interface InlineEditRowProps {
  profile: RateProfileResponse;
  onSave: (id: number, data: UpdateRateProfileRequest) => Promise<boolean>;
  onCancel: () => void;
  submitting: boolean;
}

const InlineEditRow: React.FC<InlineEditRowProps> = ({ profile, onSave, onCancel, submitting }) => {
  const [form, setForm] = useState<EditFormState>(() => initFormState(profile));
  const [touched, setTouched] = useState<Partial<Record<keyof EditFormState, boolean>>>({});
  const [outcome, setOutcome] = useState<'success' | 'error' | null>(null);

  const errors = useMemo<FormErrors>(() => {
    if (Object.keys(touched).length === 0) return {};
    const all = validateEdit(form);
    const visible: FormErrors = {};
    for (const key of Object.keys(touched) as (keyof EditFormState)[]) {
      if (all[key]) visible[key] = all[key];
    }
    return visible;
  }, [form, touched]);

  function handleDecimalChange(field: keyof EditFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || DECIMAL_RE.test(val)) {
        setForm((prev) => ({ ...prev, [field]: val }));
      }
      setTouched((prev) => ({ ...prev, [field]: true }));
    };
  }

  function handleDateChange(field: keyof EditFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
    };
  }

  async function handleSave(): Promise<void> {
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true])) as Partial<
      Record<keyof EditFormState, boolean>
    >;
    setTouched(allTouched);

    if (Object.keys(validateEdit(form)).length > 0) return;

    const succeeded = await onSave(profile.id, {
      businessHoursRate: parseFloat(form.businessHoursRate),
      afterHoursRate: parseFloat(form.afterHoursRate),
      multiplier: parseFloat(form.multiplier),
      effectiveFrom: `${form.effectiveFrom}T00:00:00.000Z`,
      effectiveTo: `${form.effectiveTo}T00:00:00.000Z`,
    });

    setOutcome(succeeded ? 'success' : 'error');
    if (succeeded) onCancel();
  }

  return (
    <tr
      className="rate-profile-inline-edit-row"
      data-testid={`rate-profile-edit-row-${String(profile.id)}`}
    >
      <td colSpan={COL_SPAN}>
        <div className="rate-profile-inline-edit">
          <div className="rate-profile-inline-edit-chips">
            <span className="rate-profile-chip">{profile.ticketType}</span>
            <span className="rate-profile-chip">{profile.ticketSeverity}</span>
            <span className="rate-profile-chip">{profile.businessImpact}</span>
          </div>

          <div className="rate-profile-inline-edit-fields">
            <div className="field-group">
              <label className="field-label" htmlFor={`rp-bh-${String(profile.id)}`}>
                Business Hours (GBP/hr)
              </label>
              <input
                className={`field-input rate-profile-edit-input${errors.businessHoursRate ? ' field-input--error' : ''}`}
                id={`rp-bh-${String(profile.id)}`}
                type="text"
                inputMode="decimal"
                value={form.businessHoursRate}
                onChange={handleDecimalChange('businessHoursRate')}
                disabled={submitting}
              />
              {errors.businessHoursRate && (
                <span className="field-hint rate-profile-field-error" role="alert">
                  {errors.businessHoursRate}
                </span>
              )}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor={`rp-ah-${String(profile.id)}`}>
                After Hours (GBP/hr)
              </label>
              <input
                className={`field-input rate-profile-edit-input${errors.afterHoursRate ? ' field-input--error' : ''}`}
                id={`rp-ah-${String(profile.id)}`}
                type="text"
                inputMode="decimal"
                value={form.afterHoursRate}
                onChange={handleDecimalChange('afterHoursRate')}
                disabled={submitting}
              />
              {errors.afterHoursRate && (
                <span className="field-hint rate-profile-field-error" role="alert">
                  {errors.afterHoursRate}
                </span>
              )}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor={`rp-mult-${String(profile.id)}`}>
                Multiplier
              </label>
              <input
                className={`field-input rate-profile-edit-input${errors.multiplier ? ' field-input--error' : ''}`}
                id={`rp-mult-${String(profile.id)}`}
                type="text"
                inputMode="decimal"
                value={form.multiplier}
                onChange={handleDecimalChange('multiplier')}
                disabled={submitting}
              />
              {errors.multiplier && (
                <span className="field-hint rate-profile-field-error" role="alert">
                  {errors.multiplier}
                </span>
              )}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor={`rp-from-${String(profile.id)}`}>
                Effective From
              </label>
              <input
                className={`field-input rate-profile-edit-input${errors.effectiveFrom ? ' field-input--error' : ''}`}
                id={`rp-from-${String(profile.id)}`}
                type="date"
                value={form.effectiveFrom}
                onChange={handleDateChange('effectiveFrom')}
                disabled={submitting}
              />
              {errors.effectiveFrom && (
                <span className="field-hint rate-profile-field-error" role="alert">
                  {errors.effectiveFrom}
                </span>
              )}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor={`rp-to-${String(profile.id)}`}>
                Effective To
              </label>
              <input
                className={`field-input rate-profile-edit-input${errors.effectiveTo ? ' field-input--error' : ''}`}
                id={`rp-to-${String(profile.id)}`}
                type="date"
                value={form.effectiveTo}
                onChange={handleDateChange('effectiveTo')}
                disabled={submitting}
              />
              {errors.effectiveTo && (
                <span className="field-hint rate-profile-field-error" role="alert">
                  {errors.effectiveTo}
                </span>
              )}
            </div>
          </div>

          {outcome === 'error' && (
            <p className="feedback-error" role="alert">
              Failed to update rate profile. Please try again.
            </p>
          )}

          <div className="rate-profile-inline-edit-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void handleSave()}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------

const AdminRateProfilesPage: React.FC = () => {
  const { data, loading, error, execute: fetchRateProfiles } = useListRateProfiles();
  const { execute: updateRateProfile, loading: updating } = useUpdateRateProfile();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    void fetchRateProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rateProfiles = data?.rateProfiles ?? [];

  async function handleSave(id: number, data: UpdateRateProfileRequest): Promise<boolean> {
    const succeeded = await updateRateProfile(id, data);
    if (succeeded) {
      await fetchRateProfiles();
      setExpandedId(null);
    }
    return succeeded;
  }

  return (
    <div className="admin-page" data-testid="admin-rate-profiles-page">
      <div className="page-header">
        <h1 className="page-title">Rate Profiles</h1>
      </div>
      <p className="admin-page-description">
        Define hourly rates by ticket type and severity. Business hours and after-hours rates can be
        set independently. Click a row to edit its rates.
      </p>

      <div className="card">
        <table className="admin-table" aria-label="Rate profiles" data-testid="rate-profiles-table">
          <thead>
            <tr>
              {RATE_PROFILE_COLUMNS.map((col, i) => (
                <th key={i} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr data-testid="rate-profiles-loading-row">
                <td colSpan={COL_SPAN}>
                  <div className="empty-state">
                    <p className="loading-text">Loading rate profiles...</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr data-testid="rate-profiles-error-row">
                <td colSpan={COL_SPAN}>
                  <p className="feedback-error" role="alert">
                    Failed to load rate profiles: {error}
                  </p>
                </td>
              </tr>
            )}

            {!loading && !error && rateProfiles.length === 0 && (
              <tr data-testid="rate-profiles-empty-row">
                <td colSpan={COL_SPAN}>
                  <div className="empty-state">
                    <p className="empty-state-message">No rate profiles configured.</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              rateProfiles.map((profile) => (
                <React.Fragment key={profile.id}>
                  <tr
                    className={[
                      'rate-profile-row',
                      expandedId === profile.id ? 'rate-profile-row--expanded' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    data-testid={`rate-row-${String(profile.id)}`}
                    onClick={() => {
                      setExpandedId((prev) => (prev === profile.id ? null : profile.id));
                    }}
                    style={{ opacity: profile.isActive ? 1 : 0.5 }}
                    aria-expanded={expandedId === profile.id}
                  >
                    <td data-testid={`rate-type-${String(profile.id)}`}>{profile.ticketType}</td>
                    <td data-testid={`rate-severity-${String(profile.id)}`}>
                      {profile.ticketSeverity}
                    </td>
                    <td data-testid={`rate-impact-${String(profile.id)}`}>
                      {profile.businessImpact}
                    </td>
                    <td data-testid={`rate-business-${String(profile.id)}`}>
                      {profile.businessHoursRate.toFixed(2)}
                    </td>
                    <td data-testid={`rate-afterhours-${String(profile.id)}`}>
                      {profile.afterHoursRate.toFixed(2)}
                    </td>
                    <td data-testid={`rate-multiplier-${String(profile.id)}`}>
                      {profile.multiplier.toFixed(2)}x
                    </td>
                    <td>{profile.effectiveFrom.slice(0, 10)}</td>
                    <td>{profile.effectiveTo.slice(0, 10)}</td>
                    <td className="rate-profile-row-action-cell">
                      <span className="rate-profile-row-edit-hint">
                        {expandedId === profile.id ? 'Close' : 'Edit'}
                      </span>
                    </td>
                  </tr>

                  {expandedId === profile.id && (
                    <InlineEditRow
                      profile={profile}
                      onSave={handleSave}
                      onCancel={() => {
                        setExpandedId(null);
                      }}
                      submitting={updating}
                    />
                  )}
                </React.Fragment>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRateProfilesPage;
