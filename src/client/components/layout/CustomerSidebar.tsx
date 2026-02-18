import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarIcons } from '../icons/SidebarIcons';
import { tokenStorage } from '../../lib/storage/tokenStorage';
import { CLIENT_ROUTES } from '../../constants/client.routes';

export type MenuKey = 'Dashboard' | 'My Tickets' | 'Quotes' | 'History' | 'Profile';

interface Props {
  activeMenu: MenuKey;
  onMenuChange: (key: MenuKey) => void;
  brandTitle: string;
  brandSub: string;
  userName: string;
  userEmail: string;
}

const MENU_ITEMS: { key: MenuKey; icon: keyof typeof SidebarIcons; route: string }[] = [
  { key: 'Dashboard', icon: 'Home', route: '/customer' },
  { key: 'My Tickets', icon: 'Ticket', route: '/customer/tickets' },
  { key: 'Quotes', icon: 'Pound', route: '/customer/quotes' },
  { key: 'History', icon: 'Doc', route: '/customer/history' },
  { key: 'Profile', icon: 'User', route: '/customer/profile' },
];

const CustomerSidebar: React.FC<Props> = ({
  activeMenu,
  onMenuChange,
  brandTitle,
  brandSub,
  userName,
  userEmail,
}) => {
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((v) => !v);
  }, []);

  const handleLogout = useCallback(() => {
    tokenStorage.clear();
    setProfileOpen(false);
    void navigate(CLIENT_ROUTES.LOGIN);
  }, [navigate]);

  const handleViewUserInfo = useCallback(() => {
    setProfileOpen(false);
    void navigate(CLIENT_ROUTES.CUSTOMER_PROFILE);
  }, [navigate]);

  return (
    <aside className="sidebar">
      <div className="brandRow">
        <div className="brand">
          <div className="brandTitle">{isCollapsed ? brandTitle[0] : brandTitle}</div>
          {!isCollapsed && <div className="brandSub">{brandSub}</div>}
        </div>

        <button
          className="collapseBtn"
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          {isCollapsed ? '➡️' : '⬅️'}
        </button>
      </div>

      <nav className="menu">
        {MENU_ITEMS.map(({ key, icon, route }) => (
          <button
            key={key}
            className={`menuItem ${activeMenu === key ? 'active' : ''}`}
            type="button"
            title={isCollapsed ? key : undefined}
            onClick={() => {
              onMenuChange(key);
              void navigate(route);
            }}
          >
            <span className="menuIcon">{SidebarIcons[icon]}</span>
            {!isCollapsed && <span className="menuLabel">{key}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebarFooter" ref={profileRef}>
        <button
          className="profileTrigger"
          type="button"
          onClick={() => {
            setProfileOpen((v) => !v);
          }}
          aria-label="Open profile menu"
        >
          <div className="userAvatar">{SidebarIcons.User}</div>
          {!isCollapsed && (
            <div className="userMeta">
              <div className="userName">{userName}</div>
              <div className="userEmail">{userEmail}</div>
            </div>
          )}
        </button>

        {profileOpen && !isCollapsed && (
          <div className="profileDropdown" role="menu">
            <button className="dropdownItem" type="button" onClick={handleViewUserInfo}>
              View User Information
            </button>
            <button className="dropdownItem logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CustomerSidebar;
