import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StarRatingInput from '../../components/StarRatingInput';

describe('StarRatingInput Component', () => {
  it('renderiza 5 estrelas', () => {
    const { container } = render(<StarRatingInput rating={0} setRating={vi.fn()} />);
    
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('mostra nenhuma estrela preenchida para rating 0', () => {
    const { container } = render(<StarRatingInput rating={0} setRating={vi.fn()} />);
    
    const filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(0);
  });

  it('mostra 3 estrelas preenchidas para rating 3', () => {
    const { container } = render(<StarRatingInput rating={3} setRating={vi.fn()} />);
    
    const filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(3);
  });

  it('mostra 5 estrelas preenchidas para rating 5', () => {
    const { container } = render(<StarRatingInput rating={5} setRating={vi.fn()} />);
    
    const filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(5);
  });

  it('chama setRating ao clicar em uma estrela', async () => {
    const user = userEvent.setup();
    const setRating = vi.fn();
    const { container } = render(<StarRatingInput rating={0} setRating={setRating} />);
    
    const stars = container.querySelectorAll('svg');
    await user.click(stars[2]); // Terceira estrela (índice 2)
    
    expect(setRating).toHaveBeenCalledWith(3);
  });

  it('permite mudar o rating clicando em estrela diferente', async () => {
    const user = userEvent.setup();
    const setRating = vi.fn();
    const { container } = render(<StarRatingInput rating={3} setRating={setRating} />);
    
    const stars = container.querySelectorAll('svg');
    await user.click(stars[4]); // Quinta estrela
    
    expect(setRating).toHaveBeenCalledWith(5);
  });

  it('permite dar rating 1 clicando na primeira estrela', async () => {
    const user = userEvent.setup();
    const setRating = vi.fn();
    const { container } = render(<StarRatingInput rating={0} setRating={setRating} />);
    
    const stars = container.querySelectorAll('svg');
    await user.click(stars[0]);
    
    expect(setRating).toHaveBeenCalledWith(1);
  });

  it('aplica cursor pointer nas estrelas', () => {
    const { container } = render(<StarRatingInput rating={0} setRating={vi.fn()} />);
    
    const stars = container.querySelectorAll('svg');
    stars.forEach(star => {
      expect(star).toHaveClass('cursor-pointer');
    });
  });

  it('aplica transição de cores', () => {
    const { container } = render(<StarRatingInput rating={0} setRating={vi.fn()} />);
    
    const stars = container.querySelectorAll('svg');
    stars.forEach(star => {
      expect(star).toHaveClass('transition-colors');
    });
  });

  it('mostra preview ao passar mouse sobre estrelas', async () => {
    const user = userEvent.setup();
    const { container } = render(<StarRatingInput rating={0} setRating={vi.fn()} />);
    
    const stars = container.querySelectorAll('svg');
    await user.hover(stars[3]); // Quarta estrela
    
    // Deve mostrar 4 estrelas preenchidas durante hover
    const filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(4);
  });

  it('remove preview ao tirar mouse', async () => {
    const user = userEvent.setup();
    const { container } = render(<StarRatingInput rating={2} setRating={vi.fn()} />);
    
    const stars = container.querySelectorAll('svg');
    await user.hover(stars[4]); // Hover na quinta estrela
    
    // Durante hover, 5 estrelas preenchidas
    let filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(5);
    
    await user.unhover(stars[4]);
    
    // Após unhover, volta para rating original (2)
    filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(2);
  });

  it('prioriza hover sobre rating atual', async () => {
    const user = userEvent.setup();
    const { container } = render(<StarRatingInput rating={4} setRating={vi.fn()} />);
    
    const stars = container.querySelectorAll('svg');
    await user.hover(stars[1]); // Hover na segunda estrela
    
    // Hover mostra 2 estrelas, não as 4 do rating atual
    const filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars.length).toBe(2);
  });

  it('permite rating reduzido', async () => {
    const user = userEvent.setup();
    const setRating = vi.fn();
    const { container } = render(<StarRatingInput rating={5} setRating={setRating} />);
    
    const stars = container.querySelectorAll('svg');
    await user.click(stars[1]); // Clica na segunda estrela
    
    expect(setRating).toHaveBeenCalledWith(2);
  });

  it('renderiza espaçamento entre estrelas', () => {
    const { container } = render(<StarRatingInput rating={0} setRating={vi.fn()} />);
    
    const starsContainer = container.querySelector('.flex');
    expect(starsContainer).toHaveClass('space-x-1');
  });

  it('centraliza estrelas', () => {
    const { container } = render(<StarRatingInput rating={0} setRating={vi.fn()} />);
    
    const starsContainer = container.querySelector('.flex');
    expect(starsContainer).toHaveClass('justify-center');
  });
});
