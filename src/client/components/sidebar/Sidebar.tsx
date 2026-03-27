import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSidebar } from '../../hooks/contexts/useSidebar.js';
import { IconSignOut } from '../icons/MiscIcons.js';
import './Sidebar.css';

// ------------------------------------------------------------------
// Public types
// ------------------------------------------------------------------

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  testId: string;
  end?: boolean;
}

export interface SidebarUser {
  /** Display name shown in the footer */
  fullName: string;
  /** Optional subtitle shown beneath the name (e.g. role) */
  subtitle?: string;
  /** Optional single character used to render an avatar initial */
  avatarInitial?: string;
}

export interface SidebarBrand {
  /** Portal label shown beneath the logo, e.g. "Customer Portal" */
  portalLabel: string;
  /** Path to logo image. When undefined the text wordmark is rendered instead. */
  logoSrc?: string;
}

export interface SidebarProps {
  navItems: SidebarNavItem[];
  brand: SidebarBrand;
  user: SidebarUser | null;
  /** Called when the user clicks Sign out. Logout + redirect logic lives in the parent layout. */
  onLogout: () => void;
  /** aria-label for the <nav> element */
  ariaLabel: string;
  testId?: string;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  brand,
  user,
  onLogout,
  ariaLabel,
  testId,
}) => {
  const { isCollapsed, toggle } = useSidebar();

  const sidebarClass = ['sidebar', isCollapsed ? 'sidebar--collapsed' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={sidebarClass} aria-label={ariaLabel} data-testid={testId ?? 'sidebar'}>
      {/* Brand */}
      <div className="sidebar-brand">
        {!isCollapsed && (
          <a className="sidebar-logo-link">
            <img src={brand.logoSrc} width={130} height={22} alt="Giacom logo" />
          </a>
        )}
        {!isCollapsed && <span className="sidebar-portal-label">{brand.portalLabel}</span>}
      </div>

      {/* Nav links */}
      <ul className="sidebar-nav" role="list">
        {navItems.map(({ to, label, icon, testId: itemTestId, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                ['sidebar-link', isActive ? 'sidebar-link--active' : ''].filter(Boolean).join(' ')
              }
              data-testid={itemTestId}
              title={isCollapsed ? label : undefined}
            >
              <span className="sidebar-link-icon">{icon}</span>
              {!isCollapsed && <span className="sidebar-link-label">{label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="sidebar-footer">
        {user && !isCollapsed && (
          <div className="sidebar-user" data-testid="sidebar-user">
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.fullName}</span>
              {user.subtitle && <span className="sidebar-user-subtitle">{user.subtitle}</span>}
            </div>
          </div>
        )}
        <button
          type="button"
          className="sidebar-logout"
          onClick={onLogout}
          data-testid="logout-btn"
          title={isCollapsed ? 'Sign out' : undefined}
        >
          <IconSignOut />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse chevron -- desktop only, hidden on mobile */}
      {/** RESOLVE: MOVE UP */}
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggle}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!isCollapsed}
        data-testid="sidebar-toggle"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={['sidebar-toggle-icon', isCollapsed ? 'sidebar-toggle-icon--flipped' : '']
            .filter(Boolean)
            .join(' ')}
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  );
};

export default Sidebar;
