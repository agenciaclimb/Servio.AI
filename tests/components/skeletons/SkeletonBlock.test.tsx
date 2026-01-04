import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkeletonBlock from '../../../components/skeletons/SkeletonBlock';

describe('SkeletonBlock', () => {
  describe('renderização básica', () => {
    it('deve renderizar o bloco skeleton', () => {
      render(<SkeletonBlock />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toBeInTheDocument();
    });

    it('deve ter classes de animação pulse', () => {
      render(<SkeletonBlock />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('deve ter classe de background cinza', () => {
      render(<SkeletonBlock />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toHaveClass('bg-gray-200');
    });

    it('deve ter classe rounded', () => {
      render(<SkeletonBlock />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toHaveClass('rounded');
    });
  });

  describe('className customizado', () => {
    it('deve aplicar className customizado', () => {
      render(<SkeletonBlock className="h-10 w-full" />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toHaveClass('h-10', 'w-full');
    });

    it('deve manter classes padrão junto com className customizado', () => {
      render(<SkeletonBlock className="h-5 w-3/5" />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded', 'h-5', 'w-3/5');
    });

    it('deve funcionar sem className', () => {
      render(<SkeletonBlock />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('deve aceitar classes de dimensão complexas', () => {
      render(<SkeletonBlock className="h-24 rounded-lg mb-8" />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toHaveClass('h-24', 'rounded-lg', 'mb-8');
    });
  });

  describe('estrutura DOM', () => {
    it('deve renderizar como div', () => {
      render(<SkeletonBlock />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton.tagName).toBe('DIV');
    });

    it('deve estar vazio (sem conteúdo filho)', () => {
      render(<SkeletonBlock />);
      
      const skeleton = screen.getByTestId('skeleton-block');
      expect(skeleton).toBeEmptyDOMElement();
    });
  });
});
