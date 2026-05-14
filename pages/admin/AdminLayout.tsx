
import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, ChartBarIcon, LogoutIcon, DatabaseIcon, ChevronDownIcon, QrCodeIcon, UserCircleIcon, MenuIcon, XIcon, CogIcon, BanknotesIcon, ClipboardListIcon, ClockIcon, EnvelopeIcon, MegaphoneIcon, UserIcon } from '@/components/icons';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const UserMenu: React.FC = () => {
    const { admin, logoutAdmin } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logoutAdmin();
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-slate-100/50 transition-all duration-300 group border border-transparent hover:border-slate-200/50"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <span className="font-bold text-lg">{admin?.name?.charAt(0) || 'A'}</span>
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{admin?.name}</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                </div>
                <ChevronDownIcon className={`text-xs text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl py-2 z-50 animate-fade-in border border-white/20 ring-1 ring-black ring-opacity-5 origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-100/50 mb-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Akun</p>
                        <p className="text-sm font-medium text-slate-800 truncate">{admin?.username}</p>
                    </div>
                    <button onClick={() => { navigate('/admin/profile'); setIsOpen(false); }} className="w-full flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors">
                        <UserIcon className="text-lg mr-3" />
                        Profil Saya
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogoutIcon className="text-lg mr-3" />
                        Keluar Aplikasi
                    </button>
                </div>
            )}
        </div>
    )
}

const LiveClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="hidden lg:flex items-center gap-3 bg-white/50 px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-md group cursor-default">
            <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                <ClockIcon className="text-sm" />
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-sm font-bold font-mono text-slate-700 group-hover:text-emerald-600 transition-colors">
                    {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')} WIB
                </span>
            </div>
        </div>
    );
};

const AdminLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const masterDataPaths = ['/admin/dukuh', '/admin/warga', '/admin/petugas'];
    const [isMasterDataOpen, setMasterDataOpen] = useState(masterDataPaths.some(p => location.pathname.startsWith(p)));
    
    useEffect(() => {
        setMasterDataOpen(masterDataPaths.some(p => location.pathname.startsWith(p)));
    }, [location.pathname]);

    useEffect(() => {
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);
    
    const masterDataItems = [
        { name: 'Data Wilayah', path: '/admin/dukuh' },
        { name: 'Data Warga', path: '/admin/warga' },
        { name: 'Data Petugas', path: '/admin/petugas' },
    ];
    
    // Styles for Navigation Links (Dark Theme)
    const baseLinkClasses = "flex items-center px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm mb-1 mx-3 relative group overflow-hidden";
    
    // Active state: Glowing background
    const activeLinkClasses = "bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/20";
    
    // Inactive state
    const inactiveLinkClasses = "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200";

    const SidebarContent = () => (
        <>
            <div className="p-8 pb-6 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-extrabold text-xl w-10 h-10 flex items-center justify-center rounded-xl shadow-lg shadow-emerald-500/30">
                        SD
                    </div>
                    <span className="font-display font-bold text-xl text-white tracking-tight">SapaDesa</span>
                 </div>
                 <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800" aria-label="Close sidebar">
                    <XIcon className="text-xl" />
                </button>
            </div>
            
            <div className="px-6 py-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-3">Menu Utama</p>
            </div>

            <nav className="flex-1 space-y-1 pb-6 overflow-y-auto custom-scrollbar">
                <NavLink to="/admin/dashboard" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/dashboard' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <HomeIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Dashboard
                </NavLink>
                    
                <div className="py-1">
                    <button 
                        onClick={() => setMasterDataOpen(!isMasterDataOpen)} 
                        className={`${baseLinkClasses} w-full justify-between ${isMasterDataOpen ? 'text-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                        <div className="flex items-center">
                            <DatabaseIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                            Master Data
                        </div>
                        <ChevronDownIcon className={`text-xs transition-transform duration-300 ${isMasterDataOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMasterDataOpen ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <ul className="space-y-1 mb-2">
                            {masterDataItems.map(item => (
                                <li key={item.name}>
                                    <NavLink 
                                        to={item.path} 
                                        className={({isActive}) => `
                                            flex items-center pl-12 pr-4 py-2.5 text-sm mx-3 rounded-lg transition-all duration-200
                                            ${isActive ? 'text-emerald-400 font-semibold bg-emerald-500/5' : 'text-slate-500 hover:text-slate-300'}
                                        `}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full mr-3 transition-colors ${location.pathname === item.path ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-600'}`}></div>
                                        {item.name}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <NavLink to="/admin/riwayat" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/riwayat' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <ClipboardListIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Riwayat Transaksi
                </NavLink>

                <NavLink to="/admin/keuangan" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/keuangan' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <BanknotesIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Keuangan
                </NavLink>
                
                <NavLink to="/admin/laporan" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/laporan' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <ChartBarIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Laporan
                </NavLink>

                <NavLink to="/admin/inbox" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/inbox' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <EnvelopeIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Kotak Masuk
                </NavLink>

                <div className="my-4 border-t border-slate-800 mx-6"></div>
                
                <div className="px-6 py-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-3">Lainnya</p>
                </div>
                
                <NavLink to="/admin/pengumuman" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/pengumuman' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <MegaphoneIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Pengumuman
                </NavLink>

                <NavLink to="/admin/cetak-barcode" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/cetak-barcode' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <QrCodeIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Cetak Barcode
                </NavLink>
                
                <NavLink to="/admin/pengaturan" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`} >
                     <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-emerald-400 transition-opacity duration-300 ${location.pathname === '/admin/pengaturan' ? 'opacity-100' : 'opacity-0'}`}></div>
                    <CogIcon className="text-lg mr-3 transition-transform group-hover:scale-110" />
                    Pengaturan
                </NavLink>
            </nav>
        </>
    );

    return (
        <div className="flex h-screen overflow-hidden font-sans text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)} 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
                ></div>
            )}

            {/* Floating Sidebar (Dock) */}
            <aside className={`
                fixed top-0 bottom-0 left-0 z-50 w-72
                transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
                md:translate-x-0 md:top-4 md:bottom-4 md:left-4 md:w-64
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full bg-[#0f172a] md:rounded-3xl shadow-2xl shadow-slate-900/20 flex flex-col border border-slate-800">
                    <SidebarContent />
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col min-w-0 md:ml-[18rem] transition-all duration-300">
                {/* Glass Header */}
                <header className="sticky top-0 z-30 glass px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center transition-all duration-300 md:mx-4 md:mt-4 md:rounded-2xl border-b md:border-b-0 border-slate-200/50">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)} 
                            className="md:hidden p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95" 
                            aria-label="Open sidebar"
                        >
                            <MenuIcon className="text-2xl" />
                        </button>
                        <div>
                            <h2 className="text-sm sm:text-lg font-bold text-slate-800 line-clamp-1">
                                {masterDataPaths.some(p => location.pathname.startsWith(p)) ? 'Master Data' : 
                                 location.pathname.includes('dashboard') ? 'Dashboard' : 
                                 location.pathname.includes('riwayat') ? 'Riwayat Transaksi' : 
                                 location.pathname.includes('keuangan') ? 'Keuangan' :
                                 location.pathname.includes('laporan') ? 'Laporan' :
                                 location.pathname.includes('inbox') ? 'Kotak Masuk' :
                                 location.pathname.includes('pengumuman') ? 'Pengumuman' :
                                 location.pathname.includes('profile') ? 'Profil Saya' :
                                 location.pathname.includes('barcode') ? 'Cetak Barcode' : 'Pengaturan'}
                            </h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <LiveClock />
                        <UserMenu />
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto animate-fade-in pb-10">
                        {children}
                    </div>
                </main>
                <PWAInstallPrompt />
            </div>
        </div>
    );
};

export default AdminLayout;
