// This exists due to handleSubmit, if you add void there it will break the login
/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useState } from 'react';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import { useLogin } from '../../hooks/useLogin.js';
import { EyeIcon, EyeOffIcon } from '../../components/icons/LoginIcons.js';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoading, error } = useLogin();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login({ email, password }, rememberMe).catch(() => {
      /* empty on purpose as login handles error */
    });
  };

  return (
    <main className="login-container" data-testid="login-page">
      <aside className="login-panel-brand" aria-hidden="true">
        <span className="brand">Smartquote</span>
        <div className="login-panel-brand-body">
          <p className="login-panel-tagline">
            SmartQuote: <em>A Faster Quoting System</em>
          </p>
          <p className="login-panel-meta">© {new Date().getFullYear()} Giacom</p>
        </div>
      </aside>

      {/* ── Middle panel ── */}
      <section className="login-card" aria-labelledby="login-heading">
        <h1 id="login-heading" className="login-title">
          Welcome
        </h1>
        <p className="login-subtitle">Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} noValidate aria-label="Login form" data-testid="login-form">
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              autoComplete="email"
              required
              disabled={isLoading}
              aria-required="true"
              aria-describedby={error ? 'login-error' : undefined}
              data-testid="email-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                autoComplete="current-password"
                required
                disabled={isLoading}
                aria-required="true"
                aria-describedby={error ? 'login-error' : undefined}
                data-testid="password-input"
              />

              {password.length > 0 && (
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => {
                    setShowPassword((prev) => !prev);
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  disabled={isLoading}
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              )}
            </div>
          </div>

          {error && (
            <p id="login-error" className="error-message" role="alert" data-testid="login-error">
              {error}
            </p>
          )}

          <div className="options-row">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => {
                  setRememberMe((prev) => !prev);
                }}
                disabled={isLoading}
                data-testid="remember-me-checkbox"
              />
              Remember me
            </label>

            <a
              href={CLIENT_ROUTES.CANT_ACCESS_ACCOUNT}
              className="forgot-link"
              data-testid="forgot-password-link"
            >
              Can't access your account?
            </a>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            aria-busy={isLoading}
            data-testid="login-submit-btn"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>

      {/* ── Right panel — empty breathing room ── */}
      <div className="login-panel-right" aria-hidden="true" />
    </main>
  );
};

export default LoginPage;
