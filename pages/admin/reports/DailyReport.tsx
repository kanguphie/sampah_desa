
import React, { useState, useEffect } from 'react';
import { getReports, getPengeluaran } from '@/services/api';
import type { Pengeluaran } from '@/types';
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
        
        const incomeRows = reports.map(r => `
            <tr>
                <td>${new Date(r.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td>
                <td><div class="font-bold">${r.wargaName}</div><div class="text-xs text-slate-500">RT ${r.rtNumber}, ${r.dukuhName}</div></td>
                <td style="text-align:right">Rp${r.amount.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const expenseRows = expenses.map(e => `
            <tr>
                <td>-</td>
                <td><div class="font-bold">${e.description}</div></td>
                <td style="text-align:right; color:#ef4444;">Rp${e.amount.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const totalIncome = reports.reduce((s,i) => s+i.amount, 0);
        const totalExpense = expenses.reduce((s,i) => s+i.amount, 0);

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                    @page { size: A4; margin: 20mm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; line-height: 1.5; margin: 0; }
                    .header { border-bottom: 4px solid #10b981; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .header-left h1 { color: #10b981; margin: 0; font-size: 28pt; font-weight: 800; letter-spacing: -1px; }
                    .header-left p { margin: 0; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; font-size: 9pt; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
                    .report-date { color: #10b981; font-weight: 700; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 9pt; text-transform: uppercase; color: #475569; border-bottom: 2px solid #e2e8f0; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 10pt; }
                    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px; }
                    .summary-card { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
                    .summary-card .label { font-size: 8pt; font-weight: 800; color: #94a3b8; text-transform: uppercase; }
                    .summary-card .value { font-size: 14pt; font-weight: 800; color: #1e293b; }
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                    .signature { width: 200px; text-align: center; }
                    .signature-line { margin-top: 60px; border-top: 1px solid #1e293b; padding-top: 5px; font-weight: 700; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <h1>SAPADESA</h1>
                        <p>Rowosari • Limpung • Batang</p>
                    </div>
                    <div class="header-right">
                        <div class="report-title">Laporan Transaksi Harian</div>
                        <div class="report-date">${new Date(date).toLocaleDateString('id-ID', {dateStyle:'full'})}</div>
                    </div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card"><div class="label">Total Pemasukan</div><div class="value" style="color:#10b981">Rp${totalIncome.toLocaleString('id-ID')}</div></div>
                    <div class="summary-card"><div class="label">Total Pengeluaran</div><div class="value" style="color:#ef4444">Rp${totalExpense.toLocaleString('id-ID')}</div></div>
                    <div class="summary-card"><div class="label">Saldo Bersih</div><div class="value">Rp${(totalIncome - totalExpense).toLocaleString('id-ID')}</div></div>
                </div>

                <h3>Rincian Pemasukan</h3>
                <table>
                    <thead><tr><th>Waktu</th><th>Deskripsi / Warga</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${incomeRows || '<tr><td colspan="3" style="text-align:center">Tidak ada pemasukan</td></tr>'}</tbody>
                </table>

                <h3 style="margin-top:30px;">Rincian Pengeluaran</h3>
                <table>
                    <thead><tr><th>Waktu</th><th>Keperluan</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${expenseRows || '<tr><td colspan="3" style="text-align:center">Tidak ada pengeluaran</td></tr>'}</tbody>
                </table>

                <div class="footer">
                    <div class="signature">
                        <p>Mengetahui,</p>
                        <p style="font-size: 9pt; color: #64748b;">Kepala Desa Rowosari</p>
                        <div class="signature-line">( .................................... )</div>
                    </div>
                    <div class="signature">
                        <p>Dicetak Oleh,</p>
                        <p style="font-size: 9pt; color: #64748b;">Admin SapaDesa</p>
                        <div class="signature-line">( .................................... )</div>
                    </div>
                </div>
            </body>
            </html>
        `);
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
                <button onClick={handlePrint} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"><DownloadIcon /> Cetak Harian</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pemasukan</p><p className="text-2xl font-black text-emerald-700 mt-1">Rp{reports.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</p></div>
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100"><p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pengeluaran</p><p className="text-2xl font-black text-rose-700 mt-1">Rp{expenses.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</p></div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Netto</p><p className="text-2xl font-black text-slate-700 mt-1">Rp{(reports.reduce((s,i) => s+i.amount, 0) - expenses.reduce((s,i) => s+i.amount, 0)).toLocaleString('id-ID')}</p></div>
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
