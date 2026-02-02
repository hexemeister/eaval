import DynamicDataTable from '@/components/DynamicDataTable';
import { Layout } from '@/layouts/Layout';

interface PorAnoProps {
  publicacoesPorAno: Record<string, unknown>[]; // ? = opcional
  breadcrumb: Array<{ label: string; href?: string }>;
  title: string;
}

export default function PorAno(results: PorAnoProps) {
  const dataArray = results?.publicacoesPorAno || [];

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas por ano (WIP)</h1>

        <DynamicDataTable data={dataArray} exportFilename="porAno" />
      </div>
    </Layout>
  );
}
