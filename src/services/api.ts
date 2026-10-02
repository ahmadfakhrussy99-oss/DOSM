export interface SummaryResponse {
  sourceUrlMalaysia: string;
  sourceUrlState: string;
  lastUpdated: string;
  totalNationalRows: number;
  totalStateRows: number;
  years: number[];
  states: string[];
  sexes: string[];
  ageGroups: string[];
  ethnicities: string[];
  columns: string[];
  latestYear: number;
  isLiveLoaded: boolean;
}

export interface KpiData {
  year: number;
  state: string;
  totalPopulation: number;
  malePopulation: number;
  femalePopulation: number;
  growthChange: number;
  growthRate: number;
  prevYearPopulation: number;
}

export interface TrendPoint {
  year: number;
  total: number;
  male: number;
  female: number;
}

export interface StatePoint {
  state: string;
  population: number;
  male: number;
  female: number;
  percentageOfNational: number;
}

export interface AgePoint {
  ageGroup: string;
  total: number;
  male: number;
  female: number;
}

export interface DashboardResponse {
  kpi: KpiData;
  trend: TrendPoint[];
  stateBreakdown: StatePoint[];
  ageStructure: AgePoint[];
  metadata: {
    hasAgeData: boolean;
    appliedFilter: {
      year: number;
      state: string;
      sex: string;
      age: string;
      ethnicity: string;
    };
  };
}

export interface TableRow {
  date: string;
  year: number;
  state?: string;
  sex: string;
  age: string;
  ethnicity: string;
  populationThousand: number;
  population: number;
}

export interface TableResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  rows: TableRow[];
}

export interface FilterState {
  year: number;
  state: string;
  sex: string;
  age: string;
  ethnicity: string;
}

export async function fetchSummary(): Promise<SummaryResponse> {
  const res = await fetch('/api/summary');
  if (!res.ok) throw new Error('Gagal memuatkan ringkasan data DOSM');
  return res.json();
}

export async function fetchDashboard(filters: FilterState): Promise<DashboardResponse> {
  const params = new URLSearchParams();
  if (filters.year) params.append('year', String(filters.year));
  if (filters.state) params.append('state', filters.state);
  if (filters.sex) params.append('sex', filters.sex);
  if (filters.age) params.append('age', filters.age);
  if (filters.ethnicity) params.append('ethnicity', filters.ethnicity);

  const res = await fetch(`/api/dashboard?${params.toString()}`);
  if (!res.ok) throw new Error('Gagal memuatkan statistik dashboard DOSM');
  return res.json();
}

export async function fetchTable(
  filters: FilterState,
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy: string = 'population',
  sortDir: 'asc' | 'desc' = 'desc'
): Promise<TableResponse> {
  const params = new URLSearchParams();
  if (filters.year) params.append('year', String(filters.year));
  if (filters.state) params.append('state', filters.state);
  if (filters.sex) params.append('sex', filters.sex);
  if (filters.age) params.append('age', filters.age);
  if (filters.ethnicity) params.append('ethnicity', filters.ethnicity);
  if (search) params.append('search', search);
  params.append('page', String(page));
  params.append('limit', String(limit));
  params.append('sortBy', sortBy);
  params.append('sortDir', sortDir);

  const res = await fetch(`/api/table?${params.toString()}`);
  if (!res.ok) throw new Error('Gagal memuatkan data jadual DOSM');
  return res.json();
}

export function getDownloadUrl(filters: FilterState, full: boolean = false): string {
  const params = new URLSearchParams();
  if (full) {
    params.append('full', '1');
  } else {
    if (filters.year) params.append('year', String(filters.year));
    if (filters.state) params.append('state', filters.state);
    if (filters.sex) params.append('sex', filters.sex);
    if (filters.age) params.append('age', filters.age);
    if (filters.ethnicity) params.append('ethnicity', filters.ethnicity);
  }
  return `/api/download-csv?${params.toString()}`;
}

export async function refreshData(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/refresh', { method: 'POST' });
  if (!res.ok) throw new Error('Gagal menyegarkan dataset');
  return res.json();
}
