import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/layouts/Layout';
import { useForm } from '@inertiajs/react';

export default function ProducaoPorAnoForm() {
  const { data, setData, post } = useForm({
    ano: '',
    tipoGrafico: 'barras_verticais',
    exibir: 'absolutos',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('estatisticas.por-ano')); // ou sua rota de exibição
  };

  return (
    <Layout>
      <div className="container mx-auto px-4">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Produção científica com mais publicações por ano</CardTitle>
            <p className="text-sm text-muted-foreground">Campos com * são obrigatórios.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ano */}
              <div className="space-y-2">
                <Label htmlFor="ano">Ano *</Label>
                <Select value={data.ano} onValueChange={(value) => setData('ano', value)}>
                  <SelectTrigger id="ano">
                    <SelectValue placeholder="Selecione um ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Gere anos dinamicamente (ex: 2000–2025) */}
                    {Array.from({ length: 26 }, (_, i) => 2000 + i)
                      .reverse()
                      .map((ano) => (
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
                <Select value={data.tipoGrafico} onValueChange={(value) => setData('tipoGrafico', value)}>
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
                <Select value={data.exibir} onValueChange={(value) => setData('exibir', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="absolutos">Valores absolutos</SelectItem>
                    <SelectItem value="percentuais">Percentuais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Visualizar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
