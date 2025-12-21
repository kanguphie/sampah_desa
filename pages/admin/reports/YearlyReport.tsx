
import React, { useState, useEffect, useMemo } from 'react';
import { getReports, getPengeluaran } from '@/services/api';
import { DownloadIcon } from '@/components/icons';

const YearlyReport: React.FC = () => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [reports, setReports] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const start = new Date(year, 0, 1);
            const end = new Date(year, 11, 31);
            const [r, e] = await Promise.all([getReports({ startDate: start, endDate: end }), getPengeluaran({ startDate: start, endDate: end })]);
            setReports(r);
            setExpenses(e);
            setLoading(false);
        };
        fetch();
    }, [year]);

    const monthlySummary = useMemo(() => {
        const data = [];
        for (let m = 0; m < 12; m++) {
            const income = reports.filter(r => new Date(r.timestamp).getMonth() === m).reduce((s, i) => s + i.amount, 0);
            const expense = expenses.filter(e => new Date(e.date).getMonth() === m).reduce((s, i) => s + i.amount, 0);
            data.push({ 
                monthName: new Date(year, m).toLocaleString('id-ID', { month: 'long' }),
                income, 
                expense, 
                net: income - expense 
            });
        }
        return data;
    }, [reports, expenses, year]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const rows = monthlySummary.map(m => `
            <tr>
                <td style="font-weight:700;">${m.monthName}</td>
                <td style="text-align:right; color:#10b981;">Rp${m.income.toLocaleString('id-ID')}</td>
                <td style="text-align:right; color:#ef4444;">Rp${m.expense.toLocaleString('id-ID')}</td>
                <td style="text-align:right; font-weight:800;">Rp${m.net.toLocaleString('id-ID')}</td>
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
                    .header-left .sub-1 { font-size: 9pt; font-weight: 700; color: #1e293b; margin: 5px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 3px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
                    .print-date { font-size: 8pt; color: #94a3b8; font-weight: 600; margin-top: 4px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 8.5pt; text-transform: uppercase; border-bottom: 1.5px solid #e2e8f0; color: #475569; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; }
                    .total-box { display: flex; justify-content: flex-end; margin-top: 30px; }
                    .total-line { display: flex; gap: 40px; font-weight: 800; font-size: 13pt; background: #10b981; color: white; padding: 18px 45px; border-radius: 8px; }
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
                        <div class="report-title">Rekapitulasi Tahunan</div>
                        <div class="print-date">TAHUN ANGGARAN: ${year}</div>
                        <div class="print-date">WAKTU CETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <table>
                    <thead><tr><th>Bulan</th><th style="text-align:right">Total Pemasukan</th><th style="text-align:right">Total Pengeluaran</th><th style="text-align:right">Netto Bulanan</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="total-box">
                    <div class="total-line">
                        <span>TOTAL SALDO TAHUN ${year}</span>
                        <span>Rp${monthlySummary.reduce((s,i)=>s+i.net,0).toLocaleString('id-ID')}</span>
                    </div>
                </div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tight mb-1">Rekapitulasi Tahunan</h2>
                    <p className="text-slate-400 font-medium">Laporan arus kas per bulan sepanjang tahun anggaran.</p>
                </div>
                <div className="flex gap-3 relative z-10">
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="bg-white/10 border border-white/20 p-4 rounded-2xl font-bold text-white outline-none w-32">
                        {[now.getFullYear(), now.getFullYear()-1].map(y => <option key={y} value={y} className="text-slate-900">{y}</option>)}
                    </select>
                    <button onClick={handlePrint} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-all shadow-lg"><DownloadIcon /> Cetak Tahunan</button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-5">Bulan</th><th className="p-5 text-right">Pemasukan</th><th className="p-5 text-right">Pengeluaran</th><th className="p-5 text-right">Netto</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memuat Data...</td></tr> : 
                        monthlySummary.map(m => (
                            <tr key={m.monthName} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5 font-bold text-slate-700">{m.monthName}</td>
                                <td className="p-5 text-right font-bold text-emerald-600">Rp{m.income.toLocaleString('id-ID')}</td>
                                <td className="p-5 text-right font-bold text-rose-600">Rp{m.expense.toLocaleString('id-ID')}</td>
                                <td className="p-5 text-right font-black text-slate-800">Rp{m.net.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default YearlyReport;
