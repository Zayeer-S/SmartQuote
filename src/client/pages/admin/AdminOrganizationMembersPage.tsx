import React from 'react';
import MemberDirectoryManager from '../../features/organizationDirectory/MemberDirectoryManager';
import { useAuth } from '../../hooks/contexts/useAuth';

const AdminOrganizationMembersPage: React.FC = () => {
  const { user } = useAuth();

  return <MemberDirectoryManager scope="admin" user={user} />;
};

export default AdminOrganizationMembersPage;
