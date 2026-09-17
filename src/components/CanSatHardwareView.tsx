import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Radio, 
  HardDrive, 
  Activity, 
  Gauge, 
  Thermometer, 
  Wind, 
  Battery, 
  Wifi, 
  Compass, 
  Download, 
  FileText, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Terminal, 
  ExternalLink,
  Save,
  FolderDown,
  Sparkles,
  Zap,
  Globe,
  PlusCircle,
  X,
  Check,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { CanSatTelemetryPacket, PenDriveConfig, HardwareStreamConfig, AppsScriptSource } from '../types';
import { isValidChildUrl, formatExternalUrl } from '../utils/urlHelper';

interface CanSatHardwareViewProps {
  onOpenSatelliteDetails?: (satelliteId: string) => void;
  theme?: 'dark' | 'light';
  isLiveStream?: boolean;
  onToggleLiveStream?: () => void;
}

const formatTimeTick = (val: any): string => {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'string' ? val : String(val);
  if (str.includes('T')) {
    const parts = str.split('T');
    return parts[1] ? parts[1].slice(0, 8) : str;
  }
  if (str.length >= 19 && str.includes('-')) {
    return str.slice(11, 19);
  }
  if (str.includes(':')) {
    return str.slice(0, 8);
  }
  return str.length > 8 ? str.slice(-8) : str;
};

export const CanSatHardwareView: React.FC<CanSatHardwareViewProps> = ({ 
  theme = 'dark',
  isLiveStream,
  onToggleLiveStream
}) => {
  // Multi-Module & Apps Script state
  const [appsScriptSources, setAppsScriptSources] = useState<AppsScriptSource[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('ALL'); // 'ALL' | 'CanSat-001' | 'CANSAT_2' | etc.

  // Config state
  const [endpointUrl, setEndpointUrl] = useState<string>('http://cansat-001.local');
  const [penDriveLabel, setPenDriveLabel] = useState<string>('CCCOMA_X64FRE_EN-GB_DV9');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(isLiveStream ?? true);

  useEffect(() => {
    if (isLiveStream !== undefined) {
      setIsLiveStreaming(isLiveStream);
    }
  }, [isLiveStream]);

  // Determine active satellite transmission status
  const hasActiveSatellites = appsScriptSources.length > 0 && appsScriptSources.some(s => s.status === 'active');
  const selectedSource = selectedModuleId !== 'ALL' 
    ? appsScriptSources.find(s => s.satelliteId === selectedModuleId) 
    : null;
  const isSelectedActive = selectedSource ? selectedSource.status === 'active' : hasActiveSatellites;
  const isSatelliteActive = isSelectedActive && isLiveStreaming;

  const [isRealConnected, setIsRealConnected] = useState<boolean>(false);
  const [lastPingTimeMs, setLastPingTimeMs] = useState<number>(14);
  const [totalPackets, setTotalPackets] = useState<number>(0);
  const [penDriveBytes, setPenDriveBytes] = useState<number>(0);
  const [penDriveFileKb, setPenDriveFileKb] = useState<number>(0);

  // Latest packet & chart buffer
  const [latestPacket, setLatestPacket] = useState<CanSatTelemetryPacket | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<CanSatTelemetryPacket[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [autoScrollTerminal, setAutoScrollTerminal] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Direct Browser Pen Drive File System API handle
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [browserPenDriveFileName, setBrowserPenDriveFileName] = useState<string>('');
  const [browserDiskWriteCount, setBrowserDiskWriteCount] = useState<number>(0);
  const [browserDiskError, setBrowserDiskError] = useState<string | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to ESP32 hardware & 64GB Pen Drive...');
  const [isEditingConfig, setIsEditingConfig] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'live' | 'charts' | 'terminal' | 'esp32guide'>('fleet');

  // Fetch Apps Script Sources
  const fetchAppsScriptSources = useCallback(async () => {
    try {
      const res = await fetch('/api/hardware/apps-script/sources');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.sources)) {
          setAppsScriptSources(data.sources);
        }
      }
    } catch (e) {
      console.warn('Failed to load apps script sources:', e);
    }
  }, []);

  useEffect(() => {
    fetchAppsScriptSources();
    const interval = setInterval(fetchAppsScriptSources, 2000);
    return () => clearInterval(interval);
  }, [fetchAppsScriptSources]);

  // Handle direct file append on local pen drive via Browser File System Access API
  const writeToDirectPenDrive = useCallback(async (packet: CanSatTelemetryPacket) => {
    if (!dirHandle) return;
    try {
      const fileName = `cansat_telemetry_${penDriveLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      // @ts-ignore
      const writable = await fileHandle.createWritable({ keepExistingData: true });
      
      const file = await fileHandle.getFile();
      if (file.size === 0) {
        const header = 'Packet_ID,Timestamp,Epoch_MS,Hardware_ID,Temperature_C,Pressure_hPa,Altitude_m,AQI,Humidity_Pct,WindSpeed_kmh,Battery_V,Battery_Pct,RSSI_dBm,Accel_X,Accel_Y,Accel_Z,Gyro_X,Gyro_Y,Gyro_Z,Latitude,Longitude,GPS_Fix,GPS_Sats,PenDrive_Logged\n';
        await writable.write(header);
      }

      await writable.seek(file.size);
      const csvLine = [
        packet.packetId,
        `"${packet.timestamp}"`,
        packet.epochMs,
        `"${packet.hardwareId}"`,
        packet.temperature.toFixed(2),
        packet.pressure.toFixed(2),
        packet.altitude.toFixed(2),
        packet.aqi,
        packet.humidity ?? 45,
        packet.windSpeed ?? 12,
        packet.batteryVoltage.toFixed(2),
        packet.batteryPercent,
        packet.rssi,
        packet.accelX.toFixed(3),
        packet.accelY.toFixed(3),
        packet.accelZ.toFixed(3),
        packet.gyroX.toFixed(2),
        packet.gyroY.toFixed(2),
        packet.gyroZ.toFixed(2),
        packet.lat.toFixed(6),
        packet.lng.toFixed(6),
        packet.gpsFix ? 1 : 0,
        packet.gpsSats,
        1
      ].join(',') + '\n';

      await writable.write(csvLine);
      await writable.close();

      setBrowserDiskWriteCount(prev => prev + 1);
      setBrowserPenDriveFileName(fileName);
      setBrowserDiskError(null);
    } catch (err: any) {
      console.warn('Browser direct pen drive write error:', err);
      setBrowserDiskError(err.message || 'Write permission error');
    }
  }, [dirHandle, penDriveLabel]);

  // Request Pen Drive Folder Access
  const handleSelectPenDriveDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const handle = await window.showDirectoryPicker({
          id: 'cansat-pendrive',
          mode: 'readwrite',
          startIn: 'removable'
        });
        setDirHandle(handle);
        setBrowserDiskError(null);
        setStatusMessage(`Connected to USB Drive "${handle.name}". Writing telemetry directly to ${penDriveLabel}!`);
      } else {
        alert('File System Access API is supported in modern browsers. Server-side pen drive logger is also actively saving to CCCOMA_X64FRE_EN-GB_DV9.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setBrowserDiskError(err.message);
      }
    }
  };

  // Poll hardware status from backend & initial buffer
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/hardware/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEndpointUrl(data.endpointUrl || 'http://cansat-001.local');
          setIsRealConnected(data.isRealConnected);
          setLastPingTimeMs(data.lastResponseTimeMs || 12);
          setTotalPackets(data.totalPackets || 0);
          if (data.penDrive) {
            setPenDriveLabel(data.penDrive.driveLabel || 'CCCOMA_X64FRE_EN-GB_DV9');
            setPenDriveFileKb(data.penDrive.fileSizeKb || 0);
          }
          if (data.latestPacket) {
            setLatestPacket(data.latestPacket);
          }
        }
      }
    } catch (err) {
      console.warn('Hardware status fetch:', err);
    }
  }, []);

  // Fetch initial telemetry history
  useEffect(() => {
    fetchStatus();

    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/hardware/telemetry?limit=40');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.packets)) {
            setTelemetryHistory(data.packets);
            if (data.packets.length > 0) {
              setLatestPacket(data.packets[data.packets.length - 1]);
            }
          }
        }
      } catch (err) {
        console.warn('Hardware history fetch:', err);
      }
    };

    fetchHistory();
  }, [fetchStatus]);

  // Real-Time SSE Listener for Hardware Telemetry Packets
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'hardware_telemetry_tick' && msg.data) {
            const packet: CanSatTelemetryPacket = msg.data;

            // Guard: If live stream is paused or disabled, do not advance graph
            if (!isLiveStreaming) return;

            // Module filter: If a specific module is selected, only accept packets for that module
            if (selectedModuleId !== 'ALL') {
              const targetId = selectedModuleId.toLowerCase();
              const isMatch = (packet.hardwareId && packet.hardwareId.toLowerCase().includes(targetId)) ||
                              (selectedSource && packet.sourceUrl && packet.sourceUrl === selectedSource.url);
              if (!isMatch) return;
            }

            setLatestPacket(packet);
            setTotalPackets(packet.packetId || (p => p + 1));
            
            // Add to chart history with deduplication
            setTelemetryHistory(prev => {
              if (prev.length > 0) {
                const last = prev[prev.length - 1];
                if (last.packetId === packet.packetId || 
                   (last.timestamp === packet.timestamp && last.altitude === packet.altitude && last.temperature === packet.temperature)) {
                  return prev; // Ignore duplicate or un-advanced packet
                }
              }
              const updated = [...prev, packet];
              if (updated.length > 40) updated.shift();
              return updated;
            });

            // Add to terminal log
            const timeDisplay = formatTimeTick(packet.timestamp);
            const logLine = `[${packet.hardwareId || 'CanSat'}] #${packet.packetId} | ${timeDisplay} | T:${packet.temperature}°C P:${packet.pressure}hPa Alt:${packet.altitude}m AQI:${packet.aqi} V:${packet.batteryVoltage}V | [DISK: ${penDriveLabel} ✓]`;
            setTerminalLogs(prev => {
              const updated = [...prev, logLine];
              if (updated.length > 80) updated.shift();
              return updated;
            });

            // Write to browser direct USB drive handle if opened
            if (dirHandle) {
              writeToDirectPenDrive(packet);
            }
          }
        } catch (err) {
          console.warn('SSE packet parsing error:', err);
        }
      };
    } catch (err) {
      console.warn('SSE hardware connection error:', err);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [dirHandle, isLiveStreaming, penDriveLabel, selectedModuleId, selectedSource, writeToDirectPenDrive]);

  // Auto scroll terminal
  useEffect(() => {
    if (autoScrollTerminal && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, autoScrollTerminal]);

  // Filter packet based on selected module
  const displayedPacket = selectedModuleId === 'ALL' 
    ? latestPacket 
    : (appsScriptSources.find(s => s.satelliteId === selectedModuleId || s.name.includes(selectedModuleId))?.latestData as CanSatTelemetryPacket) || latestPacket;

  // Save updated config
  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/hardware/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl,
          penDriveLabel,
          pollingIntervalMs: 1000,
          isPollingActive: isLiveStreaming
        })
      });
      if (res.ok) {
        setIsEditingConfig(false);
        setStatusMessage('Updated ESP32 endpoint & Pen Drive label settings.');
        fetchStatus();
      }
    } catch (err: any) {
      alert('Error updating config: ' + err.message);
    }
  };

  // Toggle Apps Script source pause/active
  const handleToggleAppsScriptSource = async (sourceId: string) => {
    try {
      await fetch(`/api/hardware/apps-script/sources/${sourceId}/toggle`, { method: 'PUT' });
      fetchAppsScriptSources();
    } catch (e) {
      console.warn('Error toggling source:', e);
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300">
      
      {/* Top Header Card */}
      <div className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 shadow-xl transition-colors ${
        theme === 'light'
          ? 'bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-300 text-slate-900 shadow-slate-200/80'
          : 'bg-gradient-to-br from-slate-900 via-[#0A122E] to-slate-950 border-[#00E5FF]/30 text-white shadow-cyan-950/20'
      }`}>
        
        {/* Glow Accent background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>Multi-Module CanSat Ingestion Hub</span>
              </span>

              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                <span>{appsScriptSources.length} Active {appsScriptSources.length === 1 ? 'Feed' : 'Feeds'} Online</span>
              </span>

              <span className="px-2.5 py-1 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-800 dark:text-purple-300 font-mono text-xs flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>64GB Pen Drive: {penDriveLabel}</span>
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-orbitron font-extrabold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <span className="text-slate-900 dark:text-white">CAN-SAT MULTI-MODULE HARDWARE & FLEET HUB</span>
              <span className="text-xs font-rajdhani font-normal px-2 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-white/10">
                1 Hz Real-Time Logging
              </span>
            </h1>

            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 font-rajdhani flex items-center gap-2 flex-wrap">
              <span>Active Enrolled Nodes:</span>
              {appsScriptSources.length > 0 ? (
                appsScriptSources.map(s => (
                  <code key={s.id} className="px-2 py-0.5 rounded bg-amber-500/10 dark:bg-black/40 text-amber-700 dark:text-amber-300 font-mono text-xs border border-amber-500/30 dark:border-amber-500/20 font-bold">
                    {s.satelliteId}
                  </code>
                ))
              ) : (
                <code className="px-2 py-0.5 rounded bg-sky-500/10 dark:bg-black/40 text-sky-700 dark:text-[#00E5FF] font-mono text-xs border border-sky-500/30 dark:border-[#00E5FF]/20 font-bold">
                  CanSat-01
                </code>
              )}
              <span className="text-slate-400">|</span>
              <span>Pen Drive Target:</span>
              <code className="px-2 py-0.5 rounded bg-purple-500/10 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono text-xs border border-purple-500/30 font-bold">
                {penDriveLabel}
              </code>
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Direct Pen Drive Directory Picker */}
            <button
              onClick={handleSelectPenDriveDirectory}
              title="Select physical Pen Drive directory to write CSV in real-time"
              className={`px-3.5 py-2 rounded-xl text-xs font-rajdhani font-bold flex items-center gap-2 transition-all shadow-md ${
                dirHandle 
                  ? 'bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 border border-emerald-500/60 shadow-emerald-950/40' 
                  : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-500/40'
              }`}
            >
              <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{dirHandle ? `Direct Drive Sync [${dirHandle.name}]` : `Link 64GB Pen Drive`}</span>
              {dirHandle && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
            </button>

            {/* Export CSV from Server */}
            <a
              href="/api/hardware/export/csv"
              download={`ISRO_CanSat_Fleet_${penDriveLabel}_Telemetry.csv`}
              className="px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-[#00E5FF]/10 dark:hover:bg-[#00E5FF]/20 text-sky-700 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/30 text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV ({totalPackets} Rows)</span>
            </a>

            {/* Settings Toggle - Temporarily disabled for event student access */}
            {/* <button
              onClick={() => setIsEditingConfig(!isEditingConfig)}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Configure</span>
            </button> */}
          </div>

        </div>

        {/* Edit Configuration Drawer */}
        {isEditingConfig && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/30 p-3.5 rounded-xl">
            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">ESP32 Hardware Localhost URL</label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="http://cansat-001.local or http://192.168.4.1"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 focus:border-[#00E5FF] outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 uppercase">Connected Pen Drive Label (64GB)</label>
              <input
                type="text"
                value={penDriveLabel}
                onChange={(e) => setPenDriveLabel(e.target.value)}
                placeholder="CCCOMA_X64FRE_EN-GB_DV9"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-purple-300 focus:border-purple-500 outline-none"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleSaveConfig}
                className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-rajdhani font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Hardware & Pen Drive Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* Real-Time Storage & Stream Metrics Bar */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 dark:bg-[#00E5FF]/10 border border-sky-500/30 dark:border-[#00E5FF]/20 flex items-center justify-center text-sky-600 dark:text-[#00E5FF]">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Connected CanSats</p>
              <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{appsScriptSources.length} Modules Live</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 dark:border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Pen Drive Storage</p>
              <p className="text-sm font-mono font-bold text-purple-700 dark:text-purple-300">{totalPackets} Records Logged</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Ingest Latency</p>
              <p className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300">{lastPingTimeMs} ms avg</p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Battery className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">Telemetry Stream</p>
              <p className="text-sm font-mono font-bold text-amber-700 dark:text-amber-300">
                1 Hz Continuous
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Module Selector Chips Bar */}
      <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 pl-2 uppercase shrink-0">Select CanSat Module:</span>
          
          <button
            onClick={() => {
              setSelectedModuleId('ALL');
              setActiveTab('fleet');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              selectedModuleId === 'ALL'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-600 dark:from-[#00E5FF] dark:to-cyan-500 text-white dark:text-slate-950 font-extrabold shadow-md shadow-cyan-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>🚀 All Modules Fleet Overview ({appsScriptSources.length})</span>
          </button>

          {appsScriptSources.map(source => (
            <button
              key={source.id}
              onClick={() => {
                setSelectedModuleId(source.satelliteId);
                setActiveTab('live');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                selectedModuleId === source.satelliteId
                  ? 'bg-amber-500 dark:bg-[#FF9933] text-slate-950 font-extrabold shadow-md shadow-[#FF9933]/30'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${source.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{source.satelliteId}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('fleet')}
          className={`px-4 py-2 rounded-xl text-xs font-rajdhani font-bold flex items-center gap-2 transition-all ${
            activeTab === 'fleet'
              ? 'bg-sky-50 dark:bg-[#00E5FF]/20 text-sky-700 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/40'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>CanSat Fleet Matrix ({appsScriptSources.length} Nodes)</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2 rounded-xl text-xs font-rajdhani font-bold flex items-center gap-2 transition-all ${
            activeTab === 'live'
              ? 'bg-sky-50 dark:bg-[#00E5FF]/20 text-sky-700 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/40'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>{selectedModuleId === 'ALL' ? 'Live Telemetry Gauges' : `${selectedModuleId} Live Gauges`}</span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`px-4 py-2 rounded-xl text-xs font-rajdhani font-bold flex items-center gap-2 transition-all ${
            activeTab === 'charts'
              ? 'bg-sky-50 dark:bg-[#00E5FF]/20 text-sky-700 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/40'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>1 Hz Real-Time Waveforms</span>
        </button>

        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-4 py-2 rounded-xl text-xs font-rajdhani font-bold flex items-center gap-2 transition-all ${
            activeTab === 'terminal'
              ? 'bg-sky-50 dark:bg-[#00E5FF]/20 text-sky-700 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/40'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Pen Drive Live Log Stream ({terminalLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('esp32guide')}
          className={`px-4 py-2 rounded-xl text-xs font-rajdhani font-bold flex items-center gap-2 transition-all ${
            activeTab === 'esp32guide'
              ? 'bg-sky-50 dark:bg-[#00E5FF]/20 text-sky-700 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/40'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>ESP32 & Apps Script Guide</span>
        </button>
      </div>

      {/* TAB: FLEET OVERVIEW MATRIX */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-orbitron font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>CONNECTED CANSAT HARDWARE & GOOGLE APPS SCRIPT FLEET</span>
            </h3>
            <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-300 dark:border-emerald-500/20">
              All Modules Logging to {penDriveLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appsScriptSources.map((source) => {
              const latest = source.latestData || latestPacket;
              return (
                <div 
                  key={source.id} 
                  className={`p-5 rounded-2xl border transition-all shadow-md ${
                    selectedModuleId === source.satelliteId
                      ? 'bg-white dark:bg-slate-900/95 border-sky-500 dark:border-[#00E5FF] shadow-sky-500/20 dark:shadow-cyan-950/40 ring-1 ring-sky-400/50'
                      : 'bg-white/90 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron font-extrabold text-base text-slate-900 dark:text-white">
                          {source.satelliteId}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          source.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40' : 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                        }`}>
                          {source.status === 'active' ? '1Hz LIVE INGESTION' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-rajdhani mt-0.5">{source.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{source.location}</p>
                      {typeof source.lat === 'number' && typeof source.lng === 'number' && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            📍 {source.lat.toFixed(4)}°, {source.lng.toFixed(4)}°
                          </span>
                          <a
                            href={formatExternalUrl(source.googleMapsUrl || `https://www.google.com/maps?q=${source.lat},${source.lng}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-sky-600 dark:text-[#00E5FF] hover:underline flex items-center gap-0.5 ml-1"
                            title="Open station location in Google Maps"
                          >
                            Maps ↗
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">LATENCY</p>
                      <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{source.lastResponseTimeMs || 15} ms</p>
                    </div>
                  </div>

                  {/* Sensor Mini Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">TEMP</p>
                      <p className="text-sm font-mono font-bold text-amber-600 dark:text-amber-300">
                        {latest?.temperature !== undefined ? `${latest.temperature.toFixed(1)}°C` : '26.8°C'}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">PRESSURE</p>
                      <p className="text-sm font-mono font-bold text-sky-700 dark:text-sky-300">
                        {latest?.pressure !== undefined ? `${latest.pressure.toFixed(1)}` : '1012.4'} <span className="text-[10px]">hPa</span>
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">ALTITUDE</p>
                      <p className="text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {latest?.altitude !== undefined ? `${latest.altitude.toFixed(1)} m` : '42.5 m'}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800">
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">AQI</p>
                      <p className="text-sm font-mono font-bold text-teal-700 dark:text-teal-300">
                        {latest?.aqi !== undefined ? latest.aqi : 34}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-mono text-[11px]">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>{source.packetsCount || 0} Packets Logged to Pen Drive</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isValidChildUrl(source.childWebsiteUrl) && (
                        <a
                          href={formatExternalUrl(source.childWebsiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-[#FF9933]/20 dark:hover:bg-[#FF9933]/30 text-amber-800 dark:text-[#FF9933] font-rajdhani font-bold text-xs border border-amber-300 dark:border-[#FF9933]/40 flex items-center gap-1 transition-all"
                          title={`Visit ${source.name} Child Website`}
                        >
                          <Globe className="w-3 h-3" />
                          <span>Child Site</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleToggleAppsScriptSource(source.id)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono border border-slate-200 dark:border-transparent"
                      >
                        {source.status === 'active' ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedModuleId(source.satelliteId);
                          setActiveTab('live');
                        }}
                        className="px-3 py-1 rounded bg-sky-50 hover:bg-sky-100 dark:bg-[#00E5FF]/20 dark:hover:bg-[#00E5FF]/30 text-sky-800 dark:text-[#00E5FF] font-rajdhani font-bold text-xs border border-sky-300 dark:border-[#00E5FF]/30"
                      >
                        Inspect Gauges →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: Live Sensors & Gauges Matrix */}
      {activeTab === 'live' && (
        <div className="space-y-5">
          {/* Active Module Indicator Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-slate-300">Live Gauges Displaying:</span>
              <span className="px-2 py-0.5 rounded bg-[#FF9933]/20 border border-[#FF9933]/40 text-[#FF9933] font-mono font-bold text-xs">
                {selectedModuleId === 'ALL' ? (displayedPacket?.hardwareId || 'Unified Master Stream') : selectedModuleId}
              </span>
            </div>
            {selectedModuleId !== 'ALL' && (
              <button
                onClick={() => {
                  setSelectedModuleId('ALL');
                  setActiveTab('fleet');
                }}
                className="text-xs font-rajdhani font-bold text-cyan-400 hover:text-cyan-300"
              >
                ← Return to Fleet Overview
              </button>
            )}
          </div>

          {/* Main 6-card Sensor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Temperature Sensor */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all group shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <span>BMP280 / DHT Temperature</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  REAL-TIME 1Hz
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-orbitron font-extrabold text-white">
                  {displayedPacket ? displayedPacket.temperature.toFixed(1) : '26.8'}
                </span>
                <span className="text-lg font-rajdhani font-bold text-amber-400">°C</span>
              </div>

              {/* Mini visual gauge bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>10°C (Cold)</span>
                  <span>Optimal</span>
                  <span>50°C (High)</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, Math.min(100, (((displayedPacket?.temperature || 26.8) - 10) / 40) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Barometric Pressure & Altitude */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-all group shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-sky-400" />
                  <span>Barometric Pressure & Alt</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  HYPSOMETRIC
                </span>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl md:text-4xl font-orbitron font-extrabold text-white">
                    {displayedPacket ? displayedPacket.pressure.toFixed(1) : '1012.4'}
                  </span>
                  <span className="text-sm font-rajdhani font-bold text-sky-400 ml-1">hPa</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-slate-400">CALCULATED ALTITUDE</p>
                  <p className="text-lg font-orbitron font-bold text-emerald-400">
                    {displayedPacket ? `${displayedPacket.altitude.toFixed(1)} m` : '42.5 m'}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-rajdhani text-slate-300">
                <span>Standard Sea-Level P₀: 1013.25 hPa</span>
                <span className="text-emerald-400 font-mono">Stable</span>
              </div>
            </div>

            {/* 3. Air Quality Index (AQI / MQ135) */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-all group shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-400" />
                  <span>Air Quality Index (AQI)</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {displayedPacket && displayedPacket.aqi <= 50 ? 'GOOD' : 'MODERATE'}
                </span>
              </div>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-orbitron font-extrabold text-white">
                  {displayedPacket ? displayedPacket.aqi : 34}
                </span>
                <span className="text-xs font-rajdhani text-slate-400">US AQI Standard</span>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span>0 Good</span>
                  <span>50 Moderate</span>
                  <span>150+ Warning</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.max(10, Math.min(100, ((displayedPacket?.aqi || 34) / 150) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 4. 3-Axis IMU Acceleration (MPU6050) */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all group shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span>MPU6050 3-Axis IMU Accel</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  ±2G SCALE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400">ACCEL X</p>
                  <p className="text-sm font-mono font-bold text-white">
                    {displayedPacket ? `${displayedPacket.accelX.toFixed(2)}` : '0.02'}g
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400">ACCEL Y</p>
                  <p className="text-sm font-mono font-bold text-white">
                    {displayedPacket ? `${displayedPacket.accelY.toFixed(2)}` : '-0.01'}g
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
                  <p className="text-[10px] font-mono text-slate-400">ACCEL Z</p>
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {displayedPacket ? `${displayedPacket.accelZ.toFixed(2)}` : '9.81'}g
                  </p>
                </div>
              </div>

              <div className="mt-2.5 text-[11px] font-mono text-slate-400 flex justify-between">
                <span>Gyro X/Y/Z: {displayedPacket?.gyroX || 0}°/s, {displayedPacket?.gyroY || 0}°/s</span>
                <span className="text-indigo-400">1G Calibrated</span>
              </div>
            </div>

            {/* 5. GPS Geolocation & Satellites */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-all group shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#00E5FF]" />
                  <span>NEO-6M GPS Telemetry</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
                  {displayedPacket?.gpsFix ? '3D FIX' : 'ACQUIRING'}
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Latitude:</span>
                  <span className="text-white font-bold">{displayedPacket?.lat.toFixed(5) || '18.52043'}° N</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Longitude:</span>
                  <span className="text-white font-bold">{displayedPacket?.lng.toFixed(5) || '73.85674'}° E</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Satellites Tracked:</span>
                  <span className="text-emerald-400 font-bold">{displayedPacket?.gpsSats || 9} Sats</span>
                </div>
              </div>
            </div>

            {/* 6. Pen Drive Logging Status (CCCOMA_X64FRE_EN-GB_DV9) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/40 transition-all shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-purple-300 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span>64GB Pen Drive Status</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                  <span>LOGGING ACTIVE</span>
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-rajdhani text-slate-300">Target USB Label:</span>
                  <span className="text-xs font-mono text-purple-200 font-bold">{penDriveLabel}</span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-rajdhani text-slate-300">Server CSV Log Size:</span>
                  <span className="text-xs font-mono text-emerald-300 font-bold">{penDriveFileKb} KB ({totalPackets} Lines)</span>
                </div>

                {dirHandle && (
                  <div className="flex justify-between items-baseline pt-1 border-t border-purple-500/20">
                    <span className="text-xs font-rajdhani text-purple-200">Direct USB Writes:</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{browserDiskWriteCount} Packets Appended</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 flex gap-2">
                <a
                  href="/api/hardware/export/csv"
                  className="w-full py-1.5 text-center rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-rajdhani font-bold border border-purple-500/40 transition-all"
                >
                  Export USB CSV Log
                </a>
              </div>
            </div>

          </div>

          {/* Real-time mini altitude vs time preview */}
          <div 
            id="altitude-profile-preview-card"
            className={`p-5 rounded-2xl transition-all duration-300 ${
              theme === 'light'
                ? 'bg-white/95 border border-slate-200/90 shadow-sm'
                : 'bg-slate-900/90 border border-slate-800 shadow-md'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-orbitron font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <Activity className="w-4 h-4 text-sky-600 dark:text-[#00E5FF]" />
                  <span>REAL-TIME ALTITUDE PROFILE (METERS AGL)</span>
                </h3>
                <p className="text-xs font-rajdhani text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedModuleId === 'ALL'
                    ? 'Continuous barometric telemetry from registered CanSat probes'
                    : `Tracking module feed: ${selectedSource?.name || selectedModuleId}`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Live or Paused Status Badge */}
                {isSatelliteActive ? (
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE (1Hz STREAM)
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    STREAM PAUSED (NO ACTIVE SATELLITE)
                  </span>
                )}

                {/* Pause/Resume Live Stream Button */}
                <button
                  onClick={() => {
                    setIsLiveStreaming(prev => !prev);
                    if (onToggleLiveStream) onToggleLiveStream();
                  }}
                  title={isLiveStreaming ? "Pause real-time graph plotting" : "Resume real-time graph plotting"}
                  className={`px-3 py-1 rounded-lg text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all border shadow-xs ${
                    isLiveStreaming
                      ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50'
                  }`}
                >
                  {isLiveStreaming ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                {/* Samples counter */}
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  {telemetryHistory.length} Samples
                </span>
              </div>
            </div>

            {/* Standby Banner when stream is paused or no satellite is active */}
            {!isSatelliteActive && (
              <div className="mb-3 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs font-rajdhani text-amber-900 dark:text-amber-200 flex items-center justify-between transition-all">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Graph Stationary:</strong> No satellite is currently transmitting new telemetry. Graph updates remain paused until an active CanSat begins transmitting.
                  </span>
                </div>
                <span className="hidden sm:inline text-[11px] font-mono text-amber-700 dark:text-amber-400 uppercase tracking-wider font-bold">
                  Standby
                </span>
              </div>
            )}

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetryHistory}>
                  <defs>
                    <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop 
                        offset="5%" 
                        stopColor={theme === 'light' ? '#0284c7' : '#00E5FF'} 
                        stopOpacity={0.4}
                      />
                      <stop 
                        offset="95%" 
                        stopColor={theme === 'light' ? '#0284c7' : '#00E5FF'} 
                        stopOpacity={0.0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} 
                  />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={formatTimeTick} 
                    stroke={theme === 'light' ? '#64748b' : '#94a3b8'} 
                    fontSize={10} 
                  />
                  <YAxis 
                    stroke={theme === 'light' ? '#64748b' : '#94a3b8'} 
                    fontSize={10} 
                    domain={['auto', 'auto']} 
                    unit="m" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', 
                      borderColor: theme === 'light' ? '#cbd5e1' : '#334155', 
                      color: theme === 'light' ? '#0f172a' : '#f8fafc',
                      borderRadius: '10px', 
                      fontSize: '11px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="altitude" 
                    stroke={theme === 'light' ? '#0284c7' : '#00E5FF'} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#altGrad)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Full Waveforms & Charts */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Chart 1: Temperature & Pressure Multi-Axis */}
            <div className={`p-4 rounded-2xl transition-all ${
              theme === 'light'
                ? 'bg-white/95 border border-slate-200/90 shadow-sm'
                : 'bg-slate-900/90 border border-slate-800 shadow-md'
            }`}>
              <h3 className="text-xs font-orbitron font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                <span>TEMPERATURE & BAROMETRIC PRESSURE</span>
                <span className="text-[10px] font-mono text-amber-500 dark:text-amber-400">1Hz Rolling Buffer</span>
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                    <XAxis dataKey="timestamp" tickFormatter={formatTimeTick} stroke={theme === 'light' ? '#64748b' : '#94a3b8'} fontSize={10} />
                    <YAxis yAxisId="left" stroke="#f59e0b" fontSize={10} unit="°C" domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} unit="hPa" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ 
                      backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', 
                      borderColor: theme === 'light' ? '#cbd5e1' : '#334155', 
                      color: theme === 'light' ? '#0f172a' : '#f8fafc',
                      borderRadius: '8px', 
                      fontSize: '11px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} />
                    <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: AQI & Accel Z */}
            <div className={`p-4 rounded-2xl transition-all ${
              theme === 'light'
                ? 'bg-white/95 border border-slate-200/90 shadow-sm'
                : 'bg-slate-900/90 border border-slate-800 shadow-md'
            }`}>
              <h3 className="text-xs font-orbitron font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-between">
                <span>AIR QUALITY (AQI) & ACCELERATION (G)</span>
                <span className="text-[10px] font-mono text-emerald-500 dark:text-emerald-400">1Hz Rolling Buffer</span>
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetryHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#1e293b'} />
                    <XAxis dataKey="timestamp" tickFormatter={formatTimeTick} stroke={theme === 'light' ? '#64748b' : '#94a3b8'} fontSize={10} />
                    <YAxis yAxisId="left" stroke="#10b981" fontSize={10} unit=" AQI" domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" stroke="#818cf8" fontSize={10} unit="g" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ 
                      backgroundColor: theme === 'light' ? '#ffffff' : '#0f172a', 
                      borderColor: theme === 'light' ? '#cbd5e1' : '#334155', 
                      color: theme === 'light' ? '#0f172a' : '#f8fafc',
                      borderRadius: '8px', 
                      fontSize: '11px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} />
                    <Line yAxisId="left" type="monotone" dataKey="aqi" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="accelZ" stroke="#818cf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: Pen Drive Live Log Stream Terminal */}
      {activeTab === 'terminal' && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono space-y-3">
          
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">PEN DRIVE REAL-TIME STORAGE LOG STREAM</span>
              <span className="text-slate-500">|</span>
              <span className="text-purple-300">Target: {penDriveLabel}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScrollTerminal(!autoScrollTerminal)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                  autoScrollTerminal ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {autoScrollTerminal ? 'Auto-Scroll: ON' : 'Auto-Scroll: PAUSED'}
              </button>

              <button
                onClick={() => setTerminalLogs([])}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Clear Terminal
              </button>

              <a
                href="/api/hardware/export/csv"
                className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold"
              >
                Download CSV
              </a>
            </div>
          </div>

          <div className="h-80 overflow-y-auto space-y-1 text-xs text-slate-300 pr-2">
            {terminalLogs.length === 0 ? (
              <p className="text-slate-500 italic py-4 text-center">
                Waiting for incoming 1-second CanSat packets... Make sure ESP32 is powered on http://cansat-001.local
              </p>
            ) : (
              terminalLogs.map((log, i) => {
                const parts = typeof log === 'string' ? log.split('|') : [String(log)];
                if (parts.length >= 3) {
                  return (
                    <div key={i} className="leading-relaxed hover:bg-white/5 px-1 py-0.5 rounded font-mono text-[11px] flex items-center gap-1.5 flex-wrap">
                      <span className="text-emerald-400">{parts[0]}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-200">{parts.slice(1, -1).join('|')}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-purple-400 font-bold">{parts[parts.length - 1]}</span>
                    </div>
                  );
                }
                return (
                  <div key={i} className="leading-relaxed hover:bg-white/5 px-1 py-0.5 rounded font-mono text-[11px] text-slate-200">
                    {log}
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>

        </div>
      )}

      {/* TAB 4: ESP32 Arduino Code Helper */}
      {activeTab === 'esp32guide' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-orbitron font-bold text-white">ESP32 CanSat Firmware Quick-Start</h3>
              <p className="text-xs font-rajdhani text-slate-400">
                Flash this Arduino sketch to your ESP32. It serves JSON over mDNS at <code className="text-[#00E5FF]">http://cansat-001.local</code> per second!
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
              Ready to Flash
            </span>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
            <pre>{`#include <WiFi.h>
#include <ESPmDNS.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_BMP280.h> // Or BME280 / MPU6050

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

WebServer server(80);
Adafruit_BMP280 bmp;

void handleRoot() {
  float temp = bmp.readTemperature();
  float press = bmp.readPressure() / 100.0F;
  float alt = bmp.readAltitude(1013.25);
  int aqi = analogRead(34) / 40; // MQ135 or sensor pin

  // Format JSON per second
  String json = "{";
  json += "\\"temperature\\":" + String(temp, 2) + ",";
  json += "\\"pressure\\":" + String(press, 2) + ",";
  json += "\\"altitude\\":" + String(alt, 2) + ",";
  json += "\\"aqi\\":" + String(aqi) + ",";
  json += "\\"batteryVoltage\\":4.12,";
  json += "\\"batteryPercent\\":98,";
  json += "\\"rssi\\":" + String(WiFi.RSSI()) + ",";
  json += "\\"hardwareId\\":\\"CanSat-ESP32-001\\"";
  json += "}";

  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  // Setup mDNS for http://cansat-001.local
  if (MDNS.begin("cansat-001")) {
    Serial.println("mDNS responder started: http://cansat-001.local");
  }

  bmp.begin(0x76);
  server.on("/", handleRoot);
  server.on("/data", handleRoot);
  server.on("/telemetry", handleRoot);
  server.begin();
}

void loop() {
  server.handleClient();
  delay(10);
}`}</pre>
          </div>
        </div>
      )}

    </div>
  );
};
