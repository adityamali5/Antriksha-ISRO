import React, { useState, useEffect, useCallback } from 'react';
import { SatelliteNode } from './types';
import { MASTER_APPS_SCRIPT_URL, generateFullSeedDataset, INITIAL_SEED_SATELLITES } from './data/seedData';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ExplorerView } from './components/ExplorerView';
import { RadarMapView } from './components/RadarMapView';
import { SatelliteDetailModal } from './components/SatelliteDetailModal';
import { AdminModal } from './components/AdminModal';
import { ChildSiteView } from './components/ChildSiteView';
import { IsroLogo } from './components/IsroLogo';
import { IndoScienceLogo } from './components/IndoScienceLogo';
import { SparkLogo } from './components/SparkLogo';
import {
  fetchSatellitesFromSupabase,
  syncSatelliteToSupabase,
  deleteSatelliteFromSupabase,
  subscribeToSupabaseSatellites,
  isSupabaseConfigured
} from './lib/supabase';
import { fetchTelemetryFromAppsScript } from './utils/telemetryPoller';

const STORAGE_KEY_SATELLITES = 'antriksha_isro_satellites_v2';
const STORAGE_KEY_LIVE_MODE = 'antriksha_isro_live_mode_v2';
const STORAGE_KEY_CUSTOM_NODES = 'antriksha_custom_nodes_v2';

const isExampleSatellite = (satId?: string, id?: string | number): boolean => {
  if (!satId && !id) return false;
  const s = String(satId || '').trim().toLowerCase();
  const i = String(id || '').trim();
  return (
    s === 'cansat-001' ||
    s === 'cansat_2' ||
    s === 'cansat003' ||
    s === 'cansat004' ||
    i === '1787473481958' ||
    i === '1787478692573' ||
    i === '1787480370464' ||
    i === '1787480578235' ||
    i === 'apps-script-hardware-01' ||
    i === 'apps-script-cansat-02' ||
    i === 'apps-script-cansat-03' ||
    i === 'apps-script-cansat-04'
  );
};

// Load stored satellites added by the user, or default to empty list
const getInitialSatellites = (): SatelliteNode[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SATELLITES);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const cleaned = sanitizeSatellites(parsed).filter(s => !isExampleSatellite(s.satelliteId, s.id));
        if (cleaned.length > 0) {
          localStorage.setItem(STORAGE_KEY_SATELLITES, JSON.stringify(cleaned));
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load satellites from localStorage:', e);
  }
  return INITIAL_SEED_SATELLITES;
};

const sanitizeSatellites = (data: any[]): SatelliteNode[] => {
  if (!Array.isArray(data)) return [];
  const result: SatelliteNode[] = [];

  data.forEach((item, idx) => {
    const serialNum = item.id || idx + 1;
    let satId = item.satelliteId || item.satelliteNumber;
    if (isExampleSatellite(satId, serialNum)) {
      return; // Skip/purge legacy example nodes
    }
    if (!satId) {
      satId = `Satellite #${serialNum}`;
    } else if (typeof satId === 'string' && satId.startsWith('Satellite_')) {
      satId = satId.replace('Satellite_', 'Satellite #');
    } else if (typeof satId === 'number' || /^\d+$/.test(String(satId))) {
      satId = `Satellite #${satId}`;
    }

    // Try finding URL from all possible keys in Sheets or custom JSON
    let foundUrl = item.url || item.childUrl || item['Child Website URL'] || item['Child Site URL'] || item.website || item.link || item.siteUrl || item.childWebsiteUrl || item.child_url;

    // Fallback to seed dataset URL matching by ID or college name if missing
    if (!foundUrl) {
      const matchedSeed = INITIAL_SEED_SATELLITES.find(s => 
        s.id === serialNum || 
        (s.collegeName && item.collegeName && s.collegeName.toLowerCase().trim() === item.collegeName.toLowerCase().trim())
      );
      if (matchedSeed && matchedSeed.url) {
        foundUrl = matchedSeed.url;
      }
    }

    // Clean and validate URL string
    foundUrl = (foundUrl || '').trim();
    if (
      foundUrl === 'N/A' || 
      foundUrl === 'none' || 
      foundUrl === 'undefined' || 
      foundUrl.includes('indo-science.vercel.app')
    ) {
      foundUrl = '';
    }

    if (foundUrl && !foundUrl.startsWith('http://') && !foundUrl.startsWith('https://')) {
      foundUrl = `https://${foundUrl}`;
    }

    let lat = typeof item.lat === 'number' && !isNaN(item.lat) ? item.lat : (Number(item.lat) || 18.519585);
    let lng = typeof item.lng === 'number' && !isNaN(item.lng) ? item.lng : (Number(item.lng) || 73.859096);
    if (satId === 'CanSat-01' || item.collegeName === 'Soumodip_GGS') {
      lat = 18.519585;
      lng = 73.859096;
      foundUrl = ''; // Clear to blank as requested
    }

    result.push({
      id: serialNum,
      satelliteId: satId,
      collegeName: item.collegeName || 'Soumodip_GGS',
      location: item.location || 'Kasba Peth',
      weatherCondition: item.weatherCondition || 'Clear Sky',
      aqi: typeof item.aqi === 'number' && !isNaN(item.aqi) ? item.aqi : 35,
      temperature: typeof item.temperature === 'number' && !isNaN(item.temperature) ? item.temperature : 26.8,
      humidity: typeof item.humidity === 'number' && !isNaN(item.humidity) ? item.humidity : 78,
      windSpeed: typeof item.windSpeed === 'number' && !isNaN(item.windSpeed) ? item.windSpeed : 12,
      principalName: item.principalName || 'Archana Dharu',
      lat: lat,
      lng: lng,
      googleMapsUrl: item.googleMapsUrl || (satId === 'CanSat-01' ? 'https://maps.app.goo.gl/xva3yjiyCSVs7F9Q7' : `https://www.google.com/maps?q=${lat},${lng}`),
      status: item.status || 'Active Node',
      batteryLevel: typeof item.batteryLevel === 'number' ? item.batteryLevel : 95,
      rssi: typeof item.rssi === 'number' ? item.rssi : -65,
      orbitAltitude: typeof item.orbitAltitude === 'number' ? item.orbitAltitude : 500,
      isLiveStream: item.isLiveStream !== false,
      lastPing: item.lastPing || 'Live Feed Active',
      url: foundUrl,
      childWebsiteUrl: foundUrl,
      appsScriptUrl: item.appsScriptUrl || 'https://script.google.com/macros/s/AKfycbwgx-6gvYORbZyNhPUIP0OfNFVJQlLHpprho2UKudWzYT8mt5_1HlBctcF9lHtbFHGh/exec',
      studentName: item.studentName || '',
      studentPhoto: item.studentPhoto || '',
      campusPhoto: item.campusPhoto || '',
      principalPhoto: item.principalPhoto || '',
      teacherPhoto: item.teacherPhoto || '',
      isCustom: true
    });
  });

  return result;
};

// Simulate live telemetry pings
const tickLiveTelemetry = (satellites: SatelliteNode[]): SatelliteNode[] => {
  if (!Array.isArray(satellites) || satellites.length === 0) return satellites;
  const weatherTypes = ['Partly Cloudy', 'Light Rain', 'Overcast', 'Passing Showers', 'Moderate Rain', 'Light Drizzle', 'Clear Sky'];
  const currentTime = new Date().toLocaleTimeString();
  const updated = [...satellites];
  const countToUpdate = Math.min(50, Math.max(10, Math.floor(updated.length * 0.05)));

  for (let i = 0; i < countToUpdate; i++) {
    const randIdx = Math.floor(Math.random() * updated.length);
    const node = updated[randIdx];
    if (!node) continue;

    const tempDelta = Number(((Math.random() - 0.5) * 0.4).toFixed(1));
    const newTemp = Number(Math.max(16, Math.min(45, node.temperature + tempDelta)).toFixed(1));

    const aqiDelta = Math.floor((Math.random() - 0.5) * 4);
    const newAqi = Math.max(10, Math.min(200, node.aqi + aqiDelta));

    const windDelta = Math.floor((Math.random() - 0.5) * 2);
    const newWind = Math.max(5, Math.min(50, node.windSpeed + windDelta));

    const humidityDelta = Math.floor((Math.random() - 0.5) * 2);
    const newHumidity = Math.max(30, Math.min(98, (node.humidity ?? 75) + humidityDelta));

    const rssiDelta = Math.floor((Math.random() - 0.5) * 2);
    const newRssi = Math.max(-98, Math.min(-45, (node.rssi || -72) + rssiDelta));

    const newWeather = Math.random() > 0.85 ? weatherTypes[Math.floor(Math.random() * weatherTypes.length)] : node.weatherCondition;

    updated[randIdx] = {
      ...node,
      temperature: newTemp,
      humidity: newHumidity,
      aqi: newAqi,
      windSpeed: newWind,
      rssi: newRssi,
      weatherCondition: newWeather,
      isLiveStream: true,
      lastPing: `Live Ping @ ${currentTime}`
    };
  }

  return updated;
};

// Export CSV
const exportSatellitesCSV = (satellites: SatelliteNode[]) => {
  if (!Array.isArray(satellites) || satellites.length === 0) return;
  const headers = [
    'Satellite ID',
    'Student Name',
    'School / College Name',
    'Teacher Name',
    'Principal Name',
    'Apps Script Backup URL',
    'Status',
    'Location',
    'Weather Condition',
    'AQI',
    'Temperature (°C)',
    'Wind Speed (km/h)',
    'Latitude',
    'Longitude'
  ];
  const rows = satellites.map(s => [
    `"${(s.satelliteId || '').replace(/"/g, '""')}"`,
    `"${(s.studentName || '').replace(/"/g, '""')}"`,
    `"${(s.collegeName || '').replace(/"/g, '""')}"`,
    `"${(s.teacherName || '').replace(/"/g, '""')}"`,
    `"${(s.principalName || '').replace(/"/g, '""')}"`,
    `"${(s.appsScriptUrl || '').replace(/"/g, '""')}"`,
    `"${(s.status || 'Active Node').replace(/"/g, '""')}"`,
    `"${(s.location || '').replace(/"/g, '""')}"`,
    `"${(s.weatherCondition || '').replace(/"/g, '""')}"`,
    s.aqi || 0,
    `"${s.temperature || 0} °C"`,
    `"${s.windSpeed || 0} km/h"`,
    s.lat,
    s.lng
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Antriksha_ISRO_Registered_Satellites_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const STORAGE_KEY_THEME_MODE = 'isro_kaksha_theme_mode';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [satellites, setSatellites] = useState<SatelliteNode[]>(() => getInitialSatellites());
  const [onlyRegistered, setOnlyRegistered] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY_THEME_MODE) as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [isLiveStream, setIsLiveStream] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LIVE_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const [inspectSat, setInspectSat] = useState<SatelliteNode | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // Dedicated Child Site Route URL Parsing (/site/:id or ?site=:id)
  const [childSiteRouteId, setChildSiteRouteId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/site/')) {
        const idFromPath = decodeURIComponent(path.replace('/site/', '').trim());
        if (idFromPath) return idFromPath;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('site')) {
        return params.get('site');
      }
    }
    return null;
  });

  // Secret Admin shortcut: Pressing Ctrl + Space 2 times within 1200ms anywhere on the site opens the admin panel asking for the pass
  useEffect(() => {
    let lastCtrlSpaceTime = 0;

    const handleSecretKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl (or Meta on Mac) + Space is pressed
      if ((e.ctrlKey || e.metaKey) && (e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) {
        // Prevent default spacebar page scrolling
        e.preventDefault();

        const now = Date.now();
        if (now - lastCtrlSpaceTime < 1200) {
          // Double press detected!
          lastCtrlSpaceTime = 0;
          setIsAdminLoggedIn(false); // Always prompt for password as requested
          setAdminModalOpen(true);
        } else {
          lastCtrlSpaceTime = now;
        }
      }
    };

    window.addEventListener('keydown', handleSecretKeyDown);
    return () => window.removeEventListener('keydown', handleSecretKeyDown);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/site/')) {
        const idFromPath = decodeURIComponent(path.replace('/site/', '').trim());
        setChildSiteRouteId(idFromPath || null);
      } else {
        const params = new URLSearchParams(window.location.search);
        setChildSiteRouteId(params.get('site'));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateToChildSite = useCallback((satId: string) => {
    try {
      window.history.pushState({}, '', `/site/${encodeURIComponent(satId)}`);
    } catch (e) {
      console.warn('pushState error:', e);
    }
    setChildSiteRouteId(satId);
    setInspectSat(null);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME_MODE, theme);
    } catch (e) {
      console.warn(e);
    }
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Filtered Satellites for display across views
  const registeredNodes = satellites.filter(s => !!s.url || !!s.isCustom);
  const displayedSatellites = onlyRegistered ? registeredNodes : satellites;

  const toggleOnlyRegistered = useCallback(() => {
    setOnlyRegistered(prev => !prev);
  }, []);

  // Sync custom nodes from localStorage to Supabase and backend on first boot
  const syncLocalCustomNodesToServer = useCallback(async (currentServerSatellites: SatelliteNode[]) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_NODES);
      if (!saved) return;
      const customList = JSON.parse(saved);
      if (!Array.isArray(customList) || customList.length === 0) return;

      const nodesToUpload = customList.filter(c => 
        !isExampleSatellite(c.satelliteNumber || c.satelliteId, c.id) &&
        (!!c.url || !!c.appsScriptUrl) && !currentServerSatellites.some(s => 
          (s.satelliteId && (s.satelliteId === c.satelliteNumber || s.satelliteId === c.satelliteId)) ||
          (s.url && c.url && s.url.toLowerCase() === c.url.toLowerCase()) || 
          (s.collegeName && c.collegeName && s.collegeName.toLowerCase() === c.collegeName.toLowerCase())
        )
      ).map((c, idx) => ({
        id: Number(c.id) || (Date.now() + idx),
        satelliteId: c.satelliteNumber || c.satelliteId || `Satellite_Custom_${idx + 1}`,
        collegeName: c.collegeName || 'Academic Ground Station',
        studentName: c.studentName || undefined,
        teacherName: c.teacherName || undefined,
        principalName: c.principalName || 'Director / Principal',
        location: c.location || 'Pune, Maharashtra',
        weatherCondition: 'Clear Sky',
        aqi: c.aqi || 35,
        temperature: Number(c.campusTemp ?? c.temperature) || 26.5,
        humidity: Number(c.humidity) || 55,
        windSpeed: Number(c.windSpeed) || 12,
        lat: typeof c.lat === 'number' && !isNaN(c.lat) ? c.lat : 18.5204 + (Math.random() - 0.5) * 0.05,
        lng: typeof c.lng === 'number' && !isNaN(c.lng) ? c.lng : 73.8567 + (Math.random() - 0.5) * 0.05,
        googleMapsUrl: c.googleMapsUrl || (typeof c.lat === 'number' && typeof c.lng === 'number' ? `https://www.google.com/maps?q=${c.lat},${c.lng}` : undefined),
        status: 'Optimal Sensor',
        batteryLevel: 98,
        rssi: -65,
        orbitAltitude: 500,
        isLiveStream: false,
        lastPing: 'Synced from Local Device',
        url: c.url || c.childWebsiteUrl || '',
        childWebsiteUrl: c.childWebsiteUrl || c.url || '',
        appsScriptUrl: c.appsScriptUrl || undefined,
        isCustom: true
      }));

      if (nodesToUpload.length > 0) {
        // 1. Sync to Supabase cloud database directly
        for (const node of nodesToUpload) {
          syncSatelliteToSupabase(node).catch(() => {});
        }

        // 2. Also try batch endpoint if backend is present
        try {
          await fetch('/api/satellites/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ satellites: nodesToUpload })
          });
        } catch {}
      }
    } catch (err) {
      console.warn('Initial custom nodes upload to server:', err);
    }
  }, []);

  // Fetch all satellites from Supabase & central backend + Real-Time Sync across all student laptops
  useEffect(() => {
    let isMounted = true;

    const fetchAllSatellites = async () => {
      let remoteSats: SatelliteNode[] = [];

      // 1. Primary: Fetch directly from Supabase Cloud Database (works on static Apache pa.indoscience.in!)
      try {
        const supaData = await fetchSatellitesFromSupabase();
        if (Array.isArray(supaData) && supaData.length > 0) {
          remoteSats = supaData.filter(s => !isExampleSatellite(s.satelliteId, s.id));
        }
      } catch (e) {
        console.warn('Supabase fetch failed:', e);
      }

      // 2. Secondary: If Express server is running locally, also attempt /api/satellites
      try {
        const res = await fetch('/api/satellites');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.satellites)) {
            const apiSats = data.satellites.filter((s: SatelliteNode) => !isExampleSatellite(s.satelliteId, s.id));
            // Merge unique
            apiSats.forEach((a: SatelliteNode) => {
              if (!remoteSats.some(r => r.satelliteId === a.satelliteId)) {
                remoteSats.push(a);
              }
            });
          }
        }
      } catch {}

      if (remoteSats.length > 0 && isMounted) {
        setSatellites(prev => {
          // Merge while keeping local state freshness
          const combined = [...remoteSats];
          prev.forEach(p => {
            if (!combined.some(c => c.satelliteId === p.satelliteId)) {
              combined.push(p);
            }
          });
          return combined;
        });
        syncLocalCustomNodesToServer(remoteSats);
      }
    };

    fetchAllSatellites();

    // Setup Supabase Real-Time subscription (instant multi-laptop broadcast!)
    const unsubscribeSupabase = subscribeToSupabaseSatellites(
      (newSat) => {
        if (!newSat || isExampleSatellite(newSat.satelliteId, newSat.id)) return;
        setSatellites(prev => {
          const exists = prev.some(s => s.satelliteId === newSat.satelliteId);
          if (exists) {
            return prev.map(s => s.satelliteId === newSat.satelliteId ? { ...s, ...newSat } : s);
          }
          return [newSat, ...prev];
        });
      },
      (updatedSat) => {
        if (!updatedSat || isExampleSatellite(updatedSat.satelliteId, updatedSat.id)) return;
        setSatellites(prev => prev.map(s => s.satelliteId === updatedSat.satelliteId ? { ...s, ...updatedSat } : s));
      },
      (deletedSatId) => {
        if (!deletedSatId) return;
        setSatellites(prev => prev.filter(s => s.satelliteId !== deletedSatId));
      }
    );

    // Setup Real-Time Server-Sent Events (SSE) stream if local Node server is present
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'satellite_added' && msg.data) {
            if (isExampleSatellite(msg.data.satelliteId, msg.data.id)) return;
            setSatellites(prev => {
              const exists = prev.some(s => s.satelliteId === msg.data.satelliteId);
              if (exists) {
                return prev.map(s => s.satelliteId === msg.data.satelliteId ? { ...s, ...msg.data } : s);
              }
              return [msg.data, ...prev];
            });
          } else if (msg.type === 'satellite_updated' && msg.data) {
            if (isExampleSatellite(msg.data.satelliteId, msg.data.id)) return;
            setSatellites(prev => prev.map(s => s.satelliteId === msg.data.satelliteId ? { ...s, ...msg.data } : s));
          } else if (msg.type === 'satellite_deleted' && msg.data) {
            setSatellites(prev => prev.filter(s => s.satelliteId !== msg.data.satelliteId));
          } else if (msg.type === 'satellites_sync' && Array.isArray(msg.data)) {
            setSatellites(msg.data.filter((s: SatelliteNode) => !isExampleSatellite(s.satelliteId, s.id)));
          }
        } catch (e) {
          console.warn('Error parsing SSE event:', e);
        }
      };
    } catch {}

    // Polling fallback every 10 seconds for rock-solid sync across all student laptops
    const pollInterval = setInterval(() => {
      fetchAllSatellites();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      unsubscribeSupabase();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [syncLocalCustomNodesToServer]);

  // Client-Side Telemetry Polling Engine ("Bot") for registered satellites with Google Apps Script
  useEffect(() => {
    const pollActiveSatellitesTelemetry = async () => {
      // Find satellites that have an active Apps Script URL
      const candidateSats = satellites.filter(s => s.appsScriptUrl && s.appsScriptUrl.startsWith('http'));
      if (candidateSats.length === 0) return;

      // Pick candidate satellites to poll
      for (const sat of candidateSats) {
        try {
          const telemetry = await fetchTelemetryFromAppsScript(sat.appsScriptUrl!);
          if (telemetry && (telemetry.temperature !== undefined || telemetry.humidity !== undefined || telemetry.pressure !== undefined)) {
            const updatedNode: SatelliteNode = {
              ...sat,
              temperature: telemetry.temperature !== undefined ? telemetry.temperature : sat.temperature,
              humidity: telemetry.humidity !== undefined ? telemetry.humidity : sat.humidity,
              pressure: telemetry.pressure !== undefined ? telemetry.pressure : sat.pressure,
              aqi: telemetry.aqi !== undefined ? telemetry.aqi : sat.aqi,
              orbitAltitude: telemetry.altitude !== undefined ? Math.round(telemetry.altitude) : sat.orbitAltitude,
              batteryLevel: telemetry.batteryPercent !== undefined ? telemetry.batteryPercent : sat.batteryLevel,
              rssi: telemetry.rssi !== undefined ? telemetry.rssi : sat.rssi,
              status: `Live Feed Active (${telemetry.temperature ?? sat.temperature}°C, ${telemetry.pressure ?? sat.pressure} hPa)`,
              lastPing: `Live Ping @ ${new Date().toLocaleTimeString()} (Apps Script Direct Sync)`
            };

            setSatellites(prev => prev.map(s => s.satelliteId === sat.satelliteId ? updatedNode : s));
            syncSatelliteToSupabase(updatedNode).catch(() => {});
          }
        } catch (e) {
          // Graceful skip
        }
      }
    };

    // Run telemetry poller every 12 seconds
    const telemetryTimer = setInterval(pollActiveSatellitesTelemetry, 12000);
    return () => clearInterval(telemetryTimer);
  }, [satellites]);

  // Fetch Master Apps Script / Registered Child Websites Data on Mount (if configured)
  useEffect(() => {
    if (!MASTER_APPS_SCRIPT_URL) return;

    const fetchMasterData = async () => {
      try {
        const response = await fetch(MASTER_APPS_SCRIPT_URL);
        if (response.ok) {
          const remoteData = await response.json();
          if (Array.isArray(remoteData) && remoteData.length > 0) {
            const masterList = sanitizeSatellites(remoteData);
            setSatellites(prev => {
              const combined = [...masterList];
              prev.forEach(p => {
                if (!combined.some(c => c.satelliteId === p.satelliteId || (c.url && c.url === p.url))) {
                  combined.push(p);
                }
              });
              return combined;
            });
          }
        }
      } catch (err) {
        console.warn('Network fetch from Apps Script failed or offline:', err);
      }
    };

    fetchMasterData();
  }, []);

  // Sync to LocalStorage as client-side cache
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_SATELLITES, JSON.stringify(satellites));
      } catch (e) {
        console.warn('LocalStorage quota exceeded:', e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [satellites]);

  // Handle Live Stream Toggle & Interval
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LIVE_MODE, String(isLiveStream));
    } catch (e) {
      console.error(e);
    }

    if (!isLiveStream) return;
    const interval = setInterval(() => {
      setSatellites(prev => tickLiveTelemetry(prev));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveStream]);

  const toggleLiveStream = useCallback(() => {
    setIsLiveStream(prev => !prev);
  }, []);

  // Publish / Register New Satellite - Commits to Supabase cloud DB & updates all connected devices
  const handleAddSatellite = useCallback(async (newSat: SatelliteNode) => {
    // 1. Optimistic local React state update
    setSatellites(prev => {
      const exists = prev.some(s => s.satelliteId === newSat.satelliteId || (s.url && s.url === newSat.url));
      if (exists) {
        return prev.map(s => s.satelliteId === newSat.satelliteId ? newSat : s);
      }
      return [newSat, ...prev];
    });

    // 2. Persist to localStorage backup
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_NODES);
      const list = saved ? JSON.parse(saved) : [];
      list.push({
        collegeName: newSat.collegeName,
        studentName: newSat.studentName,
        teacherName: newSat.teacherName,
        principalName: newSat.principalName,
        appsScriptUrl: newSat.appsScriptUrl,
        url: newSat.url,
        satelliteNumber: newSat.satelliteId,
        campusTemp: newSat.temperature,
        windSpeed: newSat.windSpeed,
        location: newSat.location,
        aqi: newSat.aqi,
        lat: newSat.lat,
        lng: newSat.lng,
        googleMapsUrl: newSat.googleMapsUrl
      });
      localStorage.setItem(STORAGE_KEY_CUSTOM_NODES, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }

    // 3. Persist DIRECTLY to Supabase Cloud Database (makes it instantly available across all students' laptops!)
    try {
      await syncSatelliteToSupabase(newSat);
    } catch (err) {
      console.error('Failed to sync new satellite to Supabase:', err);
    }

    // 4. Central Server API Call (for local Express server if running)
    try {
      await fetch('/api/satellites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSat)
      });
    } catch (err) {
      // non-blocking
    }
  }, []);

  const handleUpdateSatellite = useCallback(async (updatedSat: SatelliteNode) => {
    setSatellites(prev => prev.map(s => s.satelliteId === updatedSat.satelliteId ? updatedSat : s));
    
    // Persist to Supabase cloud database
    try {
      await syncSatelliteToSupabase(updatedSat);
    } catch (err) {
      console.error('Failed to update satellite in Supabase:', err);
    }

    try {
      await fetch(`/api/satellites/${encodeURIComponent(updatedSat.satelliteId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSat)
      });
    } catch (err) {
      // non-blocking
    }
  }, []);

  const handleDeleteSatellite = useCallback(async (satelliteId: string) => {
    setSatellites(prev => prev.filter(s => s.satelliteId !== satelliteId));
    
    // Delete from Supabase cloud database
    try {
      await deleteSatelliteFromSupabase(satelliteId);
    } catch (err) {
      console.error('Failed to delete satellite from Supabase:', err);
    }

    try {
      await fetch(`/api/satellites/${encodeURIComponent(satelliteId)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      // non-blocking
    }
  }, []);

  const activeChildSatellite = childSiteRouteId
    ? satellites.find(
        s =>
          s.satelliteId.toLowerCase() === childSiteRouteId.toLowerCase() ||
          String(s.id) === childSiteRouteId ||
          (childSiteRouteId.replace(/[^0-9]/g, '') !== '' && s.satelliteId.replace(/[^0-9]/g, '') === childSiteRouteId.replace(/[^0-9]/g, '')) ||
          (s.studentName && s.studentName.toLowerCase().includes(childSiteRouteId.toLowerCase())) ||
          (s.collegeName && s.collegeName.toLowerCase().includes(childSiteRouteId.toLowerCase()))
      ) || {
        id: 999,
        satelliteId: childSiteRouteId,
        collegeName: `${childSiteRouteId} Academic Station`,
        location: 'Pune Ground Node, India',
        weatherCondition: 'Clear Sky',
        aqi: 32,
        temperature: 26.5,
        humidity: 78,
        windSpeed: 11,
        principalName: 'Lab In-Charge',
        lat: 18.5204,
        lng: 73.8567,
        status: 'Active Node'
      }
    : null;

  if (childSiteRouteId && activeChildSatellite) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 max-w-full overflow-x-hidden ${theme === 'light' ? 'light bg-slate-100 text-slate-900' : 'bg-[#050814] text-slate-100'} selection:bg-[#FF9933] selection:text-[#050814]`}>
        <ChildSiteView
          satellite={activeChildSatellite}
          onBackToMaster={() => {
            window.history.pushState({}, '', '/');
            setChildSiteRouteId(null);
            setActiveTab('dashboard');
          }}
          theme={theme}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          allSatellites={satellites}
          onSelectSatellite={(s) => {
            window.history.pushState({}, '', `/site/${encodeURIComponent(s.satelliteId)}`);
            setChildSiteRouteId(s.satelliteId);
          }}
        />
        {adminModalOpen && (
          <AdminModal
            onClose={() => setAdminModalOpen(false)}
            satellites={satellites}
            onAddSatellite={handleAddSatellite}
            onUpdateSatellite={handleUpdateSatellite}
            onDeleteSatellite={handleDeleteSatellite}
            isLiveStream={isLiveStream}
            toggleLiveStream={toggleLiveStream}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
            exportToCSV={exportSatellitesCSV}
            theme={theme}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 max-w-full overflow-x-hidden ${theme === 'light' ? 'light bg-slate-100 text-slate-900' : 'bg-[#050814] text-slate-100'} selection:bg-[#FF9933] selection:text-[#050814]`}>
      {/* Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveStream={isLiveStream}
        toggleLiveStream={toggleLiveStream}
        totalSatellites={satellites.length}
        openAdminModal={() => setAdminModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onlyRegistered={onlyRegistered}
        toggleOnlyRegistered={toggleOnlyRegistered}
        registeredCount={registeredNodes.length}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            satellites={satellites}
            isLiveStream={isLiveStream}
            toggleLiveStream={toggleLiveStream}
            setActiveTab={setActiveTab}
            onSelectSatellite={setInspectSat}
            onlyRegistered={onlyRegistered}
            toggleOnlyRegistered={toggleOnlyRegistered}
            registeredCount={registeredNodes.length}
            totalCountAll={satellites.length}
            theme={theme}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerView
            satellites={satellites}
            onSelectSatellite={setInspectSat}
            onNavigateToChildSite={handleNavigateToChildSite}
            isLiveStream={isLiveStream}
            onlyRegistered={onlyRegistered}
            toggleOnlyRegistered={toggleOnlyRegistered}
            registeredCount={registeredNodes.length}
            totalCountAll={satellites.length}
            theme={theme}
          />
        )}

        {activeTab === 'map' && (
          <RadarMapView
            satellites={satellites}
            onSelectSatellite={setInspectSat}
            onNavigateToChildSite={handleNavigateToChildSite}
            isLiveStream={isLiveStream}
            theme={theme}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#030612] dark:bg-[#030612] border-t border-[#FF9933]/20 py-6 px-4 text-center text-xs text-slate-400 font-rajdhani">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://indoscience.org"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Indo Science Education Trust Official Website (indoscience.org)"
              className="bg-white p-1 rounded-xl border border-slate-300 shadow hover:scale-105 transition-transform flex items-center justify-center"
            >
              <IndoScienceLogo size="sm" showSubtext={true} />
            </a>
            <a
              href="https://indo-science.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit SPARK India Program Portal (indo-science.vercel.app)"
              className="bg-white p-1 rounded-xl border border-slate-300 shadow hover:scale-105 transition-transform flex items-center justify-center"
            >
              <SparkLogo size="sm" showSubtitle={false} />
            </a>
            <a
              href="https://www.isro.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit ISRO Official Website (isro.gov.in)"
              className="bg-white p-1 rounded-xl border border-slate-300 shadow hover:scale-105 transition-transform flex items-center justify-center"
            >
              <IsroLogo size="sm" variant="full" />
            </a>
            <div className="text-left">
              <span className="font-orbitron font-bold text-white text-sm block">PROJECT ANTRIKSHA</span>
              <span className="text-[11px] text-slate-400">Indo Science Education Trust • SPARK India Program • ISRO Satellite Network</span>
            </div>
          </div>
          <p className="text-slate-400 text-[11px]">
            © 2026 Indo Science Education Trust & Indian Space Research Organisation (ISRO)
          </p>
        </div>
      </footer>

      {/* Inspection Modal */}
      {inspectSat && (
        <SatelliteDetailModal
          satellite={inspectSat}
          onClose={() => setInspectSat(null)}
          onNavigateToChildSite={handleNavigateToChildSite}
          theme={theme}
        />
      )}

      {/* Admin Panel Modal */}
      {adminModalOpen && (
        <AdminModal
          onClose={() => setAdminModalOpen(false)}
          satellites={satellites}
          onAddSatellite={handleAddSatellite}
          onUpdateSatellite={handleUpdateSatellite}
          onDeleteSatellite={handleDeleteSatellite}
          isLiveStream={isLiveStream}
          toggleLiveStream={toggleLiveStream}
          isAdminLoggedIn={isAdminLoggedIn}
          setIsAdminLoggedIn={setIsAdminLoggedIn}
          exportToCSV={exportSatellitesCSV}
          theme={theme}
        />
      )}
    </div>
  );
}
