import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

type StatRow = {
  label: string;
  value: string;
  tone?: "blue" | "green" | "orange" | "ink";
};

const Icons = {
  Home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Ticket: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 9h6M9 12h6M9 15h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  Pound: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14 4a4 4 0 0 0-4 4v2h5a1 1 0 1 1 0 2h-5v2c0 1.2-.3 2.3-1 3h8a1 1 0 1 1 0 2H7a1 1 0 0 1-.7-1.7c1.2-1.2 1.7-2.4 1.7-4.3v-1H7a1 1 0 1 1 0-2h1V8a6 6 0 0 1 6-6h2a1 1 0 1 1 0 2h-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Doc: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3h10l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M17 3v5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 12h8M8 16h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  User: (
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
  ),
  Mail: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="m22 8-10 7L2 8"
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
        d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.8.3 1.6.6 2.4a2 2 0 0 1-.4 2.1L8.1 9.4a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.4.6A2 2 0 0 1 22 16.9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Calendar: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 2v3M17 2v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M3 7h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3 11h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Building: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 22h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 6h2M10 10h2M10 14h2M14 6h2M14 10h2M14 14h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
} as const;

const Profile: React.FC = () => {
  const navigate = useNavigate();

  // Placeholder data (swap with API later)
  const user = useMemo(
    () => ({
      firstName: "John",
      lastName: "Customer",
      role: "Customer",
      email: "john.customer@company.com",
      phone: "+44 20 7123 4567",
      joinedLabel: "Joined January 2025",
      jobTitle: "IT Manager",
      department: "Information Technology",
      bio: "IT Manager responsible for system maintenance and support requests.",
    }),
    []
  );

  const org = useMemo(
    () => ({
      name: "ABC Corporation",
      industry: "Technology",
      size: "50-200 employees",
      address: "123 Business Street, London, UK",
      phone: "+44 20 7123 4500",
      hint: "Contact your administrator to update organization details",
    }),
    []
  );

  const stats: StatRow[] = [
    { label: "Total Tickets", value: "15", tone: "ink" },
    { label: "Active Tickets", value: "5", tone: "blue" },
    { label: "Completed", value: "10", tone: "green" },
    { label: "Total Spent", value: "£12,450", tone: "ink" },
    { label: "Pending Quotes", value: "2", tone: "orange" },
  ];

  const account = useMemo(
    () => ({
      status: "Active",
      statusText: "Your account is currently active",
      lastLogin: "18/02/2026 at 09:30",
      userId: "USR-001",
    }),
    []
  );

  return (
    <div className="profilePage">
      {/* Slim left sidebar */}
      <aside className="pSidebar" aria-label="Sidebar navigation">
        <button
          className="pSidebarExpand"
          type="button"
          aria-label="Expand sidebar"
          title="Expand"
        >
          <span className="pSidebarExpandIcon" aria-hidden="true">
            ›
          </span>
        </button>

        <nav className="pNav" aria-label="Primary">
          <button
            className="pNavBtn"
            type="button"
            onClick={() => navigate("/customer")}
          >
            <span className="pNavIcon">{Icons.Home}</span>
          </button>
          <button
            className="pNavBtn"
            type="button"
            onClick={() => navigate("/customer/tickets")}
          >
            <span className="pNavIcon">{Icons.Ticket}</span>
          </button>
          <button
            className="pNavBtn"
            type="button"
            onClick={() => navigate("/customer/quotes")}
          >
            <span className="pNavIcon">{Icons.Pound}</span>
          </button>
          <button
            className="pNavBtn"
            type="button"
            onClick={() => navigate("/customer/history")}
          >
            <span className="pNavIcon">{Icons.Doc}</span>
          </button>
          <button
            className="pNavBtn active"
            type="button"
            onClick={() => navigate("/customer/profile")}
          >
            <span className="pNavIcon">{Icons.User}</span>
          </button>
        </nav>

        <div className="pSidebarBottom">
          <button className="pSidebarAvatar" type="button" aria-label="Account">
            <span className="pNavIcon">{Icons.User}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="pMain">
        <header className="pTop">
          <div>
            <h1 className="pTitle">Profile</h1>
            <p className="pSub">
              Manage your account information and preferences
            </p>
          </div>

          <div className="pTopRight">
            <button
              className="editBtn"
              type="button"
              onClick={() => alert("Edit Profile (placeholder)")}
            >
              ✎&nbsp; Edit Profile
            </button>
          </div>
        </header>

        <section className="pGrid">
          {/* Left column */}
          <div className="pLeft">
            <section className="card profileCard">
              <div className="bigAvatar" aria-hidden="true">
                {Icons.User}
              </div>

              <div className="profileName">
                {user.firstName} {user.lastName}
              </div>

              <div className="rolePill">{user.role}</div>

              <div className="profileMeta">
                <div className="metaRow">
                  <span className="metaIcon">{Icons.Mail}</span>
                  <span>{user.email}</span>
                </div>
                <div className="metaRow">
                  <span className="metaIcon">{Icons.Phone}</span>
                  <span>{user.phone}</span>
                </div>
                <div className="metaRow">
                  <span className="metaIcon">{Icons.Calendar}</span>
                  <span>{user.joinedLabel}</span>
                </div>
              </div>
            </section>

            <section className="card statsCard">
              <div className="cardHeaderSm">
                <div className="cardTitleSm">Statistics</div>
              </div>

              <div className="statList">
                {stats.map((s) => (
                  <div key={s.label} className="statRow">
                    <div className="statLabel">{s.label}</div>
                    <div className={`statVal ${s.tone ?? "ink"}`}>{s.value}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="pRight">
            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">Personal Information</div>
                <div className="cardSubtitle">Basic account information</div>
              </div>

              <div className="formGrid">
                <div className="field">
                  <div className="label">First Name</div>
                  <div className="inputLike">{user.firstName}</div>
                </div>

                <div className="field">
                  <div className="label">Last Name</div>
                  <div className="inputLike">{user.lastName}</div>
                </div>

                <div className="field span2">
                  <div className="label">Email Address</div>
                  <div className="inputLike">{user.email}</div>
                </div>

                <div className="field span2">
                  <div className="label">Phone Number</div>
                  <div className="inputLike">{user.phone}</div>
                </div>

                <div className="field">
                  <div className="label">Job Title</div>
                  <div className="inputLike">{user.jobTitle}</div>
                </div>

                <div className="field">
                  <div className="label">Department</div>
                  <div className="inputLike">{user.department}</div>
                </div>

                <div className="field span2">
                  <div className="label">Bio</div>
                  <div className="inputLike tall">{user.bio}</div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <div className="cardTitleRow">
                  <span className="cardIcon">{Icons.Building}</span>
                  <span className="cardTitle">Organization Information</span>
                </div>
                <div className="cardSubtitle">
                  Company details and contact information
                </div>
              </div>

              <div className="formGrid">
                <div className="field span2">
                  <div className="label">Organization Name</div>
                  <div className="inputLike">{org.name}</div>
                  <div className="hint">{org.hint}</div>
                </div>

                <div className="field">
                  <div className="label">Industry</div>
                  <div className="inputLike">{org.industry}</div>
                </div>

                <div className="field">
                  <div className="label">Company Size</div>
                  <div className="inputLike">{org.size}</div>
                </div>

                <div className="field span2">
                  <div className="label">Address</div>
                  <div className="inputLike">{org.address}</div>
                </div>

                <div className="field span2">
                  <div className="label">Organization Phone</div>
                  <div className="inputLike">{org.phone}</div>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="cardHeader">
                <div className="cardTitle">Account Status</div>
              </div>

              <div className="statusList">
                <div className="statusRow">
                  <div className="statusLeft">
                    <div className="statusTitle">Account Status</div>
                    <div className="statusText">{account.statusText}</div>
                  </div>
                  <div className="statusPill">{account.status}</div>
                </div>

                <div className="statusDivider" />

                <div className="statusRow simple">
                  <div className="statusTitle">Last Login</div>
                  <div className="statusText">{account.lastLogin}</div>
                </div>

                <div className="statusDivider" />

                <div className="statusRow simple">
                  <div className="statusTitle">User ID</div>
                  <div className="statusText mono">{account.userId}</div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;
