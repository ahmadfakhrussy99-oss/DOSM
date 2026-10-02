import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Map as MapIcon, MapPin, ZoomIn, ZoomOut, RotateCcw, Info, Check, MousePointerClick } from 'lucide-react';
import type { StatePoint, FilterState } from '../../services/api';

interface MalaysiaChoroplethMapProps {
  stateData: StatePoint[];
  filters: FilterState;
  onSelectState: (state: string) => void;
  loading?: boolean;
}

// State name normalization from GeoJSON to DOSM
const normalizeStateName = (rawName: string): string => {
  const n = rawName.trim();
  if (n === 'WP K Lumpur' || n === 'W.P. Kuala Lumpur' || n === 'Kuala Lumpur') return 'W.P. Kuala Lumpur';
  if (n === 'WP Putrajaya' || n === 'W.P. Putrajaya' || n === 'Putrajaya') return 'W.P. Putrajaya';
  if (n === 'WP Labuan' || n === 'W.P. Labuan' || n === 'Labuan') return 'W.P. Labuan';
  if (n === 'Pulau Pinang' || n === 'Penang') return 'Pulau Pinang';
  return n;
};

// Choropleth color scale
const getColor = (val: number, min: number, max: number): string => {
  if (!val || max === min) return '#e2e8f0';
  const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
  
  if (ratio > 0.8) return '#1e3a8a'; // Deep Navy
  if (ratio > 0.6) return '#1d4ed8'; // Royal Blue
  if (ratio > 0.4) return '#2563eb'; // Medium Blue
  if (ratio > 0.2) return '#60a5fa'; // Light Blue
  return '#bfdbfe'; // Very Soft Blue
};

export const MalaysiaChoroplethMap: React.FC<MalaysiaChoroplethMapProps> = ({
  stateData,
  filters,
  onSelectState,
  loading
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [hoveredState, setHoveredState] = useState<StatePoint | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Map state data by normalized state name for quick lookup
  const stateDataMap = useMemo(() => {
    const map = new Map<string, StatePoint>();
    stateData.forEach((s) => {
      map.set(normalizeStateName(s.state), s);
    });
    return map;
  }, [stateData]);

  // Find min and max population for color scaling
  const { minPop, maxPop } = useMemo(() => {
    if (stateData.length === 0) return { minPop: 0, maxPop: 1 };
    const pops = stateData.map(s => s.population).filter(p => p > 0);
    return {
      minPop: pops.length > 0 ? Math.min(...pops) : 0,
      maxPop: pops.length > 0 ? Math.max(...pops) : 1
    };
  }, [stateData]);

  // Load Malaysia GeoJSON once
  useEffect(() => {
    fetch('/data/malaysia_states.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Fail GeoJSON tidak dijumpai');
        return res.json();
      })
      .then((data) => {
        setGeoData(data);
      })
      .catch((err) => {
        console.error('Ralat memuatkan GeoJSON:', err);
        setMapError('Gagal memuatkan data sempadan peta Malaysia.');
      });
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Bounds for Malaysia: Peninsular + Sabah/Sarawak
    const map = L.map(mapContainerRef.current, {
      center: [4.2105, 108.9],
      zoom: 6,
      minZoom: 5,
      maxZoom: 9,
      zoomControl: false,
      attributionControl: false
    });

    // Clean CartoDB Positron basemap or subtle tile
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 10,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update GeoJSON layer when data or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoData) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
    }

    const layer = L.geoJSON(geoData, {
      style: (feature: any) => {
        const rawName = feature?.properties?.name || '';
        const name = normalizeStateName(rawName);
        const item = stateDataMap.get(name);
        const pop = item ? item.population : 0;
        const isSelected = filters.state === name;

        return {
          fillColor: getColor(pop, minPop, maxPop),
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          color: isSelected ? '#d97706' : '#ffffff', // Amber outline if selected, clean white boundary
          dashArray: isSelected ? '' : '1',
          fillOpacity: isSelected ? 0.95 : 0.85
        };
      },
      onEachFeature: (feature: any, featureLayer: L.Layer) => {
        const rawName = feature?.properties?.name || '';
        const name = normalizeStateName(rawName);
        const item = stateDataMap.get(name);

        featureLayer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 3,
              color: '#d97706',
              dashArray: '',
              fillOpacity: 1
            });
            target.bringToFront();
            if (item) {
              setHoveredState(item);
            } else {
              setHoveredState({
                state: name,
                population: 0,
                male: 0,
                female: 0,
                percentageOfNational: 0
              });
            }
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
            setHoveredState(null);
          },
          click: () => {
            if (filters.state === name) {
              onSelectState('ALL');
            } else {
              onSelectState(name);
            }
          }
        });

        // Tooltip popup
        const popText = item ? `${item.population.toLocaleString()} orang` : 'Tiada data';
        const percentText = item ? `(${item.percentageOfNational}% daripada populasi nasional)` : '';
        const tooltipContent = `
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; line-height: 1.4; padding: 2px;">
            <strong style="color: #0f172a; font-size: 13px;">${name}</strong><br/>
            <span style="color: #0369a1; font-weight: bold;">${popText}</span> ${percentText}<br/>
            ${item ? `<span style="color: #475569; font-size: 11px;">Lelaki: ${item.male.toLocaleString()} · Perempuan: ${item.female.toLocaleString()}</span>` : ''}
          </div>
        `;
        featureLayer.bindTooltip(tooltipContent, {
          sticky: true,
          direction: 'top',
          className: 'custom-leaflet-tooltip'
        });
      }
    });

    layer.addTo(map);
    geoJsonLayerRef.current = layer;
  }, [geoData, stateDataMap, minPop, maxPop, filters.state, onSelectState]);

  const handleResetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([4.2105, 108.9], 6);
    }
    onSelectState('ALL');
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const activeDisplayState = hoveredState || (filters.state !== 'ALL' ? stateDataMap.get(filters.state) : null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-sky-50 text-sky-700 rounded">
              <MapIcon className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Peta Malaysia Interaktif (Choropleth)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Paparan geografi populasi mengikut 16 negeri & wilayah persekutuan bagi tahun {filters.year}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filters.state !== 'ALL' && (
            <div className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Negeri: {filters.state}</span>
            </div>
          )}
          <button
            onClick={handleResetMap}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Set semula paparan kepada seluruh Malaysia"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Seluruh Malaysia</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Map Canvas */}
        <div className="lg:col-span-3 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 min-h-[380px] h-[440px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Controls Floating Overlay */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
              title="Zum Masuk"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
              title="Zum Keluar"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Map Legend Floating Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-md text-xs max-w-xs">
            <div className="font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>Petunjuk Kepadatan Populasi</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <div className="w-5 h-3 rounded-xs bg-[#bfdbfe]" />
              <div className="w-5 h-3 rounded-xs bg-[#60a5fa]" />
              <div className="w-5 h-3 rounded-xs bg-[#2563eb]" />
              <div className="w-5 h-3 rounded-xs bg-[#1d4ed8]" />
              <div className="w-5 h-3 rounded-xs bg-[#1e3a8a]" />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Rendah ({minPop.toLocaleString()})</span>
              <span>Tinggi ({maxPop.toLocaleString()})</span>
            </div>
          </div>
        </div>

        {/* Side Panel: Selected / Hovered State Details */}
        <div className="lg:col-span-1 bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Maklumat Peta Negeri</span>
            </div>

            {activeDisplayState ? (
              <div className="space-y-3">
                <div className="pb-3 border-b border-slate-200">
                  <div className="text-lg font-bold text-slate-900">
                    {activeDisplayState.state}
                  </div>
                  <div className="text-xs text-sky-800 font-semibold tabular-nums mt-0.5">
                    {activeDisplayState.percentageOfNational}% daripada populasi Malaysia
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                    <span className="text-slate-600">Jumlah Populasi:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {activeDisplayState.population.toLocaleString()} orang
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-sky-800">
                    <span>Lelaki:</span>
                    <span className="font-semibold tabular-nums">
                      {activeDisplayState.male.toLocaleString()} orang
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 text-rose-800">
                    <span>Perempuan:</span>
                    <span className="font-semibold tabular-nums">
                      {activeDisplayState.female.toLocaleString()} orang
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-600">Tahun Rekod:</span>
                    <span className="font-medium text-slate-900">{filters.year}</span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectState(filters.state === activeDisplayState.state ? 'ALL' : activeDisplayState.state)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    filters.state === activeDisplayState.state
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>
                    {filters.state === activeDisplayState.state
                      ? 'Nyahpilih Negeri'
                      : 'Kunci Filter ke Negeri Ini'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <p>Arahkan tetikus atau klik pada mana-mana negeri di peta untuk melihat ringkasan statistik terperinci.</p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
            Peta merangkumi Semenanjung Malaysia, Sabah, Sarawak, dan Wilayah Persekutuan (KL, Putrajaya, Labuan).
          </div>
        </div>
      </div>
    </div>
  );
};
