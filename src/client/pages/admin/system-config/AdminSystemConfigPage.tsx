import React from 'react';
import { SMARTQUOTE_CONFIG_KEYS } from '../../../../shared/constants/lookup-values.js';
import './AdminSystemConfigPage.css';

const AdminSystemConfigPage: React.FC = () => {
  return (
    <div className="admin-page" data-testid="admin-system-config-page">
      <div className="page-header">
        <h1 className="page-title">System Configuration</h1>
      </div>
      <p className="admin-page-description">
        Core parameters used by the quote generation engine. Changes apply to all future
        auto-generated quotes.
      </p>

      <form
        className="system-config-form"
        aria-label="System configuration"
        data-testid="system-config-form"
      >
        <div className="field-group">
          <label className="field-label" htmlFor={SMARTQUOTE_CONFIG_KEYS.DEFAULT_DAY_START_TIME}>
            Default Working Day Start Time
          </label>
          <input
            className="field-input system-config-input"
            id={SMARTQUOTE_CONFIG_KEYS.DEFAULT_DAY_START_TIME}
            name={SMARTQUOTE_CONFIG_KEYS.DEFAULT_DAY_START_TIME}
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
            className="field-input system-config-input"
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
    </div>
  );
};

export default AdminSystemConfigPage;
