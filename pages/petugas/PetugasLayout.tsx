
import React, { ReactNode, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { HomeIcon, QrCodeIcon, LogoutIcon, ClipboardListIcon, UserIcon, WifiOffIcon } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';


const PetugasLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const { logoutPetugas } = useAuth();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleStatusChange = () => {
            setIsOnline(navigator.onLine);
        };
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    const handleLogout = () => {
        logoutPetugas();
        navigate('/');
    };

    const getPageTitle = () => {
        if (location.pathname.includes('/scan')) return 'Pencatatan';
        if (location.pathname.includes('/belum-bayar')) return 'Belum Bayar';
        if (location.pathname.includes('/profile')) return 'Profil Saya';
        return 'Dashboard';
    }

    const navItems = [
        { name: 'Home', path: '/petugas/dashboard', icon: HomeIcon },
        { name: 'Scan', path: '/petugas/scan', icon: QrCodeIcon },
        { name: 'Tagihan', path: '/petugas/belum-bayar', icon: ClipboardListIcon },
        { name: 'Profil', path: '/petugas/profile', icon: UserIcon },
    ];

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col max-w-lg mx-auto shadow-2xl">
            <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/80 p-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold font-display text-slate-800">{getPageTitle()}</h1>
                    {!isOnline && (
                        <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold border border-amber-200">
                            <WifiOffIcon className="text-xs"/> Offline
                        </span>
                    )}
                </div>
                <button 
                    onClick={handleLogout} 
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    aria-label="Logout"
                >
                    <LogoutIcon className="text-2xl" />
                </button>
            </header>
            
            <main className="flex-grow overflow-y-auto pb-20">
                {children}
            </main>
            
            <nav className="bg-white/90 backdrop-blur-lg border-t border-slate-200/80 fixed bottom-0 z-20 w-full max-w-lg">
                <div className="flex justify-around">
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavLink 
                                key={item.name} 
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center pt-3 pb-3 text-center transition-colors ${isActive ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
                            >
                                <item.icon className={`text-2xl mb-1 ${isActive ? 'scale-110' : ''} transition-transform`}/>
                                <span className="text-[10px] font-medium uppercase tracking-wide">{item.name}</span>
                            </NavLink>
                        )
                    })}
                </div>
            </nav>
        </div>
    );
};

export default PetugasLayout;
