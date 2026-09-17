import React, { useEffect, useRef, useState } from 'react';
import { SatelliteNode } from '../types';
import { Satellite, Wind, Thermometer, Activity, Clock, Building2, Radio, Maximize2, LayoutGrid, List, ChevronRight, ChevronLeft, Droplets } from 'lucide-react';
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
      {/* Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Ground Satellites
            </span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 dark:bg-[#00E5FF]/10 text-sky-600 dark:text-[#00E5FF] border border-sky-500/30 dark:border-[#00E5FF]/30">
              <Satellite className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-orbitron font-extrabold text-slate-900 dark:text-white">
              {totalCount}
            </span>
            <span className="text-lg font-orbitron font-bold text-slate-400 dark:text-slate-500">
              / 1200
            </span>
            <span className="text-xs font-rajdhani font-bold text-emerald-600 dark:text-emerald-400 ml-1 uppercase">
              Nodes Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani font-semibold flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>{totalCount} out of 1200 network stations transmitting</span>
          </p>
        </div>

        {/* Shifting CanSat Live Telemetry Card */}
        <div 
          onClick={() => currentCyclingSat && onSelectSatellite(currentCyclingSat)}
          className="glass-panel p-5 space-y-2 relative overflow-hidden group cursor-pointer border-amber-500/30 dark:border-[#FF9933]/40 hover:border-amber-500 transition-all shadow-sm"
        >
          {/* Header with Title and Current CanSat Number */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Live Node Shift
              </span>
            </div>
            
            {/* CanSat Number Badge */}
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 dark:bg-[#FF9933]/20 text-amber-800 dark:text-[#FF9933] border border-amber-500/40 dark:border-[#FF9933]/40 text-[11px] font-orbitron font-extrabold">
                CanSat #{activeSatIndex + 1} of {totalCount}
              </span>
            </div>
          </div>

          {/* Current CanSat Name, ID & Telemetry */}
          {currentCyclingSat ? (
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-2xl font-orbitron font-black text-slate-900 dark:text-white truncate">
                    {currentCyclingSat.satelliteId}
                  </div>
                  <div className="text-xs font-rajdhani font-bold text-slate-600 dark:text-slate-300 truncate">
                    {currentCyclingSat.collegeName}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-orbitron font-bold text-amber-600 dark:text-[#FF9933]">
                    {currentCyclingSat.temperature}°C
                  </div>
                  <div className="text-[10px] font-rajdhani font-bold text-slate-500 dark:text-slate-400">
                    Humidity {currentCyclingSat.humidity ?? 78}% • {currentCyclingSat.weatherCondition}
                  </div>
                </div>
              </div>

              {/* Cycling controls & location indicator */}
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-white/10 text-xs font-rajdhani">
                <span className="text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  📍 {currentCyclingSat.location}
                </span>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setActiveSatIndex(prev => (prev - 1 + satellites.length) % (satellites.length || 1))}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Previous CanSat"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAutoCycle(!isAutoCycle)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                      isAutoCycle
                        ? 'bg-amber-500/20 text-amber-700 dark:text-[#FF9933]'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                    title={isAutoCycle ? 'Auto shifting active (shifts every 3.5s)' : 'Shifting paused'}
                  >
                    {isAutoCycle ? 'Auto Shift' : 'Paused'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSatIndex(prev => (prev + 1) % (satellites.length || 1))}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                    title="Next CanSat"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-rajdhani">No telemetry stream available</div>
          )}
        </div>

        <div className="glass-panel p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Temperature
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-[#00E676]/10 text-emerald-600 dark:text-[#00E676] border border-emerald-500/30 dark:border-[#00E676]/30">
              <Thermometer className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="text-3xl font-orbitron font-extrabold text-slate-900 dark:text-white">
            {avgTemp} °C
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani font-semibold">Continuous Calibrated Thermal Telemetry</p>
        </div>

        <div className="glass-panel p-5 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-rajdhani font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Humidity
            </span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 dark:bg-[#00E5FF]/10 text-sky-600 dark:text-[#00E5FF] border border-sky-500/30 dark:border-[#00E5FF]/30">
              <Droplets className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-orbitron font-extrabold text-slate-900 dark:text-white">
              {avgHumidity}
            </span>
            <span className="text-lg font-orbitron font-bold text-sky-600 dark:text-[#00E5FF]">
              % RH
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani font-semibold flex items-center justify-between">
            <span>Atmospheric Moisture</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal Sensor Level</span>
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
