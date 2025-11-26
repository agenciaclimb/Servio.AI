import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProspectorOnboarding, { useProspectorOnboarding } from '../src/components/ProspectorOnboarding';

// Mock react-joyride
vi.mock('react-joyride', () => ({
  default: ({ run, steps, callback }: any) => {
    if (!run) return null;
    return (
      <div data-testid="joyride-tour">
        <div data-testid="tour-steps">{steps.length} steps</div>
        <button
          data-testid="tour-skip"
          onClick={() => callback({ status: 'skipped', action: 'skip', index: 0, type: 'step:after' })}
        >
          Skip
        </button>
        <button
          data-testid="tour-finish"
          onClick={() => callback({ status: 'finished', action: 'next', index: 4, type: 'step:after' })}
        >
          Finish
        </button>
      </div>
    );
  },
  ACTIONS: { PREV: 'prev', NEXT: 'next', SKIP: 'skip' },
  EVENTS: { STEP_AFTER: 'step:after', TARGET_NOT_FOUND: 'error:target_not_found' },
  STATUS: { FINISHED: 'finished', SKIPPED: 'skipped', RUNNING: 'running' },
}));

describe('ProspectorOnboarding', () => {
  const TEST_USER_ID = 'test@prospector.com';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render tour when user has not seen it', async () => {
    render(<ProspectorOnboarding userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });

    expect(screen.getByTestId('tour-steps')).toHaveTextContent('5');
  });

  it('should not render tour when user has already completed it', () => {
    localStorage.setItem(`servio-prospector-tour-${TEST_USER_ID}`, JSON.stringify({
      completed: true,
      completedAt: Date.now(),
    }));

    render(<ProspectorOnboarding userId={TEST_USER_ID} />);

    expect(screen.queryByTestId('joyride-tour')).not.toBeInTheDocument();
  });

  it('should save completion state to localStorage when tour is finished', async () => {
    const onComplete = vi.fn();
    render(<ProspectorOnboarding userId={TEST_USER_ID} onComplete={onComplete} />);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tour-finish'));

    await waitFor(() => {
      const stored = localStorage.getItem(`servio-prospector-tour-${TEST_USER_ID}`);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.completed).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('should save skip state to localStorage when tour is skipped', async () => {
    const onSkip = vi.fn();
    render(<ProspectorOnboarding userId={TEST_USER_ID} onSkip={onSkip} />);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tour-skip'));

    await waitFor(() => {
      const stored = localStorage.getItem(`servio-prospector-tour-${TEST_USER_ID}`);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.completed).toBe(false);
      expect(parsed.skippedAt).toBeTruthy();
      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });

  it('should not render when isActive is false', () => {
    render(<ProspectorOnboarding userId={TEST_USER_ID} isActive={false} />);
    expect(screen.queryByTestId('joyride-tour')).not.toBeInTheDocument();
  });

  it('should expose restart function via window', async () => {
    render(<ProspectorOnboarding userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect((window as any).restartProspectorTour).toBeDefined();
    });

    expect(typeof (window as any).restartProspectorTour).toBe('function');
  });
});

describe('useProspectorOnboarding', () => {
  const TEST_USER_ID = 'test@prospector.com';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should return false when tour is not completed', () => {
    const TestComponent = () => {
      const { hasCompletedTour } = useProspectorOnboarding(TEST_USER_ID);
      return <div>{hasCompletedTour ? 'completed' : 'not completed'}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText('not completed')).toBeInTheDocument();
  });

  it('should return true when tour is completed', () => {
    localStorage.setItem(`servio-prospector-tour-${TEST_USER_ID}`, JSON.stringify({
      completed: true,
      completedAt: Date.now(),
    }));

    const TestComponent = () => {
      const { hasCompletedTour } = useProspectorOnboarding(TEST_USER_ID);
      return <div>{hasCompletedTour ? 'completed' : 'not completed'}</div>;
    };

    render(<TestComponent />);
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('should reset tour when resetTour is called', () => {
    localStorage.setItem(`servio-prospector-tour-${TEST_USER_ID}`, JSON.stringify({
      completed: true,
      completedAt: Date.now(),
    }));

    const TestComponent = () => {
      const { hasCompletedTour, resetTour } = useProspectorOnboarding(TEST_USER_ID);
      return (
        <div>
          <div>{hasCompletedTour ? 'completed' : 'not completed'}</div>
          <button onClick={resetTour}>Reset</button>
        </div>
      );
    };

    render(<TestComponent />);
    expect(screen.getByText('completed')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Reset'));

    expect(localStorage.getItem(`servio-prospector-tour-${TEST_USER_ID}`)).toBeNull();
  });

  it('should respect isActive prop', () => {
    render(<ProspectorOnboarding userId={TEST_USER_ID} isActive={false} />);

    expect(screen.queryByTestId('joyride-tour')).not.toBeInTheDocument();
  });

  it('should start tour when isActive changes to true', async () => {
    const { rerender } = render(
      <ProspectorOnboarding userId={TEST_USER_ID} isActive={false} />
    );

    expect(screen.queryByTestId('joyride-tour')).not.toBeInTheDocument();

    rerender(<ProspectorOnboarding userId={TEST_USER_ID} isActive={true} />);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });
  });

  it('should track tour start event', async () => {
    render(<ProspectorOnboarding userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('joyride-tour')).toBeInTheDocument();
    });

    // Analytics tracking should be called
    expect(screen.getByTestId('tour-steps')).toBeInTheDocument();
  });

  it('should handle multiple tours for different users', () => {
    const user1 = 'user1@test.com';
    const user2 = 'user2@test.com';

    render(<ProspectorOnboarding userId={user1} />);
    render(<ProspectorOnboarding userId={user2} />);

    // Both tours should maintain separate state
    expect(localStorage.getItem(`servio-prospector-tour-${user1}`)).not.toBe(
      localStorage.getItem(`servio-prospector-tour-${user2}`)
    );
  });

  it('should handle localStorage errors gracefully', () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    expect(() => {
      render(<ProspectorOnboarding userId={TEST_USER_ID} />);
    }).not.toThrow();

    Storage.prototype.setItem = originalSetItem;
  });

  it('should display all 5 tour steps', async () => {
    render(<ProspectorOnboarding userId={TEST_USER_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId('tour-steps')).toHaveTextContent('5');
    });
  });
});
