
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { loginAdmin, loginPetugas } from '@/services/api';

const UnifiedLoginPage: React.FC = () => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { loginAdmin: authLoginAdmin, loginPetugas: authLoginPetugas } = useAuth();

    const processLogin = useCallback(async (currentPin: string) => {
        setLoading(true);
        setError('');

        let loginSuccess = false;

        try {
            // 1. Try Admin Login
            try {
                const admin = await loginAdmin(currentPin);
                if (admin) {
                    authLoginAdmin(admin);
                    navigate('/admin/dashboard');
                    loginSuccess = true;
                    return;
                }
            } catch (adminErr: any) {
                // Ignore 401 errors for Admin, we will try Petugas next
                // If the error message is NOT related to PIN/Credentials, it might be a connection issue
                if (!adminErr.message.toLowerCase().includes('pin') && !adminErr.message.toLowerCase().includes('database belum terisi')) {
                    throw adminErr; // Re-throw to be caught by the outer catch (Connection Error)
                }
            }

            // 2. Try Petugas Login
            try {
                const petugas = await loginPetugas(currentPin);
                if (petugas) {
                    authLoginPetugas(petugas);
                    navigate('/petugas/dashboard');
                    loginSuccess = true;
                    return;
                }
            } catch (petugasErr: any) {
                // If it's a real connection error (not just a wrong PIN), throw it
                if (!petugasErr.message.toLowerCase().includes('pin')) {
                    throw petugasErr;
                }
            }

            // 3. If we reached here, both failed with "Wrong PIN"
            if (!loginSuccess) {
                setError('PIN Tidak Terdaftar');
                setTimeout(() => {
                    setPin('');
                    setError('');
                }, 2000);
            }
            
        } catch (err: any) {
            console.error("Login connection error:", err);
            setError('Gangguan Koneksi');
            setPin('');
        } finally {
            setLoading(false);
        }
    }, [authLoginAdmin, authLoginPetugas, navigate]);

    const handleNumberClick = (num: string) => {
        if (loading || pin.length >= 6) return;
        
        const nextPin = pin + num;
        setPin(nextPin);
        setError('');

        // Strictly check only when 6 digits are reached
        if (nextPin.length === 6) {
            processLogin(nextPin);
        }
    };

    const handleDelete = () => {
        if (loading) return;
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    const handleClear = () => {
        if (loading) return;
        setPin('');
        setError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50"></div>

            <div className="w-full max-w-sm relative z-10">
                <div className="text-center mb-10 animate-fade-in">
                    <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl -rotate-6 font-black text-3xl">SD</div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">SapaDesa</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Akses Sistem Terpadu</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl shadow-slate-200/60 border border-white animate-slide-in-up">
                    <div className="mb-10 text-center">
                        <div className={`flex justify-center gap-4 h-12 items-center ${error ? 'animate-shake' : ''}`}>
                            {loading ? (
                                <div className="flex gap-2 items-center text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                    Memverifikasi...
                                </div>
                            ) : (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                            i < pin.length 
                                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-110' 
                                            : 'bg-slate-100 border border-slate-200'
                                        }`}
                                    ></div>
                                ))
                            )}
                        </div>
                        {error ? (
                            <p className="mt-4 text-rose-500 font-black text-[10px] uppercase tracking-widest">
                                {error}
                            </p>
                        ) : pin.length === 0 && !loading ? (
                            <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-[9px] animate-pulse">Masukkan 6 Digit PIN Akses</p>
                        ) : null}
                    </div>

                    <div className={`grid grid-cols-3 gap-4 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(String(num))}
                                className="h-16 rounded-2xl bg-white text-2xl font-black text-slate-800 hover:bg-emerald-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-100 shadow-sm"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={handleClear}
                            className="h-16 rounded-2xl bg-rose-50 text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                        >
                            C
                        </button>
                        <button
                            onClick={() => handleNumberClick('0')}
                            className="h-16 rounded-2xl bg-white text-2xl font-black text-slate-800 hover:bg-emerald-500 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 border border-slate-100 shadow-sm"
                        >
                            0
                        </button>
                        <button
                            onClick={handleDelete}
                            className="h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-all border border-slate-100"
                        >
                            <i className="fa-solid fa-delete-left text-xl"></i>
                        </button>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Sistem akan login otomatis saat PIN lengkap</p>
                    </div>
                </div>

                <div className="mt-8 text-center animate-fade-in delay-300">
                    <button onClick={() => navigate('/')} className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-emerald-500 transition-colors">
                        &larr; Kembali ke Beranda Publik
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-6px); }
                    75% { transform: translateX(6px); }
                }
                .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
            `}</style>
        </div>
    );
};

export default UnifiedLoginPage;
