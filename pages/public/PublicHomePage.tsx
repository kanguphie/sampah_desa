
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import jsQR from 'jsqr';
import { 
    getWargaById, 
    getTransactionsByWargaId, 
    getAllDukuh, 
    getAllRT, 
    getActiveAnnouncements, 
    getPublicDashboardStats, 
    checkIfWargaPaidToday 
} from '@/services/api';
import type { Warga, Transaksi, Announcement, PublicStats, Dukuh, RT } from '@/types';
import { 
    SearchIcon, 
    LeafIcon, 
    RecycleIcon, 
    SparklesIcon, 
    BanknotesIcon, 
    CheckCircleIcon, 
    ClockIcon,
    ChartBarIcon,
    ReportIcon,
    UsersIcon,
    ClipboardListIcon,
    IdentificationIcon,
    HomeIcon,
    QrCodeIcon
} from '@/components/icons';
import PublicHeader from '@/components/PublicHeader';

const PublicHomePage: React.FC = () => {
  const [wargaId, setWargaId] = useState('');
  const [warga, setWarga] = useState<Warga | null>(null);
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [hasPaidToday, setHasPaidToday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Scan QR stiker (publik): kamera + jsQR, pola yang sama dengan scan petugas.
  const [showScan, setShowScan] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastScanTimeRef = useRef(0);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
  const [rtList, setRtList] = useState<RT[]>([]);
  
  const searchSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const fetchPublicData = async () => {
          try {
              const [announcementData, statsData, dList, rList] = await Promise.all([
                  getActiveAnnouncements(), 
                  getPublicDashboardStats(),
                  getAllDukuh(),
                  getAllRT()
              ]);
              setAnnouncements(announcementData);
              setStats(statsData);
              setDukuhList(dList);
              setRtList(rList);
          } catch (e) {
              console.error("Error loading public data", e);
          }
      };
      fetchPublicData();
  }, []);

  // Inti pengecekan (dipakai form ketik ID maupun hasil scan QR).
  const doSearch = useCallback(async (id: string) => {
    if (id.length !== 6) {
      setError('ID Warga harus 6 digit angka.');
      setWarga(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const wargaData = await getWargaById(id);
      if (wargaData) {
        setWarga(wargaData);
        const [transactionData, paidToday] = await Promise.all([
            getTransactionsByWargaId(id, 10),
            checkIfWargaPaidToday(id)
        ]);
        setTransactions(transactionData);
        setHasPaidToday(paidToday?.paid === true);
      } else {
        setError('ID Warga tidak ditemukan. Cek kembali nomor Anda.');
        setWarga(null);
      }
    } catch (err) {
      setError('Terjadi gangguan koneksi. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(wargaId);
  };

  const closeScan = () => { setShowScan(false); setScanError(null); };

  // Kamera + jsQR: buka saat modal scan tampil, matikan saat ditutup.
  useEffect(() => {
    if (!showScan) return;
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const tick = (time: number) => {
      animationFrameId = requestAnimationFrame(tick);
      if (!isScanningRef.current || isProcessingRef.current) return;
      // Throttling: pindai tiap 200ms agar CPU tidak panas.
      if (time - lastScanTimeRef.current < 200) return;
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
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data) {
            const id = code.data.trim();
            if (/^\d{6}$/.test(id)) {
              // QR stiker berisi ID warga 6 digit: tutup kamera, isi ID, langsung cek.
              isProcessingRef.current = true;
              isScanningRef.current = false;
              setShowScan(false);
              setScanError(null);
              setWargaId(id);
              doSearch(id);
            } else {
              setScanError('QR ini bukan stiker SapaDesa. Arahkan kamera ke QR di stiker rumah Anda.');
            }
          }
        }
      }
    };

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
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
        setScanError('Akses kamera ditolak atau tidak tersedia. Ketik ID secara manual.');
      }
    };
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      cancelAnimationFrame(animationFrameId);
      isScanningRef.current = false;
      isProcessingRef.current = false;
    };
  }, [showScan, doSearch]);

  const closeResult = () => { setWarga(null); setWargaId(''); };

  useEffect(() => {
      document.body.style.overflow = warga ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
  }, [warga]);

  useEffect(() => {
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeResult(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
  }, []);

  const getDukuhName = (id: number) => dukuhList.find(d => d.id === id)?.name || 'N/A';
  const getRTNumber = (id: number) => rtList.find(r => r.id === id)?.number || 'N/A';

  // Gabung pembayaran satu hari jadi satu baris: warga lebih mudah mengingat
  // berapa uang yang dia isi hari itu (iuran + deposit). Rincian pecahannya
  // tetap ada di halaman Riwayat Transaksi admin.
  const groupedTransactions = (() => {
    const paid = transactions.filter(tx => ['paid', 'lunas'].includes(String(tx.status || '').toLowerCase()));
    const byDay = new Map<string, { key: string; date: Date; amount: number }>();
    for (const tx of paid) {
      const d = tx.timestamp instanceof Date ? tx.timestamp : new Date(tx.timestamp as any);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const cur = byDay.get(key);
      if (!cur) {
        byDay.set(key, { key, date: d, amount: Number(tx.amount) || 0 });
      } else {
        cur.amount += Number(tx.amount) || 0;
        if (d.getTime() < cur.date.getTime()) cur.date = d;
      }
    }
    return [...byDay.values()].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);
  })();

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <PublicHeader />

        <main className="flex-grow overflow-x-hidden">
            {/* Hero Section */}
            <section ref={searchSectionRef} className="relative overflow-hidden -mt-20 bg-gradient-to-b from-white via-[#f2fbf5] to-white">
                <div className="absolute -top-48 -right-32 w-[44rem] h-[44rem] bg-emerald-100/70 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-64 -left-40 w-96 h-96 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>
                {/* Illustration full-bleed (desktop): memenuhi sisi kanan sampai tepi layar */}
                <div className="hidden lg:block absolute top-24 right-0 w-[54%] pointer-events-none" aria-hidden="true">
                    <img
                        src="/images/hero-sampah.png"
                        alt=""
                        className="w-full h-auto mix-blend-multiply [mask-image:radial-gradient(ellipse_74%_74%_at_58%_40%,black_60%,transparent_99%)] [-webkit-mask-image:radial-gradient(ellipse_74%_74%_at_58%_40%,black_60%,transparent_99%)]"
                    />
                </div>
                <div className="container relative mx-auto px-6 pt-28 pb-28 md:pt-36 md:pb-32">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div className="animate-fade-in">
                        <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 font-bold text-[11px] md:text-xs uppercase tracking-[0.15em] px-4 py-2 rounded-full">
                            <LeafIcon /> # Rowosari_Transparan
                        </span>
                        <h1 className="mt-6 text-[2.4rem] md:text-6xl font-extrabold text-slate-800 leading-[1.08] text-center md:text-left tracking-tight">
                            Digitalisasi <span className="text-emerald-500">Retribusi</span><br className="hidden md:block" /> Sampah Desa
                        </h1>
                        <p className="mt-5 text-slate-500 text-base md:text-lg leading-relaxed text-center md:text-left max-w-xl mx-auto md:mx-0">
                            Layanan pengecekan iuran warga Desa Rowosari. Masukkan ID Anda atau scan QR di stiker rumah untuk melihat status pembayaran terbaru.
                        </p>

                        <div className="mt-9 max-w-xl mx-auto md:mx-0">
                            <form onSubmit={handleSearch} className="group relative">
                                <div className={`relative flex items-center gap-2 transition-all duration-300 bg-white rounded-full p-2 pl-3 ${error ? 'ring-4 ring-rose-100 border border-rose-200' : 'border border-slate-100 focus-within:ring-4 focus-within:ring-emerald-100 shadow-[0_20px_50px_-20px_rgba(16,185,129,0.35)]'}`}>
                                    <div className="pl-3 text-slate-400 group-focus-within:text-emerald-500 transition-colors shrink-0">
                                        <IdentificationIcon className="text-2xl md:text-[1.7rem]" />
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={wargaId}
                                        onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Masukkan 6 Digit ID Warga"
                                        maxLength={6}
                                        className="w-full min-w-0 bg-transparent px-2 py-3 md:py-4 outline-none font-semibold text-base md:text-lg text-slate-800 placeholder:text-slate-400"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="shrink-0 bg-emerald-500 text-white font-bold px-6 md:px-9 py-3 md:py-4 rounded-full hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 disabled:bg-slate-300 flex items-center gap-2.5 text-sm md:text-base"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (<><SearchIcon /> Cek <i className="fa-solid fa-arrow-right text-xs"></i></>)}
                                    </button>
                                </div>

                                {error && (
                                    <div className="absolute top-full left-0 w-full mt-3 flex items-center gap-2 text-rose-500 font-bold text-[10px] md:text-xs uppercase bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100 animate-fade-in z-10">
                                        <i className="fa-solid fa-circle-exclamation"></i> {error}
                                    </div>
                                )}
                            </form>

                            {/* Scan QR stiker: arahkan kamera ke QR di stiker rumah, ID terisi otomatis lalu dicek */}
                            <button
                                type="button"
                                onClick={() => { setScanError(null); setShowScan(true); }}
                                className="mt-4 w-full inline-flex items-center justify-center gap-2.5 bg-white text-emerald-600 font-bold px-6 py-3.5 rounded-full border-2 border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50 active:scale-[0.98] transition-all text-sm md:text-base shadow-sm"
                            >
                                <QrCodeIcon /> Scan QR di Stiker Rumah
                            </button>
                            <p className="mt-2.5 text-center md:text-left text-xs text-slate-400 font-semibold">Tidak hafal ID? Arahkan kamera ke QR di stiker rumah Anda.</p>

                            <div className="mt-7 flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-[13px] font-semibold text-slate-600">
                                <span className="flex items-center gap-2">
                                    <i className="fa-solid fa-shield-halved text-emerald-500"></i> Gunakan ID yang Valid
                                </span>
                                <span className="hidden md:block w-px h-4 bg-slate-300"></span>
                                <span className="flex items-center gap-2">
                                    <i className="fa-solid fa-lock text-emerald-500"></i> Layanan Aman &amp; Terpercaya
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Illustration (mobile/tablet, in flow) */}
                    <div className="relative animate-fade-in delay-200 lg:hidden">
                        <img
                            src="/images/hero-sampah.png"
                            alt="Ilustrasi pengelolaan sampah Desa Rowosari"
                            className="relative w-full h-auto max-w-xl mx-auto mix-blend-multiply [mask-image:radial-gradient(ellipse_72%_72%_at_50%_46%,black_58%,transparent_98%)] [-webkit-mask-image:radial-gradient(ellipse_72%_72%_at_50%_46%,black_58%,transparent_98%)]"
                        />
                    </div>
                </div>
                </div>
            </section>

            {/* Strip Fitur */}
            <section className="container mx-auto px-6 relative z-10 -mt-16 pb-4">
                <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-[0_25px_60px_-25px_rgba(15,60,40,0.25)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-100 overflow-hidden">
                    {[
                        { icon: ClipboardListIcon, tint: 'bg-emerald-50 text-emerald-500', title: 'Cek Iuran Mudah', desc: 'Masukkan ID atau scan QR stiker, langsung ketahuan statusnya.', to: null as string | null },
                        { icon: ReportIcon, tint: 'bg-blue-50 text-blue-500', title: 'Laporan Transparan', desc: 'Data pembayaran dapat diakses kapan saja.', to: '/laporan-publik' },
                        { icon: LeafIcon, tint: 'bg-emerald-50 text-emerald-500', title: 'Pengelolaan Sampah', desc: 'Dukung lingkungan bersih dan berkelanjutan.', to: null },
                        { icon: UsersIcon, tint: 'bg-violet-50 text-violet-500', title: 'Untuk Semua Warga', desc: 'Mudah diakses di mana saja dan kapan saja.', to: null },
                    ].map((f, i) => {
                        const content = (
                            <>
                                <div className={`w-16 h-16 shrink-0 rounded-[1.25rem] flex items-center justify-center text-[1.7rem] ${f.tint}`}>
                                    <f.icon />
                                </div>
                                <div>
                                    <h3 className="text-[17px] font-bold text-slate-800 leading-snug">{f.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed mt-1.5 text-balance">{f.desc}</p>
                                </div>
                            </>
                        );
                        const cls = "flex items-start gap-5 px-8 py-7 hover:bg-slate-50/70 transition-colors";
                        return f.to
                            ? <Link key={i} to={f.to} className={cls}>{content}</Link>
                            : <div key={i} className={cls}>{content}</div>;
                    })}
                </div>
            </section>

            {/* Cara Penggunaan */}
            <section className="container mx-auto px-6 py-14 md:py-20">
                <p className="font-bold text-emerald-500 text-xs md:text-sm uppercase tracking-[0.2em] mb-4">Cara Penggunaan</p>
                <div className="grid lg:grid-cols-[1fr_1.5fr] gap-10 lg:gap-16 items-start">
                    <div>
                        <h2 className="text-3xl md:text-[2.6rem] font-extrabold text-slate-800 leading-tight tracking-tight">
                            Cek Iuran Sampah<br /><span className="text-emerald-500">Semakin Mudah</span>
                        </h2>
                        <p className="mt-4 text-slate-500 leading-relaxed max-w-md">
                            Ikuti langkah sederhana berikut untuk mengetahui status pembayaran iuran sampah Anda.
                        </p>
                        <button onClick={() => searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="mt-7 inline-flex items-center gap-2.5 bg-emerald-500 text-white font-bold px-7 py-3.5 rounded-full hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/25 text-sm">
                            Mulai Cek Sekarang <i className="fa-solid fa-arrow-up text-xs"></i>
                        </button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-8 sm:gap-6 lg:pt-4">
                        {[
                            { icon: IdentificationIcon, title: 'ID Warga / Scan QR', desc: 'Ketik 6 digit ID warga Anda, atau pindai QR di stiker rumah.' },
                            { icon: SearchIcon, title: 'Klik Cek', desc: 'Sistem akan menampilkan informasi pembayaran Anda.' },
                            { icon: CheckCircleIcon, title: 'Lihat Hasil', desc: 'Status iuran, riwayat pembayaran, dan informasi lainnya.' },
                        ].map((s, i) => (
                            <div key={i} className={`relative ${i > 0 ? 'sm:border-l sm:border-slate-200/70 sm:pl-6 lg:pl-8' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100/80 text-emerald-600 font-extrabold text-sm shrink-0">{i + 1}</span>
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl shadow-inner">
                                        <s.icon />
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-800 mt-4">{s.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed mt-1.5">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistik */}
            {!warga && stats && (
                <section className="py-12 md:py-20 bg-slate-50 border-y border-slate-100">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                            {[
                                { label: 'Warga Terdaftar', val: stats.totalWarga, icon: LeafIcon, color: 'emerald' },
                                { label: 'Transaksi Bulan Ini', val: stats.totalTransaksiBulanIni, icon: RecycleIcon, color: 'blue' },
                                { label: 'Dana Terkumpul', val: `Rp${stats.totalDanaTerkumpulBulanIni.toLocaleString('id-ID')}`, icon: SparklesIcon, color: 'amber' },
                            ].map((item, i) => (
                                <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center group hover:-translate-y-1 transition-all">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-inner transition-transform group-hover:scale-110 ${
                                        item.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' : 
                                        item.color === 'blue' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'
                                    }`}>
                                        <item.icon className="text-2xl" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-800">{item.val}</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mt-2">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            
        </main>

            {/* Scan QR Stiker - Modal kamera */}
            {showScan && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Scan QR stiker">
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={closeScan}></div>
                <div className="relative bg-white w-full sm:max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-in-up">
                  <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                    <h3 className="font-black text-slate-900">Scan QR Stiker</h3>
                    <button onClick={closeScan} aria-label="Tutup" className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3]">
                      <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                      <canvas ref={canvasRef} className="hidden" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-56 h-56 rounded-3xl border-[3px] border-emerald-400/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]"></div>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-sm text-slate-500 font-semibold">Arahkan kamera ke QR di stiker rumah Anda.</p>
                    {scanError && (
                      <p className="mt-3 text-center text-rose-500 font-bold text-xs bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">{scanError}</p>
                    )}
                    <button onClick={closeScan} className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-full transition-colors text-sm">
                      Ketik ID Manual
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Hasil Pencarian - Modal */}
            {warga && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Hasil pencarian warga">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeResult}></div>
                <div className="relative bg-slate-50 w-full sm:max-w-lg rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-slide-in-up">
                  <div className="px-4 py-3.5 bg-white border-b border-slate-100 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-lg shrink-0">
                      {warga.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-900 leading-tight truncate">Halo, {warga.name.split(' ')[0]}! 👋</h3>
                      <p className="text-[11px] text-slate-500 font-bold truncate">ID {warga.id} • {getDukuhName(warga.dukuhId)} • RT {getRTNumber(warga.rtId)}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${hasPaidToday ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                      {hasPaidToday ? <CheckCircleIcon className="text-xs" /> : <ClockIcon className="text-xs" />}
                      {hasPaidToday ? 'Lunas' : 'Pending'}
                    </span>
                    <button onClick={closeResult} aria-label="Tutup" className="shrink-0 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                  <div className="overflow-y-auto p-4 space-y-3">
                    <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sisa Tunggakan</span>
                      {warga.totalDebt > 0 ? (
                        <span className="font-black text-lg text-rose-600">Rp{warga.totalDebt.toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-600"><CheckCircleIcon /> Beres</span>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Catatan Pembayaran</h4>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">10 pembayaran terakhir</p>
                      </div>
                      <table className="w-full text-left">
                        <thead className="bg-slate-50/80 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          <tr>
                            <th className="py-2.5 px-4">Waktu</th>
                            <th className="py-2.5 px-4 text-right">Nominal</th>
                            <th className="py-2.5 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {groupedTransactions.length > 0 ? groupedTransactions.map(g => (
                            <tr key={g.key} className="hover:bg-slate-50/50">
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-700 text-sm">{g.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                                <p className="text-[10px] font-bold text-slate-400">{g.date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                              </td>
                              <td className="py-3 px-4 text-right font-black text-slate-900 text-sm font-mono">Rp{g.amount.toLocaleString('id-ID')}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="inline-flex items-center gap-1 bg-emerald-500 text-white py-1 px-3 rounded-full text-[9px] font-black uppercase tracking-wider">
                                  <CheckCircleIcon className="text-[9px]" /> Masuk
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={3} className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[11px]">Belum ada riwayat pembayaran</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Link to="/contact" className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors py-1">
                      Ada Masalah? Hubungi Admin
                    </Link>
                  </div>
                </div>
              </div>
            )}
        <footer className="bg-slate-900 text-slate-500 py-12 md:py-16">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-800 pb-12 mb-12 text-center md:text-left">
                    <div className="bg-white/10 text-white font-bold text-xl px-6 py-3 rounded-lg -skew-x-12">SapaDesa</div>
                    <nav className="flex flex-wrap justify-center gap-6 md:gap-10 text-[10px] font-black uppercase tracking-[0.2em]">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <Link to="/laporan-publik" className="hover:text-emerald-400 transition-colors">Laporan</Link>
                        <Link to="/tips" className="hover:text-white transition-colors">Tips</Link>
                        <Link to="/contact" className="hover:text-white transition-colors">Hubungi Kami</Link>
                    </nav>
                </div>
                <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">&copy; {new Date().getFullYear()} Karang Taruna Mahardika Rowosari • Modernisasi Untuk Desa</p>
                </div>
            </div>
        </footer>
        <style>{`
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>
    </div>
  );
};

export default PublicHomePage;
