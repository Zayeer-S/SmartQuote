import React, { useMemo, useState } from 'react';
import type { GetCurrentUserResponse } from '../../../shared/contracts/auth-contracts';
import { useOrganizationDirectory } from '../../hooks/useOrganizationDirectory';
import type { MemberFormValues, OrganizationMemberStatus } from './organizationDirectory.types';
import './OrganizationDirectory.css';

const MEMBER_STATUSES: OrganizationMemberStatus[] = ['Active', 'Invited', 'Inactive'];

const createInitialValues = (organizationId = ''): MemberFormValues => ({
  organizationId,
  firstName: '',
  lastName: '',
  email: '',
  roleTitle: '',
  status: 'Active',
});

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  scope: 'customer' | 'admin';
  user: GetCurrentUserResponse | null;
}

const MemberDirectoryManager: React.FC<Props> = ({ scope, user }) => {
  const { members, organizations, createMember, updateMember, deleteMember } =
    useOrganizationDirectory(user);

  const defaultOrganizationId =
    scope === 'customer' ? (user?.organizationId ?? '') : (organizations[0]?.id ?? '');

  const [values, setValues] = useState<MemberFormValues>(
    createInitialValues(defaultOrganizationId)
  );
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all');

  const visibleMembers = useMemo(() => {
    if (scope === 'customer') {
      return members.filter((member) => member.organizationId === user?.organizationId);
    }

    if (selectedOrganizationId === 'all') {
      return members;
    }

    return members.filter((member) => member.organizationId === selectedOrganizationId);
  }, [members, scope, selectedOrganizationId, user?.organizationId]);

  const organizationLookup = useMemo(
    () =>
      new Map(organizations.map((organization) => [organization.id, organization.name] as const)),
    [organizations]
  );

  const activeOrganizationName =
    organizationLookup.get(user?.organizationId ?? '') ?? 'your organisation';

  const handleChange = <K extends keyof MemberFormValues>(
    key: K,
    nextValue: MemberFormValues[K]
  ) => {
    setValues((current) => ({
      ...current,
      [key]: nextValue,
    }));
  };

  const resetForm = () => {
    setEditingMemberId(null);
    setValues(
      createInitialValues(
        scope === 'customer'
          ? (user?.organizationId ?? '')
          : selectedOrganizationId === 'all'
            ? (organizations[0]?.id ?? '')
            : selectedOrganizationId
      )
    );
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: MemberFormValues = {
      ...values,
      organizationId: scope === 'customer' ? (user?.organizationId ?? '') : values.organizationId,
    };

    if (!payload.organizationId) return;

    if (editingMemberId) {
      updateMember(editingMemberId, payload);
    } else {
      createMember(payload);
    }

    resetForm();
  };

  const handleEdit = (memberId: string) => {
    const member = members.find((item) => item.id === memberId);
    if (!member) return;

    setEditingMemberId(member.id);
    setValues({
      organizationId: member.organizationId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      roleTitle: member.roleTitle,
      status: member.status,
    });
  };

  if (scope === 'customer' && !user?.organizationId) {
    return (
      <div className="directory-page" data-testid="customer-organization-members-page">
        <div className="page-header">
          <h1 className="page-title">Organisation Members</h1>
        </div>
        <div className="card card-padded empty-state">
          <p className="empty-state-message">
            Your account is not assigned to an organisation yet, so member management is not
            available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="directory-page"
      data-testid={
        scope === 'customer'
          ? 'customer-organization-members-page'
          : 'admin-organization-members-page'
      }
    >
      <header className="directory-hero">
        <div>
          <h1 className="page-title directory-title">
            {scope === 'customer' ? 'Organisation Members' : 'Organisation Member Directory'}
          </h1>
          <p className="directory-description">
            {scope === 'customer'
              ? `Add, edit, and remove members for ${activeOrganizationName}. This uses a temporary frontend data store until backend CRUD endpoints are available.`
              : 'Manage organisation members across all customer accounts. Changes are persisted locally for now and can be swapped to backend APIs later.'}
          </p>
          <div className="directory-meta">
            <span className="directory-badge">{visibleMembers.length} member(s)</span>
            <span className="directory-badge">{organizations.length} organisation(s)</span>
          </div>
        </div>
      </header>

      <div className="directory-grid">
        <section className="card card-padded directory-card">
          <div className="directory-card-header">
            <div>
              <h2>{editingMemberId ? 'Edit Member' : 'Add Member'}</h2>
              <p>
                {scope === 'customer'
                  ? 'Members are added to your current organisation.'
                  : 'Choose an organisation before saving the member.'}
              </p>
            </div>
          </div>

          <form className="directory-form" onSubmit={handleSubmit}>
            {scope === 'admin' && (
              <div>
                <label className="field-label" htmlFor="member-organization">
                  Organisation
                </label>
                <select
                  id="member-organization"
                  className="field-input"
                  value={values.organizationId}
                  onChange={(event) => {
                    handleChange('organizationId', event.target.value);
                  }}
                  required
                >
                  <option value="">Select organisation</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="directory-form-grid">
              <div>
                <label className="field-label" htmlFor="member-first-name">
                  First Name
                </label>
                <input
                  id="member-first-name"
                  className="field-input"
                  value={values.firstName}
                  onChange={(event) => {
                    handleChange('firstName', event.target.value);
                  }}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="member-last-name">
                  Last Name
                </label>
                <input
                  id="member-last-name"
                  className="field-input"
                  value={values.lastName}
                  onChange={(event) => {
                    handleChange('lastName', event.target.value);
                  }}
                  required
                />
              </div>
            </div>

            <div className="directory-form-grid">
              <div>
                <label className="field-label" htmlFor="member-email">
                  Email
                </label>
                <input
                  id="member-email"
                  type="email"
                  className="field-input"
                  value={values.email}
                  onChange={(event) => {
                    handleChange('email', event.target.value);
                  }}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="member-role-title">
                  Role Title
                </label>
                <input
                  id="member-role-title"
                  className="field-input"
                  value={values.roleTitle}
                  onChange={(event) => {
                    handleChange('roleTitle', event.target.value);
                  }}
                  placeholder="e.g. Operations Manager"
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="member-status">
                Status
              </label>
              <select
                id="member-status"
                className="field-input"
                value={values.status}
                onChange={(event) => {
                  handleChange('status', event.target.value as OrganizationMemberStatus);
                }}
              >
                {MEMBER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="directory-form-actions">
              <button type="submit" className="btn btn-primary">
                {editingMemberId ? 'Save Changes' : 'Add Member'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="card card-padded directory-card">
          <div className="directory-toolbar">
            <div className="directory-card-header">
              <div>
                <h2>Members</h2>
                <p>Maintain membership records directly from the sidebar section.</p>
              </div>
            </div>

            {scope === 'admin' && (
              <div className="directory-filter">
                <label className="field-label" htmlFor="member-filter-organization">
                  Filter by Organisation
                </label>
                <select
                  id="member-filter-organization"
                  className="field-input"
                  value={selectedOrganizationId}
                  onChange={(event) => {
                    setSelectedOrganizationId(event.target.value);
                    if (!editingMemberId) {
                      setValues((current) => ({
                        ...current,
                        organizationId:
                          event.target.value === 'all'
                            ? current.organizationId
                            : event.target.value,
                      }));
                    }
                  }}
                >
                  <option value="all">All organisations</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="directory-table-wrap">
            <table className="admin-table" aria-label="Organisation members">
              <thead>
                <tr>
                  <th scope="col">Member</th>
                  <th scope="col">Organisation</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Added</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <p className="empty-state-message">No members found for this view yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="directory-name-cell">
                          <strong>{`${member.firstName} ${member.lastName}`}</strong>
                          <span className="directory-subtext">{member.email}</span>
                        </div>
                      </td>
                      <td>
                        {organizationLookup.get(member.organizationId) ?? 'Unknown organisation'}
                      </td>
                      <td>{member.roleTitle}</td>
                      <td>
                        <span
                          className={[
                            'directory-status',
                            `directory-status-${member.status.toLowerCase()}`,
                          ].join(' ')}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td>{formatDate(member.createdAt)}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              handleEdit(member.id);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              deleteMember(member.id);
                              if (editingMemberId === member.id) {
                                resetForm();
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MemberDirectoryManager;
