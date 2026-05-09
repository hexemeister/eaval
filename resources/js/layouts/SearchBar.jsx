import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useForm } from '@inertiajs/react';
import { HelpCircle, Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function SearchBar() {
  const { data, setData, get, processing } = useForm({
    search: '',
  });

  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!data.search.trim()) return; // Evita busca vazia
    get('/publicacoes', {
      preserveScroll: true,
    });
    setData('search', '');
  };

  const handleClear = () => {
    setData('search', '');
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2">
      <form
        onSubmit={handleSearch}
        className="flex w-full flex-grow flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" aria-hidden="true" />
          <Input
            id="input-search"
            ref={inputRef}
            type="text"
            placeholder="Pesquise na base de dados do e-AVAL"
            aria-label="Campo de pesquisa"
            className="h-12 flex-1 rounded-lg border border-gray-300 pr-10 pl-10 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={data.search}
            onChange={(e) => setData('search', e.target.value)}
            disabled={processing}
          />
          {data.search && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-1/2 right-3 -translate-y-1/2 transform text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
              aria-label="Limpar pesquisa"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="btn-search"
            type="submit"
            variant="default"
            disabled={processing || !data.search.trim()}
            className="h-12 flex-1 border-blue-600 bg-blue-600 px-6 font-medium whitespace-nowrap text-white hover:border-blue-700 hover:bg-blue-700 sm:mt-0 sm:w-auto"
          >
            {processing ? 'Buscando...' : 'Ver Resultados'}
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-12 w-12 text-muted-foreground" aria-label="Ajuda na pesquisa">
                  <HelpCircle className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="w-64 max-w-xs sm:max-w-sm dark:border-2 dark:border-black dark:ring dark:ring-white"
              >
                <p className="text-xs sm:text-sm">
                  <strong>Dicas de pesquisa:</strong>
                  <br />• Use <code>*</code> ou <code>?</code> para wildcards (ex: tec*)
                  <br />• Use aspas para termos exatos (ex: "educação")
                  <br />• Use operadores booleanos: <code>AND, OR, NOT</code>
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
}
