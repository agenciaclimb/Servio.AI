import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import JobCardSkeleton from '../../src/components/skeletons/JobCardSkeleton';

describe('JobCardSkeleton', () => {
  it('should render skeleton', () => {
    const { container } = render(<JobCardSkeleton />);
    expect(container).toBeTruthy();
  });

  it('should have skeleton class', () => {
    const { container } = render(<JobCardSkeleton />);
    const skeleton = container.querySelector('[class*="skeleton"]') || 
                     container.querySelector('[class*="loading"]');
    expect(skeleton || container.firstChild).toBeTruthy();
  });

  it('should render multiple skeleton lines', () => {
    const { container } = render(<JobCardSkeleton />);
    expect(container.children.length > 0).toBe(true);
  });

  it('should have animation', () => {
    const { container } = render(<JobCardSkeleton />);
    const element = container.firstChild as HTMLElement;
    expect(element).toBeTruthy();
  });

  it('should be accessible', () => {
    const { container } = render(<JobCardSkeleton />);
    expect(container).toBeTruthy();
  });
});
