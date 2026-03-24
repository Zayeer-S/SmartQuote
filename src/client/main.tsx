import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import { CLIENT_ROUTES } from './constants/client.routes';
import { AuthProvider } from './context/auth/AuthContext';
import { SidebarProvider } from './context/sidebar/SidebarContext';
import { ThemeProvider } from './context/theme';
import AdminPage from './pages/admin/AdminPage';
import CreateTicketPage from './pages/customer/CreateTicketPage';
import CustomerPage from './pages/customer/CustomerPage';
import LoginPage from './pages/login/LoginPage';
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
                <Route index element={<LoginPage />} />
                <Route path={CLIENT_ROUTES.LOGIN} element={<LoginPage />} />

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        AUTH_ROLES.ADMIN,
                        AUTH_ROLES.MANAGER,
                        AUTH_ROLES.SUPPORT_AGENT,
                      ]}
                    />
                  }
                >
                  <Route path={CLIENT_ROUTES.ADMIN} element={<AdminPage />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[AUTH_ROLES.CUSTOMER]} />}>
                  <Route path={CLIENT_ROUTES.CUSTOMER} element={<CustomerPage />} />
                  <Route path={CLIENT_ROUTES.CUSTOMER_CREATE} element={<CreateTicketPage />} />
                </Route>
              </Route>
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
