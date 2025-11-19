import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getWargaById, getTransactionsByWargaId, getDukuhById, getRTById, loginPetugas, loginAdmin } from '@/services/api';
import type { Warga, Transaksi } from '@/types';
import { SearchIcon, EyeIcon, EyeOffIcon, MenuIcon, XIcon } from '@/components/icons';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

const RecyclingIllustration: React.FC = () => (
    <div className="relative w-full h-full flex items-center justify-center">
        <img
          src="https://blud.co.id/wp/wp-content/uploads/2025/09/27aec6f5e1d902e689c8c93fe337eb0c.jpg"
          alt="Ilustrasi daur ulang dengan tempat sampah warna-warni"
          className="w-full h-auto max-w-lg rounded-2xl shadow-2xl object-cover"
        />
    </div>
);

const PublicHomePage: React.FC = () => {
  const [wargaId, setWargaId] = useState('');
  const [warga, setWarga] = useState<Warga | null>(null);
  const [transactions, setTransactions] = useState<Transaksi[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [credential, setCredential] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const navigate = useNavigate();
  const { loginAdmin: authLoginAdmin, loginPetugas: authLoginPetugas } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wargaId.length !== 6) {
      setError('ID Warga harus 6 digit.');
      setWarga(null);
      return;
    }
    setLoading(true);
    setError(null);
    setWarga(null);
    setTransactions([]);
    try {
      const wargaData = await getWargaById(wargaId);
      if (wargaData) {
        setWarga(wargaData);
        const transactionData = await getTransactionsByWargaId(wargaId, 7);
        setTransactions(transactionData);
      } else {
        setError('ID Warga tidak ditemukan.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mencari data.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential) {
        setLoginError('PIN atau Password tidak boleh kosong.');
        return;
    }
    setLoginLoading(true);
    setLoginError('');

    try {
        const petugas = await loginPetugas(credential);
        if (petugas) {
            authLoginPetugas(petugas);
            navigate('/petugas/dashboard');
            return;
        }

        const admin = await loginAdmin('admin', credential);
        if (admin) {
            authLoginAdmin(admin);
            navigate('/admin/dashboard');
            return;
        }

        setLoginError('PIN atau Password salah.');
        setCredential('');

    } catch (err) {
        setLoginError('Terjadi kesalahan. Silakan coba lagi.');
        setCredential('');
    } finally {
        setLoginLoading(false);
    }
  };

  const openLoginModal = () => {
      setIsLoginModalOpen(true);
      setLoginError('');
      setCredential('');
  };

  const togglePasswordVisibility = () => setIsPasswordVisible(!isPasswordVisible);
  
  const getDukuhName = (id: number) => getDukuhById(id)?.name || 'N/A';
  const getRTNumber = (id: number) => getRTById(id)?.number || 'N/A';

  return (
    <>
      <div className="min-h-screen bg-white text-slate-800 flex flex-col">
        <div className="absolute top-0 left-0 w-full h-4 bg-teal-400"></div>
        <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <div className="bg-slate-800 text-white font-bold text-lg px-4 py-2 rounded-md shadow-sm -skew-x-12">
                        SapaDesa
                    </div>
                </Link>
                <nav className="hidden md:flex items-center space-x-8">
                    <Link to="/" className="text-slate-600 hover:text-primary transition-colors font-medium">Home</Link>
                    <a href="/#cek-status-form" className="text-slate-600 hover:text-primary transition-colors font-medium">Cek Status</a>
                    <Link to="/tips" className="text-slate-600 hover:text-primary transition-colors font-medium">Tips Sampah</Link>
                </nav>
                <div className="flex items-center gap-4">
                     <button 
                      onClick={openLoginModal}
                      className="bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors shadow-sm border border-slate-200"
                      aria-label="Login for admin or petugas"
                    >
                      Login Petugas/Admin
                    </button>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-600 hover:text-primary" aria-label="Open menu">
                        <MenuIcon className="text-2xl" />
                    </button>
                </div>
            </div>
        </header>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-white z-50 flex flex-col animate-fade-in md:hidden">
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="bg-slate-800 text-white font-bold text-lg px-4 py-2 rounded-md shadow-sm -skew-x-12">
                        SapaDesa
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-600" aria-label="Close menu">
                        <XIcon className="text-2xl" />
                    </button>
                </div>
                <nav className="flex flex-col items-center justify-center flex-grow space-y-8">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-semibold text-slate-700 hover:text-primary">Home</Link>
                    <a href="/#cek-status-form" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-semibold text-slate-700 hover:text-primary">Cek Status</a>
                    <Link to="/tips" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-semibold text-slate-700 hover:text-primary">Tips Sampah</Link>
                </nav>
            </div>
        )}


        <main className="flex-grow">
            <section id="cek-status-form" className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="animate-fade-in">
                        <p className="font-semibold text-teal-500 text-lg">#GOGREEN_NOW!</p>
                        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mt-2 leading-tight">
                            Recycling is a <span className="text-primary">Lifestyle</span>
                        </h1>
                        <p className="mt-4 text-slate-600 max-w-lg text-lg">
                            Cek status dan riwayat pembayaran retribusi sampah Anda dengan mudah. Masukkan ID Warga untuk memulai.
                        </p>

                        <form onSubmit={handleSearch} className="mt-8">
                          <div className="flex rounded-lg shadow-lg shadow-primary/20">
                            <input
                              type="text"
                              value={wargaId}
                              onChange={(e) => setWargaId(e.target.value.replace(/\D/g, ''))}
                              placeholder="Masukkan 6 Digit ID Anda"
                              maxLength={6}
                              className="flex-grow w-full px-5 py-3 border-2 border-slate-200 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            />
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-auto bg-green-500 text-white font-bold py-3 px-6 rounded-r-lg hover:bg-green-600 transition-all duration-300 disabled:bg-slate-400 flex items-center justify-center gap-2"
                            >
                              <SearchIcon className="text-xl"/>
                              {loading ? 'Mencari...' : 'Cek Status'}
                            </button>
                          </div>
                          {error && <p className="text-red-500 mt-2">{error}</p>}
                        </form>
                    </div>
                    <div className="hidden lg:block animate-fade-in">
                        <RecyclingIllustration />
                    </div>
                </div>
            </section>
            
            {warga && (
              <section id="hasil-pencarian" className="py-10 md:py-16 bg-slate-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto animate-slide-in-up">
                        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-md">
                          <h2 className="text-2xl font-bold font-display text-slate-800">{warga.name}</h2>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-600 mt-1">
                              <span>ID: <span className="font-mono">{warga.id}</span></span>
                              <span>Wilayah: <span className="font-semibold">RT {getRTNumber(warga.rtId)}, {getDukuhName(warga.dukuhId)}</span></span>
                          </div>
                        </div>

                        <h3 className="text-xl font-bold font-display mt-8 mb-4 text-slate-700">Riwayat Pembayaran (7 Hari Terakhir)</h3>
                        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                          <table className="min-w-full">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Tanggal</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Waktu</th>
                                <th className="text-left py-3 px-4 uppercase font-semibold text-sm text-slate-600">Status</th>
                              </tr>
                            </thead>
                            <tbody className="text-slate-700">
                              {transactions.length > 0 ? transactions.map(tx => (
                                <tr key={tx.id} className="border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors">
                                  <td className="py-3 px-4">{tx.timestamp.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                  <td className="py-3 px-4">{tx.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</td>
                                  <td className="py-3 px-4">
                                    <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-semibold">
                                      Lunas
                                    </span>
                                  </td>
                                </tr>
                              )) : (
                                  <tr>
                                      <td colSpan={3} className="text-center py-6 text-slate-500">Tidak ada data pembayaran dalam 7 hari terakhir.</td>
                                  </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                    </div>
                </div>
              </section>
            )}
        </main>

        <footer className="bg-slate-800 text-slate-400 py-8 mt-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p>&copy; {new Date().getFullYear()} Karang Taruna Mahardika Rowosari. All rights reserved.</p>
            </div>
        </footer>

      </div>
      <Modal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title="Login Petugas / Admin">
          <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                  <label className="block text-slate-700 font-semibold mb-2" htmlFor="credential">
                      PIN / Password
                  </label>
                  <div className="relative">
                       <input
                          id="credential"
                          type={isPasswordVisible ? 'text' : 'password'}
                          value={credential}
                          onChange={(e) => setCredential(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                          autoFocus
                      />
                      <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-primary"
                          aria-label="Toggle password visibility"
                      >
                          {isPasswordVisible ? <EyeOffIcon className="text-xl" /> : <EyeIcon className="text-xl" />}
                      </button>
                  </div>
              </div>
              {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
              <div>
                  <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-primary hover:bg-primary-focus text-primary-content font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline disabled:bg-slate-400 transition-colors duration-300"
                  >
                      {loginLoading ? 'Mencoba Masuk...' : 'Login'}
                  </button>
              </div>
          </form>
      </Modal>
    </>
  );
};

export default PublicHomePage;