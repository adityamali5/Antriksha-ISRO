import React from 'react';
import { Rocket, GraduationCap, Cpu, Earth, Layers } from 'lucide-react';
import { IsroLogo } from './IsroLogo';
import { IndoScienceLogo } from './IndoScienceLogo';
import { SparkLogo } from './SparkLogo';

export const MissionView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header Banner Card */}
      <div className="bg-white dark:bg-slate-900/80 p-6 md:p-8 rounded-2xl relative overflow-hidden space-y-4 border border-amber-400/40 dark:border-[#FF9933]/30 shadow-md dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://indo-science.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit Indo Science Education Trust Official Portal (indo-science.vercel.app)"
              className="p-2.5 rounded-2xl bg-white border border-slate-200 dark:border-white/20 shadow-sm flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <IndoScienceLogo size="md" showSubtext={true} />
            </a>
            <a
              href="https://indo-science.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit SPARK India Program Portal (indo-science.vercel.app)"
              className="p-2.5 rounded-2xl bg-white border border-slate-200 dark:border-white/20 shadow-sm flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <SparkLogo size="md" showSubtitle={true} />
            </a>
            <a
              href="https://www.isro.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              title="Visit ISRO Official Website (isro.gov.in)"
              className="p-2.5 rounded-2xl bg-white border border-slate-200 dark:border-white/20 shadow-sm flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
            >
              <IsroLogo size="md" variant="full" />
            </a>
          </div>
          <div>
            <h2 className="font-orbitron font-extrabold text-2xl md:text-3xl text-slate-900 dark:text-white tracking-wide">
              INDO SCIENCE & ISRO Project <span className="text-amber-600 dark:text-[#FF9933] font-black">ANTRIKSHA</span> (अंतरिक्ष)
            </h2>
            <p className="text-xs text-sky-700 dark:text-[#00E5FF] font-rajdhani font-bold tracking-widest uppercase mt-1">
              Indo Science Education Trust • SPARK India Program • ISRO Ground Telemetry
            </p>
          </div>
        </div>

        <p className="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed font-body font-medium pt-2 border-t border-slate-100 dark:border-slate-800">
          Project <strong className="text-slate-900 dark:text-white font-bold">Antriksha</strong> is an ambitious Indian Space Research Organisation (ISRO) national infrastructure initiative establishing 1,200 to 2,000 ground-station micro-satellites hosted directly on educational campuses—schools, polytechnics, colleges, and universities across India.
        </p>
      </div>

      {/* Feature Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl space-y-3.5 border border-slate-200 dark:border-slate-800 border-t-4 border-t-amber-500 dark:border-t-[#FF9933] shadow-sm dark:shadow-lg">
          <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-[#FF9933]/15 text-amber-600 dark:text-[#FF9933] w-fit">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="font-orbitron font-bold text-lg text-slate-900 dark:text-white">STEM & Academic Integration</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-body font-medium leading-relaxed">
            Direct access for students and faculties to real-time space science telemetry, micro-weather sensors, and orbital passes right from their own campus.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl space-y-3.5 border border-slate-200 dark:border-slate-800 border-t-4 border-t-sky-500 dark:border-t-[#00E5FF] shadow-sm dark:shadow-lg">
          <div className="p-3 rounded-xl bg-sky-500/10 dark:bg-[#00E5FF]/15 text-sky-600 dark:text-[#00E5FF] w-fit">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-orbitron font-bold text-lg text-slate-900 dark:text-white">Real-Time Sensor Network</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-body font-medium leading-relaxed">
            Continuous tracking of temperature, air quality index (AQI), atmospheric pressure, wind speeds, and radio signal telemetry (RSSI).
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 p-6 rounded-2xl space-y-3.5 border border-slate-200 dark:border-slate-800 border-t-4 border-t-emerald-500 dark:border-t-[#00E676] shadow-sm dark:shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-[#00E676]/15 text-emerald-600 dark:text-[#00E676] w-fit">
            <Earth className="w-6 h-6" />
          </div>
          <h3 className="font-orbitron font-bold text-lg text-slate-900 dark:text-white">Seamless Live Transition</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-body font-medium leading-relaxed">
            Currently loaded with pre-launch seed datasets. As physical satellite ground units complete hardware calibration, live satellite telemetry streams automatically replace seed data.
          </p>
        </div>
      </div>

      {/* Architecture & Telemetry Workflow Card */}
      <div className="bg-white dark:bg-slate-900/80 p-6 md:p-8 rounded-2xl space-y-6 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-lg">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-[#FF9933]/15 text-amber-600 dark:text-[#FF9933]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-xl text-slate-900 dark:text-white">
              Project Architecture & Telemetry Workflow
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-rajdhani font-semibold">
              End-to-End Ground Unit Satellite Integration Pipeline
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-orbitron font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                1
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-orbitron">
                Ground Hardware Implant
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-body">
              Each selected institution receives an ISRO micro-satellite ground receiver kit mounted on the institution building rooftop under the supervision of the Principal & Director.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-sky-500 text-white font-orbitron font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                2
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-orbitron">
                Telemetry & Encryption
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-body">
              Sensors capture micro-weather parameters (AQI, Temperature, Wind Speed) and transmit encrypted pings every few seconds back to central Antriksha servers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-500 text-white font-orbitron font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                3
              </span>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-orbitron">
                Open Antriksha Web Portal
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-body">
              Public, researchers, and students access Antriksha to explore any ground satellite node nationwide, track live streams, or manage station parameters via the ISRO Admin Panel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
