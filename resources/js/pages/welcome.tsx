import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Layout } from '@/layouts/Layout';
import { SearchBar } from '@/layouts/SearchBar';
import { Link } from '@inertiajs/react';

import eavalImgUrl from '../../images/eaval.png';

export default function Welcome() {
  return (
    <Layout>
      <div className="mb-2">
        <Card className='-my-4 text-xs'>
          <CardHeader>
            <CardTitle>Aviso:</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              A plataforma encontra-se em desenvolvimento e diversas funcionalidades permanecem desativadas. A etiqueta WIP (Work In Progress)
              identifica as páginas que se encontram em processo de elaboração. Para mais informações, consulte a seção{' '}
              <Link className="text-blue-500 hover:underline hover:underline-offset-4" href="/sobre">
                "Sobre o projeto"
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mx-auto my-4 w-1/4 align-middle">
        <img src={eavalImgUrl} className="my-10 w-full object-fill" />
      </div>

      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SearchBar />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                Recursos de pesquisa: use wildcards (*, ?) (ex.: tec*), textos exatos com aspas ("exato"), e operadores booleanos (AND, OR, NOT) (ex.:
                (educação OR tecnologia) NOT jogo).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Layout>
  );
}
