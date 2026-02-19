import React from 'react';
import { useTheme } from '../../hooks/contexts/useTheme';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div data-testid="settings-page">
      <h1>Settings</h1>

      <section aria-labelledby="appearance-heading">
        <h2 id="appearance-heading">Appearance</h2>

        <div>
          <span id="theme-label">Theme</span>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-labelledby="theme-label"
            onClick={toggleTheme}
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </section>

      <section aria-labelledby="notifications-heading">
        <h2 id="notifications-heading">Notifications</h2>

        {/*
          TODO: Notification preferences are a UI stub.
        */}
        <p data-testid="notifications-stub">Notification preferences are not available yet.</p>
      </section>
    </div>
  );
};

export default SettingsPage;
