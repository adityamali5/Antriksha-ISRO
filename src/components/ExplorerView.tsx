import React, { useState, useMemo, useEffect } from 'react';
import { SatelliteNode } from '../types';
import {
  Search,
  Grid3x3,
  List,
  RefreshCw,
  Satellite,
  MapPin,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Globe,
  ExternalLink,
  Thermometer,
  Droplets,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { isValidChildUrl, formatExternalUrl } from '../utils/urlHelper';

interface ExplorerViewProps {
  satellites: SatelliteNode[];
  onSelectSatellite: (sat: SatelliteNode) => void;
  onNavigateToChildSite?: (satelliteId: string) => void;
  isLiveStream: boolean;
  onlyRegistered?: boolean;
  toggleOnlyRegistered?: () => void;
  registeredCount?: number;
  totalCountAll?: number;
  theme?: 'dark' | 'light';
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  satellites = [],
  onSelectSatellite,
  onNavigateToChildSite,
  isLiveStream,
  theme = 'dark'
}) => {
  const isLight = useMemo(() => {
    if (typeof theme !== 'undefined') return theme === 'light';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  }, [theme]);

  const [searchQuery, setSearchQuery] = useState('');
  const [weatherFilter, setWeatherFilter] = useState('ALL');
  const [humidityFilter, setHumidityFilter] = useState('ALL');
  const [childSiteFilter, setChildSiteFilter] = useState('ALL');
  const [sortOption, setSortOption] = useState('id-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);

  const handleOpenChildSite = (satId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onNavigateToChildSite) {
      onNavigateToChildSite(satId);
    } else {
      try {
        window.history.pushState({}, '', `/site/${encodeURIComponent(satId)}`);
      } catch (err) {
        console.warn('pushState error:', err);
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const weatherOptions = [
    'ALL',
    'Partly Cloudy',
    'Light Rain',
    'Overcast',
    'Passing Showers',
    'Moderate Rain',
    'Light Drizzle',
    'Clear Sky'
  ];

  // Crash-safe filtering & sorting
  const filteredSatellites = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();

    return (satellites || [])
      .filter(s => {
        if (!s) return false;

        const satId = String(s.satelliteId || '').toLowerCase();
        const college = String(s.collegeName || '').toLowerCase();
        const student = String(s.studentName || '').toLowerCase();
        const teacher = String(s.teacherName || '').toLowerCase();
        const principal = String(s.principalName || '').toLowerCase();
        const loc = String(s.location || '').toLowerCase();
        const weather = String(s.weatherCondition || '').toLowerCase();
        const appsScript = String(s.appsScriptUrl || '').toLowerCase();

        const matchSearch =
          !q ||
          satId.includes(q) ||
          college.includes(q) ||
          student.includes(q) ||
          teacher.includes(q) ||
          principal.includes(q) ||
          loc.includes(q) ||
          weather.includes(q) ||
          appsScript.includes(q);

        const matchWeather = weatherFilter === 'ALL' || s.weatherCondition === weatherFilter;

        let matchHumidity = true;
        const satHum = Number(s.humidity ?? 78);
        if (humidityFilter === 'HIGH') matchHumidity = satHum >= 75;
        if (humidityFilter === 'MODERATE') matchHumidity = satHum < 75;

        let matchChild = true;
        const hasChild = !!s.url || !!s.isCustom || !!s.appsScriptUrl || !!s.childWebsiteUrl;
        if (childSiteFilter === 'REGISTERED') matchChild = hasChild;
        if (childSiteFilter === 'UNREGISTERED') matchChild = !hasChild;

        return matchSearch && matchWeather && matchHumidity && matchChild;
      })
      .sort((a, b) => {
        if (sortOption === 'id-asc') {
          const numA = Number(String(a.satelliteId || a.id || 0).replace(/\D/g, '')) || Number(a.id) || 0;
          const numB = Number(String(b.satelliteId || b.id || 0).replace(/\D/g, '')) || Number(b.id) || 0;
          return numA - numB;
        }
        if (sortOption === 'id-desc') {
          const numA = Number(String(a.satelliteId || a.id || 0).replace(/\D/g, '')) || Number(a.id) || 0;
          const numB = Number(String(b.satelliteId || b.id || 0).replace(/\D/g, '')) || Number(b.id) || 0;
          return numB - numA;
        }
        if (sortOption === 'temp-desc') {
          return (Number(b.temperature) || 0) - (Number(a.temperature) || 0);
        }
        if (sortOption === 'humidity-desc') {
          return (Number(b.humidity ?? 78) || 0) - (Number(a.humidity ?? 78) || 0);
        }
        if (sortOption === 'name-asc') {
          return String(a.collegeName || '').localeCompare(String(b.collegeName || ''));
        }
        return 0;
      });
  }, [satellites, searchQuery, weatherFilter, humidityFilter, childSiteFilter, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredSatellites.length / itemsPerPage));

  // Auto-clamp page index on filter change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSatellites.slice(start, start + itemsPerPage);
  }, [filteredSatellites, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Control Panel */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel'
      } space-y-4`}>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Institution Name, Satellite ID, Student, Teacher, Principal, or Location..."
              className={`w-full pl-11 pr-14 py-3 rounded-xl text-sm transition focus:outline-none focus:ring-2 ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                  : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30 font-body'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 justify-between lg:justify-end">
            <div className={`flex items-center gap-1 p-1 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#09122C] border-[#00E5FF]/20'
            }`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? isLight
                      ? 'bg-white text-cyan-700 shadow-sm'
                      : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'table'
                    ? isLight
                      ? 'bg-white text-cyan-700 shadow-sm'
                      : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`text-xs w-auto py-2.5 px-3 rounded-xl border focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              <option value={12}>12 Per Page</option>
              <option value={24}>24 Per Page</option>
              <option value={48}>48 Per Page</option>
              <option value={100}>100 Per Page</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t ${
          isLight ? 'border-slate-200' : 'border-[#00E5FF]/10'
        }`}>
          <div>
            <label className="text-[11px] font-rajdhani font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Station Type
            </label>
            <select
              value={childSiteFilter}
              onChange={e => {
                setChildSiteFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs w-full py-2 px-3 rounded-lg border focus:outline-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'select-isro'
              }`}
            >
              <option value="ALL">All Satellite Nodes</option>
              <option value="REGISTERED">Registered Ground Stations</option>
              <option value="UNREGISTERED">Standard Seed Nodes</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-rajdhani font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Weather Condition
            </label>
            <select
              value={weatherFilter}
              onChange={e => {
                setWeatherFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs w-full py-2 px-3 rounded-lg border focus:outline-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'select-isro'
              }`}
            >
              {weatherOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt === 'ALL' ? 'All Weather Types' : opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-rajdhani font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Relative Humidity
            </label>
            <select
              value={humidityFilter}
              onChange={e => {
                setHumidityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={`text-xs w-full py-2 px-3 rounded-lg border focus:outline-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'select-isro'
              }`}
            >
              <option value="ALL">All Humidity Levels</option>
              <option value="HIGH">High Humidity (≥ 75%)</option>
              <option value="MODERATE">Moderate (&lt; 75%)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-rajdhani font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Sort Telemetry
            </label>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className={`text-xs w-full py-2 px-3 rounded-lg border focus:outline-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'select-isro'
              }`}
            >
              <option value="id-asc">Satellite ID (Ascending)</option>
              <option value="id-desc">Satellite ID (Descending)</option>
              <option value="temp-desc">Highest Temperature</option>
              <option value="humidity-desc">Highest Humidity</option>
              <option value="name-asc">Institution Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setWeatherFilter('ALL');
                setHumidityFilter('ALL');
                setChildSiteFilter('ALL');
                setSortOption('id-asc');
                setCurrentPage(1);
              }}
              className={`w-full py-2 px-3 rounded-lg border text-xs font-rajdhani font-bold flex items-center justify-center gap-1.5 transition-all ${
                isLight
                  ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Sub-header */}
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani font-semibold">
          Showing <span className="text-cyan-600 dark:text-[#00E5FF] font-bold">{filteredSatellites.length}</span> matching satellites (Page {currentPage} of {totalPages})
        </p>
        {isLiveStream && (
          <span className="text-xs text-emerald-600 dark:text-[#00E676] font-rajdhani font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00E676] animate-ping" />
            Live Sensors Streaming
          </span>
        )}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        paginatedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedItems.map((sat, index) => (
              <div
                key={`${sat.satelliteId || 'sat'}-${sat.id || index}`}
                onClick={() => onSelectSatellite(sat)}
                className={`p-5 rounded-2xl flex flex-col justify-between space-y-4 cursor-pointer group transition-all border ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-cyan-500 hover:shadow-md'
                    : 'glass-panel hover:border-[#00E5FF]/60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Satellite className="w-4 h-4 text-[#d97706] dark:text-[#FF9933] group-hover:rotate-12 transition-transform" />
                      <span className="font-orbitron font-bold text-sm text-[#d97706] dark:text-[#FF9933]">
                        {sat.satelliteId || `Satellite #${sat.id || index + 1}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-rajdhani font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-[#00E5FF] border border-sky-500/30">
                      RH {sat.humidity !== undefined ? `${sat.humidity}%` : '78%'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-rajdhani font-bold text-base text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-[#00E5FF] transition-colors line-clamp-2 leading-tight">
                      {sat.collegeName || 'Ground Station Node'}
                    </h3>
                    <div className="flex items-center justify-between flex-wrap gap-1 mt-1">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-body flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-[#00E5FF]" /> {sat.location || 'India'}
                      </p>
                      {typeof sat.lat === 'number' && typeof sat.lng === 'number' && (
                        <a
                          href={formatExternalUrl(sat.googleMapsUrl || `https://www.google.com/maps?q=${sat.lat},${sat.lng}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                          title={`Open ${sat.collegeName} in Google Maps (${sat.lat}°, ${sat.lng}°)`}
                        >
                          Maps ↗
                        </a>
                      )}
                    </div>
                    
                    {/* Registered Child Website or Generated Portal Link */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => handleOpenChildSite(sat.satelliteId, e)}
                        className="text-xs text-cyan-700 dark:text-[#00E5FF] hover:underline font-rajdhani font-bold flex items-center gap-1 transition-colors cursor-pointer bg-transparent border-none p-0"
                        title={`Open academic child station portal for ${sat.collegeName}`}
                      >
                        <Globe className="w-3.5 h-3.5" /> Visit Child Site
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </button>
                      {isValidChildUrl(sat.url || sat.childWebsiteUrl) && (
                        <a
                          href={formatExternalUrl(sat.url || sat.childWebsiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/25 border border-sky-400/30 transition-colors inline-flex items-center gap-0.5"
                          title={`Direct external URL: ${formatExternalUrl(sat.url || sat.childWebsiteUrl)}`}
                        >
                          Ext ↗
                        </a>
                      )}
                    </div>

                    {/* Apps Script Backup URL indicator */}
                    {sat.appsScriptUrl && (
                      <div className="mt-1 text-[10px] text-[#b45309] dark:text-[#FF9933] font-mono truncate flex items-center gap-1">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span className="truncate">Backup Relay Configured</span>
                      </div>
                    )}
                  </div>

                  {/* Institution Details Card */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#070D22]/80 border border-slate-200 dark:border-white/5 space-y-1 text-xs text-slate-800 dark:text-slate-300">
                    {sat.studentName && (
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-white/5">
                        <span className="text-cyan-700 dark:text-cyan-400 font-bold flex items-center gap-1">
                          👩‍🎓 Student:
                        </span>
                        <div className="flex items-center gap-1.5">
                          {sat.studentPhoto && (
                            <img
                              src={sat.studentPhoto}
                              alt={sat.studentName}
                              className="w-5 h-5 rounded-full object-cover border border-cyan-400/50"
                            />
                          )}
                          <span className="font-bold line-clamp-1 text-right text-slate-900 dark:text-white">{sat.studentName}</span>
                        </div>
                      </div>
                    )}

                    {sat.teacherName && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Teacher:
                        </span>
                        <span className="font-semibold line-clamp-1 text-right text-slate-800 dark:text-white">
                          {sat.teacherName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-amber-600 dark:text-[#FF9933]" /> Principal:
                      </span>
                      <span className="font-semibold line-clamp-1 text-right text-slate-800 dark:text-white">
                        {sat.principalName || 'Lab In-Charge'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Weather:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{sat.weatherCondition || 'Active'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#00E676]">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span className="font-orbitron font-semibold">{sat.temperature ?? 26.5}°C</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-600 dark:text-[#00E5FF]">
                    <Droplets className="w-3.5 h-3.5" />
                    <span className="font-orbitron font-semibold">{sat.humidity !== undefined ? `${sat.humidity}%` : '78%'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
            <Satellite className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
            <h3 className="font-orbitron font-bold text-lg text-slate-900 dark:text-white">No Satellites Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchQuery ? 'No satellites match your search filters.' : 'No satellites are registered yet. Open the Admin Panel to register your first station.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setWeatherFilter('ALL');
                setHumidityFilter('ALL');
                setChildSiteFilter('ALL');
              }}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-500"
            >
              Reset Filters
            </button>
          </div>
        )
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className={`overflow-hidden rounded-xl border ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'glass-panel border-[#00E5FF]/20'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`font-rajdhani font-bold uppercase text-[11px] border-b ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-[#09122C] text-slate-300 border-[#00E5FF]/20'
                }`}>
                  <th className="p-3.5">Satellite ID</th>
                  <th className="p-3.5">School / College</th>
                  <th className="p-3.5">Student / Teacher</th>
                  <th className="p-3.5">Principal</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Child Site</th>
                  <th className="p-3.5">Weather</th>
                  <th className="p-3.5">Temp</th>
                  <th className="p-3.5">Humidity</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-slate-200 text-slate-800' : 'divide-white/5 text-slate-200'}`}>
                {paginatedItems.map((sat, index) => (
                  <tr
                    key={`${sat.satelliteId || 'table'}-${sat.id || index}`}
                    onClick={() => onSelectSatellite(sat)}
                    className={`transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-[#0E1A3D]/70'
                    }`}
                  >
                    <td className="p-3.5 font-orbitron font-bold text-[#d97706] dark:text-[#FF9933]">
                      {sat.satelliteId}
                    </td>
                    <td className="p-3.5 font-rajdhani font-bold text-slate-900 dark:text-white max-w-xs">
                      {sat.collegeName}
                    </td>
                    <td className="p-3.5">
                      <div>
                        <strong className="text-slate-900 dark:text-white">{sat.studentName || '—'}</strong>
                      </div>
                      {sat.teacherName && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Teacher: {sat.teacherName}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{sat.principalName || '—'}</td>
                    <td className="p-3.5 text-slate-500 dark:text-slate-400">
                      <div>{sat.location || 'India'}</div>
                      {typeof sat.lat === 'number' && typeof sat.lng === 'number' && (
                        <a
                          href={formatExternalUrl(sat.googleMapsUrl || `https://www.google.com/maps?q=${sat.lat},${sat.lng}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                          title="View on Google Maps"
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          {sat.lat.toFixed(2)}°, {sat.lng.toFixed(2)}°
                        </a>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => handleOpenChildSite(sat.satelliteId, e)}
                          className="text-cyan-700 dark:text-[#00E5FF] hover:underline font-bold inline-flex items-center gap-1 text-xs cursor-pointer bg-transparent border-none p-0"
                          title={`Open academic child station portal for ${sat.collegeName}`}
                        >
                          <Globe className="w-3.5 h-3.5" /> Visit Site
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                        {isValidChildUrl(sat.url || sat.childWebsiteUrl) && (
                          <a
                            href={formatExternalUrl(sat.url || sat.childWebsiteUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/25 border border-sky-400/30 transition-colors inline-flex items-center gap-0.5"
                            title={`Direct external URL: ${formatExternalUrl(sat.url || sat.childWebsiteUrl)}`}
                          >
                            Ext ↗
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{sat.weatherCondition || 'Active'}</td>
                    <td className="p-3.5 font-orbitron font-semibold text-emerald-600 dark:text-[#00E676]">{sat.temperature ?? 26.5}°C</td>
                    <td className="p-3.5 font-orbitron font-semibold text-sky-600 dark:text-[#00E5FF]">{sat.humidity !== undefined ? `${sat.humidity}%` : '78%'}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectSatellite(sat);
                        }}
                        className="text-xs text-cyan-600 dark:text-[#00E5FF] hover:underline font-rajdhani font-bold"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border ${
          isLight ? 'bg-white border-slate-200' : 'glass-panel'
        }`}>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani">
            Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border disabled:opacity-40 transition ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#09122C] border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-orbitron text-cyan-600 dark:text-[#00E5FF] font-bold px-3">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border disabled:opacity-40 transition ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#09122C] border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
