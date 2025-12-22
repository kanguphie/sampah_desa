
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import type { Warga, TransactionStatus } from '@/types';
import { getWargaById, createTransaksi, payDebt, getDukuhById, getRTById, checkIfWargaPaidToday } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircleIcon, QrCodeIcon, SearchIcon, XIcon, BanknotesIcon, ClockIcon } from '@/components/icons';
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
    
    // Debt partial payment states
    const [isPayingDebt, setIsPayingDebt] = useState(false);
    const [debtInput, setDebtInput] = useState<number | ''>('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const isScanningRef = useRef(false); 
    
    const { petugas } = useAuth();
    
    const resetState = useCallback(() => {
        setWarga(null);
        setWargaId('');
        setError('');
        setSuccess(false);
        setLoading(false);
        setHasPaidToday(false);
        setIsPayingDebt(false);
        setDebtInput('');
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
                setDebtInput(''); 
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
                        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                        if (code && code.data) {
                            isScanningRef.current = false;
                            setIsScanning(false);
                            fetchWarga(code.data);
                            return; 
                        }
                    } catch (err) { console.error("jsQR error:", err); }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        const startCamera = async () => {
            if (mode !== 'scan' || warga || success) return;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
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
                setError('Akses kamera ditolak.');
                setMode('manual');
            }
        };

        if (mode === 'scan' && !warga && !success) startCamera();
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            cancelAnimationFrame(animationFrameId);
            isScanningRef.current = false;
        };
    }, [mode, warga, success, fetchWarga]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (wargaId.length === 6) fetchWarga(wargaId);
        else setError('ID Warga harus 6 digit.');
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
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err: any) { setError(err.message || 'Gagal menyimpan.'); }
        finally { setLoading(false); }
    };

    const handlePayDebt = async (amountToPay: number) => {
        if (!warga || !petugas || amountToPay <= 0) return;
        setLoading(true);
        try {
            await payDebt(warga.id, petugas.id, amountToPay);
            setModalTitle('Tunggakan Dilunasi');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err: any) { setError(err.message || 'Gagal menyimpan.'); }
        finally { setLoading(false); }
    };

    const handleBulkPayment = async () => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            // 1. Bayar Iuran Hari Ini
            await createTransaksi({
                wargaId: warga.id,
                petugasId: petugas.id,
                amount: warga.dailyFee,
                status: 'LUNAS'
            });
            // 2. Bayar Semua Tunggakan
            await payDebt(warga.id, petugas.id, warga.totalDebt);
            
            setModalTitle('Borongan Lunas!');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err: any) { setError(err.message || 'Gagal menyimpan.'); }
        finally { setLoading(false); }
    }

    const getDukuhName = (id: number) => getDukuhById(id)?.name || 'N/A';
    const getRTNumber = (id: number) => getRTById(id)?.number || 'N/A';

    const formatInputDisplay = (val: number | '') => {
        if (val === '') return '';
        return val.toLocaleString('id-ID');
    };

    const handleDebtInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, ''); 
        const val = rawValue === '' ? '' : Number(rawValue);
        if (warga && val !== '' && val > warga.totalDebt) { setDebtInput(warga.totalDebt); } else { setDebtInput(val); }
    };

    return (
        <div className="flex-grow p-4 max-w-md mx-auto w-full">
            {!warga && (
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <button onClick={() => setMode('scan')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'scan' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>
                        <QrCodeIcon className="text-lg" /> Scan QR
                    </button>
                    <button onClick={() => setMode('manual')} className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'manual' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>
                        <SearchIcon className="text-lg" /> Manual
                    </button>
                </div>
            )}

            {!warga && mode === 'scan' && (
                <div className="relative aspect-square w-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white animate-fade-in">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-[45px] border-slate-900/40 pointer-events-none">
                        <div className="w-full h-full border-2 border-primary/50 rounded-2xl relative">
                            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2.5s_linear_infinite]"></div>
                        </div>
                    </div>
                </div>
            )}

            {!warga && mode === 'manual' && (
                <div className="animate-fade-in space-y-4">
                    <form onSubmit={handleManualSubmit} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">ID Warga (6 Digit)</label>
                        <input type="tel" value={wargaId} onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))} maxLength={6} placeholder="100001" className="w-full text-2xl font-bold px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" autoFocus />
                        <button type="submit" disabled={loading} className="w-full mt-6 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 shadow-xl shadow-slate-900/10 transition-all">Cari Warga</button>
                    </form>
                </div>
            )}

            {error && !warga && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center gap-3 animate-shake uppercase tracking-tight">
                    <XIcon /> <p>{error}</p>
                </div>
            )}

            {warga && !success && (
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-200 animate-slide-in-up">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <QrCodeIcon className="text-3xl text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{warga.name}</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {warga.id} • RT {getRTNumber(warga.rtId)}, {getDukuhName(warga.dukuhId)}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Iuran Hari Ini</p>
                            <p className="text-xl font-black text-slate-800">Rp{warga.dailyFee.toLocaleString('id-ID')}</p>
                        </div>
                        <div className={`p-4 rounded-2xl border text-center ${warga.totalDebt > 0 ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <p className="text-[8px] font-black uppercase tracking-widest mb-1">Tunggakan</p>
                            <p className="text-xl font-black">Rp{warga.totalDebt.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {isPayingDebt ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center text-white">Input Nominal Bayar</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500">Rp</span>
                                    <input 
                                        type="text" 
                                        inputMode="numeric"
                                        value={formatInputDisplay(debtInput)} 
                                        placeholder="0"
                                        onChange={handleDebtInputChange}
                                        className="w-full pl-11 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-xl outline-none focus:ring-2 focus:ring-primary"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button onClick={() => setIsPayingDebt(false)} className="py-3 px-4 rounded-xl font-bold text-slate-400 bg-slate-800 border border-slate-700 hover:text-white transition-all text-xs">Batal</button>
                                    <button onClick={() => handlePayDebt(Number(debtInput))} disabled={loading || !debtInput || debtInput <= 0} className="py-3 px-4 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-50 text-xs">Bayar Tunggakan</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {warga.totalDebt > 0 && !hasPaidToday && (
                                <button onClick={handleBulkPayment} disabled={loading} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-1 group">
                                    <div className="flex items-center gap-2 text-sm uppercase tracking-widest">
                                        <BanknotesIcon className="text-emerald-400" /> Bayar Borongan
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">Total: Rp{(warga.dailyFee + warga.totalDebt).toLocaleString('id-ID')}</span>
                                </button>
                            )}

                            <button onClick={() => handleSavePayment('LUNAS')} disabled={loading || hasPaidToday} className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest ${hasPaidToday ? 'bg-emerald-100 text-emerald-500 cursor-not-allowed' : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'}`}>
                                <CheckCircleIcon /> {hasPaidToday ? 'Sudah Tercatat Hari Ini' : 'Bayar Iuran Rutin'}
                            </button>
                            
                            {!hasPaidToday && (
                                <button onClick={() => handleSavePayment('HUTANG')} disabled={loading} className="w-full bg-amber-50 text-amber-600 border border-amber-200 font-bold py-3 rounded-2xl hover:bg-amber-100 transition-all disabled:opacity-50 text-xs uppercase tracking-widest">
                                    Nanti / Catat Hutang
                                </button>
                            )}

                            {warga.totalDebt > 0 && (
                                <button onClick={() => setIsPayingDebt(true)} disabled={loading} className="w-full text-slate-600 font-bold py-3 hover:text-primary text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                    <ClockIcon /> Cicil Tunggakan
                                </button>
                            )}
                            
                            <button onClick={resetState} className="w-full text-slate-300 font-bold py-2 hover:text-slate-500 text-[10px] uppercase tracking-widest mt-4">Batal / Kembali</button>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                        <CheckCircleIcon className="text-5xl" />
                    </div>
                    <p className="text-2xl font-black text-slate-800 tracking-tight">{modalTitle}!</p>
                    <p className="text-slate-500 mt-1 font-medium text-sm px-6">Data warga telah berhasil diperbarui ke dalam sistem desa.</p>
                </div>
            </Modal>
            
            <style>{`
                @keyframes scan { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
                .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
            `}</style>
        </div>
    );
};

export default PetugasScanPage;
