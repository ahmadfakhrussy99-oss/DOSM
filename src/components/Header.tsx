import React from 'react';
import { Database, RefreshCw, CheckCircle2, ExternalLink } from 'lucide-react';
import type { SummaryResponse } from '../services/api';

interface HeaderProps {
  summary: SummaryResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({ summary, onRefresh, isRefreshing }) => {
  return (
    <header className="border-b border-slate-200 bg-white">
      {/* Top Banner with Government / Official Portal styling */}
      <div className="bg-slate-900 text-white px-4 lg:px-8 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wider text-sky-400">DOSM OPEN DATA</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-300">Data Terbuka Sektor Awam Malaysia</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span className="hidden sm:inline">Format: Parquet (Apache Arrow)</span>
          <span className="text-slate-400 hidden sm:inline">·</span>
          <a
            href="https://storage.dosm.gov.my/population/population_malaysia.parquet"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Fail Parquet Rasmi</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-sky-900 tracking-wide uppercase">
                Sumber: Jabatan Perangkaan Malaysia (DOSM)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              PORTAL DATA POPULASI MALAYSIA
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Dashboard Interaktif Statistik Penduduk Malaysia
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right hidden lg:block">
              <div className="text-xs text-slate-500">Status Data</div>
              <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5 justify-end mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {summary?.totalStateRows 
                    ? `${(summary.totalStateRows + summary.totalNationalRows).toLocaleString()} Rekod Dimuatkan` 
                    : 'Menyambung ke DOSM...'}
                </span>
              </div>
            </div>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
              title="Segar semula dataset dari DOSM"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyegerak...' : 'Segar Semula Data'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
