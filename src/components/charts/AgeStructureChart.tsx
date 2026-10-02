import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Layers, AlertCircle } from 'lucide-react';
import type { AgePoint, FilterState } from '../../services/api';

interface AgeStructureChartProps {
  data: AgePoint[];
  filters: FilterState;
  loading?: boolean;
}

export const AgeStructureChart: React.FC<AgeStructureChartProps> = ({
  data,
  filters,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 h-80 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Memuatkan struktur umur...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-center p-8">
        <div className="text-center text-slate-500 text-sm">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <p>Data kumpulan umur tidak tersedia dalam dataset semasa.</p>
        </div>
      </div>
    );
  }

  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}J`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return String(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as AgePoint;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-800">
          <div className="font-bold text-sky-300 text-sm border-b border-slate-800 pb-1">
            Kumpulan Umur: {label} tahun
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Jumlah:</span>
            <span className="font-bold text-white tabular-nums">
              {item.total.toLocaleString()} orang
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-sky-300">
            <span>Lelaki:</span>
            <span className="font-medium tabular-nums">{item.male.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-300">
            <span>Perempuan:</span>
            <span className="font-medium tabular-nums">{item.female.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-teal-50 text-teal-700 rounded">
                <Layers className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Carta 4 — Struktur Kumpulan Umur ({filters.year})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Taburan populasi mengikut kohort umur (0-4 hingga 85+ tahun) bagi {filters.state === 'ALL' ? 'Malaysia' : filters.state}.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="ageGroup"
                tick={{ fontSize: 10, fill: '#64748b' }}
                stroke="#cbd5e1"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
                stroke="#cbd5e1"
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
              />
              <Bar dataKey="male" name="Lelaki" fill="#0284c7" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="female" name="Perempuan" fill="#f43f5e" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Kumpulan umur umur bekerja (15-64) membentuk majoriti populasi Malaysia.</span>
        <span className="font-medium text-slate-700">18 Kumpulan Kohort</span>
      </div>
    </div>
  );
};
