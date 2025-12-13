import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadScoreCard from '../../src/components/prospector/LeadScoreCard';

const mockAnalysis = {
  categoryMatch: 85,
  locationScore: 70,
  engagementScore: 90,
  recencyScore: 75,
  demographicScore: 60,
};

const mockRecommendation = {
  action: 'Send Email',
  template: 'Welcome to our service',
  timeToSend: '2 hours',
  confidence: 0.85,
  reasoning: 'Lead shows high engagement',
};

describe('LeadScoreCard Component', () => {
  it('should render with basic props', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} />);
    expect(screen.getByTestId('lead-score-card-lead-1')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should determine temperature from score when not provided', () => {
    const { rerender } = render(<LeadScoreCard leadId="lead-1" score={85} />);
    expect(screen.getAllByText(/Warm/i).length).toBeGreaterThan(0);

    rerender(<LeadScoreCard leadId="lead-1" score={60} />);
    expect(screen.getAllByText(/Warm/i).length).toBeGreaterThan(0);

    rerender(<LeadScoreCard leadId="lead-1" score={30} />);
    expect(screen.getAllByText(/Warm/i).length).toBeGreaterThan(0);
  });

  it('should use provided temperature over score calculation', () => {
    render(<LeadScoreCard leadId="lead-1" score={30} temperature="hot" />);
    const hots = screen.getAllByText(/Hot/i);
    expect(hots.length).toBeGreaterThan(0);
  });

  it('should display analysis components when provided', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} analysis={mockAnalysis} />);
    expect(screen.getByText('Category Match')).toBeInTheDocument();
    expect(screen.getByText('Location Score')).toBeInTheDocument();
    expect(screen.getByText('Engagement')).toBeInTheDocument();
  });

  it('should display recommendation when provided', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} recommendation={mockRecommendation} />);
    expect(screen.getByText('Send Email')).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('should toggle details on click', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} analysis={mockAnalysis} />);

    const card = screen.getByTestId('lead-score-card-lead-1');

    // Initially should show "Click to view details"
    expect(screen.getByText(/Click to view details/i)).toBeInTheDocument();

    // Click to expand
    fireEvent.click(card);
    expect(screen.getByText(/Click to collapse details/i)).toBeInTheDocument();
    expect(screen.getByText('Score Components')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(card);
    expect(screen.getByText(/Click to view details/i)).toBeInTheDocument();
  });

  it('should call onDetailClick when provided', () => {
    const onDetailClick = vi.fn();
    render(<LeadScoreCard leadId="lead-1" score={85} onDetailClick={onDetailClick} />);

    const card = screen.getByTestId('lead-score-card-lead-1');
    fireEvent.click(card);

    expect(onDetailClick).toHaveBeenCalledWith('lead-1');
  });

  it('should render compact version', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} compact={true} />);
    expect(screen.getByTestId('lead-score-card-compact-lead-1')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('WARM')).toBeInTheDocument();
  });

  it('should apply correct color classes based on temperature', () => {
    const { container: hotContainer } = render(
      <LeadScoreCard leadId="lead-1" score={85} temperature="hot" />
    );
    const hotCard = hotContainer.querySelector('[data-testid="lead-score-card-lead-1"]');
    expect(hotCard).toHaveClass('border-red-300', 'bg-red-50');

    const { container: warmContainer } = render(
      <LeadScoreCard leadId="lead-1" score={60} temperature="warm" />
    );
    const warmCard = warmContainer.querySelector('[data-testid="lead-score-card-lead-1"]');
    expect(warmCard).toHaveClass('border-yellow-300', 'bg-yellow-50');

    const { container: coldContainer } = render(
      <LeadScoreCard leadId="lead-1" score={30} temperature="cold" />
    );
    const coldCard = coldContainer.querySelector('[data-testid="lead-score-card-lead-1"]');
    expect(coldCard).toHaveClass('border-blue-300', 'bg-blue-50');
  });

  it('should handle keyboard interaction', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} analysis={mockAnalysis} />);

    const card = screen.getByTestId('lead-score-card-lead-1');

    // Press Enter
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(screen.getByText(/Click to collapse details/i)).toBeInTheDocument();

    // Press Space
    fireEvent.keyDown(card, { key: ' ' });
    expect(screen.getByText(/Click to view details/i)).toBeInTheDocument();
  });

  it('should display all score components in expanded view', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} analysis={mockAnalysis} />);

    const card = screen.getByTestId('lead-score-card-lead-1');
    fireEvent.click(card);

    expect(screen.getByText('Score Components')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    const engagementLabels = screen.getAllByText('Engagement');
    expect(engagementLabels.length).toBeGreaterThan(0);
    expect(screen.getByText('Recency')).toBeInTheDocument();
  });

  it('should display AI recommendation in expanded view', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} recommendation={mockRecommendation} />);

    const card = screen.getByTestId('lead-score-card-lead-1');
    fireEvent.click(card);

    expect(screen.getByText('AI Recommendation')).toBeInTheDocument();
    expect(screen.getByText(/Action:/)).toBeInTheDocument();
    expect(screen.getByText(/Confidence:/)).toBeInTheDocument();
    expect(screen.getByText(/Timing:/)).toBeInTheDocument();
  });

  it('should show message when no analysis or recommendation', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} />);

    const card = screen.getByTestId('lead-score-card-lead-1');
    fireEvent.click(card);

    expect(screen.getByText(/No detailed analysis available yet/i)).toBeInTheDocument();
  });

  it('should display confidence percentage correctly', () => {
    render(
      <LeadScoreCard
        leadId="lead-1"
        score={85}
        recommendation={{ ...mockRecommendation, confidence: 0.92 }}
      />
    );

    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('should truncate long template text', () => {
    const longTemplate =
      'This is a very long template that should be truncated at 60 characters to display properly';
    render(
      <LeadScoreCard
        leadId="lead-1"
        score={85}
        recommendation={{ ...mockRecommendation, template: longTemplate }}
      />
    );

    const templateDisplay = screen.getByText(
      /This is a very long template that should be truncated at 6/
    );
    expect(templateDisplay).toBeInTheDocument();
  });

  it('should maintain accessibility with proper role and tabIndex', () => {
    render(<LeadScoreCard leadId="lead-1" score={85} />);

    const card = screen.getByTestId('lead-score-card-lead-1');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});
