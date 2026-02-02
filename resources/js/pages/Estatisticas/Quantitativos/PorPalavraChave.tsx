import DynamicDataTable from '@/components/DynamicDataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/layouts/Layout';

export default function PorPalavraChave(results: any) {
  const dataArray = results?.quantidadePalavrasChave || [];

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas por palavra-chave (WIP)</h1>

        <DynamicDataTable data={dataArray} exportFilename='porPalavraChave' />
      </div>
    </Layout>
  );
}
