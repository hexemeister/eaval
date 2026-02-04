import { useEffect, useRef, useState } from 'react';
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
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

export default function DynamicChart({ data = [], xKey, yKey, chartType = 'bar', display = 'absoluto', title }: DynamicChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
console.log('DynamicChart data:', data);
console.log('data.length:', data.length);
  if (data.length === 0) {
    return <div className="flex h-[300px] items-center justify-center rounded-lg border bg-muted text-muted-foreground">Nenhum dado para exibir</div>;
  }

  // Se for percentual, calcula total e adiciona % aos dados
  let processedData = data;
  if (display === 'percentual') {
    const total = data.reduce((sum, item) => sum + Number(item[yKey]), 0);
    processedData = data.map((item) => ({
      ...item,
      [`${yKey}_percent`]: total ? ((Number(item[yKey]) / total) * 100).toFixed(1) : 0,
    }));
  }

  const valueKey = display === 'percentual' ? `${yKey}_percent` : yKey;
  const labelFormatter = display === 'percentual' ? (value: number) => `${value}%` : undefined;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis tickFormatter={labelFormatter} />
            <Tooltip formatter={labelFormatter} />
            <Legend />
            <Line type="monotone" dataKey={valueKey} name={yKey} stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={processedData}
              cx="50%"
              cy="50%"
              label={({ payload }) => `${payload[xKey]}: ${payload[valueKey]}${display === 'percentual' ? '%' : ''}`}
              outerRadius={120}
              fill="#8884d8"
              dataKey={valueKey}
              nameKey={xKey}
            >
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={labelFormatter} />
            <Legend />
          </PieChart>
        );

      case 'bar_horizontal':
        return (
          <BarChart layout="vertical" data={processedData}>
            <XAxis type="number" tickFormatter={labelFormatter} />
            <YAxis dataKey={xKey} type="category" />
            <Bar dataKey={valueKey} name={yKey} fill="#8884d8" />
            {/* ... */}
          </BarChart>
        );

      case 'bar':
      default:
        return (
          <BarChart data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis tickFormatter={labelFormatter} />
            <Tooltip formatter={labelFormatter} />
            <Legend />
            <Bar dataKey={valueKey} name={yKey} fill="#8884d8">
              <LabelList position="top" formatter={labelFormatter} fontSize={12} />
            </Bar>
          </BarChart>
        );
    }
  };

  return (
  <div className="bg-card rounded-lg p-4 border flex flex-col min-h-full">
    {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
    <div className="flex-1 w-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  </div>
);
}
