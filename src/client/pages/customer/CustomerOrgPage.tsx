import React, { useEffect, useState } from 'react';
import Modal from '../../components/Modal.js';
import { useGetMyOrg } from '../../hooks/org/useGetMyOrg.js';
import { useListOrgMembers } from '../../hooks/org/useListOrgMembers.js';
import { useAddOrgMember } from '../../hooks/org/useAddOrgMembers.js';
import { useRemoveOrgMember } from '../../hooks/org/useRemoveOrgMember.js';
import type { OrgMemberResponse } from '../../../shared/contracts/org-contracts.js';
import './CustomerOrgPage.css';

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
  const [userId, setUserId] = useState('');
  const { execute, loading, error } = useAddOrgMember();

  // A 403 surfaces naturally through the error field -- no special casing needed
  const is403 = error?.toLowerCase().includes('forbidden') ?? error?.toLowerCase().includes('403');

  const handleClose = (): void => {
    setUserId('');
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!userId.trim()) return;
    await execute(orgId, userId.trim());
    if (!error) {
      onAdded();
      handleClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add member" testId="add-member-modal">
      <div className="field-group">
        <label className="field-label" htmlFor="customer-add-member-userid-input">
          User ID
        </label>
        <input
          id="customer-add-member-userid-input"
          className="field-input"
          type="text"
          placeholder="Enter user ID"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value);
          }}
          disabled={loading}
          data-testid="add-member-userid-input"
        />
      </div>
      {error && (
        <p className="feedback-error" role="alert">
          {is403 ? "You don't have permission to add members." : error}
        </p>
      )}
      <div className="customer-org-modal-actions">
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
          disabled={loading || !userId.trim()}
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

  const is403 = error?.toLowerCase().includes('forbidden') ?? error?.toLowerCase().includes('403');

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
          ? `Are you sure you want to remove user "${member.userId}" from the organisation?`
          : undefined
      }
      testId="remove-member-modal"
    >
      {error && (
        <p className="feedback-error" role="alert">
          {is403 ? "You don't have permission to remove members." : error}
        </p>
      )}
      <div className="customer-org-modal-actions">
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

const CustomerOrgPage: React.FC = () => {
  const { data: org, loading: orgLoading, error: orgError, execute: fetchMyOrg } = useGetMyOrg();
  const {
    data: membersData,
    loading: membersLoading,
    error: membersError,
    execute: fetchMembers,
  } = useListOrgMembers();

  const [showAdd, setShowAdd] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrgMemberResponse | null>(null);

  useEffect(() => {
    void fetchMyOrg();
    // fetchMyOrg is a new reference each render by hook design; mount-only is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (org?.id) void fetchMembers(org.id);
    // fetchMembers is a new reference each render by hook design; org.id is the only meaningful dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org?.id]);

  const members = membersData?.members ?? [];
  const pageLoading = orgLoading || (org !== null && membersLoading);

  // ---------------------------------------------------------------------------
  // No org state
  // ---------------------------------------------------------------------------
  if (!orgLoading && !orgError && org === null) {
    return (
      <div className="customer-org-page" data-testid="customer-org-page">
        <div className="customer-org-header">
          <h1 className="customer-org-title">Organisation</h1>
        </div>
        <div className="empty-state">
          <p className="empty-state-message">
            You are not a member of any organisation. Contact an administrator if this is incorrect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-org-page" data-testid="customer-org-page">
      <div className="customer-org-header">
        <div>
          <h1 className="customer-org-title">{org?.name ?? 'Organisation'}</h1>
          {!pageLoading && (
            <p className="customer-org-subtitle">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {/* Show add button for everyone -- backend enforces via 403 */}
        {org && (
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

      {pageLoading && <p className="loading-text">Loading members...</p>}
      {orgError && (
        <p className="feedback-error" role="alert">
          {orgError}
        </p>
      )}
      {membersError && (
        <p className="feedback-error" role="alert">
          {membersError}
        </p>
      )}

      {!pageLoading && !membersError && org && members.length === 0 && (
        <div className="empty-state">
          <p className="empty-state-message">No members yet.</p>
        </div>
      )}

      {members.length > 0 && (
        <div className="customer-org-members-list" role="list">
          {members.map((member) => (
            <div
              key={member.userId}
              className="card customer-org-member-row"
              role="listitem"
              data-testid={`member-row-${member.userId}`}
            >
              <div className="customer-org-member-row-info">
                <span className="customer-org-member-row-userid">{member.userId}</span>
                <span className="customer-org-member-row-meta">Role ID: {member.orgRoleId}</span>
              </div>
              {/* Show remove for everyone -- backend enforces via 403 */}
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => {
                  setRemoveTarget(member);
                }}
                data-testid={`remove-member-btn-${member.userId}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {org && (
        <>
          <AddMemberModal
            isOpen={showAdd}
            onClose={() => {
              setShowAdd(false);
            }}
            onAdded={() => {
              void fetchMembers(org.id);
            }}
            orgId={org.id}
          />
          <RemoveMemberModal
            member={removeTarget}
            orgId={org.id}
            onClose={() => {
              setRemoveTarget(null);
            }}
            onRemoved={() => {
              void fetchMembers(org.id);
            }}
          />
        </>
      )}
    </div>
  );
};

export default CustomerOrgPage;
