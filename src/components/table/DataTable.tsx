import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet
} from 'lucide-react';
import { fetchTable, getDownloadUrl, type TableRow, type FilterState } from '../../services/api';

interface DataTableProps {
  filters: FilterState;
}

export const DataTable: React.FC<DataTableProps> = ({ filters }) => {
  const [rows, setRows] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [sortBy, setSortBy] = useState('population');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Fetch paginated data
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchTable(filters, page, limit, debouncedSearch, sortBy, sortDir)
      .then((data) => {
        if (!isMounted) return;
        setRows(data.rows);
        setTotalPages(data.totalPages || 1);
        setTotalRows(data.total);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ralat memuatkan jadual:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters, page, limit, debouncedSearch, sortBy, sortDir]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
    setPage(1);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-sky-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-sky-600" />
    );
  };

  const formatSex = (sex: string) => {
    if (sex === 'both') return 'Semua (L+P)';
    if (sex === 'male') return 'Lelaki';
    if (sex === 'female') return 'Perempuan';
    return sex;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header and Toolbar */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="p-1 bg-sky-50 text-sky-700 rounded">
                <Database className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Jadual Data Populasi Terperinci
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Data rasmi mikro DOSM dengan keupayaan carian teks, susunan lajur, dan eksport CSV.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Download Filtered CSV */}
            <a
              href={getDownloadUrl(filters, false)}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors border border-slate-200"
              title="Muat turun data mengikut tapisan semasa"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>DOWNLOAD CSV</span>
            </a>

            {/* Download Full Data */}
            <a
              href={getDownloadUrl(filters, true)}
              download
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg transition-colors shadow-xs"
              title="Muat turun dataset penuh Malaysia & Negeri"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
              <span>DOWNLOAD FULL DATA</span>
            </a>
          </div>
        </div>

        {/* Search bar & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari negeri, umur, etnik, atau tahun..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Baris per halaman:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-medium cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400">·</span>
            <span className="tabular-nums font-medium text-slate-700">
              {totalRows.toLocaleString()} rekod dijumpai
            </span>
          </div>
        </div>
      </div>

      {/* Table Container with Horizontal Scroll & Sticky Header */}
      <div className="overflow-x-auto max-h-[500px] relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100/90 backdrop-blur-xs text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
            <tr>
              <th
                onClick={() => handleSort('year')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tahun</span>
                  {getSortIcon('year')}
                </div>
              </th>
              <th
                onClick={() => handleSort('state')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Negeri</span>
                  {getSortIcon('state')}
                </div>
              </th>
              <th
                onClick={() => handleSort('sex')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Jantina</span>
                  {getSortIcon('sex')}
                </div>
              </th>
              <th
                onClick={() => handleSort('age')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Kumpulan Umur</span>
                  {getSortIcon('age')}
                </div>
              </th>
              <th
                onClick={() => handleSort('ethnicity')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Etnik</span>
                  {getSortIcon('ethnicity')}
                </div>
              </th>
              <th
                onClick={() => handleSort('population')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors text-right whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Populasi (Bilangan)</span>
                  {getSortIcon('population')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 bg-white">
            {loading ? (
              Array.from({ length: limit > 10 ? 10 : limit }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-4"><div className="h-3 bg-slate-200 rounded w-10" /></td>
                  <td className="py-3 px-4"><div className="h-3 bg-slate-200 rounded w-28" /></td>
                  <td className="py-3 px-4"><div className="h-3 bg-slate-200 rounded w-16" /></td>
                  <td className="py-3 px-4"><div className="h-3 bg-slate-200 rounded w-16" /></td>
                  <td className="py-3 px-4"><div className="h-3 bg-slate-200 rounded w-20" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-3 bg-slate-200 rounded w-20 ml-auto" /></td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Tiada rekod data yang sepadan dengan kriteria carian atau tapisan.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={`${row.year}-${row.state}-${row.sex}-${row.age}-${row.ethnicity}-${idx}`}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono tabular-nums text-slate-900 font-medium">
                    {row.year}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {row.state || 'Malaysia'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {formatSex(row.sex)}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {row.age === 'overall' ? 'Keseluruhan' : `${row.age} tahun`}
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize whitespace-nowrap">
                    {row.ethnicity.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {row.population.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          Halaman <span className="font-semibold text-slate-900">{page}</span> daripada{' '}
          <span className="font-semibold text-slate-900">{totalPages}</span> ({totalRows.toLocaleString()} jumlah baris)
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          {/* Quick page buttons */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = page;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    page === pageNum
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
            title="Halaman Seterusnya"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
