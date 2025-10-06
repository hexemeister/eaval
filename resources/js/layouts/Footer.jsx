import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Footer() {
  return (
    <footer className="border-t p-4">
      <div>
        <TooltipProvider>
          <Tooltip>
            <p className="text-center text-sm text-muted-foreground">
              © 2025 e-Aval. Todos os direitos reservados.{' '}
              <TooltipTrigger asChild>
                <span className="font-bold">Código aberto</span>
              </TooltipTrigger>
              <TooltipContent className="border">
                <p className="text-sm text-justify">
                  Código aberto refere-se a software, projetos ou tecnologia cujo código-fonte é público e acessível, permitindo que qualquer pessoa
                  veja, use, modifique e distribua livremente o código sob os termos de uma licença específica.
                </p>
              </TooltipContent>{' '}
              disponível no{' '}
              <a
                href="https://github.com/hexemeister/eaval"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline-offset-4 hover:text-blue-700 hover:underline"
              >
                GitHub
              </a>
            </p>
          </Tooltip>
        </TooltipProvider>
      </div>
    </footer>
  );
}
