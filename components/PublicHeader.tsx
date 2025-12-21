
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MenuIcon, XIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from './icons';
import Modal from './Modal';
import { useAuth } from '@/context/AuthContext';
import { loginPetugas, loginAdmin } from '@/services/api';

const PublicHeader: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [credential, setCredential] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    
    const location = useLocation();
    const navigate = useNavigate();
    const { loginAdmin: authLoginAdmin, loginPetugas: authLoginPetugas } = useAuth();

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!credential) { setLoginError('PIN atau Password tidak boleh kosong.'); return; }
        setLoginLoading(true);
        setLoginError('');
        try {
            const petugas = await loginPetugas(credential);
            if (petugas) { authLoginPetugas(petugas); navigate('/petugas/dashboard'); return; }
            const admin = await loginAdmin('admin', credential);
            if (admin) { authLoginAdmin(admin); navigate('/admin/dashboard'); return; }
            setLoginError('PIN atau Password salah.');
            setCredential('');
        } catch (err) {
            setLoginError('Terjadi kesalahan. Silakan coba lagi.');
            setCredential('');
        } finally {
            setLoginLoading(false);
        }
    };

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
                                onClick={() => setIsLoginModalOpen(true)} 
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

            {/* Mobile Menu Overlay - Slick modern slide-down */}
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
                                onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
                                className="mt-4 w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-900/20"
                            >
                                Login Sistem Desa
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Akses Sistem SapaDesa">
                <form onSubmit={handleLoginSubmit} className="space-y-6 py-4">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-slate-200 -rotate-6 font-black text-3xl transition-transform hover:rotate-0">SD</div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Otentikasi Petugas & Admin</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1" htmlFor="credential">PIN atau Password Akses</label>
                        <div className="relative group">
                            <input 
                                id="credential" 
                                type={isPasswordVisible ? 'text' : 'password'} 
                                value={credential} 
                                onChange={(e) => setCredential(e.target.value)} 
                                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 font-black text-xl transition-all" 
                                placeholder="••••••"
                                required 
                                autoFocus 
                            />
                            <button 
                                type="button" 
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)} 
                                className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-emerald-500 transition-colors"
                            >
                                {isPasswordVisible ? <EyeOffIcon className="text-xl" /> : <EyeIcon className="text-xl" />}
                            </button>
                        </div>
                    </div>

                    {loginError && (
                        <p className="text-rose-500 text-[11px] font-black text-center bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-shake">
                            {loginError}
                        </p>
                    )}

                    <button 
                        type="submit" 
                        disabled={loginLoading} 
                        className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-5 px-4 rounded-[2rem] shadow-xl shadow-slate-200 transition-all duration-500 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:bg-slate-300"
                    >
                        {loginLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>Masuk ke Dashboard <CheckCircleIcon /></>
                        )}
                    </button>
                </form>
            </Modal>
        </>
    );
};

export default PublicHeader;
