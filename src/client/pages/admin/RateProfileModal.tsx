import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_BUSINESS_IMPACTS,
  ALL_TICKET_SEVERITIES,
  ALL_TICKET_TYPES,
} from '../../../shared/constants/lookup-values.js';
import type {
  BusinessImpact,
  TicketSeverity,
  TicketType,
} from '../../../shared/constants/lookup-values.js';
import type {
  CreateRateProfileRequest,
  RateProfileResponse,
  UpdateRateProfileRequest,
} from '../../../shared/contracts/rate-profile-contracts.js';
import './RateProfileModal.css';

interface CreateProps {
  mode: 'create';
  profile?: never;
  onSubmit: (data: CreateRateProfileRequest) => Promise<boolean>;
}

interface EditProps {
  mode: 'edit';
  profile: RateProfileResponse;
  onSubmit: (data: UpdateRateProfileRequest) => Promise<boolean>;
}

type RateProfileModalProps = (CreateProps | EditProps) & {
  onClose: () => void;
  submitting: boolean;
};

const DECIMAL_RE = /^\d*\.?\d{0,2}$/;

function isValidDecimal(val: string): boolean {
  return DECIMAL_RE.test(val) && val !== '' && val !== '.';
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const today = toIsoDate(new Date());

interface CreateFormState {
  ticketType: TicketType | '';
  ticketSeverity: TicketSeverity | '';
  businessImpact: BusinessImpact | '';
  businessHoursRate: string;
  afterHoursRate: string;
  multiplier: string;
  effectiveFrom: string;
  effectiveTo: string;
}

interface EditFormState {
  businessHoursRate: string;
  afterHoursRate: string;
  multiplier: string;
  effectiveFrom: string;
  effectiveTo: string;
}

type FormErrors = Partial<Record<string, string>>;

function validateCreate(state: CreateFormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.ticketType) errors.ticketType = 'Required';
  if (!state.ticketSeverity) errors.ticketSeverity = 'Required';
  if (!state.businessImpact) errors.businessImpact = 'Required';
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

interface CreateFormProps {
  onSubmit: (data: CreateRateProfileRequest) => Promise<boolean>;
  onClose: () => void;
  submitting: boolean;
}

function CreateForm({ onSubmit, onClose, submitting }: CreateFormProps) {
  const [form, setForm] = useState<CreateFormState>({
    ticketType: '',
    ticketSeverity: '',
    businessImpact: '',
    businessHoursRate: '',
    afterHoursRate: '',
    multiplier: '',
    effectiveFrom: today,
    effectiveTo: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof CreateFormState, boolean>>>({});
  const [outcome, setOutcome] = useState<{ success: boolean; message: string } | null>(null);

  const errors = useMemo<FormErrors>(() => {
    if (Object.keys(touched).length === 0) return {};
    const all = validateCreate(form);
    const visible: FormErrors = {};
    for (const key of Object.keys(touched)) {
      if (all[key]) visible[key] = all[key];
    }
    return visible;
  }, [form, touched]);

  function handleSelectChange(field: keyof CreateFormState) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
    };
  }

  function handleDecimalChange(field: keyof CreateFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val === '' || DECIMAL_RE.test(val)) {
        setForm((prev) => ({ ...prev, [field]: val }));
      }
      setTouched((prev) => ({ ...prev, [field]: true }));
    };
  }

  function handleDateChange(field: keyof CreateFormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setTouched((prev) => ({ ...prev, [field]: true }));
    };
  }

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(form).map((k) => [k, true])) as Partial<
      Record<keyof CreateFormState, boolean>
    >;
    setTouched(allTouched);

    const validationErrors = validateCreate(form);
    if (Object.keys(validationErrors).length > 0) return;

    const succeeded = await onSubmit({
      ticketType: form.ticketType as TicketType,
      ticketSeverity: form.ticketSeverity as TicketSeverity,
      businessImpact: form.businessImpact as BusinessImpact,
      businessHoursRate: parseFloat(form.businessHoursRate),
      afterHoursRate: parseFloat(form.afterHoursRate),
      multiplier: parseFloat(form.multiplier),
      effectiveFrom: `${form.effectiveFrom}T00:00:00.000Z`,
      effectiveTo: `${form.effectiveTo}T00:00:00.000Z`,
    });

    setOutcome(
      succeeded
        ? { success: true, message: 'Rate profile created successfully.' }
        : { success: false, message: 'Failed to create rate profile. Please try again.' }
    );
  }

  return (
    <>
      <div className="rpm-body">
        <div className="rpm-grid">
          <Field label="Ticket Type" fieldId="rpm-ticket-type" error={errors.ticketType}>
            <select
              className={`rpm-select${errors.ticketType ? ' rpm-input--error' : ''}`}
              id="rpm-ticket-type"
              value={form.ticketType}
              onChange={handleSelectChange('ticketType')}
            >
              <option value="">Select...</option>
              {ALL_TICKET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Severity" fieldId="rpm-severity" error={errors.ticketSeverity}>
            <select
              className={`rpm-select${errors.ticketSeverity ? ' rpm-input--error' : ''}`}
              id="rpm-severity"
              value={form.ticketSeverity}
              onChange={handleSelectChange('ticketSeverity')}
            >
              <option value="">Select...</option>
              {ALL_TICKET_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Business Impact" fieldId="rpm-impact" error={errors.businessImpact}>
            <select
              className={`rpm-select${errors.businessImpact ? ' rpm-input--error' : ''}`}
              id="rpm-impact"
              value={form.businessImpact}
              onChange={handleSelectChange('businessImpact')}
            >
              <option value="">Select...</option>
              {ALL_BUSINESS_IMPACTS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>

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
              placeholder="e.g. 120.00"
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
              placeholder="e.g. 180.00"
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
              placeholder="e.g. 1.50"
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
            {submitting ? 'Creating...' : 'Create Rate Profile'}
          </button>
        )}
      </div>
    </>
  );
}

interface EditFormProps {
  profile: RateProfileResponse;
  onSubmit: (data: UpdateRateProfileRequest) => Promise<boolean>;
  onClose: () => void;
  submitting: boolean;
}

function EditForm({ profile, onSubmit, onClose, submitting }: EditFormProps) {
  const [form, setForm] = useState<EditFormState>({
    businessHoursRate: profile.businessHoursRate.toFixed(2),
    afterHoursRate: profile.afterHoursRate.toFixed(2),
    multiplier: profile.multiplier.toFixed(2),
    effectiveFrom: profile.effectiveFrom.slice(0, 10),
    effectiveTo: profile.effectiveTo.slice(0, 10),
  });
  const [touched, setTouched] = useState<Partial<Record<keyof EditFormState, boolean>>>({});
  const [outcome, setOutcome] = useState<{ success: boolean; message: string } | null>(null);

  const errors = useMemo<FormErrors>(() => {
    if (Object.keys(touched).length === 0) return {};
    const all = validateEdit(form);
    const visible: FormErrors = {};
    for (const key of Object.keys(touched)) {
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

  async function handleSubmit(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
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
    <>
      <div className="rpm-body">
        <div className="rpm-read-only-summary">
          <span className="rpm-summary-chip">{profile.ticketType}</span>
          <span className="rpm-summary-chip">{profile.ticketSeverity}</span>
          <span className="rpm-summary-chip">{profile.businessImpact}</span>
        </div>

        <div className="rpm-grid">
          <Field
            label="Business Hours Rate (GBP/hr)"
            fieldId="rpm-edit-bh-rate"
            error={errors.businessHoursRate}
          >
            <input
              className={`rpm-input${errors.businessHoursRate ? ' rpm-input--error' : ''}`}
              id="rpm-edit-bh-rate"
              type="text"
              inputMode="decimal"
              value={form.businessHoursRate}
              onChange={handleDecimalChange('businessHoursRate')}
            />
          </Field>

          <Field
            label="After Hours Rate (GBP/hr)"
            fieldId="rpm-edit-ah-rate"
            error={errors.afterHoursRate}
          >
            <input
              className={`rpm-input${errors.afterHoursRate ? ' rpm-input--error' : ''}`}
              id="rpm-edit-ah-rate"
              type="text"
              inputMode="decimal"
              value={form.afterHoursRate}
              onChange={handleDecimalChange('afterHoursRate')}
            />
          </Field>

          <Field label="Multiplier" fieldId="rpm-edit-multiplier" error={errors.multiplier}>
            <input
              className={`rpm-input${errors.multiplier ? ' rpm-input--error' : ''}`}
              id="rpm-edit-multiplier"
              type="text"
              inputMode="decimal"
              value={form.multiplier}
              onChange={handleDecimalChange('multiplier')}
            />
          </Field>

          <Field label="Effective From" fieldId="rpm-edit-from" error={errors.effectiveFrom}>
            <input
              className={`rpm-input${errors.effectiveFrom ? ' rpm-input--error' : ''}`}
              id="rpm-edit-from"
              type="date"
              value={form.effectiveFrom}
              onChange={handleDateChange('effectiveFrom')}
            />
          </Field>

          <Field label="Effective To" fieldId="rpm-edit-to" error={errors.effectiveTo}>
            <input
              className={`rpm-input${errors.effectiveTo ? ' rpm-input--error' : ''}`}
              id="rpm-edit-to"
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
    </>
  );
}

export function RateProfileModal(props: RateProfileModalProps) {
  const { onClose, submitting } = props;
  const overlayRef = useRef<HTMLDivElement>(null);

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && !submitting) {
      onClose();
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, submitting]);

  const title = props.mode === 'create' ? 'Add Rate Profile' : 'Edit Rate Profile';

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
            {title}
          </h2>
          <button
            type="button"
            className="rpm-close-btn"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            data-testid="rpm-close-btn"
          >
            &#x2715;
          </button>
        </div>

        {props.mode === 'create' ? (
          <CreateForm onSubmit={props.onSubmit} onClose={onClose} submitting={submitting} />
        ) : (
          <EditForm
            profile={props.profile}
            onSubmit={props.onSubmit}
            onClose={onClose}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
}
