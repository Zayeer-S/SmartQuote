import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../../../components/Modal.js';
import { useGetOrg } from '../../../hooks/org/useGetOrg.js';
import { useListOrgMembers } from '../../../hooks/org/useListOrgMembers.js';
import { useAddOrgMember } from '../../../hooks/org/useAddOrgMembers.js';
import { useRemoveOrgMember } from '../../../hooks/org/useRemoveOrgMember.js';
import { useOrgPermissions } from '../../../hooks/auth/useOrgPermissions.js';
import { CLIENT_ROUTES } from '../../../constants/client.routes.js';
import type { OrgMemberResponse } from '../../../../shared/contracts/org-contracts.js';
import './AdminOrgMembersPage.css';

// ---------------------------------------------------------------------------
// Add member modal
// ---------------------------------------------------------------------------

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  orgId: string;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAdded, orgId }) => {
  const [email, setEmail] = useState('');
  const { execute, loading, error } = useAddOrgMember();

  const handleClose = (): void => {
    setEmail('');
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!email.trim()) return;
    await execute(orgId, email.trim());
    if (!error) {
      onAdded();
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add member" testId="add-member-modal">
      <div className="field-group">
        <label className="field-label" htmlFor="add-member-email-input">
          Email
        </label>
        <input
          id="add-member-email-input"
          className="field-input"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          disabled={loading}
          data-testid="add-member-email-input"
        />
      </div>
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-org-members-modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={loading || !email.trim()}
          data-testid="add-member-submit-btn"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Remove member modal
// ---------------------------------------------------------------------------

interface RemoveMemberModalProps {
  member: OrgMemberResponse | null;
  orgId: string;
  onClose: () => void;
  onRemoved: () => void;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
  member,
  orgId,
  onClose,
  onRemoved,
}) => {
  const { execute, loading, error } = useRemoveOrgMember();

  const handleConfirm = async (): Promise<void> => {
    if (!member) return;
    await execute(orgId, member.userId);
    if (!error) {
      onRemoved();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={member !== null}
      onClose={onClose}
      title="Remove member"
      description={
        member
          ? `Are you sure you want to remove ${member.firstName} ${member.lastName} (${member.email}) from this organisation?`
          : undefined
      }
      testId="remove-member-modal"
    >
      {error && (
        <p className="feedback-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-org-members-modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => {
            void handleConfirm();
          }}
          disabled={loading}
          data-testid="remove-member-confirm-btn"
        >
          {loading ? 'Removing...' : 'Remove'}
        </button>
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AdminOrgMembersPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const { data: orgData, loading: orgLoading, execute: fetchOrg } = useGetOrg();
  const {
    data: membersData,
    loading: membersLoading,
    error: membersError,
    execute: fetchMembers,
  } = useListOrgMembers();

  // System-level RBAC -- 403 from the API is the enforcer for org-scoped writes
  const { canUpdate, canDelete } = useOrgPermissions();

  const [showAdd, setShowAdd] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrgMemberResponse | null>(null);

  useEffect(() => {
    if (!orgId) return;
    void fetchOrg(orgId);
    void fetchMembers(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  if (!orgId) return null;

  const org = orgData;
  const members = membersData?.members ?? [];
  const pageLoading = orgLoading || membersLoading;

  return (
    <div className="admin-org-members-page" data-testid="admin-org-members-page">
      <div className="admin-org-members-header">
        <button
          type="button"
          className="btn btn-ghost btn-sm admin-org-members-back"
          onClick={() => {
            void navigate(CLIENT_ROUTES.ADMIN.ORGANIZATIONS_LIST);
          }}
          data-testid="back-to-orgs-btn"
        >
          {/* Left arrow */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M9 2L4 7L9 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Organisations
        </button>

        <div className="admin-org-members-heading-row">
          <div>
            <h1 className="admin-org-members-title">{org ? org.name : 'Organisation members'}</h1>
            <p className="admin-org-members-subtitle">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canUpdate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowAdd(true);
              }}
              data-testid="add-member-btn"
            >
              + Add member
            </button>
          )}
        </div>
      </div>

      {pageLoading && <p className="loading-text">Loading...</p>}
      {membersError && (
        <p className="feedback-error" role="alert">
          {membersError}
        </p>
      )}

      {!pageLoading && !membersError && members.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-message">No members in this organisation yet.</p>
        </div>
      )}

      {members.length > 0 && (
        <div className="admin-org-members-list" role="list">
          {members.map((member) => (
            <div
              key={member.userId}
              className="card admin-org-members-row"
              role="listitem"
              data-testid={`member-row-${member.email}`}
            >
              <div className="admin-org-members-row-info">
                <span className="admin-org-members-row-name">
                  {member.firstName} {member.lastName}
                </span>
                <span className="admin-org-members-row-email">{member.email}</span>
              </div>
              {canDelete && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => {
                    setRemoveTarget(member);
                  }}
                  data-testid={`remove-member-btn-${member.email}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddMemberModal
        isOpen={showAdd}
        onClose={() => {
          setShowAdd(false);
        }}
        onAdded={() => {
          void fetchMembers(orgId);
        }}
        orgId={orgId}
      />
      <RemoveMemberModal
        member={removeTarget}
        orgId={orgId}
        onClose={() => {
          setRemoveTarget(null);
        }}
        onRemoved={() => {
          void fetchMembers(orgId);
        }}
      />
    </div>
  );
};

export default AdminOrgMembersPage;
