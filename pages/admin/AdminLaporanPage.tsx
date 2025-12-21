
import React, { useState, useEffect, useMemo, FC } from 'react';
import { getReports, getAllDukuh, getAllRT, getPengeluaran, getUnpaidWargaForDate, getScheduleForDate, getDukuhById, getRTById, getParticipationReport, getAllWarga } from '@/services/api';
import { exportToExcel } from '@/services/excel';
import type { Transaksi, Dukuh, RT, Pengeluaran, Warga, ParticipationStats } from '@/types';
import { UserSlashIcon, FileExcelIcon, EyeIcon, BanknotesIcon } from '@/components/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from '@/components/Modal';

interface ReportRow extends Transaksi {
    wargaName: string;
    petugasName: string;
    dukuhName: string;
    rtNumber: string;
}

const printReport = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; color: #333; -webkit-print-color-adjust: exact; }
                        @page { size: F4; margin: 1.5cm; }
                        
                        .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 20px; }
                        .print-header h1 { font-size: 24px; color: #0d9488; margin: 0; }
                        .print-header p { margin: 0; font-size: 10pt; color: #666; }
                        
                        h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 1rem; color: #333; }
                        h3 { font-size: 16px; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #333; }
                        
                        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10pt; }
                        thead { background-color: #f1f5f9; color: #333; }
                        tr { page-break-inside: avoid; }
                        
                        .currency { text-align: right; font-family: 'Courier New', Courier, monospace; }
                        .total-row { background-color: #f8fafc; font-weight: bold; }

                        .print-footer { text-align: center; margin-top: 2rem; font-size: 8pt; color: #9ca3af; }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        window.addEventListener('load', () => {
                            window.print();
                            window.close();
                        });
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
};

const LaporanHarian: FC = () => {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            const selectedDate = new Date(date);
            try {
                const [reportData, pengeluaranData] = await Promise.all([
                    getReports({ startDate: selectedDate, endDate: selectedDate }),
                    getPengeluaran({ startDate: selectedDate, endDate: selectedDate })
                ]);
                setReports(reportData || []);
                setPengeluaranList(pengeluaranData || []);
            } catch (error) {
                console.error("Failed to fetch daily reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [date]);

    const totalPemasukan = useMemo(() => reports.reduce((sum, item) => sum + item.amount, 0), [reports]);
    const totalPengeluaran = useMemo(() => pengeluaranList.reduce((sum, item) => sum + item.amount, 0), [pengeluaranList]);
    const saldo = totalPemasukan - totalPengeluaran;

    const handleExportExcel = () => {
        const data = reports.map(r => ({
            Tanggal: new Date(r.timestamp).toLocaleDateString(),
            Waktu: new Date(r.timestamp).toLocaleTimeString(),
            Warga: r.wargaName,
            Dukuh: r.dukuhName,
            RT: r.rtNumber,
            Petugas: r.petugasName,
            Jumlah: r.amount
        }));
        exportToExcel(data, `Laporan_Harian_${date}`);
    };

    const handlePrint = () => {
        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'full' });
        const title = `Laporan Harian - ${formattedDate}`;
        
        let pemasukanRows = reports.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleTimeString('id-ID')}</td>
                <td>${item.wargaName} (RT ${item.rtNumber}, ${item.dukuhName})</td>
                <td>${item.petugasName}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="print-header"><h1>SapaDesa</h1><p>Laporan Keuangan</p></div>
            <h2>${title}</h2>
            <table>
                <thead><tr><th>Waktu</th><th>Warga</th><th>Petugas</th><th class="currency">Jumlah</th></tr></thead>
                <tbody>${reports.length > 0 ? pemasukanRows : '<tr><td colspan="4" style="text-align: center;">Tidak ada pemasukan.</td></tr>'}</tbody>
                <tfoot class="total-row"><tr><td colspan="3">TOTAL PEMASUKAN</td><td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPemasukan)}</td></tr></tfoot>
            </table>
        `;
        printReport(title, content);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                <div className="flex-grow">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tanggal</label>
                     <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full" />
                </div>
                <div className="flex items-end gap-2">
                    <button onClick={handleExportExcel} className="bg-white text-emerald-600 border border-emerald-200 font-bold px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2 text-sm"><FileExcelIcon /> Excel</button>
                    <button onClick={handlePrint} className="bg-primary text-primary-content font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-primary-focus transition-colors text-sm">Cetak</button>
                </div>
            </div>
            <ReportSummary totalPemasukan={totalPemasukan} totalPengeluaran={totalPengeluaran} saldo={saldo} count={reports.length} />
            <ReportTable reports={reports} loading={loading} />
        </div>
    );
};

// --- FIX: Implement LaporanBulanan component ---
const LaporanBulanan: FC = () => {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(false);
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            try {
                const reportData = await getReports({ startDate, endDate });
                setReports(reportData || []);
            } catch (error) {
                console.error("Failed to fetch monthly reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [month, year]);

    const totalPemasukan = useMemo(() => reports.reduce((sum, item) => sum + item.amount, 0), [reports]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                <div className="flex-grow flex gap-4">
                    <div className="flex-grow">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                         <select value={month} onChange={e => setMonth(Number(e.target.value))} className="p-2 border border-slate-300 rounded-lg w-full">
                             {Array.from({ length: 12 }, (_, i) => (
                                 <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}</option>
                             ))}
                         </select>
                    </div>
                    <div className="flex-grow">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                         <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="p-2 border border-slate-300 rounded-lg w-full" />
                    </div>
                </div>
            </div>
            <ReportSummary totalPemasukan={totalPemasukan} totalPengeluaran={0} saldo={totalPemasukan} count={reports.length} />
            <ReportTable reports={reports} loading={loading} />
        </div>
    );
};

// --- FIX: Implement LaporanWilayah component ---
const LaporanWilayah: FC = () => {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ 
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dukuhId: 'all',
        rtId: 'all'
    });

    useEffect(() => {
        const loadMetadata = async () => {
            const [d, r] = await Promise.all([getAllDukuh(), getAllRT()]);
            setDukuhList(d);
            setRtList(r);
        };
        loadMetadata();
    }, []);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const reportData = await getReports({ 
                    startDate: new Date(filters.startDate), 
                    endDate: new Date(filters.endDate),
                    dukuhId: filters.dukuhId === 'all' ? undefined : Number(filters.dukuhId),
                    rtId: filters.rtId === 'all' ? undefined : Number(filters.rtId)
                });
                setReports(reportData || []);
            } catch (error) {
                console.error("Failed to fetch region reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [filters]);

    const totalPemasukan = useMemo(() => reports.reduce((sum, item) => sum + item.amount, 0), [reports]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Dari</label>
                     <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="p-2 border border-slate-300 rounded-lg w-full" />
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Sampai</label>
                     <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="p-2 border border-slate-300 rounded-lg w-full" />
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Dukuh</label>
                     <select value={filters.dukuhId} onChange={e => setFilters({...filters, dukuhId: e.target.value})} className="p-2 border border-slate-300 rounded-lg w-full">
                         <option value="all">Semua</option>
                         {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">RT</label>
                     <select value={filters.rtId} onChange={e => setFilters({...filters, rtId: e.target.value})} className="p-2 border border-slate-300 rounded-lg w-full">
                         <option value="all">Semua</option>
                         {rtList.map(r => <option key={r.id} value={r.id}>RT {r.number}</option>)}
                     </select>
                </div>
            </div>
            <ReportSummary totalPemasukan={totalPemasukan} totalPengeluaran={0} saldo={totalPemasukan} count={reports.length} />
            <ReportTable reports={reports} loading={loading} />
        </div>
    );
};

// --- FIX: Implement LaporanPartisipasi component ---
const LaporanPartisipasi: FC = () => {
    const [stats, setStats] = useState<ParticipationStats[]>([]);
    const [loading, setLoading] = useState(false);
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await getParticipationReport(month, year);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch participation report", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [month, year]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                <div className="flex-grow flex gap-4">
                    <div className="flex-grow">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                         <select value={month} onChange={e => setMonth(Number(e.target.value))} className="p-2 border border-slate-300 rounded-lg w-full">
                             {Array.from({ length: 12 }, (_, i) => (
                                 <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleDateString('id-ID', { month: 'long' })}</option>
                             ))}
                         </select>
                    </div>
                    <div className="flex-grow">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                         <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="p-2 border border-slate-300 rounded-lg w-full" />
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest">RT</th>
                            <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest">Total Warga</th>
                            <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest">Aktif (Bayar)</th>
                            <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest text-right">Tingkat Partisipasi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                             <tr><td colSpan={4} className="p-6 text-center animate-pulse">Memuat data...</td></tr>
                        ) : stats.map(s => (
                            <tr key={s.rtId} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-700">RT {s.rtNumber}</td>
                                <td className="p-4 text-slate-600">{s.totalWarga}</td>
                                <td className="p-4 text-slate-600">{s.activeWarga}</td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${s.participationRate > 80 ? 'bg-emerald-500' : s.participationRate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                                style={{ width: `${s.participationRate}%` }}
                                            />
                                        </div>
                                        <span className="font-bold font-mono text-slate-700">{s.participationRate.toFixed(1)}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- KOMPONEN LAPORAN TUNGGAKAN AKUMULASI (UPDATE TERBARU) ---
const LaporanTunggakanTotal: FC = () => {
    const [wargaDebtList, setWargaDebtList] = useState<Warga[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDebts = async () => {
            setLoading(true);
            const all = await getAllWarga();
            setWargaDebtList(all.filter(w => w.totalDebt > 0).sort((a,b) => b.totalDebt - a.totalDebt));
            setLoading(false);
        };
        fetchDebts();
    }, []);

    const totalAccumulatedDebt = useMemo(() => wargaDebtList.reduce((sum, w) => sum + w.totalDebt, 0), [wargaDebtList]);

    const handlePrint = () => {
        const title = `Laporan Akumulasi Tunggakan Warga`;
        let rows = wargaDebtList.map(w => `
            <tr>
                <td>${w.id}</td>
                <td>${w.name}</td>
                <td>RT ${getRTById(w.rtId)?.number || '-'}, ${getDukuhById(w.dukuhId)?.name || '-'}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(w.totalDebt)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="print-header"><h1>SapaDesa</h1><p>Laporan Penagihan</p></div>
            <h2>Daftar Akumulasi Tunggakan Iuran Sampah</h2>
            <p>Per tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
            <table>
                <thead><tr><th>ID</th><th>Nama Warga</th><th>Wilayah</th><th class="currency">Total Tunggakan</th></tr></thead>
                <tbody>${wargaDebtList.length > 0 ? rows : '<tr><td colspan="4" style="text-align: center;">Tidak ada tunggakan terdata.</td></tr>'}</tbody>
                <tfoot class="total-row"><tr><td colspan="3">TOTAL PIUTANG WARGA</td><td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAccumulatedDebt)}</td></tr></tfoot>
            </table>
        `;
        printReport(title, content);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                <div>
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Piutang / Tunggakan Akumulasi</h3>
                    <p className="text-3xl font-black text-rose-600 font-display">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAccumulatedDebt)}
                    </p>
                </div>
                <button onClick={handlePrint} className="bg-rose-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">
                    Cetak Daftar Tagihan
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="p-4 uppercase text-[11px] font-black text-slate-400 tracking-widest">ID</th>
                            <th className="p-4 uppercase text-[11px] font-black text-slate-400 tracking-widest">Nama Warga</th>
                            <th className="p-4 uppercase text-[11px] font-black text-slate-400 tracking-widest">Wilayah</th>
                            <th className="p-4 uppercase text-[11px] font-black text-slate-400 tracking-widest text-right">Nominal Tunggakan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memproses data...</td></tr>
                        ) : wargaDebtList.length > 0 ? (
                            wargaDebtList.map(w => (
                                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-mono text-slate-400 text-xs">{w.id}</td>
                                    <td className="p-4 font-bold text-slate-700">{w.name}</td>
                                    <td className="p-4 text-slate-500">RT {getRTById(w.rtId)?.number}, {getDukuhById(w.dukuhId)?.name}</td>
                                    <td className="p-4 text-right font-mono font-bold text-rose-600">
                                        Rp{w.totalDebt.toLocaleString('id-ID')}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Tidak ada warga yang memiliki tunggakan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminLaporanPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'harian' | 'bulanan' | 'wilayah' | 'partisipasi' | 'tunggakan'>('harian');
    
    const renderContent = () => {
        switch(activeTab) {
            case 'harian': return <LaporanHarian />;
            case 'bulanan': return <LaporanBulanan />;
            case 'wilayah': return <LaporanWilayah />;
            case 'partisipasi': return <LaporanPartisipasi />;
            case 'tunggakan': return <LaporanTunggakanTotal />;
            default: return null;
        }
    };
    
    const TabButton: FC<{tabName: typeof activeTab, children: React.ReactNode}> = ({tabName, children}) => (
         <button
            onClick={() => setActiveTab(tabName)}
            className={`${activeTab === tabName ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'} whitespace-nowrap py-4 px-6 border-b-2 font-bold text-sm transition-all focus:outline-none flex-grow md:flex-grow-0`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Laporan & Rekapitulasi</h1>
                <p className="mt-1 text-slate-500 text-sm font-medium">Analisis pemasukan, pengeluaran, dan status tagihan warga.</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/30">
                    <nav className="-mb-px flex px-2 overflow-x-auto custom-scrollbar" aria-label="Tabs">
                        <TabButton tabName="harian">Harian</TabButton>
                        <TabButton tabName="bulanan">Bulanan</TabButton>
                        <TabButton tabName="wilayah">Wilayah</TabButton>
                        <TabButton tabName="partisipasi">Partisipasi RT</TabButton>
                        <TabButton tabName="tunggakan">Laporan Tunggakan</TabButton>
                    </nav>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

const ReportSummary: FC<{totalPemasukan: number, totalPengeluaran: number, saldo: number, count: number}> = ({ totalPemasukan, totalPengeluaran, saldo, count }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pemasukan</h3>
            <p className="text-xl font-black text-emerald-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPemasukan)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pengeluaran</h3>
            <p className="text-xl font-black text-rose-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPengeluaran)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saldo Bersih</h3>
            <p className="text-xl font-black text-slate-800 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(saldo)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Jml Transaksi</h3>
            <p className="text-xl font-black text-indigo-600 mt-1">{count}</p>
        </div>
    </div>
);

const ReportTable: FC<{reports: ReportRow[], loading: boolean}> = ({ reports, loading }) => (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest">Waktu</th>
                        <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest">Warga</th>
                        <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest">Petugas</th>
                        <th className="p-4 uppercase text-[10px] font-black text-slate-400 tracking-widest text-right">Jumlah</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={4} className="text-center p-6 text-slate-400 animate-pulse">Memuat laporan...</td></tr>
                    ) : reports.length > 0 ? (
                        reports.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-500 font-medium">{new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-700">{item.wargaName}</p>
                                    <p className="text-[10px] text-slate-400">RT {item.rtNumber}, {item.dukuhName}</p>
                                </td>
                                <td className="p-4 text-slate-600 font-medium">{item.petugasName}</td>
                                <td className="p-4 text-right font-mono text-slate-700 font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.amount)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

export default AdminLaporanPage;
