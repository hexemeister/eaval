import DynamicDataTable from '@/components/DynamicDataTable';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/layouts/Layout';

export default function PorAno(results: any) {
  const dataArray = results?.publicacoesPorAno || [];

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas por ano (WIP)</h1>

        <DynamicDataTable data={dataArray} exportFilename='porAno' />
      </div>
    </Layout>
  );
}
