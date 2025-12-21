
import React, { useState, useEffect, useMemo } from 'react';
import { getReports, getPengeluaran } from '@/services/api';
import type { Transaksi, Pengeluaran } from '@/types';
import { DownloadIcon } from '@/components/icons';

const DailyReport: React.FC = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reports, setReports] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<Pengeluaran[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const d = new Date(date);
            const [r, e] = await Promise.all([getReports({ startDate: d, endDate: d }), getPengeluaran({ startDate: d, endDate: d })]);
            setReports(r);
            setExpenses(e);
            setLoading(false);
        };
        fetch();
    }, [date]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const rows = reports.map(r => `<tr><td>${new Date(r.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td><td>${r.wargaName}</td><td>${r.rtNumber}/${r.dukuhName}</td><td style="text-align:right">Rp${r.amount.toLocaleString('id-ID')}</td></tr>`).join('');
        printWindow.document.write(`<html><head><style>body{font-family:sans-serif;padding:50px;color:#1e293b;} .kop{text-align:center;border-bottom:3px double #10b981;margin-bottom:30px;padding-bottom:15px;} h1{color:#10b981;margin:0;font-size:24pt;} .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:10pt;font-weight:bold;color:#64748b;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #e2e8f0;padding:12px;text-align:left;font-size:10pt;} th{background:#f8fafc;color:#475569;text-transform:uppercase;font-size:9pt;letter-spacing:1px;}</style></head><body><div class="kop"><h1>SAPADESA</h1><p>ROWOSARI • LIMPUNG • BATANG</p></div><div class="meta"><span>LAPORAN HARIAN</span><span>TANGGAL: ${new Date(date).toLocaleDateString('id-ID', {dateStyle:'full'})}</span></div><table><thead><tr><th>Waktu</th><th>Nama Warga</th><th>Wilayah</th><th style="text-align:right">Nominal</th></tr></thead><tbody>${rows || '<tr><td colspan="4" style="text-align:center">Tidak ada transaksi</td></tr>'}</tbody></table></body></html>`);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Tanggal Laporan</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <button onClick={handlePrint} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"><DownloadIcon /> Cetak Semua</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pemasukan</p><p className="text-2xl font-black text-emerald-700 mt-1">Rp{reports.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</p></div>
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100"><p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pengeluaran</p><p className="text-2xl font-black text-rose-700 mt-1">Rp{expenses.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</p></div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Transaksi</p><p className="text-2xl font-black text-slate-700 mt-1">{reports.length}</p></div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-5">Waktu</th><th className="p-5">Warga</th><th className="p-5">Petugas</th><th className="p-5 text-right">Nominal</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse font-bold text-slate-300">Memproses Data...</td></tr> : 
                        reports.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5 font-bold text-slate-400">{new Date(r.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td>
                                <td className="p-5">
                                    <p className="font-bold text-slate-700">{r.wargaName}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">RT {r.rtNumber}, {r.dukuhName}</p>
                                </td>
                                <td className="p-5 text-slate-500 font-medium">{r.petugasName}</td>
                                <td className="p-5 text-right font-bold text-emerald-600">Rp{r.amount.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DailyReport;
