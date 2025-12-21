
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
    getWargaById, 
    getTransactionsByWargaId, 
    getDukuhById, 
    getRTById, 
    getActiveAnnouncements, 
    getPublicDashboardStats, 
    checkIfWargaPaidToday 
} from '@/services/api';
import type { Warga, Transaksi, Announcement, PublicStats } from '@/types';
import { 
    SearchIcon, 
    LeafIcon, 
    RecycleIcon, 
    SparklesIcon, 
    BanknotesIcon, 
    CheckCircleIcon, 
    ClockIcon,
    ScaleBalancedIcon,
    ClipboardListIcon
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
  
  const resultRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const fetchPublicData = async () => {
          try {
              const [announcementData, statsData] = await Promise.all([
                  getActiveAnnouncements(), 
                  getPublicDashboardStats()
              ]);
              setAnnouncements(announcementData);
              setStats(statsData);
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

  const getDukuhName = (id: number) => getDukuhById(id)?.name || 'N/A';
  const getRTNumber = (id: number) => getRTById(id)?.number || 'N/A';

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
        <PublicHeader />

        <main className="flex-grow overflow-x-hidden">
            {/* Hero Section */}
            <section ref={searchSectionRef} className="container mx-auto px-6 py-8 md:py-24">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="animate-fade-in">
                        <p className="font-bold text-emerald-500 text-xs md:text-sm uppercase tracking-[0.2em] mb-4 text-center md:text-left">#Rowosari_Transparan</p>
                        <h1 className="text-[2.2rem] md:text-6xl font-black text-slate-900 leading-[1.1] text-center md:text-left tracking-tight">
                            Digitalisasi <span className="text-emerald-500">Retribusi</span> Sampah Desa
                        </h1>
                        <p className="mt-5 text-slate-500 text-base md:text-lg font-medium leading-relaxed text-center md:text-left max-w-xl mx-auto md:mx-0">
                            Layanan pengecekan iuran warga Desa Rowosari. Masukkan ID Anda untuk melihat status pembayaran terbaru.
                        </p>

                        <div className="mt-10 max-w-lg mx-auto md:mx-0">
                            <form onSubmit={handleSearch} className="group relative">
                                <div className={`relative flex items-center transition-all duration-300 bg-slate-50 border-2 rounded-[2rem] p-1.5 ${error ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-100 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white shadow-xl shadow-slate-200/50'}`}>
                                    <div className="pl-6 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                        <SearchIcon className="text-xl md:text-2xl" />
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={wargaId}
                                        onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Masukkan 6 Digit ID Warga"
                                        maxLength={6}
                                        className="w-full bg-transparent px-4 py-4 md:py-5 outline-none font-bold text-lg md:text-xl text-slate-800 placeholder:text-slate-300 placeholder:font-bold"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-emerald-500 text-white font-black px-6 md:px-10 py-3.5 md:py-4 rounded-[1.5rem] hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 disabled:bg-slate-300 flex items-center gap-2 text-xs md:text-sm uppercase tracking-widest"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Cek'}
                                    </button>
                                </div>

                                {error && (
                                    <div className="absolute top-full left-0 w-full mt-3 flex items-center gap-2 text-rose-500 font-bold text-[10px] md:text-xs uppercase bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100 animate-fade-in">
                                        <i className="fa-solid fa-circle-exclamation"></i> {error}
                                    </div>
                                )}
                            </form>
                            
                            <div className="mt-8 flex flex-col md:flex-row items-center gap-3 md:gap-4 opacity-70">
                                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                                    <CheckCircleIcon className="text-emerald-500 text-sm" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Gunakan 6 digit angka</span>
                                </div>
                                <span className="hidden md:block text-slate-300">|</span>
                                <Link to="/contact" className="text-[10px] font-black text-slate-400 uppercase tracking-tighter hover:text-emerald-500 underline underline-offset-4">Lupa Nomor ID?</Link>
                            </div>
                        </div>

                        <div className="mt-12 flex justify-center md:justify-start">
                            <Link to="/laporan-publik" className="group bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/30 flex items-center gap-3">
                                <ScaleBalancedIcon className="group-hover:rotate-12 transition-transform" /> 
                                Lihat Transparansi Kas Desa
                            </Link>
                        </div>
                    </div>

                    {/* Illustration - Hidden on Mobile */}
                    <div className="hidden lg:block animate-fade-in delay-200">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-[3rem] blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                            <img
                                src="https://blud.co.id/wp/wp-content/uploads/2025/09/27aec6f5e1d902e689c8c93fe337eb0c.jpg"
                                alt="Rowosari Bersih"
                                className="relative w-full h-auto max-w-lg rounded-[3rem] shadow-2xl border-8 border-white transform rotate-2 group-hover:rotate-0 transition-all duration-500"
                            />
                        </div>
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
            
            {/* Hasil Pencarian */}
            {warga && (
              <section ref={resultRef} className="py-16 md:py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto animate-slide-in-up">
                        <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Halo, {warga.name} 👋</h2>
                                <p className="text-slate-500 font-medium text-base md:text-lg mt-1">Data retribusi sampah terbaru Anda.</p>
                            </div>
                            <button onClick={() => setWarga(null)} className="w-full md:w-auto text-[10px] font-black text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-2xl border-2 border-emerald-100 transition-all uppercase tracking-widest flex items-center justify-center gap-2">
                                <SearchIcon className="text-sm" /> Cari ID Lain
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-colors">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Informasi Akun</p>
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">{warga.name.charAt(0)}</div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-xl leading-none">{warga.name}</h4>
                                            <p className="text-[10px] text-slate-400 mt-2 font-mono font-bold tracking-tighter">ID: {warga.id}</p>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-50 space-y-3">
                                        <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Wilayah</span> <span className="text-slate-700">Dukuh {getDukuhName(warga.dukuhId)}</span></div>
                                        <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase">Unit RT</span> <span className="text-slate-700">RT {getRTNumber(warga.rtId)}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between transition-all ${hasPaidToday ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-6 ${hasPaidToday ? 'text-emerald-600' : 'text-amber-600'}`}>Status Hari Ini</p>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm ${hasPaidToday ? 'bg-white text-emerald-500' : 'bg-white text-amber-500'}`}>
                                            {hasPaidToday ? <CheckCircleIcon /> : <ClockIcon />}
                                        </div>
                                        <div>
                                            <h4 className={`text-2xl md:text-3xl font-black ${hasPaidToday ? 'text-emerald-700' : 'text-amber-700'}`}>{hasPaidToday ? 'LUNAS' : 'PENDING'}</h4>
                                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest italic">{new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between transition-all ${warga.totalDebt > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-6 ${warga.totalDebt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Sisa Tunggakan</p>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm ${warga.totalDebt > 0 ? 'bg-white text-rose-500' : 'bg-white text-slate-300'}`}>
                                            <BanknotesIcon />
                                        </div>
                                        <div>
                                            <h4 className={`text-2xl md:text-3xl font-black ${warga.totalDebt > 0 ? 'text-rose-700' : 'text-slate-400'}`}>Rp{warga.totalDebt.toLocaleString('id-ID')}</h4>
                                            <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${warga.totalDebt > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {warga.totalDebt > 0 ? 'Mohon Segera Dilunasi' : 'Semua Beres!'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                          <div className="p-6 md:p-10 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><ClipboardListIcon className="text-2xl" /></div>
                              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Catatan Riwayat Terakhir</h3>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100 font-black text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.2em]">
                                  <tr><th className="py-5 px-6 md:px-10">Tanggal Pembayaran</th><th className="py-5 px-6 md:px-10 hidden sm:table-cell">Kategori</th><th className="py-5 px-6 md:px-10 text-right">Nominal</th><th className="py-5 px-6 md:px-10 text-center">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="py-6 px-6 md:px-10">
                                          <p className="font-black text-slate-700 text-sm md:text-base">{tx.timestamp.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{tx.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                                      </td>
                                      <td className="py-6 px-6 md:px-10 hidden sm:table-cell">
                                          <span className={`text-[10px] font-black uppercase tracking-tighter px-3.5 py-1.5 rounded-xl border-2 ${tx.category === 'TUNGGAKAN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                              {tx.category === 'TUNGGAKAN' ? 'Tunggakan' : 'Iuran Harian'}
                                          </span>
                                      </td>
                                      <td className="py-6 px-6 md:px-10 text-right font-black text-slate-800 text-base md:text-lg font-mono">Rp{tx.amount.toLocaleString('id-ID')}</td>
                                      <td className="py-6 px-6 md:px-10 text-center">
                                        <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest">
                                          <CheckCircleIcon className="text-[10px]" /> <span className="hidden xs:inline">Lunas</span>
                                        </div>
                                      </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="text-center py-20"><div className="flex flex-col items-center"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mb-4 shadow-inner"><i className="fa-solid fa-folder-open"></i></div><p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Belum ada data riwayat.</p></div></td></tr>
                                  )}
                                </tbody>
                              </table>
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
