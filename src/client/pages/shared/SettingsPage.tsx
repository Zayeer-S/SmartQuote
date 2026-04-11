import React, { useEffect } from 'react';
import { useTheme } from '../../hooks/contexts/useTheme.js';
import { useGetNotificationPreferences } from '../../hooks/notifications/useGetNotificationPreferences.js';
import { useUpdateNotificationPreferences } from '../../hooks/notifications/useUpdateNotificationPreferences.js';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const {
    data: prefsData,
    loading: prefsLoading,
    error: prefsError,
    execute: fetchPrefs,
  } = useGetNotificationPreferences();
  const { loading: updating, execute: updatePrefs } = useUpdateNotificationPreferences();

  useEffect(() => {
    void fetchPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(typeId: number, currentlyEnabled: boolean): Promise<void> {
    if (!prefsData) return;

    const next = prefsData.preferences
      .filter((p) => (p.notificationTypeId === typeId ? !currentlyEnabled : p.enabled))
      .map((p) => p.notificationTypeId);

    await updatePrefs(next);
    await fetchPrefs();
  }

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

        {prefsLoading && (
          <p className="settings-stub-notice" data-testid="notifications-loading">
            Loading preferences...
          </p>
        )}

        {prefsError && (
          <p className="settings-stub-notice" data-testid="notifications-error">
            Failed to load preferences.
          </p>
        )}

        {!prefsLoading &&
          !prefsError &&
          prefsData?.preferences.map((pref) => {
            const toggleId = `notif-toggle-${String(pref.notificationTypeId)}`;
            return (
              <div className="settings-row" key={pref.notificationTypeId}>
                <div className="settings-row-label">
                  <span className="settings-row-label-title" id={toggleId}>
                    {pref.notificationTypeName}
                  </span>
                  <span className="settings-row-label-hint">
                    {pref.enabled ? 'Email notifications on' : 'Email notifications off'}
                  </span>
                </div>

                <button
                  type="button"
                  className="theme-toggle"
                  role="switch"
                  aria-checked={pref.enabled}
                  aria-labelledby={toggleId}
                  disabled={updating}
                  onClick={() => void handleToggle(pref.notificationTypeId, pref.enabled)}
                  data-testid={`notif-toggle-${String(pref.notificationTypeId)}`}
                >
                  <span
                    className={['theme-toggle-track', pref.enabled ? 'theme-toggle-track--on' : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span
                      className={[
                        'theme-toggle-thumb',
                        pref.enabled ? 'theme-toggle-thumb--on' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  </span>
                </button>
              </div>
            );
          })}
      </section>
    </div>
  );
};

export default SettingsPage;
