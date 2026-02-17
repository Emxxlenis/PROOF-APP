"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RetentionChartProps {
  data: Array<{ period: string; rate: number }>;
}

export function RetentionChart({ data }: RetentionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="period" 
          label={{ value: 'Período', position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: 'Retención (%)', angle: -90, position: 'insideLeft' }}
          domain={[0, 100]}
        />
        <Tooltip 
          formatter={(value: any) => `${value.toFixed(1)}%`}
          labelFormatter={(label) => `Retención ${label}`}
        />
        <Bar 
          dataKey="rate" 
          radius={[8, 8, 0, 0]}
        >
          {data.map((entry, index) => {
            const isGood = 
              (entry.period === "D7" && entry.rate >= 40) ||
              (entry.period === "D30" && entry.rate >= 20) ||
              (entry.period === "D90" && entry.rate >= 10);
            return (
              <Cell 
                key={`cell-${index}`} 
                fill={isGood ? "#22c55e" : "#ef4444"} 
              />
            );
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}




