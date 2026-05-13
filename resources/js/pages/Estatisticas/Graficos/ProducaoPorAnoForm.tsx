import DynamicChart from '@/components/DynamicChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/layouts/Layout';
import { useEffect, useState } from 'react';

// Defina os tipos
interface ProducaoData {
  ano: number;
  total: number;
}

interface Props {
  initialData: ProducaoData[];
  initialAnoInicio: number;
  initialAnoFim: number;
  anosDisponiveis: number[];
}

export default function ProducaoPorAnoForm({ initialData, initialAnoInicio, initialAnoFim, anosDisponiveis }: Props) {
  const [anoInicio, setAnoInicio] = useState(String(initialAnoInicio));
  const [anoFim, setAnoFim] = useState(String(initialAnoFim));
  const [tipoGrafico, setTipoGrafico] = useState<'barras_verticais' | 'barras_horizontais' | 'linha' | 'pizza'>('barras_verticais');
  const [exibir, setExibir] = useState<'absolutos' | 'percentuais'>('absolutos');
  const [chartData, setChartData] = useState<ProducaoData[]>(initialData);

  const anos = anosDisponiveis || [];
  const handleAnoInicioChange = (value: string) => {
    const start = Number(value);
    const end = Number(anoFim);
    setAnoInicio(value);
    if (start > end) {
      setAnoFim(value); // Ajusta "Até" para ser igual a "De"
    }
  };

  const handleAnoFimChange = (value: string) => {
    const start = Number(anoInicio);
    const end = Number(value);
    setAnoFim(value);
    if (end < start) {
      setAnoInicio(value); // Ajusta "De" para ser igual a "Até"
    }
  };
  // Atualiza os dados sempre que as opções mudarem
  useEffect(() => {
    const start = Number(anoInicio);
    const end = Number(anoFim);
    if (isNaN(start) || isNaN(end) || start > end) {
      setChartData([]);
      return;
    }

    const baseUrl = `${window.location.origin}/estatisticas/graficos/ano`;
    const params = new URLSearchParams({
      ano_inicio: String(start),
      ano_fim: String(end),
      tipo_grafico: tipoGrafico,
      exibir: exibir,
    });
    const url = `${baseUrl}?${params}`;

    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        console.log('Dados recebidos:', result.producaoData);
        console.log('Tipo de result:', typeof result);
        console.log('Array?', Array.isArray(result.producaoData));
        setChartData(Array.isArray(result.producaoData) ? result.producaoData : []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setChartData([]);
      }
    };

    fetchData();
  }, [anoInicio, anoFim, tipoGrafico, exibir]);

  // Mapeia o tipo de gráfico para o DynamicChart
  const chartTypeMap: Record<string, 'bar' | 'line' | 'pie' | 'bar_horizontal'> = {
    barras_verticais: 'bar',
    barras_horizontais: 'bar_horizontal',
    linha: 'line',
    pizza: 'pie',
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">Produção científica por ano</h1>
        <div className="grid min-h-[300px] grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Menu de opções */}
          <div className="flex min-h-0 flex-col">
            <Card className="flex h-full flex-col overflow-hidden">
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <p className="text-sm text-muted-foreground">Selecione as opções abaixo</p>
              </CardHeader>
              <CardContent className="flex-1 space-y-6 overflow-auto">
                {/* Ano Início */}
                <div className="space-y-2">
                  <Label>De *</Label>
                  <Select value={anoInicio} onValueChange={handleAnoInicioChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='max-h-60'>
                      {anos.map((ano) => (
                        <SelectItem key={ano} value={String(ano)}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ano Fim */}
                <div className="space-y-2">
                  <Label>Até *</Label>
                  <Select value={anoFim} onValueChange={handleAnoFimChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='max-h-60'>
                      {anos.map((ano) => (
                        <SelectItem key={ano} value={String(ano)}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de gráfico */}
                <div className="space-y-2">
                  <Label>Tipo de gráfico</Label>
                  <Select value={tipoGrafico} onValueChange={(value: typeof tipoGrafico) => setTipoGrafico(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barras_verticais">Barras verticais</SelectItem>
                      <SelectItem value="barras_horizontais">Barras horizontais</SelectItem>
                      <SelectItem value="linha">Linha</SelectItem>
                      <SelectItem value="pizza">Pizza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Exibir */}
                <div className="space-y-2">
                  <Label>Exibir</Label>
                  <Select value={exibir} onValueChange={(value: typeof exibir) => setExibir(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absolutos">Valores absolutos</SelectItem>
                      <SelectItem value="percentuais">Percentuais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
            <div className="flex min-h-0 flex-col">
              <DynamicChart
                data={chartData as unknown as Record<string, unknown>[]}
                xKey="ano"
                yKey="total"
                chartType={chartTypeMap[tipoGrafico]}
                display={exibir === 'percentuais' ? 'percentual' : 'absoluto'}
                title={`Produção de ${anoInicio} a ${anoFim}`}
              />
            </div>
        </div>
      </div>
    </Layout>
  );
}
