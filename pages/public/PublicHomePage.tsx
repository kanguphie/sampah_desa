
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    HomeIcon
} from '@/components/icons';
import PublicHeader from '@/components/PublicHeader';

const PublicHomePage: React.FC = () => {
  const [wargaId, setWargaId] = useState('');
  const [warga, setWarga] = useState<Warga | null>(null);
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [hasPaidToday, setHasPaidToday] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
  const [rtList, setRtList] = useState<RT[]>([]);
  
  const resultRef = useRef<HTMLDivElement>(null);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wargaId.length !== 6) {
      setError('ID Warga harus 6 digit angka.');
      setWarga(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const wargaData = await getWargaById(wargaId);
      if (wargaData) {
        setWarga(wargaData);
        const [transactionData, paidToday] = await Promise.all([
            getTransactionsByWargaId(wargaId, 10),
            checkIfWargaPaidToday(wargaId)
        ]);
        setTransactions(transactionData);
        setHasPaidToday(paidToday);
        
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setError('ID Warga tidak ditemukan. Cek kembali nomor Anda.');
        setWarga(null);
      }
    } catch (err) {
      setError('Terjadi gangguan koneksi. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const getDukuhName = (id: number) => dukuhList.find(d => d.id === id)?.name || 'N/A';
  const getRTNumber = (id: number) => rtList.find(r => r.id === id)?.number || 'N/A';

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <PublicHeader />

        <main className="flex-grow overflow-x-hidden">
            {/* Hero Section */}
            <section ref={searchSectionRef} className="relative overflow-hidden bg-gradient-to-b from-white via-[#f2fbf5] to-white">
                <div className="absolute -top-48 -right-32 w-[44rem] h-[44rem] bg-emerald-100/70 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-64 -left-40 w-96 h-96 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>
                <div className="container relative mx-auto px-6 pt-10 pb-28 md:pt-16 md:pb-32">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div className="animate-fade-in">
                        <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 font-bold text-[11px] md:text-xs uppercase tracking-[0.15em] px-4 py-2 rounded-full">
                            <LeafIcon /> # Rowosari_Transparan
                        </span>
                        <h1 className="mt-6 text-[2.4rem] md:text-6xl font-extrabold text-slate-800 leading-[1.08] text-center md:text-left tracking-tight">
                            Digitalisasi <span className="text-emerald-500">Retribusi</span><br className="hidden md:block" /> Sampah Desa
                        </h1>
                        <p className="mt-5 text-slate-500 text-base md:text-lg leading-relaxed text-center md:text-left max-w-xl mx-auto md:mx-0">
                            Layanan pengecekan iuran warga Desa Rowosari. Masukkan ID Anda untuk melihat status pembayaran terbaru.
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

                    {/* Illustration */}
                    <div className="relative animate-fade-in delay-200">
                        <img
                            src="/images/hero-sampah.png"
                            alt="Ilustrasi pengelolaan sampah Desa Rowosari"
                            className="relative w-full h-auto max-w-xl lg:max-w-none lg:w-[112%] mx-auto mix-blend-multiply [mask-image:radial-gradient(ellipse_72%_72%_at_50%_46%,black_58%,transparent_98%)] [-webkit-mask-image:radial-gradient(ellipse_72%_72%_at_50%_46%,black_58%,transparent_98%)]"
                        />
                    </div>
                </div>
                </div>
            </section>

            {/* Strip Fitur */}
            <section className="container mx-auto px-6 relative z-10 -mt-16 pb-4">
                <div className="bg-white rounded-[1.75rem] border border-slate-100 shadow-[0_25px_60px_-25px_rgba(15,60,40,0.25)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-slate-100 overflow-hidden">
                    {[
                        { icon: ClipboardListIcon, tint: 'bg-emerald-50 text-emerald-500', title: 'Cek Iuran Mudah', desc: 'Cukup masukkan ID warga, langsung ketahuan statusnya.', to: null as string | null },
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
                            { icon: IdentificationIcon, title: 'Masukkan ID Warga', desc: 'Ketik 6 digit ID warga Anda pada kolom pencarian.' },
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
            
            {/* Hasil Pencarian - Refined UI/UX */}
            {warga && (
              <section ref={resultRef} className="py-16 md:py-28 bg-slate-50/50 border-t border-slate-200 scroll-mt-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-6xl mx-auto animate-slide-in-up">
                        <div className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-4">
                                    Halo, {warga.name.split(' ')[0]}! <span className="animate-bounce">👋</span>
                                </h2>
                                <p className="text-slate-500 font-medium text-lg mt-2">Berikut adalah ringkasan akun retribusi Anda.</p>
                            </div>
                            <button onClick={() => { setWarga(null); setWargaId(''); }} className="group relative overflow-hidden bg-white text-emerald-600 font-black px-8 py-4 rounded-2xl border-2 border-emerald-100 transition-all hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 flex items-center gap-3 uppercase tracking-widest text-[10px]">
                                <div className="absolute inset-0 bg-emerald-50 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                                <SearchIcon className="text-sm relative z-10" /> <span className="relative z-10">Cari ID Lain</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {/* Card 1: Identitas */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                                <div className="flex items-center justify-between mb-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">Informasi Akun</p>
                                    <IdentificationIcon className="text-slate-200 text-2xl" />
                                </div>
                                <div className="flex items-center gap-6 mb-10">
                                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-emerald-500/20 transform -rotate-3 hover:rotate-0 transition-transform">
                                        {warga.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 text-2xl leading-none">{warga.name}</h4>
                                        <p className="text-xs text-emerald-500 font-mono font-black mt-2 tracking-widest">ID: {warga.id}</p>
                                    </div>
                                </div>
                                <div className="mt-auto space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <HomeIcon className="text-xs" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Dukuh</span>
                                        </div>
                                        <span className="font-black text-slate-700 text-sm">{getDukuhName(warga.dukuhId)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <RecycleIcon className="text-xs" />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Unit RT</span>
                                        </div>
                                        <span className="font-black text-slate-700 text-sm">RT {getRTNumber(warga.rtId)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Status Bayar */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${hasPaidToday ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-amber-500 border-amber-400 text-white shadow-amber-500/10'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <p className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Status Hari Ini</p>
                                    <ClockIcon className="text-white/40 text-2xl" />
                                </div>
                                <div className="flex flex-col items-center text-center py-4">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">
                                        {hasPaidToday ? <CheckCircleIcon /> : <ClockIcon />}
                                    </div>
                                    <h4 className="text-4xl font-black tracking-tight">{hasPaidToday ? 'LUNAS' : 'PENDING'}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 opacity-80">
                                        {new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}
                                    </p>
                                </div>
                                <div className="mt-auto pt-6 border-t border-white/10 text-center">
                                    <p className="text-[10px] font-black uppercase italic opacity-70">
                                        {hasPaidToday ? 'Terima kasih atas kontribusi Anda!' : 'Segera lakukan pembayaran ke petugas'}
                                    </p>
                                </div>
                            </div>

                            {/* Card 3: Tunggakan */}
                            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${warga.totalDebt > 0 ? 'bg-white border-rose-100' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <p className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${warga.totalDebt > 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>Sisa Tunggakan</p>
                                    <BanknotesIcon className={`${warga.totalDebt > 0 ? 'text-rose-200' : 'text-slate-200'} text-2xl`} />
                                </div>
                                <div className="flex flex-col items-center text-center py-4">
                                    <p className={`text-5xl font-black tracking-tighter ${warga.totalDebt > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                                        Rp{warga.totalDebt.toLocaleString('id-ID')}
                                    </p>
                                    <div className={`mt-6 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 ${warga.totalDebt > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {warga.totalDebt > 0 ? (
                                            <>Mohon Segera Dilunasi <i className="fa-solid fa-triangle-exclamation"></i></>
                                        ) : (
                                            <>Semua Sudah Beres! <CheckCircleIcon /></>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-auto pt-6 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter">Data real-time disinkronisasi otomatis</p>
                                </div>
                            </div>
                        </div>

                        {/* Riwayat Table Section */}
                        <div className="mt-16 bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden animate-slide-in-up delay-150">
                          <div className="p-8 md:p-12 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                              <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><ClipboardListIcon className="text-2xl" /></div>
                                  <div>
                                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Catatan Pembayaran</h3>
                                      <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">10 transaksi terakhir yang tercatat</p>
                                  </div>
                              </div>
                              <Link to="/contact" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-500 transition-colors border-2 border-slate-100 px-6 py-3 rounded-xl hover:border-emerald-200">
                                  Ada Masalah? Hubungi Admin
                              </Link>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100 font-black text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                                  <tr>
                                      <th className="py-6 px-10">Waktu Transaksi</th>
                                      <th className="py-6 px-10 hidden sm:table-cell">Jenis Layanan</th>
                                      <th className="py-6 px-10 text-right">Nominal</th>
                                      <th className="py-6 px-10 text-center">Verifikasi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="py-8 px-10">
                                          <p className="font-black text-slate-700 text-lg">{tx.timestamp.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{tx.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                                      </td>
                                      <td className="py-8 px-10 hidden sm:table-cell">
                                          <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${tx.category === 'TUNGGAKAN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                              {tx.category === 'TUNGGAKAN' ? 'Pelunasan Hutang' : 'Iuran Rutin'}
                                          </span>
                                      </td>
                                      <td className="py-8 px-10 text-right font-black text-slate-900 text-xl font-mono tracking-tighter">Rp{tx.amount.toLocaleString('id-ID')}</td>
                                      <td className="py-8 px-10 text-center">
                                        <div className="inline-flex items-center gap-2 bg-emerald-500 text-white py-2 px-5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                          <CheckCircleIcon className="text-[10px]" /> <span className="hidden xs:inline">Sudah Masuk</span>
                                        </div>
                                      </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="text-center py-28"><div className="flex flex-col items-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-5xl mb-6 shadow-inner"><i className="fa-solid fa-receipt"></i></div><p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Belum ada riwayat pembayaran yang tersedia.</p></div></td></tr>
                                  )}
                                </tbody>
                              </table>
                          </div>
                          <div className="bg-slate-50/50 p-8 border-t border-slate-100 text-center">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terima kasih atas partisipasi Anda dalam menjaga kebersihan Desa Rowosari</p>
                          </div>
                        </div>
                    </div>
                </div>
              </section>
            )}
        </main>

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
