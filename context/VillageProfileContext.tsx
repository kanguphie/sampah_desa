import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { getVillageProfile, updateVillageProfile } from '@/services/api';
import type { VillageProfile } from '@/types';

interface VillageProfileContextType {
  profile: VillageProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  saveProfile: (data: Partial<VillageProfile>) => Promise<boolean>;
}

const VillageProfileContext = createContext<VillageProfileContextType | undefined>(undefined);

export const VillageProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<VillageProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getVillageProfile();
      if (data && typeof data === 'object') {
        setProfile(data);
      }
    } catch (err) {
      console.warn('[VillageProfileContext] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFavicon = useCallback((url: string | null | undefined) => {
    if (typeof document === 'undefined') return;

    const isValid = Boolean(
      url && 
      typeof url === 'string' && 
      (url.startsWith('/uploads/') || url.startsWith('http') || url.startsWith('data:'))
    );

    const targetUrl = isValid ? (url as string) : '/favicon.svg';

    try {
      if (isValid) {
        localStorage.setItem('sapadesa_custom_favicon', targetUrl);
      } else {
        localStorage.removeItem('sapadesa_custom_favicon');
      }
    } catch (e) {}

    // Determine MIME type based on file extension
    const cleanExt = targetUrl.split('?')[0].toLowerCase();
    let mimeType = 'image/svg+xml';
    if (cleanExt.endsWith('.png')) mimeType = 'image/png';
    else if (cleanExt.endsWith('.jpg') || cleanExt.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (cleanExt.endsWith('.webp')) mimeType = 'image/webp';
    else if (cleanExt.endsWith('.ico')) mimeType = 'image/x-icon';

    // Remove existing favicon links to force browser tab redraw
    const oldIcons = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
    oldIcons.forEach(el => el.remove());

    // Create fresh <link rel="icon">
    const newIcon = document.createElement('link');
    newIcon.id = 'app-favicon';
    newIcon.rel = 'icon';
    newIcon.type = mimeType;
    // Append timestamp parameter if custom upload to avoid aggressive browser cache
    newIcon.href = isValid ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}v=${Date.now()}` : targetUrl;
    document.head.appendChild(newIcon);

    // Create shortcut icon for legacy browsers
    const newShortcut = document.createElement('link');
    newShortcut.id = 'app-shortcut-icon';
    newShortcut.rel = 'shortcut icon';
    newShortcut.type = mimeType;
    newShortcut.href = newIcon.href;
    document.head.appendChild(newShortcut);

    // Update apple-touch-icon
    let appleIcon = document.getElementById('app-apple-touch-icon') as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.id = 'app-apple-touch-icon';
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = targetUrl;
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Synchronize favicon whenever profile is loaded or logo_url changes
  useEffect(() => {
    if (profile) {
      updateFavicon(profile.logo_url);
    }
  }, [profile?.logo_url, updateFavicon]);

  const saveProfile = async (data: Partial<VillageProfile>): Promise<boolean> => {
    try {
      await updateVillageProfile(data);
      await fetchProfile();
      return true;
    } catch (err) {
      console.error('[VillageProfileContext] Save error:', err);
      return false;
    }
  };

  return (
    <VillageProfileContext.Provider
      value={{
        profile,
        loading,
        refreshProfile: fetchProfile,
        saveProfile
      }}
    >
      {children}
    </VillageProfileContext.Provider>
  );
};

export const useVillageProfile = () => {
  const context = useContext(VillageProfileContext);
  if (context === undefined) {
    // Return a safe fallback so components don't crash if mounted outside provider
    return {
      profile: {
        id: 1,
        name: 'Rowosari',
        district: 'Limpung',
        regency: 'Batang',
        address: '',
        phone: '',
        email: '',
        branding_title: 'SapaDesa',
        branding_subtitle: 'Platform Pengelolaan Sampah Desa'
      } as VillageProfile,
      loading: false,
      refreshProfile: async () => {},
      saveProfile: async () => false
    };
  }
  return context;
};
