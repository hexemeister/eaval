import ChartControls from '@/components/ChartControls';
import DynamicDataTable from '@/components/DynamicDataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/layouts/Layout';
import { Head } from '@inertiajs/react';
import { BarChart3, Table as TableIcon } from 'lucide-react';

interface Props {
    dados: Record<string, unknown>[];
    colunas: string[];
    title: string;
    hasYearFilter?: boolean;
}

export default function Generico({ dados, colunas, title, hasYearFilter = false }: Props) {
    const xKey = colunas[0];
    const yKey = colunas[colunas.length - 1];

    return (
        <Layout>
            <Head title={title} />
            <div className="container mx-auto px-4 py-6">
                <h1 className="mb-6 text-2xl font-bold">{title}</h1>

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
                        <DynamicDataTable
                            data={dados}
                            exportFilename={title.toLowerCase().replace(/\s+/g, '-')}
                            defaultSorting={hasYearFilter ? [{ id: xKey!, desc: true }] : undefined}
                        />
                    </TabsContent>

                    <TabsContent value="chart" forceMount className="data-[state=inactive]:hidden">
                        <ChartControls
                            data={dados}
                            xKey={xKey!}
                            yKey={yKey!}
                            hasYearFilter={hasYearFilter}
                            title={title}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}
