import React, { useState, useEffect } from 'react';
import { SatelliteNode } from '../types';
import { Satellite, X, Building2, UserCheck, MapPin, Compass, Wifi, BatteryCharging, Activity, Thermometer, Droplets, CircleCheck, Globe, ExternalLink, MonitorPlay, Gauge, Wind, Radio, GraduationCap } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { IsroLogo } from './IsroLogo';
import { isValidChildUrl, formatExternalUrl } from '../utils/urlHelper';

interface SatelliteDetailModalProps {
  satellite: SatelliteNode | null;
  onClose: () => void;
  onNavigateToChildSite?: (satelliteId: string) => void;
  theme?: 'dark' | 'light';
}

export const SatelliteDetailModal: React.FC<SatelliteDetailModalProps> = ({
  satellite,
  onClose,
  onNavigateToChildSite,
  theme = 'dark'
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'childSite'>('telemetry');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!satellite) return null;

  const registeredRawUrl = satellite.url || satellite.childWebsiteUrl;
  const hasRegisteredSite = isValidChildUrl(registeredRawUrl);
  const registeredUrl = hasRegisteredSite ? formatExternalUrl(registeredRawUrl) : '';

  const hasChildSite = true;
  const defaultChildSiteUrl = `/site/${encodeURIComponent(satellite.satelliteId)}`;
  const childUrl = hasRegisteredSite ? registeredUrl : defaultChildSiteUrl;

  const handleVisitSite = () => {
    onClose();
    if (onNavigateToChildSite) {
      onNavigateToChildSite(satellite.satelliteId);
    } else {
      try {
        window.history.pushState({}, '', `/site/${encodeURIComponent(satellite.satelliteId)}`);
      } catch (e) {
        console.warn('pushState error:', e);
      }
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleOpenExternalSite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (registeredUrl) {
      window.open(registeredUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const chartData = Array.from({ length: 8 }).map((_, i) => ({
    time: `${(i * 3).toString().padStart(2, '0')}:00`,
    temp: Number((satellite.temperature + Math.sin(i) * 1.8).toFixed(1)),
    humidity: Math.max(10, Math.min(100, Math.round((satellite.humidity ?? 50) + Math.cos(i) * 5)))
  }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content max-w-4xl p-6 space-y-6 relative border border-[#00E5FF]/40 shadow-[0_0_50px_rgba(0,229,255,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white border border-slate-200 dark:border-white/20 shadow-md flex items-center justify-center">
              <IsroLogo size="md" variant="full" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-orbitron font-extrabold text-xl text-[#FF9933]">
                  {satellite.satelliteId}
                </span>
                <span className="bg-[#0284c7]/15 dark:bg-[#00E5FF]/15 text-[#0284c7] dark:text-[#00E5FF] border border-[#0284c7]/40 dark:border-[#00E5FF]/40 text-[10px] font-rajdhani font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {satellite.status || 'Active Node'}
                </span>
                {hasChildSite && (
                  <span className="bg-[#059669]/20 text-[#059669] dark:text-[#00E676] border border-[#059669]/50 text-[10px] font-rajdhani font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Registered Child Site
                  </span>
                )}
              </div>
              <h2 className="font-rajdhani font-bold text-lg text-slate-900 dark:text-white">
                {satellite.collegeName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs - Always available with default fallback */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#09122C] p-1.5 rounded-xl border border-slate-300 dark:border-[#00E5FF]/20">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex-1 py-2 px-4 rounded-lg font-rajdhani font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'telemetry'
                ? 'bg-amber-500 dark:bg-[#FF9933] text-white dark:text-[#050814] shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Telemetry Data View
          </button>
          <button
            onClick={() => setActiveTab('childSite')}
            className={`flex-1 py-2 px-4 rounded-lg font-rajdhani font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'childSite'
                ? 'bg-sky-600 dark:bg-[#00E5FF] text-white dark:text-[#050814] shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MonitorPlay className="w-4 h-4" /> {hasRegisteredSite ? 'Registered Child Website Portal' : 'Default Academic Child Portal'}
          </button>
        </div>

        {/* Tab 1: Telemetry Diagnostics */}
        {(!hasChildSite || activeTab === 'telemetry') ? (
          <div className="space-y-6">
            {/* Institution & Hardware Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#070D22]/80 border border-slate-200 dark:border-white/10 space-y-2.5">
                <h3 className="font-orbitron font-bold text-xs text-sky-700 dark:text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Ground Station Institution
                </h3>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-body">
                  {satellite.studentName && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5">
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        👩‍🎓 Student Builder:
                      </span>
                      <div className="flex items-center gap-2">
                        {satellite.studentPhoto && (
                          <img
                            src={satellite.studentPhoto}
                            alt={satellite.studentName}
                            className="w-6 h-6 rounded-full object-cover border border-cyan-400/50 shadow-sm"
                          />
                        )}
                        <span className="font-bold text-white text-sm">{satellite.studentName}</span>
                      </div>
                    </div>
                  )}
                  {satellite.teacherName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> Teacher / Mentor:
                      </span>
                      <span className="font-bold text-white">{satellite.teacherName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#FF9933]" /> Principal:
                    </span>
                    <span className="font-bold text-white">{satellite.principalName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" /> Station Location:
                    </span>
                    <span className="font-semibold text-slate-200">{satellite.location}</span>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" /> Geo-Coordinates:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-400">
                        {Number(satellite.lat || 18.5204).toFixed(4)}° N, {Number(satellite.lng || 73.8567).toFixed(4)}° E
                      </span>
                      <a
                        href={formatExternalUrl(satellite.googleMapsUrl || `https://www.google.com/maps?q=${satellite.lat || 18.5204},${satellite.lng || 73.8567}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                        title="View landlocked satellite coordinates on Google Maps"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Google Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-[#00E5FF]" /> Child Site Portal:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleVisitSite}
                        className="text-[#00E5FF] hover:underline font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 font-body text-xs"
                        title={`Open Child Site Station for ${satellite.collegeName}`}
                      >
                        Visit Site <ExternalLink className="w-3 h-3" />
                      </button>
                      {hasRegisteredSite && (
                        <button
                          type="button"
                          onClick={handleOpenExternalSite}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-400/30 transition-colors"
                          title={`Open external site: ${registeredUrl}`}
                        >
                          External ↗
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#070D22]/80 border border-slate-200 dark:border-white/10 space-y-2.5">
                <h3 className="font-orbitron font-bold text-xs text-amber-600 dark:text-[#FF9933] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> Telemetry Hardware Diagnostics
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent space-y-0.5">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-sky-600 dark:text-[#00E5FF]" /> RSSI Signal
                    </span>
                    <p className="font-orbitron font-bold text-slate-900 dark:text-white">{satellite.rssi ?? -72} dBm</p>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent space-y-0.5">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] flex items-center gap-1">
                      <BatteryCharging className="w-3 h-3 text-emerald-600 dark:text-[#00E676]" /> Station Battery
                    </span>
                    <p className="font-orbitron font-bold text-emerald-600 dark:text-[#00E676]">{satellite.batteryLevel ?? 92}%</p>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent space-y-0.5">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">Orbit Altitude</span>
                    <p className="font-orbitron font-bold text-slate-800 dark:text-slate-200">{satellite.orbitAltitude ?? 500} km</p>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent space-y-0.5">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">Telemetry Source</span>
                    <p className="font-rajdhani font-bold text-amber-600 dark:text-[#FF9933] line-clamp-1">{satellite.lastPing || 'Connected'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Sensor Values */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl glass-panel text-center space-y-1">
                <Thermometer className="w-5 h-5 text-emerald-600 dark:text-[#00E676] mx-auto" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani uppercase block font-semibold">Temperature</span>
                <p className="text-2xl font-orbitron font-bold text-slate-900 dark:text-white">{satellite.temperature} °C</p>
              </div>
              <div className="p-4 rounded-xl glass-panel text-center space-y-1">
                <Droplets className="w-5 h-5 text-sky-600 dark:text-[#00E5FF] mx-auto" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani uppercase block font-semibold">Humidity</span>
                <p className="text-2xl font-orbitron font-bold text-sky-600 dark:text-[#00E5FF]">
                  {satellite.humidity !== undefined ? `${satellite.humidity}%` : 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleVisitSite}
                className="p-4 rounded-xl glass-panel text-center space-y-1 hover:border-[#FF9933] hover:bg-[#FF9933]/10 dark:hover:border-[#00E5FF] dark:hover:bg-[#00E5FF]/10 transition-all cursor-pointer group flex flex-col items-center justify-center w-full"
                title={hasRegisteredSite ? `Visit registered website: ${registeredUrl}` : `Open child site portal for ${satellite.collegeName}`}
              >
                <Globe className="w-5 h-5 text-amber-600 dark:text-[#FF9933] group-hover:scale-110 transition-transform" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani uppercase block font-semibold">
                  {hasRegisteredSite ? 'Registered Site' : 'Child Site'}
                </span>
                <p className="text-xs sm:text-sm font-orbitron font-bold text-amber-600 dark:text-[#FF9933] flex items-center justify-center gap-1 mt-0.5 whitespace-nowrap">
                  <span>Visit Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </p>
              </button>
            </div>

            {/* Recharts 24-hr Telemetry Fluctuations */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#070D22]/90 border border-slate-200 dark:border-[#00E5FF]/20 space-y-3">
              <h3 className="font-orbitron font-bold text-xs text-slate-800 dark:text-slate-300 uppercase tracking-wider">
                24-Hour Telemetry Fluctuations (Simulated Stream)
              </h3>
              <div className="h-40 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" stroke={theme === 'light' ? '#475569' : '#64748B'} fontSize={10} tickLine={false} />
                    <YAxis stroke={theme === 'light' ? '#475569' : '#64748B'} fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: theme === 'light' ? '#ffffff' : '#0B132B',
                        borderColor: theme === 'light' ? '#0284c7' : '#00E5FF',
                        borderRadius: '8px',
                        color: theme === 'light' ? '#0f172a' : '#fff',
                        fontSize: '12px',
                        boxShadow: theme === 'light' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                      }}
                    />
                    <Line type="monotone" dataKey="temp" stroke={theme === 'light' ? '#059669' : '#00E676'} strokeWidth={2} name="Temp (°C)" dot={false} />
                    <Line type="monotone" dataKey="humidity" stroke={theme === 'light' ? '#0284c7' : '#00E5FF'} strokeWidth={2} name="Humidity (%)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Child Site Station Portal Launchpad & Interactive Preview */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#070D22] p-3.5 rounded-xl border border-[#00E5FF]/30 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#00E5FF]" />
                <div>
                  <span className="font-rajdhani font-bold text-sm text-white block">
                    {satellite.collegeName} Ground Station Child Portal
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Route: <strong className="text-[#00E5FF]">/site/{satellite.satelliteId}</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasRegisteredSite && (
                  <button
                    type="button"
                    onClick={handleOpenExternalSite}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Open external website: ${registeredUrl}`}
                  >
                    <span>External URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleVisitSite}
                  className="btn-isro text-xs py-2 px-4 cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,153,51,0.4)]"
                >
                  <MonitorPlay className="w-4 h-4" /> Open Full Child Site Portal
                </button>
              </div>
            </div>

            {/* Child Site Station Overview Card */}
            <div className="p-5 rounded-2xl bg-[#070D22]/90 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron font-extrabold text-base text-[#FF9933]">
                      {satellite.satelliteId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                      Live Telemetry Station Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-rajdhani mt-0.5">
                    {satellite.location || 'Pune Academic Node, India'} • {satellite.principalName ? `Principal: ${satellite.principalName}` : 'Indo Science SPARK Program'}
                  </p>
                </div>
                {satellite.studentName && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-rajdhani block">Lead Student Builder</span>
                    <span className="text-xs font-bold text-cyan-300 font-rajdhani">{satellite.studentName}</span>
                  </div>
                )}
              </div>

              {/* Station Telemetry Quick Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-amber-500" /> Temp</span>
                    <span className="font-mono text-amber-400">BMP280</span>
                  </div>
                  <div className="text-xl font-orbitron font-bold text-white">
                    {Number(satellite.temperature ?? 26.5).toFixed(1)} <span className="text-xs text-amber-400">°C</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-400" /> Humidity</span>
                    <span className="font-mono text-sky-400">SHT31</span>
                  </div>
                  <div className="text-xl font-orbitron font-bold text-sky-400">
                    {satellite.humidity ?? 68} <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-[#00E5FF]" /> Pressure</span>
                    <span className="font-mono text-[#00E5FF]">Baro</span>
                  </div>
                  <div className="text-xl font-orbitron font-bold text-white">
                    {(satellite.pressure || 944.28).toFixed(1)} <span className="text-xs text-slate-400">hPa</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-emerald-400" /> Air Quality</span>
                    <span className="font-mono text-emerald-400">MQ-135</span>
                  </div>
                  <div className="text-xl font-orbitron font-bold text-emerald-400">
                    {satellite.aqi ?? 35} <span className="text-xs text-slate-400">AQI</span>
                  </div>
                </div>
              </div>

              {/* Hardware Links & Capabilities Info */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <strong>Google Apps Script Stream:</strong> Real-time auto-synchronization enabled
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    Hardware Link: <strong className="text-white">{satellite.satelliteId}</strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-white/5">
                  <span>Includes 3D MPU6050 Attitude, GPS NEO-6M, CSV Logging & Campus Photo Customizer</span>
                  <span className="text-emerald-400 font-bold">100% Operational</span>
                </div>
              </div>

              {/* Primary Call to Action Button */}
              <button
                type="button"
                onClick={handleVisitSite}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#FF9933] to-amber-500 hover:brightness-110 text-slate-950 font-orbitron font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,153,51,0.4)] cursor-pointer transition-all"
              >
                <Globe className="w-4 h-4" /> Open Full Child Site Station Portal <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CircleCheck className="w-4 h-4" />
            <span>ISRO Micro-Satellite Calibration Passed</span>
          </div>
          <button
            onClick={onClose}
            className="btn-isro text-xs py-2.5 px-5"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
};
