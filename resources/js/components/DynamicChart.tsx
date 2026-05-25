import { useFullscreen } from '@/hooks/useFullscreen';
import { Maximize2, Minimize2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DynamicChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  chartType?: 'bar' | 'line' | 'pie' | 'bar_horizontal';
  display?: 'absoluto' | 'percentual';
  title?: string;
  chartLimit?: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#ff8042'];

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VerticalBarLabel({ x, y, width, height, value }: any) {
    if (value == null || value === '') return null;
    const str = String(value);
    if (height >= 24) {
        return (
            <text x={x + width / 2} y={y + 14} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="white" fontWeight={600}>
                {str}
            </text>
        );
    }
    // Fora da barra: acima, com fundo temático
    const rectW = str.length * 7.5 + 10;
    const rectH = 20;
    const rx = x + width / 2 - rectW / 2;
    const ry = y - rectH - 3;
    return (
        <g>
            <rect x={rx} y={ry} width={rectW} height={rectH} rx={4} fill="var(--popover)" stroke="var(--border)" strokeWidth={1} />
            <text x={x + width / 2} y={ry + rectH / 2} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="var(--popover-foreground)" fontWeight={500}>
                {str}
            </text>
        </g>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HorizontalBarLabel({ x, y, width, height, value }: any) {
    if (value == null || value === '') return null;
    const str = String(value);
    if (width >= 40) {
        return (
            <text x={x + width - 8} y={y + height / 2} textAnchor="end" dominantBaseline="central" fontSize={13} fill="white" fontWeight={600}>
                {str}
            </text>
        );
    }
    // Fora da barra: à direita, com fundo temático
    const rectW = str.length * 7.5 + 10;
    const rectH = 20;
    const rx = x + width + 4;
    const ry = y + height / 2 - rectH / 2;
    return (
        <g>
            <rect x={rx} y={ry} width={rectW} height={rectH} rx={4} fill="var(--popover)" stroke="var(--border)" strokeWidth={1} />
            <text x={rx + rectW / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="central" fontSize={12} fill="var(--popover-foreground)" fontWeight={500}>
                {str}
            </text>
        </g>
    );
}

function wrapWords(str: string, maxChars: number): string[] {
    const words = str.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxChars && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines.slice(0, 2); // máximo 2 linhas
}

// Label interno: só renderiza quando a fatia tem espaço (percent >= 10%)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieInsideLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }: any) {
    if (percent < 0.10) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.72;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    const nameLines = wrapWords(String(name ?? ''), 18);
    const valueStr = String(value ?? '');
    const allLines = [...nameLines, valueStr];
    const lineH = 14;
    const rectW = Math.max(...allLines.map((l) => l.length)) * 7 + 16;
    const rectH = allLines.length * lineH + 10;
    const startY = y - (allLines.length - 1) * lineH / 2;
    return (
        <g>
            <rect x={x - rectW / 2} y={y - rectH / 2} width={rectW} height={rectH} rx={6} fill="var(--popover)" stroke="var(--border)" strokeWidth={1} opacity={0.92} />
            <text textAnchor="middle" fontSize={11} fill="var(--popover-foreground)" fontWeight={500}>
                {allLines.map((line, i) => (
                    <tspan key={i} x={x} y={startY + i * lineH}>{line}</tspan>
                ))}
            </text>
        </g>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-popover text-popover-foreground shadow-md px-3 py-2 text-sm">
            {label != null && <p className="font-medium mb-1">{label}</p>}
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color ?? 'inherit' }}>
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
}

const BAR_LIMIT = 40;
const PIE_LIMIT = 10;

export default function DynamicChart({ data = [], xKey, yKey, chartType = 'bar', display = 'absoluto', title, chartLimit = BAR_LIMIT }: DynamicChartProps) {
  const { ref, isFullscreen, toggle } = useFullscreen<HTMLDivElement>();

  if (data.length === 0) {
    return <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted text-muted-foreground">Nenhum dado para exibir</div>;
  }

  // Percentual: mantém valor numérico (toFixed retorna string — wrapping com Number() é obrigatório)
  let processedData = data;
  if (display === 'percentual') {
    const total = data.reduce((sum, item) => sum + Number(item[yKey]), 0);
    processedData = data.map((item) => ({
      ...item,
      [`${yKey}_pct`]: total ? Number(((Number(item[yKey]) / total) * 100).toFixed(1)) : 0,
    }));
  }

  const valueKey = display === 'percentual' ? `${yKey}_pct` : yKey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const labelFormatter = display === 'percentual' ? (value: any) => `${value ?? ''}%` : undefined;

  // Trunca dados para bar/bar_horizontal usando o limite escolhido pelo usuário
  const isBarTruncated = (chartType === 'bar' || chartType === 'bar_horizontal') && processedData.length > chartLimit;
  const barData = isBarTruncated ? processedData.slice(0, chartLimit) : processedData;

  // Agrupa cauda em "Outros" para pizza (sempre usa PIE_LIMIT)
  const isPieTruncated = chartType === 'pie' && processedData.length > PIE_LIMIT;
  const pieData = isPieTruncated
    ? [
        ...processedData.slice(0, PIE_LIMIT),
        {
          [xKey]: 'Outros',
          [valueKey]: Number(
            processedData.slice(PIE_LIMIT).reduce((sum, item) => sum + Number(item[valueKey]), 0).toFixed(1),
          ),
        },
      ]
    : processedData;

  // Altura dinâmica para barras horizontais (24px por item, mínimo 440)
  const barHorizontalHeight = Math.max(440, barData.length * 28);

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis tickFormatter={labelFormatter} />
            <Tooltip content={<CustomTooltip />} formatter={labelFormatter} />
            <Legend />
            <Line type="monotone" dataKey={valueKey} name={yKey} stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={150}
              fill="#8884d8"
              dataKey={valueKey}
              nameKey={xKey}
              labelLine={false}
              label={<PieInsideLabel />}
            >
              {pieData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} formatter={labelFormatter} />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Legend formatter={(value, entry: any) => `${value}: ${entry.payload?.[valueKey] ?? ''}`} />
          </PieChart>
        );

      case 'bar_horizontal':
        return (
          <BarChart layout="vertical" data={barData} margin={{ left: 8, right: 48 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={labelFormatter} />
            <YAxis dataKey={xKey} type="category" width={160} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} formatter={labelFormatter} />
            <Legend />
            <Bar dataKey={valueKey} name={yKey} fill="#8884d8">
              <LabelList content={<HorizontalBarLabel />} formatter={labelFormatter} />
            </Bar>
          </BarChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis tickFormatter={labelFormatter} />
            <Tooltip content={<CustomTooltip />} formatter={labelFormatter} />
            <Legend />
            <Bar dataKey={valueKey} name={yKey} fill="#8884d8">
              <LabelList content={<VerticalBarLabel />} formatter={labelFormatter} />
            </Bar>
          </BarChart>
        );
    }
  };

  const chartHeight = isFullscreen ? '100%' : chartType === 'bar_horizontal' ? barHorizontalHeight : 440;

  return (
    <div
      ref={ref}
      className={`bg-card rounded-lg p-4 border relative${isFullscreen ? ' flex flex-col overflow-auto' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {(isBarTruncated || isPieTruncated) && (
            <p className="text-xs text-muted-foreground mt-1">
              Exibindo top {isBarTruncated ? chartLimit : PIE_LIMIT} de {processedData.length} itens. Veja a tabela para o conjunto completo.
            </p>
          )}
        </div>
        <button
          onClick={toggle}
          aria-label={isFullscreen ? 'Sair do fullscreen' : 'Fullscreen'}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
      <div className={isFullscreen ? 'flex-1 min-h-0' : ''}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
