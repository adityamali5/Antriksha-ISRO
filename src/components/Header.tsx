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
    <header className="sticky top-0 z-50 bg-white dark:bg-[#070d24] border-b-2 border-slate-200 dark:border-blue-900 px-3 sm:px-6 py-2.5 sm:py-3.5 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
        {/* TOP ROW: Logos, Massive Full-Sized Title, and Quick Controls */}
        <div className="flex items-center justify-between gap-3 select-none">
          {/* Partner & Program Logos */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="https://indo-science.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Indo Science (indo-science.vercel.app)"
              className="bg-white p-1 md:p-1.5 rounded-xl border-2 border-slate-300 dark:border-blue-800 shadow-xs hover:scale-105 transition-transform flex items-center justify-center cursor-pointer shrink-0"
            >
              <IndoScienceLogo size="sm" showSubtext={true} />
            </a>

            <a
              href="https://indo-science.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit SPARK India Program Portal (indo-science.vercel.app)"
              className="bg-white p-1 md:p-1.5 rounded-xl border-2 border-slate-300 dark:border-blue-800 shadow-xs hover:scale-105 transition-transform flex items-center justify-center cursor-pointer shrink-0"
            >
              <SparkLogo size="sm" showSubtitle={true} />
            </a>

            <a
              href="https://www.isro.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit ISRO Official Website (isro.gov.in)"
              className="bg-white p-1 md:p-1.5 rounded-xl border-2 border-slate-300 dark:border-blue-800 shadow-xs hover:scale-105 transition-transform inline-flex items-center shrink-0"
            >
              <IsroLogo size="sm" variant="full" />
            </a>
          </div>

          {/* Full-Sized Heading Title */}
          <div 
            className="flex-1 flex flex-col items-center sm:items-start pl-1 sm:pl-3 cursor-pointer group"
            onClick={() => handleTabClick('dashboard')}
          >
            <h1 className="font-orbitron font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-wider group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-none uppercase">
              PROJECT ANTRIKSHA <span className="text-amber-600 dark:text-[#FF9933] font-black tracking-normal">अंतरिक्ष</span>
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-slate-600 dark:text-slate-300 font-rajdhani font-bold tracking-wide mt-0.5">
              ISRO IndoSpark Student Micro-Satellite Telemetry Network
            </p>
          </div>

          {/* Right utility buttons: Admin, Theme, Mobile toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Admin Panel Button */}
            <button
              onClick={openAdminModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white border-2 border-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 dark:border-cyan-400 font-rajdhani font-black text-xs transition-all shadow-sm cursor-pointer min-h-[36px]"
              title="Open ISRO Ground Station Admin Panel"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{isAdminLoggedIn ? 'Admin Active' : 'Admin'}</span>
            </button>

            {/* THEME TOGGLE BUTTON */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border-2 text-xs font-rajdhani font-black transition-all bg-white hover:bg-slate-100 dark:bg-[#111e48] border-slate-300 dark:border-blue-800 text-slate-900 dark:text-slate-100 min-h-[36px] shadow-xs cursor-pointer shrink-0"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-[#FF9933] animate-spin-slow shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-600 shrink-0" />
                )}
                <span className="text-[11px] font-extrabold uppercase tracking-wider hidden md:inline">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white dark:bg-[#111e48] border-2 border-slate-300 dark:border-blue-800 text-slate-900 dark:text-white transition-all min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer shadow-xs shrink-0"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: Navigation Tabs Placed Directly Underneath the Antriksha Name */}
        <div className="hidden lg:flex items-center justify-between pt-1 border-t border-slate-200 dark:border-blue-900/60">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-rajdhani font-black transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-md border-2 border-amber-600 font-black scale-105'
                  : 'bg-slate-100 dark:bg-[#111e48] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#192b66] border-2 border-slate-300 dark:border-blue-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-950 dark:text-white" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => handleTabClick('explorer')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-rajdhani font-black transition-all ${
                activeTab === 'explorer'
                  ? 'bg-blue-600 text-white shadow-md border-2 border-blue-700 font-black scale-105'
                  : 'bg-slate-100 dark:bg-[#111e48] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#192b66] border-2 border-slate-300 dark:border-blue-800'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Satellites Directory ({totalSatellites})</span>
            </button>

            <button
              onClick={() => handleTabClick('map')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-rajdhani font-black transition-all ${
                activeTab === 'map'
                  ? 'bg-emerald-600 text-white shadow-md border-2 border-emerald-700 font-black scale-105'
                  : 'bg-slate-100 dark:bg-[#111e48] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#192b66] border-2 border-slate-300 dark:border-blue-800'
              }`}
            >
              <Map className="w-4 h-4 shrink-0" />
              <span>Orbital Radar Map</span>
            </button>
          </nav>

          <div className="flex items-center gap-2 text-xs font-rajdhani font-bold text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Ground Feed Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 pt-3 border-t-2 border-slate-300 dark:border-blue-900 flex flex-col space-y-2 bg-white dark:bg-[#070d24] p-3 rounded-2xl border-2 border-slate-300 dark:border-blue-900 shadow-xl">
          <button
            onClick={() => handleTabClick('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-black transition-all ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 border-2 border-amber-600 shadow-sm' : 'bg-slate-100 dark:bg-[#111e48] text-slate-900 dark:text-white border border-slate-200 dark:border-blue-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
          </button>

          <button
            onClick={() => handleTabClick('explorer')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-black transition-all ${
              activeTab === 'explorer' ? 'bg-blue-600 text-white border-2 border-blue-700 shadow-sm' : 'bg-slate-100 dark:bg-[#111e48] text-slate-900 dark:text-white border border-slate-200 dark:border-blue-800'
            }`}
          >
            <Search className="w-4 h-4" /> Satellite Directory ({totalSatellites})
          </button>

          <button
            onClick={() => handleTabClick('map')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-rajdhani font-black transition-all ${
              activeTab === 'map' ? 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-sm' : 'bg-slate-100 dark:bg-[#111e48] text-slate-900 dark:text-white border border-slate-200 dark:border-blue-800'
            }`}
          >
            <Map className="w-4 h-4" /> Orbital Radar Map
          </button>

          <div className="pt-2 border-t border-slate-200 dark:border-blue-900 flex flex-col gap-2">
            <button
              onClick={() => {
                openAdminModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 text-white border-2 border-cyan-700 font-rajdhani font-black text-xs"
            >
              <ShieldCheck className="w-4 h-4" /> Open ISRO Admin Panel
            </button>

            {toggleTheme && (
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-[#111e48] border border-slate-300 dark:border-blue-800 text-slate-900 dark:text-slate-100 font-rajdhani font-black text-xs"
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
