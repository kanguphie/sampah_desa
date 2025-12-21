
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MenuIcon, XIcon, ScaleBalancedIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from './icons';
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
        { name: 'Cek Iuran', path: '/', icon: null },
        { name: 'Laporan Publik', path: '/laporan-publik', icon: <ScaleBalancedIcon className="text-emerald-500" /> },
        { name: 'Tips Sampah', path: '/tips', icon: null },
        { name: 'Kontak Kami', path: '/contact', icon: null },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center">
                        <div className="bg-slate-800 text-white font-bold text-base md:text-lg px-3 md:px-4 py-1.5 md:py-2 rounded-md shadow-sm -skew-x-12 hover:scale-105 transition-transform">SapaDesa</div>
                    </Link>
                    
                    <nav className="hidden lg:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.path} 
                                to={link.path} 
                                className={`flex items-center gap-2 transition-colors font-black text-sm ${isActive(link.path) ? 'text-primary' : 'text-slate-600 hover:text-primary'}`}
                            >
                                {link.icon}
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button 
                            onClick={() => setIsLoginModalOpen(true)} 
                            className="bg-slate-100 text-slate-700 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-2 md:py-2.5 rounded-xl hover:bg-slate-200 transition-colors shadow-sm border border-slate-200"
                        >
                            <span className="hidden xs:inline">Login Sistem</span>
                            <span className="xs:hidden">Login</span>
                        </button>
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            className="lg:hidden p-2 text-slate-600 hover:text-primary transition-colors" 
                            aria-label="Open menu"
                        >
                            <MenuIcon className="text-xl md:text-2xl" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-fade-in lg:hidden">
                    <div className="flex justify-between items-center p-4 border-b">
                        <div className="bg-slate-800 text-white font-bold text-lg px-4 py-2 rounded-md shadow-sm -skew-x-12">SapaDesa</div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600" aria-label="Close menu"><XIcon className="text-2xl" /></button>
                    </div>
                    <nav className="flex flex-col items-center justify-center flex-grow space-y-8 md:space-y-10 p-6">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.path} 
                                to={link.path} 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`text-2xl md:text-3xl font-black flex items-center gap-4 ${isActive(link.path) ? 'text-primary' : 'text-slate-800'}`}
                            >
                                {link.icon && <span className="text-3xl md:text-4xl">{link.icon}</span>}
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}

            {/* Login Modal */}
            <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Login Sistem Desa">
                <form onSubmit={handleLoginSubmit} className="space-y-6 md:space-y-8 py-2 md:py-4">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl -skew-x-12 font-black text-2xl md:text-3xl">SD</div>
                        <p className="text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-widest">Panel Petugas & Admin</p>
                    </div>
                    <div>
                        <label className="block text-slate-700 font-black text-[10px] uppercase tracking-widest mb-2 md:mb-3 ml-1" htmlFor="credential">PIN / Password Akses</label>
                        <div className="relative group">
                            <input id="credential" type={isPasswordVisible ? 'text' : 'password'} value={credential} onChange={(e) => setCredential(e.target.value)} className="w-full px-5 md:px-6 py-4 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-black text-lg md:text-xl transition-all" required autoFocus />
                            <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 pr-5 md:pr-6 flex items-center text-slate-400 hover:text-primary transition-colors">
                                {isPasswordVisible ? <EyeOffIcon className="text-xl" /> : <EyeIcon className="text-xl" />}
                            </button>
                        </div>
                    </div>
                    {loginError && <p className="text-rose-500 text-[10px] md:text-xs font-black text-center bg-rose-50 p-3 md:p-4 rounded-xl md:rounded-2xl border-2 border-rose-100 animate-shake">{loginError}</p>}
                    <button type="submit" disabled={loginLoading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 md:py-5 px-4 rounded-2xl md:rounded-3xl shadow-2xl shadow-slate-900/40 disabled:bg-slate-400 transition-all duration-300 uppercase tracking-widest text-xs md:text-sm flex items-center justify-center gap-3">
                        {loginLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircleIcon />}
                        Masuk ke Sistem
                    </button>
                </form>
            </Modal>
        </>
    );
};

export default PublicHeader;
