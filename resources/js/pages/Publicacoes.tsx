// resources/js/pages/Publicacoes.jsx
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layout } from '@/layouts/Layout';
import { AlertCircle, ChevronDown, ExternalLink, Info } from 'lucide-react';
import { useState } from 'react';

// Definição dos tipos
interface Publicacao {
  titulo?: string;
  autores?: string;
  ano?: number;
  link?: string;
}

interface SearchData {
  original: string;
  corrected?: string | null;
  parsed?: string | null;
}

interface TestResult {
  query_used: string;
  parsed: string;
  result_count: number;
  execution_time: number;
  sql: string;
}

interface PublicacoesProps {
  results: Publicacao[];
  search?: string | SearchData;
  error?: string;
  warning?: string;
  testResult?: TestResult;
}

export default function Publicacoes({ results, search, error, warning, testResult }: PublicacoesProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<keyof Publicacao>('ano');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // Compatibilidade: search pode ser string (antigo) ou objeto (novo)
  const searchData =
    typeof search === 'string' ? { original: search, corrected: null, parsed: null } : search || { original: '', corrected: null, parsed: null };

  const sortedResults = [...results].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];

    // Se estiver ordenando por ano, faz a comparação numérica
    if (sortBy === 'ano') {
      const aNum = typeof aValue === 'number' ? aValue : 0;
      const bNum = typeof bValue === 'number' ? bValue : 0;
      return sortOrder === 'desc' ? bNum - aNum : aNum - bNum;
    }

    // Para outros campos, faz a comparação de string
    const aStr = aValue?.toString() || '';
    const bStr = bValue?.toString() || '';
    return sortOrder === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
  });

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const paginatedResults = sortedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (column: keyof Publicacao) => {
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

        {/* Alertas de erro */}
        {error && (
          <div className="mb-4 flex items-start rounded-lg border border-red-200 bg-red-100 p-4">
            <AlertCircle className="mt-0.5 mr-3 h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">Erro</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Avisos (query corrigida) */}
        {warning && (
          <div className="mb-4 flex items-start rounded-lg border border-yellow-200 bg-yellow-100 p-4">
            <Info className="mt-0.5 mr-3 h-5 w-5 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-yellow-800">Aviso</h3>
              <p className="text-sm text-yellow-700">{warning}</p>
            </div>
          </div>
        )}

        {/* Informações sobre a busca */}
        {searchData.original && (
          <div className="border-white-50 mb-4 space-y-2 rounded-lg border p-4">
            <div className="text-sm">
              <span className="mr-2 font-semibold">Busca original:</span>{' '}
              <code className="rounded border px-2 py-1 text-xs">{searchData.original}</code>
            </div>

            {searchData.corrected && searchData.corrected !== searchData.original && (
              <div className="text-sm">
                <span className="mr-2 font-semibold text-orange-700">Query corrigida:</span>{' '}
                <code className="rounded border border-orange-200 px-2 py-1 text-xs">{searchData.corrected}</code>
              </div>
            )}

            {searchData.parsed && (
              <div className="text-sm">
                <span className="mr-2 font-semibold text-green-700">Interpretado como:</span>{' '}
                <code className="rounded border border-green-200 px-2 py-1 text-xs">{searchData.parsed}</code>
              </div>
            )}
          </div>
        )}

        <div className="mb-4 text-sm text-gray-600">
          Exibindo {paginatedResults.length} de {results.length} resultados
          {searchData.original && <span> para a pesquisa</span>}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[55%] max-w-[400px] min-w-[200px] cursor-pointer">
                  <div className="flex items-center space-x-2" onClick={() => handleSort('titulo')}>
                    <span>Título</span>
                    {sortBy === 'titulo' && <ChevronDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </div>
                </TableHead>
                <TableHead className="w-[30%] max-w-[300px] min-w-[150px] cursor-pointer">
                  <div className="flex items-center space-x-2" onClick={() => handleSort('autores')}>
                    <span>Autores</span>
                    {sortBy === 'autores' && <ChevronDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </div>
                </TableHead>
                <TableHead className="w-[5%] max-w-[100px] min-w-[80px] cursor-pointer">
                  <div className="flex items-center space-x-2" onClick={() => handleSort('ano')}>
                    <span>Ano</span>
                    {sortBy === 'ano' && <ChevronDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />}
                  </div>
                </TableHead>
                <TableHead className="w-[20%] max-w-[200px] min-w-[120px]">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((publicacao, index) => (
                <TableRow key={index}>
                  <TableCell className="w-[40%] max-w-[400px] min-w-[200px] font-medium">{publicacao.titulo || 'Sem título'}</TableCell>
                  <TableCell className="w-[30%] max-w-[300px] min-w-[150px]">
                    {publicacao.autores ? <pre className="break-words whitespace-pre-wrap">{publicacao.autores}</pre> : 'Sem autores'}
                  </TableCell>
                  <TableCell className="w-[10%] max-w-[100px] min-w-[80px]">{publicacao.ano || 'Sem ano'}</TableCell>
                  <TableCell className="w-[10%] max-w-[200px] min-w-[120px]">
                    {publicacao.link ? (
                      <a
                        href={publicacao.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:text-blue-700"
                      >
                        Abrir Link <ExternalLink className="ml-1 h-4 w-4" />
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
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}

        {/* Modo de teste */}
        {testResult && (
          <div className="mt-8 rounded-lg border-2 border-yellow-200 bg-yellow-100 p-4 dark:text-black">
            <h3 className="mb-3 font-bold text-blue-900">Modo de Teste (Debug)</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-blue-900">Query usada:</strong> <code className="rounded bg-white px-2 py-1">{testResult.query_used}</code>
              </div>
              <div>
                <strong className="text-blue-900">AST:</strong> <code className="rounded bg-white px-2 py-1 text-xs">{testResult.parsed}</code>
              </div>
              <div>
                <strong className="text-blue-900">Resultados:</strong> {testResult.result_count}
              </div>
              <div>
                <strong className="text-blue-900">Tempo:</strong> {testResult.execution_time}ms
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer font-semibold text-blue-900 hover:text-blue-700">Ver SQL Gerado</summary>
                <pre className="mt-2 overflow-x-auto rounded border bg-white p-3 text-xs">{testResult.sql}</pre>
              </details>
            </div>
          </div>
        )}

        <section className="mt-8 mb-12">{/* Conteúdo da descrição aqui */}</section>
      </div>
    </Layout>
  );
}
