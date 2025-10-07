import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

export function Aviso() {
  return (
    <div className="mb-4 px-4 sm:px-6 lg:px-8">
      <Card className="my-0 text-sm sm:text-base">
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
  );
}
