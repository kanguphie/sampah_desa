
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

    // Group by Date for Table
    const dailyData = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const data = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = new Date(year, month - 1, d).toDateString();
            const income = reports.filter(r => new Date(r.timestamp).toDateString() === dateStr).reduce((s, i) => s + i.amount, 0);
            const expense = expenses.filter(e => new Date(e.date).toDateString() === dateStr).reduce((s, i) => s + i.amount, 0);
            if (income > 0 || expense > 0) {
                data.push({ date: d, income, expense, net: income - expense });
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
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                    @page { size: A4; margin: 20mm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; }
                    .header { border-bottom: 4px solid #10b981; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .header-left h1 { color: #10b981; margin: 0; font-size: 28pt; font-weight: 800; }
                    .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; }
                    .report-date { color: #10b981; font-weight: 700; font-size: 12pt; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 9pt; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 10pt; }
                    .summary-box { display: flex; justify-content: flex-end; margin-top: 30px; }
                    .total-card { background: #1e293b; color: white; padding: 20px 40px; border-radius: 16px; text-align: right; }
                    .total-card .label { font-size: 9pt; font-weight: 700; text-transform: uppercase; opacity: 0.7; }
                    .total-card .value { font-size: 20pt; font-weight: 800; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left"><h1>SAPADESA</h1><p>REKAPITULASI BULANAN</p></div>
                    <div class="report-date">${new Date(year, month-1).toLocaleString('id-ID', {month:'long', year:'numeric'})}</div>
                </div>
                <table>
                    <thead><tr><th>Tanggal</th><th style="text-align:right">Pemasukan</th><th style="text-align:right">Pengeluaran</th><th style="text-align:right">Netto</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="summary-box">
                    <div class="total-card">
                        <div class="label">Total Saldo Bulan Ini</div>
                        <div class="value">Rp${(totalInc - totalExp).toLocaleString('id-ID')}</div>
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
                <button onClick={handlePrint} className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"><DownloadIcon /> Cetak Bulanan</button>
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
