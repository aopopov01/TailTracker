/**
 * User entity following consistent architectural patterns
 * @deprecated Use User interface from ./index.ts instead
 * This file maintained for backward compatibility
 */
export interface User {
  /** Unique identifier - converted to string for consistency */
  id: string;
  /** User's email address */
  email: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** ISO 8601 timestamp of account creation */
  createdAt: string;
  /** ISO 8601 timestamp of last profile update */
  updatedAt: string;
  /** ISO 8601 timestamp of last login */
  lastLoginAt?: string;
  /** Optional profile picture URL */
  profilePictureUrl?: string;
}

/**
 * @deprecated Use UserCredentials from ./index.ts instead
 */
export interface UserCredentials {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * @deprecated Use UserRegistration from ./index.ts instead
 */
export interface UserRegistration extends UserCredentials {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** Password confirmation */
  confirmPassword: string;
}

/**
 * @deprecated Use AuthSession from ./index.ts instead
 */
export interface AuthSession {
  /** Authenticated user details */
  user: User;
  /** JWT access token */
  token: string;
  /** Unix timestamp when token expires */
  expiresAt: number;
}

/**
 * @deprecated Use AuthResult from ./index.ts instead
 */
export interface LoginResult {
  /** Whether the login was successful */
  success: boolean;
  /** User data if successful */
  user?: User;
  /** Session token if successful */
  token?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * @deprecated Use AuthResult from ./index.ts instead
 */
export interface RegistrationResult {
  /** Whether the registration was successful */
  success: boolean;
  /** User data if successful */
  user?: User;
  /** Error message if failed */
  error?: string;
  /** Email verification has been disabled for better UX */
  requiresEmailVerification?: boolean;
  /** Whether SMTP timeout occurred during registration */
  smtpDelay?: boolean;
  /** Refresh token if session created */
  refreshToken?: string;
}