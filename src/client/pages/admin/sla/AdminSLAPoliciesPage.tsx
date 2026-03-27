import React, { useEffect, useState } from 'react';
import { TICKET_SEVERITIES } from '../../../../shared/constants/lookup-values.js';
import type { OrgResponse } from '../../../../shared/contracts/org-contracts.js';
import type { UserListItem } from '../../../../shared/contracts/user-contracts.js';
import { useListSlaPolicies } from '../../../hooks/sla/useListSlaPolicy.js';
import { useCreateSlaPolicy } from '../../../hooks/sla/useCreateSlaPolicy.js';
import { useUpdateSlaPolicy } from '../../../hooks/sla/useUpdateSlaPolicy.js';
import { useDeleteSlaPolicy } from '../../../hooks/sla/useDeleteSlaPolicy.js';
import './AdminSLAPoliciesPage.css';
import { useSlaScopeOptions } from '../../../hooks/sla/useSlaScopeOptions.js';
import {
  SlaPolicyResponse,
  SlaSeverityTarget,
} from '../../../../shared/contracts/sla-contracts.js';

const ALL_SEVERITIES = [
  TICKET_SEVERITIES.CRITICAL,
  TICKET_SEVERITIES.HIGH,
  TICKET_SEVERITIES.MEDIUM,
  TICKET_SEVERITIES.LOW,
] as const;

interface SeverityTargetDraft {
  severity: string;
  responseTimeHours: string;
  resolutionTimeHours: string;
}

interface PolicyFormState {
  name: string;
  scopeType: 'org' | 'user';
  scopeId: string; // org UUID or user UUID -- resolved from dropdown selection
  effectiveFrom: string;
  effectiveTo: string;
  severityTargets: SeverityTargetDraft[];
}

function buildDefaultTargets(): SeverityTargetDraft[] {
  return ALL_SEVERITIES.map((severity) => ({
    severity,
    responseTimeHours: '',
    resolutionTimeHours: '',
  }));
}

function buildDefaultForm(): PolicyFormState {
  return {
    name: '',
    scopeType: 'org',
    scopeId: '',
    effectiveFrom: '',
    effectiveTo: '',
    severityTargets: buildDefaultTargets(),
  };
}

function validateForm(form: PolicyFormState): string | null {
  if (!form.name.trim()) return 'Name is required.';
  if (!form.scopeId)
    return `Please select ${form.scopeType === 'org' ? 'an organization' : 'a user'}.`;
  if (!form.effectiveFrom) return 'Effective from date is required.';
  if (!form.effectiveTo) return 'Effective to date is required.';
  if (new Date(form.effectiveTo) < new Date(form.effectiveFrom)) {
    return 'Effective to must be on or after effective from.';
  }
  for (const target of form.severityTargets) {
    const response = Number(target.responseTimeHours);
    const resolution = Number(target.resolutionTimeHours);
    if (!target.responseTimeHours || isNaN(response) || response <= 0) {
      return `Response time for ${target.severity} must be a positive number.`;
    }
    if (!target.resolutionTimeHours || isNaN(resolution) || resolution <= 0) {
      return `Resolution time for ${target.severity} must be a positive number.`;
    }
    if (resolution < response) {
      return `Resolution time for ${target.severity} must be >= response time.`;
    }
  }
  return null;
}

function buildSeverityTargets(drafts: SeverityTargetDraft[]): SlaSeverityTarget[] {
  return drafts.map((d) => ({
    severity: d.severity as SlaSeverityTarget['severity'],
    responseTimeHours: Number(d.responseTimeHours),
    resolutionTimeHours: Number(d.resolutionTimeHours),
  }));
}

interface CreateModalProps {
  orgs: OrgResponse[];
  customerUsers: UserListItem[];
  loadingScopes: boolean;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (form: PolicyFormState) => void;
  onClose: () => void;
}

function CreateModal({
  orgs,
  customerUsers,
  loadingScopes,
  submitting,
  submitError,
  onSubmit,
  onClose,
}: CreateModalProps): React.ReactElement {
  const [form, setForm] = useState(buildDefaultForm());
  const [validationError, setValidationError] = useState<string | null>(null);

  function setField<K extends keyof PolicyFormState>(key: K, value: PolicyFormState[K]): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleScopeTypeChange(scopeType: 'org' | 'user'): void {
    // Reset scopeId when switching scope type to avoid stale selection
    setForm((prev) => ({ ...prev, scopeType, scopeId: '' }));
  }

  function setTargetField(
    index: number,
    key: 'responseTimeHours' | 'resolutionTimeHours',
    value: string
  ): void {
    setForm((prev) => {
      const updated = [...prev.severityTargets];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, severityTargets: updated };
    });
  }

  function handleSubmit(): void {
    const err = validateForm(form);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    onSubmit(form);
  }

  const displayError = validationError ?? submitError;

  return (
    <div className="sla-modal-overlay" role="dialog" aria-modal="true">
      <div className="sla-modal">
        <h2 className="sla-modal-title">Add SLA Policy</h2>

        <div className="sla-form-field">
          <label htmlFor="sla-name">Name</label>
          <input
            id="sla-name"
            type="text"
            value={form.name}
            onChange={(e) => {
              setField('name', e.target.value);
            }}
            placeholder="e.g. Enterprise SLA"
            data-testid="sla-form-name"
          />
        </div>

        <div className="sla-form-field">
          <label htmlFor="sla-scope-type">Scope</label>
          <select
            id="sla-scope-type"
            value={form.scopeType}
            onChange={(e) => {
              handleScopeTypeChange(e.target.value as 'org' | 'user');
            }}
            data-testid="sla-form-scope-type"
          >
            <option value="org">Organization</option>
            <option value="user">Individual Customer</option>
          </select>
        </div>

        <div className="sla-form-field">
          {form.scopeType === 'org' ? (
            <>
              <label htmlFor="sla-scope-id">Organization</label>
              <select
                id="sla-scope-id"
                value={form.scopeId}
                onChange={(e) => {
                  setField('scopeId', e.target.value);
                }}
                disabled={loadingScopes}
                data-testid="sla-form-scope-select"
              >
                <option value="">
                  {loadingScopes ? 'Loading...' : '-- Select organization --'}
                </option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <>
              <label htmlFor="sla-scope-id">Customer</label>
              <select
                id="sla-scope-id"
                value={form.scopeId}
                onChange={(e) => {
                  setField('scopeId', e.target.value);
                }}
                disabled={loadingScopes}
                data-testid="sla-form-scope-select"
              >
                <option value="">{loadingScopes ? 'Loading...' : '-- Select customer --'}</option>
                {customerUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="sla-form-field">
          <label htmlFor="sla-effective-from">Effective From</label>
          <input
            id="sla-effective-from"
            type="datetime-local"
            value={form.effectiveFrom}
            onChange={(e) => {
              setField('effectiveFrom', e.target.value);
            }}
            data-testid="sla-form-effective-from"
          />
        </div>

        <div className="sla-form-field">
          <label htmlFor="sla-effective-to">Effective To</label>
          <input
            id="sla-effective-to"
            type="datetime-local"
            value={form.effectiveTo}
            onChange={(e) => {
              setField('effectiveTo', e.target.value);
            }}
            data-testid="sla-form-effective-to"
          />
        </div>

        <p className="sla-severity-targets-label">Severity Targets</p>
        <div className="sla-severity-targets-grid">
          <span className="sla-severity-targets-grid-header">Severity</span>
          <span className="sla-severity-targets-grid-header">Response (hrs)</span>
          <span className="sla-severity-targets-grid-header">Resolution (hrs)</span>

          {form.severityTargets.map((target, i) => (
            <React.Fragment key={target.severity}>
              <span className="sla-severity-label">{target.severity}</span>
              <input
                type="text"
                inputMode="numeric"
                value={target.responseTimeHours}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) {
                    setTargetField(i, 'responseTimeHours', e.target.value);
                  }
                }}
                data-testid={`sla-form-response-${target.severity.toLowerCase()}`}
              />
              <input
                type="text"
                inputMode="numeric"
                value={target.resolutionTimeHours}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) {
                    setTargetField(i, 'resolutionTimeHours', e.target.value);
                  }
                }}
                data-testid={`sla-form-resolution-${target.severity.toLowerCase()}`}
              />
            </React.Fragment>
          ))}
        </div>

        {displayError && (
          <p className="sla-modal-error" role="alert" data-testid="sla-form-error">
            {displayError}
          </p>
        )}

        <div className="sla-modal-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={submitting}
            data-testid="sla-form-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting || loadingScopes}
            data-testid="sla-form-submit"
          >
            {submitting ? 'Saving...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditModalProps {
  policy: SlaPolicyResponse;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (data: {
    name: string;
    effectiveFrom: string;
    effectiveTo: string;
    severityTargets: SeverityTargetDraft[];
  }) => void;
  onClose: () => void;
}

function EditModal({
  policy,
  submitting,
  submitError,
  onSubmit,
  onClose,
}: EditModalProps): React.ReactElement {
  const existingTargets = policy.contract.severityTargets;

  const [name, setName] = useState(policy.name);
  const [effectiveFrom, setEffectiveFrom] = useState(policy.effectiveFrom.slice(0, 16));
  const [effectiveTo, setEffectiveTo] = useState(policy.effectiveTo.slice(0, 16));
  const [severityTargets, setSeverityTargets] = useState<SeverityTargetDraft[]>(
    ALL_SEVERITIES.map((severity) => {
      const match = existingTargets.find((t) => t.severity === severity);
      return {
        severity,
        responseTimeHours: match ? String(match.responseTimeHours) : '',
        resolutionTimeHours: match ? String(match.resolutionTimeHours) : '',
      };
    })
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  function setTargetField(
    index: number,
    key: 'responseTimeHours' | 'resolutionTimeHours',
    value: string
  ): void {
    setSeverityTargets((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  function handleSubmit(): void {
    // Reuse the same validation logic via a temporary form shape
    const mockForm: PolicyFormState = {
      name,
      scopeType: 'org',
      scopeId: 'skip-scope-validation',
      effectiveFrom,
      effectiveTo,
      severityTargets,
    };
    const err = validateForm(mockForm);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    onSubmit({ name, effectiveFrom, effectiveTo, severityTargets });
  }

  const displayError = validationError ?? submitError;

  return (
    <div className="sla-modal-overlay" role="dialog" aria-modal="true">
      <div className="sla-modal">
        <h2 className="sla-modal-title">Edit SLA Policy</h2>

        <div className="sla-form-field">
          <label htmlFor="sla-name">Name</label>
          <input
            id="sla-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            data-testid="sla-form-name"
          />
        </div>

        <div className="sla-form-field">
          <label>Scope</label>
          <p className="sla-scope-readonly" data-testid="sla-form-scope-display">
            {policy.scopeDisplayName}
          </p>
        </div>

        <div className="sla-form-field">
          <label htmlFor="sla-effective-from">Effective From</label>
          <input
            id="sla-effective-from"
            type="datetime-local"
            value={effectiveFrom}
            onChange={(e) => {
              setEffectiveFrom(e.target.value);
            }}
            data-testid="sla-form-effective-from"
          />
        </div>

        <div className="sla-form-field">
          <label htmlFor="sla-effective-to">Effective To</label>
          <input
            id="sla-effective-to"
            type="datetime-local"
            value={effectiveTo}
            onChange={(e) => {
              setEffectiveTo(e.target.value);
            }}
            data-testid="sla-form-effective-to"
          />
        </div>

        <p className="sla-severity-targets-label">Severity Targets</p>
        <div className="sla-severity-targets-grid">
          <span className="sla-severity-targets-grid-header">Severity</span>
          <span className="sla-severity-targets-grid-header">Response (hrs)</span>
          <span className="sla-severity-targets-grid-header">Resolution (hrs)</span>

          {severityTargets.map((target, i) => (
            <React.Fragment key={target.severity}>
              <span className="sla-severity-label">{target.severity}</span>
              <input
                type="text"
                inputMode="numeric"
                value={target.responseTimeHours}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) {
                    setTargetField(i, 'responseTimeHours', e.target.value);
                  }
                }}
                data-testid={`sla-form-response-${target.severity.toLowerCase()}`}
              />
              <input
                type="text"
                inputMode="numeric"
                value={target.resolutionTimeHours}
                onChange={(e) => {
                  if (/^\d*\.?\d*$/.test(e.target.value)) {
                    setTargetField(i, 'resolutionTimeHours', e.target.value);
                  }
                }}
                data-testid={`sla-form-resolution-${target.severity.toLowerCase()}`}
              />
            </React.Fragment>
          ))}
        </div>

        {displayError && (
          <p className="sla-modal-error" role="alert" data-testid="sla-form-error">
            {displayError}
          </p>
        )}

        <div className="sla-modal-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={submitting}
            data-testid="sla-form-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={submitting}
            data-testid="sla-form-submit"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminSLAPoliciesPage: React.FC = () => {
  const { data, loading, error, execute: fetchPolicies } = useListSlaPolicies();
  const { execute: createPolicy, loading: creating, error: createError } = useCreateSlaPolicy();
  const { execute: updatePolicy, loading: updating, error: updateError } = useUpdateSlaPolicy();
  const { execute: deletePolicy, loading: deleting } = useDeleteSlaPolicy();

  const {
    orgs,
    customerUsers,
    loading: loadingScopes,
    fetch: fetchScopeOptions,
  } = useSlaScopeOptions();

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicyResponse | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    void fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch orgs and customer users when create modal opens
  useEffect(() => {
    if (modalMode !== 'create') return;
    void fetchScopeOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalMode]);

  function openCreate(): void {
    setEditingPolicy(null);
    setModalMode('create');
  }

  function openEdit(policy: SlaPolicyResponse): void {
    setEditingPolicy(policy);
    setModalMode('edit');
  }

  function closeModal(): void {
    setModalMode(null);
    setEditingPolicy(null);
  }

  async function handleCreate(form: PolicyFormState): Promise<void> {
    const result = await createPolicy({
      name: form.name,
      organizationId: form.scopeType === 'org' ? form.scopeId : undefined,
      userId: form.scopeType === 'user' ? form.scopeId : undefined,
      contract: { severityTargets: buildSeverityTargets(form.severityTargets) },
      effectiveFrom: new Date(form.effectiveFrom).toISOString(),
      effectiveTo: new Date(form.effectiveTo).toISOString(),
    });
    if (result) {
      closeModal();
      void fetchPolicies();
    }
  }

  async function handleEdit(data: {
    name: string;
    effectiveFrom: string;
    effectiveTo: string;
    severityTargets: SeverityTargetDraft[];
  }): Promise<void> {
    if (!editingPolicy) return;
    const result = await updatePolicy(editingPolicy.id, {
      name: data.name,
      contract: { severityTargets: buildSeverityTargets(data.severityTargets) },
      effectiveFrom: new Date(data.effectiveFrom).toISOString(),
      effectiveTo: new Date(data.effectiveTo).toISOString(),
    });
    if (result) {
      closeModal();
      void fetchPolicies();
    }
  }

  async function handleDelete(id: number): Promise<void> {
    const ok = await deletePolicy(id);
    if (ok) {
      setDeleteConfirmId(null);
      void fetchPolicies();
    }
  }

  const policies = data?.policies ?? [];

  return (
    <div className="admin-page" data-testid="admin-sla-policies-page">
      <div className="page-header">
        <h1 className="page-title">SLA Policies</h1>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreate}
            data-testid="add-sla-policy-btn"
          >
            Add Policy
          </button>
        </div>
      </div>

      <p className="admin-page-description">
        Define response and resolution time targets by severity. Policies can be scoped to an
        organization or to an individual customer. SLA breach alerts use the ticket deadline.
      </p>

      {error && (
        <p className="error-text" role="alert" data-testid="sla-list-error">
          {error}
        </p>
      )}

      <div className="card">
        {loading ? (
          <p className="loading-text" data-testid="sla-list-loading">
            Loading policies...
          </p>
        ) : (
          <table className="admin-table" aria-label="SLA policies" data-testid="sla-policies-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Scope</th>
                <th scope="col">Effective From</th>
                <th scope="col">Effective To</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={6} data-testid="sla-empty-state">
                    No SLA policies found.
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id} data-testid={`sla-row-${String(policy.id)}`}>
                    <td data-testid={`sla-name-${String(policy.id)}`}>{policy.name}</td>
                    <td data-testid={`sla-scope-${String(policy.id)}`}>
                      {policy.scopeDisplayName}
                    </td>
                    <td data-testid={`sla-from-${String(policy.id)}`}>
                      {new Date(policy.effectiveFrom).toLocaleDateString()}
                    </td>
                    <td data-testid={`sla-to-${String(policy.id)}`}>
                      {new Date(policy.effectiveTo).toLocaleDateString()}
                    </td>
                    <td data-testid={`sla-status-${String(policy.id)}`}>
                      {policy.isActive ? (
                        'Active'
                      ) : (
                        <span className="sla-inactive-badge">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        {deleteConfirmId === policy.id ? (
                          <>
                            <span>Deactivate?</span>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                void handleDelete(policy.id);
                              }}
                              disabled={deleting}
                              data-testid={`sla-confirm-delete-${String(policy.id)}`}
                            >
                              {deleting ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setDeleteConfirmId(null);
                              }}
                              disabled={deleting}
                              data-testid={`sla-cancel-delete-${String(policy.id)}`}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                openEdit(policy);
                              }}
                              data-testid={`sla-edit-${String(policy.id)}`}
                            >
                              Edit
                            </button>
                            {policy.isActive && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => {
                                  setDeleteConfirmId(policy.id);
                                }}
                                data-testid={`sla-delete-${String(policy.id)}`}
                              >
                                Deactivate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalMode === 'create' && (
        <CreateModal
          orgs={orgs}
          customerUsers={customerUsers}
          loadingScopes={loadingScopes}
          submitting={creating}
          submitError={createError}
          onSubmit={(form) => {
            void handleCreate(form);
          }}
          onClose={closeModal}
        />
      )}

      {modalMode === 'edit' && editingPolicy !== null && (
        <EditModal
          policy={editingPolicy}
          submitting={updating}
          submitError={updateError}
          onSubmit={(data) => {
            void handleEdit(data);
          }}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AdminSLAPoliciesPage;
