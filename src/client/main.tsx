import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/auth/AuthContext';
import { SidebarProvider } from './context/sidebar/SidebarContext';
import { ThemeProvider } from './context/theme';

import LoginPage from './pages/login/LoginPage';
import CustomerPage from './pages/customer/CustomerPage';
import AdminPage from './pages/admin/AdminPage';
import CreateTicketPage from './pages/customer/CreateTicketPage';

import { CLIENT_ROUTES } from './constants/client.routes';

import './styles/globals.css';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AuthProvider>
            <Routes>
              <Route path="/">
                <Route index element={<LoginPage />} />
                <Route path={CLIENT_ROUTES.LOGIN} element={<LoginPage />} />
                <Route
                  path={CLIENT_ROUTES.CUSTOMER}
                  element={<CustomerPage />}
                />
                <Route
                  path={CLIENT_ROUTES.ADMIN}
                  element={<AdminPage />}
                />
                <Route
                  path={CLIENT_ROUTES.CUSTOMER_CREATE}
                  element={<CreateTicketPage />}
                />
              </Route>
            </Routes>
          </AuthProvider>
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
