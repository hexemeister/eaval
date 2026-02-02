import DynamicDataTable from '@/components/DynamicDataTable';
import { Layout } from '@/layouts/Layout';

export default function TotalGeral(results: any) {
  const dataArray = results?.totalPublicacoes || [];
console.log('TotalGeral results:', results);
  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas (WIP)</h1>

        <DynamicDataTable data={dataArray} exportFilename='totalGeral' />
      </div>
    </Layout>
  );
}
