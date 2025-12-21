
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
                <td><div class="font-bold">${r.wargaName}</div><div class="text-xs">RT ${r.rtNumber}, ${r.dukuhName}</div></td>
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

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4; margin: 1cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 25px; }
                    .header-left .logo { color: #10b981; font-size: 24pt; font-weight: 800; margin: 0; line-height: 1.1; }
                    .header-left .sub-1 { font-size: 9pt; font-weight: 700; color: #1e293b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.2px; }
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
                    .print-date { font-size: 8pt; color: #94a3b8; font-weight: 600; margin-top: 4px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #f8fafc; text-align: left; padding: 10px; font-size: 8.5pt; text-transform: uppercase; color: #475569; border-bottom: 1.5px solid #e2e8f0; }
                    td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; }
                    .section-title { font-size: 11pt; font-weight: 800; margin-top: 25px; border-left: 5px solid #10b981; padding-left: 10px; color: #1e293b; text-transform: uppercase; }
                    .summary-box { display: flex; justify-content: flex-end; margin-top: 25px; }
                    .total-line { display: flex; gap: 40px; font-weight: 800; font-size: 12pt; background: #f8fafc; padding: 15px 25px; border-radius: 8px; border: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <h1 class="logo">SAPADESA</h1>
                        <p class="sub-1">PENGELOLAAN SAMPAH DESA ROWOSARI, LIMPUNG, BATANG</p>
                        <p class="sub-2">SEKRETARIAT: KANTOR DESA ROWOSARI, JAWA TENGAH 51271</p>
                    </div>
                    <div class="header-right">
                        <div class="report-title">Laporan Harian</div>
                        <div class="print-date">TGL LAPORAN: ${new Date(date).toLocaleDateString('id-ID', {dateStyle:'long'})}</div>
                        <div class="print-date">WAKTU CETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>

                <div class="section-title">RINCIAN PEMASUKAN IURAN</div>
                <table>
                    <thead><tr><th width="15%">Waktu</th><th>Nama Warga / Wilayah</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${incomeRows || '<tr><td colspan="3" style="text-align:center; padding: 20px;">Tidak ada transaksi hari ini</td></tr>'}</tbody>
                </table>

                <div class="section-title">RINCIAN PENGELUARAN KAS</div>
                <table>
                    <thead><tr><th width="15%">Waktu</th><th>Deskripsi Keperluan</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${expenseRows || '<tr><td colspan="3" style="text-align:center; padding: 20px;">Tidak ada catatan pengeluaran</td></tr>'}</tbody>
                </table>

                <div class="summary-box">
                    <div class="total-line">
                        <span>TOTAL SALDO NETTO</span>
                        <span style="color: #10b981;">Rp${(reports.reduce((s,i)=>s+i.amount,0) - expenses.reduce((s,i)=>s+i.amount,0)).toLocaleString('id-ID')}</span>
                    </div>
                </div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Tanggal Laporan</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <button onClick={handlePrint} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"><DownloadIcon /> Cetak Laporan</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pemasukan</p><p className="text-2xl font-black text-emerald-700 mt-1">Rp{reports.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</p></div>
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-100"><p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pengeluaran</p><p className="text-2xl font-black text-rose-700 mt-1">Rp{expenses.reduce((s,i) => s+i.amount, 0).toLocaleString('id-ID')}</p></div>
                <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200"><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Netto</p><p className="text-2xl font-black text-slate-800 mt-1">Rp{(reports.reduce((s,i) => s+i.amount, 0) - expenses.reduce((s,i) => s+i.amount, 0)).toLocaleString('id-ID')}</p></div>
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
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">RT {r.rtNumber}, {r.dukuhName}</p>
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
