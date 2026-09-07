
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import type { Warga, TransactionStatus, Transaksi, Dukuh, RT } from '@/types';
import { getWargaById, createTransaksi, payDebt, getAllDukuh, getAllRT, getWargaTodayTransaction, convertDebtToPaidToday, getScheduleForToday, getWargaStatus, createPartialPayment } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircleIcon, QrCodeIcon, SearchIcon, XIcon, BanknotesIcon, ClockIcon } from '@/components/icons';
import Modal from '@/components/Modal';
import jsQR from 'jsqr';

const PetugasScanPage: FC = () => {
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [wargaId, setWargaId] = useState('');
    const [warga, setWarga] = useState<Warga | null>(null);
    const [todayTx, setTodayTx] = useState<Transaksi | null>(null);
    const [monthlyStatus, setMonthlyStatus] = useState<{ monthlyPaid: boolean; monthlyTx?: any; currentMonthName: string } | null>(null);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [scheduleToday, setScheduleToday] = useState<{isHoliday: boolean, dukuhIds: number[], dukuhNames: string[]} | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('Berhasil');
    
    const [isPayingDebt, setIsPayingDebt] = useState(false);
    const [debtInput, setDebtInput] = useState<number | ''>('');

    const [isPartialPaying, setIsPartialPaying] = useState(false);
    const [partialInput, setPartialInput] = useState<number | ''>('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const isScanningRef = useRef(false);
    const isProcessingRef = useRef(false);
    const lastScanTimeRef = useRef<number>(0); 
    const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const { petugas } = useAuth();
    
    useEffect(() => {
        const fetchMeta = async () => {
            const [d, r, s] = await Promise.all([
                getAllDukuh(), 
                getAllRT(),
                getScheduleForToday()
            ]);
            setDukuhList(d);
            setRtList(r);
            setScheduleToday(s);
        };
        fetchMeta();
    }, []);

    const resetState = useCallback(() => {
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        setWarga(null);
        setTodayTx(null);
        setMonthlyStatus(null);
        setWargaId('');
        setError('');
        setSuccess(false);
        setLoading(false);
        setIsPayingDebt(false);
        setDebtInput('');
        setIsPartialPaying(false);
        setPartialInput('');
        isProcessingRef.current = false;
        
        if (mode === 'scan') {
            isScanningRef.current = true;
        }
    }, [mode]);

    const getDukuhName = useCallback((id: number) => dukuhList.find(d => d.id === id)?.name || 'Wilayah Tak Dikenal', [dukuhList]);

    const fetchWarga = useCallback(async (id: string) => {
        if (isProcessingRef.current) return;
        
        isProcessingRef.current = true;
        isScanningRef.current = false; // Kunci scanner
        setLoading(true);
        setError('');
        
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        
        try {
            const [data, statusData] = await Promise.all([
                getWargaById(id),
                getWargaStatus(id).catch(() => null)
            ]);

            if (data) {
                // VALIDASI JADWAL
                if (scheduleToday) {
                    if (scheduleToday.isHoliday) {
                        setError('HARI INI ADALAH JADWAL LIBUR PENGAMBILAN SAMPAH.');
                        errorTimeoutRef.current = setTimeout(() => {
                            setError('');
                            isProcessingRef.current = false;
                            isScanningRef.current = true;
                        }, 3000);
                        return;
                    }
                    
                    if (!scheduleToday.dukuhIds.includes(data.dukuhId)) {
                        setError(`WARGA BERADA DI WILAYAH ${getDukuhName(data.dukuhId).toUpperCase()}. WILAYAH INI TIDAK DIJADWALKAN UNTUK PENGAMBILAN HARI INI.`);
                        errorTimeoutRef.current = setTimeout(() => {
                            setError('');
                            isProcessingRef.current = false;
                            isScanningRef.current = true;
                        }, 3000);
                        return;
                    }
                }

                setWarga(data);
                if (statusData) {
                    setTodayTx(statusData.todayTx || null);
                    setMonthlyStatus({
                        monthlyPaid: !!statusData.monthlyPaid,
                        monthlyTx: statusData.monthlyTx,
                        currentMonthName: statusData.currentMonthName
                    });
                } else {
                    const tx = await getWargaTodayTransaction(id);
                    setTodayTx(tx || null);
                }
            } else {
                setError(`ID WARGA "${id}" TIDAK DITEMUKAN.`);
                errorTimeoutRef.current = setTimeout(() => { 
                    setError('');
                    isProcessingRef.current = false;
                    isScanningRef.current = true; 
                }, 2000);
            }
        } catch (err) {
            setError('GAGAL MEMUAT DATA WARGA.');
            errorTimeoutRef.current = setTimeout(() => {
                setError('');
                isProcessingRef.current = false;
                isScanningRef.current = true;
            }, 2000);
        } finally {
            setLoading(false);
        }
    }, [scheduleToday, getDukuhName]);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const tick = (time: number) => {
            // Selalu panggil requestAnimationFrame agar loop tidak mati
            animationFrameId = requestAnimationFrame(tick);

            // Cek apakah scanner sedang aktif dan tidak sedang memproses data
            if (!isScanningRef.current || isProcessingRef.current) {
                return;
            }

            // Throttling: Scan setiap 200ms agar CPU tidak panas
            if (time - lastScanTimeRef.current < 200) {
                return;
            }

            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                lastScanTimeRef.current = time;
                const canvas = canvasRef.current;
                const video = videoRef.current;
                
                canvas.height = video.videoHeight / 2;
                canvas.width = video.videoWidth / 2;
                
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { 
                        inversionAttempts: "dontInvert" 
                    });
                    
                    if (code && code.data) {
                        fetchWarga(code.data);
                    }
                }
            }
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
                        videoRef.current?.play();
                        isScanningRef.current = true;
                        animationFrameId = requestAnimationFrame(tick);
                    };
                }
            } catch (err) {
                setError('Akses kamera ditolak.');
                setMode('manual');
            }
        };

        if (mode === 'scan' && !warga && !success) startCamera();
        
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            cancelAnimationFrame(animationFrameId);
            isScanningRef.current = false;
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        };
    }, [mode, warga, success, fetchWarga]);

    const handleSavePayment = async (status: TransactionStatus) => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            await createTransaksi({ wargaId: warga.id, petugasId: petugas.id, amount: warga.dailyFee, status: status, category: 'harian' });
            setModalTitle(status === 'LUNAS' ? 'Pembayaran Berhasil' : 'Tunggakan Dicatat');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err) { setError('Gagal menyimpan.'); }
        finally { setLoading(false); }
    };

    const handleSaveMonthlyPayment = async (status: TransactionStatus) => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            await createTransaksi({ wargaId: warga.id, petugasId: petugas.id, amount: warga.monthlyFee || 0, status, category: 'bulanan' });
            setModalTitle(status === 'LUNAS' ? 'Iuran Bulanan Lunas' : 'Tunggakan Bulanan Dicatat');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err) { setError('Gagal menyimpan iuran bulanan.'); }
        finally { setLoading(false); }
    };

    const handleRecordMonthlyPickup = async () => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            await createTransaksi({ wargaId: warga.id, petugasId: petugas.id, amount: 0, status: 'LUNAS', category: 'ambil_bulanan' });
            setModalTitle('Pengambilan Sampah Dicatat');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err) { setError('Gagal mencatat pengambilan sampah.'); }
        finally { setLoading(false); }
    };

    const handleSettleTodayDebt = async () => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            await convertDebtToPaidToday(warga.id, petugas.id);
            setModalTitle('Iuran Dilunasi');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err) { setError('Gagal memperbarui.'); }
        finally { setLoading(false); }
    };

    const handleSavePartialPayment = async () => {
        if (!warga || !petugas || partialInput === '' || Number(partialInput) <= 0) return;
        setLoading(true);
        try {
            const nominalTarif = isBulanan ? (warga.monthlyFee || 0) : (warga.dailyFee || 2000);
            const paid = Number(partialInput);
            await createPartialPayment({
                wargaId: warga.id,
                petugasId: petugas.id,
                amountPaid: paid,
                tarif: nominalTarif,
                category: isBulanan ? 'bulanan' : 'harian'
            });

            if (paid < nominalTarif) {
                const deficit = nominalTarif - paid;
                setModalTitle(`Diterima Rp${paid.toLocaleString('id-ID')} (Tunggakan +Rp${deficit.toLocaleString('id-ID')})`);
            } else {
                setModalTitle(`Pembayaran Rp${paid.toLocaleString('id-ID')} Berhasil`);
            }

            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2200);
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan pembayaran sebagian.');
        } finally {
            setLoading(false);
        }
    };

    const handlePayDebt = async (amount: number) => {
        if (!warga || !petugas || amount <= 0) return;
        setLoading(true);
        try {
            await payDebt(warga.id, petugas.id, amount);
            setModalTitle('Tunggakan Dilunasi');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err) { setError('Gagal menyimpan.'); }
        finally { setLoading(false); }
    };

    const handleBulkPayment = async () => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            if (warga.billingType === 'BULANAN') {
                if (!monthlyStatus?.monthlyPaid) {
                    await createTransaksi({ wargaId: warga.id, petugasId: petugas.id, amount: warga.monthlyFee || 0, status: 'LUNAS', category: 'bulanan' });
                }
                if (warga.totalDebt > 0) {
                    await payDebt(warga.id, petugas.id, warga.totalDebt);
                }
            } else {
                if (todayTx?.status === 'HUTANG' || (todayTx?.status as string)?.toLowerCase() === 'unpaid') {
                    await convertDebtToPaidToday(warga.id, petugas.id);
                    const oldDebt = warga.totalDebt - (warga.dailyFee || 2000);
                    if (oldDebt > 0) {
                        await payDebt(warga.id, petugas.id, oldDebt);
                    }
                } else {
                    await createTransaksi({ wargaId: warga.id, petugasId: petugas.id, amount: warga.dailyFee, status: 'LUNAS', category: 'harian' });
                    if (warga.totalDebt > 0) {
                        await payDebt(warga.id, petugas.id, warga.totalDebt);
                    }
                }
            }
            
            setModalTitle('Borongan Lunas!');
            setSuccess(true);
            setIsModalOpen(true);
            setTimeout(() => { setIsModalOpen(false); resetState(); }, 2000);
        } catch (err) { setError('Gagal menyimpan.'); }
        finally { setLoading(false); }
    };

    const isBulanan = warga?.billingType === 'BULANAN';
    const isTodayDebt = todayTx?.status === 'HUTANG' || (todayTx?.status as string)?.toLowerCase() === 'unpaid';
    const isTodayPaid = todayTx?.status === 'LUNAS' || (todayTx?.status as string)?.toLowerCase() === 'paid';
    const isMonthlyPaid = !!monthlyStatus?.monthlyPaid;
    const hasDebt = warga ? warga.totalDebt > 0 : false;
    const currentTarif = isBulanan ? (warga?.monthlyFee || 0) : (warga?.dailyFee || 2000);

    const quickChips = [1000, 3000, 5000];
    
    const displayedDailyFee = (isTodayDebt || isTodayPaid) ? 0 : (warga?.dailyFee || 0);
    const bulkAmount = warga ? (
        isBulanan
            ? (isMonthlyPaid ? warga.totalDebt : (warga.monthlyFee || 0) + warga.totalDebt)
            : (isTodayDebt ? warga.totalDebt : warga.dailyFee + warga.totalDebt)
    ) : 0;

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

            {error && !warga && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 flex items-start gap-3 animate-fade-in">
                    <i className="fa-solid fa-circle-exclamation mt-1"></i>
                    <p className="text-xs font-bold uppercase tracking-tight leading-relaxed">{error}</p>
                </div>
            )}

            {!warga && mode === 'scan' && (
                <div className="relative aspect-square w-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white animate-fade-in">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline autoPlay muted />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-[70%] h-[70%] relative">
                            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl animate-pulse"></div>
                            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-2xl animate-pulse"></div>
                            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-2xl animate-pulse"></div>
                            
                            <div className="absolute -bottom-12 left-0 w-full text-center">
                                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                                    Posisikan QR di Tengah Bingkai
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 border-[40px] border-slate-900/40 pointer-events-none"></div>
                </div>
            )}

            {!warga && mode === 'manual' && (
                <form onSubmit={(e) => { e.preventDefault(); fetchWarga(wargaId); }} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">ID Warga (6 Digit)</label>
                    <input type="tel" value={wargaId} onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))} maxLength={6} placeholder="100001" className="w-full text-2xl font-bold px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" autoFocus />
                    <button type="submit" disabled={loading} className="w-full mt-6 bg-slate-800 text-white font-bold py-4 rounded-2xl hover:bg-slate-900 shadow-xl shadow-slate-900/10 transition-all">
                        {loading ? 'Mengecek...' : 'Cari Warga'}
                    </button>
                </form>
            )}

            {warga && !success && (
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-200 animate-slide-in-up">
                    <div className="text-center mb-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${isBulanan ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
                            <QrCodeIcon className="text-3xl" />
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{warga.name}</h2>
                        </div>
                        <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID: {warga.id} • {getDukuhName(warga.dukuhId)}</span>
                            {isBulanan ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider">
                                    Warga Bulanan
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200 uppercase tracking-wider">
                                    Warga Harian
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {isBulanan ? (
                            <div className="p-4 rounded-2xl border bg-purple-50/60 border-purple-100 text-center">
                                <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-1">Tarif Bulanan</p>
                                <p className="text-xl font-black text-purple-950">Rp{(warga.monthlyFee || 0).toLocaleString('id-ID')}</p>
                            </div>
                        ) : (
                            <div className={`p-4 rounded-2xl border text-center transition-all ${displayedDailyFee > 0 ? 'bg-slate-50 border-slate-100' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Iuran Per Ambil</p>
                                <p className="text-xl font-black text-slate-800">Rp{displayedDailyFee.toLocaleString('id-ID')}</p>
                            </div>
                        )}
                        <div className={`p-4 rounded-2xl border text-center transition-all ${hasDebt ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                            <p className="text-[8px] font-black uppercase tracking-widest mb-1">Tunggakan</p>
                            <p className="text-xl font-black">Rp{(warga.totalDebt || 0).toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    {isPayingDebt ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center text-white">Input Nominal Cicilan</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500">Rp</span>
                                    <input type="text" inputMode="numeric" value={debtInput === '' ? '' : debtInput.toLocaleString('id-ID')} onChange={(e) => setDebtInput(Number(e.target.value.replace(/\D/g, '')))} placeholder="0" className="w-full pl-11 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-xl outline-none focus:ring-2 focus:ring-primary" autoFocus />
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                                    {quickChips.map((chipVal) => (
                                        <button
                                            key={chipVal}
                                            type="button"
                                            onClick={() => setDebtInput(chipVal)}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                debtInput === chipVal
                                                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                                                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                                            }`}
                                        >
                                            Rp{chipVal.toLocaleString('id-ID')}
                                        </button>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button onClick={() => setIsPayingDebt(false)} className="py-3 rounded-xl font-bold text-slate-400 bg-slate-800 border border-slate-700 text-xs">Batal</button>
                                    <button onClick={() => handlePayDebt(Number(debtInput))} disabled={loading || !debtInput} className="py-3 rounded-xl font-bold bg-primary text-white text-xs">Simpan Cicilan</button>
                                </div>
                            </div>
                        </div>
                    ) : isPartialPaying ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl text-white">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                            <BanknotesIcon className="text-lg" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase tracking-wider text-white">Bayar Tidak Sesuai Tarif</h3>
                                            <p className="text-[10px] text-slate-400">Input nominal yang dibayarkan warga</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setIsPartialPaying(false); setPartialInput(''); }} className="text-slate-400 hover:text-white p-1 rounded-lg">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 text-center mb-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Tarif Resmi</p>
                                        <p className="text-sm font-black text-white">Rp{currentTarif.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Tunggakan Saat Ini</p>
                                        <p className={`text-sm font-black ${hasDebt ? 'text-rose-400' : 'text-slate-300'}`}>
                                            Rp{(warga.totalDebt || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">
                                    Nominal Uang Diterima
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-amber-400 text-lg">Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={partialInput === '' ? '' : partialInput.toLocaleString('id-ID')}
                                        onChange={(e) => setPartialInput(Number(e.target.value.replace(/\D/g, '')))}
                                        placeholder="0"
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-800 border-2 border-amber-500/50 focus:border-amber-400 rounded-2xl text-white font-black text-2xl outline-none transition-all text-center tracking-tight"
                                        autoFocus
                                    />
                                </div>

                                {quickChips.length > 0 && (
                                    <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                                        {quickChips.map((chipVal) => (
                                            <button
                                                key={chipVal}
                                                type="button"
                                                onClick={() => setPartialInput(chipVal)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                                    partialInput === chipVal
                                                        ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                                                        : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            >
                                                Rp{chipVal.toLocaleString('id-ID')}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {partialInput !== '' && (
                                    <div className="mt-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-400">Kas Masuk Hari Ini:</span>
                                            <span className="font-black text-emerald-400">+Rp{Number(partialInput).toLocaleString('id-ID')}</span>
                                        </div>

                                        {Number(partialInput) < currentTarif ? (
                                            <>
                                                <div className="flex justify-between items-center text-[11px]">
                                                    <span className="text-amber-300 font-bold">Kekurangan (Otomatis Jadi Tunggakan):</span>
                                                    <span className="font-black text-amber-400">+Rp{(currentTarif - Number(partialInput)).toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-[11px]">
                                                    <span className="text-slate-300">Total Tunggakan Nanti:</span>
                                                    <span className="font-black text-rose-400">
                                                        Rp{((warga.totalDebt || 0) + (currentTarif - Number(partialInput))).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </>
                                        ) : Number(partialInput) === currentTarif ? (
                                            <div className="text-emerald-400 font-bold text-center text-[11px] pt-1">
                                                ✓ Pembayaran pas sesuai tarif penuh
                                            </div>
                                        ) : (
                                            <div className="text-sky-300 font-bold text-center text-[11px] pt-1">
                                                Kelebihan Rp{(Number(partialInput) - currentTarif).toLocaleString('id-ID')} otomatis memotong tunggakan lama
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setIsPartialPaying(false); setPartialInput(''); }}
                                        className="py-3.5 rounded-xl font-bold text-slate-400 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSavePartialPayment}
                                        disabled={loading || partialInput === '' || Number(partialInput) <= 0}
                                        className="py-3.5 rounded-xl font-black bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <CheckCircleIcon className="text-base" /> Simpan Bayar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {isBulanan ? (
                                <>
                                    {isMonthlyPaid ? (
                                        <div className="w-full bg-emerald-50 text-emerald-700 font-bold p-4 rounded-2xl border border-emerald-200 text-center space-y-1">
                                            <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest">
                                                <CheckCircleIcon className="text-emerald-600 text-base" /> Iuran Bulan Ini ({monthlyStatus?.currentMonthName || 'Bulan Ini'}) LUNAS
                                            </div>
                                            <p className="text-[11px] text-emerald-600 font-medium">Pembayaran bulanan sudah tercatat untuk periode ini.</p>
                                        </div>
                                    ) : (
                                        <div className="w-full bg-amber-50 text-amber-800 font-bold p-3.5 rounded-2xl border border-amber-200 text-center">
                                            <p className="text-xs font-black uppercase tracking-widest text-amber-700">Belum Bayar Iuran {monthlyStatus?.currentMonthName || 'Bulan Ini'}</p>
                                            <p className="text-[11px] text-amber-600 font-medium mt-0.5">Tagihan: Rp{(warga.monthlyFee || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                    )}

                                    {/* Action Buttons for Monthly Warga */}
                                    {!isMonthlyPaid && (
                                        <div className="space-y-2.5">
                                            <button onClick={() => handleSaveMonthlyPayment('LUNAS')} disabled={loading} className="w-full bg-purple-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                                                <CheckCircleIcon /> Bayar Iuran Bulan Ini (Rp{(warga.monthlyFee || 0).toLocaleString('id-ID')})
                                            </button>

                                            <button onClick={() => { setIsPartialPaying(true); setPartialInput(''); }} disabled={loading} className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                                <BanknotesIcon /> Bayar Sebagian / Tidak Sesuai Tarif
                                            </button>

                                            <button onClick={() => handleSaveMonthlyPayment('HUTANG')} disabled={loading} className="w-full bg-amber-50 text-amber-700 border border-amber-300 font-bold py-3 rounded-2xl hover:bg-amber-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                                <ClockIcon /> Catat Sebagai Tunggakan Bulanan
                                            </button>
                                        </div>
                                    )}

                                    {/* Daily Pickup check for monthly resident */}
                                    {todayTx ? (
                                        <div className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider border border-slate-200">
                                            <CheckCircleIcon className="text-emerald-500" /> Sampah Sudah Diambil Hari Ini
                                        </div>
                                    ) : (
                                        <button onClick={handleRecordMonthlyPickup} disabled={loading} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm">
                                            <CheckCircleIcon className="text-emerald-400" /> Catat Pengambilan Sampah Hari Ini (Rp 0)
                                        </button>
                                    )}
                                </>
                            ) : (
                                <>
                                    {isTodayPaid ? (
                                        <div className="w-full bg-emerald-100 text-emerald-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm uppercase tracking-widest border border-emerald-200">
                                            <CheckCircleIcon /> Sudah Lunas Hari Ini
                                        </div>
                                    ) : isTodayDebt ? (
                                        <div className="space-y-2.5">
                                            <button onClick={handleSettleTodayDebt} disabled={loading} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                                                <CheckCircleIcon /> Lunasi Iuran Hari Ini (Rp{(warga.dailyFee || 2000).toLocaleString('id-ID')})
                                            </button>
                                            <button onClick={() => { setIsPartialPaying(true); setPartialInput(''); }} disabled={loading} className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                                <BanknotesIcon /> Bayar Sebagian (Misal Rp1.000)
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            <button onClick={() => handleSavePayment('LUNAS')} disabled={loading} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                                                <CheckCircleIcon /> Bayar Iuran Hari Ini (Rp{(warga.dailyFee || 2000).toLocaleString('id-ID')})
                                            </button>

                                            <button onClick={() => { setIsPartialPaying(true); setPartialInput(''); }} disabled={loading} className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                                <BanknotesIcon /> Bayar Sebagian / Tidak Sesuai Tarif
                                            </button>

                                            <button onClick={() => handleSavePayment('HUTANG')} disabled={loading} className="w-full bg-amber-50 text-amber-700 border border-amber-200 font-bold py-3 rounded-2xl hover:bg-amber-100 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                                <ClockIcon /> Jadikan Tunggakan (Nanti)
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {hasDebt && (
                                <button onClick={() => setIsPayingDebt(true)} disabled={loading} className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
                                    <BanknotesIcon /> Cicil Tunggakan
                                </button>
                            )}

                            {hasDebt && (isBulanan ? !isMonthlyPaid : !isTodayPaid) && (
                                <button onClick={handleBulkPayment} disabled={loading} className="w-full bg-white border-2 border-slate-800 text-slate-800 font-black py-4 rounded-2xl hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-0.5">
                                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                                        <CheckCircleIcon className="text-slate-400" /> Bayar Borongan
                                    </div>
                                    <span className="text-[11px] font-black">Lunas Semua: Rp{bulkAmount.toLocaleString('id-ID')}</span>
                                </button>
                            )}

                            <button onClick={resetState} className="w-full text-slate-300 font-bold py-2 hover:text-slate-500 text-[10px] uppercase tracking-widest mt-2 transition-colors">Batal / Kembali</button>
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
                </div>
            </Modal>
        </div>
    );
};

export default PetugasScanPage;
