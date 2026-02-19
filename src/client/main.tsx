import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ThemeProvider } from './context/theme';
import { AuthProvider } from './context/auth/AuthContext';
import { SidebarProvider } from './context/sidebar/SidebarContext';

import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/login/LoginPage';
import CustomerPage from './pages/customer/CustomerPage';
import AdminPage from './pages/admin/AdminPage';
import CreateTicketPage from './pages/customer/CreateTicketPage';
// import CustomerProfilePage from './pages/customer/CustomerProfilePage';

import { CLIENT_ROUTES } from './constants/client.routes';
import { AUTH_ROLES } from '../shared/constants';

import './styles/globals.css';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/">
                {/* Public */}
                <Route index element={<LoginPage />} />
                <Route path={CLIENT_ROUTES.LOGIN} element={<LoginPage />} />

                {/* Admin */}
                <Route element={<ProtectedRoute allowedRoles={[AUTH_ROLES.ADMIN]} />}>
                  <Route path={CLIENT_ROUTES.ADMIN} element={<AdminPage />} />
                </Route>

                {/* Customer */}
                <Route element={<ProtectedRoute allowedRoles={[AUTH_ROLES.CUSTOMER]} />}>
                  <Route path={CLIENT_ROUTES.CUSTOMER} element={<CustomerPage />} />
                  <Route
                    path={CLIENT_ROUTES.CUSTOMER_CREATE}
                    element={<CreateTicketPage />}
                  />
                  {/* If you have it:
                  <Route
                    path={CLIENT_ROUTES.CUSTOMER_PROFILE}
                    element={<CustomerProfilePage />}
                  />
                  */}
                </Route>
              </Route>
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
