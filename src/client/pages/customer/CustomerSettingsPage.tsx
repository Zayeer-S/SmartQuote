import React from 'react';
import { useTheme } from '../../hooks/contexts/useTheme';
import './CustomerSettingsPage.css';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="settings-page" data-testid="settings-page">
      <h1>Settings</h1>

      <section className="card settings-section" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>

        <div className="settings-row">
          <div className="settings-row-label">
            <span className="settings-row-label-title" id="theme-label">
              Theme
            </span>
            <span className="settings-row-label-hint">
              {isDark ? 'Switched to dark mode' : 'Switched to light mode'}
            </span>
          </div>

          <button
            type="button"
            className="theme-toggle"
            role="switch"
            aria-checked={isDark}
            aria-labelledby="theme-label"
            onClick={toggleTheme}
            data-testid="theme-toggle"
          >
            <span
              className={['theme-toggle-track', isDark ? 'theme-toggle-track--on' : '']
                .filter(Boolean)
                .join(' ')}
            >
              <span
                className={['theme-toggle-thumb', isDark ? 'theme-toggle-thumb--on' : '']
                  .filter(Boolean)
                  .join(' ')}
              />
            </span>
            <span className="theme-toggle-label">{isDark ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </section>

      <section className="card settings-section" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading">Notifications</h2>

        {/*
          TODO: Notification preferences are a UI stub.
          Wire up once the backend exposes a notification preferences endpoint.
        */}
        <p className="settings-stub-notice" data-testid="notifications-stub">
          Notification preferences are not available yet.
        </p>
      </section>
    </div>
  );
};

export default SettingsPage;
