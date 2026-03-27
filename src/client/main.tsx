import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthContext.js';
import { SidebarProvider } from './context/sidebar/SidebarContext.js';
import LoginPage from './pages/login/LoginPage.js';
import CantAccessPage from './pages/misc/CantAccessPage.js';
import NotFoundPage from './pages/misc/NotFoundPage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import { CLIENT_ROUTES } from './constants/client.routes.js';
import { ThemeProvider } from './context/theme/ThemeContext.js';
import { AUTH_ROLES } from '../shared/constants';
import CustomerLayout from './pages/customer/CustomerLayout.js';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage.js';
import TicketDetailPage from './pages/customer/TicketDetailPage.js';
import SettingsPage from './pages/shared/SettingsPage.js';
import AdminLayout from './pages/admin/AdminLayout.js';
import AdminTicketsPage from './pages/admin/tickets/AdminTicketsPage.js';
import AdminTicketDetailPage from './pages/admin/tickets/AdminTicketDetailPage.js';
import AdminQuoteDetailPage from './pages/admin/quote/AdminQuoteDetailPage.js';
import AdminAnalyticsPage from './pages/admin/analytics/AdminAnalyticsPage.js';
import AdminSLAPoliciesPage from './pages/admin/sla/AdminSLAPoliciesPage.js';
import AdminRateProfilesPage from './pages/admin/rate-profiles/AdminRateProfilesPage.js';
import AdminUserManagementPage from './pages/admin/user-management/AdminUserManagementPage.js';
import AdminSystemConfigPage from './pages/admin/system-config/AdminSystemConfigPage.js';
import './styles/globals.css';
import './styles/buttons.css';
import './styles/forms.css';
import './styles/cards.css';

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
                    <Route path={CLIENT_ROUTES.ADMIN.QUOTE()} element={<AdminQuoteDetailPage />} />
                    <Route path={CLIENT_ROUTES.ADMIN.ANALYTICS} element={<AdminAnalyticsPage />} />
                    <Route
                      path={CLIENT_ROUTES.ADMIN.SLA_POLICIES}
                      element={<AdminSLAPoliciesPage />}
                    />
                    <Route
                      path={CLIENT_ROUTES.ADMIN.RATE_PROFILES}
                      element={<AdminRateProfilesPage />}
                    />
                    <Route
                      path={CLIENT_ROUTES.ADMIN.USER_MANAGEMENT}
                      element={<AdminUserManagementPage />}
                    />
                    <Route
                      path={CLIENT_ROUTES.ADMIN.SYSTEM_CONFIG}
                      element={<AdminSystemConfigPage />}
                    />
                    <Route path={CLIENT_ROUTES.ADMIN.SETTINGS} element={<SettingsPage />} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute allowedRoles={[AUTH_ROLES.CUSTOMER]} />}>
                  <Route path={CLIENT_ROUTES.CUSTOMER.ROOT} element={<CustomerLayout />}>
                    <Route index element={<CustomerDashboardPage />} />
                    <Route path={CLIENT_ROUTES.CUSTOMER.TICKET()} element={<TicketDetailPage />} />
                    <Route path={CLIENT_ROUTES.CUSTOMER.SETTINGS} element={<SettingsPage />} />
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
