import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from '@inertiajs/react'; // Importa o useForm do Inertia

export function SearchBar() {
  const { data, setData, get, processing } = useForm({
    search: '', // Campo para a string de pesquisa
  });

  const handleSearch = (e) => {
    e.preventDefault();
    get('/publicacoes', {
      preserveScroll: true, // Mantém a posição de rolagem
    });
    setData('search', '');
  };

  return (
    <form onSubmit={handleSearch} className="mx-auto flex w-full max-w-4xl items-center gap-10">
      <Input
        type="text"
        placeholder="Digite uma ou mais palavras para pesquisar na base do e-AVAL"
        className="h-12 flex-1 rounded-lg border border-gray-300 px-4 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        value={data.search}
        onChange={(e) => setData('search', e.target.value)}
      />
      <Button
        type="submit"
        variant="outline"
        className="h-12 border-blue-600 bg-blue-600 px-6 font-medium text-white hover:border-blue-700 hover:bg-blue-700"
      >
        Ver Resultados
      </Button>
    </form>
  );
}
