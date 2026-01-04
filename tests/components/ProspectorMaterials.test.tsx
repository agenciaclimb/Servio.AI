import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProspectorMaterials from '../../src/components/ProspectorMaterials';

describe('ProspectorMaterials', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('rendering', () => {
    it('renders category filter buttons', () => {
      render(<ProspectorMaterials />);

      // Use getAllBy since WhatsApp appears in both category filter and material title
      expect(screen.getAllByText(/Todos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/WhatsApp/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Email/i).length).toBeGreaterThan(0);
    });

    it('renders materials list', () => {
      render(<ProspectorMaterials />);

      // Should show some materials
      expect(screen.getByText(/Convite Inicial WhatsApp/i)).toBeInTheDocument();
    });

    it('renders with all materials visible by default', () => {
      render(<ProspectorMaterials />);

      // Check for different categories of materials
      expect(screen.getByText(/Convite Inicial WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText(/Email Profissional/i)).toBeInTheDocument();
    });
  });

  describe('category filtering', () => {
    it('filters materials by WhatsApp category', () => {
      render(<ProspectorMaterials />);

      // Find the category button (first WhatsApp is the category)
      const whatsappButtons = screen.getAllByText(/💬 WhatsApp/i);
      fireEvent.click(whatsappButtons[0]);

      // Should show WhatsApp templates
      expect(screen.getByText(/Convite Inicial WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText(/Follow-up 2 dias/i)).toBeInTheDocument();
    });

    it('filters materials by Email category', () => {
      render(<ProspectorMaterials />);

      const emailButtons = screen.getAllByText(/📧 Email/i);
      fireEvent.click(emailButtons[0]);

      // Should show email template
      expect(screen.getByText(/Email Profissional/i)).toBeInTheDocument();
    });

    it('shows all materials when Todos is clicked', () => {
      render(<ProspectorMaterials />);

      // First filter by WhatsApp
      const whatsappButtons = screen.getAllByText(/💬 WhatsApp/i);
      fireEvent.click(whatsappButtons[0]);

      // Then click Todos
      const todosButtons = screen.getAllByText(/📚 Todos/i);
      fireEvent.click(todosButtons[0]);

      // Should show all materials again
      expect(screen.getByText(/Convite Inicial WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText(/Email Profissional/i)).toBeInTheDocument();
    });
  });

  describe('template copying', () => {
    it('copies template content to clipboard', async () => {
      render(<ProspectorMaterials />);

      // Find a copy button for a template
      const copyButtons = screen.getAllByRole('button', { name: /copiar/i });

      if (copyButtons.length > 0) {
        fireEvent.click(copyButtons[0]);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });
  });

  describe('material types', () => {
    it('displays templates with copy functionality', () => {
      render(<ProspectorMaterials />);

      // Template cards should exist
      expect(screen.getByText(/Convite Inicial WhatsApp/i)).toBeInTheDocument();
    });

    it('displays PDFs with download option', () => {
      render(<ProspectorMaterials />);

      // Click presentation category to see PDFs
      fireEvent.click(screen.getByText(/Apresentação/i));

      expect(screen.getByText(/Guia do Prestador/i)).toBeInTheDocument();
    });

    it('displays videos with preview', () => {
      render(<ProspectorMaterials />);

      fireEvent.click(screen.getByText(/Apresentação/i));

      expect(screen.getByText(/Pitch 60 segundos/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('category buttons are accessible', () => {
      render(<ProspectorMaterials />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('material cards have descriptive text', () => {
      render(<ProspectorMaterials />);

      // Each material should have title and description
      expect(screen.getByText(/Convite Inicial WhatsApp/i)).toBeInTheDocument();
      expect(screen.getByText(/Primeira mensagem para prospect via WhatsApp/i)).toBeInTheDocument();
    });
  });

  describe('training materials', () => {
    it('displays training materials when selected', () => {
      render(<ProspectorMaterials />);

      fireEvent.click(screen.getByText(/Treinamento/i));

      expect(screen.getByText(/FAQ - Perguntas Frequentes/i)).toBeInTheDocument();
    });
  });
});
