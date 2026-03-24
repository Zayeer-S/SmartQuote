import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import { CLIENT_ROUTES } from './constants/client.routes';
import { AuthProvider } from './context/auth/AuthContext';
import { SidebarProvider } from './context/sidebar/SidebarContext';
import { ThemeProvider } from './context/theme';
import NotFoundPage from './pages/NotFoundPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminQuoteDetailPage from './pages/admin/AdminQuoteDetailPage';
import AdminQuotesPage from './pages/admin/AdminQuotesPage';
import AdminSLAPoliciesPage from './pages/admin/AdminSLAPoliciesPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminTicketDetailPage from './pages/admin/AdminTicketDetailPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import CustomerSettingsPage from './pages/customer/CustomerSettingsPage';
import CustomerLayout from './pages/customer/CustomerLayout';
import DashboardPage from './pages/customer/DashboardPage';
import NewTicketPage from './pages/customer/NewTicketPage';
import QuotesPage from './pages/customer/QuotesPage';
import TicketDetailPage from './pages/customer/TicketDetailPage';
import TicketsPage from './pages/customer/TicketsPage';
import CantAccessPage from './pages/login/CantAccessPage';
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
                <Route path={CLIENT_ROUTES.CANT_ACCESS_ACCOUNT} element={<CantAccessPage />} />

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
                  <Route path={CLIENT_ROUTES.ADMIN.ROOT} element={<AdminLayout />}>
                    <Route index element={<AdminTicketsPage />} />
                    <Route path={CLIENT_ROUTES.ADMIN.TICKETS} element={<AdminTicketsPage />} />
                    <Route
                      path={CLIENT_ROUTES.ADMIN.TICKET()}
                      element={<AdminTicketDetailPage />}
                    />
                    <Route path={CLIENT_ROUTES.ADMIN.QUOTES} element={<AdminQuotesPage />} />
                    <Route path={CLIENT_ROUTES.ADMIN.QUOTE()} element={<AdminQuoteDetailPage />} />
                    <Route path={CLIENT_ROUTES.ADMIN.ANALYTICS} element={<AdminAnalyticsPage />} />
                    <Route
                      path={CLIENT_ROUTES.ADMIN.SLA_POLICIES}
                      element={<AdminSLAPoliciesPage />}
                    />
                    <Route path={CLIENT_ROUTES.ADMIN.SETTINGS} element={<AdminSettingsPage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[AUTH_ROLES.CUSTOMER]} />}>
                  <Route path={CLIENT_ROUTES.CUSTOMER.ROOT} element={<CustomerLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path={CLIENT_ROUTES.CUSTOMER.TICKETS} element={<TicketsPage />} />
                    <Route path={CLIENT_ROUTES.CUSTOMER.TICKET()} element={<TicketDetailPage />} />
                    <Route path={CLIENT_ROUTES.CUSTOMER.NEW_TICKET} element={<NewTicketPage />} />
                    <Route path={CLIENT_ROUTES.CUSTOMER.QUOTES} element={<QuotesPage />} />
                    <Route
                      path={CLIENT_ROUTES.CUSTOMER.SETTINGS}
                      element={<CustomerSettingsPage />}
                    />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
