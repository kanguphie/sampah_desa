
import React, { useState, useEffect } from 'react';
import { getReports, getPengeluaran } from '@/services/api';
// Fix: Import ClipboardListIcon which was missing
import { DownloadIcon, ClipboardListIcon } from '@/components/icons';

const MonthlyReport: React.FC = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [data, setData] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0);
            const [r, e] = await Promise.all([getReports({ startDate: start, endDate: end }), getPengeluaran({ startDate: start, endDate: end })]);
            setData(r);
            setExpenses(e);
            setLoading(false);
        };
        fetch();
    }, [month, year]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const totalRev = data.reduce((s, i) => s + i.amount, 0);
        const totalExp = expenses.reduce((s, i) => s + i.amount, 0);
        const net = totalRev - totalExp;

        printWindow.document.write(`
            <html><head><style>
                body{font-family:'Plus Jakarta Sans',sans-serif;padding:50px;color:#1e293b;} 
                .kop{text-align:center;border-bottom:3px double #10b981;margin-bottom:30px;padding-bottom:15px;} 
                h1{color:#10b981;margin:0;font-size:24pt;} 
                .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:10pt;font-weight:bold;color:#64748b;} 
                table{width:100%;border-collapse:collapse;margin-bottom:30px;} 
                th,td{border:1px solid #e2e8f0;padding:12px;text-align:left;font-size:10pt;} 
                th{background:#f8fafc;color:#475569;text-transform:uppercase;font-size:9pt;letter-spacing:1px;}
                .summary-box{background:#f1f5f9;padding:20px;border-radius:12px;display:inline-block;min-width:300px;}
                .summary-row{display:flex;justify-content:space-between;margin-bottom:5px;font-weight:600;}
                .total-line{border-top:1px solid #cbd5e1;padding-top:10px;margin-top:10px;color:#10b981;font-size:14pt;font-weight:900;}
            </style></head><body>
                <div class="kop"><h1>SAPADESA</h1><p>ROWOSARI • LIMPUNG • BATANG</p></div>
                <div class="meta"><span>LAPORAN BULANAN</span><span>BULAN: ${month}/${year}</span></div>
                
                <h3>Ringkasan Keuangan</h3>
                <div class="summary-box">
                    <div class="summary-row"><span>Total Pemasukan:</span><span>Rp${totalRev.toLocaleString('id-ID')}</span></div>
                    <div class="summary-row"><span>Total Pengeluaran:</span><span>Rp${totalExp.toLocaleString('id-ID')}</span></div>
                    <div class="total-line"><span>Saldo Bersih:</span><span>Rp${net.toLocaleString('id-ID')}</span></div>
                </div>

                <p style="margin-top:40px;font-size:9pt;color:#94a3b8;text-align:center;">Laporan ini dihasilkan secara sistem pada ${new Date().toLocaleString('id-ID')}</p>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Bulan</label>
                      <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none">
                          {Array.from({length:12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('id-ID', {month: 'long'})}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Tahun</label>
                      <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none">
                          {[now.getFullYear(), now.getFullYear()-1].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                </div>
                <button onClick={handlePrint} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10"><DownloadIcon /> Cetak Rekap</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">Statistik Bulanan</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <span className="text-xs font-bold text-emerald-600 uppercase">Pemasukan</span>
                            <span className="text-xl font-black text-emerald-700">Rp{data.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <span className="text-xs font-bold text-rose-600 uppercase">Pengeluaran</span>
                            <span className="text-xl font-black text-rose-700">Rp{expenses.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-slate-100 rounded-2xl border border-slate-200">
                            <span className="text-xs font-bold text-slate-500 uppercase">Netto (Laba/Rugi)</span>
                            <span className="text-xl font-black text-slate-800">Rp{(data.reduce((s,i) => s+i.amount, 0) - expenses.reduce((s,i) => s+i.amount, 0)).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
                
                <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col items-center justify-center text-center">
                    <ClipboardListIcon className="text-6xl text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">Laporan bulanan merangkum seluruh aktivitas transaksi warga dan pengeluaran operasional desa Rowosari dalam satu periode kalender.</p>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReport;
