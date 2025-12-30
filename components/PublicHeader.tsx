
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MenuIcon, XIcon } from './icons';

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
            <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="flex h-20 items-center justify-between">
                        {/* Logo Area */}
                        <Link to="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.02]">
                            <div className="bg-slate-900 text-white font-black text-lg px-4 py-2 rounded-xl shadow-lg shadow-slate-200 -skew-x-6 group-hover:bg-emerald-600 transition-colors">
                                SapaDesa
                            </div>
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
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => navigate('/login')} 
                                className="hidden sm:flex items-center bg-white text-slate-700 text-[11px] font-black uppercase tracking-[0.1em] px-6 py-2.5 rounded-full border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all duration-300 shadow-sm"
                            >
                                Login Sistem
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
                            <div className="bg-slate-900 text-white font-bold text-base px-4 py-2 rounded-lg">SapaDesa</div>
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
