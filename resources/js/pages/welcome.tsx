import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Aviso } from '@/layouts/Aviso';
import { Layout } from '@/layouts/Layout';
import { SearchBar } from '@/layouts/SearchBar';

import eavalImgUrl from '../../images/eaval.png';

export default function Welcome() {
  return (
    <Layout>
      <Aviso />

      {/* Logo - responsivo */}
      <div className="mx-auto my-6 px-4 sm:px-6 lg:px-8">
        <img src={eavalImgUrl} alt="e-Aval" className="mx-auto my-6 h-auto w-full max-w-[300px] object-contain sm:max-w-[400px]" />
      </div>

      {/* Barra de pesquisa com tooltip - responsiva */}
      <div className="mx-auto mb-0 max-w-3xl px-4 sm:px-6 lg:px-8">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SearchBar />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs sm:max-w-sm">
              <p className="text-xs sm:text-sm">
                Recursos de pesquisa: use wildcards (*, ?) (ex.: tec*), textos exatos com aspas ("exato"), e operadores booleanos (AND, OR, NOT) (ex.:
                (educação OR tecnologia) AND NOT jogo).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Layout>
  );
}
