import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchSummary,
  fetchDashboard,
  refreshData,
  type SummaryResponse,
  type DashboardResponse,
  type FilterState
} from './services/api';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { FilterPanel } from './components/FilterPanel';
import { PopulationTrendChart } from './components/charts/PopulationTrendChart';
import { StateBarChart } from './components/charts/StateBarChart';
import { GenderDonutChart } from './components/charts/GenderDonutChart';
import { AgeStructureChart } from './components/charts/AgeStructureChart';
import { MalaysiaChoroplethMap } from './components/map/MalaysiaChoroplethMap';
import { DataTable } from './components/table/DataTable';
import { Footer } from './components/Footer';
import { AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';

export default function App() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    year: 2026,
    state: 'ALL',
    sex: 'both',
    age: 'overall',
    ethnicity: 'overall'
  });

  // Initial load: Fetch summary & initial dashboard data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sum = await fetchSummary();
      setSummary(sum);

      // Log schema & summary to browser console as required
      console.log('=== DATA SUMMARY & SCHEMA DOSM POPULASI ===');
      console.log('Sumber Data Parquet:', sum.sourceUrlMalaysia);
      console.log('Lajur Tersedia:', sum.columns);
      console.log('Jumlah Rekod Nasional:', sum.totalNationalRows);
      console.log('Jumlah Rekod Negeri:', sum.totalStateRows);
      console.log('Siri Masa Tahun:', `${sum.years[0]} - ${sum.years[sum.years.length - 1]}`);
      console.log('Senarai 16 Negeri:', sum.states);
      console.log('Kumpulan Umur:', sum.ageGroups);
      console.log('Jantina:', sum.sexes);
      console.log('Etnik:', sum.ethnicities);
      console.log('============================================');

      const initialFilters: FilterState = {
        year: sum.latestYear || 2026,
        state: 'ALL',
        sex: 'both',
        age: 'overall',
        ethnicity: 'overall'
      };
      setFilters(initialFilters);

      const dash = await fetchDashboard(initialFilters);
      setDashboardData(dash);
      setLoading(false);
    } catch (err: any) {
      console.error('Ralat permulaan aplikasi:', err);
      setError(err.message || 'Tidak dapat memuatkan dataset DOSM. Sila cuba semula.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load dashboard data when filters change
  const loadDashboardData = useCallback(async (currentFilters: FilterState) => {
    try {
      setDashboardLoading(true);
      const dash = await fetchDashboard(currentFilters);
      setDashboardData(dash);
      setDashboardLoading(false);
    } catch (err: any) {
      console.error('Ralat memuatkan dashboard data:', err);
      setDashboardLoading(false);
    }
  }, []);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    loadDashboardData(newFilters);
  };

  const handleSelectState = (stateName: string) => {
    const updated = { ...filters, state: stateName };
    setFilters(updated);
    loadDashboardData(updated);
  };

  const handleResetFilters = () => {
    const reset: FilterState = {
      year: summary?.latestYear || 2026,
      state: 'ALL',
      sex: 'both',
      age: 'overall',
      ethnicity: 'overall'
    };
    setFilters(reset);
    loadDashboardData(reset);
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshData();
      await loadInitialData();
      setIsRefreshing(false);
    } catch (err: any) {
      console.error('Ralat menyegarkan data:', err);
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-sky-50 text-sky-700 rounded-xl flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Memuatkan data populasi DOSM...
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Menyahmampat fail Apache Parquet & menyusun data statistik rasmi Malaysia.
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-sky-600 h-1.5 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Tidak dapat memuatkan dataset DOSM
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {error}
            </p>
          </div>
          <button
            onClick={loadInitialData}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            RETRY / CUBA SEMULA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. HEADER */}
      <Header
        summary={summary}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* 2. KPI CARDS */}
        <section aria-label="Petunjuk Prestasi Utama Populasi">
          <KpiCards
            kpi={dashboardData?.kpi || null}
            filters={filters}
            loading={dashboardLoading}
          />
        </section>

        {/* 3. FILTER PANEL */}
        <section aria-label="Penapis Data Interaktif">
          <FilterPanel
            summary={summary}
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </section>

        {/* 4. CHARTS ROW 1: TREND & GENDER */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-label="Visualisasi Trend dan Jantina">
          <div className="lg:col-span-2">
            <PopulationTrendChart
              data={dashboardData?.trend || []}
              filters={filters}
              loading={dashboardLoading}
            />
          </div>
          <div className="lg:col-span-1">
            <GenderDonutChart
              kpi={dashboardData?.kpi || null}
              filters={filters}
              loading={dashboardLoading}
            />
          </div>
        </section>

        {/* 5. CHARTS ROW 2: STATE BAR CHART & AGE STRUCTURE */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Visualisasi Negeri dan Struktur Umur">
          <StateBarChart
            data={dashboardData?.stateBreakdown || []}
            filters={filters}
            onSelectState={handleSelectState}
            loading={dashboardLoading}
          />
          <AgeStructureChart
            data={dashboardData?.ageStructure || []}
            filters={filters}
            loading={dashboardLoading}
          />
        </section>

        {/* 6. PETA MALAYSIA INTERAKTIF (CHOROPLETH MAP) */}
        <section aria-label="Peta Malaysia Interaktif">
          <MalaysiaChoroplethMap
            stateData={dashboardData?.stateBreakdown || []}
            filters={filters}
            onSelectState={handleSelectState}
            loading={dashboardLoading}
          />
        </section>

        {/* 7. JADUAL DATA INTERAKTIF & DOWNLOAD CSV */}
        <section aria-label="Jadual Data Mikro">
          <DataTable filters={filters} />
        </section>
      </main>

      {/* 8. FOOTER */}
      <Footer summary={summary} />
    </div>
  );
}
