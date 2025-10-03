import { Layout } from '@/layouts/Layout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function Publicacoes({ results }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('ano');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 10;

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortBy] || '';
    const bValue = b[sortBy] || '';
    if (sortBy === 'ano') {
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    }
    return sortOrder === 'desc'
      ? bValue.toString().localeCompare(aValue.toString())
      : aValue.toString().localeCompare(bValue.toString());
  });

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const paginatedResults = sortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Publicações Científicas</h1>
        
        <div className="mb-4 text-sm text-gray-600">
          Exibindo {paginatedResults.length} de {results.length} resultados
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer w-[55%] min-w-[200px] max-w-[400px]">
                  <div className="flex items-center space-x-2" onClick={() => handleSort('titulo')}>
                    <span>Título</span>
                    {sortBy === 'titulo' && <ChevronDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer w-[30%] min-w-[150px] max-w-[300px]">
                  <div className="flex items-center space-x-2" onClick={() => handleSort('autores')}>
                    <span>Autores</span>
                    {sortBy === 'autores' && <ChevronDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer w-[5%] min-w-[80px] max-w-[100px]">
                  <div className="flex items-center space-x-2" onClick={() => handleSort('ano')}>
                    <span>Ano</span>
                    {sortBy === 'ano' && <ChevronDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </div>
                </TableHead>
                <TableHead className="w-[20%] min-w-[120px] max-w-[200px]">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((publicacao, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium w-[40%] min-w-[200px] max-w-[400px]">{publicacao.titulo || 'Sem título'}</TableCell>
                  <TableCell className="w-[30%] min-w-[150px] max-w-[300px]">
                    {publicacao.autores ? (
                      <pre className="whitespace-pre-wrap break-words">{publicacao.autores}</pre>
                    ) : (
                      'Sem autores'
                    )}
                  </TableCell>
                  <TableCell className="w-[10%] min-w-[80px] max-w-[100px]">{publicacao.ano || 'Sem ano'}</TableCell>
                  <TableCell className="w-[10%] min-w-[120px] max-w-[200px]">
                    {publicacao.link ? (
                      <a
                        href={publicacao.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:text-blue-700"
                      >
                        Abrir Link <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      'Sem link'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}

        <section className="mb-12 mt-8">
          {/* Conteúdo da descrição aqui */}
        </section>
      </div>
    </Layout>
  );
}