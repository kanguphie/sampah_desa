import React, { useState, useEffect } from 'react';
import { getReports, getPengeluaran, getPemasukanLain } from '@/services/api';
import type { Pengeluaran, PemasukanLain } from '@/types';
import { DownloadIcon } from '@/components/icons';

const toLocalDateString = (d: Date | string | null | undefined): string => {
    if (!d) return '';
    let dateObj: Date;
    if (d instanceof Date) {
        dateObj = d;
    } else if (typeof d === 'string') {
        if (d.includes(' ')) {
            const [datePart, timePart] = d.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            if (timePart) {
                const [hour, minute, second] = timePart.split(':').map(Number);
                dateObj = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
            } else {
                dateObj = new Date(year, month - 1, day);
            }
        } else if (d.includes('T')) {
            const datePart = d.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            dateObj = new Date(year, month - 1, day);
        } else {
            const parts = d.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                dateObj = new Date(d);
            }
        }
    } else {
        dateObj = new Date(d);
    }

    if (isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DailyReport: React.FC = () => {
    const [date, setDate] = useState(toLocalDateString(new Date()));
    const [reports, setReports] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<Pengeluaran[]>([]);
    const [otherIncomes, setOtherIncomes] = useState<PemasukanLain[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const [r, e, o] = await Promise.all([
                getReports({ startDate: date, endDate: date }), 
                getPengeluaran({ startDate: date, endDate: date }),
                getPemasukanLain({ startDate: date, endDate: date })
            ]);
            setReports(Array.isArray(r) ? r : []);
            setExpenses(Array.isArray(e) ? e : []);
            setOtherIncomes(Array.isArray(o) ? o : []);
            setLoading(false);
        };
        fetch();
    }, [date]);

    // Filter locally to strictly match the selected target calendar date
    const filteredReports = reports.filter(r => toLocalDateString(r.timestamp) === date);
    const filteredExpenses = expenses.filter(e => toLocalDateString(e.date) === date);
    const filteredOtherIncomes = otherIncomes.filter(o => toLocalDateString(o.date) === date);

    const totalIuran = filteredReports.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalOther = filteredOtherIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalIncome = totalIuran + totalOther;
    const totalExpense = filteredExpenses.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const netBalance = totalIncome - totalExpense;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const incomeRows = filteredReports.map(r => `
            <tr>
                <td>${new Date(r.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td>
                <td><div class="font-bold">${r.wargaName}</div><div class="text-xs">RT ${r.rtNumber}, ${r.dukuhName}</div></td>
                <td style="text-align:right">Rp${r.amount.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const otherIncomeRows = filteredOtherIncomes.map(o => `
            <tr>
                <td>${o.source || 'Lainnya'}</td>
                <td><div class="font-bold">${o.description || '-'}</div></td>
                <td style="text-align:right; color:#059669; font-weight:bold;">Rp${(o.amount || 0).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const expenseRows = filteredExpenses.map(e => `
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
                        <div class="report-title">Laporan Harian Kas</div>
                        <div class="print-date">TGL LAPORAN: ${new Date(date).toLocaleDateString('id-ID', {dateStyle:'long'})}</div>
                        <div class="print-date">WAKTU CETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>

                <div class="section-title">RINCIAN PEMASUKAN IURAN WARGA</div>
                <table>
                    <thead><tr><th width="15%">Waktu</th><th>Nama Warga / Wilayah</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${incomeRows || '<tr><td colspan="3" style="text-align:center; padding: 20px;">Tidak ada iuran sampah pada hari ini</td></tr>'}</tbody>
                </table>

                <div class="section-title">RINCIAN PEMASUKAN LAIN (NON-IURAN)</div>
                <table>
                    <thead><tr><th width="30%">Sumber</th><th>Keterangan / Uraian</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${otherIncomeRows || '<tr><td colspan="3" style="text-align:center; padding: 20px;">Tidak ada pemasukan lain pada hari ini</td></tr>'}</tbody>
                </table>

                <div class="section-title">RINCIAN PENGELUARAN KAS</div>
                <table>
                    <thead><tr><th width="15%">Waktu</th><th>Deskripsi Keperluan</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${expenseRows || '<tr><td colspan="3" style="text-align:center; padding: 20px;">Tidak ada catatan pengeluaran</td></tr>'}</tbody>
                </table>

                <div class="summary-box">
                    <div class="total-line">
                        <span>TOTAL SALDO NETTO</span>
                        <span style="color: #10b981;">Rp${netBalance.toLocaleString('id-ID')}</span>
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
                    <p className="text-xl font-black text-rose-700 mt-1">Rp{totalExpense.toLocaleString('id-ID')}</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Netto</p>
                    <p className="text-xl font-black text-slate-800 mt-1">Rp{netBalance.toLocaleString('id-ID')}</p>
                </div>
            </div>

            {/* Tabel Iuran Warga */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 bg-slate-50/70 border-b border-slate-100 font-bold text-slate-700 text-sm">
                    Rincian Pembayaran Iuran Sampah ({filteredReports.length})
                </div>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="p-4">Waktu</th>
                            <th className="p-4">Warga</th>
                            <th className="p-4">Petugas</th>
                            <th className="p-4 text-right">Nominal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-6 text-center animate-pulse font-bold text-slate-300">Memproses Data...</td></tr>
                        ) : filteredReports.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-bold text-slate-400">{new Date(r.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-700">{r.wargaName}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter font-bold">RT {r.rtNumber}, {r.dukuhName}</p>
                                </td>
                                <td className="p-4 text-slate-500 font-medium">{r.petugasName}</td>
                                <td className="p-4 text-right font-bold text-blue-600">Rp{r.amount.toLocaleString('id-ID')}</td>
                            </tr>
                        ))}
                        {!loading && filteredReports.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400 font-bold italic text-xs">Tidak ada pembayaran iuran pada hari ini</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Tabel Pemasukan Lain */}
            {filteredOtherIncomes.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-5 bg-emerald-50/50 border-b border-emerald-100 font-bold text-emerald-800 text-sm">
                        Rincian Pemasukan Lain (Non-Iuran) ({filteredOtherIncomes.length})
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="p-4">Sumber</th>
                                <th className="p-4">Keterangan / Uraian</th>
                                <th className="p-4 text-right">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOtherIncomes.map(o => (
                                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">{o.source || 'Lainnya'}</td>
                                    <td className="p-4 text-slate-600 font-medium">{o.description || '-'}</td>
                                    <td className="p-4 text-right font-bold text-emerald-600">+Rp{(o.amount || 0).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DailyReport;
