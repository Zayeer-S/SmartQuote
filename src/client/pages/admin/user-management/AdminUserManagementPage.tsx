import React from 'react';
import './AdminUserManagementPage.css';

const AdminUserManagementPage: React.FC = () => {
  return (
    <div className="admin-page" data-testid="admin-user-management-page">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled
          data-testid="add-user-btn"
        >
          Add User
        </button>
      </div>
      <p className="admin-page-description">
        Create and manage support agents, managers, and admin accounts. Customer accounts are
        managed separately through the customer portal.
      </p>

      <div className="card">
        <table className="admin-table" aria-label="Users" data-testid="users-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Organisation</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr data-testid="users-table-empty-row">
              <td colSpan={5}>
                <div className="empty-state">
                  <p className="empty-state-message">User management coming soon.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUserManagementPage;
