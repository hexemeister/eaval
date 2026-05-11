import DynamicDataTable from '@/components/DynamicDataTable';
import { Layout } from '@/layouts/Layout';

interface TotalGeralProps {
  totalPublicacoes: Record<string, unknown>[]; // ? = opcional
  breadcrumb: Array<{ label: string; href?: string }>;
  title: string;
}

export default function TotalGeral(results: TotalGeralProps) {
  const dataArray = results?.totalPublicacoes || [];
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas</h1>

        <DynamicDataTable data={dataArray} exportFilename="totalGeral" />
      </div>
    </Layout>
  );
}
