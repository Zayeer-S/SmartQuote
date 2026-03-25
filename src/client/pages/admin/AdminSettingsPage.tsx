import React, { useEffect, useState } from 'react';
import { SMARTQUOTE_CONFIG_KEYS } from '../../../shared/constants/lookup-values.js';
import type {
  CreateRateProfileRequest,
  RateProfileResponse,
  UpdateRateProfileRequest,
} from '../../../shared/contracts/rate-profile-contracts.js';
import { useCreateRateProfile } from '../../hooks/rate-profiles/useCreateRateProfile.js';
import { useListRateProfiles } from '../../hooks/rate-profiles/useListRateProfiles.js';
import { useUpdateRateProfile } from '../../hooks/rate-profiles/useUpdateRateProfile.js';
import { RateProfileModal } from './RateProfileModal.js';
import './AdminSettingsPage.css';

const RATE_PROFILE_COLUMNS = [
  'Ticket Type',
  'Severity',
  'Business Impact',
  'Business Hours (GBP/hr)',
  'After Hours (GBP/hr)',
  'Multiplier',
  'Actions',
] as const;

/**
 * Returns true if deactivating `target` would leave no active profile covering
 * the same ticketType + ticketSeverity + businessImpact combination.
 */
function isLastActiveCoverageForCombo(
  target: RateProfileResponse,
  allProfiles: RateProfileResponse[]
): boolean {
  const coveringProfiles = allProfiles.filter(
    (p) =>
      p.ticketType === target.ticketType &&
      p.ticketSeverity === target.ticketSeverity &&
      p.businessImpact === target.businessImpact &&
      p.isActive
  );
  // If only one active profile covers this combo and it is the target, deactivating breaks coverage
  return coveringProfiles.length === 1 && coveringProfiles[0].id === target.id;
}

type ModalState =
  | { open: false }
  | { open: true; mode: 'create' }
  | { open: true; mode: 'edit'; profile: RateProfileResponse };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminSettingsPage: React.FC = () => {
  const { data, loading, error, execute: fetchRateProfiles } = useListRateProfiles();
  const { execute: createRateProfile, loading: creating } = useCreateRateProfile();
  const { execute: updateRateProfile, loading: updating } = useUpdateRateProfile();

  const [modal, setModal] = useState<ModalState>({ open: false });
  const [toggleError, setToggleError] = useState<{ profileId: number; message: string } | null>(
    null
  );

  useEffect(() => {
    void fetchRateProfiles();
    // Infinite loop if fetchRateProfiles added as dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rateProfiles = data?.rateProfiles ?? [];

  // -- Handlers --

  function openCreateModal() {
    setToggleError(null);
    setModal({ open: true, mode: 'create' });
  }

  function openEditModal(profile: RateProfileResponse) {
    setToggleError(null);
    setModal({ open: true, mode: 'edit', profile });
  }

  function closeModal() {
    setModal({ open: false });
  }

  async function handleCreate(data: CreateRateProfileRequest): Promise<boolean> {
    const succeeded = await createRateProfile(data);
    if (succeeded) await fetchRateProfiles();
    return succeeded;
  }

  async function handleEdit(profileId: number, data: UpdateRateProfileRequest): Promise<boolean> {
    const succeeded = await updateRateProfile(profileId, data);
    if (succeeded) await fetchRateProfiles();
    return succeeded;
  }

  async function handleToggleActive(profile: RateProfileResponse): Promise<void> {
    setToggleError(null);

    // Safety guard: block deactivation if this is the last active coverage for the combo
    if (profile.isActive && isLastActiveCoverageForCombo(profile, rateProfiles)) {
      setToggleError({
        profileId: profile.id,
        message:
          'Cannot deactivate: this is the only active rate profile for this ticket type / severity / impact combination. ' +
          'Create an alternative profile first.',
      });
      return;
    }

    await updateRateProfile(profile.id, { isActive: !profile.isActive });
    await fetchRateProfiles();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="admin-page" data-testid="admin-settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* -- System Config -- */}
      <section
        className="settings-section"
        aria-labelledby="system-config-heading"
        data-testid="settings-system-config"
      >
        <h2 className="settings-section-heading" id="system-config-heading">
          System Configuration
        </h2>
        <p className="admin-page-description">
          Core parameters used by the quote generation engine. Changes apply to all future
          auto-generated quotes.
        </p>

        <form
          className="settings-form"
          aria-label="System configuration"
          data-testid="system-config-form"
        >
          <div className="field-group">
            <label className="field-label" htmlFor={SMARTQUOTE_CONFIG_KEYS.HOURS_PER_DAY}>
              Hours Per Day
            </label>
            <input
              className="field-input settings-form-input"
              id={SMARTQUOTE_CONFIG_KEYS.HOURS_PER_DAY}
              name={SMARTQUOTE_CONFIG_KEYS.HOURS_PER_DAY}
              type="number"
              min={1}
              max={24}
              placeholder="e.g. 8"
              disabled
              data-testid="config-hours-per-day"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor={SMARTQUOTE_CONFIG_KEYS.VELOCITY_MULTIPLIER}>
              Velocity Multiplier
            </label>
            <input
              className="field-input settings-form-input"
              id={SMARTQUOTE_CONFIG_KEYS.VELOCITY_MULTIPLIER}
              name={SMARTQUOTE_CONFIG_KEYS.VELOCITY_MULTIPLIER}
              type="number"
              min={0.1}
              step={0.1}
              placeholder="e.g. 1.0"
              disabled
              data-testid="config-velocity-multiplier"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled
            data-testid="system-config-save-btn"
          >
            Save Configuration
          </button>
        </form>
      </section>

      {/* -- Rate Profiles -- */}
      <section
        className="settings-section"
        aria-labelledby="rate-profiles-heading"
        data-testid="settings-rate-profiles"
      >
        <div className="settings-section-header">
          <h2 className="settings-section-heading" id="rate-profiles-heading">
            Rate Profiles
          </h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={openCreateModal}
            data-testid="add-rate-profile-btn"
          >
            Add Rate Profile
          </button>
        </div>
        <p className="admin-page-description">
          Define hourly rates by ticket type and severity. Business hours and after-hours rates can
          be set independently.
        </p>

        <div className="card">
          <table
            className="admin-table"
            aria-label="Rate profiles"
            data-testid="rate-profiles-table"
          >
            <thead>
              <tr>
                {RATE_PROFILE_COLUMNS.map((col) => (
                  <th key={col} scope="col">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr data-testid="rate-profiles-loading-row">
                  <td colSpan={RATE_PROFILE_COLUMNS.length}>
                    <div className="empty-state">
                      <p className="empty-state-message">Loading rate profiles...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr data-testid="rate-profiles-error-row">
                  <td colSpan={RATE_PROFILE_COLUMNS.length}>
                    <div className="empty-state">
                      <p className="empty-state-message">Failed to load rate profiles: {error}</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && rateProfiles.length === 0 && (
                <tr data-testid="rate-profiles-empty-row">
                  <td colSpan={RATE_PROFILE_COLUMNS.length}>
                    <div className="empty-state">
                      <p className="empty-state-message">No rate profiles configured.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                rateProfiles.map((profile) => {
                  const rowId = `rate-row-${String(profile.id)}`;
                  const isToggling = updating;
                  const rowToggleError =
                    toggleError?.profileId === profile.id ? toggleError.message : null;

                  return (
                    <React.Fragment key={profile.id}>
                      <tr data-testid={rowId} style={{ opacity: profile.isActive ? 1 : 0.5 }}>
                        <td data-testid={`rate-type-${String(profile.id)}`}>
                          {profile.ticketType}
                        </td>
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
                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                openEditModal(profile);
                              }}
                              disabled={isToggling}
                              data-testid={`rate-edit-${String(profile.id)}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => void handleToggleActive(profile)}
                              disabled={isToggling}
                              data-testid={`rate-toggle-${String(profile.id)}`}
                            >
                              {profile.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {rowToggleError && (
                        <tr data-testid={`rate-toggle-error-${String(profile.id)}`}>
                          <td
                            colSpan={RATE_PROFILE_COLUMNS.length}
                            className="rate-profile-inline-error"
                          >
                            {rowToggleError}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* -- User Management -- */}
      <section
        className="settings-section"
        aria-labelledby="user-management-heading"
        data-testid="settings-user-management"
      >
        <div className="settings-section-header">
          <h2 className="settings-section-heading" id="user-management-heading">
            User Management
          </h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled
            data-testid="add-user-btn"
          >
            Add User
          </button>
        </div>
        <p className="admin-page-description">
          Create and manage support agents, managers, and admin accounts. Customer accounts are
          managed separately through the customer portal.
        </p>

        <div className="card">
          <table className="admin-table" aria-label="Users" data-testid="users-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Organisation</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr data-testid="users-table-empty-row">
                <td colSpan={5}>
                  <div className="empty-state">
                    <p className="empty-state-message">User management coming soon.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* -- Modals -- */}
      {modal.open && modal.mode === 'create' && (
        <RateProfileModal
          mode="create"
          onClose={closeModal}
          onSubmit={handleCreate}
          submitting={creating}
        />
      )}

      {modal.open && modal.mode === 'edit' && (
        <RateProfileModal
          mode="edit"
          profile={modal.profile}
          onClose={closeModal}
          onSubmit={(data) => handleEdit(modal.profile.id, data)}
          submitting={updating}
        />
      )}
    </div>
  );
};

export default AdminSettingsPage;
