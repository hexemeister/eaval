import DynamicChart from '@/components/DynamicChart';
import DynamicDataTable from '@/components/DynamicDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/layouts/Layout';
import { BarChart3, Table as TableIcon } from 'lucide-react';

interface PorAnoProps {
  publicacoesPorAno: Record<string, unknown>[]; // ? = opcional
  breadcrumb: Array<{ label: string; href?: string }>;
  title: string;
}

export default function PorAno(results: PorAnoProps) {
  const dataArray = results?.publicacoesPorAno || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas por ano</h1>

        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table" className="gap-2">
              <TableIcon className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráfico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <DynamicDataTable data={dataArray} exportFilename="porAno" />
          </TabsContent>

          <TabsContent value="chart">
            <div className="h-[500px] w-full min-h-[500px]">
              <DynamicChart data={dataArray} xKey="ano" yKey="total" chartType="bar" title="Produção por Ano" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
