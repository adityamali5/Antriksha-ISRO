import React from 'react';

interface SparkLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const SparkLogo: React.FC<SparkLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true
}) => {
  const heightClasses = {
    sm: 'h-9',
    md: 'h-13',
    lg: 'h-20',
    xl: 'h-28'
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 520 250"
        className={`${heightClasses[size]} w-auto drop-shadow-sm transition-transform duration-300 hover:scale-[1.03]`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* === ARCHED CELESTIAL ORBIT & STARS === */}
        <g id="orbital-arch">
          {/* Main celestial arc dome */}
          <path
            d="M 130 140 A 155 130 0 0 1 405 135"
            stroke="#0B2545"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Twinkling stars */}
          {/* Star 1 (left) */}
          <path
            d="M 226 78 Q 226 84 231 84 Q 226 84 226 90 Q 226 84 221 84 Q 226 84 226 78 Z"
            fill="#0B2545"
          />
          {/* Star 2 (right) */}
          <path
            d="M 292 68 Q 292 73 296 73 Q 292 73 292 78 Q 292 73 288 73 Q 292 73 292 68 Z"
            fill="#0B2545"
          />
          {/* Star 3 (small top right) */}
          <circle cx="282" cy="115" r="2.5" fill="#0B2545" />
        </g>

        {/* === STUDENT SILHOUETTES (GIRL & BOY) === */}
        <g id="students-silhouettes" fill="#0B2545">
          {/* Girl (Left with ponytail) */}
          {/* Ponytail */}
          <path d="M 152 110 C 146 112 143 118 145 125 C 147 122 150 119 153 117 Z" />
          {/* Head & face looking up-right */}
          <circle cx="163" cy="107" r="10" />
          {/* Nose / chin profile */}
          <path d="M 170 106 Q 174 107 172 112 L 168 116 Z" />
          {/* Torso with collared shirt & backpack */}
          <path d="M 154 122 C 151 126 148 135 148 148 L 176 148 C 176 138 174 126 168 122 Z" />
          {/* Collar & backpack strap */}
          <path d="M 160 122 L 164 132 L 169 122" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <path d="M 150 130 C 146 134 146 142 148 148" stroke="#ffffff" strokeWidth="1.5" fill="none" />

          {/* Boy (Right, taller, looking up-right) */}
          {/* Head */}
          <circle cx="198" cy="88" r="13" />
          {/* Hair spikes / styled hair */}
          <path d="M 188 80 Q 194 72 203 76 Q 212 80 209 88 L 190 85 Z" />
          {/* Face profile facing right toward rocket */}
          <path d="M 207 86 Q 212 88 209 94 L 204 98 Z" />
          {/* Neck & Torso */}
          <path d="M 186 104 C 180 112 176 128 176 148 L 214 148 C 215 132 212 114 204 104 Z" />
          {/* Backpack strap line */}
          <path d="M 184 116 C 180 124 180 138 184 148" stroke="#ffffff" strokeWidth="2" fill="none" />
          <path d="M 194 104 L 198 120 L 204 106" stroke="#ffffff" strokeWidth="1.8" fill="none" />
        </g>

        {/* === ORBITING SATELLITE (TOP RIGHT) === */}
        <g id="satellite-right">
          {/* Orbit trail line extension */}
          <path
            d="M 390 120 C 400 130 405 145 408 152"
            stroke="#0B2545"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Satellite main body */}
          <g transform="translate(340, 52) rotate(32)">
            {/* Center Cube Body */}
            <rect x="22" y="10" width="18" height="22" rx="2.5" fill="#0B2545" />
            <rect x="25" y="14" width="12" height="14" rx="1.5" fill="#ffffff" opacity="0.9" />
            <circle cx="31" cy="21" r="3" fill="#0B2545" />
            {/* Top antenna dish / mast */}
            <line x1="31" y1="10" x2="31" y2="2" stroke="#0B2545" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 25 3 Q 31 6 37 3" stroke="#0B2545" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            
            {/* Left Solar Panel Array (2 cells with grid) */}
            <line x1="22" y1="21" x2="6" y2="21" stroke="#0B2545" strokeWidth="2.5" />
            <rect x="-8" y="12" width="14" height="18" rx="1" fill="#0B2545" />
            <rect x="-6" y="14" width="10" height="6" fill="#00E5FF" opacity="0.85" />
            <rect x="-6" y="22" width="10" height="6" fill="#00E5FF" opacity="0.85" />

            {/* Right Solar Panel Array (2 cells with grid) */}
            <line x1="40" y1="21" x2="56" y2="21" stroke="#0B2545" strokeWidth="2.5" />
            <rect x="56" y="12" width="14" height="18" rx="1" fill="#0B2545" />
            <rect x="58" y="14" width="10" height="6" fill="#00E5FF" opacity="0.85" />
            <rect x="58" y="22" width="10" height="6" fill="#00E5FF" opacity="0.85" />
          </g>
        </g>

        {/* === CENTRAL ASCENDING ROCKET & EXHAUST TRAIL === */}
        <g id="rocket-launch">
          {/* Fiery exhaust trail plume (Gradient Orange / Saffron) */}
          <defs>
            <linearGradient id="rocketPlumeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="50%" stopColor="#EA580C" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="sparkStarGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Exhaust plume expanding from rocket base */}
          <path
            d="M 252 82 C 248 100 242 120 236 138 L 264 138 C 258 120 252 100 248 82 Z"
            fill="url(#rocketPlumeGrad)"
          />
          <path
            d="M 250 82 C 246 95 244 115 240 135 L 260 135 C 256 115 254 95 250 82 Z"
            fill="#FED7AA"
          />

          {/* Ascending Space Rocket */}
          <g transform="translate(236, 10)">
            {/* Rocket Body Tube */}
            <rect x="10" y="22" width="8" height="40" rx="2" fill="#ffffff" stroke="#0B2545" strokeWidth="2.5" />
            {/* Nose Cone */}
            <path d="M 14 6 Q 14 14 10 22 L 18 22 Q 14 14 14 6 Z" fill="#0B2545" />
            {/* Top Windows */}
            <circle cx="14" cy="28" r="2.5" fill="#0B2545" />
            <circle cx="14" cy="36" r="2" fill="#0B2545" />
            {/* Left Wing / Fin */}
            <path d="M 10 46 L 2 60 L 10 58 Z" fill="#0B2545" />
            {/* Right Wing / Fin */}
            <path d="M 18 46 L 26 60 L 18 58 Z" fill="#0B2545" />
            {/* Rocket engine nozzle */}
            <polygon points="11,62 17,62 19,68 9,68" fill="#0B2545" />
          </g>
        </g>

        {/* === 'SPARK' TYPOGRAPHY WITH INTEGRATED LAUNCH TRIANGLE & STARBURST === */}
        <g id="spark-typography">
          {/* 'S' */}
          <path
            d="M 132 165 C 132 152 124 145 106 145 L 68 145 C 57 145 50 152 50 162 C 50 174 60 180 78 184 L 102 190 C 114 192 118 196 118 202 C 118 210 110 216 96 216 L 50 216 L 50 198 L 68 198 C 68 198 68 202 74 202 L 96 202 C 102 202 104 200 104 196 C 104 190 96 186 84 182 L 62 176 C 48 172 36 164 36 150 C 36 136 48 128 66 128 L 120 128 L 120 146 L 94 146 C 88 146 84 148 84 150 C 84 154 90 156 98 158 L 118 162 C 128 165 132 172 132 165 Z"
            fill="#0B2545"
          />

          {/* 'P' */}
          <path
            d="M 148 130 L 196 130 C 218 130 228 142 228 158 C 228 174 216 186 196 186 L 166 186 L 166 216 L 148 216 Z M 166 146 L 166 170 L 194 170 C 204 170 210 166 210 158 C 210 150 204 146 194 146 Z"
            fill="#0B2545"
          />

          {/* 'A' - Integrated Rocket Plume & Starburst Apex */}
          {/* Base Navy Left & Right legs of A */}
          <path
            d="M 250 110 L 298 216 L 278 216 L 268 192 L 232 192 L 222 216 L 202 216 Z M 250 148 L 238 178 L 262 178 Z"
            fill="#0B2545"
          />
          {/* Orange Chevron Flare behind / under 'A' */}
          <polygon
            points="250,122 316,218 184,218"
            fill="url(#rocketPlumeGrad)"
          />
          <polygon
            points="250,132 296,214 204,214"
            fill="#0B2545"
          />

          {/* 8-Point Glowing Spark / Starburst in center of 'A' */}
          <g id="center-spark">
            {/* Primary Diamond Star Flare */}
            <path
              d="M 250 165 Q 250 178 266 178 Q 250 178 250 191 Q 250 178 234 178 Q 250 178 250 165 Z"
              fill="#ffffff"
            />
            {/* Diagonal Star Flare */}
            <path
              d="M 250 178 L 260 168 M 250 178 L 260 188 M 250 178 L 240 168 M 250 178 L 240 188"
              stroke="#FFFBEB"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Central Glow Core */}
            <circle cx="250" cy="178" r="3.5" fill="#FFFBEB" />
          </g>

          {/* 'R' */}
          <path
            d="M 324 130 L 372 130 C 392 130 404 142 404 156 C 404 168 396 176 384 180 L 406 216 L 386 216 L 366 184 L 342 184 L 342 216 L 324 216 Z M 342 146 L 342 168 L 368 168 C 378 168 384 164 384 157 C 384 150 378 146 368 146 Z"
            fill="#0B2545"
          />

          {/* 'K' */}
          <path
            d="M 420 130 L 438 130 L 438 164 L 476 130 L 500 130 L 458 168 L 502 216 L 478 216 L 442 176 L 438 180 L 438 216 L 420 216 Z"
            fill="#0B2545"
          />
        </g>

        {/* === 'INDIA PROGRAM' SUBTITLE WITH TRICOLOR BARS === */}
        {showSubtitle && (
          <g id="india-program-subtext">
            {/* Left Orange (Saffron) Bar */}
            <line x1="70" y1="236" x2="120" y2="236" stroke="#F47920" strokeWidth="3" strokeLinecap="round" />

            {/* 'I N D I A   P R O G R A M' text in bold navy */}
            <text
              x="260"
              y="242"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="16"
              fill="#0B2545"
              letterSpacing="7"
            >
              INDIA PROGRAM
            </text>

            {/* Right Green Bar */}
            <line x1="400" y1="236" x2="450" y2="236" stroke="#138808" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
