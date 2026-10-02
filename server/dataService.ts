import fs from 'fs';
import path from 'path';
import https from 'https';
import zlib from 'zlib';
import { parquetRead, parquetMetadata } from 'hyparquet';

export interface PopulationRecord {
  date: string;
  year: number;
  state?: string;
  sex: string;
  age: string;
  ethnicity: string;
  populationThousand: number;
  population: number;
}

export interface SummaryData {
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

const DOSM_MY_URL = 'https://storage.dosm.gov.my/population/population_malaysia.parquet';
const DOSM_STATE_URL = 'https://storage.dosm.gov.my/population/population_state.parquet';
const CACHE_DIR = path.resolve(process.cwd(), 'data');
const MY_FILE = path.join(CACHE_DIR, 'population_malaysia.parquet');
const STATE_FILE = path.join(CACHE_DIR, 'population_state.parquet');

let nationalRecords: PopulationRecord[] = [];
let stateRecords: PopulationRecord[] = [];
let isInitialized = false;
let lastUpdatedTime = new Date().toISOString();
let isLive = false;

function downloadFile(url: string, destPath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        try {
          fs.writeFileSync(destPath, buf);
        } catch (e) {
          console.warn('Could not write cache file to disk:', e);
        }
        resolve(buf);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseParquetBuffer(buffer: Buffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    try {
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      parquetRead({
        file: arrayBuffer,
        compressors: {
          BROTLI: (bytes: Uint8Array) => {
            const decomp = zlib.brotliDecompressSync(Buffer.from(bytes));
            return new Uint8Array(decomp.buffer, decomp.byteOffset, decomp.byteLength);
          }
        },
        onComplete: (data) => resolve(data),
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function initDataService(): Promise<void> {
  console.log('=== Inisialisasi Perkhidmatan Data Populasi DOSM ===');
  
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  let myBuf: Buffer | null = null;
  let stateBuf: Buffer | null = null;

  // Attempt live download from official DOSM storage
  try {
    console.log(`Mengambil dataset rasmi DOSM dari: ${DOSM_MY_URL}`);
    myBuf = await downloadFile(DOSM_MY_URL, MY_FILE);
    console.log(`Berjaya memuat turun ${myBuf.length} bait dataset Malaysia.`);
    
    console.log(`Mengambil dataset negeri DOSM dari: ${DOSM_STATE_URL}`);
    stateBuf = await downloadFile(DOSM_STATE_URL, STATE_FILE);
    console.log(`Berjaya memuat turun ${stateBuf.length} bait dataset Negeri.`);
    isLive = true;
  } catch (err: any) {
    console.warn(`Muat turun langsung DOSM menghadapi rintangan (${err.message}). Menggunakan fail cache sedia ada.`);
    if (fs.existsSync(MY_FILE)) {
      myBuf = fs.readFileSync(MY_FILE);
    }
    if (fs.existsSync(STATE_FILE)) {
      stateBuf = fs.readFileSync(STATE_FILE);
    }
  }

  if (!myBuf || !stateBuf) {
    throw new Error('Gagal memuatkan fail data populasi DOSM.');
  }

  // Parse Parquet data
  const rawMyRows = await parseParquetBuffer(myBuf);
  const rawStateRows = await parseParquetBuffer(stateBuf);

  // Schema for population_malaysia: [date, sex, age, ethnicity, population]
  nationalRecords = rawMyRows.map((r: any) => {
    const d = new Date(r[0]);
    const year = d.getFullYear();
    const dateStr = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : String(r[0]);
    const popK = typeof r[4] === 'number' ? r[4] : parseFloat(r[4]) || 0;
    return {
      date: dateStr,
      year: isNaN(year) ? parseInt(dateStr.slice(0, 4)) || 1970 : year,
      sex: String(r[1]).trim(),
      age: String(r[2]).trim(),
      ethnicity: String(r[3]).trim(),
      populationThousand: popK,
      population: Math.round(popK * 1000)
    };
  });

  // Schema for population_state: [state, date, sex, age, ethnicity, population]
  stateRecords = rawStateRows.map((r: any) => {
    const stateName = String(r[0]).trim();
    const d = new Date(r[1]);
    const year = d.getFullYear();
    const dateStr = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : String(r[1]);
    const popK = typeof r[5] === 'number' ? r[5] : parseFloat(r[5]) || 0;
    return {
      state: stateName,
      date: dateStr,
      year: isNaN(year) ? parseInt(dateStr.slice(0, 4)) || 1970 : year,
      sex: String(r[2]).trim(),
      age: String(r[3]).trim(),
      ethnicity: String(r[4]).trim(),
      populationThousand: popK,
      population: Math.round(popK * 1000)
    };
  });

  lastUpdatedTime = new Date().toISOString();
  isInitialized = true;

  // Print schema and data summary to server console as instructed
  console.log('=== DATA SUMMARY & SCHEMA DOSM POPULASI ===');
  console.log(`Jumlah baris data Malaysia: ${nationalRecords.length}`);
  console.log(`Jumlah baris data Negeri: ${stateRecords.length}`);
  const summary = getSummary();
  console.log(`Rentang Tahun: ${summary.years[0]} - ${summary.years[summary.years.length - 1]}`);
  console.log(`Senarai Negeri (${summary.states.length}): ${summary.states.join(', ')}`);
  console.log(`Jantina: ${summary.sexes.join(', ')}`);
  console.log(`Kumpulan Umur (${summary.ageGroups.length}): ${summary.ageGroups.join(', ')}`);
  console.log(`Etnik (${summary.ethnicities.length}): ${summary.ethnicities.join(', ')}`);
  console.log('=== DATA BERJAYA DIPROSES DENGAN TEPAT ===');
}

export function getSummary(): SummaryData {
  if (!isInitialized) {
    throw new Error('Data service belum dimuatkan.');
  }

  const yearsSet = new Set<number>();
  const statesSet = new Set<string>();
  const sexesSet = new Set<string>();
  const agesSet = new Set<string>();
  const ethnicitiesSet = new Set<string>();

  nationalRecords.forEach(r => {
    yearsSet.add(r.year);
    sexesSet.add(r.sex);
    agesSet.add(r.age);
    ethnicitiesSet.add(r.ethnicity);
  });

  stateRecords.forEach(r => {
    if (r.state) statesSet.add(r.state);
  });

  const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
  const orderedStates = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
    'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah',
    'Sarawak', 'Selangor', 'Terengganu', 'W.P. Kuala Lumpur',
    'W.P. Labuan', 'W.P. Putrajaya'
  ].filter(s => statesSet.has(s));

  // Order age groups logically
  const allAges = Array.from(agesSet);
  const standardAgeOrder = [
    'overall', '0-4', '5-9', '10-14', '15-19', '20-24', '25-29',
    '30-34', '35-39', '40-44', '45-49', '50-54', '55-59',
    '60-64', '65-69', '70-74', '75-79', '80-84', '85+'
  ];
  const sortedAges = standardAgeOrder.filter(a => agesSet.has(a));
  allAges.forEach(a => {
    if (!sortedAges.includes(a)) sortedAges.push(a);
  });

  return {
    sourceUrlMalaysia: DOSM_MY_URL,
    sourceUrlState: DOSM_STATE_URL,
    lastUpdated: lastUpdatedTime,
    totalNationalRows: nationalRecords.length,
    totalStateRows: stateRecords.length,
    years: sortedYears,
    states: orderedStates,
    sexes: ['both', 'male', 'female'],
    ageGroups: sortedAges,
    ethnicities: Array.from(ethnicitiesSet).sort(),
    columns: ['date', 'year', 'state', 'sex', 'age', 'ethnicity', 'population'],
    latestYear: sortedYears[sortedYears.length - 1],
    isLiveLoaded: isLive
  };
}

export interface FilterParams {
  year?: number;
  state?: string;
  sex?: string;
  age?: string;
  ethnicity?: string;
}

export function getFilteredDashboardData(params: FilterParams) {
  const summary = getSummary();
  const targetYear = params.year ? Number(params.year) : summary.latestYear;
  const targetState = params.state && params.state !== 'ALL' && params.state !== 'Malaysia' ? params.state : 'ALL';
  const targetSex = params.sex && params.sex !== 'ALL' ? params.sex : 'both';
  const targetAge = params.age && params.age !== 'ALL' ? params.age : 'overall';
  const targetEthnicity = params.ethnicity && params.ethnicity !== 'ALL' ? params.ethnicity : 'overall';

  // 1. Calculate KPI Metrics
  // Total Population for Selected Filter
  let currentTotalPop = 0;
  let malePop = 0;
  let femalePop = 0;
  let prevYearPop = 0;

  const dataset = targetState === 'ALL' ? nationalRecords : stateRecords.filter(r => r.state === targetState);

  // Match target year
  const currentRecord = dataset.find(r => 
    r.year === targetYear && 
    r.sex === targetSex && 
    r.age === targetAge && 
    r.ethnicity === targetEthnicity
  );
  if (currentRecord) {
    currentTotalPop = currentRecord.population;
  }

  // Calculate Male & Female counts
  const maleRecord = dataset.find(r => 
    r.year === targetYear && 
    r.sex === 'male' && 
    r.age === targetAge && 
    r.ethnicity === targetEthnicity
  );
  if (maleRecord) malePop = maleRecord.population;

  const femaleRecord = dataset.find(r => 
    r.year === targetYear && 
    r.sex === 'female' && 
    r.age === targetAge && 
    r.ethnicity === targetEthnicity
  );
  if (femaleRecord) femalePop = femaleRecord.population;

  // Previous year for growth calculation
  const prevRecord = dataset.find(r => 
    r.year === (targetYear - 1) && 
    r.sex === targetSex && 
    r.age === targetAge && 
    r.ethnicity === targetEthnicity
  );
  if (prevRecord) {
    prevYearPop = prevRecord.population;
  }

  const growthChange = prevYearPop > 0 ? (currentTotalPop - prevYearPop) : 0;
  const growthRate = prevYearPop > 0 ? ((growthChange / prevYearPop) * 100) : 0;

  // 2. Trend Line Chart (1970 to 2026)
  // X: year, Y: total, male, female
  const trendYears = summary.years;
  const trendData = trendYears.map(yr => {
    const totalRec = dataset.find(r => r.year === yr && r.sex === targetSex && r.age === targetAge && r.ethnicity === targetEthnicity);
    const mRec = dataset.find(r => r.year === yr && r.sex === 'male' && r.age === targetAge && r.ethnicity === targetEthnicity);
    const fRec = dataset.find(r => r.year === yr && r.sex === 'female' && r.age === targetAge && r.ethnicity === targetEthnicity);

    const tot = totalRec ? totalRec.population : 0;
    const m = mRec ? mRec.population : 0;
    const f = fRec ? fRec.population : 0;

    return {
      year: yr,
      total: tot,
      male: m,
      female: f
    };
  });

  // 3. State Breakdown (All 16 states) - Sorted descending
  // Uses stateRecords for targetYear, targetSex, targetAge, targetEthnicity
  const stateBreakdown = summary.states.map(st => {
    const totalRec = stateRecords.find(r => 
      r.state === st && 
      r.year === targetYear && 
      r.sex === targetSex && 
      r.age === targetAge && 
      r.ethnicity === targetEthnicity
    );
    const mRec = stateRecords.find(r => 
      r.state === st && 
      r.year === targetYear && 
      r.sex === 'male' && 
      r.age === targetAge && 
      r.ethnicity === targetEthnicity
    );
    const fRec = stateRecords.find(r => 
      r.state === st && 
      r.year === targetYear && 
      r.sex === 'female' && 
      r.age === targetAge && 
      r.ethnicity === targetEthnicity
    );

    const pop = totalRec ? totalRec.population : 0;
    const m = mRec ? mRec.population : 0;
    const f = fRec ? fRec.population : 0;

    return {
      state: st,
      population: pop,
      male: m,
      female: f,
      percentageOfNational: currentTotalPop > 0 ? Number(((pop / currentTotalPop) * 100).toFixed(2)) : 0
    };
  }).sort((a, b) => b.population - a.population);

  // 4. Age Structure Breakdown (if age is overall, show breakdown across age brackets)
  const ageBrackets = [
    '0-4', '5-9', '10-14', '15-19', '20-24', '25-29',
    '30-34', '35-39', '40-44', '45-49', '50-54', '55-59',
    '60-64', '65-69', '70-74', '75-79', '80-84', '85+'
  ];

  const ageData = ageBrackets.map(grp => {
    const bothRec = dataset.find(r => 
      r.year === targetYear && 
      r.sex === 'both' && 
      r.age === grp && 
      r.ethnicity === targetEthnicity
    );
    const mRec = dataset.find(r => 
      r.year === targetYear && 
      r.sex === 'male' && 
      r.age === grp && 
      r.ethnicity === targetEthnicity
    );
    const fRec = dataset.find(r => 
      r.year === targetYear && 
      r.sex === 'female' && 
      r.age === grp && 
      r.ethnicity === targetEthnicity
    );

    return {
      ageGroup: grp,
      total: bothRec ? bothRec.population : 0,
      male: mRec ? mRec.population : 0,
      female: fRec ? fRec.population : 0
    };
  });

  return {
    kpi: {
      year: targetYear,
      state: targetState,
      totalPopulation: currentTotalPop,
      malePopulation: malePop,
      femalePopulation: femalePop,
      growthChange,
      growthRate: Number(growthRate.toFixed(2)),
      prevYearPopulation: prevYearPop
    },
    trend: trendData,
    stateBreakdown,
    ageStructure: ageData,
    metadata: {
      hasAgeData: true,
      appliedFilter: {
        year: targetYear,
        state: targetState,
        sex: targetSex,
        age: targetAge,
        ethnicity: targetEthnicity
      }
    }
  };
}

export interface TableQueryParams {
  year?: number;
  state?: string;
  sex?: string;
  age?: string;
  ethnicity?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export function queryTableData(params: TableQueryParams) {
  const targetYear = params.year ? Number(params.year) : undefined;
  const targetState = params.state && params.state !== 'ALL' && params.state !== 'Malaysia' ? params.state : undefined;
  const targetSex = params.sex && params.sex !== 'ALL' ? params.sex : undefined;
  const targetAge = params.age && params.age !== 'ALL' ? params.age : undefined;
  const targetEthnicity = params.ethnicity && params.ethnicity !== 'ALL' ? params.ethnicity : undefined;
  const search = params.search ? params.search.toLowerCase().trim() : '';

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(500, Number(params.limit) || 10));
  const sortBy = params.sortBy || 'year';
  const sortDir = params.sortDir === 'asc' ? 1 : -1;

  // If state is not specified, use stateRecords so every state is visible, or if state is specified, filter by that state
  let records = stateRecords;
  if (targetState) {
    records = records.filter(r => r.state === targetState);
  }

  if (targetYear !== undefined) {
    records = records.filter(r => r.year === targetYear);
  }
  if (targetSex) {
    records = records.filter(r => r.sex === targetSex);
  }
  if (targetAge) {
    records = records.filter(r => r.age === targetAge);
  }
  if (targetEthnicity) {
    records = records.filter(r => r.ethnicity === targetEthnicity);
  }

  if (search) {
    records = records.filter(r => 
      (r.state && r.state.toLowerCase().includes(search)) ||
      r.sex.toLowerCase().includes(search) ||
      r.age.toLowerCase().includes(search) ||
      r.ethnicity.toLowerCase().includes(search) ||
      String(r.year).includes(search)
    );
  }

  // Sort
  records = [...records].sort((a: any, b: any) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (typeof valA === 'string') {
      return sortDir * valA.localeCompare(String(valB));
    }
    return sortDir * ((valA || 0) - (valB || 0));
  });

  const total = records.length;
  const start = (page - 1) * limit;
  const paginatedRows = records.slice(start, start + limit);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    rows: paginatedRows
  };
}

export function exportCsvData(params: TableQueryParams, full: boolean = false): string {
  let records = stateRecords;

  if (!full) {
    const targetYear = params.year ? Number(params.year) : undefined;
    const targetState = params.state && params.state !== 'ALL' && params.state !== 'Malaysia' ? params.state : undefined;
    const targetSex = params.sex && params.sex !== 'ALL' ? params.sex : undefined;
    const targetAge = params.age && params.age !== 'ALL' ? params.age : undefined;
    const targetEthnicity = params.ethnicity && params.ethnicity !== 'ALL' ? params.ethnicity : undefined;

    if (targetState) records = records.filter(r => r.state === targetState);
    if (targetYear !== undefined) records = records.filter(r => r.year === targetYear);
    if (targetSex) records = records.filter(r => r.sex === targetSex);
    if (targetAge) records = records.filter(r => r.age === targetAge);
    if (targetEthnicity) records = records.filter(r => r.ethnicity === targetEthnicity);
  }

  const headers = ['Tahun', 'Tarikh', 'Negeri', 'Jantina', 'Kumpulan_Umur', 'Etnik', 'Populasi_Ribu', 'Populasi_Jumlah'];
  const lines = [headers.join(',')];

  for (const r of records) {
    lines.push([
      r.year,
      `"${r.date}"`,
      `"${r.state || 'Malaysia'}"`,
      `"${r.sex}"`,
      `"${r.age}"`,
      `"${r.ethnicity}"`,
      r.populationThousand,
      r.population
    ].join(','));
  }

  return lines.join('\n');
}
