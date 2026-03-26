import React, { useState } from 'react';
import type { GetCurrentUserResponse } from '../../../shared/contracts/auth-contracts';
import { useOrganizationDirectory } from '../../hooks/useOrganizationDirectory';
import type { OrganizationFormValues, OrganizationStatus } from './organizationDirectory.types';
import './OrganizationDirectory.css';

const ORGANIZATION_STATUSES: OrganizationStatus[] = ['Active', 'Inactive'];

const initialValues: OrganizationFormValues = {
  name: '',
  domain: '',
  contactEmail: '',
  status: 'Active',
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface Props {
  user: GetCurrentUserResponse | null;
}

const OrganizationDirectoryManager: React.FC<Props> = ({ user }) => {
  const { organizations, members, createOrganization, updateOrganization, deleteOrganization } =
    useOrganizationDirectory(user);
  const [values, setValues] = useState<OrganizationFormValues>(initialValues);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);

  const handleChange = <K extends keyof OrganizationFormValues>(
    key: K,
    nextValue: OrganizationFormValues[K]
  ) => {
    setValues((current) => ({
      ...current,
      [key]: nextValue,
    }));
  };

  const resetForm = () => {
    setEditingOrganizationId(null);
    setValues(initialValues);
  };

  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingOrganizationId) {
      updateOrganization(editingOrganizationId, values);
    } else {
      createOrganization(values);
    }

    resetForm();
  };

  const handleEdit = (organizationId: string) => {
    const organization = organizations.find((item) => item.id === organizationId);
    if (!organization) return;

    setEditingOrganizationId(organizationId);
    setValues({
      name: organization.name,
      domain: organization.domain,
      contactEmail: organization.contactEmail,
      status: organization.status,
    });
  };

  return (
    <div className="directory-page" data-testid="admin-organizations-page">
      <header className="directory-hero">
        <div>
          <h1 className="page-title directory-title">Organisations</h1>
          <p className="directory-description">
            Create, update, and remove customer organisations from the admin sidebar. This is wired
            to temporary frontend persistence until the backend CRUD endpoints are added.
          </p>
          <div className="directory-meta">
            <span className="directory-badge">{organizations.length} organisation(s)</span>
            <span className="directory-badge">{members.length} linked member(s)</span>
          </div>
        </div>
      </header>

      <div className="directory-grid">
        <section className="card card-padded directory-card">
          <div className="directory-card-header">
            <div>
              <h2>{editingOrganizationId ? 'Edit Organisation' : 'Add Organisation'}</h2>
              <p>
                Changes are saved locally and reflected immediately in admin and customer pages.
              </p>
            </div>
          </div>

          <form className="directory-form" onSubmit={handleSubmit}>
            <div>
              <label className="field-label" htmlFor="organization-name">
                Organisation Name
              </label>
              <input
                id="organization-name"
                className="field-input"
                value={values.name}
                onChange={(event) => {
                  handleChange('name', event.target.value);
                }}
                required
              />
            </div>

            <div className="directory-form-grid">
              <div>
                <label className="field-label" htmlFor="organization-domain">
                  Domain
                </label>
                <input
                  id="organization-domain"
                  className="field-input"
                  value={values.domain}
                  onChange={(event) => {
                    handleChange('domain', event.target.value);
                  }}
                  placeholder="company.example"
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="organization-email">
                  Contact Email
                </label>
                <input
                  id="organization-email"
                  type="email"
                  className="field-input"
                  value={values.contactEmail}
                  onChange={(event) => {
                    handleChange('contactEmail', event.target.value);
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="organization-status">
                Status
              </label>
              <select
                id="organization-status"
                className="field-input"
                value={values.status}
                onChange={(event) => {
                  handleChange('status', event.target.value as OrganizationStatus);
                }}
              >
                {ORGANIZATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="directory-form-actions">
              <button type="submit" className="btn btn-primary">
                {editingOrganizationId ? 'Save Changes' : 'Add Organisation'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="card card-padded directory-card">
          <div className="directory-card-header">
            <div>
              <h2>Organisation Directory</h2>
              <p>Deleting an organisation also removes any locally stored member records for it.</p>
            </div>
          </div>

          <div className="directory-table-wrap">
            <table className="admin-table" aria-label="Organisations">
              <thead>
                <tr>
                  <th scope="col">Organisation</th>
                  <th scope="col">Domain</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Members</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <p className="empty-state-message">No organisations have been added yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  organizations.map((organization) => (
                    <tr key={organization.id}>
                      <td>
                        <div className="directory-name-cell">
                          <strong>{organization.name}</strong>
                          <span className="directory-subtext">{organization.id}</span>
                        </div>
                      </td>
                      <td>{organization.domain}</td>
                      <td>{organization.contactEmail}</td>
                      <td>
                        {
                          members.filter((member) => member.organizationId === organization.id)
                            .length
                        }
                      </td>
                      <td>
                        <span
                          className={[
                            'directory-status',
                            `directory-status-${organization.status.toLowerCase()}`,
                          ].join(' ')}
                        >
                          {organization.status}
                        </span>
                      </td>
                      <td>{formatDate(organization.createdAt)}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              handleEdit(organization.id);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              deleteOrganization(organization.id);
                              if (editingOrganizationId === organization.id) {
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

export default OrganizationDirectoryManager;
