import React from 'react';
import {
  SMARTQUOTE_CONFIG_KEYS,
  TICKET_TYPES,
  TICKET_SEVERITIES,
} from '../../../shared/constants/lookup-values';
import './AdminSettingsPage.css';

const RATE_PROFILE_COLUMNS = [
  'Ticket Type',
  'Severity',
  'Business Hours (£/hr)',
  'After Hours (£/hr)',
  'Actions',
] as const;

const STUB_RATE_PROFILES = Object.values(TICKET_TYPES).flatMap((type) =>
  Object.values(TICKET_SEVERITIES).map((severity) => ({
    id: `rate-${type}-${severity}`,
    ticketType: type,
    severity,
  }))
);

const AdminSettingsPage: React.FC = () => {
  return (
    <div className="admin-page" data-testid="admin-settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      {/* ── System Config ── */}
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

      {/* ── Rate Profiles ── */}
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
              {STUB_RATE_PROFILES.map((profile) => (
                <tr key={profile.id} data-testid={`rate-row-${profile.id}`}>
                  <td data-testid={`rate-type-${profile.id}`}>{profile.ticketType}</td>
                  <td data-testid={`rate-severity-${profile.id}`}>{profile.severity}</td>
                  <td>
                    <input
                      className="field-input settings-rate-input"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      disabled
                      aria-label={`Business hours rate for ${profile.ticketType} ${profile.severity}`}
                      data-testid={`rate-business-${profile.id}`}
                    />
                  </td>
                  <td>
                    <input
                      className="field-input settings-rate-input"
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      disabled
                      aria-label={`After hours rate for ${profile.ticketType} ${profile.severity}`}
                      data-testid={`rate-afterhours-${profile.id}`}
                    />
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled
                        data-testid={`rate-edit-${profile.id}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled
                        data-testid={`rate-delete-${profile.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── User Management ── */}
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
