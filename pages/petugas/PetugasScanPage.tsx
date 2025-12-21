
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import type { Warga, TransactionStatus } from '@/types';
import { getWargaById, createTransaksi, payDebt, getDukuhById, getRTById, checkIfWargaPaidToday } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircleIcon, QrCodeIcon, SearchIcon, XIcon, BanknotesIcon } from '@/components/icons';
import Modal from '@/components/Modal';
import jsQR from 'jsqr';

const PetugasScanPage: FC = () => {
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [wargaId, setWargaId] = useState('');
    const [warga, setWarga] = useState<Warga | null>(null);
    const [hasPaidToday, setHasPaidToday] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('Berhasil');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const isScanningRef = useRef(false); // Used to avoid stale closures in requestAnimationFrame
    
    const { petugas } = useAuth();
    
    const resetState = useCallback(() => {
        setWarga(null);
        setWargaId('');
        setError('');
        setSuccess(false);
        setLoading(false);
        setHasPaidToday(false);
        if (mode === 'scan') {
            setIsScanning(true);
            isScanningRef.current = true;
        }
    }, [mode]);

    const fetchWarga = useCallback(async (id: string) => {
        setIsScanning(false);
        isScanningRef.current = false;
        setLoading(true);
        setError('');
        
        try {
            const data = await getWargaById(id);
            if (data) {
                setWarga(data);
                const paidToday = await checkIfWargaPaidToday(id);
                setHasPaidToday(paidToday);
            } else {
                setError(`ID Warga "${id}" tidak ditemukan.`);
                if (mode === 'scan') {
                    setTimeout(() => {
                        setIsScanning(true);
                        isScanningRef.current = true;
                    }, 3000);
                }
            }
        } catch (err) {
            setError('Gagal memuat data warga.');
            if (mode === 'scan') {
                setTimeout(() => {
                    setIsScanning(true);
                    isScanningRef.current = true;
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    }, [mode]);

    // QR Scanner Logic
    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const tick = () => {
            if (!isScanningRef.current) {
                animationFrameId = requestAnimationFrame(tick);
                return;
            }

            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const canvas = canvasRef.current;
                const video = videoRef.current;
                
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    try {
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });

                        if (code && code.data) {
                            isScanningRef.current = false;
                            setIsScanning(false);
                            fetchWarga(code.data);
                            return; 
                        }
                    } catch (err) {
                        console.error("jsQR error:", err);
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        const startCamera = async () => {
            if (mode !== 'scan' || warga || success) return;
            
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play().catch(e => console.error("Play error:", e));
                        setIsScanning(true);
                        isScanningRef.current = true;
                        tick();
                    };
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError('Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.');
                setMode('manual');
            }
        };

        if (mode === 'scan' && !warga && !success) {
            startCamera();
        }

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            cancelAnimationFrame(animationFrameId);
            isScanningRef.current = false;
        };
    }, [mode, warga, success, fetchWarga]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (wargaId.length === 6) {
            fetchWarga(wargaId);
        } else {
            setError('ID Warga harus 6 digit.');
        }
    };

    const handleSavePayment = async (status: TransactionStatus) => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            await createTransaksi({
                wargaId: warga.id,
                petugasId: petugas.id,
                amount: warga.dailyFee,
                status: status
            });
            setModalTitle(status === 'LUNAS' ? 'Pembayaran Berhasil' : 'Tunggakan Dicatat');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => {
                setIsModalOpen(false);
                resetState();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayDebt = async () => {
        if (!warga || !petugas) return;
        if (warga.totalDebt <= 0) return;
        
        setLoading(true);
        try {
            await payDebt(warga.id, petugas.id, warga.totalDebt);
            setModalTitle('Pelunasan Berhasil');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => {
                setIsModalOpen(false);
                resetState();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Gagal melunasi tunggakan.');
        } finally {
            setLoading(false);
        }
    };

    const getDukuhName = (id: number) => getDukuhById(id)?.name || 'N/A';
    const getRTNumber = (id: number) => getRTById(id)?.number || 'N/A';

    return (
        <div className="flex-grow p-4 max-w-md mx-auto w-full">
            {!warga && (
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <button 
                        onClick={() => setMode('scan')}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'scan' ? 'bg-primary text-white shadow-md' : 'text-slate-500'}`}
                    >
                        <QrCodeIcon className="text-lg" /> Scan QR
                    </button>
                    <button 
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'manual' ? 'bg-primary text-white shadow-md' : 'text-slate-500'}`}
                    >
                        <SearchIcon className="text-lg" /> Manual
                    </button>
                </div>
            )}

            {!warga && mode === 'scan' && (
                <div className="relative aspect-square w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white animate-fade-in">
                    <video 
                        ref={videoRef} 
                        className="w-full h-full object-cover" 
                        playsInline 
                        autoPlay 
                        muted 
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-[40px] border-slate-900/40 pointer-events-none">
                        <div className="w-full h-full border-2 border-primary/50 rounded-xl relative">
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary"></div>
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary"></div>
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_linear_infinite]"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-6 left-0 right-0 text-center">
                        <p className="text-white text-xs font-bold bg-slate-900/60 inline-block px-4 py-2 rounded-full backdrop-blur-md">
                            Arahkan kamera ke QR Code warga
                        </p>
                    </div>
                </div>
            )}

            {!warga && mode === 'manual' && (
                <div className="animate-fade-in space-y-4">
                    <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="block text-slate-700 font-semibold mb-2">Input Manual ID Warga</label>
                        <input
                            type="tel"
                            value={wargaId}
                            onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))}
                            maxLength={6}
                            placeholder="Contoh: 100001"
                            className="w-full text-lg px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                        <button type="submit" disabled={loading} className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-focus">
                            Cari Warga
                        </button>
                    </form>
                </div>
            )}

            {error && !warga && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-start gap-3 animate-shake">
                    <XIcon className="mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {warga && !success && (
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 animate-slide-in-up">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <QrCodeIcon className="text-3xl text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{warga.name}</h2>
                        <p className="text-slate-500 font-medium">ID: {warga.id} • RT {getRTNumber(warga.rtId)}, {getDukuhName(warga.dukuhId)}</p>
                    </div>
                    
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                        <div className="flex flex-col items-center gap-1">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tarif Sampah Hari Ini</p>
                            <p className="text-4xl font-extrabold text-slate-800">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(warga.dailyFee)}
                            </p>
                        </div>
                        
                        {warga.totalDebt > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Tunggakan Lama</p>
                                <p className="text-xl font-bold text-red-600">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(warga.totalDebt)}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={() => handleSavePayment('LUNAS')} 
                                disabled={loading || hasPaidToday} 
                                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <CheckCircleIcon /> {hasPaidToday ? 'Sudah Tercatat Hari Ini' : 'Bayar Tunai (Hari Ini)'}
                            </button>
                            
                            {!hasPaidToday && (
                                <button 
                                    onClick={() => handleSavePayment('HUTANG')} 
                                    disabled={loading} 
                                    className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50"
                                >
                                    Catat Tunggakan (Hari Ini)
                                </button>
                            )}

                            {warga.totalDebt > 0 && (
                                <button 
                                    onClick={handlePayDebt} 
                                    disabled={loading} 
                                    className="w-full bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <BanknotesIcon /> Bayar Pelunasan Tunggakan
                                </button>
                            )}
                        </div>

                        <button onClick={resetState} className="w-full text-slate-400 font-bold py-2 hover:text-slate-600">
                            Batal
                        </button>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <CheckCircleIcon className="text-5xl text-success" />
                    </div>
                    <p className="text-2xl font-extrabold text-slate-800">{modalTitle}!</p>
                    <p className="text-slate-500 mt-1">Sistem telah memperbarui data warga.</p>
                </div>
            </Modal>
            
            <style>{`
                @keyframes scan {
                    0% { top: 0; }
                    50% { top: 100%; }
                    100% { top: 0; }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
};

export default PetugasScanPage;
