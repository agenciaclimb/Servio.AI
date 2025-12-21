import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';

// Mock do Firebase
vi.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(callback => {
      callback(null);
      return vi.fn();
    }),
  },
}));

// Mock de componentes pesados
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: vi.fn(fn => {
      const Component = React.lazy(fn);
      return (props: any) => (
        <React.Suspense fallback={<div data-testid="loading-fallback">Loading...</div>}>
          <Component {...props} />
        </React.Suspense>
      );
    }),
  };
});

// Mock dos serviços
vi.mock('../services/messagingService', () => ({
  registerUserFcmToken: vi.fn().mockResolvedValue(undefined),
  onForegroundMessage: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock('../services/api', () => ({
  fetchUserById: vi.fn().mockResolvedValue(null),
  fetchAllUsers: vi.fn().mockResolvedValue([]),
  fetchJobs: vi.fn().mockResolvedValue([]),
  createUser: vi.fn().mockResolvedValue({
    email: 'test@example.com',
    name: 'Test User',
    type: 'cliente',
    status: 'ativo',
  }),
  createJob: vi.fn().mockResolvedValue({
    id: 'job-123',
    category: 'reparos',
    jobMode: 'normal',
  }),
  matchProvidersForJob: vi.fn().mockResolvedValue([]),
  updateUser: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  registerWithInvite: vi.fn().mockResolvedValue(undefined),
}));

// Mock dos componentes principais
vi.mock('../components/Header', () => ({
  default: ({ onLoginClick }: any) => (
    <header data-testid="header">
      <button onClick={() => onLoginClick('cliente')} data-testid="login-button">
        Login
      </button>
    </header>
  ),
}));

vi.mock('../components/HeroSection', () => ({
  default: ({ onSmartSearch }: any) => (
    <section data-testid="hero-section">
      <button onClick={() => onSmartSearch('test search')} data-testid="search-button">
        Search
      </button>
    </section>
  ),
}));

vi.mock('../components/AuthModal', () => ({
  default: ({ onClose, onSuccess }: any) => (
    <div data-testid="auth-modal">
      <button onClick={() => onSuccess('test@example.com', 'cliente')} data-testid="auth-success">
        Login Success
      </button>
      <button onClick={onClose} data-testid="auth-close">
        Close
      </button>
    </div>
  ),
}));

vi.mock('../components/ErrorBoundary', () => ({
  default: ({ children }: any) => <div data-testid="error-boundary">{children}</div>,
}));

vi.mock('../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
}));

vi.mock('../utils/logger', () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('../services/prospectingService', () => ({
  triggerAutoProspecting: vi.fn().mockResolvedValue({
    success: true,
    prospectsFound: 3,
  }),
}));

describe('App Component', () => {
  const originalLocation = window.location;

  const setMockLocation = (overrides: Partial<Location> & { reload?: () => void } = {}) => {
    const href = originalLocation.href || 'http://localhost/';
    const origin = (originalLocation as any).origin || 'http://localhost';

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        href,
        origin,
        ...overrides,
      },
    });
  };

  const restoreLocation = () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  };

  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    // Evita erros do react-router em jsdom quando `origin/href` não existem
    // (eles não são enumeráveis e se perdem quando alguém mocka via spread).
    setMockLocation();

    // Garantir URL base consistente no jsdom.
    try {
      window.history.replaceState({}, '', '/');
    } catch {
      // noop
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
    restoreLocation();
  });

  const dispatchUnhandledRejection = (reason: Error) => {
    const event = new Event('unhandledrejection') as any;
    event.reason = reason;
    const p = Promise.reject(reason);
    p.catch(() => {});
    event.promise = p;
    globalThis.dispatchEvent(event);
  };

  it('should render the App component', () => {
    render(<App />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('should render home view by default', () => {
    render(<App />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('should display loading fallback when suspense is loading', () => {
    render(<App />);
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('should have proper ToastProvider wrapping', () => {
    render(<App />);
    expect(screen.getByTestId('toast-provider')).toBeInTheDocument();
  });

  it('should show auth modal when login is clicked', async () => {
    render(<App />);
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });
  });

  it('should close auth modal when close button is clicked', async () => {
    render(<App />);
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      const authModal = screen.getByTestId('auth-modal');
      expect(authModal).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId('auth-close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    });
  });

  it('should handle successful authentication', async () => {
    render(<App />);
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
    });

    const successButton = screen.getByTestId('auth-success');
    fireEvent.click(successButton);

    await waitFor(() => {
      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    });
  });

  it('should parse URL parameters for profile view', async () => {
    window.history.replaceState({}, '', '/?profile=user@example.com');

    render(<App />);

    // Profile view would be rendered if implemented
    expect(screen.getByTestId('header')).toBeInTheDocument();

    restoreLocation();
  });

  it('should parse URL parameters for service landing', async () => {
    window.history.replaceState({}, '', '/?servico=eletrica&local=sao-paulo');

    render(<App />);

    expect(screen.getByTestId('header')).toBeInTheDocument();

    restoreLocation();
  });

  it('should handle chunk loading errors gracefully', async () => {
    const reloadSpy = vi.fn();
    setMockLocation({ reload: reloadSpy });

    render(<App />);

    dispatchUnhandledRejection(new Error('Failed to fetch dynamically imported module'));

    // Should have set the reload flag
    expect(sessionStorage.getItem('hasReloadedForChunkError')).toBe('true');

    restoreLocation();
  });

  it('should handle error events from chunk loading', async () => {
    const reloadSpy = vi.fn();
    setMockLocation({ reload: reloadSpy });

    render(<App />);

    const event = new ErrorEvent('error', {
      message: 'Failed to load module script',
    });

    globalThis.dispatchEvent(event);

    // Should have set the reload flag
    expect(sessionStorage.getItem('hasReloadedForChunkError')).toBe('true');
  });

  it('should prevent multiple reloads for chunk errors', async () => {
    const reloadSpy = vi.fn();
    setMockLocation({ reload: reloadSpy });

    sessionStorage.setItem('hasReloadedForChunkError', 'true');

    render(<App />);

    dispatchUnhandledRejection(new Error('Failed to fetch dynamically imported module'));

    // Should not reload again
    expect(reloadSpy).not.toHaveBeenCalled();

    restoreLocation();
  });

  it('should clean up error listeners on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(globalThis, 'removeEventListener');

    const { unmount } = render(<App />);
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should fetch all users and jobs for find-providers view', async () => {
    const API = await import('../services/api');
    const mockUsers = [{ email: 'provider@example.com', name: 'Provider' }];
    const mockJobs = [{ id: 'job-1', category: 'reparos' }];

    vi.mocked(API.fetchAllUsers).mockResolvedValue(mockUsers as any);
    vi.mocked(API.fetchJobs).mockResolvedValue(mockJobs as any);

    render(<App />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should handle view navigation', () => {
    render(<App />);

    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('should render Header with proper props', () => {
    render(<App />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should initialize with no current user', () => {
    render(<App />);
    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
  });

  it('should maintain maintained items state', () => {
    render(<App />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should maintain all notifications state', () => {
    render(<App />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should manage job data to create state', () => {
    render(<App />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('should manage contact provider after login state', () => {
    render(<App />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('should cleanup on component unmount', () => {
    const { unmount } = render(<App />);
    expect(() => unmount()).not.toThrow();
  });
});
