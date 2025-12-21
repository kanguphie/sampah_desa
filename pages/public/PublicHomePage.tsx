
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    getWargaById, 
    getTransactionsByWargaId, 
    getDukuhById, 
    getRTById, 
    loginPetugas, 
    loginAdmin, 
    getActiveAnnouncements, 
    getPublicDashboardStats, 
    checkIfWargaPaidToday 
} from '@/services/api';
import type { Warga, Transaksi, Announcement, PublicStats } from '@/types';
import { 
    SearchIcon, 
    EyeIcon, 
    EyeOffIcon, 
    MenuIcon, 
    XIcon, 
    LeafIcon, 
    RecycleIcon, 
    SparklesIcon, 
    BanknotesIcon, 
    CheckCircleIcon, 
    ClockIcon,
    ScaleBalancedIcon,
    ClipboardListIcon
} from '@/components/icons';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

const RecyclingIllustration: React.FC = () => (
    <div className="relative w-full h-full flex items-center justify-center">
        <img
          src="https://blud.co.id/wp/wp-content/uploads/2025/09/27aec6f5e1d902e689c8c93fe337eb0c.jpg"
          alt="Ilustrasi daur ulang"
          className="w-full h-auto max-w-lg rounded-3xl shadow-2xl object-cover border-8 border-white"
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

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [credential, setCredential] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const resultRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { loginAdmin: authLoginAdmin, loginPetugas: authLoginPetugas } = useAuth();

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

  const openLoginModal = () => { setIsLoginModalOpen(true); setLoginError(''); setCredential(''); };
  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);
  const getDukuhName = (id: number) => getDukuhById(id)?.name || 'N/A';
  const getRTNumber = (id: number) => getRTById(id)?.number || 'N/A';

  return (
    <>
      <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
        <div className="absolute top-0 left-0 w-full h-4 bg-teal-400"></div>
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <div className="bg-slate-800 text-white font-bold text-lg px-4 py-2 rounded-md shadow-sm -skew-x-12 hover:scale-105 transition-transform">SapaDesa</div>
                </Link>
                <nav className="hidden md:flex items-center space-x-8">
                    <Link to="/" className="text-primary transition-colors font-black text-sm">Cek Iuran</Link>
                    <Link to="/laporan-publik" className="text-slate-600 hover:text-primary transition-colors font-bold text-sm flex items-center gap-2">
                        <ScaleBalancedIcon className="text-emerald-500" /> Laporan Publik
                    </Link>
                    <Link to="/tips" className="text-slate-600 hover:text-primary transition-colors font-bold text-sm">Tips Sampah</Link>
                    <Link to="/contact" className="text-slate-600 hover:text-primary transition-colors font-bold text-sm">Kontak Kami</Link>
                </nav>
                <div className="flex items-center gap-4">
                    <button onClick={openLoginModal} className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-slate-200 transition-colors shadow-sm border border-slate-200">Login Sistem</button>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-primary" aria-label="Open menu"><MenuIcon className="text-2xl" /></button>
                </div>
            </div>
        </header>
        
        {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in md:hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="bg-slate-800 text-white font-bold text-lg px-4 py-2 rounded-md shadow-sm -skew-x-12">SapaDesa</div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600" aria-label="Close menu"><XIcon className="text-2xl" /></button>
                </div>
                <nav className="flex flex-col items-center justify-center flex-grow space-y-10">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-primary">Cek Status Iuran</Link>
                    <Link to="/laporan-publik" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-slate-800">Laporan Publik</Link>
                    <Link to="/tips" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-slate-800">Tips Sampah</Link>
                    <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-slate-800">Hubungi Kami</Link>
                </nav>
            </div>
        )}

        <main className="flex-grow">
            <section ref={searchSectionRef} id="hero" className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="animate-fade-in">
                        <p className="font-semibold text-teal-500 text-lg uppercase tracking-widest">#Rowosari_Transparan</p>
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 mt-2 leading-tight">
                            Digitalisasi <span className="text-primary underline decoration-teal-100 decoration-8 underline-offset-8">Retribusi</span> Sampah Desa
                        </h1>
                        <p className="mt-6 text-slate-600 max-w-lg text-lg font-medium leading-relaxed">
                            Pastikan iuran kebersihan Anda tercatat dengan benar. Cek status pembayaran mandiri melalui ID Warga di bawah ini.
                        </p>

                        <div className="mt-10">
                            <form onSubmit={handleSearch} className="animate-fade-in">
                              <div className="flex flex-col sm:flex-row rounded-[2rem] overflow-hidden shadow-2xl shadow-primary/10 border-4 border-slate-100 bg-white p-2">
                                <input
                                  type="text"
                                  value={wargaId}
                                  onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))}
                                  placeholder="Masukkan 6 Digit ID Warga"
                                  maxLength={6}
                                  className="flex-grow px-6 py-5 bg-transparent focus:outline-none font-bold text-2xl placeholder:text-slate-300 placeholder:font-bold"
                                />
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="bg-emerald-500 text-white font-black py-5 px-10 rounded-3xl hover:bg-emerald-600 transition-all duration-300 disabled:bg-slate-400 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 text-sm uppercase tracking-widest"
                                >
                                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SearchIcon className="text-xl"/>}
                                  Cek Status
                                </button>
                              </div>
                              {error && <div className="mt-5 p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-3 border border-rose-100 animate-shake font-bold text-sm italic"><XIcon />{error}</div>}
                            </form>
                            <p className="mt-6 text-xs text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-2">
                                <CheckCircleIcon className="text-emerald-500" /> Gunakan 6 digit ID yang tertera pada kartu warga Anda
                            </p>
                        </div>
                        
                        <div className="mt-12 flex flex-wrap gap-4">
                            <Link to="/laporan-publik" className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 flex items-center gap-3">
                                <ScaleBalancedIcon /> Lihat Laporan Keuangan Desa
                            </Link>
                        </div>
                    </div>
                    <div className="hidden lg:block animate-fade-in delay-200"><RecyclingIllustration /></div>
                </div>
            </section>

            {/* Statistik Cepat */}
            {!warga && stats && (
                <section className="py-12 bg-slate-50 border-y border-slate-100">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><LeafIcon className="text-2xl"/></div>
                                <h3 className="text-3xl font-black text-slate-800">{stats.totalWarga}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Warga Terdaftar</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><RecycleIcon className="text-2xl"/></div>
                                <h3 className="text-3xl font-black text-slate-800">{stats.totalTransaksiBulanIni}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaksi Bulan Ini</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center text-center">
                                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><SparklesIcon className="text-2xl"/></div>
                                <h3 className="text-3xl font-black text-slate-800">Rp{stats.totalDanaTerkumpulBulanIni.toLocaleString('id-ID')}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dana Terkumpul (Bln Ini)</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            
            {/* AREA HASIL PENCARIAN WARGA */}
            {warga && (
              <section ref={resultRef} id="hasil-pencarian" className="py-24 bg-slate-50 border-t border-slate-200 scroll-mt-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-5xl mx-auto animate-slide-in-up">
                        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Halo, {warga.name} 👋</h2>
                                <p className="text-slate-500 font-medium text-lg mt-1">Berikut adalah rangkuman data retribusi sampah Anda.</p>
                            </div>
                            <button onClick={() => setWarga(null)} className="text-sm font-black text-primary hover:bg-primary/10 px-6 py-3 rounded-2xl border-2 border-primary/20 transition-all flex items-center gap-2 uppercase tracking-widest">
                                <SearchIcon className="text-sm" /> Cari ID Lain
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Identitas Warga</p>
                                    <div className="flex items-center gap-5 mb-6">
                                        <div className="w-16 h-16 bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-500 font-black text-2xl">{warga.name.charAt(0)}</div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-xl leading-none">{warga.name}</h4>
                                            <p className="text-xs text-slate-400 mt-2 font-mono font-bold">ID: {warga.id}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3 pt-4 border-t border-slate-50">
                                        <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">Dukuh:</span> <span className="font-black text-slate-700">{getDukuhName(warga.dukuhId)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-400 font-bold">RT:</span> <span className="font-black text-slate-700">{getRTNumber(warga.rtId)}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all ${hasPaidToday ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-5 ${hasPaidToday ? 'text-emerald-600' : 'text-amber-600'}`}>Status Pembayaran Hari Ini</p>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm ${hasPaidToday ? 'bg-white text-emerald-500' : 'bg-white text-amber-500'}`}>
                                            {hasPaidToday ? <CheckCircleIcon /> : <ClockIcon />}
                                        </div>
                                        <div>
                                            <h4 className={`text-3xl font-black ${hasPaidToday ? 'text-emerald-700' : 'text-amber-700'}`}>{hasPaidToday ? 'SUDAH LUNAS' : 'BELUM BAYAR'}</h4>
                                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest italic">{new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long'})}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between transform hover:-translate-y-1 transition-all ${warga.totalDebt > 0 ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-slate-50 border-slate-200'}`}>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-5 ${warga.totalDebt > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Total Tunggakan (Belum Bayar)</p>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm ${warga.totalDebt > 0 ? 'bg-white text-rose-500' : 'bg-white text-slate-300'}`}>
                                            <BanknotesIcon />
                                        </div>
                                        <div>
                                            <h4 className={`text-3xl font-black ${warga.totalDebt > 0 ? 'text-rose-700' : 'text-slate-400'}`}>Rp{warga.totalDebt.toLocaleString('id-ID')}</h4>
                                            <p className={`text-[10px] font-black mt-2 uppercase tracking-widest ${warga.totalDebt > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                {warga.totalDebt > 0 ? '⚠️ SEGERA LUNASI' : '✅ BERSIH DARI HUTANG'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                          <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><ClipboardListIcon className="text-2xl" /></div>
                              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Riwayat 10 Pembayaran Terakhir</h3>
                          </div>
                          <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
                                  <tr><th className="py-5 px-8">Tanggal & Waktu</th><th className="py-5 px-8">Kategori Pembayaran</th><th className="py-5 px-8 text-right">Nominal (Tunai)</th><th className="py-5 px-8 text-center">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {transactions.length > 0 ? transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                      <td className="py-6 px-8">
                                          <p className="font-black text-slate-700 text-base">{tx.timestamp.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                          <p className="text-[10px] font-black text-slate-400 mt-1.5 uppercase tracking-widest">{tx.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                                      </td>
                                      <td className="py-6 px-8">
                                          <span className={`text-[10px] font-black uppercase tracking-tighter px-3.5 py-1.5 rounded-xl border-2 ${tx.category === 'TUNGGAKAN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                              {tx.category === 'TUNGGAKAN' ? 'Pelunasan Tunggakan' : 'Iuran Rutin Harian'}
                                          </span>
                                      </td>
                                      <td className="py-6 px-8 text-right font-black text-slate-800 text-lg font-mono">Rp{tx.amount.toLocaleString('id-ID')}</td>
                                      <td className="py-6 px-8 text-center">
                                        <div className="inline-flex items-center gap-1.5 bg-emerald-500 text-white py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md shadow-emerald-500/20">
                                          <CheckCircleIcon className="text-xs" /> Lunas
                                        </div>
                                      </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="text-center py-24"><div className="flex flex-col items-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-5xl mb-6 shadow-inner"><i className="fa-solid fa-folder-open"></i></div><p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">Data riwayat belum tersedia untuk akun ini.</p></div></td></tr>
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

        <footer className="bg-slate-800 text-slate-400 py-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-700/50 pb-12 mb-12">
                    <div className="bg-white/10 text-white font-bold text-xl px-6 py-3 rounded-lg -skew-x-12">SapaDesa</div>
                    <nav className="flex flex-wrap justify-center gap-8 text-sm font-black uppercase tracking-widest">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <Link to="/laporan-publik" className="hover:text-emerald-400 transition-colors">Laporan Desa</Link>
                        <Link to="/tips" className="hover:text-white transition-colors">Tips</Link>
                        <Link to="/contact" className="hover:text-white transition-colors">Kontak</Link>
                    </nav>
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">&copy; {new Date().getFullYear()} Karang Taruna Mahardika Rowosari • Inovasi Untuk Desa Bersih</p>
                </div>
            </div>
        </footer>
      </div>

      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Login Sistem Desa">
          <form onSubmit={handleLoginSubmit} className="space-y-8 py-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-xl -skew-x-12 font-black text-3xl">SD</div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Panel Petugas & Admin</p>
              </div>
              <div>
                  <label className="block text-slate-700 font-black text-[10px] uppercase tracking-widest mb-3 ml-1" htmlFor="credential">PIN / Password Akses</label>
                  <div className="relative group">
                       <input id="credential" type={isPasswordVisible ? 'text' : 'password'} value={credential} onChange={(e) => setCredential(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary font-black text-xl transition-all" required autoFocus />
                      <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-primary transition-colors">{isPasswordVisible ? <EyeOffIcon className="text-xl" /> : <EyeIcon className="text-xl" />}</button>
                  </div>
              </div>
              {loginError && <p className="text-rose-500 text-xs font-black text-center bg-rose-50 p-4 rounded-2xl border-2 border-rose-100 animate-shake">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 px-4 rounded-3xl shadow-2xl shadow-slate-900/40 disabled:bg-slate-400 transition-all duration-300 uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                {loginLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircleIcon />}
                Masuk ke Sistem
              </button>
          </form>
      </Modal>
      <style>{`
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
      `}</style>
    </>
  );
};

export default PublicHomePage;
