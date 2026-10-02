import React from 'react';
import { Users, UserCheck, User, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import type { KpiData, FilterState } from '../services/api';

interface KpiCardsProps {
  kpi: KpiData | null;
  filters: FilterState;
  loading?: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpi, filters, loading }) => {
  if (loading || !kpi) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs animate-pulse">
            <div className="h-3.5 bg-slate-200 rounded-md w-24 mb-3" />
            <div className="h-8 bg-slate-200 rounded-md w-36 mb-2" />
            <div className="h-3 bg-slate-100 rounded-md w-28" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalPopulation,
    malePopulation,
    femalePopulation,
    growthRate,
    growthChange,
    year
  } = kpi;

  const malePercent = totalPopulation > 0 ? ((malePopulation / totalPopulation) * 100).toFixed(1) : '0.0';
  const femalePercent = totalPopulation > 0 ? ((femalePopulation / totalPopulation) * 100).toFixed(1) : '0.0';
  const sexRatio = femalePopulation > 0 ? Math.round((malePopulation / femalePopulation) * 100) : 100;

  const isGrowthPositive = growthChange >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. JUMLAH POPULASI */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Jumlah Populasi
          </span>
          <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
            {totalPopulation.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Tahun {year}</span>
            <span>·</span>
            <span className="font-medium text-slate-700">
              {filters.state === 'ALL' || !filters.state ? 'Seluruh Malaysia' : filters.state}
            </span>
          </div>
        </div>
      </div>

      {/* 2. LELAKI */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Lelaki
          </span>
          <div className="p-2 bg-sky-50 text-sky-700 rounded-lg">
            <User className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
            {malePopulation.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-medium text-sky-700 tabular-nums">{malePercent}%</span>
            <span>daripada populasi</span>
            <span>·</span>
            <span className="text-slate-400">Nisbah: {sexRatio}</span>
          </div>
        </div>
      </div>

      {/* 3. PEREMPUAN */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Perempuan
          </span>
          <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
            {femalePopulation.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="font-medium text-rose-700 tabular-nums">{femalePercent}%</span>
            <span>daripada populasi</span>
            <span>·</span>
            <span className="text-slate-400">100 Perempuan</span>
          </div>
        </div>
      </div>

      {/* 4. PERTUMBUHAN POPULASI */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Pertumbuhan Populasi
          </span>
          <div className={`p-2 rounded-lg ${isGrowthPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {isGrowthPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums flex items-baseline gap-1.5 ${isGrowthPositive ? 'text-emerald-700' : 'text-amber-700'}`}>
            <span>{growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <span>{isGrowthPositive ? 'Bertambah' : 'Menyusut'}</span>
            <span className="font-medium text-slate-700 tabular-nums">
              {Math.abs(growthChange).toLocaleString()} orang
            </span>
            <span>vs {year - 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
