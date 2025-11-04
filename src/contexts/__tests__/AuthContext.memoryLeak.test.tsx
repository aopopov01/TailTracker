import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { AuthService } from '../../services/authService';
import { SessionService } from '../../services/sessionService';

// Mock the services
jest.mock('../../services/authService');
jest.mock('../../services/sessionService');

const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;
const mockedSessionService = SessionService as jest.Mocked<
  typeof SessionService
>;

// Test component that uses the auth context
const TestComponent = () => {
  const { isLoading, user, error } = useAuth();
  return (
    <>
      <>{isLoading ? 'loading' : 'not loading'}</>
      <>{user ? `user: ${user.email}` : 'no user'}</>
      <>{error ? `error: ${error}` : 'no error'}</>
    </>
  );
};

describe('AuthContext Memory Leak Tests', () => {
  let originalConsoleError: typeof console.error;
  let mockSetInterval: jest.SpyInstance;
  let mockClearInterval: jest.SpyInstance;

  beforeEach(() => {
    // Mock console.error to capture errors
    originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock timers
    jest.useFakeTimers();
    mockSetInterval = jest.spyOn(global, 'setInterval');
    mockClearInterval = jest.spyOn(global, 'clearInterval');

    // Reset service mocks
    mockedAuthService.getCurrentUser.mockResolvedValue(null);
    mockedAuthService.refreshSession.mockResolvedValue(false);
    mockedSessionService.getCurrentUser.mockResolvedValue(null);
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should properly clean up intervals on unmount', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Mock authenticated user
    mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockedAuthService.refreshSession.mockResolvedValue(true);

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalled();
    });

    // Fast forward to trigger interval setup (authenticated users get intervals)
    act(() => {
      jest.runOnlyPendingTimers();
    });

    // Verify interval was set up
    expect(mockSetInterval).toHaveBeenCalledWith(
      expect.any(Function),
      15 * 60 * 1000
    );

    const intervalCallsBeforeUnmount = mockSetInterval.mock.calls.length;
    const clearIntervalCallsBeforeUnmount = mockClearInterval.mock.calls.length;

    // Unmount the component
    unmount();

    // Verify interval was cleared on unmount
    expect(mockClearInterval).toHaveBeenCalledTimes(
      clearIntervalCallsBeforeUnmount + 1
    );
  });

  it('should not dispatch state updates after component unmounts', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    // Mock a delayed response to simulate async operation during unmount
    let resolveGetCurrentUser: (value: any) => void;
    const getCurrentUserPromise = new Promise(resolve => {
      resolveGetCurrentUser = resolve;
    });

    mockedAuthService.getCurrentUser.mockImplementation(
      () => getCurrentUserPromise as Promise<any>
    );

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Unmount immediately after render (before getCurrentUser resolves)
    unmount();

    // Now resolve the promise after unmount
    act(() => {
      resolveGetCurrentUser(mockUser);
    });

    // Wait for any async operations
    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalled();
    });

    // Verify no error was logged about state updates after unmount
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringContaining("Warning: Can't perform a React state update")
    );
  });

  it('should clean up abort controllers on unmount', async () => {
    const mockAbort = jest.fn();
    const originalAbortController = global.AbortController;

    global.AbortController = jest.fn().mockImplementation(() => ({
      signal: { aborted: false },
      abort: mockAbort,
    }));

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Allow initialization to start
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Unmount the component
    unmount();

    // Verify abort was called
    expect(mockAbort).toHaveBeenCalled();

    // Restore original AbortController
    global.AbortController = originalAbortController;
  });

  it('should handle logout cleanup properly', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockedAuthService.refreshSession.mockResolvedValue(true);
    mockedAuthService.logout.mockResolvedValue();

    let authContext: any;
    const TestComponentWithLogout = () => {
      authContext = useAuth();
      return <TestComponent />;
    };

    render(
      <AuthProvider>
        <TestComponentWithLogout />
      </AuthProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalled();
    });

    const clearIntervalCallsBefore = mockClearInterval.mock.calls.length;

    // Trigger logout
    await act(async () => {
      await authContext.logout();
    });

    // Verify intervals were cleared during logout
    expect(mockClearInterval).toHaveBeenCalledTimes(
      clearIntervalCallsBefore + 1
    );
    expect(mockedAuthService.logout).toHaveBeenCalled();
  });

  it('should prevent multiple intervals from being created', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    mockedAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockedAuthService.refreshSession.mockResolvedValue(true);

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initialization and initial interval setup
    await waitFor(() => {
      expect(mockedAuthService.getCurrentUser).toHaveBeenCalled();
    });

    const initialSetIntervalCalls = mockSetInterval.mock.calls.length;

    // Force a re-render that might trigger the useEffect again
    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should not create additional intervals
    expect(mockSetInterval.mock.calls.length).toBe(initialSetIntervalCalls);
  });
});
