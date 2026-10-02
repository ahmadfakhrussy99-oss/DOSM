import React from 'react';
import { ExternalLink, Database, ShieldCheck, HeartHandshake } from 'lucide-react';
import type { SummaryResponse } from '../services/api';

interface FooterProps {
  summary: SummaryResponse | null;
}

export const Footer: React.FC<FooterProps> = ({ summary }) => {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-200">
          {/* Column 1: Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Portal Data Populasi Malaysia
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dashboard Interaktif Statistik Penduduk Malaysia berpandukan sumber data terbuka rasmi daripada Jabatan Perangkaan Malaysia (DOSM).
            </p>
            <div className="mt-3 text-[11px] text-slate-500">
              Data dipaparkan untuk tujuan analisis dan visualisasi.
            </div>
          </div>

          {/* Column 2: Data Source & Specs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Maklumat Sumber & Dataset
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <span className="text-slate-400">Penyedia Data:</span>{' '}
                <strong className="text-slate-800">Jabatan Perangkaan Malaysia (DOSM)</strong>
              </li>
              <li>
                <span className="text-slate-400">Dataset:</span>{' '}
                <span className="text-slate-800">Population Malaysia & State Parquet</span>
              </li>
              <li>
                <span className="text-slate-400">Siri Masa:</span>{' '}
                <span className="text-slate-800 font-mono">1970 – 2026 (Unjuran Rasmi)</span>
              </li>
              <li>
                <span className="text-slate-400">Liputan:</span>{' '}
                <span className="text-slate-800">13 Negeri + 3 Wilayah Persekutuan</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Pautan Terus */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Pautan Rasmi & Akses
            </h4>
            <div className="space-y-2 text-xs">
              <a
                href="https://www.dosm.gov.my"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sky-700 hover:text-sky-900 transition-colors"
              >
                <span>Portal Rasmi Jabatan Perangkaan Malaysia</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://open.dosm.gov.my"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sky-700 hover:text-sky-900 transition-colors"
              >
                <span>OpenDOSM Portal (data.gov.my)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://storage.dosm.gov.my/population/population_malaysia.parquet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sky-700 hover:text-sky-900 transition-colors"
              >
                <span>Muat Turun Fail Asal: population_malaysia.parquet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Hak Cipta Terpelihara © {new Date().getFullYear()} Jabatan Perangkaan Malaysia (DOSM) & Kerajaan Malaysia.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Format Data: Parquet</span>
            <span>·</span>
            <span>Dikemaskini Secara Automatik</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
