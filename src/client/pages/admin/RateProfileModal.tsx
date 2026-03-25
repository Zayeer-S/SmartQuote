import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  RateProfileResponse,
  UpdateRateProfileRequest,
} from '../../../shared/contracts/rate-profile-contracts.js';
import './RateProfileModal.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateProfileModalProps {
  mode: 'edit';
  profile: RateProfileResponse;
  onSubmit: (data: UpdateRateProfileRequest) => Promise<boolean>;
  onClose: () => void;
  submitting: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DECIMAL_RE = /^\d*\.?\d{0,2}$/;

function isValidDecimal(val: string): boolean {
  return DECIMAL_RE.test(val) && val !== '' && val !== '.';
}

// ---------------------------------------------------------------------------
// Form state types
// ---------------------------------------------------------------------------

interface EditFormState {
  businessHoursRate: string;
  afterHoursRate: string;
  multiplier: string;
  effectiveFrom: string;
  effectiveTo: string;
}

type FormErrors = Partial<Record<string, string>>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  fieldId: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, fieldId, error, children }: FieldProps) {
  return (
    <div className="rpm-field-group">
      <label className="rpm-label" htmlFor={fieldId}>
        {label}
      </label>
      {children}
      {error && (
        <span className="rpm-field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function RateProfileModal({
  profile,
  onSubmit,
  onClose,
  submitting,
}: RateProfileModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<EditFormState>({
    businessHoursRate: profile.businessHoursRate.toFixed(2),
    afterHoursRate: profile.afterHoursRate.toFixed(2),
    multiplier: profile.multiplier.toFixed(2),
    effectiveFrom: profile.effectiveFrom.slice(0, 10),
    effectiveTo: profile.effectiveTo.slice(0, 10),
  });
  const [touched, setTouched] = useState<Partial<Record<keyof EditFormState, boolean>>>({});
  const [outcome, setOutcome] = useState<{ success: boolean; message: string } | null>(null);

  // Errors are derived -- no setState needed, no useEffect needed
  const errors = useMemo<FormErrors>(() => {
    if (Object.keys(touched).length === 0) return {};
    const all = validateEdit(form);
    const visible: FormErrors = {};
    for (const key of Object.keys(touched)) {
      if (all[key]) visible[key] = all[key];
    }
    return visible;
  }, [form, touched]);

  // Close on overlay click (not modal content click)
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && !submitting) onClose();
  }

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, submitting]);

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

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    // Mark all fields touched so all errors become visible on submit attempt
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true])) as Partial<
      Record<keyof EditFormState, boolean>
    >;
    setTouched(allTouched);

    const validationErrors = validateEdit(form);
    if (Object.keys(validationErrors).length > 0) return;

    const succeeded = await onSubmit({
      businessHoursRate: parseFloat(form.businessHoursRate),
      afterHoursRate: parseFloat(form.afterHoursRate),
      multiplier: parseFloat(form.multiplier),
      effectiveFrom: `${form.effectiveFrom}T00:00:00.000Z`,
      effectiveTo: `${form.effectiveTo}T00:00:00.000Z`,
    });

    setOutcome(
      succeeded
        ? { success: true, message: 'Rate profile updated successfully.' }
        : { success: false, message: 'Failed to update rate profile. Please try again.' }
    );
  }

  return (
    <div
      className="rpm-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rpm-title"
      data-testid="rate-profile-modal"
    >
      <div className="rpm-dialog">
        <div className="rpm-header">
          <h2 className="rpm-title" id="rpm-title">
            Edit Rate Profile
          </h2>
          <button
            type="button"
            className="rpm-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Dismiss"
            data-testid="rpm-close-btn"
          >
            &#x2715;
          </button>
        </div>

        <div className="rpm-body">
          <div className="rpm-read-only-summary">
            <span className="rpm-summary-chip">{profile.ticketType}</span>
            <span className="rpm-summary-chip">{profile.ticketSeverity}</span>
            <span className="rpm-summary-chip">{profile.businessImpact}</span>
          </div>

          <div className="rpm-grid">
            <Field
              label="Business Hours Rate (GBP/hr)"
              fieldId="rpm-bh-rate"
              error={errors.businessHoursRate}
            >
              <input
                className={`rpm-input${errors.businessHoursRate ? ' rpm-input--error' : ''}`}
                id="rpm-bh-rate"
                type="text"
                inputMode="decimal"
                value={form.businessHoursRate}
                onChange={handleDecimalChange('businessHoursRate')}
              />
            </Field>

            <Field
              label="After Hours Rate (GBP/hr)"
              fieldId="rpm-ah-rate"
              error={errors.afterHoursRate}
            >
              <input
                className={`rpm-input${errors.afterHoursRate ? ' rpm-input--error' : ''}`}
                id="rpm-ah-rate"
                type="text"
                inputMode="decimal"
                value={form.afterHoursRate}
                onChange={handleDecimalChange('afterHoursRate')}
              />
            </Field>

            <Field label="Multiplier" fieldId="rpm-multiplier" error={errors.multiplier}>
              <input
                className={`rpm-input${errors.multiplier ? ' rpm-input--error' : ''}`}
                id="rpm-multiplier"
                type="text"
                inputMode="decimal"
                value={form.multiplier}
                onChange={handleDecimalChange('multiplier')}
              />
            </Field>

            <Field label="Effective From" fieldId="rpm-from" error={errors.effectiveFrom}>
              <input
                className={`rpm-input${errors.effectiveFrom ? ' rpm-input--error' : ''}`}
                id="rpm-from"
                type="date"
                value={form.effectiveFrom}
                onChange={handleDateChange('effectiveFrom')}
              />
            </Field>

            <Field label="Effective To" fieldId="rpm-to" error={errors.effectiveTo}>
              <input
                className={`rpm-input${errors.effectiveTo ? ' rpm-input--error' : ''}`}
                id="rpm-to"
                type="date"
                value={form.effectiveTo}
                onChange={handleDateChange('effectiveTo')}
              />
            </Field>
          </div>

          {outcome && (
            <p className={outcome.success ? 'rpm-submit-success' : 'rpm-submit-error'} role="alert">
              {outcome.message}
            </p>
          )}
        </div>

        <div className="rpm-footer">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            {outcome?.success ? 'Close' : 'Cancel'}
          </button>
          {!outcome?.success && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={(e) => void handleSubmit(e)}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
