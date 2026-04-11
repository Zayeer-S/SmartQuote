import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../../../components/Modal.js';
import { useListOrgs } from '../../../hooks/org/useListOrgs.js';
import { useCreateOrg } from '../../../hooks/org/useCreateOrg.js';
import { useUpdateOrg } from '../../../hooks/org/useUpdateOrg.js';
import { useDeleteOrg } from '../../../hooks/org/useDeleteOrg.js';
import { useOrgPermissions } from '../../../hooks/auth/useOrgPermissions.js';
import { CLIENT_ROUTES } from '../../../constants/client.routes.js';
import type { OrgResponse } from '../../../../shared/contracts/org-contracts.js';
import './AdminOrgsPage.css';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const CreateOrgModal: React.FC<CreateOrgModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const { execute, loading, error } = useCreateOrg();

  const handleClose = (): void => {
    setName('');
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim()) return;
    const err = await execute({ name: name.trim() });
    if (!err) {
      onCreated();
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create organisation"
      testId="create-org-modal"
    >
      <div className="field-group">
        <label className="field-label" htmlFor="org-name-input">
          Name
        </label>
        <input
          id="org-name-input"
          className="field-input"
          type="text"
          placeholder="Acme Ltd"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          disabled={loading}
          data-testid="org-name-input"
        />
      </div>
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-orgs-modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClose}
          disabled={loading}
          data-testid="cancel-btn"
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={loading || !name.trim()}
          data-testid="create-org-submit-btn"
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
    </Modal>
  );
};

interface EditOrgModalProps {
  org: OrgResponse | null;
  onClose: () => void;
  onUpdated: () => void;
}

const EditOrgModal: React.FC<EditOrgModalProps> = ({ org, onClose, onUpdated }) => {
  const [name, setName] = useState(org?.name ?? '');
  const { execute, loading, error } = useUpdateOrg();

  const handleSubmit = async (): Promise<void> => {
    if (!org || !name.trim()) return;
    const err = await execute(org.id, { name: name.trim() });
    if (!err) {
      onUpdated();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={org !== null}
      onClose={onClose}
      title="Edit organisation"
      testId="edit-org-modal"
    >
      <div className="field-group">
        <label className="field-label" htmlFor="edit-org-name-input">
          Name
        </label>
        <input
          id="edit-org-name-input"
          className="field-input"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          disabled={loading}
          data-testid="edit-org-name-input"
        />
      </div>
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-orgs-modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
          data-testid="cancel-btn"
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={loading || !name.trim()}
          data-testid="edit-org-submit-btn"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
};

interface DeleteOrgModalProps {
  org: OrgResponse | null;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteOrgModal: React.FC<DeleteOrgModalProps> = ({ org, onClose, onDeleted }) => {
  const { execute, loading, error } = useDeleteOrg();

  const handleConfirm = async (): Promise<void> => {
    if (!org) return;
    const err = await execute(org.id);
    if (!err) {
      onDeleted();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={org !== null}
      onClose={onClose}
      title="Delete organisation"
      description={
        org ? `Are you sure you want to delete "${org.name}"? This cannot be undone.` : undefined
      }
      testId="delete-org-modal"
    >
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-orgs-modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={loading}
          data-testid="cancel-btn"
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            void handleConfirm();
          }}
          disabled={loading}
          data-testid="delete-org-confirm-btn"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
};

const AdminOrgsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading, error, execute: fetchOrgs } = useListOrgs();
  const { canCreate, canUpdate, canDelete } = useOrgPermissions();

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgResponse | null>(null);

  useEffect(() => {
    void fetchOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orgs = data?.organizations ?? [];

  return (
    <div className="admin-orgs-page" data-testid="admin-orgs-page">
      <div className="admin-orgs-header">
        <div>
          <h1 className="admin-orgs-title">Organisations</h1>
          <p className="admin-orgs-subtitle">
            {orgs.length} organisation{orgs.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowCreate(true);
            }}
            data-testid="create-org-btn"
          >
            + New organisation
          </button>
        )}
      </div>

      {loading && <p className="loading-text">Loading organisations...</p>}
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && orgs.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-message">No organisations yet. Create one to get started.</p>
        </div>
      )}

      {orgs.length > 0 && (
        <div className="admin-orgs-list" role="list">
          {orgs.map((org) => (
            <div
              key={org.id}
              className="card admin-orgs-row"
              role="listitem"
              data-testid={`org-row-${org.id}`}
            >
              <div className="admin-orgs-row-info">
                <span className="admin-orgs-row-name">{org.name}</span>
                <span
                  className={`admin-orgs-row-status ${org.isActive ? 'admin-orgs-row-status--active' : 'admin-orgs-row-status--inactive'}`}
                >
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="admin-orgs-row-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    void navigate(CLIENT_ROUTES.ADMIN.ORGANIZATION_MEMBERS(org.id));
                  }}
                  data-testid={`org-members-btn-${org.id}`}
                >
                  Members
                </button>
                {canUpdate && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditTarget(org);
                    }}
                    data-testid={`org-edit-btn-${org.id}`}
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => {
                      setDeleteTarget(org);
                    }}
                    data-testid={`org-delete-btn-${org.id}`}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateOrgModal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
        }}
        onCreated={() => {
          void fetchOrgs();
        }}
      />
      <EditOrgModal
        org={editTarget}
        onClose={() => {
          setEditTarget(null);
        }}
        onUpdated={() => {
          void fetchOrgs();
        }}
      />
      <DeleteOrgModal
        org={deleteTarget}
        onClose={() => {
          setDeleteTarget(null);
        }}
        onDeleted={() => {
          void fetchOrgs();
        }}
      />
    </div>
  );
};

export default AdminOrgsPage;
