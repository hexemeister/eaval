import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/layouts/Layout';
import type { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Pesquisa() {
  const { props } = usePage<PageProps>();
  const [query, setQuery] = useState<string>(props.search ?? '');
  const [searchFields, setSearchFields] = useState<string[]>(['0']); // Default: Título
  const [areas, setAreas] = useState<string[]>(['0']); // Default: Educação
  // const [results, setResults] = useState<any[]>(props.results ?? []);

  // const handleAddOperator = (operator: string) => {
  //   setQuery((prev) => prev + ` ${operator} `);
  // };

  const handleSubmit = () => {
    const params = new URLSearchParams({
      search: encodeURIComponent(query),
      fields: searchFields.join(','),
      areas: areas.join(','),
      test_mode: 'true',
    }).toString();
    window.location.href = `/publicacoes?${params}`;
  };

  const handleClear = () => {
    setQuery('');
    setSearchFields(['0']);
    setAreas(['0']);
    setResults([]);
    window.location.href = `/publicacoes`;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Pesquisa avançada (WIP)</h1>

        {/* Formulário de Pesquisa */}
        <section className="mb-4">
          <Card>
            <CardContent>
              <div className="mt-6 space-y-4">
                {/* Campo de texto */}
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Digite uma ou mais palavras"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Filtros - Pesquisar por */}
                <div className="space-y-2">
                  <Label htmlFor="searchFields">Pesquisar por</Label>
                  <div className="flex flex-wrap gap-4">
                    {['Título', 'Autor', 'Palavras-chave', 'Resumo', 'Todos'].map((field, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`searchField_${index}`}
                          value={index.toString()}
                          checked={searchFields.includes(index.toString())}
                          onCheckedChange={(checked) => {
                            setSearchFields((prev) => (checked ? [...prev, index.toString()] : prev.filter((f) => f !== index.toString())));
                          }}
                        />
                        <Label htmlFor={`searchField_${index}`}>{field}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtros - Áreas */}
                <div className="space-y-2">
                  <Label htmlFor="areas">Áreas</Label>
                  <div className="flex flex-wrap gap-4">
                    {['Educação', 'Saúde', 'Ambiental', 'Social', 'Todas'].map((area, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`area_${index}`}
                          value={index.toString()}
                          checked={areas.includes(index.toString())}
                          onCheckedChange={(checked) => {
                            setAreas((prev) => (checked ? [...prev, index.toString()] : prev.filter((a) => a !== index.toString())));
                          }}
                        />
                        <Label htmlFor={`area_${index}`}>{area}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSubmit} className="btn-primary ml-auto">
                    Ver resultados
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Limpar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sugestão para ver todas as publicações */}
        <div className="mb-0">
          <p className="text-muted-foreground">
            Ao invés de pesquisar,{' '}
            <a href="/publicacao/listagem" className="text-blue-500 hover:underline">
              clique aqui para ver todas as publicações cadastradas no e-Aval
            </a>
            .
          </p>
        </div>
      </div>
    </Layout>
  );
}
