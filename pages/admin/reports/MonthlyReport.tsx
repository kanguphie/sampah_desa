
import React, { useState, useEffect, useMemo } from 'react';
import { getReports, getPengeluaran } from '@/services/api';
import { DownloadIcon } from '@/components/icons';

const MonthlyReport: React.FC = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [reports, setReports] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0);
            const [r, e] = await Promise.all([getReports({ startDate: start, endDate: end }), getPengeluaran({ startDate: start, endDate: end })]);
            setReports(r);
            setExpenses(e);
            setLoading(false);
        };
        fetch();
    }, [month, year]);

    const dailyData = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const data = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month - 1, d);
            const dateStr = dateObj.toDateString();
            const income = reports.filter(r => new Date(r.timestamp).toDateString() === dateStr).reduce((s, i) => s + i.amount, 0);
            const expense = expenses.filter(e => new Date(e.date).toDateString() === dateStr).reduce((s, i) => s + i.amount, 0);
            if (income > 0 || expense > 0) {
                data.push({ date: d, fullDate: dateObj, income, expense, net: income - expense });
            }
        }
        return data;
    }, [reports, expenses, month, year]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const rows = dailyData.map(d => `
            <tr>
                <td style="font-weight:700;">${d.date} ${new Date(year, month - 1).toLocaleString('id-ID', {month:'long'})}</td>
                <td style="text-align:right; color:#10b981;">Rp${d.income.toLocaleString('id-ID')}</td>
                <td style="text-align:right; color:#ef4444;">Rp${d.expense.toLocaleString('id-ID')}</td>
                <td style="text-align:right; font-weight:800;">Rp${d.net.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const totalInc = dailyData.reduce((s,i)=>s+i.income,0);
        const totalExp = dailyData.reduce((s,i)=>s+i.expense,0);

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4; margin: 1cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
                    .header-left .logo { color: #10b981; font-size: 24pt; font-weight: 800; margin: 0; line-height: 1; }
                    .header-left .sub-1 { font-size: 9pt; font-weight: 700; color: #1e293b; margin: 8px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 3px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 12pt; font-weight: 800; text-transform: uppercase; }
                    .print-date { font-size: 8pt; color: #94a3b8; font-weight: 600; margin-top: 5px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 8.5pt; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; }
                    .summary-box { display: flex; justify-content: flex-end; margin-top: 30px; }
                    .total-line { display: flex; gap: 30px; font-weight: 800; font-size: 11pt; background: #0f172a; color: white; padding: 15px 30px; border-radius: 8px; }
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
                        <div class="report-title">Rekapitulasi Bulanan</div>
                        <div class="print-date">BULAN: ${new Date(year, month-1).toLocaleString('id-ID', {month:'long', year:'numeric'})}</div>
                        <div class="print-date">DICETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <table>
                    <thead><tr><th>Tanggal</th><th style="text-align:right">Total Pemasukan</th><th style="text-align:right">Total Pengeluaran</th><th style="text-align:right">Netto Harian</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="summary-box">
                    <div class="total-line">
                        <span>SALDO AKHIR BULAN</span>
                        <span>Rp${(totalInc - totalExp).toLocaleString('id-ID')}</span>
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
                <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bulan</label>
                      <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none">
                          {Array.from({length:12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('id-ID', {month: 'long'})}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tahun</label>
                      <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none">
                          {[now.getFullYear(), now.getFullYear()-1].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                </div>
                <button onClick={handlePrint} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"><DownloadIcon /> Cetak Rekap</button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-5">Tanggal</th><th className="p-5 text-right">Pemasukan</th><th className="p-5 text-right">Pengeluaran</th><th className="p-5 text-right">Netto</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memuat...</td></tr> : 
                        dailyData.map(d => (
                            <tr key={d.date} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5 font-bold text-slate-700">{d.date} {new Date(year, month - 1).toLocaleString('id-ID', {month: 'long'})}</td>
                                <td className="p-5 text-right font-bold text-emerald-600">Rp{d.income.toLocaleString('id-ID')}</td>
                                <td className="p-5 text-right font-bold text-rose-600">Rp{d.expense.toLocaleString('id-ID')}</td>
                                <td className="p-5 text-right font-black text-slate-800">Rp{d.net.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonthlyReport;
