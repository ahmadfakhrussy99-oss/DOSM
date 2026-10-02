import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { BarChart3, MousePointerClick } from 'lucide-react';
import type { StatePoint, FilterState } from '../../services/api';

interface StateBarChartProps {
  data: StatePoint[];
  filters: FilterState;
  onSelectState: (state: string) => void;
  loading?: boolean;
}

export const StateBarChart: React.FC<StateBarChartProps> = ({
  data,
  filters,
  onSelectState,
  loading
}) => {
  if (loading || !data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 h-96 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Memuatkan carta negeri...</div>
      </div>
    );
  }

  const formatXAxis = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}J`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}k`;
    }
    return String(val);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as StatePoint;
      const isCurrentSelected = filters.state === item.state;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-800">
          <div className="font-bold text-sky-300 text-sm border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
            <span>{item.state}</span>
            {isCurrentSelected && (
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">
                Dipilih
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Populasi:</span>
            <span className="font-bold text-white tabular-nums">
              {item.population.toLocaleString()} orang
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-400">
            <span>Peratusan Nasional:</span>
            <span className="font-medium text-slate-200 tabular-nums">
              {item.percentageOfNational}%
            </span>
          </div>
          <div className="pt-1 text-[10px] text-sky-400 flex items-center gap-1 border-t border-slate-800">
            <MousePointerClick className="w-3 h-3" />
            <span>Klik untuk tapis mengikut negeri ini</span>
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
              <span className="p-1 bg-sky-50 text-sky-700 rounded">
                <BarChart3 className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Carta 2 — Populasi Mengikut Negeri ({filters.year})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Disusun menurun dari negeri paling ramai penduduk. Klik mana-mana palang untuk menapis.
            </p>
          </div>
          {filters.state !== 'ALL' && (
            <button
              onClick={() => onSelectState('ALL')}
              className="self-start sm:self-auto text-xs text-sky-700 hover:text-sky-900 font-medium underline underline-offset-2 cursor-pointer"
            >
              Lihat Semua Negeri Semula
            </button>
          )}
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 25, left: 70, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11, fill: '#64748b' }}
                stroke="#cbd5e1"
              />
              <YAxis
                type="category"
                dataKey="state"
                tick={{ fontSize: 11, fill: '#334155' }}
                stroke="#cbd5e1"
                width={85}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="population"
                name="Populasi"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(entry: any) => {
                  if (entry && entry.state) {
                    onSelectState(entry.state);
                  }
                }}
              >
                {data.map((entry) => {
                  const isSelected = filters.state === entry.state;
                  return (
                    <Cell
                      key={entry.state}
                      fill={isSelected ? '#0284c7' : '#38bdf8'}
                      opacity={filters.state === 'ALL' || isSelected ? 1 : 0.4}
                      stroke={isSelected ? '#0369a1' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <MousePointerClick className="w-3.5 h-3.5 text-slate-400" />
          <span>Klik bar negeri untuk menetapkan filter negeri secara automatik.</span>
        </div>
        {filters.state !== 'ALL' && (
          <span className="font-semibold text-sky-800">
            Fokus: {filters.state}
          </span>
        )}
      </div>
    </div>
  );
};
