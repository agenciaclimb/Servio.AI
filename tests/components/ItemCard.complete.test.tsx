import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ItemCard from '../../components/ItemCard';
import type { MaintainedItem } from '../../types';

const mockItem: MaintainedItem = {
  id: '1',
  name: 'Test Item',
  category: 'Electronics',
  imageUrl: 'https://example.com/image.jpg',
  userId: 'user1',
  createdAt: new Date().toISOString(),
};

describe('ItemCard - Complete Functionality', () => {
  it('renders item name and category', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
  });

  it('displays image when imageUrl is provided', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    const image = screen.getByAltText('Test Item');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('displays placeholder icon when no imageUrl', () => {
    const itemNoImage = { ...mockItem, imageUrl: undefined };
    const mockOnClick = vi.fn();
    const { container } = render(<ItemCard item={itemNoImage} onClick={mockOnClick} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('has correct styling classes', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    expect(card).toHaveClass('bg-white', 'rounded-xl', 'shadow-md');
  });

  it('displays "Ver detalhes" text', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    expect(screen.getByText('Ver detalhes →')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    expect(card.tagName).toBe('BUTTON');
  });

  it('applies hover transform classes', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    const card = screen.getByRole('button');
    expect(card.className).toContain('hover:-translate-y-1');
  });

  it('sets lazy loading on image', () => {
    const mockOnClick = vi.fn();
    render(<ItemCard item={mockItem} onClick={mockOnClick} />);

    const image = screen.getByAltText('Test Item');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('handles long item names', () => {
    const longNameItem = {
      ...mockItem,
      name: 'This is a very long item name that should be truncated with line clamp',
    };
    const mockOnClick = vi.fn();
    render(<ItemCard item={longNameItem} onClick={mockOnClick} />);

    expect(screen.getByText(longNameItem.name)).toBeInTheDocument();
  });
});
