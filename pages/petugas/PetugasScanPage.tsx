

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Warga } from '@/types';
import { getWargaById, createTransaksi, getDukuhById, getRTById, checkIfWargaPaidToday, getScheduleForToday } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { CheckCircleIcon } from '@/components/icons';
import Modal from '@/components/Modal';
import jsQR from 'jsqr';

const QRScanner: React.FC<{ onScan: (data: string) => void; onError: (error: string) => void }> = ({ onScan, onError }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scannerActive = useRef(true);

    useEffect(() => {
        scannerActive.current = true;
        let stream: MediaStream | null = null;
        let animationFrameId: number | null = null;
        
        const useNativeScanner = 'BarcodeDetector' in window;
        let barcodeDetector: any;
        if(useNativeScanner) {
             try {
                barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
            } catch (e) {
                console.error("Could not create BarcodeDetector.", e);
            }
        }
       
        const scanFrameNative = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2 || !scannerActive.current) {
                if (scannerActive.current) {
                    animationFrameId = requestAnimationFrame(scanFrameNative);
                }
                return;
            }

            try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0 && scannerActive.current) {
                    scannerActive.current = false; // Stop further scans
                    onScan(barcodes[0].rawValue);
                } else if(scannerActive.current) {
                     animationFrameId = requestAnimationFrame(scanFrameNative);
                }
            } catch (err) {
                console.error("QR Scan error:", err);
                if (scannerActive.current) {
                    animationFrameId = requestAnimationFrame(scanFrameNative);
                }
            }
        };

        const scanFrameJsQR = () => {
             if (!videoRef.current || videoRef.current.readyState < 2 || !scannerActive.current) {
                if (scannerActive.current) {
                    animationFrameId = requestAnimationFrame(scanFrameJsQR);
                }
                return;
            }

            const canvas = canvasRef.current;
            const video = videoRef.current;
            if (canvas) {
                const context = canvas.getContext('2d');
                if (context) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    
                    if (code && scannerActive.current) {
                        scannerActive.current = false;
                        onScan(code.data);
                    } else if (scannerActive.current) {
                        animationFrameId = requestAnimationFrame(scanFrameJsQR);
                    }
                }
            }
        };

        const startScan = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                const videoElement = videoRef.current;
                if (videoElement) {
                    videoElement.srcObject = stream;
                    videoElement.play().then(() => {
                        if (scannerActive.current) {
                            if (useNativeScanner && barcodeDetector) {
                                scanFrameNative();
                            } else {
                                console.log("Using jsQR fallback for QR code scanning.");
                                scanFrameJsQR();
                            }
                        }
                    }).catch(err => {
                        if (err.name !== 'AbortError') {
                            console.error("Camera play error:", err);
                            onError("Gagal memulai kamera.");
                        } else {
                            console.log("Camera play() was aborted on unmount.");
                        }
                    });
                }
            } catch (err) {
                console.error("Camera error:", err);
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError') {
                        onError("Izin kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda.");
                    } else if (err.name === 'NotFoundError') {
                         onError("Tidak ada kamera yang ditemukan. Pastikan kamera terhubung dan tidak digunakan oleh aplikasi lain.");
                    } else {
                         onError("Tidak bisa mengakses kamera. Silakan coba lagi.");
                    }
                } else {
                    onError("Terjadi kesalahan saat memulai kamera.");
                }
            }
        };
        
        startScan();

        return () => {
            scannerActive.current = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.srcObject = null;
            }
        };
    }, [onScan, onError]);

    return (
        <div className="relative w-full aspect-square bg-slate-800 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline aria-label="Camera feed for QR code scanning" />
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none">
                 <p className="mb-4 text-center bg-black bg-opacity-60 px-3 py-1.5 rounded-lg text-sm">Arahkan kamera ke QR Code</p>
                <div className="w-2/3 max-w-xs aspect-square border-4 border-dashed border-primary/80 rounded-xl animate-pulse"></div>
            </div>
        </div>
    );
};

const PetugasScanPage: React.FC = () => {
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [wargaId, setWargaId] = useState('');
    const [warga, setWarga] = useState<Warga | null>(null);
    const [hasPaidToday, setHasPaidToday] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scannerKey, setScannerKey] = useState(Date.now());
    const { petugas } = useAuth();
    
    const resetState = useCallback(() => {
        setWarga(null);
        setWargaId('');
        setError('');
        setSuccess(false);
        setLoading(false);
        setHasPaidToday(false);
        setMode('scan');
        setScannerKey(Date.now());
    }, []);

    const fetchWarga = useCallback(async (id: string) => {
        setLoading(true);
        setError('');
        setWarga(null);
        setHasPaidToday(false);
        try {
            const [data, scheduleData] = await Promise.all([
                getWargaById(id),
                getScheduleForToday()
            ]);

            if (data) {
                if (scheduleData.isHoliday) {
                    setError('Hari ini jadwal libur, tidak ada pengambilan sampah.');
                    const timer = setTimeout(() => resetState(), 2500);
                    return () => clearTimeout(timer);
                }

                if (!scheduleData.dukuhIds.includes(data.dukuhId)) {
                    setError('Warga ini tidak masuk dalam jadwal pengambilan hari ini.');
                    const timer = setTimeout(() => resetState(), 2500);
                    return () => clearTimeout(timer);
                }

                setWarga(data);
                const paidToday = await checkIfWargaPaidToday(id);
                setHasPaidToday(paidToday);
            } else {
                setError(`ID Warga "${id}" tidak ditemukan.`);
                const timer = setTimeout(() => {
                    resetState();
                }, 2500);
                return () => clearTimeout(timer);
            }
        } catch (err) {
            setError('Gagal memuat data warga.');
        } finally {
            setLoading(false);
        }
    }, [resetState]);
    
    useEffect(() => {
        if (success) {
            setIsModalOpen(true);
            const timer = setTimeout(() => {
                resetState();
                setIsModalOpen(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [success, resetState]);

    const handleScan = useCallback((id: string) => {
        setWargaId(id);
        fetchWarga(id);
    }, [fetchWarga]);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (wargaId.length === 6) {
            fetchWarga(wargaId);
        } else {
            setError('ID Warga harus 6 digit.');
        }
    };

    const handleSavePayment = async () => {
        if (!warga || !petugas) return;
        setLoading(true);
        try {
            await createTransaksi({
                wargaId: warga.id,
                petugasId: petugas.id,
                amount: warga.dailyFee,
            });
            setSuccess(true);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Gagal menyimpan pembayaran.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getDukuhName = (id: number) => getDukuhById(id)?.name || 'N/A';
    const getRTNumber = (id: number) => getRTById(id)?.number || 'N/A';

    return (
        <div className="flex-grow p-4 max-w-md mx-auto w-full">
            {!warga && !success && (
                <div className="animate-fade-in space-y-4">
                    <div className="p-1 bg-slate-200 rounded-xl flex">
                        <button onClick={() => { setError(''); setMode('scan'); }} className={`flex-1 py-2 text-center font-semibold rounded-lg transition-all ${mode === 'scan' ? 'bg-white text-primary shadow-md' : 'text-slate-600'}`}>Scan QR</button>
                        <button onClick={() => { setError(''); setMode('manual'); }} className={`flex-1 py-2 text-center font-semibold rounded-lg transition-all ${mode === 'manual' ? 'bg-white text-primary shadow-md' : 'text-slate-600'}`}>Input Manual</button>
                    </div>
                    {mode === 'scan' ? (
                        <QRScanner key={scannerKey} onScan={handleScan} onError={setError} />
                    ) : (
                        <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                            <label htmlFor="wargaId" className="block text-slate-700 font-semibold mb-2">ID Warga (6 Digit)</label>
                            <input
                                type="tel"
                                id="wargaId"
                                value={wargaId}
                                onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                className="w-full text-lg px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <button type="submit" disabled={loading} className="w-full mt-4 bg-primary text-primary-content font-bold py-3 rounded-lg hover:bg-primary-focus disabled:bg-slate-400">
                                {loading ? 'Mencari...' : 'Cari Warga'}
                            </button>
                        </form>
                    )}
                    {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                </div>
            )}
            
            {loading && !warga && !error && (
                 <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in text-center">
                    <p>Mencari data untuk ID: {wargaId}...</p>
                </div>
            )}

            {warga && !success && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200/80 animate-slide-in-up">
                    <h2 className="text-2xl font-bold font-display text-slate-800">{warga.name}</h2>
                    <p className="text-slate-500 mb-1">ID: <span className="font-mono">{warga.id}</span></p>
                    <p className="text-slate-500 mb-4">Wilayah: <span className="font-semibold text-slate-600">RT {getRTNumber(warga.rtId)}, {getDukuhName(warga.dukuhId)}</span></p>
                    
                    <div className="border-t border-slate-200 pt-4 mt-4">
                        <p className="text-slate-600 text-center">Tarif Retribusi Harian</p>
                        <p className="text-5xl font-bold font-display text-primary my-2 text-center">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(warga.dailyFee)}
                        </p>
                    </div>

                    {hasPaidToday && (
                        <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
                            <p className="font-semibold text-green-800">Lunas Hari Ini</p>
                            <p className="text-sm text-green-700">Warga ini sudah melakukan pembayaran hari ini.</p>
                        </div>
                    )}
                    
                    {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

                    <div className="mt-6 space-y-3">
                        <button onClick={handleSavePayment} disabled={loading || hasPaidToday} className="w-full bg-gradient-to-br from-success to-green-500 text-white font-bold py-4 rounded-lg text-lg hover:shadow-lg disabled:bg-slate-400 disabled:from-slate-400 disabled:to-slate-400 disabled:opacity-60 transition-all">
                            {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                        </button>
                        <button onClick={resetState} className="w-full text-slate-600 font-semibold py-3 rounded-lg hover:bg-slate-100 transition-colors">
                            Batal / Scan Ulang
                        </button>
                    </div>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sukses">
                <div className="text-center">
                    <CheckCircleIcon className="text-6xl text-success mx-auto mb-4" />
                    <h3 className="text-2xl font-bold font-display text-slate-800">Pembayaran Berhasil</h3>
                    <p className="text-slate-600 mt-2">Transaksi telah berhasil dicatat.</p>
                </div>
            </Modal>
        </div>
    );
};

export default PetugasScanPage;