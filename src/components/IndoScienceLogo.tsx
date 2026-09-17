import React from 'react';

interface IndoScienceLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
}

export const IndoScienceLogo: React.FC<IndoScienceLogoProps> = ({
  className = '',
  size = 'md',
  showSubtext = true
}) => {
  const sizeStyles = {
    xs: { height: '26px', className: 'h-6 sm:h-7' },
    sm: { height: '38px', className: 'h-9 sm:h-10 md:h-11' },
    md: { height: '52px', className: 'h-12 sm:h-14 md:h-16' },
    lg: { height: '76px', className: 'h-16 sm:h-20 md:h-24' },
    xl: { height: '110px', className: 'h-24 sm:h-32 md:h-40' }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 select-none ${className}`}
      title="Indo Science Education Trust - Reg. No. Maharashtra/758/2012/Pune, F-37745"
      style={{ minHeight: currentSize.height }}
    >
      <svg
        viewBox="0 0 1060 380"
        className={`${currentSize.className} w-auto block`}
        style={{
          height: currentSize.height,
          width: 'auto',
          aspectRatio: '1060 / 380',
          maxHeight: '100%'
        }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Indo Science Education Trust Logo"
      >
        <defs>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@800;900&family=Montserrat:wght@500;600;700;800&family=Outfit:wght@500;600;700&display=swap');
              .is-serif-title {
                font-family: 'Cinzel', 'Times New Roman', Times, Georgia, serif;
                font-weight: 900;
              }
              .is-sans-sub {
                font-family: 'Outfit', 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              }
              .is-reg-text {
                font-family: 'Montserrat', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-weight: 700;
              }
            `}
          </style>
        </defs>

        {/* Clean White Background for contrast & crisp presentation */}
        <rect width="1060" height="380" fill="#FFFFFF" rx="8" />

        {/* ======================================================== */}
        {/* 1. LEFT SOLID ORANGE BOX ('iS') */}
        {/* ======================================================== */}
        <rect x="10" y="8" width="195" height="305" rx="4" fill="#F15A24" />

        {/* Floating bubbles above 'i' test tube */}
        <circle cx="62" cy="72" r="10" stroke="#FFFFFF" strokeWidth="5" fill="none" />
        <circle cx="48" cy="85" r="5" stroke="#FFFFFF" strokeWidth="3.5" fill="none" />

        {/* 'i' Test Tube Outline & Lip */}
        <rect x="42" y="98" width="40" height="8" rx="3" fill="#FFFFFF" />
        <rect x="46" y="104" width="32" height="110" rx="16" fill="none" stroke="#FFFFFF" strokeWidth="6.5" />

        {/* Bubbles rising inside Test Tube */}
        <circle cx="62" cy="190" r="7" stroke="#FFFFFF" strokeWidth="3.5" fill="none" />
        <circle cx="54" cy="165" r="4.5" stroke="#FFFFFF" strokeWidth="3" fill="none" />
        <circle cx="69" cy="145" r="4" stroke="#FFFFFF" strokeWidth="3" fill="none" />
        <circle cx="58" cy="128" r="3.5" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />

        {/* Bold White 'S' Glyph */}
        <path
          d="M 166 116 C 160 104 148 98 132 98 C 114 98 100 108 100 124 C 100 148 168 140 168 178 C 168 204 144 218 122 218 C 104 218 88 208 84 194 L 102 186 C 105 194 112 201 123 201 C 136 201 148 193 148 180 C 148 158 80 164 80 124 C 80 101 102 83 132 83 C 154 83 172 95 178 110 Z"
          fill="#FFFFFF"
        />

        {/* ======================================================== */}
        {/* 2. TOP ROW: "INDO" */}
        {/* ======================================================== */}
        {/* "IND" in Charcoal */}
        <text
          x="220"
          y="112"
          className="is-serif-title"
          fontSize="122"
          fontWeight="900"
          fill="#2B2F33"
          letterSpacing="-1"
        >
          IND
        </text>

        {/* Floating Orange Bubbles near Globe */}
        <circle cx="510" cy="80" r="14" stroke="#F15A24" strokeWidth="4.5" fill="none" />
        <circle cx="494" cy="98" r="8" stroke="#F15A24" strokeWidth="3.5" fill="none" />

        {/* Orange Wireframe Globe ('O') */}
        <g transform="translate(585, 75)">
          {/* Outer Ring */}
          <circle cx="0" cy="0" r="40" stroke="#F15A24" strokeWidth="6" fill="none" />
          {/* Equator */}
          <ellipse cx="0" cy="0" rx="40" ry="8" stroke="#F15A24" strokeWidth="4.5" fill="none" />
          {/* Top & Bottom Latitude Arcs */}
          <path d="M -34 -18 Q 0 -6 34 -18" stroke="#F15A24" strokeWidth="4.5" fill="none" />
          <path d="M -34 18 Q 0 6 34 18" stroke="#F15A24" strokeWidth="4.5" fill="none" />
          {/* Meridians */}
          <ellipse cx="0" cy="0" rx="20" ry="40" stroke="#F15A24" strokeWidth="4.5" fill="none" />
          <line x1="0" y1="-40" x2="0" y2="40" stroke="#F15A24" strokeWidth="4.5" />
        </g>

        {/* ======================================================== */}
        {/* 3. MIDDLE ROW: "SCIENCE" */}
        {/* ======================================================== */}
        {/* "SC" in Charcoal */}
        <text
          x="220"
          y="232"
          className="is-serif-title"
          fontSize="124"
          fontWeight="900"
          fill="#2B2F33"
          letterSpacing="-2"
        >
          SC
        </text>

        {/* Stylized Orange Test Tube / Flask ('I') */}
        <g transform="translate(444, 130)">
          {/* Floating bubbles above 'I' */}
          <circle cx="20" cy="-6" r="6" stroke="#F15A24" strokeWidth="3" fill="none" />
          <circle cx="30" cy="6" r="4" stroke="#F15A24" strokeWidth="2.5" fill="none" />
          
          {/* Lip at top */}
          <rect x="6" y="10" width="34" height="6" rx="2" fill="#F15A24" />
          {/* Cylinder Neck */}
          <rect x="12" y="14" width="22" height="52" fill="#F15A24" />
          {/* Flared Conical Base */}
          <path d="M 12 64 L 3 92 Q 23 96 43 92 L 34 64 Z" fill="#F15A24" />
          
          {/* White internal bubbles */}
          <circle cx="23" cy="74" r="4" fill="#FFFFFF" />
          <circle cx="18" cy="52" r="3" fill="#FFFFFF" />
          <circle cx="27" cy="36" r="2.5" fill="#FFFFFF" />
        </g>

        {/* "ENC" in Charcoal */}
        <text
          x="500"
          y="232"
          className="is-serif-title"
          fontSize="124"
          fontWeight="900"
          fill="#2B2F33"
          letterSpacing="-2"
        >
          ENC
        </text>

        {/* Stylized Lightbulb with Pencil ('e') */}
        <g transform="translate(865, 185)">
          {/* Lightbulb glass envelope */}
          <path
            d="M -38 -20 C -38 -45 -18 -62 10 -62 C 38 -62 58 -45 58 -20 C 58 2 44 18 36 32 L 32 46 L -12 46 L -16 32 C -24 18 -38 2 -38 -20 Z"
            fill="none"
            stroke="#2B2F33"
            strokeWidth="6.5"
            strokeLinejoin="round"
          />

          {/* Lowercase 'e' centered inside the bulb */}
          <text
            x="10"
            y="-8"
            className="is-serif-title"
            fontSize="78"
            fontWeight="900"
            fill="#2B2F33"
            textAnchor="middle"
          >
            e
          </text>

          {/* Screw thread ridges */}
          <path d="M -10 50 L 30 50" stroke="#2B2F33" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M -8 57 L 28 57" stroke="#2B2F33" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M -5 64 L 25 64" stroke="#2B2F33" strokeWidth="4.5" strokeLinecap="round" />

          {/* Angled Wooden Pencil attached below */}
          <g transform="translate(36, 68) rotate(48)">
            {/* Orange wooden pencil body */}
            <rect x="-8" y="0" width="16" height="42" fill="#E28D38" rx="1" />
            <line x1="-3" y1="0" x2="-3" y2="42" stroke="#C86A1B" strokeWidth="1.5" />
            <line x1="3" y1="0" x2="3" y2="42" stroke="#F5A855" strokeWidth="1.5" />
            {/* Sharpened light wood collar */}
            <polygon points="-8,42 8,42 0,58" fill="#FDE68A" />
            {/* Dark graphite lead tip */}
            <polygon points="-3,52 3,52 0,58" fill="#2B2F33" />
          </g>
        </g>

        {/* ======================================================== */}
        {/* 4. LINE 3: "Education Trust" */}
        {/* ======================================================== */}
        <text
          x="220"
          y="300"
          className="is-sans-sub"
          fontSize="64"
          fontWeight="500"
          fill="#2B2F33"
          letterSpacing="0.5"
        >
          Education Trust
        </text>

        {/* ======================================================== */}
        {/* 5. LINE 4: Bottom Registration Line */}
        {/* ======================================================== */}
        {showSubtext && (
          <text
            x="10"
            y="358"
            className="is-reg-text"
            fontSize="33"
            fontWeight="700"
            fill="#1E2328"
            letterSpacing="-0.2"
          >
            Reg. No. Maharashtra/758/2012/Pune, F-37745
          </text>
        )}
      </svg>
    </div>
  );
};
