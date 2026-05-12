import DynamicDataTable from '@/components/DynamicDataTable';
import { Layout } from '@/layouts/Layout';

interface PorPeriodicoProps {
  publicacoesPorPeriodico: Record<string, unknown>[]; // ? = opcional
  breadcrumb: Array<{ label: string; href?: string }>;
  title: string;
}

export default function PorPeriodico(results: PorPeriodicoProps) {
  const dataArray = results?.publicacoesPorPeriodico || [];

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas por periódico (WIP)</h1>

        <DynamicDataTable data={dataArray} exportFilename="porPeriodico" />
      </div>
    </Layout>
  );
}
