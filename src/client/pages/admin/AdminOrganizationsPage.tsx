import React from 'react';
import OrganizationDirectoryManager from '../../features/organizationDirectory/OrganizationDirectoryManager';
import { useAuth } from '../../hooks/contexts/useAuth';

const AdminOrganizationsPage: React.FC = () => {
  const { user } = useAuth();

  return <OrganizationDirectoryManager user={user} />;
};

export default AdminOrganizationsPage;
