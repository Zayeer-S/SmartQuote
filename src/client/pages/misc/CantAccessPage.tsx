import React from 'react';
import { Link } from 'react-router-dom';
import { CLIENT_ROUTES } from '../../constants/client.routes.js';
import './CantAccessPage.css';

const CantAccessPage: React.FC = () => {
  return (
    <main className="cant-access-page" data-testid="cant-access-page">
      <div className="cant-access-card">
        <span className="cant-access-logo">Smartquote</span>

        <h1 className="cant-access-title">Can't access your account?</h1>

        <p className="cant-access-body">
          If you have forgotten your password or are having trouble signing in, please contact your
          administrator or support team directly to have your access restored.
        </p>

        <Link to={CLIENT_ROUTES.LOGIN} className="cant-access-back" data-testid="back-to-login">
          Back to sign in
        </Link>
      </div>
    </main>
  );
};

export default CantAccessPage;
