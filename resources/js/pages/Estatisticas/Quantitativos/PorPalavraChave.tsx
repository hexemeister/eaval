import DynamicChart from '@/components/DynamicChart';
import DynamicDataTable from '@/components/DynamicDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/layouts/Layout';
import { BarChart3, Table as TableIcon } from 'lucide-react';

interface PorPalavraChaveProps {
  quantidadePalavrasChave: Record<string, unknown>[]; // ? = opcional
  breadcrumb: Array<{ label: string; href?: string }>;
  title: string;
}

export default function PorPalavraChave(results: PorPalavraChaveProps) {
  const dataArray = results?.quantidadePalavrasChave || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-8 text-3xl font-bold">Quantitativos de publicações científicas por palavra-chave</h1>

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
            <DynamicDataTable data={dataArray} exportFilename="porPalavraChave" />
          </TabsContent>

          <TabsContent value="chart">
            <div className="h-[600px] w-full min-h-[600px]">
              <DynamicChart
                data={dataArray.slice(0, 20)}
                xKey="texto"
                yKey="frequencia"
                chartType="bar_horizontal"
                title="Top 20 Palavras-chave"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
