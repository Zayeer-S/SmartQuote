/* eslint-disable @typescript-eslint/no-misused-promises */
import React, { useState } from 'react';
import { useLogin } from '../../hooks/useLogin';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isLoading, error } = useLogin();

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({ email, password }, rememberMe);
      // Navigation happens inside the hook
    } catch {
      // Error is already set in the hook's state
      // Could add additional error handling here if needed but unlikely
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="brand">GIACOM</div>

        <h1 className="login-title">Login</h1>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="E.g. johndoe@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              required
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                required
                disabled={isLoading}
              />

              {/* Only show eye icon when password field has text */}
              {password.length > 0 && (
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  aria-label="Toggle password visibility"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    /* Eye Off Icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-5 0-9-7-9-7a21.86 21.86 0 015.06-5.94M1 1l22 22" />
                    </svg>
                  ) : (
                    /* Eye Icon */
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="options-row">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => {
                  setRememberMe(!rememberMe);
                }}
                disabled={isLoading}
              />
              Remember Me
            </label>

            <a href="/forgot-password" className="forgot-link">
              Forgot Password?
            </a>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="signup-text">
          Not registered yet?{' '}
          <a href="/register" className="signup-link">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
