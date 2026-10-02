import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { PieChart as PieIcon, Scale } from 'lucide-react';
import type { KpiData, FilterState } from '../../services/api';

interface GenderDonutChartProps {
  kpi: KpiData | null;
  filters: FilterState;
  loading?: boolean;
}

export const GenderDonutChart: React.FC<GenderDonutChartProps> = ({
  kpi,
  filters,
  loading
}) => {
  if (loading || !kpi || kpi.totalPopulation === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 h-80 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Memuatkan carta jantina...</div>
      </div>
    );
  }

  const { malePopulation, femalePopulation, totalPopulation } = kpi;

  const data = [
    { name: 'Lelaki', value: malePopulation, color: '#0284c7' },
    { name: 'Perempuan', value: femalePopulation, color: '#f43f5e' }
  ];

  const malePercent = totalPopulation > 0 ? ((malePopulation / totalPopulation) * 100).toFixed(1) : '0';
  const femalePercent = totalPopulation > 0 ? ((femalePopulation / totalPopulation) * 100).toFixed(1) : '0';
  const sexRatio = femalePopulation > 0 ? ((malePopulation / femalePopulation) * 100).toFixed(1) : '100';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = totalPopulation > 0 ? ((item.value / totalPopulation) * 100).toFixed(2) : '0';
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1 border border-slate-800">
          <div className="font-bold flex items-center justify-between gap-3" style={{ color: item.payload.color }}>
            <span>{item.name}</span>
            <span className="text-white tabular-nums">{percent}%</span>
          </div>
          <div className="text-slate-300 flex items-center justify-between gap-4">
            <span>Jumlah:</span>
            <span className="font-bold text-white tabular-nums">
              {Number(item.value).toLocaleString()} orang
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="p-1 bg-indigo-50 text-indigo-700 rounded">
            <PieIcon className="w-3.5 h-3.5" />
          </span>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Carta 3 — Lelaki vs Perempuan
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Komposisi jantina penduduk bagi {filters.state === 'ALL' ? 'Malaysia' : filters.state} ({filters.year}).
        </p>

        <div className="relative h-60 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={65}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={2}
                stroke="#fff"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Nisbah Jantina
            </span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {sexRatio}
            </span>
            <span className="text-[9px] text-slate-500">
              Lelaki per 100 Perempuan
            </span>
          </div>
        </div>

        {/* Legend with exact stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-100">
            <div className="flex items-center gap-1.5 text-xs text-sky-900 font-semibold mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
              <span>Lelaki</span>
            </div>
            <div className="text-sm font-bold text-sky-950 tabular-nums">
              {malePopulation.toLocaleString()}
            </div>
            <div className="text-[11px] text-sky-700 font-medium tabular-nums mt-0.5">
              {malePercent}% daripada populasi
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
            <div className="flex items-center gap-1.5 text-xs text-rose-900 font-semibold mb-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>Perempuan</span>
            </div>
            <div className="text-sm font-bold text-rose-950 tabular-nums">
              {femalePopulation.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-700 font-medium tabular-nums mt-0.5">
              {femalePercent}% daripada populasi
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Di Malaysia, populasi lelaki sedikit mengatasi populasi perempuan sebanyak ~52% vs ~48%.</span>
      </div>
    </div>
  );
};
