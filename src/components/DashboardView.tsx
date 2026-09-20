import React, { useEffect, useRef, useState } from 'react';
import { SatelliteNode } from '../types';
import { Satellite, Wind, Thermometer, Activity, Clock, Building2, Radio, Maximize2, LayoutGrid, List, ChevronRight, ChevronLeft, Droplets, Gauge, Compass, Sparkles } from 'lucide-react';
import L from 'leaflet';

interface DashboardViewProps {
  satellites: SatelliteNode[];
  isLiveStream: boolean;
  toggleLiveStream: () => void;
  setActiveTab: (tab: string) => void;
  onSelectSatellite: (sat: SatelliteNode) => void;
  onlyRegistered?: boolean;
  toggleOnlyRegistered?: () => void;
  registeredCount?: number;
  totalCountAll?: number;
  theme?: 'dark' | 'light';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  satellites,
  isLiveStream,
  toggleLiveStream,
  setActiveTab,
  onSelectSatellite,
  theme = 'dark'
}) => {
  const totalCount = satellites.length;
  const validTempSats = satellites.filter(s => typeof s.temperature === 'number' && !isNaN(s.temperature));
  const avgTemp = validTempSats.length > 0
    ? (validTempSats.reduce((acc, curr) => acc + (Number(curr.temperature) || 0), 0) / validTempSats.length).toFixed(1)
    : (satellites.length > 0 ? (satellites.reduce((acc, curr) => acc + (Number(curr.temperature) || 26.5), 0) / (totalCount || 1)).toFixed(1) : '26.5');
  
  const validHumiditySats = satellites.filter(s => typeof s.humidity === 'number' && !isNaN(s.humidity));
  const avgHumidity = validHumiditySats.length > 0 
    ? (validHumiditySats.reduce((acc, curr) => acc + (Number(curr.humidity) || 0), 0) / validHumiditySats.length).toFixed(1)
    : '78.5';

  const validPressureSats = satellites.filter(s => typeof s.pressure === 'number' && !isNaN(s.pressure) && s.pressure > 300);
  const avgPressure = validPressureSats.length > 0
    ? (validPressureSats.reduce((acc, curr) => acc + (Number(curr.pressure) || 0), 0) / validPressureSats.length).toFixed(1)
    : '948.2';

  const validAltitudeSats = satellites.filter(s => typeof s.orbitAltitude === 'number' && !isNaN(s.orbitAltitude) && s.orbitAltitude > 0);
  const avgAltitude = validAltitudeSats.length > 0
    ? Math.round(validAltitudeSats.reduce((acc, curr) => acc + (Number(curr.orbitAltitude) || 0), 0) / validAltitudeSats.length)
    : 520;

  const featuredNodes = satellites.slice(0, 6);
  const [featuredViewMode, setFeaturedViewMode] = useState<'grid' | 'list'>('grid');

  // Active CanSat Rotating Carousel State
  const [activeSatIndex, setActiveSatIndex] = useState(0);
  const [isAutoCycle, setIsAutoCycle] = useState(true);

  // Auto-shift interval: shifts every 3.5 seconds to next CanSat node (CanSat 1 -> CanSat 2 -> CanSat 3...)
  useEffect(() => {
    if (!isAutoCycle || satellites.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSatIndex(prev => (prev + 1) % satellites.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isAutoCycle, satellites.length]);

  const currentCyclingSat = satellites[activeSatIndex % (satellites.length || 1)] || satellites[0];

  // Radar Map Leaflet references
  const radarMapContainerRef = useRef<HTMLDivElement>(null);
  const radarMapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!radarMapContainerRef.current) return;

    const tileUrl = theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    if (!radarMapInstanceRef.current) {
      const map = L.map(radarMapContainerRef.current, {
        center: [18.519585, 73.859096],
        zoom: 12,
        scrollWheelZoom: true,
        attributionControl: false,
        zoomControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
      tileLayerRef.current = tileLayer;
      radarMapInstanceRef.current = map;
    } else if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    }

    const map = radarMapInstanceRef.current;
    if (!map) return;

    // Remove old layers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // Add satellite markers
    const displayList = satellites.slice(0, 200);
    const allCoords: [number, number][] = [];

    displayList.forEach(sat => {
      const isGood = sat.aqi <= 40;
      const markerColor = isGood ? '#00E676' : '#FF9933';
      const lat = Number(sat.lat) || 18.519585;
      const lng = Number(sat.lng) || 73.859096;
      allCoords.push([lat, lng]);

      const customIcon = L.divIcon({
        className: 'custom-mini-leaflet-icon',
        html: `
          <div style="
            background-color: ${markerColor};
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid ${theme === 'light' ? '#ffffff' : '#050814'};
            box-shadow: 0 0 10px ${markerColor};
            cursor: pointer;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      
      const popupHtml = `
        <div style="padding: 6px; font-family: system-ui; font-size: 12px; color: ${theme === 'light' ? '#0f172a' : '#fff'};">
          <strong style="color: #FF9933; font-size: 13px;">${sat.satelliteId}</strong>
          <h4 style="margin: 2px 0; font-weight: bold;">${sat.collegeName}</h4>
          <p style="margin: 2px 0; color: ${theme === 'light' ? '#475569' : '#94A3B8'};">📍 ${sat.location}</p>
          <p style="margin: 2px 0; font-weight: 600;">Humidity: ${sat.humidity !== undefined ? `${sat.humidity}%` : '78%'} | Temp: ${sat.temperature}°C</p>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectSatellite(sat);
      });
    });

    if (allCoords.length === 1) {
      map.setView(allCoords[0], 12);
    } else if (allCoords.length > 1) {
      try {
        const bounds = L.latLngBounds(allCoords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
        }
      } catch (e) {
        console.warn(e);
      }
    }

    // Invalidate map size after rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  }, [satellites, theme, onSelectSatellite]);

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1: TWO LARGE FEATURED TABS (Primary Colors: Royal Blue & Warm Sun Amber) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Large Tab 1: Total Ground Satellites */}
        <div className="p-6 rounded-3xl border-2 transition-all shadow-md relative overflow-hidden group bg-blue-50/90 border-blue-400 text-blue-950 dark:bg-[#0B1B3D] dark:border-blue-500/80 dark:text-white dark:shadow-[0_0_25px_rgba(37,99,235,0.25)] flex flex-col justify-between min-h-[170px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white dark:bg-blue-500/30 dark:text-blue-200 dark:border dark:border-blue-400 text-xs font-black uppercase tracking-wider shadow-xs mb-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>Total Ground Satellites</span>
              </div>
              <h3 className="text-sm md:text-base font-rajdhani font-bold text-blue-900 dark:text-blue-200">
                Active Student Satellite Network
              </h3>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-600 text-white dark:bg-blue-500 shadow-md group-hover:scale-110 transition-transform">
              <Satellite className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-orbitron font-black text-blue-700 dark:text-blue-300 tracking-tight">
              {totalCount}
            </span>
            <span className="text-xl sm:text-2xl font-orbitron font-bold text-blue-500/80 dark:text-blue-400">
              / 1200
            </span>
            <span className="text-xs font-rajdhani font-extrabold px-2.5 py-1 rounded-lg bg-blue-200 text-blue-900 dark:bg-blue-400/20 dark:text-blue-300 uppercase ml-auto">
              📡 Nodes Online
            </span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-blue-200/80 dark:border-blue-500/30 flex items-center justify-between text-xs font-rajdhani font-bold text-blue-800 dark:text-blue-300">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span>{totalCount} ground stations reporting live telemetry</span>
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold hidden sm:inline">
              ISRO IndoSpark
            </span>
          </div>
        </div>

        {/* Large Tab 2: Shifting CanSat Live Telemetry Card */}
        <div 
          onClick={() => currentCyclingSat && onSelectSatellite(currentCyclingSat)}
          className="p-6 rounded-3xl border-2 transition-all shadow-md relative overflow-hidden group cursor-pointer bg-amber-50/90 border-amber-400 text-amber-950 dark:bg-[#2A1705] dark:border-amber-500/80 dark:text-white dark:shadow-[0_0_25px_rgba(245,158,11,0.25)] flex flex-col justify-between min-h-[170px]"
        >
          {/* Header with Title and Current CanSat Number */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600 text-white dark:bg-amber-500/30 dark:text-amber-200 dark:border dark:border-amber-400 text-xs font-black uppercase tracking-wider shadow-xs">
                <span>🔴 Live Node Shift</span>
              </div>
            </div>
            
            {/* CanSat Number Badge */}
            <span className="px-3 py-1 rounded-full bg-amber-200/90 text-amber-900 dark:bg-amber-400/20 dark:text-amber-300 border border-amber-400/60 dark:border-amber-400/50 text-xs font-orbitron font-black shadow-xs">
              CanSat #{activeSatIndex + 1} of {totalCount}
            </span>
          </div>

          {/* Current CanSat Details & Live Numbers */}
          {currentCyclingSat ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-2xl sm:text-3xl font-orbitron font-black text-amber-700 dark:text-amber-400 truncate">
                    {currentCyclingSat.satelliteId}
                  </div>
                  <div className="text-xs sm:text-sm font-rajdhani font-bold text-amber-900 dark:text-amber-200 truncate">
                    {currentCyclingSat.studentName ? `${currentCyclingSat.studentName} • ` : ''}{currentCyclingSat.collegeName}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl sm:text-3xl font-orbitron font-black text-amber-600 dark:text-amber-400">
                    {currentCyclingSat.temperature}°C
                  </div>
                  <div className="text-xs font-rajdhani font-bold text-amber-800 dark:text-amber-300">
                    💧 {currentCyclingSat.humidity ?? 78}% RH
                  </div>
                </div>
              </div>

              {/* Cycling controls & location indicator */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-200/80 dark:border-amber-500/30 text-xs font-rajdhani font-bold text-amber-900 dark:text-amber-200">
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                  📍 {currentCyclingSat.location}
                </span>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setActiveSatIndex(prev => (prev - 1 + satellites.length) % (satellites.length || 1))}
                    className="px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/40 text-amber-900 dark:text-amber-200 transition-colors"
                    title="Previous CanSat"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAutoCycle(!isAutoCycle)}
                    className={`text-[11px] font-black px-2.5 py-1 rounded-lg transition-colors ${
                      isAutoCycle
                        ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-slate-950'
                        : 'bg-slate-200 text-slate-800 dark:bg-white/10 dark:text-slate-300'
                    }`}
                    title={isAutoCycle ? 'Auto shifting active (shifts every 3.5s)' : 'Shifting paused'}
                  >
                    {isAutoCycle ? '🔄 Auto Shift' : '⏸️ Paused'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSatIndex(prev => (prev + 1) % (satellites.length || 1))}
                    className="px-2 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 dark:bg-amber-500/20 dark:hover:bg-amber-500/40 text-amber-900 dark:text-amber-200 transition-colors"
                    title="Next CanSat"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-rajdhani font-bold">No telemetry stream available</div>
          )}
        </div>
      </div>

      {/* SECTION 2: FOUR PRIMARY-COLOURED METRIC TABS (Red, Cyan/Blue, Green, Purple) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Tab 1: Avg Temperature (Primary Red) */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md bg-rose-50/90 border-rose-400 text-rose-950 dark:bg-[#2B0E14] dark:border-rose-500/80 dark:text-white dark:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-extrabold uppercase tracking-wider text-rose-900 dark:text-rose-300">
              🌡️ Avg Temperature
            </span>
            <div className="p-2 rounded-xl bg-rose-500 text-white dark:bg-rose-600 shadow-xs">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-orbitron font-black text-rose-600 dark:text-rose-400">
            {avgTemp} °C
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-300 font-rajdhani font-bold mt-1">
            🔥 Space & Ground Warmth
          </p>
        </div>

        {/* Metric Tab 2: Avg Humidity (Primary Sky Blue / Cyan) */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md bg-sky-50/90 border-sky-400 text-sky-950 dark:bg-[#071E2D] dark:border-sky-500/80 dark:text-white dark:shadow-[0_0_20px_rgba(14,165,233,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-extrabold uppercase tracking-wider text-sky-900 dark:text-sky-300">
              💧 Avg Humidity
            </span>
            <div className="p-2 rounded-xl bg-sky-500 text-white dark:bg-sky-600 shadow-xs">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-orbitron font-black text-sky-600 dark:text-sky-400">
              {avgHumidity}
            </span>
            <span className="text-lg font-orbitron font-bold text-sky-700 dark:text-sky-300">
              % RH
            </span>
          </div>
          <p className="text-xs text-sky-800 dark:text-sky-300 font-rajdhani font-bold mt-1">
            ☁️ Air Moisture & Clouds
          </p>
        </div>

        {/* Metric Tab 3: Avg Pressure (Primary Emerald Green) */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md bg-emerald-50/90 border-emerald-400 text-emerald-950 dark:bg-[#072418] dark:border-emerald-500/80 dark:text-white dark:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
              🌀 Avg Pressure
            </span>
            <div className="p-2 rounded-xl bg-emerald-500 text-white dark:bg-emerald-600 shadow-xs">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-orbitron font-black text-emerald-600 dark:text-emerald-400">
              {avgPressure}
            </span>
            <span className="text-sm font-orbitron font-bold text-emerald-700 dark:text-emerald-300">
              hPa
            </span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 font-rajdhani font-bold mt-1">
            ⚖️ Atmospheric Air Weight
          </p>
        </div>

        {/* Metric Tab 4: Avg Altitude (Primary Purple / Violet) */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md bg-purple-50/90 border-purple-400 text-purple-950 dark:bg-[#1E0E2E] dark:border-purple-500/80 dark:text-white dark:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300">
              🚀 Avg Altitude
            </span>
            <div className="p-2 rounded-xl bg-purple-500 text-white dark:bg-purple-600 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-orbitron font-black text-purple-600 dark:text-purple-400">
              {avgAltitude}
            </span>
            <span className="text-sm font-orbitron font-bold text-purple-700 dark:text-purple-300">
              Meters
            </span>
          </div>
          <p className="text-xs text-purple-800 dark:text-purple-300 font-rajdhani font-bold mt-1">
            ⭐ Flight Height in Sky
          </p>
        </div>
      </div>

      {/* Analytics & Featured Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Live Radar Map View Card */}
        <div className="glass-panel p-6 space-y-4 relative flex flex-col justify-between overflow-hidden group">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#00E5FF]/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-sky-500/10 dark:bg-[#00E5FF]/10 text-sky-600 dark:text-[#00E5FF] border border-sky-500/30 dark:border-[#00E5FF]/30">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-base md:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  Live Satellite Radar Map
                </h3>
                <p className="text-[11px] font-rajdhani font-semibold text-slate-500 dark:text-slate-400">
                  Real-time GPS coordinates & station telemetry pins
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-1 text-xs font-rajdhani font-bold text-sky-600 hover:text-sky-700 dark:text-[#00E5FF] dark:hover:text-cyan-300 hover:underline px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-[#00E5FF]/10 border border-sky-200 dark:border-[#00E5FF]/30 transition-all cursor-pointer shadow-xs"
              title="Open full interactive radar map"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Radar</span>
            </button>
          </div>

          {/* Map Container with Radar Overlay Effect */}
          <div className="relative h-[280px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-[#00E5FF]/30 shadow-inner">
            <div ref={radarMapContainerRef} className="w-full h-full z-0" />
            
            {/* Subtle radar overlay HUD corners */}
            <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/80 text-white backdrop-blur-md text-[10px] font-rajdhani font-bold border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>RADAR SWEEP ACTIVE</span>
            </div>

            <div className="absolute bottom-2 right-2 z-10 pointer-events-none px-2 py-1 rounded-md bg-slate-900/80 text-white backdrop-blur-md text-[10px] font-rajdhani font-mono border border-white/20">
              18.5204° N, 73.8567° E
            </div>
          </div>

          {/* Quick Telemetry Legend */}
          <div className="flex items-center justify-between text-xs font-rajdhani font-bold pt-1 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" /> Optimal AQI (≤40)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" /> Moderate AQI (&gt;40)
              </span>
            </div>
            <span className="text-slate-400 dark:text-slate-500">
              Click any pin for node details
            </span>
          </div>
        </div>

        {/* Featured Academic Station Telemetry */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#00E5FF]/15 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600 dark:text-[#FF9933]" />
              <h3 className="font-orbitron font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Featured Academic Stations
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Box (Grid) / List Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-rajdhani font-bold">
                <button
                  type="button"
                  onClick={() => setFeaturedViewMode('grid')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    featuredViewMode === 'grid'
                      ? 'bg-white dark:bg-[#FF9933] text-slate-900 dark:text-slate-950 shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Box / Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Box</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeaturedViewMode('list')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    featuredViewMode === 'list'
                      ? 'bg-white dark:bg-[#FF9933] text-slate-900 dark:text-slate-950 shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>

              <button
                onClick={() => setActiveTab('explorer')}
                className="text-xs text-amber-600 dark:text-[#FF9933] font-rajdhani font-bold hover:underline ml-1"
              >
                All ({totalCount}) →
              </button>
            </div>
          </div>

          {featuredNodes.length > 0 ? (
            featuredViewMode === 'grid' ? (
              /* Box / Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {featuredNodes.map(sat => (
                  <div
                    key={sat.satelliteId}
                    onClick={() => onSelectSatellite(sat)}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#09122C]/70 dark:hover:bg-[#0E1A3D] border border-slate-200 dark:border-white/10 hover:border-sky-400 dark:hover:border-[#00E5FF]/40 transition-all cursor-pointer space-y-2 group shadow-sm dark:shadow-none"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-orbitron font-bold text-xs text-amber-600 dark:text-[#FF9933]">
                        {sat.satelliteId}
                      </span>
                      <span className="text-[10px] font-rajdhani font-bold px-2 py-0.5 rounded-full bg-sky-500/10 dark:bg-[#00E5FF]/10 text-sky-700 dark:text-[#00E5FF] border border-sky-500/30 dark:border-[#00E5FF]/30">
                        Humidity {sat.humidity !== undefined ? `${sat.humidity}%` : '78%'}
                      </span>
                    </div>
                    <h4 className="font-rajdhani font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-[#00E5FF] transition-colors">
                      {sat.collegeName}
                    </h4>
                    {sat.studentName && (
                      <p className="text-[11px] text-sky-600 dark:text-[#00E5FF] font-semibold truncate">
                        👨‍🚀 {sat.studentName}
                      </p>
                    )}
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                      <span>📍 {sat.location}</span>
                      <span className="text-slate-900 dark:text-white font-semibold">{sat.temperature}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {featuredNodes.map(sat => {
                  const isOptimal = sat.aqi <= 40;
                  return (
                    <div
                      key={sat.satelliteId}
                      onClick={() => onSelectSatellite(sat)}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#09122C]/70 dark:hover:bg-[#0E1A3D] border border-slate-200 dark:border-white/10 hover:border-sky-400 dark:hover:border-[#00E5FF]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="px-2 py-1 rounded-md bg-amber-500/10 dark:bg-[#FF9933]/15 border border-amber-500/30 dark:border-[#FF9933]/30 shrink-0">
                          <span className="font-orbitron font-bold text-xs text-amber-700 dark:text-[#FF9933]">
                            {sat.satelliteId}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-rajdhani font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-sky-600 dark:group-hover:text-[#00E5FF] transition-colors">
                            {sat.collegeName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-rajdhani font-medium truncate">
                            {sat.studentName ? <span className="text-sky-600 dark:text-[#00E5FF] font-semibold mr-1">👨‍🚀 {sat.studentName} •</span> : null}
                            📍 {sat.location} • {sat.weatherCondition}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-orbitron font-bold text-slate-900 dark:text-white">
                            {sat.temperature}°C
                          </div>
                          <span className="text-[10px] font-rajdhani font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-[#00E5FF] border border-sky-500/30">
                            Humidity {sat.humidity !== undefined ? `${sat.humidity}%` : '78%'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 dark:group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-[#070D22]/60 border border-slate-200 dark:border-white/10 space-y-2">
              <p className="text-sm font-rajdhani font-bold text-slate-800 dark:text-slate-300">No Micro-Satellites Registered Yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-body">Use the "+ Add Satellite" button in the navigation header to register child site satellite stations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
