import React, { useState, useEffect } from 'react';
import { SatelliteNode } from '../types';
import { 
  Rocket, 
  Shield, 
  Lock, 
  Unlock, 
  PlusCircle, 
  PenLine, 
  Trash2, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Globe, 
  Radio, 
  User, 
  Building2, 
  KeyRound, 
  Sparkles, 
  Info, 
  Search,
  Check,
  Compass,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { formatExternalUrl, parseLocationCoordinates, buildGoogleMapsUrl } from '../utils/urlHelper';

interface StudentPortalProps {
  satellites: SatelliteNode[];
  onAddSatellite: (sat: SatelliteNode) => void;
  onUpdateSatellite: (sat: SatelliteNode) => void;
  onDeleteSatellite: (satelliteId: string) => void;
  isLiveStream: boolean;
}

const STORAGE_KEY_STUDENT_OWNED = 'antriksha_my_student_cansat_ids';

export const StudentPortal: React.FC<StudentPortalProps> = ({
  satellites,
  onAddSatellite,
  onUpdateSatellite,
  onDeleteSatellite,
  isLiveStream,
}) => {
  // Active subtab inside Student Portal
  const [studentTab, setStudentTab] = useState<'mine' | 'register' | 'network'>('register');

  // List of satellite IDs owned by this student / browser
  const [ownedSatIds, setOwnedSatIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENT_OWNED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Success / notice toast message
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Sync owned IDs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STUDENT_OWNED, JSON.stringify(ownedSatIds));
    } catch (e) {
      console.warn('Failed to save owned sat IDs:', e);
    }
  }, [ownedSatIds]);

  // Set default tab to 'mine' if student already has registered satellites
  useEffect(() => {
    if (ownedSatIds.length > 0 && studentTab === 'register') {
      const hasMatchingSat = satellites.some(s => ownedSatIds.includes(s.satelliteId));
      if (hasMatchingSat) {
        setStudentTab('mine');
      }
    }
  }, []);

  // Filter satellites owned by the student
  const mySatellites = satellites.filter(s => ownedSatIds.includes(s.satelliteId));

  // Claim existing CanSat form state
  const [claimSatId, setClaimSatId] = useState('');
  const [claimPin, setClaimPin] = useState('');
  const [showClaimBox, setShowClaimBox] = useState(false);

  // Registration Form State
  const [regForm, setRegForm] = useState({
    satelliteId: `CanSat-${String(satellites.length + 1).padStart(2, '0')}`,
    collegeName: '',
    studentName: '',
    studentTeam: '',
    principalName: '',
    childUrl: '',
    appsScriptUrl: '',
    location: 'Pune, Maharashtra',
    mapLinkOrCoordInput: '',
    lat: 18.5204,
    lng: 73.8567,
    googleMapsUrl: 'https://www.google.com/maps?q=18.5204,73.8567',
    studentPin: '',
    weatherCondition: 'Clear Sky',
    aqi: 32,
    temperature: 26.5,
    windSpeed: 12,
  });

  const [regLocationMsg, setRegLocationMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state for own satellite
  const [editingSatId, setEditingSatId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SatelliteNode | null>(null);

  // Search filter for the Network directory
  const [networkSearch, setNetworkSearch] = useState('');

  // Handle Location Parsing from Google Maps URL or raw coordinates
  const handleParseRegLocation = (input: string) => {
    if (!input.trim()) {
      setRegLocationMsg(null);
      return;
    }
    const coords = parseLocationCoordinates(input);
    if (coords) {
      const mapsUrl = buildGoogleMapsUrl(coords.lat, coords.lng);
      setRegForm(prev => ({
        ...prev,
        lat: coords.lat,
        lng: coords.lng,
        googleMapsUrl: mapsUrl,
        mapLinkOrCoordInput: input
      }));
      setRegLocationMsg({
        text: `Anchored: ${coords.lat.toFixed(6)}° N, ${coords.lng.toFixed(6)}° E`,
        success: true
      });
    } else {
      setRegLocationMsg({
        text: 'Could not auto-parse coordinates. Enter Lat, Lng manually (e.g. 18.5204, 73.8567).',
        success: false
      });
    }
  };

  // Register New CanSat
  const handleRegisterCanSat = (e: React.FormEvent) => {
    e.preventDefault();

    if (!regForm.satelliteId.trim()) {
      showNotification('Please provide a CanSat ID (e.g. CanSat-04)', 'error');
      return;
    }
    if (!regForm.collegeName.trim()) {
      showNotification('Please enter your College or Institution name', 'error');
      return;
    }
    if (!regForm.studentName.trim()) {
      showNotification('Please enter the Student or Team Leader name', 'error');
      return;
    }

    const cleanSatId = regForm.satelliteId.trim();

    // Check if ID already exists and is NOT owned by this student
    const existing = satellites.find(s => s.satelliteId.toLowerCase() === cleanSatId.toLowerCase());
    if (existing && !ownedSatIds.includes(existing.satelliteId)) {
      showNotification(`CanSat ID "${cleanSatId}" is already taken by another team! Please choose a unique ID.`, 'error');
      return;
    }

    setIsSubmitting(true);

    let cleanChildUrl = regForm.childUrl.trim();
    if (cleanChildUrl && !cleanChildUrl.startsWith('http://') && !cleanChildUrl.startsWith('https://')) {
      cleanChildUrl = `https://${cleanChildUrl}`;
    }
    if (!cleanChildUrl) {
      cleanChildUrl = `/site/${encodeURIComponent(cleanSatId)}`;
    }

    let cleanAppsScript = regForm.appsScriptUrl.trim();
    if (cleanAppsScript && !cleanAppsScript.startsWith('http://') && !cleanAppsScript.startsWith('https://')) {
      cleanAppsScript = `https://${cleanAppsScript}`;
    }

    const newNode: SatelliteNode = {
      id: Date.now(),
      satelliteId: cleanSatId,
      collegeName: regForm.collegeName.trim(),
      studentName: regForm.studentName.trim(),
      studentTeam: regForm.studentTeam.trim() || undefined,
      principalName: regForm.principalName.trim() || 'Principal / Mentor',
      location: regForm.location.trim() || 'Pune, Maharashtra',
      url: cleanChildUrl,
      childWebsiteUrl: cleanChildUrl,
      appsScriptUrl: cleanAppsScript || undefined,
      weatherCondition: regForm.weatherCondition,
      aqi: Number(regForm.aqi) || 32,
      temperature: Number(regForm.temperature) || 26.5,
      windSpeed: Number(regForm.windSpeed) || 12,
      lat: regForm.lat,
      lng: regForm.lng,
      googleMapsUrl: regForm.googleMapsUrl,
      batteryLevel: 98,
      rssi: -64,
      orbitAltitude: 500,
      isLiveStream,
      lastPing: 'Registered by Student Team',
      isCustom: true,
      registeredByRole: 'student',
      studentPin: regForm.studentPin.trim() || undefined,
      sourceType: cleanAppsScript ? 'apps_script' : 'standard',
    };

    onAddSatellite(newNode);

    // Save as owned satellite
    if (!ownedSatIds.includes(cleanSatId)) {
      setOwnedSatIds(prev => [...prev, cleanSatId]);
    }

    showNotification(`🎉 Successfully registered ${cleanSatId}! You are authorized to edit and manage this node.`);
    setIsSubmitting(false);
    setStudentTab('mine');

    // Reset form for next entry
    setRegForm({
      satelliteId: `CanSat-${String(satellites.length + 2).padStart(2, '0')}`,
      collegeName: '',
      studentName: '',
      studentTeam: '',
      principalName: '',
      childUrl: '',
      appsScriptUrl: '',
      location: 'Pune, Maharashtra',
      mapLinkOrCoordInput: '',
      lat: 18.5204,
      lng: 73.8567,
      googleMapsUrl: 'https://www.google.com/maps?q=18.5204,73.8567',
      studentPin: '',
      weatherCondition: 'Clear Sky',
      aqi: 32,
      temperature: 26.5,
      windSpeed: 12,
    });
    setRegLocationMsg(null);
  };

  // Claim an existing CanSat by ID
  const handleClaimCanSat = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = claimSatId.trim();
    if (!targetId) return;

    const sat = satellites.find(s => s.satelliteId.toLowerCase() === targetId.toLowerCase());
    if (!sat) {
      showNotification(`CanSat "${targetId}" not found in network records!`, 'error');
      return;
    }

    if (sat.studentPin && sat.studentPin !== claimPin.trim()) {
      showNotification(`Incorrect Student PIN for ${targetId}. Please enter the 4-digit PIN set during registration.`, 'error');
      return;
    }

    if (!ownedSatIds.includes(sat.satelliteId)) {
      setOwnedSatIds(prev => [...prev, sat.satelliteId]);
    }
    showNotification(`Connected to ${sat.satelliteId}! You now have editing permissions for this node.`);
    setClaimSatId('');
    setClaimPin('');
    setShowClaimBox(false);
    setStudentTab('mine');
  };

  // Start Editing Own CanSat
  const handleStartEdit = (node: SatelliteNode) => {
    if (!ownedSatIds.includes(node.satelliteId)) {
      showNotification('Access Denied: You can only edit your own registered CanSat.', 'error');
      return;
    }
    setEditingSatId(node.satelliteId);
    setEditForm({ ...node });
  };

  // Save Edit of Own CanSat
  const handleSaveEdit = () => {
    if (!editForm) return;
    if (!ownedSatIds.includes(editForm.satelliteId)) {
      showNotification('Access Denied: You can only edit your own registered CanSat.', 'error');
      return;
    }

    onUpdateSatellite(editForm);
    showNotification(`Updated parameters for your CanSat ${editForm.satelliteId}`);
    setEditingSatId(null);
    setEditForm(null);
  };

  // Delete Own CanSat
  const handleDeleteMySat = (satId: string) => {
    if (!ownedSatIds.includes(satId)) {
      showNotification('Access Denied: You can only remove your own registered CanSat.', 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to decommission and remove your CanSat node "${satId}"?`)) {
      onDeleteSatellite(satId);
      setOwnedSatIds(prev => prev.filter(id => id !== satId));
      showNotification(`Decommissioned your CanSat node ${satId}`, 'info');
      if (editingSatId === satId) {
        setEditingSatId(null);
        setEditForm(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Console Security & Scope Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/40 border border-sky-400/40 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center shrink-0">
              <Rocket className="w-5 h-5 text-sky-400 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-extrabold text-base text-white tracking-wide">
                  STUDENT & COLLEGE CANSAT CONSOLE
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  STUDENT MODE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-rajdhani mt-0.5">
                Register your team&apos;s CanSat and manage <strong className="text-sky-300 underline underline-offset-2">strictly your own module</strong>. All other colleges and master nodes are protected.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setShowClaimBox(!showClaimBox)}
              className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all"
              title="Link an existing CanSat node you created previously"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span>{showClaimBox ? 'Hide Link Box' : 'Link Existing CanSat'}</span>
            </button>
          </div>
        </div>

        {/* Claim Existing CanSat Box (Expandable) */}
        {showClaimBox && (
          <form onSubmit={handleClaimCanSat} className="mt-4 pt-3 border-t border-sky-400/20 flex flex-wrap items-end gap-3 bg-black/30 p-3 rounded-lg">
            <div className="space-y-1">
              <label className="text-[11px] font-rajdhani font-bold text-slate-300">CanSat ID to Link</label>
              <input
                type="text"
                placeholder="e.g. CanSat-04"
                value={claimSatId}
                onChange={e => setClaimSatId(e.target.value)}
                className="input-isro text-xs py-1.5 px-3 w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-rajdhani font-bold text-slate-300">Team PIN (Optional)</label>
              <input
                type="password"
                placeholder="4-digit PIN"
                value={claimPin}
                onChange={e => setClaimPin(e.target.value)}
                className="input-isro text-xs py-1.5 px-3 w-28"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-rajdhani transition-all flex items-center gap-1"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Link & Claim My CanSat</span>
            </button>
          </form>
        )}
      </div>

      {/* Notifications Toast */}
      {notification && (
        <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 border animate-fadeIn ${
          notification.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
            : notification.type === 'error' 
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          {notification.type === 'info' && <Info className="w-4 h-4 shrink-0 text-sky-400" />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Student Subtabs */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStudentTab('register')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all ${
              studentTab === 'register'
                ? 'bg-gradient-to-r from-sky-400 to-cyan-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register Your CanSat</span>
          </button>

          <button
            onClick={() => setStudentTab('mine')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all ${
              studentTab === 'mine'
                ? 'bg-gradient-to-r from-sky-400 to-cyan-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Rocket className="w-4 h-4 text-sky-400" />
            <span>My CanSat Node ({mySatellites.length})</span>
          </button>

          <button
            onClick={() => setStudentTab('network')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all ${
              studentTab === 'network'
                ? 'bg-gradient-to-r from-sky-400 to-cyan-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Network Fleet (Protected Directory)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3 h-3" /> Can Edit: {mySatellites.length}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-amber-400">
            <Lock className="w-3 h-3" /> Protected: {Math.max(0, satellites.length - mySatellites.length)}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUBTAB 1: REGISTER YOUR CANSAT FORM                       */}
      {/* ========================================================= */}
      {studentTab === 'register' && (
        <form onSubmit={handleRegisterCanSat} className="space-y-5">
          <div className="p-4 rounded-xl bg-[#081028] border border-sky-400/30 space-y-4">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-orbitron font-bold text-sm text-sky-400 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Register New CanSat Station
                </h4>
                <p className="text-[11px] text-slate-400">
                  Fill in your college and team details. Once submitted, your CanSat is added to the live fleet and Cloud SQL / Supabase storage.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">
                PERMANENT CLOUD PERSISTENCE
              </span>
            </div>

            {/* Grid 1: Basic Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                  <Rocket className="w-3.5 h-3.5 text-sky-400" /> CanSat ID / Hardware Call-Sign *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CanSat-04"
                  value={regForm.satelliteId}
                  onChange={e => setRegForm({ ...regForm, satelliteId: e.target.value })}
                  className="input-isro text-xs"
                />
                <span className="text-[10px] text-slate-500">Unique identifier for your satellite</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#FF9933]" /> College / School Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCCOE Pune"
                  value={regForm.collegeName}
                  onChange={e => setRegForm({ ...regForm, collegeName: e.target.value })}
                  className="input-isro text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Student / Team Leader Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma & Team"
                  value={regForm.studentName}
                  onChange={e => setRegForm({ ...regForm, studentName: e.target.value })}
                  className="input-isro text-xs"
                />
              </div>
            </div>

            {/* Grid 2: Team, Principal & PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300">Team Name / Division</label>
                <input
                  type="text"
                  placeholder="e.g. Flight Team Alpha"
                  value={regForm.studentTeam}
                  onChange={e => setRegForm({ ...regForm, studentTeam: e.target.value })}
                  className="input-isro text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300">Principal / Lab In-Charge</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. S. K. Patil"
                  value={regForm.principalName}
                  onChange={e => setRegForm({ ...regForm, principalName: e.target.value })}
                  className="input-isro text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Team Passcode / PIN (Optional)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 1234"
                  value={regForm.studentPin}
                  onChange={e => setRegForm({ ...regForm, studentPin: e.target.value })}
                  className="input-isro text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500">Protects your CanSat so only you can claim it</span>
              </div>
            </div>

            {/* Grid 3: Child Site & Google Apps Script Hardware Feed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-sky-400" /> Dedicated Child Website URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://my-cansat.vercel.app or leave blank for internal route"
                  value={regForm.childUrl}
                  onChange={e => setRegForm({ ...regForm, childUrl: e.target.value })}
                  className="input-isro text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500">Where visitors can view your dedicated telemetry station</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" /> Google Apps Script Telemetry URL
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={regForm.appsScriptUrl}
                  onChange={e => setRegForm({ ...regForm, appsScriptUrl: e.target.value })}
                  className="input-isro text-xs font-mono"
                />
                <span className="text-[10px] text-slate-500">Live JSON feed streaming from your hardware sensors</span>
              </div>
            </div>

            {/* Grid 4: Location & GPS Coordinates */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" /> Campus Location Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Akurdi, Pune, Maharashtra"
                    value={regForm.location}
                    onChange={e => setRegForm({ ...regForm, location: e.target.value })}
                    className="input-isro text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-rajdhani font-bold text-slate-300 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#00E5FF]" /> Paste Google Maps Link OR Coordinates
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste Google Maps URL or '18.5204, 73.8567'"
                      value={regForm.mapLinkOrCoordInput}
                      onChange={e => {
                        setRegForm({ ...regForm, mapLinkOrCoordInput: e.target.value });
                        handleParseRegLocation(e.target.value);
                      }}
                      className="input-isro text-xs flex-1 font-mono"
                    />
                  </div>
                  {regLocationMsg && (
                    <p className={`text-[11px] font-mono flex items-center gap-1 ${regLocationMsg.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {regLocationMsg.success ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {regLocationMsg.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Coordinates Confirmation */}
              <div className="flex items-center gap-3 p-2 rounded bg-black/40 border border-white/5 text-xs font-mono text-slate-300">
                <span>Lat: <strong className="text-sky-300">{regForm.lat.toFixed(6)}°</strong></span>
                <span>Lng: <strong className="text-sky-300">{regForm.lng.toFixed(6)}°</strong></span>
                {regForm.googleMapsUrl && (
                  <a
                    href={formatExternalUrl(regForm.googleMapsUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-0.5 ml-auto"
                  >
                    <span>View on Map</span> <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                🛡️ You will immediately be granted full editing and removal rights for this CanSat node.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-isro text-xs py-2.5 px-6 flex items-center gap-2 font-bold"
              >
                <Rocket className="w-4 h-4 text-slate-950" />
                <span>{isSubmitting ? 'Registering...' : 'Register & Claim My CanSat'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 2: MY CANSAT NODE (EDIT & REMOVE ONLY YOURS)      */}
      {/* ========================================================= */}
      {studentTab === 'mine' && (
        <div className="space-y-4">
          {mySatellites.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#081028] border border-sky-400/20 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center mx-auto text-sky-400">
                <Rocket className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-orbitron font-bold text-base text-white">No CanSat Registered on This Device</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You haven&apos;t registered your team&apos;s CanSat station on this browser yet. Click &quot;Register Your CanSat&quot; to add yours, or click &quot;Link Existing CanSat&quot; to enter your ID.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setStudentTab('register')}
                  className="btn-isro text-xs py-2 px-4 flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Register Your CanSat Now</span>
                </button>
                <button
                  onClick={() => setShowClaimBox(true)}
                  className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-rajdhani font-bold flex items-center gap-1.5 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5 text-sky-400" />
                  <span>Link Existing Station</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-rajdhani font-bold text-slate-300">
                    Your Authorized CanSat Stations ({mySatellites.length}) — Full Edit & Decommission Rights
                  </span>
                </div>
                <button
                  onClick={() => setStudentTab('register')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-rajdhani font-bold flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Register Another CanSat</span>
                </button>
              </div>

              {mySatellites.map(sat => {
                const isEditing = editingSatId === sat.satelliteId;

                return (
                  <div
                    key={sat.satelliteId}
                    className="p-4 rounded-xl bg-[#081028] border border-sky-400/40 space-y-3 shadow-md transition-all"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400 font-bold font-mono text-xs">
                          🛰️
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-orbitron font-extrabold text-sm text-[#FF9933]">
                              {sat.satelliteId}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> YOUR CANSAT (AUTHORIZED)
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium">{sat.collegeName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {sat.url && (
                          <a
                            href={formatExternalUrl(sat.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-rajdhani font-bold flex items-center gap-1 transition-all"
                          >
                            <Globe className="w-3 h-3 text-sky-400" />
                            <span>Open Child Site</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        {!isEditing ? (
                          <button
                            onClick={() => handleStartEdit(sat)}
                            className="px-2.5 py-1 rounded bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-rajdhani font-bold flex items-center gap-1 transition-all"
                          >
                            <PenLine className="w-3 h-3" />
                            <span>Edit Only Mine</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingSatId(null);
                              setEditForm(null);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-rajdhani font-bold transition-all"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteMySat(sat.satelliteId)}
                          className="px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-rajdhani font-bold flex items-center gap-1 transition-all"
                          title="Decommission your CanSat station"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Mine</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Editor for Own CanSat */}
                    {isEditing && editForm ? (
                      <div className="p-3 rounded-lg bg-black/40 border border-sky-400/30 space-y-3">
                        <h5 className="font-orbitron font-bold text-xs text-sky-300">
                          Edit Parameters for {editForm.satelliteId}
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-rajdhani font-bold text-slate-300">College Name</label>
                            <input
                              type="text"
                              value={editForm.collegeName}
                              onChange={e => setEditForm({ ...editForm, collegeName: e.target.value })}
                              className="input-isro text-xs py-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-rajdhani font-bold text-slate-300">Student Name</label>
                            <input
                              type="text"
                              value={editForm.studentName || ''}
                              onChange={e => setEditForm({ ...editForm, studentName: e.target.value })}
                              className="input-isro text-xs py-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-rajdhani font-bold text-slate-300">Principal / Mentor</label>
                            <input
                              type="text"
                              value={editForm.principalName || ''}
                              onChange={e => setEditForm({ ...editForm, principalName: e.target.value })}
                              className="input-isro text-xs py-1"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-rajdhani font-bold text-slate-300">Child Website URL</label>
                            <input
                              type="text"
                              value={editForm.url || ''}
                              onChange={e => setEditForm({ ...editForm, url: e.target.value, childWebsiteUrl: e.target.value })}
                              className="input-isro text-xs py-1 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-rajdhani font-bold text-slate-300">Google Apps Script URL</label>
                            <input
                              type="text"
                              value={editForm.appsScriptUrl || ''}
                              onChange={e => setEditForm({ ...editForm, appsScriptUrl: e.target.value })}
                              className="input-isro text-xs py-1 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-rajdhani font-bold text-slate-300">Campus Location</label>
                            <input
                              type="text"
                              value={editForm.location || ''}
                              onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                              className="input-isro text-xs py-1"
                            />
                          </div>
                        </div>

                        {/* Coordinates */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
                          <div>
                            <label className="text-[10px] text-slate-400">Lat</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={editForm.lat}
                              onChange={e => setEditForm({ ...editForm, lat: parseFloat(e.target.value) || 0 })}
                              className="input-isro text-xs py-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Lng</label>
                            <input
                              type="number"
                              step="0.000001"
                              value={editForm.lng}
                              onChange={e => setEditForm({ ...editForm, lng: parseFloat(e.target.value) || 0 })}
                              className="input-isro text-xs py-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">Temp (°C)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={editForm.temperature}
                              onChange={e => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) || 0 })}
                              className="input-isro text-xs py-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400">AQI</label>
                            <input
                              type="number"
                              value={editForm.aqi}
                              onChange={e => setEditForm({ ...editForm, aqi: parseInt(e.target.value) || 0 })}
                              className="input-isro text-xs py-1 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSatId(null);
                              setEditForm(null);
                            }}
                            className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold font-rajdhani"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black font-rajdhani flex items-center gap-1 shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes to My CanSat</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read Details Grid */
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300">
                        <div className="p-2 rounded bg-black/20 border border-white/5">
                          <span className="text-[10px] text-slate-400 block font-rajdhani font-bold">Student Leader</span>
                          <span className="text-white truncate block">{sat.studentName || 'Not Set'}</span>
                        </div>
                        <div className="p-2 rounded bg-black/20 border border-white/5">
                          <span className="text-[10px] text-slate-400 block font-rajdhani font-bold">GPS Coordinates</span>
                          <span className="text-[#00E5FF] truncate block">{sat.lat.toFixed(4)}°, {sat.lng.toFixed(4)}°</span>
                        </div>
                        <div className="p-2 rounded bg-black/20 border border-white/5">
                          <span className="text-[10px] text-slate-400 block font-rajdhani font-bold">Hardware Feed</span>
                          <span className="text-emerald-400 truncate block">
                            {sat.appsScriptUrl ? 'Connected (Apps Script)' : 'Standard Telemetry'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-black/20 border border-white/5">
                          <span className="text-[10px] text-slate-400 block font-rajdhani font-bold">Current Temp / AQI</span>
                          <span className="text-amber-400 truncate block">{sat.temperature}°C • AQI {sat.aqi}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUBTAB 3: NETWORK DIRECTORY (STRICTLY PROTECTED)          */}
      {/* ========================================================= */}
      {studentTab === 'network' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <strong className="text-amber-300 block font-rajdhani font-bold">
                Protected Fleet Directory Policy
              </strong>
              <p className="text-[11px] text-slate-400">
                You are viewing the entire network fleet in <strong>Student Mode</strong>. For data integrity and security, you can only edit or remove <strong>your own CanSat</strong>. Other student stations and master publisher nodes are securely locked.
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search fleet by ID, college, student name, or location..."
                value={networkSearch}
                onChange={e => setNetworkSearch(e.target.value)}
                className="input-isro pl-9 text-xs py-1.5"
              />
            </div>
          </div>

          {/* Fleet Table with Lock Indicators */}
          <div className="max-h-96 overflow-y-auto border border-white/10 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#09122C] text-slate-400 font-rajdhani font-bold sticky top-0">
                <tr>
                  <th className="p-2.5">Status & ID</th>
                  <th className="p-2.5">Institution</th>
                  <th className="p-2.5">Student / Principal</th>
                  <th className="p-2.5">Location / Coords</th>
                  <th className="p-2.5 text-right">Student Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-rajdhani">
                {satellites
                  .filter(node => {
                    if (!networkSearch.trim()) return true;
                    const q = networkSearch.toLowerCase();
                    return (
                      node.satelliteId.toLowerCase().includes(q) ||
                      node.collegeName.toLowerCase().includes(q) ||
                      (node.studentName && node.studentName.toLowerCase().includes(q)) ||
                      node.location.toLowerCase().includes(q)
                    );
                  })
                  .map(node => {
                    const isMine = ownedSatIds.includes(node.satelliteId);

                    return (
                      <tr 
                        key={node.satelliteId} 
                        className={`hover:bg-white/5 transition-colors ${isMine ? 'bg-sky-500/5' : ''}`}
                      >
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {isMine ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Your Node" />
                            ) : (
                              <span title="Protected Module">
                                <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                              </span>
                            )}
                            <span className={`font-orbitron font-bold ${isMine ? 'text-emerald-400' : 'text-[#FF9933]'}`}>
                              {node.satelliteId}
                            </span>
                          </div>
                        </td>

                        <td className="p-2.5 text-white font-bold max-w-xs truncate">
                          {node.collegeName}
                        </td>

                        <td className="p-2.5 text-slate-300">
                          <div>
                            {node.studentName && <span className="text-sky-300 block font-semibold">{node.studentName}</span>}
                            <span className="text-slate-400 text-[11px]">{node.principalName}</span>
                          </div>
                        </td>

                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-400 text-[11px]">{node.location}</span>
                            {typeof node.lat === 'number' && (
                              <span className="text-[10px] font-mono text-[#00E5FF] bg-black/30 px-1 rounded">
                                {node.lat.toFixed(2)}°, {node.lng.toFixed(2)}°
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-2.5 text-right">
                          {isMine ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setStudentTab('mine');
                                  handleStartEdit(node);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1"
                              >
                                <PenLine className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteMySat(node.satelliteId)}
                                className="p-1 rounded text-rose-400 hover:bg-rose-500/20"
                                title="Remove your CanSat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 text-slate-500 border border-slate-700/60 text-[11px] font-medium cursor-not-allowed select-none"
                              title="Protected: You can only edit or remove your own registered CanSat"
                            >
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Protected</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
