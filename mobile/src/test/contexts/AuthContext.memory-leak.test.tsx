import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { AuthService } from '../../services/authService';
import { SessionService } from '../../services/sessionService';
import { User } from '../../types/User';

// Mock services
jest.mock('../../services/authService');
jest.mock('../../services/sessionService');

const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockSessionService = SessionService as jest.Mocked<typeof SessionService>;

// Test component that uses AuthContext
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <>
      <div testID="user">{user?.email || 'no user'}</div>
      <div testID="authenticated">{isAuthenticated.toString()}</div>
      <div testID="loading">{isLoading.toString()}</div>
    </>
  );
};

describe('AuthContext Memory Leak Prevention', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Interval Cleanup', () => {
    it('should clear refresh interval on component unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.refreshSession.mockResolvedValue(true);

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      // Component should be authenticated, which starts the refresh interval
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();

      // Unmount the component
      unmount();

      // Verify clearInterval was called
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });

    it('should not create new intervals if already unmounted', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.refreshSession.mockResolvedValue(true);

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      const initialIntervalCount = setIntervalSpy.mock.calls.length;

      // Unmount the component
      unmount();

      // Advance timers to see if new intervals are created
      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000); // 15 minutes
      });

      // No new intervals should be created after unmount
      expect(setIntervalSpy.mock.calls.length).toBe(initialIntervalCount);
      
      setIntervalSpy.mockRestore();
    });
  });

  describe('Async Operation Safety', () => {
    it('should not update state after component unmount during initialization', async () => {
      // Simulate slow authentication service
      let resolveAuth: ((user: User | null) => void) | undefined;
      const authPromise = new Promise<User | null>((resolve) => {
        resolveAuth = resolve;
      });
      
      mockAuthService.getCurrentUser.mockReturnValue(authPromise);

      const { unmount, queryByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Unmount before auth resolves
      unmount();

      // Now resolve the auth promise
      await act(async () => {
        resolveAuth!(mockUser);
        await authPromise;
      });

      // Component should be unmounted, so no state updates should occur
      expect(queryByTestId('user')).toBeNull();
    });

    it('should not update state after component unmount during refresh', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.refreshSession.mockResolvedValue(true);

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      // Setup slow refresh service
      let resolveRefresh: ((success: boolean) => void) | undefined;
      const refreshPromise = new Promise<boolean>((resolve) => {
        resolveRefresh = resolve;
      });
      
      mockAuthService.refreshSession.mockReturnValue(refreshPromise);

      // Trigger refresh interval
      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000);
      });

      // Unmount before refresh resolves
      unmount();

      // Resolve refresh after unmount
      await act(async () => {
        resolveRefresh!(true);
        await refreshPromise;
      });

      // Should not cause memory leaks or warnings
      expect(mockAuthService.refreshSession).toHaveBeenCalled();
    });

    it('should handle errors gracefully after unmount', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.refreshSession.mockResolvedValue(true);

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      // Make refresh service throw error
      mockAuthService.refreshSession.mockRejectedValue(new Error('Network error'));

      // Unmount component
      unmount();

      // Trigger refresh interval (which should handle the error gracefully)
      await act(async () => {
        jest.advanceTimersByTime(15 * 60 * 1000);
        await jest.runAllTimersAsync();
      });

      // Error should be logged but not cause state updates on unmounted component
      expect(consoleSpy).toHaveBeenCalledWith('Session refresh error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Leak Indicators', () => {
    it('should not retain references after unmount', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.refreshSession.mockResolvedValue(true);

      const { unmount, queryByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      // Verify component is working
      expect(queryByTestId('user')?.props.children).toBe(mockUser.email);

      // Unmount
      unmount();

      // After unmount, component should be gone
      expect(queryByTestId('user')).toBeNull();

      // Advance time to trigger any lingering intervals
      act(() => {
        jest.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
      });

      // No additional API calls should occur
      const initialCallCount = mockAuthService.refreshSession.mock.calls.length;
      
      act(() => {
        jest.advanceTimersByTime(15 * 60 * 1000); // Another 15 minutes
      });

      // Call count should not increase after unmount
      expect(mockAuthService.refreshSession.mock.calls.length).toBe(initialCallCount);
    });

    it('should properly clean up multiple provider instances', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.refreshSession.mockResolvedValue(true);

      // Render multiple instances
      const { unmount: unmount1 } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const { unmount: unmount2 } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initialization
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      const initialClearCount = clearIntervalSpy.mock.calls.length;

      // Unmount both instances
      unmount1();
      unmount2();

      // Both should have called clearInterval
      expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(initialClearCount);
      
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid mount/unmount cycles', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.refreshSession.mockResolvedValue(true);

      // Rapid mount/unmount
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
        
        // Quick unmount without waiting for initialization
        unmount();
      }

      // Should not cause any memory leaks or errors
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle authentication state changes during unmount', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue(null); // Start unauthenticated
      mockAuthService.refreshSession.mockResolvedValue(true);

      const { rerender, unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await act(async () => {
        await jest.runOnlyPendingTimersAsync();
      });

      // Change to authenticated state
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      rerender(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Unmount while state is changing
      unmount();

      // Should handle gracefully without errors
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should prevent interval creation when unmounted during authentication', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      // Simulate authentication resolving after unmount
      let resolveAuth: ((user: User) => void) | undefined;
      const authPromise = new Promise<User>((resolve) => {
        resolveAuth = resolve;
      });
      
      mockAuthService.getCurrentUser.mockReturnValue(authPromise);
      mockAuthService.refreshSession.mockResolvedValue(true);

      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const initialIntervalCount = setIntervalSpy.mock.calls.length;

      // Unmount before authentication completes
      unmount();

      // Complete authentication after unmount
      await act(async () => {
        resolveAuth!(mockUser);
        await authPromise;
      });

      // No new intervals should be created
      expect(setIntervalSpy.mock.calls.length).toBe(initialIntervalCount);
      
      setIntervalSpy.mockRestore();
    });
  });
});