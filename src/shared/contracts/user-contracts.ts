export interface CreateUserRequest {
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string;
  password: string;
  roleId: number;
  organizationId?: string;
}

export interface CreateUserResponse {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string;
  role: {
    id: number;
    name: string;
  };
  organizationId: string | null;
  createdAt: string;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string;
  emailVerified: boolean;
  role: {
    id: number;
    name: string;
  };
  organizationId: string | null;
  createdAt: string;
}

export interface ListUsersResponse {
  users: UserListItem[];
  total: number;
}
