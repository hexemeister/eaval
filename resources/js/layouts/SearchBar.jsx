import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@inertiajs/react';
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

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto flex w-full max-w-2xl flex-grow flex-col items-stretch gap-6 sm:flex-row sm:items-center sm:gap-4"
    >
      <Input
        id="input-search"
        ref={inputRef}
        type="text"
        placeholder="Pesquise na base de dados do e-AVAL"
        className="h-12 flex-1 rounded-lg border border-gray-300 px-4 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        value={data.search}
        onChange={(e) => setData('search', e.target.value)}
        disabled={processing}
      />
      <Button
        id="btn-search"
        type="submit"
        variant="default" // ou mantenha 'outline' se preferir, mas bg-blue-600 sugere 'default'
        disabled={processing || !data.search.trim()}
        className="h-12 border-blue-600 bg-blue-600 px-6 font-medium whitespace-nowrap text-white hover:border-blue-700 hover:bg-blue-700 sm:mt-0 sm:w-auto"
      >
        {processing ? 'Buscando...' : 'Ver Resultados'}
      </Button>
    </form>
  );
}
