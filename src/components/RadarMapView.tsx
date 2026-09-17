import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SatelliteNode } from '../types';
import { 
  Radio, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Globe, 
  ExternalLink, 
  Maximize2, 
  Search, 
  Crosshair, 
  Compass, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import L from 'leaflet';
import { isValidChildUrl, formatExternalUrl } from '../utils/urlHelper';

interface RadarMapViewProps {
  satellites: SatelliteNode[];
  onSelectSatellite: (sat: SatelliteNode) => void;
  onNavigateToChildSite?: (satelliteId: string) => void;
  isLiveStream: boolean;
  theme?: 'dark' | 'light';
}

export const RadarMapView: React.FC<RadarMapViewProps> = ({
  satellites,
  onSelectSatellite,
  onNavigateToChildSite,
  isLiveStream,
  theme = 'dark'
}) => {
  const [selectedSat, setSelectedSat] = useState<SatelliteNode | null>(satellites[0] || null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newlyAddedSat, setNewlyAddedSat] = useState<SatelliteNode | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const circleGroupRef = useRef<L.LayerGroup | null>(null);
  const markersMapRef = useRef<Record<string, { marker: L.Marker; coords: [number, number] }>>({});
  const prevSatellitesCountRef = useRef<number>(satellites.length);

  // Normalize and validate coordinates (prevent [0, 0] or NaN from dropping into Atlantic Ocean)
  const getCoordinates = (sat: SatelliteNode, index: number): [number, number] => {
    let lat = Number(sat.lat);
    let lng = Number(sat.lng);

    const isInvalid = 
      isNaN(lat) || isNaN(lng) || 
      (lat === 0 && lng === 0) || 
      lat < -90 || lat > 90 || 
      lng < -180 || lng > 180;

    if (isInvalid) {
      if (sat.satelliteId === 'CanSat-01' || sat.collegeName === 'Soumodip_GGS') {
        lat = 18.519585;
        lng = 73.859096;
      } else {
        // Offset around primary ground station cluster (Pune HQ)
        const angle = (index * 2 * Math.PI) / Math.max(satellites.length, 6);
        const radius = 0.035 * (1 + (index % 4) * 0.35);
        lat = 18.5204 + Math.sin(angle) * radius;
        lng = 73.8567 + Math.cos(angle) * radius;
      }
    }
    return [lat, lng];
  };

  // Filtered list based on search
  const filteredSatellites = useMemo(() => {
    if (!searchQuery.trim()) return satellites;
    const q = searchQuery.toLowerCase().trim();
    return satellites.filter(s => 
      (s.satelliteId && s.satelliteId.toLowerCase().includes(q)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(q)) ||
      (s.location && s.location.toLowerCase().includes(q)) ||
      (s.studentName && s.studentName.toLowerCase().includes(q)) ||
      (s.teacherName && s.teacherName.toLowerCase().includes(q)) ||
      (s.principalName && s.principalName.toLowerCase().includes(q))
    );
  }, [satellites, searchQuery]);

  // Fit map bounds to show all markers
  const fitAllMarkers = () => {
    const map = mapInstanceRef.current;
    if (!map || satellites.length === 0) return;

    const coordsList: [number, number][] = satellites.map((s, idx) => getCoordinates(s, idx));
    try {
      if (coordsList.length === 1) {
        map.setView(coordsList[0], 13);
      } else {
        const bounds = L.latLngBounds(coordsList);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    } catch (e) {
      console.warn('fitBounds error', e);
    }
  };

  // Fly to specific satellite
  const flyToSatellite = (sat: SatelliteNode) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setSelectedSat(sat);
    const entry = markersMapRef.current[sat.satelliteId];
    if (entry) {
      map.flyTo(entry.coords, 14, { duration: 1.2 });
      setTimeout(() => {
        entry.marker.openPopup();
      }, 700);
    } else {
      const coords = getCoordinates(sat, 0);
      map.flyTo(coords, 14, { duration: 1.2 });
    }
  };

  // 1. Initialize Map Instance once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const tileUrl = theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [18.519585, 73.859096],
        zoom: 13,
        scrollWheelZoom: true,
        attributionControl: false
      });

      const tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
      tileLayerRef.current = tileLayer;

      markersGroupRef.current = L.layerGroup().addTo(map);
      circleGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    } else if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    }

    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 150);
    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 400);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });

    const handleMapContainerClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement)?.closest('[data-child-site-id]') as HTMLElement;
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const satId = btn.getAttribute('data-child-site-id');
        if (satId) {
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
        }
      }
    };

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
      mapContainerRef.current.addEventListener('click', handleMapContainerClick);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      if (mapContainerRef.current) {
        mapContainerRef.current.removeEventListener('click', handleMapContainerClick);
      }
    };
  }, [theme]);

  // 2. Render all satellite markers whenever satellites list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Check if new satellite was appended
    if (satellites.length > prevSatellitesCountRef.current && prevSatellitesCountRef.current > 0) {
      const newlyAdded = satellites[0]; // newly registered nodes are prepended
      setNewlyAddedSat(newlyAdded);
      setTimeout(() => setNewlyAddedSat(null), 8000);
    }
    prevSatellitesCountRef.current = satellites.length;

    // Clear previous markers
    markersGroup.clearLayers();
    markersMapRef.current = {};

    const allCoords: [number, number][] = [];

    satellites.forEach((sat, index) => {
      const coords = getCoordinates(sat, index);
      allCoords.push(coords);

      const isLiveFeed = sat.isLiveStream || (sat.status && sat.status.toLowerCase().includes('live'));
      const markerColor = isLiveFeed ? '#00E5FF' : '#00E676'; // Cyan for live CanSat, Emerald for active station

      const customIcon = L.divIcon({
        className: 'custom-leaflet-radar-marker',
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background-color: ${markerColor}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="
              position: relative;
              background-color: ${markerColor};
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2px solid ${theme === 'light' ? '#ffffff' : '#050814'};
              box-shadow: 0 0 16px ${markerColor};
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background-color: #ffffff;
              "></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(markersGroup);

      const hasRegisteredSite = isValidChildUrl(sat.url || sat.childWebsiteUrl);
      const childSiteHref = hasRegisteredSite 
        ? formatExternalUrl(sat.url || sat.childWebsiteUrl)
        : `/site/${encodeURIComponent(sat.satelliteId)}`;

      const popupHtml = `
        <div style="padding: 8px 6px; font-family: system-ui, sans-serif; min-width: 210px; color: ${theme === 'light' ? '#0f172a' : '#ffffff'};">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 800; color: #FF9933; font-size: 14px; letter-spacing: 0.5px;">${sat.satelliteId}</span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(0,229,255,0.15); color: #00E5FF; font-weight: bold;">
              ${sat.weatherCondition || 'Active Live'}
            </span>
          </div>
          <h4 style="margin: 2px 0 4px 0; font-size: 13px; font-weight: 700; line-height: 1.2; color: ${theme === 'light' ? '#0f172a' : '#ffffff'};">
            ${sat.collegeName}
          </h4>
          <p style="margin: 2px 0; font-size: 11px; color: ${theme === 'light' ? '#475569' : '#94a3b8'};">
            📍 ${sat.location} • Principal: ${sat.principalName || 'Lab In-Charge'}
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 8px 0; font-size: 11px;">
            <div style="padding: 4px 6px; background: ${theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.08)'}; border-radius: 6px;">
              <span style="opacity: 0.7; display: block; font-size: 9px; text-transform: uppercase;">TEMP</span>
              <strong style="color: #059669;">${sat.temperature}°C</strong>
            </div>
            <div style="padding: 4px 6px; background: ${theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.08)'}; border-radius: 6px;">
              <span style="opacity: 0.7; display: block; font-size: 9px; text-transform: uppercase;">AQI</span>
              <strong style="color: #0284c7;">${sat.aqi} AQI</strong>
            </div>
          </div>
          <div style="margin: 6px 0; padding-top: 4px; border-top: 1px solid ${theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.1)'}; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 10px; opacity: 0.7;">📍 ${coords[0].toFixed(4)}°, ${coords[1].toFixed(4)}°</span>
            <a href="${formatExternalUrl(sat.googleMapsUrl || `https://www.google.com/maps?q=${coords[0]},${coords[1]}`)}" target="_blank" rel="noopener noreferrer" style="font-size: 10px; color: #00E5FF; text-decoration: none; font-weight: bold;">
              Maps ↗
            </a>
          </div>
          <div style="margin-top: 6px;">
            <button data-child-site-id="${sat.satelliteId}" style="display: block; width: 100%; text-align: center; font-size: 11px; padding: 6px 8px; border-radius: 6px; background: #00E5FF; color: #050814; font-weight: 700; border: none; cursor: pointer;">
              🌐 Open Child Site Portal ↗
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-leaflet-popup' });
      marker.on('click', () => {
        setSelectedSat(sat);
      });

      markersMapRef.current[sat.satelliteId] = { marker, coords };

      // Auto-open popup on selected satellite
      if (selectedSat?.satelliteId === sat.satelliteId || (!selectedSat && index === 0)) {
        setTimeout(() => {
          marker.openPopup();
        }, 200);
      }
    });

    // Auto-fit bounds or center smoothly
    if (allCoords.length > 0) {
      try {
        if (allCoords.length === 1) {
          // Exactly 1 satellite: center directly at zoom 13 to avoid 0-bound divide-by-zero
          map.setView(allCoords[0], 13);
        } else {
          const bounds = L.latLngBounds(allCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        }
      } catch (e) {
        console.warn('fitBounds error', e);
      }
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 250);
  }, [satellites, theme]);

  // 3. Render coverage circle for selected satellite without re-creating all markers
  useEffect(() => {
    const circleGroup = circleGroupRef.current;
    if (!circleGroup) return;

    circleGroup.clearLayers();

    if (selectedSat) {
      const idx = satellites.findIndex(s => s.satelliteId === selectedSat.satelliteId);
      const coords = getCoordinates(selectedSat, idx >= 0 ? idx : 0);

      L.circle(coords, {
        color: '#00E5FF',
        fillColor: '#00E5FF',
        fillOpacity: 0.15,
        weight: 1.5,
        radius: 3000
      }).addTo(circleGroup);
    }
  }, [selectedSat, satellites]);

  // Update selected sat if satellites list changes and current selection is gone
  useEffect(() => {
    if (satellites.length > 0) {
      if (!selectedSat || !satellites.some(s => s.satelliteId === selectedSat.satelliteId)) {
        setSelectedSat(satellites[0]);
      }
    } else {
      setSelectedSat(null);
    }
  }, [satellites]);

  return (
    <div className="space-y-6 pb-12">
      {/* Newly registered satellite alert banner */}
      {newlyAddedSat && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-rajdhani font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-bounce" />
            <span>
              New Satellite Node Successfully Plotted: <strong>{newlyAddedSat.satelliteId}</strong> ({newlyAddedSat.collegeName})
            </span>
          </div>
          <button
            onClick={() => flyToSatellite(newlyAddedSat)}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Locate on Map</span>
          </button>
        </div>
      )}

      {/* Top Header & Map Controls */}
      <div className="glass-panel p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="font-orbitron font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-600 dark:text-[#00E5FF] animate-pulse" />
            ISRO Antriksha Orbital Radar & Ground Station Map
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-rajdhani mt-0.5 font-semibold flex items-center gap-2">
            <span>
              Geospatial plotting of <strong className="text-amber-600 dark:text-[#FF9933]">{satellites.length} micro-satellite ground stations</strong>.
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">All Modules Active on Radar</span>
          </p>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <span className="w-3 h-3 rounded-full bg-[#00E5FF] inline-block shadow-[0_0_8px_#00E5FF]" />
            <span>Live CanSat Link</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-[#00E676] inline-block shadow-[0_0_8px_#00E676]" />
            <span>Active Ground Station</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Jump To Module, & Zoom Controls */}
      <div className="glass-panel p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search across ${satellites.length} satellite modules...`}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-rajdhani text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>

        {/* Action Buttons: Jump to satellite, Fit Bounds, Reset HQ */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          {/* Quick select dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <Compass className="w-3.5 h-3.5 text-sky-600 dark:text-[#00E5FF] shrink-0" />
            <select
              value={selectedSat?.satelliteId || ''}
              onChange={e => {
                const found = satellites.find(s => s.satelliteId === e.target.value);
                if (found) flyToSatellite(found);
              }}
              className="bg-transparent text-xs font-rajdhani font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Select Module to Focus...</option>
              {satellites.map(s => (
                <option key={s.satelliteId} value={s.satelliteId} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {s.satelliteId} - {s.collegeName.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Fit All Stations */}
          <button
            onClick={fitAllMarkers}
            title="Fit view to all satellite stations"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-rajdhani font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-all shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Fit All ({satellites.length})</span>
          </button>

          {/* Reset HQ */}
          <button
            onClick={() => {
              const map = mapInstanceRef.current;
              if (map) map.flyTo([18.5204, 73.8567], 12, { duration: 1.0 });
            }}
            title="Center on Pune ISRO Ground HQ"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-rajdhani font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-all shadow-xs"
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-500" />
            <span>Pune HQ</span>
          </button>
        </div>
      </div>

      {/* Main Map & Side Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-2 glass-panel p-2 rounded-2xl overflow-hidden h-[560px] relative border border-slate-200 dark:border-[#00E5FF]/30 shadow-md">
          <div ref={mapContainerRef} className="w-full h-full rounded-xl bg-slate-100 dark:bg-[#050814]" />

          {/* Overlay Status Badge */}
          <div className="absolute top-4 left-4 z-[400] px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-mono flex items-center gap-2 pointer-events-none shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span>RADAR ACTIVE: {satellites.length} MODULES IN FIELD</span>
          </div>
        </div>

        {/* Selected Station Side Panel */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between h-[560px] overflow-y-auto">
          {selectedSat ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 dark:border-[#00E5FF]/20 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-orbitron font-extrabold text-sm text-amber-600 dark:text-[#FF9933] block">
                    {selectedSat.satelliteId}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    {selectedSat.weatherCondition || 'Normal'}
                  </span>
                </div>

                <h3 className="font-rajdhani font-bold text-lg text-slate-900 dark:text-white mt-1 leading-tight">
                  {selectedSat.collegeName}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-[#00E5FF]" /> {selectedSat.location}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToChildSite) {
                        onNavigateToChildSite(selectedSat.satelliteId);
                      } else {
                        try {
                          window.history.pushState({}, '', `/site/${encodeURIComponent(selectedSat.satelliteId)}`);
                        } catch {}
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-[#00E676] border border-emerald-500/30 text-xs font-rajdhani font-bold transition-all cursor-pointer"
                    title={`Open academic child station portal for ${selectedSat.collegeName}`}
                  >
                    <Globe className="w-3.5 h-3.5" /> Open Child Site Portal <ExternalLink className="w-3 h-3" />
                  </button>
                  {isValidChildUrl(selectedSat.url || selectedSat.childWebsiteUrl) && (
                    <a
                      href={formatExternalUrl(selectedSat.url || selectedSat.childWebsiteUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-[#00E5FF] border border-sky-500/30 text-xs font-rajdhani font-bold transition-all"
                      title={`Visit external site: ${formatExternalUrl(selectedSat.url || selectedSat.childWebsiteUrl)}`}
                    >
                      External ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Specs & Metrics Cards */}
              <div className="space-y-2 text-xs">
                {selectedSat.studentName && (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                    <span className="text-cyan-600 dark:text-cyan-400 font-rajdhani font-bold uppercase block text-[10px]">
                      👩‍🎓 Student Builder
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedSat.studentName}</p>
                  </div>
                )}

                {selectedSat.teacherName && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 space-y-1">
                    <span className="text-indigo-600 dark:text-indigo-400 font-rajdhani font-bold uppercase block text-[10px]">
                      👨‍🏫 Science Teacher / Mentor
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedSat.teacherName}</p>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#070D22]/80 border border-slate-200 dark:border-white/5 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-rajdhani font-bold uppercase block text-[10px]">
                    Institutional Principal / Lead
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{selectedSat.principalName || 'Hardware Engineering Lead'}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-center border border-slate-200 dark:border-transparent">
                    <Thermometer className="w-4 h-4 text-emerald-600 dark:text-[#00E676] mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Temperature</span>
                    <span className="font-orbitron font-bold text-sm text-slate-900 dark:text-white">{selectedSat.temperature}°C</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-center border border-slate-200 dark:border-transparent">
                    <Droplets className="w-4 h-4 text-sky-600 dark:text-[#00E5FF] mx-auto mb-1" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Humidity</span>
                    <span className="font-orbitron font-bold text-sm text-sky-700 dark:text-[#00E5FF]">
                      {selectedSat.humidity !== undefined ? `${selectedSat.humidity}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* GPS / Landlocked Coordinates Bar */}
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span>Landlocked Coords:</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {Number(selectedSat.lat || 18.5204).toFixed(4)}°, {Number(selectedSat.lng || 73.8567).toFixed(4)}°
                    </span>
                    <a
                      href={formatExternalUrl(selectedSat.googleMapsUrl || `https://www.google.com/maps?q=${selectedSat.lat || 18.5204},${selectedSat.lng || 73.8567}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded bg-sky-500/15 text-sky-600 dark:text-[#00E5FF] hover:bg-sky-500/25 border border-sky-500/30 transition-all flex items-center justify-center"
                      title="Open station location in Google Maps"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => flyToSatellite(selectedSat)}
                  className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-rajdhani font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Crosshair className="w-4 h-4" />
                  <span>Center Map on Station</span>
                </button>

                <button
                  onClick={() => onSelectSatellite(selectedSat)}
                  className="btn-isro w-full justify-center text-xs py-3 font-bold shadow-md"
                >
                  Inspect Telemetry Metrics
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400 space-y-2">
              <Layers className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <p className="text-xs font-rajdhani font-semibold">
                Click any satellite station pin on the radar map to view telemetry details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
