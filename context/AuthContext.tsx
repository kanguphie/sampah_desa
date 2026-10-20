
import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { Admin, Petugas } from '../types';

interface AuthContextType {
  admin: Admin | null;
  petugas: Petugas | null;
  loginAdmin: (admin: Admin) => void;
  logoutAdmin: () => void;
  loginPetugas: (petugas: Petugas) => void;
  logoutPetugas: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(() => {
    const storedAdmin = sessionStorage.getItem('admin');
    return storedAdmin ? JSON.parse(storedAdmin) : null;
  });
  const [petugas, setPetugas] = useState<Petugas | null>(() => {
    const storedPetugas = sessionStorage.getItem('petugas');
    return storedPetugas ? JSON.parse(storedPetugas) : null;
  });

  const loginAdmin = (adminData: Admin) => {
    setAdmin(adminData);
    sessionStorage.setItem('admin', JSON.stringify(adminData));
  };

  const logoutAdmin = () => {
    setAdmin(null);
    sessionStorage.removeItem('admin');
    sessionStorage.removeItem('auth_token');
  };

  const loginPetugas = (petugasData: Petugas) => {
    setPetugas(petugasData);
    sessionStorage.setItem('petugas', JSON.stringify(petugasData));
  };

  const logoutPetugas = () => {
    setPetugas(null);
    sessionStorage.removeItem('petugas');
    sessionStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ admin, petugas, loginAdmin, logoutAdmin, loginPetugas, logoutPetugas }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
