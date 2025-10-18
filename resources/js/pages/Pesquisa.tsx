import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Layout } from '@/layouts/Layout';
import type { PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { AlignLeft, FileText, Hash, HelpCircle, Search, Sparkles, User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Definir constantes para reutilização
const SEARCH_FIELDS = [
  { label: 'Título', icon: FileText },
  { label: 'Autor', icon: User },
  { label: 'Palavras-chave', icon: Hash },
  { label: 'Resumo', icon: AlignLeft },
];
const AREAS = ['Educação', 'Saúde', 'Ambiental', 'Social'];

export default function Pesquisa() {
  const { props } = usePage<PageProps>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Estados para os campos de pesquisa
  const [query, setQuery] = useState<string>(props.search ?? '');
  const [searchFields, setSearchFields] = useState<string[]>(['0', '1', '2', '3']); // Default: Todos
  const [areas, setAreas] = useState<string[]>(['0', '1', '2', '3']); // Default: Educação
  const [showHelp, setShowHelp] = useState(false);

  // Focar no input quando a página carregar
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleAddOperator = (operator: string) => {
    setQuery((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${operator} ` : '';
    });
    // Focar de volta no input
    setTimeout(() => {
      const input = inputRef.current;
      if (input) {
        const length = input?.value.length;
        input?.focus();
        inputRef.current?.setSelectionRange(length, length);
      }
    }, 0);
  };

  const handleAddWrapper = (wrapper: string) => {
    setQuery((prev) => prev + wrapper);
    setTimeout(() => {
      const input = inputRef.current;
      if (input) {
        const currentValue = input.value;
        const position = currentValue.length - (wrapper.length === 2 ? 1 : wrapper.length / 2);
        input.setSelectionRange(position, position);
        input.focus();
      }
    }, 0);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!query.trim()) {
      // Se query vazia, redirecionar para todas publicações
      router.get('/publicacoes');
      return;
    }

    // Usar router.get ao invés de window.location para melhor integração com Inertia
    router.get(
      '/publicacoes',
      {
        search: query.trim(), // NÃO usar encodeURIComponent - Inertia faz isso
        fields: searchFields.join(','),
        areas: areas.join(','),
      },
      {
        preserveState: true,
        preserveScroll: false,
      },
    );
  };

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchFields(['0', '1', '2', '3']); // Reset para Todos
    setAreas(['0']); // Reset para Educação
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClear();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClear]); // Inclua handleClear nas dependências

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Funções para lidar com os campos de pesquisa
  const handleSearchFieldChange = (value: string, checked: boolean) => {
    if (checked) {
      setSearchFields((prev) => [...prev, value]);
    } else {
      setSearchFields((prev) => {
        const newFields = prev.filter((f) => f !== value);
        // Garantir que ao menos um campo está selecionado
        return newFields.length > 0 ? newFields : [value];
      });
    }
  };

  // Funções para lidar com as áreas
  const handleAreaChange = (value: string, checked: boolean) => {
    if (checked) {
      setAreas((prev) => [...prev, value]);
    } else {
      setAreas((prev) => {
        const newAreas = prev.filter((a) => a !== value);
        // Garantir que ao menos uma área está selecionada
        return newAreas.length > 0 ? newAreas : [value];
      });
    }
  };

  // // Atalhos para todos/nenhum
  // const handleToggleAllFields = () => {
  //   if (searchFields.length === SEARCH_FIELDS.length) {
  //     setSearchFields(['0']); // Deixar apenas Título
  //   } else {
  //     setSearchFields(SEARCH_FIELDS.map((_, i) => i.toString()));
  //   }
  // };

  // const handleToggleAllAreas = () => {
  //   if (areas.length === AREAS.length) {
  //     setAreas(['0']); // Deixar apenas Educação
  //   } else {
  //     setAreas(AREAS.map((_, i) => i.toString()));
  //   }
  // };

  // const allFieldsSelected = searchFields.length === SEARCH_FIELDS.length;
  // const allAreasSelected = areas.length === AREAS.length;

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Pesquisa Avançada (WIP)</h1>
          <p className="text-muted-foreground">Busque por artigos usando operadores booleanos e filtros personalizados</p>
        </div>

        {/* Formulário de Pesquisa */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Query de Busca</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)} className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {showHelp ? 'Ocultar' : 'Ver'} Ajuda
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campo de texto com ícone */}
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder='Ex: avaliação AND (ENEM OR SAEB) NOT "ensino superior"'
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="h-12 pr-10 pl-10 text-base"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Operadores booleanos */}
              <div className="flex flex-wrap gap-2">
                <span className="self-center text-sm text-muted-foreground">Operadores:</span>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddOperator('AND')} className="font-mono">
                  AND
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddOperator('OR')} className="font-mono">
                  OR
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddOperator('NOT')} className="font-mono">
                  NOT
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddWrapper('()')} className="font-mono">
                  ( )
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAddWrapper('""')} className="font-mono">
                  " "
                </Button>
              </div>

              {/* Ajuda rápida */}
              {showHelp && (
                <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-sm">
                  <p className="font-semibold text-blue-900">💡 Como usar:</p>
                  <ul className="list-inside list-disc space-y-1 text-blue-800">
                    <li>
                      <code className="rounded bg-white px-1">educação AND tecnologia</code> - ambos os termos
                    </li>
                    <li>
                      <code className="rounded bg-white px-1">ENEM OR SAEB</code> - qualquer um dos termos
                    </li>
                    <li>
                      <code className="rounded bg-white px-1">NOT professor</code> - excluir termo
                    </li>
                    <li>
                      <code className="rounded bg-white px-1">"educação básica"</code> - frase exata
                    </li>
                    <li>
                      <code className="rounded bg-white px-1">avalia*</code> - wildcard (* = vários caracteres)
                    </li>
                    <li>
                      <code className="rounded bg-white px-1">educa??o</code> - wildcard (? = um caractere)
                    </li>
                    <li>
                      <code className="rounded bg-white px-1">(a OR b) AND c</code> - use parênteses para precedência
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campos de pesquisa */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Pesquisar em:</Label>
                  {/* <Button type="button" variant="ghost" size="sm" onClick={handleToggleAllFields} className="text-xs">
                    {allFieldsSelected ? 'Desmarcar todos' : 'Marcar todos'}
                  </Button> */}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {SEARCH_FIELDS.map((field, index) => {
                    const Icon = field.icon;
                    const isChecked = searchFields.includes(index.toString());
                    return (
                      <div
                        key={index}
                        className={`flex cursor-pointer items-center space-x-2 rounded-lg border-2 p-3 transition-all ${
                          isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        } `}
                        onClick={() => handleSearchFieldChange(index.toString(), !isChecked)}
                      >
                        <Checkbox
                          id={`searchField_${index}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            handleSearchFieldChange(index.toString(), checked as boolean);
                          }}
                        />
                        <Label htmlFor={`searchField_${index}`} className="flex flex-1 cursor-pointer items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {field.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Áreas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Áreas:</Label>
                  {/* <Button type="button" variant="ghost" size="sm" onClick={handleToggleAllAreas} className="text-xs">
                    {allAreasSelected ? 'Desmarcar todas' : 'Marcar todas'}
                  </Button> */}
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {AREAS.map((area, index) => {
                    const isChecked = areas.includes(index.toString());
                    return (
                      <Badge
                        key={index}
                        variant={isChecked ? 'default' : 'outline'}
                        className="cursor-pointer px-4 py-2 text-sm w-full justify-start"
                        onClick={() => handleAreaChange(index.toString(), !isChecked)}
                      >
                        <Checkbox
                          id={`area_${index}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            handleAreaChange(index.toString(), checked as boolean);
                          }}
                          className="mr-2"
                        />
                        {area}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="submit" className="gap-2" size="lg">
              <Search className="h-5 w-5" />
              Buscar {query.trim() && `"${query.trim().substring(0, 20)}${query.length > 20 ? '...' : ''}"`}
            </Button>
            <Button type="button" variant="outline" onClick={handleClear} className="gap-2">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </form>

        {/* Sugestão para ver todas as publicações */}
        <div className="mt-8 rounded-lg bg-muted p-4">
          <p className="text-center text-muted-foreground">
            <Sparkles className="mr-1 inline h-4 w-4" />
            Ao invés de pesquisar,{' '}
            <Link href="/publicacoes" className="font-medium text-primary hover:underline">
              clique aqui para ver todas as publicações cadastradas no e-Aval
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}
