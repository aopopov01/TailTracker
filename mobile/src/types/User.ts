export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: User;
  error?: string;
}