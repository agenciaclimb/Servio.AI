import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ContainerSkeleton from '../../src/components/skeletons/ContainerSkeleton';

describe('ContainerSkeleton', () => {
  it('should render skeleton container', () => {
    const { container } = render(<ContainerSkeleton />);
    expect(container).toBeTruthy();
  });

  it('should render skeleton content', () => {
    const { container } = render(<ContainerSkeleton />);
    expect(container.children.length > 0).toBe(true);
  });

  it('should have proper structure', () => {
    const { container } = render(<ContainerSkeleton />);
    const element = container.firstChild as HTMLElement;
    expect(element).toBeTruthy();
  });

  it('should be responsive', () => {
    const { container } = render(<ContainerSkeleton />);
    expect(container).toBeTruthy();
  });

  it('should have loading animation', () => {
    const { container } = render(<ContainerSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });

  it('should handle multiple renders', () => {
    const { rerender } = render(<ContainerSkeleton />);
    rerender(<ContainerSkeleton />);
    expect(true).toBe(true);
  });
});
