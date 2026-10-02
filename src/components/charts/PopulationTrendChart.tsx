import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import type { TrendPoint, FilterState } from '../../services/api';

interface PopulationTrendChartProps {
  data: TrendPoint[];
  filters: FilterState;
  loading?: boolean;
}

export const PopulationTrendChart: React.FC<PopulationTrendChartProps> = ({
  data,
  filters,
  loading
}) => {
  if (loading || !data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 h-96 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Memuatkan carta trend populasi...</div>
      </div>
    );
  }

  // Format numbers to Millions or thousands
  const formatYAxis = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}J`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}k`;
    }
    return String(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as TrendPoint;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-800">
          <div className="font-bold text-sky-300 text-sm border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>Tahun {label}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {filters.state === 'ALL' ? 'Malaysia' : filters.state}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Jumlah Populasi:</span>
            <span className="font-bold text-white tabular-nums">
              {point.total.toLocaleString()} orang
            </span>
          </div>
          {point.male > 0 && (
            <div className="flex items-center justify-between gap-4 text-sky-300">
              <span>Lelaki:</span>
              <span className="font-medium tabular-nums">{point.male.toLocaleString()} orang</span>
            </div>
          )}
          {point.female > 0 && (
            <div className="flex items-center justify-between gap-4 text-rose-300">
              <span>Perempuan:</span>
              <span className="font-medium tabular-nums">{point.female.toLocaleString()} orang</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const selectedYearData = data.find(d => d.year === filters.year);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-blue-50 text-blue-700 rounded">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Carta 1 — Trend Populasi (1970 – 2026)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Perkembangan jumlah penduduk {filters.state === 'ALL' ? 'Malaysia' : filters.state} mengikut siri masa rasmi DOSM.
            </p>
          </div>
          {selectedYearData && (
            <div className="text-right text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Tahun {filters.year}: </span>
              <span className="font-bold text-slate-900 tabular-nums">
                {selectedYearData.total.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#64748b' }}
                stroke="#cbd5e1"
                interval={4}
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
              <Line
                type="monotone"
                dataKey="total"
                name="Jumlah Populasi"
                stroke="#0369a1"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#0284c7', stroke: '#fff', strokeWidth: 2 }}
              />
              {filters.sex === 'both' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="male"
                    name="Lelaki"
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="female"
                    name="Perempuan"
                    stroke="#fb7185"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Gunakan tetikus (hover) pada garisan untuk melihat statistik terperinci bagi setiap tahun.</span>
      </div>
    </div>
  );
};
