
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDetailedPublicTransparency } from '@/services/api';
import { 
    ScaleBalancedIcon, 
    ArrowLeftIcon, 
    BanknotesIcon, 
    CurrencyDollarIcon, 
    CheckCircleIcon
} from '@/components/icons';
import PublicHeader from '@/components/PublicHeader';

const PublicReportPage: React.FC = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const report = await getDetailedPublicTransparency(year);
                setData(report);
            } catch (e) {
                console.error("Error fetching public report", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [year]);

    return (
        <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
            <div className="absolute top-0 left-0 w-full h-4 bg-emerald-500"></div>
            <PublicHeader />

            <main className="flex-grow pb-20">
                {/* Hero Section */}
                <section className="bg-slate-50 py-16 border-b border-slate-200">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="text-center md:text-left">
                                <Link to="/" className="inline-flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest mb-4 hover:translate-x-[-4px] transition-transform">
                                    <ArrowLeftIcon /> Kembali ke Beranda
                                </Link>
                                <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">Transparansi <br/> Keuangan Desa</h1>
                                <p className="text-slate-500 font-medium mt-4 text-lg max-w-xl">Laporan terbuka pengelolaan dana iuran sampah warga Desa Rowosari sebagai bentuk pertanggungjawaban publik.</p>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-xl flex flex-col items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tahun Anggaran</label>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setYear(year - 1)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><i className="fa-solid fa-chevron-left"></i></button>
                                    <span className="text-4xl font-black text-slate-800">{year}</span>
                                    <button onClick={() => setYear(year + 1)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><i className="fa-solid fa-chevron-right"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                    {loading ? (
                        <div className="py-24 text-center">
                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Menyusun Data Transparansi...</p>
                        </div>
                    ) : data && (
                        <div className="space-y-16 animate-fade-in">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-emerald-500 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-500/20 text-white flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl"><CurrencyDollarIcon /></div>
                                    <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Pemasukan</p><p className="text-3xl font-black">Rp{data.totalRevenue.toLocaleString('id-ID')}</p></div>
                                </div>
                                <div className="bg-rose-500 p-8 rounded-[2.5rem] shadow-xl shadow-rose-500/20 text-white flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl"><BanknotesIcon /></div>
                                    <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Pengeluaran</p><p className="text-3xl font-black">Rp{data.totalExpense.toLocaleString('id-ID')}</p></div>
                                </div>
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/20 text-white flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl"><ScaleBalancedIcon /></div>
                                    <div><p className="text-[10px] font-black uppercase tracking-widest opacity-80">Saldo Akhir Kas</p><p className="text-3xl font-black text-emerald-400">Rp{data.balance.toLocaleString('id-ID')}</p></div>
                                </div>
                            </div>

                            {/* DUKUH SUMMARY */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner"><i className="fa-solid fa-map-location-dot"></i></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Kontribusi Per Dukuh</h3>
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Total akumulasi iuran masuk tahun {year}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {data.dukuhStats.map((stat: any) => (
                                        <div key={stat.name} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 group-hover:text-emerald-500 transition-colors">Dukuh {stat.name}</p>
                                            <p className="text-2xl font-black text-slate-800">Rp{stat.total.toLocaleString('id-ID')}</p>
                                            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-emerald-500 rounded-full" 
                                                    style={{ width: `${(stat.total / data.totalRevenue) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="mt-2 text-[10px] font-bold text-slate-400 text-right">{((stat.total / data.totalRevenue) * 100 || 0).toFixed(1)}% dari total desa</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* MONTHLY REPORT */}
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner"><i className="fa-solid fa-calendar-check"></i></div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Rincian Bulanan</h3>
                                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Alur kas masuk dan keluar sepanjang tahun {year}</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <th className="py-6 px-8">Bulan</th>
                                                    <th className="py-6 px-8 text-right">Pemasukan</th>
                                                    <th className="py-6 px-8 text-right">Pengeluaran</th>
                                                    <th className="py-6 px-8 text-right">Saldo Bulanan</th>
                                                    <th className="py-6 px-8 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {data.monthlyStats.map((month: any) => (
                                                    <tr key={month.monthName} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="py-6 px-8 font-black text-slate-700 text-lg">{month.monthName}</td>
                                                        <td className="py-6 px-8 text-right font-black text-emerald-600 font-mono">Rp{month.income.toLocaleString('id-ID')}</td>
                                                        <td className="py-6 px-8 text-right font-black text-rose-500 font-mono">Rp{month.expense.toLocaleString('id-ID')}</td>
                                                        <td className="py-6 px-8 text-right">
                                                            <span className={`font-black font-mono text-base ${month.balance >= 0 ? 'text-slate-800' : 'text-rose-700'}`}>
                                                                Rp{month.balance.toLocaleString('id-ID')}
                                                            </span>
                                                        </td>
                                                        <td className="py-6 px-8 text-center">
                                                            <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-emerald-500 group-hover:text-white transition-all cursor-default">
                                                                Tutup Buku
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                                        <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Akumulasi Kas Bersih Akhir Tahun {year}</p><p className="text-3xl font-black">Rp{data.balance.toLocaleString('id-ID')}</p></div>
                                        <div className="text-right hidden sm:block"><p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Sistem Diaudit Otomatis</p><CheckCircleIcon className="text-emerald-400 text-3xl" /></div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
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
    );
};

export default PublicReportPage;
