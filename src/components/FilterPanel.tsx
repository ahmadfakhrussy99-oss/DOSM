import React from 'react';
import { Filter, RotateCcw, Calendar, MapPin, Users2, Layers, Globe2 } from 'lucide-react';
import type { SummaryResponse, FilterState } from '../services/api';

interface FilterPanelProps {
  summary: SummaryResponse | null;
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  summary,
  filters,
  onChange,
  onReset
}) => {
  const years = summary?.years || [2026, 2025, 2024, 2023, 2022, 2021, 2020];
  const states = summary?.states || [];
  const ageGroups = summary?.ageGroups || [];
  const ethnicities = summary?.ethnicities || [];

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, year: Number(e.target.value) });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, state: e.target.value });
  };

  const handleSexChange = (newSex: string) => {
    onChange({ ...filters, sex: newSex });
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, age: e.target.value });
  };

  const handleEthnicityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, ethnicity: e.target.value });
  };

  const isFiltered = 
    (summary && filters.year !== summary.latestYear) ||
    filters.state !== 'ALL' ||
    filters.sex !== 'both' ||
    filters.age !== 'overall' ||
    filters.ethnicity !== 'overall';

  // Format ethnicity name for display
  const formatEthnicity = (eth: string) => {
    switch (eth) {
      case 'overall': return 'Keseluruhan Etnik';
      case 'bumi': return 'Bumiputera';
      case 'bumi_malay': return 'Melayu';
      case 'bumi_other': return 'Bumiputera Lain';
      case 'chinese': return 'Cina';
      case 'indian': return 'India';
      case 'other': return 'Lain-lain';
      case 'other_citizen': return 'Warganegara Lain';
      case 'other_noncitizen': return 'Bukan Warganegara';
      default: return eth;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-md text-slate-700">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              Penapis Data Interaktif
            </h2>
            <p className="text-xs text-slate-500">
              Pilih pemboleh ubah untuk mengemaskini KPI, carta, peta, dan jadual serentak.
            </p>
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-lg transition-colors border border-rose-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET FILTER</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4">
        {/* 1. Tahun */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Tahun ({filters.year})</span>
          </label>
          <select
            value={filters.year}
            onChange={handleYearChange}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            {years.map((yr) => (
              <option key={yr} value={yr}>
                {yr} {summary && yr === summary.latestYear ? '(Terkini)' : ''}
              </option>
            ))}
          </select>
          {/* Quick Year Pill Selectors */}
          <div className="flex items-center gap-1 mt-2 overflow-x-auto text-[11px] text-slate-500 pb-0.5">
            {[2026, 2024, 2020, 2010, 2000, 1980].filter(y => years.includes(y)).map((quickYr) => (
              <button
                key={quickYr}
                onClick={() => onChange({ ...filters, year: quickYr })}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${filters.year === quickYr ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {quickYr}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Negeri */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>Negeri</span>
          </label>
          <select
            value={filters.state}
            onChange={handleStateChange}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="ALL">Seluruh Malaysia (Semua Negeri)</option>
            {states.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {filters.state === 'ALL' ? 'Menunjukkan statistik nasional' : `Negeri terpilih: ${filters.state}`}
          </div>
        </div>

        {/* 3. Jantina */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Users2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Jantina</span>
          </label>
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            {[
              { id: 'both', label: 'Semua' },
              { id: 'male', label: 'Lelaki' },
              { id: 'female', label: 'Perempuan' }
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSexChange(s.id)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
                  filters.sex === s.id
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {filters.sex === 'both' ? 'Jumlah gabungan lelaki & perempuan' : `Fokus jantina: ${filters.sex === 'male' ? 'Lelaki' : 'Perempuan'}`}
          </div>
        </div>

        {/* 4. Kumpulan Umur */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Kumpulan Umur</span>
          </label>
          <select
            value={filters.age}
            onChange={handleAgeChange}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="overall">Semua Kumpulan Umur (Keseluruhan)</option>
            {ageGroups.filter(a => a !== 'overall').map((age) => (
              <option key={age} value={age}>
                Umur {age} tahun
              </option>
            ))}
          </select>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {filters.age === 'overall' ? 'Rentang semua umur (0 hingga 85+)' : `Kumpulan umur: ${filters.age}`}
          </div>
        </div>

        {/* 5. Etnik */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Etnik</span>
          </label>
          <select
            value={filters.ethnicity}
            onChange={handleEthnicityChange}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="overall">Semua Etnik (Keseluruhan)</option>
            {ethnicities.filter(e => e !== 'overall').map((eth) => (
              <option key={eth} value={eth}>
                {formatEthnicity(eth)}
              </option>
            ))}
          </select>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {formatEthnicity(filters.ethnicity)}
          </div>
        </div>
      </div>
    </div>
  );
};
