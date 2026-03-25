import React, { useEffect } from 'react';
import { SMARTQUOTE_CONFIG_KEYS } from '../../../shared/constants/lookup-values.js';
import { useListRateProfiles } from '../../hooks/rate-profiles/useListRateProfiles.js';
import './AdminSettingsPage.css';

const RATE_PROFILE_COLUMNS = [
  'Ticket Type',
  'Severity',
  'Business Impact',
  'Business Hours (£/hr)',
  'After Hours (£/hr)',
  'Multiplier',
  'Actions',
] as const;

const AdminSettingsPage: React.FC = () => {
  const { data, loading, error, execute: fetchRateProfiles } = useListRateProfiles();

  useEffect(() => {
    void fetchRateProfiles();
    // Infinite loop if you add dependency fetchRateProfiles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rateProfiles = data?.rateProfiles ?? [];

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
            disabled
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
                  return (
                    <tr
                      key={profile.id}
                      data-testid={rowId}
                      style={{ opacity: profile.isActive ? 1 : 0.5 }}
                    >
                      <td data-testid={`rate-type-${String(profile.id)}`}>{profile.ticketType}</td>
                      <td data-testid={`rate-severity-${String(profile.id)}`}>
                        {profile.ticketSeverity}
                      </td>
                      <td data-testid={`rate-impact-${String(profile.id)}`}>
                        {profile.businessImpact}
                      </td>
                      <td>
                        <input
                          className="field-input settings-rate-input"
                          type="text"
                          inputMode="decimal"
                          defaultValue={profile.businessHoursRate.toFixed(2)}
                          disabled
                          aria-label={`Business hours rate for ${profile.ticketType} ${profile.ticketSeverity}`}
                          data-testid={`rate-business-${String(profile.id)}`}
                        />
                      </td>
                      <td>
                        <input
                          className="field-input settings-rate-input"
                          type="text"
                          inputMode="decimal"
                          defaultValue={profile.afterHoursRate.toFixed(2)}
                          disabled
                          aria-label={`After hours rate for ${profile.ticketType} ${profile.ticketSeverity}`}
                          data-testid={`rate-afterhours-${String(profile.id)}`}
                        />
                      </td>
                      <td data-testid={`rate-multiplier-${String(profile.id)}`}>
                        {profile.multiplier.toFixed(2)}x
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled
                            data-testid={`rate-edit-${String(profile.id)}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled
                            data-testid={`rate-delete-${String(profile.id)}`}
                          >
                            {profile.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
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
    </div>
  );
};

export default AdminSettingsPage;
