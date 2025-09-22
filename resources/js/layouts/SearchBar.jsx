import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  return (
    <div className="flex w-full max-w-4xl mx-auto items-center gap-10">
      <Input 
        type="text" 
        placeholder="Digite uma ou mais palavras para pesquisar na base do e-AVAL"
        className="flex-1 h-12 px-4 text-base border border-gray-300 
                  rounded-lg shadow-sm focus:outline-none focus:ring-2 
                  focus:ring-blue-500 focus:border-blue-500"
      />
      <Button 
        type="submit" 
        variant="outline"
        className="h-12 px-6 bg-blue-600 text-white hover:bg-blue-700 
                  border-blue-600 hover:border-blue-700 font-medium"
      >
        Ver Resultados
      </Button>
    </div>
  )
}