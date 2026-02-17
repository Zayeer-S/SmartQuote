import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/login/LoginPage';
import CustomerPage from './pages/customer/CustomerPage';
import { CLIENT_ROUTES } from '../shared/constants';
import AdminPage from './pages/admin/AdminPage';
import CreateTicketPage from './pages/customer/CreateTicketPage';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<LoginPage />} />
          <Route path={CLIENT_ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={CLIENT_ROUTES.CUSTOMER} element={<CustomerPage />} />
          <Route path={CLIENT_ROUTES.ADMIN} element={<AdminPage />} />
          <Route path="/customer/create" element={<CreateTicketPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
