import React, { useState, useEffect, useMemo } from 'react';
import { getReports, getPengeluaran, getPemasukanLain } from '@/services/api';
import { DownloadIcon } from '@/components/icons';

const YearlyReport: React.FC = () => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [reports, setReports] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [otherIncomes, setOtherIncomes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const startStr = `${year}-01-01`;
            const endStr = `${year}-12-31`;
            const [r, e, o] = await Promise.all([
                getReports({ startDate: startStr, endDate: endStr }), 
                getPengeluaran({ startDate: startStr, endDate: endStr }),
                getPemasukanLain({ startDate: startStr, endDate: endStr })
            ]);
            setReports(Array.isArray(r) ? r : []);
            setExpenses(Array.isArray(e) ? e : []);
            setOtherIncomes(Array.isArray(o) ? o : []);
            setLoading(false);
        };
        fetch();
    }, [year]);

    const monthlySummary = useMemo(() => {
        const data = [];
        for (let m = 0; m < 12; m++) {
            const iuran = reports.filter(r => new Date(r.timestamp).getMonth() === m).reduce((s, i) => s + (Number(i.amount) || 0), 0);
            const other = otherIncomes.filter(o => new Date(o.date).getMonth() === m).reduce((s, i) => s + (Number(i.amount) || 0), 0);
            const income = iuran + other;
            const expense = expenses.filter(e => new Date(e.date).getMonth() === m).reduce((s, i) => s + (Number(i.amount) || 0), 0);
            data.push({ 
                monthName: new Date(year, m).toLocaleString('id-ID', { month: 'long' }),
                iuran,
                other,
                income, 
                expense, 
                net: income - expense 
            });
        }
        return data;
    }, [reports, expenses, otherIncomes, year]);

    const totalIuran = useMemo(() => monthlySummary.reduce((s, i) => s + i.iuran, 0), [monthlySummary]);
    const totalOther = useMemo(() => monthlySummary.reduce((s, i) => s + i.other, 0), [monthlySummary]);
    const totalInc = useMemo(() => monthlySummary.reduce((s, i) => s + i.income, 0), [monthlySummary]);
    const totalExp = useMemo(() => monthlySummary.reduce((s, i) => s + i.expense, 0), [monthlySummary]);
    const netBalance = totalInc - totalExp;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const rows = monthlySummary.map(m => `
            <tr>
                <td style="font-weight:700;">${m.monthName}</td>
                <td style="text-align:right; color:#0284c7;">Rp${m.iuran.toLocaleString('id-ID')}</td>
                <td style="text-align:right; color:#059669;">Rp${m.other.toLocaleString('id-ID')}</td>
                <td style="text-align:right; color:#10b981; font-weight:bold;">Rp${m.income.toLocaleString('id-ID')}</td>
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
                    .total-line { display: flex; gap: 40px; font-weight: 800; font-size: 13pt; background: #0f172a; color: white; padding: 18px 45px; border-radius: 8px; }
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
                        <div class="report-title">Laporan Tahunan Kas</div>
                        <div class="print-date">TAHUN ANGGARAN: ${year}</div>
                        <div class="print-date">DICETAK PADA: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <table>
                    <thead><tr><th>Bulan</th><th style="text-align:right">Iuran Warga</th><th style="text-align:right">Pemasukan Lain</th><th style="text-align:right">Total Masuk</th><th style="text-align:right">Pengeluaran</th><th style="text-align:right">Saldo Bersih</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                <div class="total-box">
                    <div class="total-line">
                        <span>TOTAL AKHIR TAHUN:</span>
                        <span style="color: #38bdf8;">Rp${netBalance.toLocaleString('id-ID')}</span>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Tahun Anggaran</label>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20">
                        {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <button onClick={handlePrint} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"><DownloadIcon /> Cetak Laporan</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Iuran Warga</p>
                    <p className="text-xl font-black text-blue-700 mt-1">Rp{totalIuran.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pemasukan Lain</p>
                    <p className="text-xl font-black text-emerald-700 mt-1">Rp{totalOther.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Pengeluaran</p>
                    <p className="text-xl font-black text-rose-700 mt-1">Rp{totalExp.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Bersih {year}</p>
                    <p className="text-xl font-black text-slate-800 mt-1">Rp{netBalance.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="p-5">Bulan</th>
                            <th className="p-5 text-right">Iuran Warga</th>
                            <th className="p-5 text-right">Pemasukan Lain</th>
                            <th className="p-5 text-right">Total Masuk</th>
                            <th className="p-5 text-right">Pengeluaran</th>
                            <th className="p-5 text-right">Saldo Bersih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={6} className="p-10 text-center animate-pulse font-bold text-slate-300">Memproses Data Tahunan...</td></tr> : 
                        monthlySummary.map((m, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5 font-bold text-slate-700">{m.monthName}</td>
                                <td className="p-5 text-right font-medium text-blue-600">Rp{m.iuran.toLocaleString('id-ID')}</td>
                                <td className="p-5 text-right font-medium text-emerald-600">Rp{m.other.toLocaleString('id-ID')}</td>
                                <td className="p-5 text-right font-bold text-emerald-700">Rp{m.income.toLocaleString('id-ID')}</td>
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
