import React, { ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, QrCodeIcon, LogoutIcon, ClipboardListIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';


const PetugasLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { logoutPetugas } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutPetugas();
        navigate('/');
    };

    const getPageTitle = () => {
        if (location.pathname.includes('/scan')) return 'Pencatatan';
        if (location.pathname.includes('/belum-bayar')) return 'Belum Bayar';
        return 'Dashboard';
    }

    const navItems = [
        { name: 'Dashboard', path: '/petugas/dashboard', icon: HomeIcon },
        { name: 'Scan', path: '/petugas/scan', icon: QrCodeIcon },
        { name: 'Belum Bayar', path: '/petugas/belum-bayar', icon: ClipboardListIcon },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col max-w-lg mx-auto shadow-2xl">
            <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/80 p-4 sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-xl font-bold font-display text-slate-800">{getPageTitle()}</h1>
                <button 
                    onClick={handleLogout} 
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    aria-label="Logout"
                >
                    <LogoutIcon className="text-2xl" />
                </button>
            </header>
            
            <main className="flex-grow overflow-y-auto">
                {children}
            </main>
            
            <nav className="bg-white/90 backdrop-blur-lg border-t border-slate-200/80 sticky bottom-0 z-10">
                <div className="flex justify-around">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink 
                                key={item.name} 
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2 text-center transition-colors ${isActive ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
                            >
                                <item.icon className="text-2xl mb-0.5"/>
                                <span className="text-xs font-medium">{item.name}</span>
                                {isActive && <div className="w-8 h-1 bg-primary rounded-full mt-1"></div>}
                            </NavLink>
                        )
                    })}
                </div>
            </nav>
        </div>
    );
};

export default PetugasLayout;