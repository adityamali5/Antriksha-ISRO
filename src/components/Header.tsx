import React, { useState, useEffect } from 'react';
import { Satellite, LayoutDashboard, Search, Map, Info, Activity, Radio, ShieldCheck, Menu, X, Globe, Sun, Moon, Database, Cloud } from 'lucide-react';
import { IsroLogo } from './IsroLogo';
import { IndoScienceLogo } from './IndoScienceLogo';
import { SparkLogo } from './SparkLogo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLiveStream: boolean;
  toggleLiveStream: () => void;
  totalSatellites: number;
  openAdminModal: () => void;
  isAdminLoggedIn: boolean;
  onlyRegistered?: boolean;
  toggleOnlyRegistered?: () => void;
  registeredCount?: number;
  theme?: 'dark' | 'light';
  toggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isLiveStream,
  toggleLiveStream,
  totalSatellites,
  openAdminModal,
  isAdminLoggedIn,
  onlyRegistered = false,
  toggleOnlyRegistered,
  registeredCount = 0,
  theme = 'dark',
  toggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<{ connected: boolean; provider: string; region: string; storedCount: number } | null>(null);

  useEffect(() => {
    fetch('/api/cloud-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCloudStatus({
            connected: data.connected,
            provider: 'Cloud SQL PostgreSQL',
            region: data.region || 'europe-west1',
            storedCount: data.storedSatellitesCount || totalSatellites
          });
        }
      })
      .catch(() => {});
  }, [totalSatellites]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#050814]/80 backdrop-blur-md border-b border-slate-200 dark:border-[#00E5FF]/40 px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 shadow-xs dark:shadow-2xl transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo & Branding */}
        <div className="flex items-center gap-2 sm:gap-3 select-none shrink-0">
          {/* Indo Science Education Trust Logo Link */}
          <a
            href="https://indo-science.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit Indo Science (indo-science.vercel.app)"
            className="bg-white p-1 md:p-1.5 rounded-xl border border-slate-200 dark:border-white/20 shadow-xs hover:shadow-sm transition-transform duration-300 hover:scale-105 flex items-center justify-center cursor-pointer shrink-0"
          >
            <IndoScienceLogo size="sm" showSubtext={true} />
          </a>

          {/* SPARK India Program Logo Link */}
          <a
            href="https://indo-science.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit SPARK India Program Portal (indo-science.vercel.app)"
            className="bg-white p-1 md:p-1.5 rounded-xl border border-slate-200 dark:border-white/20 shadow-xs hover:shadow-sm transition-transform duration-300 hover:scale-105 flex items-center justify-center cursor-pointer shrink-0"
          >
            <SparkLogo size="sm" showSubtitle={true} />
          </a>

          <div className="hidden sm:flex flex-col justify-center border-l border-slate-300 dark:border-white/20 pl-2.5">
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => handleTabClick('dashboard')}
            >
              <span className="font-orbitron font-extrabold text-xs md:text-sm lg:text-base text-slate-900 dark:text-white tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                PROJECT ANTRIKSHA <span className="text-amber-600 dark:text-[#FF9933] font-black">अंतरिक्ष</span>
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href="https://www.isro.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                title="Visit ISRO Official Website (isro.gov.in)"
                className="bg-white px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/20 hover:scale-105 transition-transform inline-flex items-center shadow-xs"
              >
                <IsroLogo size="sm" variant="full" />
              </a>
              <p 
                className="text-[10px] text-slate-600 dark:text-slate-400 font-rajdhani font-semibold cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                onClick={() => handleTabClick('dashboard')}
              >
                Student Micro-Satellite Telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-[#0A122E]/80 p-1 rounded-xl border border-slate-200/90 dark:border-[#00E5FF]/40 backdrop-blur-sm">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-[#FF9933] to-[#FF6600] text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-700 dark:text-white hover:bg-slate-200/80 dark:hover:bg-white/20'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleTabClick('cansat')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all relative ${
              activeTab === 'cansat'
                ? 'bg-gradient-to-r from-cyan-400 to-teal-500 text-slate-950 font-black shadow-sm'
                : 'text-cyan-700 dark:text-[#00E5FF] hover:bg-cyan-500/10'
            }`}
          >
            <Radio className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
            <span>CanSat ESP32</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          </button>

          <button
            onClick={() => handleTabClick('explorer')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all ${
              activeTab === 'explorer'
                ? 'bg-gradient-to-r from-[#FF9933] to-[#FF6600] text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-700 dark:text-white hover:bg-slate-200/80 dark:hover:bg-white/20'
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>Satellites</span>
          </button>

          <button
            onClick={() => handleTabClick('map')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all ${
              activeTab === 'map'
                ? 'bg-gradient-to-r from-[#FF9933] to-[#FF6600] text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-700 dark:text-white hover:bg-slate-200/80 dark:hover:bg-white/20'
            }`}
          >
            <Map className="w-4 h-4 shrink-0" />
            <span>Radar</span>
          </button>

          <button
            onClick={() => handleTabClick('vision')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-rajdhani font-bold transition-all ${
              activeTab === 'vision'
                ? 'bg-gradient-to-r from-[#FF9933] to-[#FF6600] text-slate-950 font-extrabold shadow-sm'
                : 'text-slate-700 dark:text-white hover:bg-slate-200/80 dark:hover:bg-white/20'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>Mission</span>
          </button>
        </nav>

        {/* Header Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Admin Panel Button */}
          <button
            onClick={openAdminModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-[#00E5FF]/25 dark:hover:bg-[#00E5FF]/40 border border-sky-300 dark:border-[#00E5FF]/70 text-sky-800 dark:text-[#00E5FF] font-rajdhani font-bold text-xs transition-all shadow-xs backdrop-blur-sm cursor-pointer min-h-[38px]"
            title="Open ISRO Ground Station Admin Panel"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>{isAdminLoggedIn ? 'Admin Active' : 'Admin'}</span>
          </button>

          {/* THEME TOGGLE BUTTON - ALWAYS VISIBLE ON ALL SCREENS */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-rajdhani font-bold transition-all backdrop-blur-sm bg-white hover:bg-slate-50 dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-800 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white min-h-[38px] hover:border-amber-400 dark:hover:border-[#FF9933]/70 shadow-xs cursor-pointer shrink-0"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#FF9933] animate-spin-slow shrink-0" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600 shrink-0" />
              )}
              <span className="text-[11px] font-extrabold uppercase tracking-wider hidden sm:inline">
                {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="2xl:hidden p-2 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/30 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-black/60 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer shadow-xs shrink-0"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 pt-3 border-t border-slate-200 dark:border-[#00E5FF]/40 flex flex-col space-y-1.5 bg-white/95 dark:bg-[#050814]/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-white/10 shadow-lg">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-[#FF9933] text-slate-950' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
          </button>

          <button
            onClick={() => handleTabClick('cansat')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-bold transition-all ${
              activeTab === 'cansat' ? 'bg-[#00E5FF] text-slate-950 font-black' : 'bg-cyan-500/10 text-cyan-800 dark:text-[#00E5FF]'
            }`}
          >
            <Radio className="w-4 h-4 text-amber-500 animate-pulse" /> CanSat ESP32 Hardware & Pen Drive (CCCOMA)
          </button>

          <button
            onClick={() => handleTabClick('explorer')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-bold transition-all ${
              activeTab === 'explorer' ? 'bg-[#FF9933] text-slate-950' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100'
            }`}
          >
            <Search className="w-4 h-4" /> Satellite Directory ({totalSatellites})
          </button>

          <button
            onClick={() => handleTabClick('map')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-bold transition-all ${
              activeTab === 'map' ? 'bg-[#FF9933] text-slate-950' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100'
            }`}
          >
            <Map className="w-4 h-4" /> Orbital Radar Map
          </button>

          <button
            onClick={() => handleTabClick('vision')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-bold transition-all ${
              activeTab === 'vision' ? 'bg-[#FF9933] text-slate-950' : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-100'
            }`}
          >
            <Info className="w-4 h-4" /> ISRO Mission & Project Details
          </button>

          <div className="pt-2 border-t border-slate-200 dark:border-white/20 flex flex-col gap-2">
            <button
              onClick={() => {
                openAdminModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/15 dark:bg-[#00E5FF]/30 border border-cyan-500/70 dark:border-[#00E5FF]/70 text-cyan-800 dark:text-[#00E5FF] font-rajdhani font-bold text-xs"
            >
              <ShieldCheck className="w-4 h-4" /> Open ISRO Admin Panel
            </button>

            {toggleTheme && (
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-800 dark:text-slate-100 font-rajdhani font-bold text-xs"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FF9933]" /> : <Moon className="w-4 h-4 text-sky-600" />}
                <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
