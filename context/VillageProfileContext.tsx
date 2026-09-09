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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
