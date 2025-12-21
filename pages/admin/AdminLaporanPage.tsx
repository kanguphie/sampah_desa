
import React, { useState, useEffect, useMemo, FC } from 'react';
import { getReports, getAllDukuh, getAllRT, getPengeluaran, getAllWarga, getDukuhById, getRTById } from '@/services/api';
import { exportToExcel } from '@/services/excel';
import type { Transaksi, Dukuh, RT, Pengeluaran, Warga, ParticipationStats } from '@/types';
import { FileExcelIcon, BanknotesIcon, SearchIcon, ClipboardListIcon, UserIcon } from '@/components/icons';

interface ReportRow extends Transaksi {
    wargaName: string;
    petugasName: string;
    dukuhName: string;
    rtNumber: string;
}

// Global Print Utility
const printReport = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Plus Jakarta Sans', sans-serif; color: #334152; -webkit-print-color-adjust: exact; padding: 20px; }
                        @page { size: A4; margin: 1cm; }
                        .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px; }
                        .header h1 { margin: 0; color: #10b981; font-size: 24px; }
                        .header p { margin: 5px 0 0; font-size: 12px; color: #64748b; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
                        th { background-color: #f8fafc; font-weight: bold; text-transform: uppercase; color: #64748b; font-size: 10px; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .bg-gray { background-color: #f8fafc; }
                        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; }
                        
                        /* Slip Styles */
                        .slip-container { max-width: 400px; margin: 0 auto; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; }
                        .slip-title { font-weight: 800; text-align: center; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                        .slip-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
                        .slip-total { margin-top: 15px; padding-top: 10px; border-top: 2px solid #334152; font-weight: 800; font-size: 18px; }
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

    const handlePrint = () => {
        const formattedDate = new Date(date).toLocaleDateString('id-ID', { dateStyle: 'full' });
        const rows = reports.map(tx => `
            <tr>
                <td>${new Date(tx.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td>
                <td>${tx.wargaName} (RT ${tx.rtNumber}, ${tx.dukuhName})</td>
                <td>${tx.petugasName}</td>
                <td class="text-right">Rp${tx.amount.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const content = `
            <div class="header"><h1>SapaDesa</h1><p>Laporan Pemasukan Harian - ${formattedDate}</p></div>
            <table>
                <thead><tr><th>Jam</th><th>Warga</th><th>Petugas</th><th class="text-right">Nominal</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="4" style="text-align:center">Tidak ada data</td></tr>'}</tbody>
                <tfoot><tr class="font-bold bg-gray"><td colspan="3">TOTAL PEMASUKAN</td><td class="text-right">Rp${totalPemasukan.toLocaleString('id-ID')}</td></tr></tfoot>
            </table>
        `;
        printReport(`Laporan Harian ${date}`, content);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[200px]">
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Pilih Tanggal</label>
                     <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex items-end gap-2">
                    <button onClick={handlePrint} className="bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-primary-focus transition-all flex items-center gap-2">
                         Cetak Laporan
                    </button>
                </div>
            </div>
            <ReportSummary totalPemasukan={totalPemasukan} totalPengeluaran={totalPengeluaran} saldo={saldo} count={reports.length} />
            <ReportTable reports={reports} loading={loading} />
        </div>
    );
};

// --- LAPORAN BULANAN BERBASIS TANGGAL ---
const LaporanBulanan: FC = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [dailySummaries, setDailySummaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            
            const [pemasukan, pengeluaran] = await Promise.all([
                getReports({ startDate, endDate }),
                getPengeluaran({ startDate, endDate })
            ]);

            const daysInMonth = endDate.getDate();
            const summaries = [];

            for (let d = 1; d <= daysInMonth; d++) {
                const currentDay = new Date(year, month - 1, d).toDateString();
                const dayIncome = pemasukan.filter(tx => new Date(tx.timestamp).toDateString() === currentDay)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                const dayExpense = pengeluaran.filter(ex => new Date(ex.date).toDateString() === currentDay)
                    .reduce((sum, ex) => sum + ex.amount, 0);
                
                if (dayIncome > 0 || dayExpense > 0) {
                    summaries.push({
                        date: new Date(year, month - 1, d),
                        income: dayIncome,
                        expense: dayExpense,
                        balance: dayIncome - dayExpense
                    });
                }
            }
            setDailySummaries(summaries);
            setLoading(false);
        };
        fetchData();
    }, [month, year]);

    const totals = useMemo(() => dailySummaries.reduce((acc, curr) => ({
        income: acc.income + curr.income,
        expense: acc.expense + curr.expense,
        balance: acc.balance + curr.balance
    }), { income: 0, expense: 0, balance: 0 }), [dailySummaries]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Bulan</label>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg">
                        {Array.from({length:12}, (_,i) => <option key={i+1} value={i+1}>{new Date(0,i).toLocaleDateString('id-ID', {month:'long'})}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tahun</label>
                    <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Pemasukan</p>
                    <p className="text-2xl font-black text-emerald-600">Rp{totals.income.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Pengeluaran</p>
                    <p className="text-2xl font-black text-rose-600">Rp{totals.expense.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Saldo Akhir</p>
                    <p className="text-2xl font-black text-slate-800">Rp{totals.balance.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400">
                            <th className="p-4">Tanggal</th>
                            <th className="p-4 text-right">Pemasukan</th>
                            <th className="p-4 text-right">Pengeluaran</th>
                            <th className="p-4 text-right">Saldo Harian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memuat rekapitulasi...</td></tr> : 
                        dailySummaries.map((s, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-4 font-bold text-slate-700">{s.date.toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</td>
                                <td className="p-4 text-right text-emerald-600 font-mono">Rp{s.income.toLocaleString('id-ID')}</td>
                                <td className="p-4 text-right text-rose-600 font-mono">Rp{s.expense.toLocaleString('id-ID')}</td>
                                <td className={`p-4 text-right font-mono font-bold ${s.balance >= 0 ? 'text-slate-700' : 'text-rose-700'}`}>
                                    Rp{s.balance.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- LAPORAN TUNGGAKAN DENGAN FILTER & CETAK SLIP ---
const LaporanTunggakanTotal: FC = () => {
    const [wargaDebtList, setWargaDebtList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [filterDukuh, setFilterDukuh] = useState<string>('all');
    const [filterRT, setFilterRT] = useState<string>('all');

    useEffect(() => {
        const fetchMetadata = async () => {
            const [d, r] = await Promise.all([getAllDukuh(), getAllRT()]);
            setDukuhList(d);
            setRtList(r);
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        const fetchDebts = async () => {
            setLoading(true);
            const all = await getAllWarga();
            setWargaDebtList(all.filter(w => w.totalDebt > 0).sort((a,b) => b.totalDebt - a.totalDebt));
            setLoading(false);
        };
        fetchDebts();
    }, []);

    const filteredList = useMemo(() => {
        return wargaDebtList.filter(w => {
            const matchDukuh = filterDukuh === 'all' || w.dukuhId === Number(filterDukuh);
            const matchRT = filterRT === 'all' || w.rtId === Number(filterRT);
            return matchDukuh && matchRT;
        });
    }, [wargaDebtList, filterDukuh, filterRT]);

    const totalDebtFiltered = useMemo(() => filteredList.reduce((sum, w) => sum + w.totalDebt, 0), [filteredList]);

    const handlePrintSlip = (warga: Warga) => {
        const dukuh = getDukuhById(warga.dukuhId)?.name;
        const rt = getRTById(warga.rtId)?.number;
        
        const content = `
            <div class="slip-container">
                <div class="slip-title">SLIP TAGIHAN IURAN SAMPAH</div>
                <div class="slip-row"><span>ID Warga:</span><span class="font-bold">${warga.id}</span></div>
                <div class="slip-row"><span>Nama:</span><span class="font-bold">${warga.name}</span></div>
                <div class="slip-row"><span>Wilayah:</span><span>RT ${rt}, ${dukuh}</span></div>
                <div class="slip-row" style="margin-top:10px;"><span>Tanggal Cetak:</span><span>${new Date().toLocaleDateString('id-ID', {dateStyle:'medium'})}</span></div>
                
                <div class="slip-total">
                    <div style="font-size:10px; font-weight:normal; margin-bottom:5px;">TOTAL TUNGGAKAN</div>
                    Rp${warga.totalDebt.toLocaleString('id-ID')}
                </div>
                
                <div style="margin-top:20px; font-size:11px; font-style:italic; text-align:center; color:#64748b;">
                    Mohon segera melakukan pelunasan melalui petugas penagih atau kantor desa. Terima kasih.
                </div>
                <div class="footer" style="margin-top:30px; border-top:1px solid #eee; padding-top:10px;">
                    SapaDesa - Karang Taruna Mahardika
                </div>
            </div>
        `;
        printReport(`Slip_${warga.name}`, content);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Filter Dukuh</label>
                    <select value={filterDukuh} onChange={e => setFilterDukuh(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg">
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Filter RT</label>
                    <select value={filterRT} onChange={e => setFilterRT(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg">
                        <option value="all">Semua RT</option>
                        {rtList.map(r => <option key={r.id} value={r.id}>RT {r.number}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Piutang Terfilter</p>
                    <p className="text-3xl font-black text-rose-600">Rp{totalDebtFiltered.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">{filteredList.length} Warga dengan tunggakan</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400">
                            <th className="p-4">Warga</th>
                            <th className="p-4">Wilayah</th>
                            <th className="p-4 text-right">Tunggakan</th>
                            <th className="p-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memuat data...</td></tr> : 
                        filteredList.length > 0 ? filteredList.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <p className="font-bold text-slate-700">{w.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{w.id}</p>
                                </td>
                                <td className="p-4 text-slate-500">
                                    RT {getRTById(w.rtId)?.number}, {getDukuhById(w.dukuhId)?.name}
                                </td>
                                <td className="p-4 text-right font-mono font-bold text-rose-600">
                                    Rp{w.totalDebt.toLocaleString('id-ID')}
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => handlePrintSlip(w)}
                                        className="text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg font-bold border border-primary/20 transition-all text-xs flex items-center gap-2 mx-auto"
                                    >
                                        <ClipboardListIcon className="text-sm" /> Cetak Slip
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="p-12 text-center text-slate-400 italic">Tidak ada warga dengan tunggakan pada filter ini.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- KOMPONEN LAIN TETAP ---
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1">Dari</label>
                     <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1">Sampai</label>
                     <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1">Dukuh</label>
                     <select value={filters.dukuhId} onChange={e => setFilters({...filters, dukuhId: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm">
                         <option value="all">Semua</option>
                         {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-400 mb-1">RT</label>
                     <select value={filters.rtId} onChange={e => setFilters({...filters, rtId: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-sm">
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

// --- WRAPPER UTAMA ---
const AdminLaporanPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'harian' | 'bulanan' | 'wilayah' | 'tunggakan'>('harian');
    
    const renderContent = () => {
        switch(activeTab) {
            case 'harian': return <LaporanHarian />;
            case 'bulanan': return <LaporanBulanan />;
            case 'wilayah': return <LaporanWilayah />;
            case 'tunggakan': return <LaporanTunggakanTotal />;
            default: return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Laporan & Rekapitulasi</h1>
                <p className="mt-1 text-slate-500 text-sm font-medium">Analisis keuangan dan status penagihan iuran desa.</p>
            </div>
            
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/30">
                    <nav className="-mb-px flex px-4 overflow-x-auto" aria-label="Tabs">
                        {[
                            {id:'harian', label:'Harian'},
                            {id:'bulanan', label:'Bulanan (Rekap)'},
                            {id:'wilayah', label:'Per Wilayah'},
                            {id:'tunggakan', label:'Daftar Tunggakan'}
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'} py-4 px-6 border-b-2 font-bold text-sm transition-all whitespace-nowrap`}
                            >
                                {tab.label}
                            </button>
                        ))}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400">Pemasukan</p>
            <p className="text-lg font-bold text-emerald-600">Rp{totalPemasukan.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400">Pengeluaran</p>
            <p className="text-lg font-bold text-rose-600">Rp{totalPengeluaran.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400">Saldo</p>
            <p className="text-lg font-bold text-slate-700">Rp{saldo.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
            <p className="text-[10px] font-black uppercase text-slate-400">Transaksi</p>
            <p className="text-lg font-bold text-primary">{count}</p>
        </div>
    </div>
);

const ReportTable: FC<{reports: ReportRow[], loading: boolean}> = ({ reports, loading }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-400">
                        <th className="p-4">Waktu</th>
                        <th className="p-4">Warga</th>
                        <th className="p-4">Petugas</th>
                        <th className="p-4 text-right">Jumlah</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={4} className="text-center p-6 text-slate-400 animate-pulse">Memuat...</td></tr>
                    ) : reports.length > 0 ? (
                        reports.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-500 font-medium">{new Date(item.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-700">{item.wargaName}</p>
                                    <p className="text-[10px] text-slate-400">RT {item.rtNumber}, {item.dukuhName}</p>
                                </td>
                                <td className="p-4 text-slate-600 font-medium">{item.petugasName}</td>
                                <td className="p-4 text-right font-mono text-slate-700 font-bold">Rp{item.amount.toLocaleString('id-ID')}</td>
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
