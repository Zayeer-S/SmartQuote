import React from 'react';
import MemberDirectoryManager from '../../features/organizationDirectory/MemberDirectoryManager';
import { useAuth } from '../../hooks/contexts/useAuth';

const CustomerOrganizationMembersPage: React.FC = () => {
  const { user } = useAuth();

  return <MemberDirectoryManager scope="customer" user={user} />;
};

export default CustomerOrganizationMembersPage;
