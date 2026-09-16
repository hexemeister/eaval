import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PalavraChaveInput } from './PalavraChaveInput';

describe('PalavraChaveInput', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => [] }) as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adiciona várias palavras-chave novas em sequência, não só a primeira', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<PalavraChaveInput value={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Adicionar palavra-chave...');

    await user.type(input, 'primeira{Enter}');
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(['primeira']);
    });
    rerender(<PalavraChaveInput value={['primeira']} onChange={onChange} />);

    await user.type(input, 'segunda{Enter}');
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(['primeira', 'segunda']);
    });
    rerender(<PalavraChaveInput value={['primeira', 'segunda']} onChange={onChange} />);

    await user.type(input, 'terceira{Enter}');
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(['primeira', 'segunda', 'terceira']);
    });
  });

  it('não bloqueia a adição de uma palavra nova com um diálogo de confirmação', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PalavraChaveInput value={[]} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Adicionar palavra-chave...'), 'termo novo{Enter}');

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(['termo novo']);
    });
    expect(screen.queryByText(/Confirmar nova palavra-chave/i)).not.toBeInTheDocument();
  });

  it('clicar em "Adicionar" também adiciona a palavra digitada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PalavraChaveInput value={[]} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Adicionar palavra-chave...'), 'outro termo');
    await user.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(['outro termo']);
    });
  });

  it('não adiciona duplicata (case-insensitive) e limpa o input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PalavraChaveInput value={['Educação']} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Adicionar palavra-chave...');
    await user.type(input, 'educação{Enter}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('selecionar uma sugestão existente adiciona a palavra', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => [{ id: 1, texto: 'Avaliação' }] }) as unknown as Response);
    const onChange = vi.fn();
    render(<PalavraChaveInput value={[]} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Adicionar palavra-chave...'), 'Aval');

    const opcao = await screen.findByText('Avaliação');
    await user.click(opcao);

    expect(onChange).toHaveBeenLastCalledWith(['Avaliação']);
  });

  it('remover uma palavra-chave já adicionada', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PalavraChaveInput value={['Educação', 'Avaliação']} onChange={onChange} />);

    await user.click(screen.getByLabelText('Remover Educação'));

    expect(onChange).toHaveBeenLastCalledWith(['Avaliação']);
  });
});
