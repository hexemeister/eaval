import DynamicChart from '@/components/DynamicChart';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';

interface ChartControlsProps {
    data: Record<string, unknown>[];
    xKey: string;
    yKey: string;
    hasYearFilter?: boolean;
    title?: string;
}

export default function ChartControls({ data, xKey, yKey, hasYearFilter = false, title }: ChartControlsProps) {
    const [chartType, setChartType] = useState<'bar' | 'bar_horizontal' | 'line' | 'pie'>('bar');
    const [chartLimit, setChartLimit] = useState(10);

    // "Linha" só faz sentido para série temporal; reseta para barras se selecionado sem yearFilter
    useEffect(() => {
        if (!hasYearFilter && chartType === 'line') {
            setChartType('bar');
        }
    }, [hasYearFilter, chartType]);
    const [display, setDisplay] = useState<'absoluto' | 'percentual'>('absoluto');
    const [anoInicio, setAnoInicio] = useState<number | null>(null);
    const [anoFim, setAnoFim] = useState<number | null>(null);

    const anos = useMemo(() => {
        if (!hasYearFilter) return [];
        return data
             
            .map((item) => Number(item[xKey]))
            .filter((a) => !isNaN(a) && a > 0)
            .sort((a, b) => a - b);
    }, [data, hasYearFilter, xKey]);

    const filteredData = useMemo(() => {
        if (!hasYearFilter || anos.length === 0) return data;
        const start = anoInicio ?? anos[0]!;
        const end = anoFim ?? anos[anos.length - 1]!;
        return data.filter((item) => {
             
            const ano = Number(item[xKey]);
            return ano >= start && ano <= end;
        });
    }, [data, hasYearFilter, anos, anoInicio, anoFim, xKey]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1">
                    <Label>Tipo de gráfico</Label>
                    <Select value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bar">Barras verticais</SelectItem>
                            <SelectItem value="bar_horizontal">Barras horizontais</SelectItem>
                            {hasYearFilter && <SelectItem value="line">Linha</SelectItem>}
                            <SelectItem value="pie">Pizza</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <Label>Exibição</Label>
                    <Select value={display} onValueChange={(v) => setDisplay(v as typeof display)}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="absoluto">Absoluto</SelectItem>
                            <SelectItem value="percentual">Percentual</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {data.length > 10 && chartType !== 'pie' && !hasYearFilter && (
                    <div className="space-y-1">
                        <Label>Exibir top</Label>
                        <Select value={String(chartLimit)} onValueChange={(v) => setChartLimit(Number(v))}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="40">40</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {hasYearFilter && anos.length > 0 && (
                    <>
                        <div className="space-y-1">
                            <Label>Ano início</Label>
                            <Select
                                value={String(anoInicio ?? anos[0])}
                                onValueChange={(v) => setAnoInicio(Number(v))}
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {anos.map((ano) => (
                                        <SelectItem key={ano} value={String(ano)}>
                                            {ano}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label>Ano fim</Label>
                            <Select
                                value={String(anoFim ?? anos[anos.length - 1])}
                                onValueChange={(v) => setAnoFim(Number(v))}
                            >
                                <SelectTrigger className="w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {anos.map((ano) => (
                                        <SelectItem key={ano} value={String(ano)}>
                                            {ano}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
            </div>

            <div className="w-full">
                <DynamicChart
                    data={filteredData}
                    xKey={xKey}
                    yKey={yKey}
                    chartType={chartType}
                    display={display}
                    title={title}
                    chartLimit={chartLimit}
                />
            </div>
        </div>
    );
}
