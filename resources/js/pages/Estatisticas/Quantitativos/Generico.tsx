import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layout } from '@/layouts/Layout';
import { Head } from '@inertiajs/react';

interface Props {
  dados: Record<string, string | number | null | undefined>[];
  colunas: string[];
  title: string;
}

export default function Generico({ dados, colunas, title }: Props) {
  return (
    <Layout>
      <Head title={title} />
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {colunas.map((coluna) => (
                  <TableHead key={coluna}>{coluna}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.length > 0 ? (
                dados.map((item, index) => (
                  <TableRow key={index}>
                    {colunas.map((coluna) => (
                      <TableCell key={`${index}-${coluna}`}>{item[coluna]}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={colunas.length} className="h-24 text-center">
                    Nenhum dado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
