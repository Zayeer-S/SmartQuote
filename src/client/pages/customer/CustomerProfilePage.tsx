/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSidebar, { type MenuKey } from './CustomerSidebar';
import './CustomerPage.css';
import './CustomerProfilePage.css';

type MeResponse = {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  createdAt?: string; // ISO
  lastLoginAt?: string; // ISO
  status?: 'Active' | 'Inactive' | string;
};

type OrgResponse = {
  name?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  phone?: string;
};

type ProfileStatsResponse = {
  totalTickets: number;
  activeTickets: number;
  completed: number;
  totalSpentPence: number;
  pendingQuotes: number;
};

type ProfileApiResponse = {
  me: MeResponse;
  organization?: OrgResponse;
  stats?: ProfileStatsResponse;
};

const ME_URL = '/api/me'; // optional session check
const PROFILE_URL = '/api/customer/profile'; // <-- change to your backend route (recommended: returns me+org+stats)

function formatGBPFromPence(pence: number): string {
  const pounds = (pence ?? 0) / 100;
  return pounds.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
}

function formatJoined(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Icon = {
  Mail: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6h16v12H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M4 7l8 6 8-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Phone: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.5 3.5l3.2 2.3-1.2 2.5c.8 1.6 2.1 2.9 3.7 3.7l2.5-1.2 2.3 3.2-1.6 2.2c-.5.7-1.4 1-2.2.8-3-.7-5.9-2.6-8-4.7S4.1 9.3 3.4 6.3c-.2-.8.1-1.7.8-2.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4 7h16M5 5h14a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  ),
  Building: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 9h2a2 2 0 0 1 2 2v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 7h4M8 11h4M8 15h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
} as const;

const CustomerProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<MenuKey>('Profile');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((v) => !v);
  }, []);

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse>({});
  const [org, setOrg] = useState<OrgResponse>({});
  const [stats, setStats] = useState<ProfileStatsResponse>({
    totalTickets: 0,
    activeTickets: 0,
    completed: 0,
    totalSpentPence: 0,
    pendingQuotes: 0,
  });

  const fullName = useMemo(() => {
    const nameFromParts = [me.firstName, me.lastName].filter(Boolean).join(' ').trim();
    return me.name ?? (nameFromParts || 'Guest');
  }, [me]);

  const email = me.email ?? 'guest@smartquote.com';

  const handleLogoutAndRedirect = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      handleLogoutAndRedirect();
      return;
    }

    const controller = new AbortController();
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    (async () => {
      try {
        // Optional token check
        const meRes = await fetch(ME_URL, { headers, signal: controller.signal });
        if (meRes.status === 401 || meRes.status === 403) {
          handleLogoutAndRedirect();
          return;
        }

        const res = await fetch(PROFILE_URL, { headers, signal: controller.signal });
        if (res.status === 401 || res.status === 403) {
          handleLogoutAndRedirect();
          return;
        }

        if (!res.ok) {
          console.error(`Profile fetch failed: ${res.status} ${res.statusText}`);
          return;
        }

        const data = (await res.json()) as ProfileApiResponse;

        setMe(data.me ?? {});
        setOrg(data.organization ?? {});
        setStats(
          data.stats ?? {
            totalTickets: 0,
            activeTickets: 0,
            completed: 0,
            totalSpentPence: 0,
            pendingQuotes: 0,
          }
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Profile fetch failed:', err);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [handleLogoutAndRedirect]);

  return (
    <div className={`customerPage ${isCollapsed ? 'sidebarCollapsed' : ''}`}>
      <CustomerSidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isCollapsed={isCollapsed}
        toggleSidebar={toggleSidebar}
      />

      <main className="main">
        <header className="profileTopBar">
          <div>
            <h1 className="profileTitle">Profile</h1>
            <p className="profileSubtitle">Manage your account information and preferences</p>
          </div>

          {/* ✅ No Customer/Admin view toggle here */}
          <button className="editBtn" type="button" onClick={() => navigate('/customer/profile/edit')}>
            ✎ Edit Profile
          </button>
        </header>

        {loading ? (
          <div className="profileLoading">Loading profile…</div>
        ) : (
          <div className="profileGrid">
            {/* Left column */}
            <div className="leftCol">
              <section className="card profileCard">
                <div className="avatarWrap" aria-hidden="true">
                  <div className="avatarCircle">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M4 21a8 8 0 0 1 16 0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>

                <div className="nameRow">
                  <div className="profileName">{fullName}</div>
                  <span className="rolePill">Customer</span>
                </div>

                <div className="contactList">
                  <div className="contactItem">
                    <span className="contactIcon">{Icon.Mail}</span>
                    <span className="contactText">{email}</span>
                  </div>
                  <div className="contactItem">
                    <span className="contactIcon">{Icon.Phone}</span>
                    <span className="contactText">{me.phone ?? '—'}</span>
                  </div>
                  <div className="contactItem">
                    <span className="contactIcon">{Icon.Calendar}</span>
                    <span className="contactText">Joined {formatJoined(me.createdAt)}</span>
                  </div>
                </div>
              </section>

              <section className="card statsCard">
                <div className="cardHeader">
                  <div className="cardHeaderTitle">Statistics</div>
                </div>

                <div className="statsList">
                  <div className="statsRow">
                    <div className="statsLabel">Total Tickets</div>
                    <div className="statsValue">{stats.totalTickets}</div>
                  </div>
                  <div className="statsRow">
                    <div className="statsLabel">Active Tickets</div>
                    <div className="statsValue blue">{stats.activeTickets}</div>
                  </div>
                  <div className="statsRow">
                    <div className="statsLabel">Completed</div>
                    <div className="statsValue green">{stats.completed}</div>
                  </div>
                  <div className="statsRow">
                    <div className="statsLabel">Total Spent</div>
                    <div className="statsValue">{formatGBPFromPence(stats.totalSpentPence)}</div>
                  </div>
                  <div className="statsRow">
                    <div className="statsLabel">Pending Quotes</div>
                    <div className="statsValue orange">{stats.pendingQuotes}</div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="rightCol">
              <section className="card formCardWide">
                <div className="sectionHeader">
                  <div>
                    <div className="sectionTitle">Personal Information</div>
                    <div className="sectionSub">Basic account information</div>
                  </div>
                </div>

                <div className="formGrid2">
                  <div className="field">
                    <label className="label">First Name</label>
                    <input className="control" value={me.firstName ?? ''} readOnly />
                  </div>
                  <div className="field">
                    <label className="label">Last Name</label>
                    <input className="control" value={me.lastName ?? ''} readOnly />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Email Address</label>
                  <input className="control" value={email} readOnly />
                </div>

                <div className="field">
                  <label className="label">Phone Number</label>
                  <input className="control" value={me.phone ?? ''} readOnly />
                </div>

                <div className="formGrid2">
                  <div className="field">
                    <label className="label">Job Title</label>
                    <input className="control" value={me.jobTitle ?? ''} readOnly />
                  </div>
                  <div className="field">
                    <label className="label">Department</label>
                    <input className="control" value={me.department ?? ''} readOnly />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Bio</label>
                  <textarea className="control textarea" value={me.bio ?? ''} readOnly />
                </div>
              </section>

              <section className="card formCardWide">
                <div className="sectionHeader">
                  <div className="sectionTitleRow">
                    <span className="sectionIcon">{Icon.Building}</span>
                    <div>
                      <div className="sectionTitle">Organization Information</div>
                      <div className="sectionSub">Company details and contact information</div>
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label className="label">Organization Name</label>
                  <input className="control" value={org.name ?? ''} readOnly />
                  <div className="hintText">Contact your administrator to update organization details</div>
                </div>

                <div className="formGrid2">
                  <div className="field">
                    <label className="label">Industry</label>
                    <input className="control" value={org.industry ?? ''} readOnly />
                  </div>
                  <div className="field">
                    <label className="label">Company Size</label>
                    <input className="control" value={org.companySize ?? ''} readOnly />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Address</label>
                  <input className="control" value={org.address ?? ''} readOnly />
                </div>

                <div className="field">
                  <label className="label">Organization Phone</label>
                  <input className="control" value={org.phone ?? ''} readOnly />
                </div>
              </section>

              <section className="card formCardWide">
                <div className="sectionHeader">
                  <div>
                    <div className="sectionTitle">Account Status</div>
                    <div className="sectionSub">Your account is currently active</div>
                  </div>
                  <span className={`statusPill ${String(me.status ?? 'Active').toLowerCase()}`}>
                    {me.status ?? 'Active'}
                  </span>
                </div>

                <div className="infoRows">
                  <div className="infoRow">
                    <div className="infoLabel">Last Login</div>
                    <div className="infoValue">{formatDateTime(me.lastLoginAt)}</div>
                  </div>
                  <div className="infoRow">
                    <div className="infoLabel">User ID</div>
                    <div className="infoValue mono">{me.id ?? '—'}</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerProfilePage;
