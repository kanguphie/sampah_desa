
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MenuIcon, XIcon, UserCircleIcon } from './icons';

const Wordmark: React.FC = () => (
    <span className="relative inline-block text-[1.9rem] leading-none font-black tracking-tight select-none">
        <span className="text-[#0b5e57]">Sapa</span><span className="text-emerald-500">Desa</span>
        <svg className="absolute -top-[0.5rem] left-[4.02rem] w-6 h-6 text-emerald-500 -rotate-[18deg]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.5 3.5C11 3.5 4.5 10 4.5 20.5 14 20.5 20.5 14 20.5 3.5Z" />
            <path d="M4.5 20.5C7 14.5 11 10 17.5 6.5" stroke="#ffffff" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        </svg>
    </span>
);

const PublicHeader: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navLinks = [
        { name: 'Cek Iuran', path: '/' },
        { name: 'Laporan Publik', path: '/laporan-publik' },
        { name: 'Tips Sampah', path: '/tips' },
        { name: 'Kontak Kami', path: '/contact' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/40 backdrop-blur-xl border-b border-white/50">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="flex h-20 items-center justify-between">
                        {/* Logo Area */}
                        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
                            <Wordmark />
                        </Link>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.path} 
                                    to={link.path} 
                                    className={`relative px-5 py-2 text-sm font-bold transition-all duration-300 rounded-lg hover:bg-slate-50 ${
                                        isActive(link.path) 
                                        ? 'text-emerald-600' 
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {link.name}
                                    {isActive(link.path) && (
                                        <span className="absolute -bottom-1.5 left-5 right-5 h-[3px] bg-emerald-500 rounded-full"></span>
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="hidden sm:flex items-center gap-2.5 bg-white text-slate-700 text-sm font-bold px-5 py-2.5 rounded-full border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 transition-all duration-300 shadow-sm"
                            >
                                <UserCircleIcon className="text-emerald-500 text-lg" />
                                Login Sistem
                                <i className="fa-solid fa-arrow-right text-xs text-slate-400"></i>
                            </button>
                            
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)} 
                                className="lg:hidden p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all" 
                                aria-label="Open menu"
                            >
                                <MenuIcon className="text-xl" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden animate-fade-in">
                    <div className="fixed inset-x-0 top-0 bg-white shadow-2xl rounded-b-[2.5rem] p-6 animate-slide-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <Wordmark />
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                                <XIcon className="text-xl" />
                            </button>
                        </div>
                        <nav className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link 
                                    key={link.path} 
                                    to={link.path} 
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-6 py-4 rounded-2xl text-lg font-black transition-all ${
                                        isActive(link.path) 
                                        ? 'bg-emerald-50 text-emerald-600' 
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <button 
                                onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                                className="mt-4 w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20"
                            >
                                Login Sistem Desa
                            </button>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
};

export default PublicHeader;
