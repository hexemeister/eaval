import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DynamicDataTable from './DynamicDataTable';

describe('DynamicDataTable', () => {
    it('exibe mensagem de vazio quando não há dados', () => {
        render(<DynamicDataTable data={[]} />);
        expect(screen.getAllByText('Nenhum resultado encontrado.').length).toBeGreaterThanOrEqual(1);
    });

    it('gera colunas dinamicamente a partir das chaves do primeiro objeto', () => {
        const data = [{ titulo: 'Avaliação formativa', ano: 2021 }];
        render(<DynamicDataTable data={data} />);
        expect(screen.getByText('Titulo')).toBeInTheDocument();
        expect(screen.getByText('Ano')).toBeInTheDocument();
        expect(screen.getByText('Avaliação formativa')).toBeInTheDocument();
        expect(screen.getByText('2021')).toBeInTheDocument();
    });

    it('filtra linhas pelo texto digitado no campo de busca', async () => {
        const user = userEvent.setup();
        const data = [
            { titulo: 'Avaliação formativa', ano: 2021 },
            { titulo: 'Educação inclusiva', ano: 2022 },
        ];
        render(<DynamicDataTable data={data} />);

        await user.type(screen.getByPlaceholderText('Buscar em todos os campos...'), 'formativa');

        expect(screen.getByText('Avaliação formativa')).toBeInTheDocument();
        expect(screen.queryByText('Educação inclusiva')).not.toBeInTheDocument();
    });

    it('exibe paginação correta com mais de 10 linhas', () => {
        const data = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, nome: `Item ${i + 1}` }));
        render(<DynamicDataTable data={data} />);
        expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Próxima' })).not.toBeDisabled();
    });
});
