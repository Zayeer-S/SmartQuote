import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CLIENT_ROUTES } from '../constants/client.routes';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <main className="not-found-page" data-testid="not-found-page">
      <div className="not-found-card">
        <span className="not-found-logo">Smartquote</span>

        <p className="not-found-code" aria-hidden="true">
          404
        </p>

        <h1 className="not-found-title">Page not found</h1>

        <code className="not-found-path">{pathname}</code>

        <Link
          to={CLIENT_ROUTES.LOGIN}
          className="btn btn-primary btn-full"
          data-testid="not-found-home-link"
        >
          Go to sign in
        </Link>
      </div>
    </main>
  );
};

export default NotFoundPage;
