import React from 'react';
import { useVillageProfile } from '@/context/VillageProfileContext';

interface BrandLogoProps {
  variant?: 'emblem' | 'horizontal' | 'icon-only';
  className?: string;
  imageClassName?: string;
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  className = '',
  imageClassName = '',
  showTagline = true,
}) => {
  const { profile } = useVillageProfile();
  const [appImgFailed, setAppImgFailed] = React.useState(false);
  const [horizontalImgFailed, setHorizontalImgFailed] = React.useState(false);

  const rawTitle = profile?.branding_title;
  const rawSubtitle = profile?.branding_subtitle;

  const title = (rawTitle && !rawTitle.startsWith('/uploads/') && !rawTitle.match(/\.(png|jpe?g|webp|svg)$/i)) 
    ? rawTitle 
    : 'SapaDesa';

  const subtitle = (rawSubtitle && !rawSubtitle.startsWith('/uploads/') && !rawSubtitle.match(/\.(png|jpe?g|webp|svg)$/i)) 
    ? rawSubtitle 
    : 'Platform Pengelolaan Sampah Desa';

  const logoAppUrl = !appImgFailed ? profile?.logo_url : null;
  const logoHorizontalUrl = !horizontalImgFailed ? profile?.logo_horizontal_url : null;

  // 1. Icon Only Variant (For avatars, compact sidebar, mobile header icon)
  if (variant === 'icon-only') {
    if (logoAppUrl) {
      return (
        <div className={`inline-flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
          <img
            src={logoAppUrl}
            alt={title}
            className={`object-contain max-h-full max-w-full ${imageClassName}`}
            onError={() => setAppImgFailed(true)}
          />
        </div>
      );
    }
    return (
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 p-2 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center ${className}`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="6" strokeDasharray="4 2" />
          <path d="M50 25L25 45H32V75H68V45H75L50 25Z" fill="currentColor" opacity="0.9" />
          <rect x="44" y="55" width="12" height="20" rx="2" fill="#047857" />
          <path d="M50 16C50 16 65 24 68 38C58 35 50 30 50 16Z" fill="#a7f3d0" />
          <path d="M50 16C50 16 35 24 32 38C42 35 50 30 50 16Z" fill="#a7f3d0" />
        </svg>
      </div>
    );
  }

  // 2. Emblem Variant (Circular Emblem Logo as shown on the left of sample image)
  if (variant === 'emblem') {
    if (logoAppUrl) {
      return (
        <div className={`flex flex-col items-center text-center ${className}`}>
          <div className="relative flex items-center justify-center p-1 rounded-2xl">
            <img
              src={logoAppUrl}
              alt={title}
              className={`object-contain max-h-36 max-w-36 drop-shadow-sm ${imageClassName}`}
              onError={() => setAppImgFailed(true)}
            />
          </div>
          {showTagline && (
            <div className="mt-3">
              <span className="block font-black text-2xl tracking-tight text-slate-800">
                <span className="text-teal-700">Sapa</span>
                <span className="text-emerald-600">Desa</span>
              </span>
              <p className="text-xs font-semibold text-slate-500 tracking-wide mt-0.5">
                {subtitle}
              </p>
            </div>
          )}
        </div>
      );
    }

    // Default vector representation styled like the tree-house emblem in the reference
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-b from-teal-50/80 to-emerald-50/80 border-2 border-emerald-100 flex items-center justify-center p-3 shadow-inner">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow">
            {/* Outer Leaves Ring */}
            <circle cx="100" cy="100" r="92" stroke="#0d9488" strokeWidth="4" strokeOpacity="0.3" strokeDasharray="6 4" />
            {/* Foliage leaves */}
            <path d="M100 25C115 45 130 50 145 45C140 65 130 75 110 75C100 55 100 35 100 25Z" fill="#059669" opacity="0.85" />
            <path d="M100 25C85 45 70 50 55 45C60 65 70 75 90 75C100 55 100 35 100 25Z" fill="#0d9488" opacity="0.85" />
            <path d="M45 70C55 90 65 95 80 90C75 110 60 115 45 105C40 90 40 75 45 70Z" fill="#059669" opacity="0.75" />
            <path d="M155 70C145 90 135 95 120 90C125 110 140 115 155 105C160 90 160 75 155 70Z" fill="#0d9488" opacity="0.75" />
            {/* Center House Outline */}
            <path d="M100 65L62 98V145H138V98L100 65Z" fill="#0284c7" opacity="0.15" />
            <path d="M100 65L62 98H74V145H126V98H138L100 65Z" stroke="#0369a1" strokeWidth="6" strokeLinejoin="round" />
            {/* Chimney */}
            <path d="M120 80V68H128V87" stroke="#0369a1" strokeWidth="5" strokeLinecap="round" />
            {/* Window */}
            <rect x="91" y="105" width="18" height="18" rx="3" stroke="#0369a1" strokeWidth="4" fill="white" />
            <line x1="100" y1="105" x2="100" y2="123" stroke="#0369a1" strokeWidth="2" />
            <line x1="91" y1="114" x2="109" y2="114" stroke="#0369a1" strokeWidth="2" />
            {/* Lower roots intertwining */}
            <path d="M60 145C60 165 90 175 100 175C110 175 140 165 140 145" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
            <path d="M40 135C50 160 80 168 100 168C120 168 150 160 160 135" stroke="#0d9488" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </div>
        {showTagline && (
          <div className="mt-3">
            <h2 className="font-black text-2xl tracking-tight text-slate-800">
              <span className="text-teal-700">Sapa</span>
              <span className="text-emerald-600">Desa</span>
            </h2>
            <p className="text-xs font-semibold text-slate-500 tracking-wide mt-0.5">
              {subtitle}
            </p>
          </div>
        )}
      </div>
    );
  }

  // 3. Horizontal Branding Variant (Wordmark on the right of sample image)
  if (logoHorizontalUrl) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src={logoHorizontalUrl}
          alt={title}
          className={`object-contain max-h-12 w-auto ${imageClassName}`}
          onError={() => setHorizontalImgFailed(true)}
        />
      </div>
    );
  }

  // Default stylized horizontal typography matching the reference image "SapaDesa"
  return (
    <div className={`inline-flex items-center gap-2 font-black tracking-tight ${className}`}>
      {logoAppUrl ? (
        <img 
          src={logoAppUrl} 
          alt={title} 
          className="w-8 h-8 object-contain rounded-lg" 
          onError={() => setAppImgFailed(true)}
        />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
          SD
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-2xl font-black leading-none tracking-tight">
          <span className="text-teal-700">Sapa</span>
          <span className="text-emerald-600 font-extrabold">Desa</span>
        </span>
        {showTagline && subtitle && (
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
            {profile?.name ? `Desa ${profile.name}` : subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
