import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AutorList, type AutorItem } from './AutorList';

function mockFetchSequence(responses: Array<{ ok: boolean; json: unknown }>) {
  const fn = vi.fn();
  responses.forEach((r) => {
    fn.mockImplementationOnce(async () => ({
      ok: r.ok,
      json: async () => r.json,
    }));
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('AutorList', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => [] }) as unknown as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('propaga o texto digitado para o formulário mesmo sem selecionar uma sugestão', async () => {
    const user = userEvent.setup();
    mockFetchSequence([{ ok: true, json: [] }]);
    const value: AutorItem[] = [{ autor_id: null, nome: '', ordem: 1 }];
    const onChange = vi.fn();

    render(<AutorList value={value} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Nome do autor'), 'Maria Silva');

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith([{ autor_id: null, nome: 'Maria Silva', ordem: 1 }]);
    });
  });

  it('limpa o autor_id quando o nome de um autor já vinculado é editado manualmente', async () => {
    const user = userEvent.setup();
    mockFetchSequence([{ ok: true, json: [] }]);
    const value: AutorItem[] = [{ autor_id: 5, nome: 'João Silva', ordem: 1 }];
    const onChange = vi.fn();

    render(<AutorList value={value} onChange={onChange} />);

    const input = screen.getByPlaceholderText('Nome do autor');
    await user.clear(input);
    await user.type(input, 'João Souza');

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith([{ autor_id: null, nome: 'João Souza', ordem: 1 }]);
    });
  });

  it('selecionar uma sugestão existente ainda define nome e autor_id', async () => {
    const user = userEvent.setup();
    mockFetchSequence([{ ok: true, json: [{ id: 9, nome: 'Ana Paula' }] }]);
    const value: AutorItem[] = [{ autor_id: null, nome: '', ordem: 1 }];
    const onChange = vi.fn();

    render(<AutorList value={value} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Nome do autor'), 'Ana');

    const opcao = await screen.findByText('Ana Paula');
    await user.click(opcao);

    expect(onChange).toHaveBeenLastCalledWith([{ autor_id: 9, nome: 'Ana Paula', ordem: 1 }]);
  });

  it('criar um autor novo via dialog de confirmação ainda funciona', async () => {
    const user = userEvent.setup();
    mockFetchSequence([
      { ok: true, json: [] },
      { ok: true, json: { id: 42, nome: 'Autor Novo' } },
    ]);
    const value: AutorItem[] = [{ autor_id: null, nome: '', ordem: 1 }];
    const onChange = vi.fn();

    render(<AutorList value={value} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText('Nome do autor'), 'Autor Novo');

    const criar = await screen.findByText('Criar "Autor Novo"');
    await user.click(criar);

    const confirmar = await screen.findByRole('button', { name: 'Cadastrar autor' });
    await user.click(confirmar);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith([{ autor_id: 42, nome: 'Autor Novo', ordem: 1 }]);
    });
  });

  it('adicionar e remover autores da lista', async () => {
    const user = userEvent.setup();
    const value: AutorItem[] = [];
    const onChange = vi.fn();

    const { rerender } = render(<AutorList value={value} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Adicionar autor' }));
    expect(onChange).toHaveBeenLastCalledWith([{ autor_id: null, nome: '', ordem: 1 }]);

    const comUmAutor: AutorItem[] = [{ autor_id: 1, nome: 'Fulano', ordem: 1 }];
    rerender(<AutorList value={comUmAutor} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remover autor' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
