import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Layout } from '@/layouts/Layout';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

export default function Pesquisa() {
  const { props } = usePage<PageProps>();
  const [query, setQuery] = useState<string>(props.search ?? '');
  const [results, setResults] = useState<any[]>(props.results ?? []);

  const handleAddOperator = (operator: string) => {
    setQuery((prev) => prev + ` ${operator} `);
  };

  const handleSubmit = () => {
    // Enviar a query ao backend via Inertia
    window.location.href = `/publicacoes?search=${encodeURIComponent(query)}&test_mode=true`;
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    window.location.href = `/publicacoes`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Pesquisa avançada (WIP)</h1>

        {/* Seção de Descrição */}
        <section className="mb-12">
          <Card>
            <CardContent className="pt-6">
              <p className="my-2">
                Pesquise publicações científicas com filtros avançados. Use operadores como AND, OR e NOT, e inclua frases exatas entre aspas (ex.: "silveira").
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Formulário de Pesquisa */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Insira sua pesquisa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder='Ex.: (educação OR tecnologia) NOT (jogo OR \"silveira\")'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => handleAddOperator('AND')}>AND</Button>
                  <Button onClick={() => handleAddOperator('OR')}>OR</Button>
                  <Button onClick={() => handleAddOperator('NOT')}>NOT</Button>
                  <Button onClick={handleSubmit} className="ml-auto">Pesquisar</Button>
                  <Button variant="outline" onClick={handleClear}>Limpar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Seção de Resultados */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Resultados ({results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <ul className="space-y-4">
                  {results.map((result) => (
                    <li key={result.id} className="border-b pb-2">
                      <h3 className="font-semibold">{result.titulo || 'Sem título'}</h3>
                      <p className="text-sm text-muted-foreground">Autores: {result.autores || 'Sem autores'}</p>
                      <p className="text-sm text-muted-foreground">Ano: {result.ano || 'Sem ano'}</p>
                      <a href={result.link || '#'} className="text-blue-500 hover:underline">Link</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Nenhum resultado encontrado. Tente uma nova pesquisa.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}