
import React, { useState, useEffect } from 'react';
import { getReports, getPengeluaran } from '@/services/api';
import { DownloadIcon } from '@/components/icons';

const YearlyReport: React.FC = () => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [stats, setStats] = useState({ revenue: 0, expense: 0, count: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31);
            const [r, e] = await Promise.all([getReports({ startDate: start, endDate: end }), getPengeluaran({ startDate: start, endDate: end })]);
            setStats({
                revenue: r.reduce((s, i) => s + i.amount, 0),
                expense: e.reduce((s, i) => s + i.amount, 0),
                count: r.length
            });
            setLoading(false);
        };
        fetch();
    }, [year]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html><head><style>
                body{font-family:'Plus Jakarta Sans',sans-serif;padding:100px;color:#1e293b;text-align:center;} 
                .kop{border-bottom:3px double #10b981;margin-bottom:50px;padding-bottom:20px;} 
                h1{color:#10b981;margin:0;font-size:32pt;} 
                .year-badge{background:#f8fafc;padding:20px;border-radius:24px;display:inline-block;margin:30px 0;border:1px solid #e2e8f0;}
                .val{font-size:40pt;font-weight:900;color:#1e293b;line-height:1;}
                .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:50px;text-align:left;}
                .box{padding:30px;border-radius:24px;border:1px solid #f1f5f9;background:#f8fafc;}
                .box-label{font-size:10pt;font-weight:bold;color:#64748b;text-transform:uppercase;margin-bottom:10px;display:block;}
                .box-val{font-size:20pt;font-weight:900;color:#10b981;}
            </style></head><body>
                <div class="kop"><h1>SAPADESA</h1><p>ROWOSARI • LIMPUNG • BATANG</p></div>
                <h3>LAPORAN REKAPITULASI TAHUNAN</h3>
                <div class="year-badge"><span style="display:block;font-size:10pt;font-weight:bold;color:#64748b;">TAHUN ANGGARAN</span><div class="val">${year}</div></div>
                <div class="grid">
                    <div class="box"><span class="box-label">Total Pemasukan Iuran</span><span class="box-val">Rp${stats.revenue.toLocaleString('id-ID')}</span></div>
                    <div class="box"><span class="box-label">Total Pengeluaran Kas</span><span class="box-val" style="color:#ef4444;">Rp${stats.expense.toLocaleString('id-ID')}</span></div>
                </div>
                <p style="margin-top:100px;font-size:10pt;color:#94a3b8;">Rowosari, ${new Date().toLocaleDateString('id-ID', {dateStyle:'long'})}</p>
                <div style="margin-top:80px;border-top:1px solid #e2e8f0;padding-top:20px;font-size:12pt;font-weight:bold;">SISTEM MANAJEMEN SAPADESA</div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-8 py-4">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-black tracking-tight leading-none mb-2">Rekapitulasi Tahunan</h2>
                    <p className="text-slate-400 font-medium">Monitoring akumulasi performa keuangan desa per tahun.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-center relative z-10">
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white/10 border border-white/20 p-4 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-primary w-40">
                        {[now.getFullYear(), now.getFullYear()-1, now.getFullYear()-2].map(y => <option key={y} value={y} className="text-slate-900">{y}</option>)}
                    </select>
                    <button onClick={handlePrint} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all flex items-center gap-2"><DownloadIcon /> Cetak Laporan Tahunan</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm"><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Pemasukan</p><p className="text-3xl font-black text-emerald-600">Rp{stats.revenue.toLocaleString('id-ID')}</p></div>
                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm"><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran</p><p className="text-3xl font-black text-rose-600">Rp{stats.expense.toLocaleString('id-ID')}</p></div>
                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm"><p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Aktivitas</p><p className="text-3xl font-black text-slate-800">{stats.count} Transaksi</p></div>
            </div>
        </div>
    );
};

export default YearlyReport;
