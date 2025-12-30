import * as SecureStore from 'expo-secure-store';
import { AuthSession, User } from '../types/User';
import { CryptoService } from './cryptoService';

export class SessionService {
  private static readonly SESSION_KEY = 'tailtracker_session';
  private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  /**
   * Creates a new secure session for the authenticated user
   */
  static async createSession(user: User): Promise<string> {
    try {
      const token = await CryptoService.generateSessionToken();
      const expiresAt = Date.now() + this.SESSION_DURATION;

      const session: AuthSession = {
        user,
        token,
        expiresAt,
      };

      await SecureStore.setItemAsync(this.SESSION_KEY, JSON.stringify(session));
      return token;
    } catch (error) {
      console.error('Session creation error:', error);
      throw new Error('Failed to create session');
    }
  }

  /**
   * Retrieves the current session if valid
   */
  static async getSession(): Promise<AuthSession | null> {
    try {
      const sessionData = await SecureStore.getItemAsync(this.SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const session: AuthSession = JSON.parse(sessionData);

      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        await this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Session retrieval error:', error);
      await this.clearSession(); // Clear corrupted session
      return null;
    }
  }

  /**
   * Updates the user information in the current session
   */
  static async updateSessionUser(user: User): Promise<void> {
    try {
      const currentSession = await this.getSession();
      if (!currentSession) {
        throw new Error('No active session found');
      }

      const updatedSession: AuthSession = {
        ...currentSession,
        user: {
          ...currentSession.user,
          ...user,
        },
      };

      await SecureStore.setItemAsync(
        this.SESSION_KEY,
        JSON.stringify(updatedSession)
      );
    } catch (error) {
      console.error('Session user update error:', error);
      throw new Error('Failed to update session user');
    }
  }

  /**
   * Extends the current session expiration time
   */
  static async extendSession(): Promise<void> {
    try {
      const currentSession = await this.getSession();
      if (!currentSession) {
        return;
      }

      const extendedSession: AuthSession = {
        ...currentSession,
        expiresAt: Date.now() + this.SESSION_DURATION,
      };

      await SecureStore.setItemAsync(
        this.SESSION_KEY,
        JSON.stringify(extendedSession)
      );
    } catch (error) {
      console.error('Session extension error:', error);
    }
  }

  /**
   * Checks if there's a valid session
   */
  static async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Gets the current user from the session
   */
  static async getCurrentUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user || null;
  }

  /**
   * Gets the current session token
   */
  static async getSessionToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.token || null;
  }

  /**
   * Clears the current session (logout)
   */
  static async clearSession(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.SESSION_KEY);
    } catch (error) {
      console.error('Session clearing error:', error);
      // Don't throw error here as we want to ensure logout always succeeds
    }
  }

  /**
   * Validates session token matches stored token
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      const session = await this.getSession();
      return session?.token === token;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}
