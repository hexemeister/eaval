import DynamicDataTable from '@/components/DynamicDataTable';
import { Layout } from '@/layouts/Layout';

interface PorPalavraChaveProps {
  quantidadePalavrasChave: Record<string, unknown>[]; // ? = opcional
  breadcrumb: Array<{ label: string; href?: string }>;
  title: string;
}

export default function PorPalavraChave(results: PorPalavraChaveProps) {
  const dataArray = results?.quantidadePalavrasChave || [];

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas por palavra-chave (WIP)</h1>

        <DynamicDataTable data={dataArray} exportFilename="porPalavraChave" />
      </div>
    </Layout>
  );
}
