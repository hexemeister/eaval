import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageHelp } from './page-help';

describe('PageHelp', () => {
  it('renderiza botão acessível quando text não está vazio', () => {
    render(<PageHelp text="Texto de ajuda da tela" />);
    expect(screen.getByRole('button', { name: 'Ajuda' })).toBeInTheDocument();
  });

  it('não renderiza nada quando text está vazio', () => {
    const { container } = render(<PageHelp text="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
