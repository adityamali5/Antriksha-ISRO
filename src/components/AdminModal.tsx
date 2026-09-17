import React, { useState, useEffect, useMemo } from 'react';
import { SatelliteNode } from '../types';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Download,
  CheckCircle,
  AlertCircle,
  Search,
  Radio,
  FileSpreadsheet,
  Globe,
  User,
  GraduationCap,
  School,
  Sparkles,
  RotateCcw,
  Check,
  Layers,
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  LogOut
} from 'lucide-react';

interface AdminModalProps {
  onClose: () => void;
  satellites: SatelliteNode[];
  onAddSatellite: (sat: SatelliteNode) => void;
  onUpdateSatellite: (sat: SatelliteNode) => void;
  onDeleteSatellite: (satelliteId: string) => void;
  isLiveStream: boolean;
  toggleLiveStream: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (status: boolean) => void;
  exportToCSV: (data: SatelliteNode[]) => void;
  theme?: 'dark' | 'light';
}

const REQUIRED_ADMIN_PASSWORD = 'ISRO@1200';

export const AdminModal: React.FC<AdminModalProps> = ({
  onClose,
  satellites,
  onAddSatellite,
  onUpdateSatellite,
  onDeleteSatellite,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  exportToCSV,
  theme
}) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Determine current active theme (supports prop or DOM root class)
  const isLight = useMemo(() => {
    if (typeof theme !== 'undefined') return theme === 'light';
    return typeof document !== 'undefined' && document.documentElement.classList.contains('light');
  }, [theme]);

  // Authentication State
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // View state: 'form' (add/edit satellite) or 'log' (view registry log)
  const [currentView, setCurrentView] = useState<'form' | 'log'>('form');

  // Form Fields
  const [satelliteId, setSatelliteId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');

  // Editing state
  const [editingSatellite, setEditingSatellite] = useState<SatelliteNode | null>(null);

  // Search filter in registry log
  const [searchQuery, setSearchQuery] = useState('');

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Status feedback notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Handle Admin Password Verification
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === REQUIRED_ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setPasswordError('');
      setPasswordInput('');
      showNotification('success', 'Admin session authenticated successfully.');
    } else {
      setPasswordError('Incorrect password. Please enter the valid ISRO admin password.');
    }
  };

  // Handle Admin Logout
  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setPasswordInput('');
    setPasswordError('');
    setCurrentView('form');
    showNotification('success', 'Admin session locked.');
  };

  // Reset form to defaults
  const resetForm = () => {
    setSatelliteId('');
    setStudentName('');
    setSchoolName('');
    setPrincipalName('');
    setTeacherName('');
    setAppsScriptUrl('');
    setEditingSatellite(null);
  };

  // Switch to edit mode for a selected satellite
  const handleStartEdit = (sat: SatelliteNode) => {
    setEditingSatellite(sat);
    setSatelliteId(sat.satelliteId || '');
    setStudentName(sat.studentName || '');
    setSchoolName(sat.collegeName || '');
    setPrincipalName(sat.principalName || '');
    setTeacherName(sat.teacherName || '');
    setAppsScriptUrl(sat.appsScriptUrl || sat.url || sat.childWebsiteUrl || '');
    setCurrentView('form');
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    resetForm();
  };

  // Form submission: Add or Update Ground Station Satellite
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSatId = satelliteId.trim();
    const cleanStudentName = studentName.trim();
    const cleanSchoolName = schoolName.trim();
    const cleanPrincipalName = principalName.trim();
    const cleanTeacherName = teacherName.trim();
    const cleanUrl = appsScriptUrl.trim();

    if (!cleanSatId) {
      showNotification('error', 'Please enter a Satellite ID');
      return;
    }
    if (!cleanSchoolName) {
      showNotification('error', 'Please enter Student School / College Name');
      return;
    }
    if (!cleanStudentName) {
      showNotification('error', 'Please enter Student Name');
      return;
    }

    if (editingSatellite) {
      // Update existing satellite
      const updatedNode: SatelliteNode = {
        ...editingSatellite,
        satelliteId: cleanSatId,
        studentName: cleanStudentName,
        collegeName: cleanSchoolName,
        principalName: cleanPrincipalName || 'School Principal',
        teacherName: cleanTeacherName || undefined,
        appsScriptUrl: cleanUrl || undefined,
        url: cleanUrl || editingSatellite.url || '',
        childWebsiteUrl: cleanUrl || editingSatellite.childWebsiteUrl || '',
        sourceType: cleanUrl ? 'apps_script' : editingSatellite.sourceType || 'standard',
        isCustom: true
      };

      onUpdateSatellite(updatedNode);
      showNotification('success', `Satellite "${cleanSatId}" updated successfully!`);
      resetForm();
    } else {
      // Add new ground station satellite
      const newNode: SatelliteNode = {
        id: Date.now(),
        satelliteId: cleanSatId,
        studentName: cleanStudentName,
        collegeName: cleanSchoolName,
        principalName: cleanPrincipalName || 'School Principal',
        teacherName: cleanTeacherName || undefined,
        appsScriptUrl: cleanUrl || undefined,
        location: `${cleanSchoolName}, India`,
        weatherCondition: 'Clear Sky',
        aqi: 32,
        temperature: 26.5,
        windSpeed: 11,
        lat: 18.5204 + (Math.random() - 0.5) * 0.08,
        lng: 73.8567 + (Math.random() - 0.5) * 0.08,
        status: 'Active Ground Station',
        batteryLevel: 98,
        rssi: -62,
        orbitAltitude: 500,
        isLiveStream: true,
        lastPing: 'Live Ground Station Telemetry',
        url: cleanUrl,
        childWebsiteUrl: cleanUrl,
        sourceType: cleanUrl ? 'apps_script' : 'standard',
        isCustom: true
      };

      onAddSatellite(newNode);
      showNotification('success', `Ground Station Satellite "${cleanSatId}" registered successfully!`);
      resetForm();
    }
  };

  // Delete satellite handler with confirmation
  const handleDelete = (satId: string) => {
    onDeleteSatellite(satId);
    setConfirmDeleteId(null);
    if (editingSatellite && editingSatellite.satelliteId === satId) {
      resetForm();
    }
    showNotification('success', `Satellite "${satId}" deleted from registry.`);
  };

  // Trigger CSV export
  const handleDownloadCSV = () => {
    if (typeof exportToCSV === 'function') {
      exportToCSV(satellites);
      showNotification('success', 'CSV log downloaded successfully.');
    } else {
      const headers = [
        'Satellite ID',
        'Student Name',
        'School / College Name',
        'Teacher Name',
        'Principal Name',
        'Apps Script Backup URL',
        'Status',
        'Location'
      ];
      const rows = satellites.map(s => [
        `"${(s.satelliteId || '').replace(/"/g, '""')}"`,
        `"${(s.studentName || '').replace(/"/g, '""')}"`,
        `"${(s.collegeName || '').replace(/"/g, '""')}"`,
        `"${(s.teacherName || '').replace(/"/g, '""')}"`,
        `"${(s.principalName || '').replace(/"/g, '""')}"`,
        `"${(s.appsScriptUrl || '').replace(/"/g, '""')}"`,
        `"${(s.status || 'Active').replace(/"/g, '""')}"`,
        `"${(s.location || '').replace(/"/g, '""')}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ISRO_Satellites_Registry_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('success', 'CSV log downloaded successfully.');
    }
  };

  // Filtered satellites for the log view
  const filteredSatellites = useMemo(() => {
    if (!searchQuery.trim()) return satellites;
    const q = searchQuery.toLowerCase().trim();
    return satellites.filter(s =>
      (s.satelliteId && s.satelliteId.toLowerCase().includes(q)) ||
      (s.studentName && s.studentName.toLowerCase().includes(q)) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(q)) ||
      (s.teacherName && s.teacherName.toLowerCase().includes(q)) ||
      (s.principalName && s.principalName.toLowerCase().includes(q))
    );
  }, [satellites, searchQuery]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 transition-colors duration-200 ${
        isLight ? 'bg-slate-900/50 backdrop-blur-sm' : 'bg-black/80 backdrop-blur-md'
      } overflow-y-auto animate-fadeIn`}
    >
      <div
        className={`relative w-full ${
          !isAdminLoggedIn ? 'max-w-md' : 'max-w-4xl'
        } rounded-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] transition-all duration-200 ${
          isLight
            ? 'bg-white border border-slate-200 shadow-2xl text-slate-800'
            : 'bg-[#070c1d] border border-cyan-500/30 text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.15)]'
        }`}
      >
        {/* Tricolor ISRO Top Banner */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        {/* =======================================================
            STATE A: PASSWORD LOGIN GATEWAY (when not logged in)
            ======================================================= */}
        {!isAdminLoggedIn ? (
          <div className="flex flex-col">
            {/* Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a1126] border-cyan-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1.5 rounded-lg border ${
                    isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                      : 'bg-[#FF9933]/15 border-[#FF9933]/40 text-[#FF9933]'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3
                    className={`font-orbitron font-bold text-sm tracking-wider ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    ADMIN AUTHENTICATION
                  </h3>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Project Antriksha ISRO Ground Station
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Login Form Body */}
            <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <div
                  className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center transition-all ${
                    isLight
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-700 shadow-sm'
                      : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.25)]'
                  }`}
                >
                  <KeyRound className="w-7 h-7 animate-pulse" />
                </div>
                <h4
                  className={`font-orbitron font-bold text-base sm:text-lg ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Security Access Key
                </h4>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Enter the administrator password to manage ground station satellites and telemetry settings.
                </p>
              </div>

              {/* Error Banner */}
              {passwordError && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border animate-fadeIn ${
                    isLight
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-rose-950/80 text-rose-200 border-rose-700/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                    isLight ? 'text-slate-700' : 'text-cyan-300'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-cyan-500" />
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    placeholder="Enter Admin Password"
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    className={`w-full pl-4 pr-11 py-3 rounded-xl text-sm font-mono transition focus:outline-none focus:ring-2 ${
                      isLight
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                        : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white transition`}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 px-4 rounded-xl text-sm font-orbitron font-semibold tracking-wider flex items-center justify-center gap-2 transition duration-200 shadow-md ${
                    isLight
                      ? 'text-white bg-gradient-to-r from-cyan-600 to-[#d97706] hover:from-cyan-700 hover:to-[#b45309]'
                      : 'text-black bg-gradient-to-r from-cyan-400 to-[#FF9933] hover:from-cyan-300 hover:to-[#ffaa55] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(255,153,51,0.5)]'
                  }`}
                >
                  <Unlock className="w-4 h-4" />
                  <span>Unlock Admin Panel</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium transition ${
                    isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  Cancel & Return to Dashboard
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* =======================================================
             STATE B: AUTHENTICATED ADMIN CONSOLE
             ======================================================= */
          <>
            {/* Modal Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between gap-3 flex-wrap transition-colors duration-200 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a1126] border-cyan-900/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl border flex items-center justify-center transition-colors ${
                    isLight
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-600'
                      : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400'
                  }`}
                >
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      className={`text-lg sm:text-xl font-orbitron font-bold tracking-wider flex items-center gap-2 ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      ISRO GROUND STATION ADMIN
                    </h2>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FF9933]/20 text-[#d97706] dark:text-[#FF9933] border border-[#FF9933]/40 font-bold">
                      Antriksha
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Ground station satellite registration, cloud backup & registry management
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Small Log Button with Registered Counter */}
                <button
                  onClick={() => setCurrentView(prev => prev === 'log' ? 'form' : 'log')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                    currentView === 'log'
                      ? isLight
                        ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm'
                        : 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : isLight
                        ? 'bg-white text-cyan-800 border-slate-300 hover:bg-slate-100'
                        : 'bg-slate-800/80 text-cyan-300 border-cyan-500/30 hover:bg-cyan-950/60 hover:border-cyan-400'
                  }`}
                  title="View how many satellites are registered and manage them"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Log</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      currentView === 'log'
                        ? isLight
                          ? 'bg-cyan-800 text-white'
                          : 'bg-black text-cyan-400'
                        : isLight
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {satellites.length}
                  </span>
                </button>

                {/* Download CSV Button */}
                <button
                  onClick={handleDownloadCSV}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isLight
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-sm'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60 hover:border-emerald-400'
                  }`}
                  title="Download registered satellites log as CSV file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download CSV</span>
                  <span className="sm:hidden">CSV</span>
                </button>

                {/* Lock / Logout Button */}
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isLight
                      ? 'text-slate-600 bg-slate-100 border-slate-300 hover:bg-slate-200'
                      : 'text-slate-300 bg-slate-800/80 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                  title="Lock Admin Panel"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock</span>
                </button>

                {/* Close Modal Button */}
                <button
                  onClick={onClose}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isLight
                      ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/70'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Close Admin Panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {notification && (
              <div
                className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-2 border-b animate-fadeIn ${
                  notification.type === 'success'
                    ? isLight
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-emerald-950/90 text-emerald-200 border-emerald-700/50'
                    : isLight
                      ? 'bg-rose-50 text-rose-900 border-rose-200'
                      : 'bg-rose-950/90 text-rose-200 border-rose-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {notification.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{notification.message}</span>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Body Area */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {currentView === 'form' ? (
                /* =======================================================
                   REGISTRATION / EDIT FORM VIEW
                   ======================================================= */
                <div className="space-y-6">
                  {/* Form Title & Editing Status Bar */}
                  <div
                    className={`flex items-center justify-between flex-wrap gap-2 pb-3 border-b ${
                      isLight ? 'border-slate-200' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1.5 rounded-md border ${
                          isLight
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-[#FF9933]/10 text-[#FF9933] border-[#FF9933]/30'
                        }`}
                      >
                        {editingSatellite ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </span>
                      <div>
                        <h3 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {editingSatellite
                            ? `Edit Ground Station Satellite: ${editingSatellite.satelliteId}`
                            : 'Add Ground Station Satellite'}
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {editingSatellite
                            ? 'Modify satellite and school station parameters below'
                            : 'Students can register their ground station satellite with cloud backup relay'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingSatellite && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition ${
                            isLight
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentView('log')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
                          isLight
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
                            : 'text-cyan-300 bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/50'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        View Registry Log ({satellites.length})
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      
                      {/* 1. Satellite ID */}
                      <div className="space-y-1.5">
                        <label
                          className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                            isLight ? 'text-cyan-800' : 'text-cyan-300'
                          }`}
                        >
                          <Radio className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                          Satellite ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. CanSat-01, ISRO-NODE-101, Satellite #1"
                          value={satelliteId}
                          onChange={e => setSatelliteId(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono transition focus:outline-none focus:ring-2 ${
                            isLight
                              ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                              : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30'
                          }`}
                        />
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          Unique identifier for your CanSat / Ground Station module
                        </p>
                      </div>

                      {/* 2. Student Name */}
                      <div className="space-y-1.5">
                        <label
                          className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                            isLight ? 'text-cyan-800' : 'text-cyan-300'
                          }`}
                        >
                          <User className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                          Student Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Aryan Sharma / Team Lead"
                          value={studentName}
                          onChange={e => setStudentName(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 ${
                            isLight
                              ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                              : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30'
                          }`}
                        />
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          Student operator or team representative
                        </p>
                      </div>

                      {/* 3. Student School Name */}
                      <div className="space-y-1.5">
                        <label
                          className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                            isLight ? 'text-cyan-800' : 'text-cyan-300'
                          }`}
                        >
                          <School className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                          Student School Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Delhi Public School / Pune Vidyapeeth"
                          value={schoolName}
                          onChange={e => setSchoolName(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 ${
                            isLight
                              ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                              : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30'
                          }`}
                        />
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          School, college, or academic institute name
                        </p>
                      </div>

                      {/* 4. Teacher Name */}
                      <div className="space-y-1.5">
                        <label
                          className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                            isLight ? 'text-cyan-800' : 'text-cyan-300'
                          }`}
                        >
                          <GraduationCap className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                          Teacher Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Prof. Rajesh Verma / Mentor"
                          value={teacherName}
                          onChange={e => setTeacherName(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 ${
                            isLight
                              ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                              : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30'
                          }`}
                        />
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          Guiding teacher, mentor, or physics department faculty
                        </p>
                      </div>

                      {/* 5. Principal Name */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label
                          className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                            isLight ? 'text-cyan-800' : 'text-cyan-300'
                          }`}
                        >
                          <User className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                          Principal Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Dr. Archana Dharu / Head of Institution"
                          value={principalName}
                          onChange={e => setPrincipalName(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 ${
                            isLight
                              ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                              : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30'
                          }`}
                        />
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          Principal or Director of the institution
                        </p>
                      </div>

                      {/* 6. Apps Script URL (for Backup) */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <label
                          className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                            isLight ? 'text-[#b45309]' : 'text-[#FF9933]'
                          }`}
                        >
                          <Globe className={`w-3.5 h-3.5 ${isLight ? 'text-[#d97706]' : 'text-[#FF9933]'}`} />
                          Google Apps Script URL (for Backup)
                        </label>
                        <input
                          type="url"
                          placeholder="https://script.google.com/macros/s/.../exec"
                          value={appsScriptUrl}
                          onChange={e => setAppsScriptUrl(e.target.value)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono transition focus:outline-none focus:ring-2 ${
                            isLight
                              ? 'bg-amber-50/40 border border-amber-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#d97706] focus:ring-amber-500/20'
                              : 'bg-slate-900/90 border border-[#FF9933]/40 text-white placeholder-slate-500 focus:border-[#FF9933] focus:ring-[#FF9933]/40'
                          }`}
                        />
                        <p
                          className={`text-[11px] flex items-center gap-1 ${
                            isLight ? 'text-amber-800' : 'text-slate-400'
                          }`}
                        >
                          <Sparkles className={`w-3 h-3 ${isLight ? 'text-[#d97706]' : 'text-[#FF9933]'}`} />
                          Paste your Google Apps Script Web App URL here. Provides cloud relay and backup synchronization for your CanSat telemetry.
                        </p>
                      </div>

                    </div>

                    {/* Submit & Action Buttons */}
                    <div
                      className={`pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${
                        isLight ? 'border-slate-200' : 'border-slate-800'
                      }`}
                    >
                      <div
                        className={`text-xs flex items-center gap-2 ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>
                          Registered Satellites:{' '}
                          <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                            {satellites.length}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {editingSatellite && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                              isLight
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="submit"
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold font-orbitron tracking-wide transition duration-200 shadow-md ${
                            isLight
                              ? 'text-white bg-gradient-to-r from-cyan-600 to-[#d97706] hover:from-cyan-700 hover:to-[#b45309]'
                              : 'text-black bg-gradient-to-r from-cyan-400 to-[#FF9933] hover:from-cyan-300 hover:to-[#ffaa55] shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(255,153,51,0.5)]'
                          }`}
                        >
                          {editingSatellite ? (
                            <>
                              <Check className="w-4 h-4" />
                              Save Satellite Changes
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Register Ground Station Satellite
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                /* =======================================================
                   REGISTRY LOG VIEW
                   ======================================================= */
                <div className="space-y-4">
                  {/* Log Header Controls */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                      isLight ? 'border-slate-200' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentView('form')}
                        className={`p-1.5 rounded-lg transition ${
                          isLight
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Return to Registration Form"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <h3
                          className={`text-base font-semibold flex items-center gap-2 ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}
                        >
                          Registered Satellites Log
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border ${
                              isLight
                                ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            }`}
                          >
                            {satellites.length} Total
                          </span>
                        </h3>
                        <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          View, edit, or delete registered school ground station satellites
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Download CSV in Log */}
                      <button
                        onClick={handleDownloadCSV}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                          isLight
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download CSV
                      </button>

                      {/* Add New Satellite Button */}
                      <button
                        onClick={() => {
                          resetForm();
                          setCurrentView('form');
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isLight
                            ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                            : 'bg-cyan-500 text-black hover:bg-cyan-400'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Satellite
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search
                      className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                        isLight ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Search by Satellite ID, Student, School, Teacher, or Principal..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs transition focus:outline-none focus:ring-2 ${
                        isLight
                          ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-600 focus:ring-cyan-500/20'
                          : 'bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-cyan-400/30'
                      }`}
                    />
                  </div>

                  {/* Satellite List / Cards */}
                  {filteredSatellites.length === 0 ? (
                    <div
                      className={`text-center py-12 border border-dashed rounded-xl ${
                        isLight
                          ? 'bg-slate-50 border-slate-300'
                          : 'bg-slate-900/30 border-slate-800'
                      }`}
                    >
                      <Radio className={`w-10 h-10 mx-auto mb-2 animate-pulse ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                      <p className={`text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        No Satellites Found
                      </p>
                      <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        {searchQuery ? 'No satellites match your search filter.' : 'No satellites have been registered yet.'}
                      </p>
                      <button
                        onClick={() => {
                          resetForm();
                          setCurrentView('form');
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Register First Satellite
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {filteredSatellites.map((sat, index) => {
                        const isDeleting = confirmDeleteId === sat.satelliteId;
                        return (
                          <div
                            key={sat.satelliteId || index}
                            className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              isLight
                                ? 'bg-white border-slate-200 hover:border-cyan-300 shadow-sm'
                                : 'bg-slate-900/80 border-slate-800 hover:border-cyan-900/60'
                            }`}
                          >
                            {/* Satellite Information */}
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-orbitron font-bold text-sm ${
                                    isLight ? 'text-cyan-700' : 'text-cyan-300'
                                  }`}
                                >
                                  {sat.satelliteId}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                                    isLight
                                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                                      : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                  }`}
                                >
                                  #{index + 1}
                                </span>
                                {sat.status && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                      isLight
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                                    }`}
                                  >
                                    {sat.status}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <div>
                                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>School: </span>
                                  <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                                    {sat.collegeName || 'N/A'}
                                  </strong>
                                </div>
                                <div>
                                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Student: </span>
                                  <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                                    {sat.studentName || 'N/A'}
                                  </strong>
                                </div>
                                <div>
                                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Teacher: </span>
                                  <strong className={isLight ? 'text-slate-800' : 'text-slate-300'}>
                                    {sat.teacherName || 'Not specified'}
                                  </strong>
                                </div>
                                <div>
                                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Principal: </span>
                                  <strong className={isLight ? 'text-slate-800' : 'text-slate-300'}>
                                    {sat.principalName || 'Not specified'}
                                  </strong>
                                </div>
                              </div>

                              {/* Apps Script Backup URL indicator */}
                              {(sat.appsScriptUrl || sat.url) && (
                                <div
                                  className={`text-[11px] truncate flex items-center gap-1 pt-1 font-mono ${
                                    isLight ? 'text-[#b45309]' : 'text-[#FF9933]'
                                  }`}
                                >
                                  <Globe className="w-3 h-3 shrink-0" />
                                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                                    Apps Script Backup:
                                  </span>
                                  <span className="truncate max-w-xs font-semibold">
                                    {sat.appsScriptUrl || sat.url}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Edit and Delete */}
                            <div
                              className={`flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 ${
                                isLight ? 'border-slate-200' : 'border-slate-800'
                              }`}
                            >
                              {isDeleting ? (
                                <div
                                  className={`flex items-center gap-1.5 p-1.5 rounded-xl border animate-fadeIn ${
                                    isLight
                                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                                      : 'bg-rose-950/90 border-rose-600/50 text-rose-200'
                                  }`}
                                >
                                  <span className="text-[11px] px-1 font-medium">Confirm?</span>
                                  <button
                                    onClick={() => handleDelete(sat.satelliteId)}
                                    className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className={`px-2 py-1 rounded text-xs transition ${
                                      isLight
                                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(sat)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                      isLight
                                        ? 'text-cyan-800 bg-cyan-50 border-cyan-200 hover:bg-cyan-100 shadow-sm'
                                        : 'text-cyan-300 bg-cyan-950/50 border-cyan-800/60 hover:bg-cyan-900/60'
                                    }`}
                                    title="Edit this satellite"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(sat.satelliteId)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                                      isLight
                                        ? 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100 shadow-sm'
                                        : 'text-rose-400 bg-rose-950/40 border-rose-800/60 hover:bg-rose-900/60'
                                    }`}
                                    title="Delete this satellite"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`px-5 py-3.5 border-t flex items-center justify-between text-xs flex-wrap gap-2 transition-colors duration-200 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-500'
                  : 'bg-[#060a17] border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={isLight ? 'text-slate-600' : 'text-slate-500'}>
                  ISRO Antriksha Mission Control
                </span>
                <span>•</span>
                <span className={isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}>
                  Total Registered Satellites: {satellites.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCSV}
                  className={`flex items-center gap-1 text-[11px] transition ${
                    isLight ? 'text-slate-600 hover:text-cyan-700' : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
                  Download Complete CSV Log
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
