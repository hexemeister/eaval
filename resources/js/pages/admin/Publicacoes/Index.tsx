// resources/js/pages/Publications/Index.tsx

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

interface Publicacao {
  id: number;
  title: string;
  authors: string;
  year: string;
}

interface PaginationProps<T> {
  data: T[];
  links: unknown[];
  meta: unknown;
  current_page: number;
  last_page: number;
  total: number;
}

interface PublicationsProps {
  publicacoes: PaginationProps<Publicacao>;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: dashboard().url,
  },
];

export default function PublicationsIndex({ publicacoes }: PublicationsProps) {
  return (
    <>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Publicações Científicas" />

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Publicações Científicas</h1>
            <Button>Incluir Publicação Científica</Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Autores</TableHead>
                  <TableHead className="w-[100px]">Ano</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publicacoes.data.map((pub) => (
                  <TableRow key={pub.id}>
                    <TableCell className="font-medium">{pub.id}</TableCell>
                    <TableCell>{pub.title}</TableCell>
                    <TableCell>{pub.authors}</TableCell>
                    <TableCell>{pub.year}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          Abrir
                        </Button>
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
