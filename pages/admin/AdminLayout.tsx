
import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HomeIcon, ChartBarIcon, LogoutIcon, DatabaseIcon, ChevronDownIcon, QrCodeIcon, UserCircleIcon, MenuIcon, XIcon, CogIcon, BanknotesIcon, LeafIcon, ClipboardListIcon } from '../../components/icons';

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
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <UserCircleIcon className="text-4xl text-slate-500"/>
                <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-slate-700">{admin?.name}</p>
                    <p className="text-xs text-slate-500">Admin</p>
                </div>
                <ChevronDownIcon className={`text-lg text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-20 animate-fade-in border border-slate-200/80">
                    <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogoutIcon className="text-xl mr-3" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}

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
    
    const baseLinkClasses = "flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 font-semibold text-sm";
    const activeLinkClasses = "bg-primary text-primary-content hover:bg-primary-focus";
    const subLinkClasses = "flex items-center pl-12 pr-4 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors duration-200";
    const activeSubLinkClasses = "bg-primary-light text-primary font-semibold";

    const SidebarContent = () => (
        <>
            <div className="p-6 text-left border-b border-slate-200/80 flex justify-between items-center">
                 <div className="bg-slate-800 text-white font-bold text-lg px-3 py-1.5 rounded-md shadow-sm -skew-x-12 inline-block">
                    SapaDesa
                </div>
                 <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-500 hover:text-slate-800" aria-label="Close sidebar">
                    <XIcon className="text-2xl" />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-1.5">
                <NavLink to="/admin/dashboard" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`} >
                    <HomeIcon className="text-xl mr-4" />
                    Dashboard
                </NavLink>
                    
                <div>
                    <button onClick={() => setMasterDataOpen(!isMasterDataOpen)} className={`${baseLinkClasses} w-full justify-between ${isMasterDataOpen ? 'text-slate-800' : ''}`}>
                        <div className="flex items-center">
                            <DatabaseIcon className="text-xl mr-4" />
                            Master Data
                        </div>
                        <ChevronDownIcon className={`text-xl transition-transform ${isMasterDataOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMasterDataOpen && (
                        <ul className="mt-1 space-y-1 animate-fade-in">
                            {masterDataItems.map(item => (
                                <li key={item.name}>
                                    <NavLink to={item.path} className={({isActive}) => `${subLinkClasses} ${isActive ? activeSubLinkClasses : ''}`}>
                                        {item.name}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <NavLink to="/admin/riwayat" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`} >
                    <ClipboardListIcon className="text-xl mr-4" />
                    Riwayat Transaksi
                </NavLink>

                <NavLink to="/admin/laporan" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`} >
                    <ChartBarIcon className="text-xl mr-4" />
                    Laporan
                </NavLink>
                <NavLink to="/admin/keuangan" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`} >
                    <BanknotesIcon className="text-xl mr-4" />
                    Kelola Keuangan
                </NavLink>
                <NavLink to="/admin/cetak-barcode" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`} >
                    <QrCodeIcon className="text-xl mr-4" />
                    Cetak Barcode
                </NavLink>
                <NavLink to="/admin/pengaturan" className={({isActive}) => `${baseLinkClasses} ${isActive ? activeLinkClasses : ''}`} >
                    <CogIcon className="text-xl mr-4" />
                    Pengaturan
                </NavLink>
            </nav>
        </>
    );

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"></div>}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/80 flex flex-col z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-slate-200/80 p-4 flex justify-between items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-primary" aria-label="Open sidebar">
                        <MenuIcon className="text-2xl" />
                    </button>
                    <div className="flex-1 flex justify-end">
                        <UserMenu />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
