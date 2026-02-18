export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    role: {
      id: number;
      name: string;
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LogoutRequest {
  // Token comes from Authorization header
}

export interface LogoutResponse {
  message: string;
}

export interface GetCurrentUserResponse {
  id: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  emailVerified: boolean;
  phoneNumber: string;
  role: {
    id: number;
    name: string;
  };
  organizationId: string | null;
  createdAt: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface GetCurrentUserPermissionsResponse {
  permissions: string[];
}
