import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthContext.js';
import { SidebarProvider } from './context/sidebar/SidebarContext.js';
import LoginPage from './pages/login/LoginPage.js';
import CantAccessPage from './pages/login/CantAccessPage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import { CLIENT_ROUTES } from './constants/client.routes.js';
import { ThemeProvider } from './context/theme/ThemeContext.js';
import { AUTH_ROLES } from '../shared/constants';
import CustomerLayout from './pages/customer/CustomerLayout.js';
import DashboardPage from './pages/customer/DashboardPage.js';
import TicketsPage from './pages/customer/TicketsPage.js';
import TicketDetailPage from './pages/customer/TicketDetailPage.js';
import NewTicketPage from './pages/customer/NewTicketPage.js';
import SettingsPage from './pages/customer/CustomerSettingsPage.js';
import AdminLayout from './pages/admin/AdminLayout.js';
import AdminTicketsPage from './pages/admin/AdminTicketsPage.js';
import AdminTicketDetailPage from './pages/admin/AdminTicketDetailPage.js';
import AdminQuotesPage from './pages/admin/AdminQuotesPage.js';
import AdminQuoteDetailPage from './pages/admin/AdminQuoteDetailPage.js';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage.js';
import AdminSLAPoliciesPage from './pages/admin/AdminSLAPoliciesPage.js';
import AdminSettingsPage from './pages/admin/AdminSettingsPage.js';
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
