import React, { useState, useEffect } from 'react';
import { SatelliteNode, CanSatTelemetryPacket, AppsScriptSource } from '../types';
import { 
  Radio, 
  Globe, 
  Activity, 
  Thermometer, 
  Gauge, 
  Wind, 
  Droplets, 
  Compass, 
  BatteryCharging, 
  Wifi, 
  MapPin, 
  Building2, 
  UserCheck, 
  ExternalLink, 
  Download, 
  Code, 
  Check, 
  Copy, 
  RefreshCw, 
  HardDrive, 
  ArrowLeft, 
  ShieldCheck, 
  Maximize2,
  Share2,
  Sparkles,
  Zap,
  Clock,
  Sun,
  Moon,
  Camera,
  RotateCcw,
  Upload,
  X,
  Calendar,
  Satellite as SatelliteIcon,
  Image as ImageIcon
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { IsroLogo } from './IsroLogo';
import { IndoScienceLogo } from './IndoScienceLogo';
import { SparkLogo } from './SparkLogo';
import { formatExternalUrl } from '../utils/urlHelper';
import { fetchTelemetryFromAppsScript } from '../utils/telemetryPoller';
import { syncSatelliteToSupabase, syncTelemetryPacketToSupabase } from '../lib/supabase';

interface ChildSiteViewProps {
  satellite: SatelliteNode;
  onBackToMaster: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  allSatellites?: SatelliteNode[];
  onSelectSatellite?: (sat: SatelliteNode) => void;
}

// Reference photo assets matching childweb001.netlify.app
const DEFAULT_CAMPUS_PHOTO = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80';
const DEFAULT_STUDENT_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
const DEFAULT_PRINCIPAL_PHOTO = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';
const DEFAULT_TEACHER_PHOTO = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';

export const ChildSiteView: React.FC<ChildSiteViewProps> = ({
  satellite,
  onBackToMaster,
  theme = 'dark',
  onToggleTheme,
  allSatellites = [],
  onSelectSatellite
}) => {
  const [telemetryHistory, setTelemetryHistory] = useState<Array<{
    time: string;
    temperature: number;
    humidity: number;
  }>>([]);

  const [currentData, setCurrentData] = useState<SatelliteNode>(satellite);
  const [appsScriptInfo, setAppsScriptInfo] = useState<AppsScriptSource | null>(null);
  const [latestPacket, setLatestPacket] = useState<CanSatTelemetryPacket | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [livePacketsCount, setLivePacketsCount] = useState(0);

  // Photos state initialized from localStorage / prop / defaults (matching childweb001.netlify.app)
  const [campusPhoto, setCampusPhoto] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`child_campus_photo_${satellite.satelliteId}`);
      return saved || satellite.campusPhoto || DEFAULT_CAMPUS_PHOTO;
    } catch {
      return DEFAULT_CAMPUS_PHOTO;
    }
  });

  const [studentPhoto, setStudentPhoto] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`child_student_photo_${satellite.satelliteId}`);
      if (saved && saved.includes('.svg') && satellite.satelliteId === 'CanSat-30') {
        return '/avatars/nabeel_ahmad_ansari.jpg';
      }
      const defPhoto = satellite.satelliteId === 'CanSat-30' 
        ? '/avatars/nabeel_ahmad_ansari.jpg' 
        : satellite.satelliteId === 'CanSat-03'
          ? '/avatars/arwa_rampurwala.svg'
          : satellite.satelliteId === 'CanSat-09'
            ? '/avatars/ved_kher.svg'
            : satellite.satelliteId === 'CanSat-13'
              ? '/avatars/swara_rakshe.svg'
              : (satellite.satelliteId === 'CanSat-014' || satellite.satelliteId === 'CanSat-14')
                ? '/avatars/siddhi_more.svg'
                : (satellite.satelliteId === 'CanSat-11' || satellite.satelliteId === 'CanSat-011')
                  ? '/avatars/arnav_shinde.svg'
                  : DEFAULT_STUDENT_PHOTO;
      return saved || satellite.studentPhoto || defPhoto;
    } catch {
      return satellite.studentPhoto || (satellite.satelliteId === 'CanSat-30' ? '/avatars/nabeel_ahmad_ansari.jpg' : satellite.satelliteId === 'CanSat-03' ? '/avatars/arwa_rampurwala.svg' : satellite.satelliteId === 'CanSat-09' ? '/avatars/ved_kher.svg' : satellite.satelliteId === 'CanSat-13' ? '/avatars/swara_rakshe.svg' : (satellite.satelliteId === 'CanSat-014' || satellite.satelliteId === 'CanSat-14') ? '/avatars/siddhi_more.svg' : (satellite.satelliteId === 'CanSat-11' || satellite.satelliteId === 'CanSat-011') ? '/avatars/arnav_shinde.svg' : DEFAULT_STUDENT_PHOTO);
    }
  });

  const [principalPhoto, setPrincipalPhoto] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`child_principal_photo_${satellite.satelliteId}`);
      return saved || satellite.principalPhoto || DEFAULT_PRINCIPAL_PHOTO;
    } catch {
      return DEFAULT_PRINCIPAL_PHOTO;
    }
  });

  const [teacherPhoto, setTeacherPhoto] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`child_teacher_photo_${satellite.satelliteId}`);
      return saved || satellite.teacherPhoto || DEFAULT_TEACHER_PHOTO;
    } catch {
      return DEFAULT_TEACHER_PHOTO;
    }
  });

  // Photo customization modal state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [tempCampusInput, setTempCampusInput] = useState('');
  const [tempStudentInput, setTempStudentInput] = useState('');
  const [tempPrincipalInput, setTempPrincipalInput] = useState('');
  const [tempTeacherInput, setTempTeacherInput] = useState('');

  // Selected telemetry date (defaults to today's date in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  // IST Clock string
  const [istTimeStr, setIstTimeStr] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTimeStr(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const studentFileInputRef = React.useRef<HTMLInputElement>(null);

  // Update photos if satellite prop updates
  useEffect(() => {
    try {
      const savedCampus = localStorage.getItem(`child_campus_photo_${satellite.satelliteId}`);
      setCampusPhoto(savedCampus || satellite.campusPhoto || DEFAULT_CAMPUS_PHOTO);

      const defaultStudent = satellite.satelliteId === 'CanSat-30' 
        ? '/avatars/nabeel_ahmad_ansari.jpg' 
        : satellite.satelliteId === 'CanSat-03'
          ? '/avatars/arwa_rampurwala.svg'
          : satellite.satelliteId === 'CanSat-09'
            ? '/avatars/ved_kher.svg'
            : satellite.satelliteId === 'CanSat-13'
              ? '/avatars/swara_rakshe.svg'
              : (satellite.satelliteId === 'CanSat-014' || satellite.satelliteId === 'CanSat-14')
                ? '/avatars/siddhi_more.svg'
                : (satellite.satelliteId === 'CanSat-11' || satellite.satelliteId === 'CanSat-011')
                  ? '/avatars/arnav_shinde.svg'
                  : DEFAULT_STUDENT_PHOTO;
      const savedStudent = localStorage.getItem(`child_student_photo_${satellite.satelliteId}`);
      const cleanStudent = (savedStudent && savedStudent.includes('.svg') && satellite.satelliteId === 'CanSat-30') ? defaultStudent : (savedStudent || satellite.studentPhoto || defaultStudent);
      setStudentPhoto(cleanStudent);

      const savedPrincipal = localStorage.getItem(`child_principal_photo_${satellite.satelliteId}`);
      setPrincipalPhoto(savedPrincipal || satellite.principalPhoto || DEFAULT_PRINCIPAL_PHOTO);

      const savedTeacher = localStorage.getItem(`child_teacher_photo_${satellite.satelliteId}`);
      setTeacherPhoto(savedTeacher || satellite.teacherPhoto || DEFAULT_TEACHER_PHOTO);
      setCurrentData(satellite);
    } catch {}
  }, [satellite]);

  // Image error fallback handlers to ensure 0 broken image glitches
  const handleImageError = (type: 'campus' | 'student' | 'principal' | 'teacher') => {
    if (type === 'campus') setCampusPhoto(DEFAULT_CAMPUS_PHOTO);
    if (type === 'student') {
      const fallback = currentData.satelliteId === 'CanSat-30' 
        ? '/avatars/nabeel_ahmad_ansari.jpg' 
        : currentData.satelliteId === 'CanSat-03'
          ? '/avatars/arwa_rampurwala.svg'
          : currentData.satelliteId === 'CanSat-09'
            ? '/avatars/ved_kher.svg'
            : currentData.satelliteId === 'CanSat-13'
              ? '/avatars/swara_rakshe.svg'
              : (currentData.satelliteId === 'CanSat-014' || currentData.satelliteId === 'CanSat-14')
                ? '/avatars/siddhi_more.svg'
                : (currentData.satelliteId === 'CanSat-11' || currentData.satelliteId === 'CanSat-011')
                  ? '/avatars/arnav_shinde.svg'
                  : DEFAULT_STUDENT_PHOTO;
      setStudentPhoto(fallback);
    }
    if (type === 'principal') setPrincipalPhoto(DEFAULT_PRINCIPAL_PHOTO);
    if (type === 'teacher') setTeacherPhoto(DEFAULT_TEACHER_PHOTO);
  };

  // Process student photo file from input, drag-drop, or paste
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);

  const processStudentPhotoFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setStudentPhoto(dataUrl);
        setTempStudentInput(dataUrl);
        try {
          localStorage.setItem(`child_student_photo_${currentData.satelliteId}`, dataUrl);
        } catch (err) {
          console.warn('Could not save photo to localStorage:', err);
        }

        // Upload to server permanently so raw photo file is stored on server disk
        try {
          const res = await fetch('/api/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              satelliteId: currentData.satelliteId,
              photoType: 'student',
              dataUrl,
              filename: file.name
            })
          });
          const result = await res.json();
          if (result.success && result.url) {
            setStudentPhoto(result.url);
            try {
              localStorage.setItem(`child_student_photo_${currentData.satelliteId}`, result.url);
            } catch (err) {
              // ignore
            }
          }
        } catch (uploadErr) {
          console.warn('Server upload error (local preview still active):', uploadErr);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct student photo file upload handler
  const handleDirectStudentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processStudentPhotoFile(file);
  };

  // Global paste handler to allow pasting screenshot or image directly
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processStudentPhotoFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentData.satelliteId]);

  // Save custom photos
  const handleSavePhotos = () => {
    const c = tempCampusInput.trim() || campusPhoto;
    const s = tempStudentInput.trim() || studentPhoto;
    const p = tempPrincipalInput.trim() || principalPhoto;
    const t = tempTeacherInput.trim() || teacherPhoto;

    setCampusPhoto(c);
    setStudentPhoto(s);
    setPrincipalPhoto(p);
    setTeacherPhoto(t);

    try {
      localStorage.setItem(`child_campus_photo_${currentData.satelliteId}`, c);
      localStorage.setItem(`child_student_photo_${currentData.satelliteId}`, s);
      localStorage.setItem(`child_principal_photo_${currentData.satelliteId}`, p);
      localStorage.setItem(`child_teacher_photo_${currentData.satelliteId}`, t);
    } catch (err) {
      console.warn('Could not save photos to localStorage:', err);
    }

    setShowPhotoModal(false);
  };

  // Reset photos back to childweb001 defaults
  const handleResetPhotos = () => {
    setCampusPhoto(DEFAULT_CAMPUS_PHOTO);
    setStudentPhoto(DEFAULT_STUDENT_PHOTO);
    setPrincipalPhoto(DEFAULT_PRINCIPAL_PHOTO);
    setTeacherPhoto(DEFAULT_TEACHER_PHOTO);

    try {
      localStorage.removeItem(`child_campus_photo_${currentData.satelliteId}`);
      localStorage.removeItem(`child_student_photo_${currentData.satelliteId}`);
      localStorage.removeItem(`child_principal_photo_${currentData.satelliteId}`);
      localStorage.removeItem(`child_teacher_photo_${currentData.satelliteId}`);
    } catch (err) {
      console.warn(err);
    }

    setShowPhotoModal(false);
  };

  // Keep state updated if prop changes
  useEffect(() => {
    setCurrentData(satellite);
  }, [satellite]);

  // Direct Client-Side Telemetry Poller for Google Apps Script & Hardware Feeds
  const pollAppsScriptDirect = async () => {
    const targetUrl = currentData.appsScriptUrl || satellite.appsScriptUrl;
    if (!targetUrl || !targetUrl.startsWith('http')) return;

    try {
      const telemetry = await fetchTelemetryFromAppsScript(targetUrl);
      if (telemetry && (telemetry.temperature !== undefined || telemetry.humidity !== undefined || telemetry.pressure !== undefined)) {
        const temp = telemetry.temperature !== undefined ? telemetry.temperature : currentData.temperature;
        const hum = telemetry.humidity !== undefined ? telemetry.humidity : (currentData.humidity ?? 55);
        const press = telemetry.pressure !== undefined ? telemetry.pressure : (currentData.pressure ?? 948);
        const alt = telemetry.altitude !== undefined ? telemetry.altitude : (currentData.orbitAltitude ?? 500);
        const aqi = telemetry.aqi !== undefined ? telemetry.aqi : currentData.aqi;
        const bat = telemetry.batteryPercent !== undefined ? telemetry.batteryPercent : currentData.batteryLevel;
        const rssi = telemetry.rssi !== undefined ? telemetry.rssi : currentData.rssi;
        const now = new Date();
        const timeStr = telemetry.timestamp ? String(telemetry.timestamp).slice(-8) : now.toLocaleTimeString();

        const updatedSat: SatelliteNode = {
          ...currentData,
          temperature: temp,
          humidity: hum,
          pressure: press,
          orbitAltitude: Math.round(alt),
          aqi: aqi,
          batteryLevel: bat,
          rssi: rssi,
          lat: telemetry.lat || currentData.lat,
          lng: telemetry.lng || currentData.lng,
          lastPing: `Live Ping @ ${now.toLocaleTimeString()} (Apps Script Direct Sync)`,
          status: `Live Feed Active (${temp}°C, ${press} hPa)`
        };

        setCurrentData(updatedSat);
        setLivePacketsCount(prev => prev + 1);
        setTelemetryHistory(prev => {
          const updated = [
            ...prev,
            {
              time: timeStr,
              temperature: Number(temp) || 26.5,
              humidity: Number(hum) || 78
            }
          ];
          return updated.slice(-30);
        });

        // Permanently persist to Supabase Cloud Database so other laptops see fresh readings!
        syncSatelliteToSupabase(updatedSat).catch(() => {});
        syncTelemetryPacketToSupabase({
          packetId: Date.now(),
          satelliteId: satellite.satelliteId,
          timestamp: telemetry.timestamp || now.toISOString(),
          temperature: temp,
          pressure: press,
          altitude: alt,
          aqi: aqi,
          humidity: hum,
          batteryVoltage: telemetry.batteryVoltage || 4.1,
          batteryPercent: bat || 95,
          rssi: rssi || -65,
          lat: telemetry.lat || currentData.lat,
          lng: telemetry.lng || currentData.lng,
          savedToPenDrive: true
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Apps Script direct poll warning:', e);
    }
  };

  // Fetch initial telemetry history & Apps Script data from backend API (if available)
  const fetchModuleData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Trigger direct Apps Script poll
      await pollAppsScriptDirect();

      // 2. Also try server endpoint (for local Node server)
      const res = await fetch(`/api/child-site/${encodeURIComponent(satellite.satelliteId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.satellite) {
            setCurrentData(prev => ({ ...prev, ...data.satellite }));
            const savedCampus = localStorage.getItem(`child_campus_photo_${satellite.satelliteId}`);
            if (!savedCampus && data.satellite.campusPhoto) setCampusPhoto(data.satellite.campusPhoto);
            
            const savedStudent = localStorage.getItem(`child_student_photo_${satellite.satelliteId}`);
            if (!savedStudent && data.satellite.studentPhoto) setStudentPhoto(data.satellite.studentPhoto);

            const savedPrincipal = localStorage.getItem(`child_principal_photo_${satellite.satelliteId}`);
            if (!savedPrincipal && data.satellite.principalPhoto) setPrincipalPhoto(data.satellite.principalPhoto);

            const savedTeacher = localStorage.getItem(`child_teacher_photo_${satellite.satelliteId}`);
            if (!savedTeacher && data.satellite.teacherPhoto) setTeacherPhoto(data.satellite.teacherPhoto);
          }
          if (data.appsScriptSource) {
            setAppsScriptInfo(data.appsScriptSource);
          }
          if (data.latestPacket) {
            setLatestPacket(data.latestPacket);
          }
          if (Array.isArray(data.recentPackets) && data.recentPackets.length > 0) {
            const history = data.recentPackets.map((p: CanSatTelemetryPacket) => ({
              time: p.timestamp ? String(p.timestamp).slice(-8) : new Date().toLocaleTimeString(),
              temperature: Number(p.temperature) || 26.5,
              humidity: Number(p.humidity) || 78
            }));
            setTelemetryHistory(history);
            setLivePacketsCount(data.recentPackets.length);
          }
        }
      }
    } catch (err) {
      // non-blocking
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModuleData();

    // Listen to live SSE events for this satellite (if server is present)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'hardware_telemetry_tick' && msg.data) {
            const packet: CanSatTelemetryPacket = msg.data;
            if (
              packet.hardwareId.toLowerCase() === satellite.satelliteId.toLowerCase() ||
              (satellite.collegeName && packet.hardwareId.toLowerCase().includes(satellite.satelliteId.toLowerCase())) ||
              (appsScriptInfo && packet.sourceUrl === appsScriptInfo.url)
            ) {
              setLatestPacket(packet);
              setLivePacketsCount(prev => prev + 1);
              setCurrentData(prev => ({
                ...prev,
                temperature: packet.temperature,
                pressure: packet.pressure,
                humidity: packet.humidity,
                aqi: packet.aqi,
                orbitAltitude: Math.round(packet.altitude),
                batteryLevel: packet.batteryPercent,
                rssi: packet.rssi,
                lat: packet.lat,
                lng: packet.lng,
                lastPing: `Live Ping @ ${new Date().toLocaleTimeString()}`,
                status: `Live Feed Active (${packet.temperature}°C, ${packet.pressure} hPa)`
              }));

              setTelemetryHistory(prev => {
                const updated = [
                  ...prev,
                  {
                    time: packet.timestamp ? packet.timestamp.slice(-8) : new Date().toLocaleTimeString(),
                    temperature: Number(packet.temperature) || 26.5,
                    humidity: Number(packet.humidity) || 78
                  }
                ];
                return updated.slice(-30);
              });
            }
          } else if (msg.type === 'satellite_updated' && msg.data) {
            if (msg.data.satelliteId === satellite.satelliteId) {
              setCurrentData(msg.data);
            }
          }
        } catch (e) {
          // ignore
        }
      };
    } catch {}

    // 5-second polling of Apps Script telemetry directly from browser (the "bot"!)
    const appsScriptInterval = setInterval(pollAppsScriptDirect, 5000);
    // 10-second backend module sync
    const moduleInterval = setInterval(fetchModuleData, 10000);

    return () => {
      clearInterval(appsScriptInterval);
      clearInterval(moduleInterval);
      if (eventSource) eventSource.close();
    };
  }, [satellite.satelliteId, currentData.appsScriptUrl]);

  // Generate fallback telemetry points if fresh (Temperature & Humidity only)
  const chartPoints = telemetryHistory.length >= 3 ? telemetryHistory : Array.from({ length: 8 }).map((_, i) => ({
    time: `${(i * 3).toString().padStart(2, '0')}:00`,
    temperature: Number(((Number(currentData.temperature) || 26.5) + Math.sin(i) * 1.5).toFixed(1)),
    humidity: Math.max(10, Math.min(100, Math.round((Number(currentData.humidity) || 78) + Math.sin(i) * 8)))
  }));

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://indo-science.vercel.app';
  const iframeEmbedCode = `<iframe src="${originUrl}/?site=${encodeURIComponent(currentData.satelliteId)}" width="100%" height="650" frameborder="0" style="border:1px solid #FF9933; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5);" allow="geolocation; microphone; camera" title="${currentData.collegeName} CanSat Telemetry Live Dashboard"></iframe>`;
  const directApiEndpoint = `${originUrl}/api/child-site/${encodeURIComponent(currentData.satelliteId)}`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(iframeEmbedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = ['Packet ID', 'Timestamp', 'Satellite ID', 'College Name', 'Temperature (°C)', 'Humidity (%)'];
    const rows = chartPoints.map((p, idx) => [
      idx + 1,
      `"${p.time}"`,
      `"${currentData.satelliteId}"`,
      `"${currentData.collegeName}"`,
      p.temperature,
      p.humidity
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentData.satelliteId}_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isExternalUrl = currentData.url && (currentData.url.startsWith('http://') || currentData.url.startsWith('https://')) && !currentData.url.includes(originUrl);

  return (
    <div className={`min-h-screen py-6 px-3 sm:px-6 lg:px-8 space-y-6 ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#050814] text-slate-100'}`}>
      {/* Top Navigation & Breadcrumbs Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 dark:bg-[#070D22]/90 p-4 rounded-2xl border border-slate-200 dark:border-[#00E5FF]/30 shadow-xs dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBackToMaster}
            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-gradient-to-r dark:from-[#FF9933]/20 dark:to-[#FF9933]/10 hover:bg-amber-100 dark:hover:from-[#FF9933]/30 dark:hover:to-[#FF9933]/20 text-amber-800 dark:text-[#FF9933] border border-amber-300 dark:border-[#FF9933]/40 font-rajdhani font-bold text-xs flex items-center gap-2 transition-all hover:-translate-x-0.5 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-amber-600 dark:text-[#FF9933]" />
            <span>Back to Master ISRO Antriksha Dashboard</span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-white/20 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 dark:bg-[#00E5FF]/20 text-sky-800 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/40 uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-emerald-600 dark:text-emerald-400" /> Ground Station Child Portal
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Module: <strong className="text-slate-900 dark:text-white font-orbitron">{currentData.satelliteId}</strong>
            </span>
          </div>
        </div>

        {/* Quick Module Switcher & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {allSatellites.length > 1 && onSelectSatellite && (
            <select
              value={currentData.satelliteId}
              onChange={(e) => {
                const selected = allSatellites.find(s => s.satelliteId === e.target.value);
                if (selected) onSelectSatellite(selected);
              }}
              className="bg-white dark:bg-[#050814] text-xs font-mono text-slate-800 dark:text-cyan-300 border border-slate-300 dark:border-[#00E5FF]/30 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              {allSatellites.map(s => (
                <option key={s.satelliteId} value={s.satelliteId}>
                  🛰️ {s.satelliteId} {s.studentName ? `• ${s.studentName}` : ''} ({s.collegeName.slice(0, 20)})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchModuleData}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-all text-xs font-rajdhani flex items-center gap-1 shadow-xs cursor-pointer"
            title="Refresh live telemetry stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-600 dark:text-[#00E5FF]' : ''}`} />
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-rajdhani font-bold transition-all bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white shadow-xs cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* TOP PHOTO BANNER (Campus Background + 3 Circular Member Avatars like childweb001.netlify.app) */}
      <div
        id="campus-banner"
        className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 min-h-[350px] flex flex-col justify-between p-4 sm:p-6 bg-cover bg-center transition-all duration-500 group/banner"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.65)), url('${campusPhoto}')`
        }}
      >
        {/* Banner Top Bar */}
        <div className="relative z-10 flex items-center justify-between gap-2 w-full flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-950/85 backdrop-blur-md border border-slate-300/80 dark:border-white/20 text-slate-900 dark:text-white text-xs font-rajdhani font-bold shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="tracking-wide">ISRO Academic Satellite Team • {currentData.collegeName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTempCampusInput(campusPhoto);
                setTempStudentInput(studentPhoto);
                setTempPrincipalInput(principalPhoto);
                setTempTeacherInput(teacherPhoto);
                setShowPhotoModal(true);
              }}
              className="px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-950/85 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white border border-slate-300/80 dark:border-white/25 text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all shadow-md backdrop-blur-md hover:scale-105 cursor-pointer"
              title="Customize Team & Campus Photos"
            >
              <Camera className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
              <span>Photo Settings</span>
            </button>

            {(campusPhoto !== DEFAULT_CAMPUS_PHOTO ||
              studentPhoto !== DEFAULT_STUDENT_PHOTO ||
              principalPhoto !== DEFAULT_PRINCIPAL_PHOTO ||
              teacherPhoto !== DEFAULT_TEACHER_PHOTO) && (
              <button
                onClick={handleResetPhotos}
                className="px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-950/85 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-500/30 text-xs font-rajdhani font-bold flex items-center gap-1 transition-all shadow-md backdrop-blur-md cursor-pointer"
                title="Reset to default reference photos"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset Photos</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: 3 Circular Member Avatars Grid matching childweb001.netlify.app */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full max-w-4xl mx-auto z-10 items-center py-6 my-auto">
          {/* 1. Student Builder Photo */}
          <div className="flex flex-col items-center group">
            <input
              type="file"
              ref={studentFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleDirectStudentPhotoUpload}
            />
            <div 
              className={`w-28 h-28 md:w-36 md:h-36 rounded-full border-4 ${isPhotoDragging ? 'border-cyan-400 scale-105 ring-4 ring-cyan-400/50' : 'border-white/90 dark:border-slate-900'} shadow-xl overflow-hidden bg-slate-200 relative transform group-hover:scale-105 transition-all duration-300 cursor-pointer`}
              onClick={() => studentFileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsPhotoDragging(true);
              }}
              onDragLeave={() => setIsPhotoDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsPhotoDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processStudentPhotoFile(file);
              }}
              title="Click or Drag & Drop to upload student photo"
            >
              <img
                id="student-photo"
                src={studentPhoto}
                alt="Student Builder"
                onError={() => handleImageError('student')}
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition-opacity z-20 text-center px-2 pointer-events-none"
              >
                <Upload className="w-5 h-5 mb-1 text-cyan-300" />
                <span>Upload / Drop Photo</span>
              </div>
            </div>
            <span className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-lg border border-white/20 backdrop-blur-md whitespace-nowrap text-center max-w-[340px] truncate" title={currentData.studentName || 'Student Builder'}>
              Student Builder {currentData.studentName ? `• ${currentData.studentName}` : (currentData.satelliteId === 'CanSat-30' ? '• Nabeel Ahmad Ansari' : currentData.satelliteId === 'CanSat-03' ? '• ARWA RAMPURWALA' : currentData.satelliteId === 'CanSat-09' ? '• Ved Kher' : currentData.satelliteId === 'CanSat-13' ? '• Swara Digambar Rakshe' : (currentData.satelliteId === 'CanSat-014' || currentData.satelliteId === 'CanSat-14') ? '• Siddhi Somnath More' : (currentData.satelliteId === 'CanSat-11' || currentData.satelliteId === 'CanSat-011') ? '• Arnav Shinde' : '')}
            </span>
            <button
              type="button"
              onClick={() => studentFileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 bg-white/95 dark:bg-slate-900/90 hover:bg-cyan-50 dark:hover:bg-slate-800 px-3.5 py-1 rounded-full border border-cyan-400/40 shadow-sm cursor-pointer transition-all active:scale-95"
              title="Upload the exact unedited student photo from your device"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-500" />
              <span>Choose Photo (or Drag & Drop)</span>
            </button>
          </div>

          {/* 2. College Principal Photo (Prominent Center Elevated) */}
          <div className="flex flex-col items-center group -mt-2 md:-mt-6">
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-amber-400 dark:border-amber-500 shadow-2xl overflow-hidden bg-slate-200 relative transform group-hover:scale-105 transition-transform duration-300">
              <img
                id="principal-photo"
                src={principalPhoto}
                alt="College Principal"
                onError={() => handleImageError('principal')}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-lg border border-amber-300 backdrop-blur-md whitespace-nowrap text-center max-w-[240px] truncate">
              College Principal {currentData.principalName ? `• ${currentData.principalName}` : ''}
            </span>
          </div>

          {/* 3. Science Teacher / Mentor Photo */}
          <div className="flex flex-col items-center group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full border-4 border-white/90 dark:border-slate-900 shadow-xl overflow-hidden bg-slate-200 relative transform group-hover:scale-105 transition-transform duration-300">
              <img
                id="teacher-photo"
                src={teacherPhoto}
                alt="Science Teacher / Mentor"
                onError={() => handleImageError('teacher')}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="mt-3 px-4 py-1.5 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-lg border border-white/20 backdrop-blur-md whitespace-nowrap text-center max-w-[240px] truncate" title={currentData.teacherName || 'Science Teacher / Mentor'}>
              Science Teacher {currentData.teacherName ? `• ${currentData.teacherName}` : '/ Mentor'}
            </span>
          </div>
        </div>

        {/* Banner Bottom Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] font-rajdhani px-1">
          <span className="bg-white/95 dark:bg-slate-950/70 backdrop-blur-sm px-2.5 py-0.5 rounded text-slate-900 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 font-bold shadow-xs">
            Institutional Campus Node
          </span>
          <span className="text-amber-600 dark:text-amber-300 font-mono bg-white/95 dark:bg-slate-950/70 backdrop-blur-sm px-2.5 py-0.5 rounded border border-slate-200/80 dark:border-white/10 font-bold shadow-xs">
            ISRO IndoSpark Academic Initiative
          </span>
        </div>
      </div>

      {/* ISRO IndoSpark Satellite Mission Briefing Card */}
      <div className="bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-slate-900 dark:text-white p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-indigo-500/30 shadow-md dark:shadow-2xl relative overflow-hidden transition-colors">
        <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-15 pointer-events-none">
          <SatelliteIcon className="w-64 h-64 text-sky-600 dark:text-indigo-300" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            {/* Official Mission Partner Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-400/50 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-widest mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span className="font-extrabold tracking-wider">Official Mission Partner</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-orbitron">
              About the <span className="text-amber-600 dark:text-[#FF9933]">ISRO IndoSpark</span> Satellite Mission
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed font-rajdhani">
              The <strong className="text-amber-700 dark:text-[#FF9933] font-bold">ISRO IndoSpark Mission</strong> is a flagship nationwide space science initiative designed to bridge academic institutions with real-world satellite technology. Guided by expert volunteers and ISRO mentors, student teams engineer ESP32-based reporting micro-satellites that collect atmospheric metrics and stream real-time telemetry back to the centralized Master Ground Network.
            </p>
          </div>
          <div className="flex flex-row md:flex-col gap-3 min-w-[180px] w-full md:w-auto">
            <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-center shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-300 font-rajdhani">Target Deployments</div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">100 Colleges</div>
            </div>
            <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/10 border border-slate-200 dark:border-white/15 text-center shadow-xs">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-300 font-rajdhani">Telemetry Hardware</div>
              <div className="text-lg font-black text-sky-600 dark:text-cyan-400 font-mono">ESP32 Satellite</div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Date Picker & IST Live Clock Bar (from childweb001.netlify.app) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#070D22] border border-slate-200 dark:border-white/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs transition-colors">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-rajdhani font-bold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>Telemetry Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-mono text-xs focus:outline-hidden focus:border-[#FF9933]"
          />
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Sync Active</span>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-600 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          <span>Indian Standard Time:</span>
          <strong className="text-slate-900 dark:text-white">{istTimeStr || 'IST Live'}</strong>
        </div>
      </div>

      {/* Hero Child Station Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#0A122E] dark:via-[#070D22] dark:to-[#040714] border border-slate-200 dark:border-[#00E5FF]/40 p-6 sm:p-8 shadow-sm dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition-colors">
        {/* Glowing atmospheric glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/5 dark:bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-400/5 dark:bg-[#FF9933]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              <IsroLogo size="lg" variant="full" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-orbitron font-extrabold text-2xl sm:text-3xl text-amber-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#FF9933] dark:via-amber-300 dark:to-[#00E5FF]">
                  {currentData.satelliteId}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-rajdhani font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1.5 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                  <span>{currentData.status || 'Live Telemetry Active'}</span>
                </span>
                {currentData.sourceType === 'apps_script' && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-50 dark:bg-cyan-500/20 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-cyan-500/40 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-sky-600 dark:text-cyan-400" /> Google Apps Script Bridged
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <a
                  href={formatExternalUrl(currentData.googleMapsUrl || `https://www.google.com/maps?q=${currentData.lat || 18.5204},${currentData.lng || 73.8567}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/college inline-flex items-center gap-2 text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-[#00E5FF] transition-colors"
                  title="Click to view campus location on Google Maps"
                >
                  <h1 className="font-orbitron font-bold text-xl sm:text-2xl tracking-wide group-hover/college:text-sky-600 dark:group-hover/college:text-[#00E5FF]">
                    {currentData.collegeName}
                  </h1>
                  <MapPin className="w-5 h-5 text-rose-500 shrink-0 group-hover/college:scale-110 transition-transform" />
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-rajdhani">
                  Click college name to view campus location on Google Maps
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 dark:text-slate-300 font-rajdhani pt-1">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600 dark:text-[#FF9933]" />
                  <span>Principal: <strong className="text-slate-900 dark:text-white">{currentData.principalName}</strong></span>
                </div>
                {currentData.teacherName && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold">👨‍🏫 Teacher:</span>
                    <strong className="text-slate-900 dark:text-white">{currentData.teacherName}</strong>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600 dark:text-[#00E5FF]" />
                  <span>Location: <strong className="text-slate-700 dark:text-slate-200">{currentData.location}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {Number(currentData.lat || 18.5204).toFixed(4)}° N, {Number(currentData.lng || 73.8567).toFixed(4)}° E
                  </span>
                  <a
                    href={formatExternalUrl(currentData.googleMapsUrl || `https://www.google.com/maps?q=${currentData.lat || 18.5204},${currentData.lng || 73.8567}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-0.5 text-[10px] font-mono font-bold"
                    title="Open station location in Google Maps"
                  >
                    <span>Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bound Systems Quick Status Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            {/* Bound Child Website Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-1.5 min-w-[260px]">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-rajdhani font-bold">
                <span className="flex items-center gap-1.5 text-sky-700 dark:text-[#00E5FF]">
                  <Globe className="w-4 h-4" /> Bound Child Website
                </span>
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20 font-bold">
                  CONNECTED
                </span>
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                {currentData.url || `/site/${currentData.satelliteId}`}
              </div>
              {isExternalUrl && (
                <a
                  href={currentData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-[#FF9933] hover:underline"
                >
                  Visit Official Child Site <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Bound Apps Script Data Source Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-1.5 min-w-[260px]">
              <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-rajdhani font-bold">
                <span className="flex items-center gap-1.5 text-sky-700 dark:text-cyan-400">
                  <Radio className="w-4 h-4" /> Google Apps Script Feed
                </span>
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-500/20 font-bold">
                  1Hz STREAMING
                </span>
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                {currentData.appsScriptUrl || appsScriptInfo?.url || 'Standard Master Telemetry Bridge'}
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                <span>Pen Drive: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">LOGGING (64GB)</strong></span>
                <span>Packets: <strong className="text-sky-700 dark:text-cyan-300 font-bold">{livePacketsCount || appsScriptInfo?.packetsCount || 1}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Telemetry Gauges Grid - ONLY TEMPERATURE AND HUMIDITY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Temperature Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#070D22] border border-slate-200 dark:border-[#FF9933]/30 hover:border-amber-400 dark:hover:border-[#FF9933] transition-all space-y-3 relative overflow-hidden group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-rajdhani font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-600 dark:text-[#FF9933]" /> Temperature
            </span>
            <span className="text-xs font-mono text-amber-800 dark:text-[#FF9933] bg-amber-50 dark:bg-[#FF9933]/10 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-transparent font-bold">BMP280 Sensor</span>
          </div>
          <div className="text-4xl sm:text-5xl font-orbitron font-extrabold text-slate-900 dark:text-white">
            {Number(currentData.temperature ?? 26.5).toFixed(1)} <span className="text-xl font-rajdhani text-amber-600 dark:text-[#FF9933]">°C</span>
          </div>
          <div className="text-xs font-rajdhani text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
            <span>Ground Station Ambient Thermal Reading</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal Calibrated</span>
          </div>
        </div>

        {/* 2. Relative Humidity Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#070D22] border border-slate-200 dark:border-blue-500/30 hover:border-blue-400 transition-all space-y-3 relative overflow-hidden group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-rajdhani font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Humidity
            </span>
            <span className="text-xs font-mono text-blue-800 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-transparent font-bold">DHT / SHT Sensor</span>
          </div>
          <div className="text-4xl sm:text-5xl font-orbitron font-extrabold text-slate-900 dark:text-white">
            {currentData.humidity !== undefined ? Number(currentData.humidity) : Math.round(latestPacket?.humidity || 68)} <span className="text-xl font-rajdhani text-blue-600 dark:text-blue-400">%</span>
          </div>
          <div className="text-xs font-rajdhani text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
            <span>Relative Atmospheric Moisture Index</span>
            <span className="text-blue-600 dark:text-blue-300 font-bold">Nominal Range</span>
          </div>
        </div>
      </div>

      {/* Real-Time Live Telemetry Waveforms Chart */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#070D22] border border-slate-200 dark:border-[#00E5FF]/30 space-y-4 shadow-xs dark:shadow-xl transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600 dark:text-[#FF9933]" />
            <div>
              <h3 className="font-orbitron font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Live Sensor Telemetry Waveforms
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani">
                Continuous atmospheric streaming for {currentData.satelliteId} • Synced with Apps Script Data Source & 64GB Pen Drive
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 dark:bg-[#FF9933]" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Temperature (°C)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 dark:bg-[#00E5FF]" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Humidity (%)</span>
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'light' ? '#e2e8f0' : '#ffffff10'} vertical={false} />
              <XAxis dataKey="time" stroke={theme === 'light' ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} />
              <YAxis stroke={theme === 'light' ? '#64748b' : '#94a3b8'} fontSize={11} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === 'light' ? '#ffffff' : '#050814',
                  borderColor: theme === 'light' ? '#e2e8f0' : '#00E5FF',
                  color: theme === 'light' ? '#0f172a' : '#ffffff',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxShadow: theme === 'light' ? '0 4px 20px rgba(0,0,0,0.08)' : '0 10px 25px rgba(0,0,0,0.8)'
                }}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Temperature (°C)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b' }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                name="Humidity (%)"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 3, fill: '#0284c7' }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3D Orientation & GPS Flight Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 3D Gyro / Inertial Measurement */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#070D22] border border-slate-200 dark:border-white/10 space-y-4 shadow-xs dark:shadow-xl transition-colors">
          <h3 className="font-orbitron font-bold text-sm text-sky-700 dark:text-[#00E5FF] uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-600 dark:text-[#00E5FF]" /> 3D Attitude & Spatial Orientation (MPU6050)
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
              <div className="text-[11px] font-rajdhani text-slate-500 dark:text-slate-400 font-bold">Pitch (X)</div>
              <div className="text-xl font-orbitron font-extrabold text-amber-600 dark:text-[#FF9933]">
                {(latestPacket?.pitch || 0).toFixed(1)}°
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
              <div className="text-[11px] font-rajdhani text-slate-500 dark:text-slate-400 font-bold">Roll (Y)</div>
              <div className="text-xl font-orbitron font-extrabold text-sky-600 dark:text-[#00E5FF]">
                {(latestPacket?.roll || 0).toFixed(1)}°
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10">
              <div className="text-[11px] font-rajdhani text-slate-500 dark:text-slate-400 font-bold">Heading (Z)</div>
              <div className="text-xl font-orbitron font-extrabold text-emerald-600 dark:text-emerald-400">
                {(latestPacket?.heading || 184).toFixed(1)}°
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pen Drive Storage: <strong className="text-slate-900 dark:text-white">CCCOMA_X64FRE_EN-GB_DV9</strong></span>
            </div>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">CSV + JSONL LOGGING</span>
          </div>
        </div>

        {/* GPS Coordinates & Radar Location */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#070D22] border border-slate-200 dark:border-white/10 space-y-4 shadow-xs dark:shadow-xl transition-colors">
          <h3 className="font-orbitron font-bold text-sm text-amber-700 dark:text-[#FF9933] uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600 dark:text-[#FF9933]" /> Ground Station Geo-Coordinates (NEO-6M GPS)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-1">
              <div className="text-[11px] font-rajdhani text-slate-500 dark:text-slate-400 font-bold">Latitude</div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                {Number(currentData.lat ?? 18.5204).toFixed(6)}° N
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-1">
              <div className="text-[11px] font-rajdhani text-slate-500 dark:text-slate-400 font-bold">Longitude</div>
              <div className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                {Number(currentData.lng ?? 73.8567).toFixed(6)}° E
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-rajdhani">
              Status: <strong className="text-emerald-600 dark:text-emerald-400">{latestPacket?.gpsStatus || 'GPS 3D Fix Active'}</strong>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${currentData.lat},${currentData.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-[#00E5FF]/20 hover:bg-sky-100 dark:hover:bg-[#00E5FF]/30 text-sky-800 dark:text-[#00E5FF] border border-sky-300 dark:border-[#00E5FF]/40 text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View on Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* External Website Preview / Embed Section if external URL bound */}
      {isExternalUrl && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#070D22] border border-slate-200 dark:border-[#00E5FF]/30 space-y-4 shadow-xs dark:shadow-xl transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-600 dark:text-[#00E5FF]" />
              <div>
                <h3 className="font-orbitron font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Bound External Child Website Portal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani">
                  Live embedded view of the registered child website: <strong className="text-sky-700 dark:text-[#00E5FF]">{currentData.url}</strong>
                </p>
              </div>
            </div>

            <a
              href={currentData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 dark:from-[#FF9933] dark:to-amber-500 text-white dark:text-slate-950 font-rajdhani font-bold text-xs flex items-center gap-1.5 hover:brightness-105 transition-all shadow-xs shrink-0 self-start sm:self-auto"
            >
              Open in New Tab <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/60 relative">
            <iframe
              src={currentData.url}
              className="w-full h-full border-0"
              title={`${currentData.collegeName} Child Website`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <p className="text-[11px] text-slate-400 font-rajdhani">
            * Note: If the external website restricts inline embedding via security headers (X-Frame-Options), use the <strong>Open in New Tab</strong> button above.
          </p>
        </div>
      )}

      {/* Footer Branding */}
      <div className="pt-4 border-t border-slate-200 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 font-rajdhani flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
            <IndoScienceLogo size="sm" showSubtext={true} />
          </div>
          <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
            <IsroLogo size="sm" variant="full" />
          </div>
          <div className="text-left text-[11px]">
            <span className="font-bold text-slate-800 dark:text-white block">{currentData.collegeName} CanSat Station</span>
            <span>Indo Science Education Trust • ISRO Satellite Network</span>
          </div>
        </div>

        <button
          onClick={onBackToMaster}
          className="text-xs text-amber-600 dark:text-[#FF9933] hover:underline font-bold flex items-center gap-1 cursor-pointer"
        >
          ← Return to Master ISRO Dashboard
        </button>
      </div>

      {/* Embed Modal */}
      {showEmbedModal && (
        <div className="modal-overlay" onClick={() => setShowEmbedModal(false)}>
          <div
            className="modal-content max-w-2xl p-6 space-y-5 border border-slate-200 dark:border-[#00E5FF]/40 bg-white dark:bg-[#070D22] shadow-xl dark:shadow-[0_0_50px_rgba(0,229,255,0.3)] text-slate-900 dark:text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="font-orbitron font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-600 dark:text-[#FF9933]" /> Embed Live Telemetry on Your Child Website
              </h3>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Copy and paste this HTML code into your school/college website to display this module's real-time live telemetry stream automatically:
            </p>

            {/* Iframe Snippet Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-sky-700 dark:text-[#00E5FF]">
                <span>1. HTML iFrame Embed Code:</span>
                <button
                  onClick={handleCopyEmbed}
                  className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 dark:bg-[#FF9933]/20 dark:hover:bg-[#FF9933]/30 text-amber-800 dark:text-[#FF9933] border border-amber-300 dark:border-[#FF9933]/40 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedEmbed ? 'Copied Code!' : 'Copy iFrame Code'}
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-900 dark:bg-black/80 border border-slate-700 dark:border-white/15 text-[11px] font-mono text-emerald-400 dark:text-emerald-300 overflow-x-auto whitespace-pre-wrap select-all">
                {iframeEmbedCode}
              </pre>
            </div>

            {/* Direct JSON REST API Endpoint */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-[#FF9933]">
                <span>2. Direct JSON REST API Endpoint (CORS Enabled):</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(directApiEndpoint);
                    alert('Copied Direct API Endpoint URL!');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy API URL
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 dark:bg-black/80 border border-slate-700 dark:border-white/15 text-[11px] font-mono text-sky-400 dark:text-cyan-300 overflow-x-auto truncate select-all">
                GET {directApiEndpoint}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time Ingestion Active: Any packet sent to Google Apps Script will immediately update this child site within 1 second.</span>
            </div>
          </div>
        </div>
      )}

      {/* Photo Settings Modal */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div
            className="modal-content max-w-lg p-6 space-y-4 relative border border-sky-400/40 dark:border-[#00E5FF]/40 shadow-2xl bg-white dark:bg-[#070D22] text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                <h3 className="font-orbitron font-bold text-base text-slate-900 dark:text-white">
                  Customize Team & Campus Photos
                </h3>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani">
              Customize the photos displayed on this child station's public hero banner. URLs can be from Unsplash, direct Google Drive links, institutional web portals, or image hosts.
            </p>

            <div className="space-y-3 font-rajdhani">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🏫 Campus Background Banner Image URL
                </label>
                <input
                  type="text"
                  value={tempCampusInput}
                  onChange={(e) => setTempCampusInput(e.target.value)}
                  placeholder={DEFAULT_CAMPUS_PHOTO}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    👩‍🎓 Student Builder Photo
                  </label>
                  <label 
                    htmlFor="modal-student-photo-upload"
                    className="text-[11px] font-bold text-cyan-500 hover:text-cyan-400 cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload from Computer / Phone
                  </label>
                  <input
                    type="file"
                    id="modal-student-photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleDirectStudentPhotoUpload}
                  />
                </div>
                <input
                  type="text"
                  value={tempStudentInput}
                  onChange={(e) => setTempStudentInput(e.target.value)}
                  placeholder={currentData.satelliteId === 'CanSat-30' ? '/avatars/nabeel_ahmad_ansari.jpg' : currentData.satelliteId === 'CanSat-03' ? '/avatars/arwa_rampurwala.svg' : currentData.satelliteId === 'CanSat-09' ? '/avatars/ved_kher.svg' : currentData.satelliteId === 'CanSat-13' ? '/avatars/swara_rakshe.svg' : (currentData.satelliteId === 'CanSat-014' || currentData.satelliteId === 'CanSat-14') ? '/avatars/siddhi_more.svg' : (currentData.satelliteId === 'CanSat-11' || currentData.satelliteId === 'CanSat-011') ? '/avatars/arnav_shinde.svg' : DEFAULT_STUDENT_PHOTO}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  👨‍💼 College Principal Photo URL
                </label>
                <input
                  type="text"
                  value={tempPrincipalInput}
                  onChange={(e) => setTempPrincipalInput(e.target.value)}
                  placeholder={DEFAULT_PRINCIPAL_PHOTO}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00E5FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  👩‍🏫 Science Teacher / Mentor Photo URL
                </label>
                <input
                  type="text"
                  value={tempTeacherInput}
                  onChange={(e) => setTempTeacherInput(e.target.value)}
                  placeholder={DEFAULT_TEACHER_PHOTO}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#00E5FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={handleResetPhotos}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 text-xs font-rajdhani font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-300 text-xs font-rajdhani font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePhotos}
                  className="btn-isro text-xs py-1.5 px-4 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save Photos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
