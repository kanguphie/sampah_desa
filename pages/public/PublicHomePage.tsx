
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

const RecyclingIllustration: React.FC = () => (
    <div className="relative w-full h-full flex items-center justify-center lg:justify-end">
        <img
          src="https://blud.co.id/wp/wp-content/uploads/2025/09/27aec6f5e1d902e689c8c93fe337eb0c.jpg"
          alt="Ilustrasi daur ulang"
          className="w-full h-auto max-w-sm lg:max-w-lg rounded-[2.5rem] shadow-2xl object-cover border-4 lg:border-8 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500"
        />
    </div>
);

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
      setError('ID Warga harus 6 digit.');
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
        setError('ID Warga tidak ditemukan. Pastikan nomor ID benar.');
        setWarga(null);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mencari data.');
    } finally {
      setLoading(false);
    }
  };

  const getDukuhName = (id: number) => getDukuhById(id)?.name || 'N/A';
  const getRTNumber = (id: number) => getRTById(id)?.number || 'N/A';

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <div className="absolute top-0 left-0 w-full h-2 md:h-4 bg-teal-400"></div>
        <PublicHeader />

        <main className="flex-grow overflow-x-hidden">
            <section ref={searchSectionRef} id="hero" className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20">
                <div className="grid lg:grid-cols-2 gap-10 md:gap-16 items-center">
                    <div className="animate-fade-in order-2 lg:order-1">
                        <p className="font-bold text-teal-500 text-sm md:text-lg uppercase tracking-widest text-center lg:text-left mb-2 md:mb-4">#Rowosari_Transparan</p>
                        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 text-center lg:text-left leading-[1.1] md:leading-tight">
                            Digitalisasi <span className="text-primary relative inline-block px-1">Retribusi<span className="absolute bottom-1 left-0 w-full h-2 md:h-3 bg-teal-100 -z-10 rounded-full opacity-60"></span></span> Sampah Desa
                        </h1>
                        <p className="mt-4 md:mt-6 text-slate-600 max-w-lg mx-auto lg:mx-0 text-base md:text-lg font-medium leading-relaxed text-center lg:text-left">
                            Pastikan iuran kebersihan Anda tercatat dengan benar. Cek status pembayaran mandiri melalui ID Warga di bawah ini.
                        </p>

                        <div className="mt-8 md:mt-12">
                            <form onSubmit={handleSearch} className="animate-fade-in max-w-md mx-auto lg:mx-0">
                              <div className="flex flex-col rounded-3xl md:rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10 border-2 md:border-4 border-slate-100 bg-white p-1.5 md:p-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={wargaId}
                                  onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))}
                                  placeholder="Masukkan 6 Digit ID"
                                  maxLength={6}
                                  className="w-full px-5 py-4 md:py-6 bg-transparent focus:outline-none font-black text-xl md:text-2xl placeholder:text-slate-300 text-center lg:text-left"
                                />
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="w-full bg-emerald-500 text-white font-black py-4 md:py-5 px-8 rounded-2xl md:rounded-3xl hover:bg-emerald-600 transition-all duration-300 disabled:bg-slate-400 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 text-xs md:text-sm uppercase tracking-widest mt-1 md:mt-0"
                                >
                                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon className="text-lg md:text-xl"/>}
                                  Cek Status
                                </button>
                              </div>
                              {error && <div className="mt-4 p-3 bg-rose-50 text-rose-600 rounded-xl flex items-center gap-3 border border-rose-100 animate-shake font-bold text-xs italic"><i className="fa-solid fa-circle-exclamation"></i>{error}</div>}
                            </form>
                            <p className="mt-4 md:mt-6 text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-tighter flex items-center justify-center lg:justify-start gap-2">
                                <CheckCircleIcon className="text-emerald-500" /> Gunakan 6 digit ID di kartu warga Anda
                            </p>
                        </div>
                        
                        <div className="mt-8 md:mt-10 flex justify-center lg:justify-start">
                            <Link to="/laporan-publik" className="w-full max-w-md lg:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3">
                                <ScaleBalancedIcon /> Lihat Laporan Keuangan Desa
                            </Link>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 lg:block animate-fade-in delay-200">
                        <RecyclingIllustration />
                    </div>
                </div>
            </section>

            {/* Statistik Cepat */}
            {!warga && stats && (
                <section className="py-10 md:py-16 bg-slate-50 border-y border-slate-100">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center text-center group hover:border-primary/30 transition-colors">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform"><LeafIcon className="text-xl md:text-2xl"/></div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-800">{stats.totalWarga}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Warga Terdaftar</p>
                            </div>
                            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center text-center group hover:border-blue-300 transition-colors">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform"><RecycleIcon className="text-xl md:text-2xl"/></div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-800">{stats.totalTransaksiBulanIni}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaksi Bulan Ini</p>
                            </div>
                            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col items-center text-center group hover:border-amber-300 transition-colors">
                                <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform"><SparklesIcon className="text-xl md:text-2xl"/></div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-800">Rp{stats.totalDanaTerkumpulBulanIni.toLocaleString('id-ID')}</h3>
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dana Terkumpul</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            
            {/* AREA HASIL PENCARIAN WARGA */}
            {warga && (
              <section ref={resultRef} id="hasil-pencarian" className="py-12 md:py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto animate-slide-in-up">
                        <div className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-center md:text-left">
                            <div className="w-full md:w-auto">
                                <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-none md:leading-tight">Halo, {warga.name} 👋</h2>
                                <p className="text-slate-500 font-medium text-base md:text-lg mt-2">Berikut adalah ringkasan data retribusi sampah Anda.</p>
                            </div>
                            <button onClick={() => setWarga(null)} className="w-full md:w-auto text-[10px] font-black text-primary hover:bg-primary/10 px-6 py-4 rounded-2xl border-2 border-primary/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                <SearchIcon className="text-sm" /> Cari ID Lain
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-12">
                            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Identitas Warga</p>
                                    <div className="flex items-center gap-4 md:gap-5 mb-6">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center text-slate-500 font-black text-xl md:text-2xl">{warga.name.charAt(0)}</div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-lg md:text-xl leading-none">{warga.name}</h4>
                                            <p className="text-[10px] md:text-xs text-slate-400 mt-2 font-mono font-bold">ID: {warga.id}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        <div className="flex justify-between text-xs md:text-sm"><span className="text-slate-400 font-bold">Dukuh:</span> <span className="font-black text-slate-700">{getDukuhName(warga.dukuhId)}</span></div>
                                        <div className="flex justify-between text-xs md:text-sm"><span className="text-slate-400 font-bold">RT:</span> <span className="font-black text-slate-700">{getRTNumber(warga.rtId)}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all ${hasPaidToday ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${hasPaidToday ? 'text-emerald-600' : 'text-amber-600'}`}>Status Hari Ini</p>
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center text-3xl md:text-4xl shadow-sm ${hasPaidToday ? 'bg-white text-emerald-500' : 'bg-white text-amber-500'}`}>
                                            {hasPaidToday ? <CheckCircleIcon /> : <ClockIcon />}
                                        </div>
                                        <div>
                                            <h4 className={`text-2xl md:text-3xl font-black leading-tight ${hasPaidToday ? 'text-emerald-700' : 'text-amber-700'}`}>{hasPaidToday ? 'SUDAH LUNAS' : 'BELUM BAYAR'}</h4>
                                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest italic">{new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all ${warga.totalDebt > 0 ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${warga.totalDebt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Total Tunggakan</p>
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center text-3xl md:text-4xl shadow-sm ${warga.totalDebt > 0 ? 'bg-white text-rose-500' : 'bg-white text-slate-300'}`}>
                                            <BanknotesIcon />
                                        </div>
                                        <div>
                                            <h4 className={`text-2xl md:text-3xl font-black ${warga.totalDebt > 0 ? 'text-rose-700' : 'text-slate-400'}`}>Rp{warga.totalDebt.toLocaleString('id-ID')}</h4>
                                            <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${warga.totalDebt > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {warga.totalDebt > 0 ? '⚠️ SEGERA LUNASI' : '✅ BERSIH DARI HUTANG'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                          <div className="p-6 md:p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner"><ClipboardListIcon className="text-xl md:text-2xl" /></div>
                              <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase">Riwayat Pembayaran</h3>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100 font-black text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest">
                                  <tr><th className="py-4 md:py-5 px-6 md:px-8">Tanggal</th><th className="py-4 md:py-5 px-6 md:px-8 hidden md:table-cell">Kategori</th><th className="py-4 md:py-5 px-6 md:px-8 text-right">Nominal</th><th className="py-4 md:py-5 px-6 md:px-8 text-center">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="py-5 md:py-6 px-6 md:px-8">
                                          <p className="font-black text-slate-700 text-sm md:text-base">{tx.timestamp.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{tx.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                                          <span className="md:hidden mt-2 inline-block text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border bg-slate-50 text-slate-500">
                                              {tx.category === 'TUNGGAKAN' ? 'Tunggakan' : 'Iuran'}
                                          </span>
                                      </td>
                                      <td className="py-6 px-8 hidden md:table-cell">
                                          <span className={`text-[10px] font-black uppercase tracking-tighter px-3.5 py-1.5 rounded-xl border-2 ${tx.category === 'TUNGGAKAN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                              {tx.category === 'TUNGGAKAN' ? 'Pelunasan Tunggakan' : 'Iuran Harian'}
                                          </span>
                                      </td>
                                      <td className="py-5 md:py-6 px-6 md:px-8 text-right font-black text-slate-800 text-base md:text-lg font-mono">Rp{tx.amount.toLocaleString('id-ID')}</td>
                                      <td className="py-5 md:py-6 px-6 md:px-8 text-center">
                                        <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white py-1 md:py-1.5 px-3 md:px-4 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/20">
                                          <CheckCircleIcon className="text-[10px]" /> <span className="hidden sm:inline">Lunas</span>
                                        </div>
                                      </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="text-center py-20 md:py-24"><div className="flex flex-col items-center"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mb-4 shadow-inner"><i className="fa-solid fa-folder-open"></i></div><p className="text-slate-400 font-black uppercase tracking-widest text-[10px] italic">Belum ada riwayat tersedia.</p></div></td></tr>
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

        <footer className="bg-slate-800 text-slate-400 py-10 md:py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-700/50 pb-8 md:pb-12 mb-8 md:mb-12">
                    <div className="bg-white/10 text-white font-bold text-xl px-6 py-3 rounded-lg -skew-x-12">SapaDesa</div>
                    <nav className="flex flex-wrap justify-center gap-6 md:gap-8 text-[10px] md:text-xs font-black uppercase tracking-widest">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <Link to="/laporan-publik" className="hover:text-emerald-400 transition-colors">Laporan Desa</Link>
                        <Link to="/tips" className="hover:text-white transition-colors">Tips</Link>
                        <Link to="/contact" className="hover:text-white transition-colors">Kontak</Link>
                    </nav>
                </div>
                <div className="text-center">
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">&copy; {new Date().getFullYear()} Karang Taruna Mahardika Rowosari • Inovasi Untuk Desa Bersih</p>
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
