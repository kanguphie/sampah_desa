import React, { useState, useEffect, useMemo } from 'react';
import { getReports, getAllWarga, getAllDukuh, getAllRT } from '@/services/api';
import { DownloadIcon } from '@/components/icons';

const MonthlyIuranStatusReport: React.FC = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [reports, setReports] = useState<any[]>([]);
    const [wargas, setWargas] = useState<any[]>([]);
    const [dukuhList, setDukuhList] = useState<any[]>([]);
    const [rtList, setRtList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'semua' | 'lunas' | 'belum'>('semua');
    const [dukuhFilter, setDukuhFilter] = useState<number | 'semua'>('semua');
    const [sortKey, setSortKey] = useState<'nama' | 'dukuh' | 'rt' | 'tarif' | 'status' | 'tanggal' | 'nominal'>('status');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            const [r, w, du, rt] = await Promise.all([
                getReports({ startDate: startStr, endDate: endStr }),
                getAllWarga(),
                getAllDukuh(),
                getAllRT()
            ]);
            setReports(Array.isArray(r) ? r : []);
            setWargas(Array.isArray(w) ? w : []);
            setDukuhList(Array.isArray(du) ? du : []);
            setRtList(Array.isArray(rt) ? rt : []);
            setLoading(false);
        };
        fetch();
    }, [month, year]);

    // Status iuran bulanan per warga — aturan sama seperti server (monthly-status):
    // Lunas = ada transaksi kategori 'bulanan' berstatus paid/lunas di bulan yang dipilih.
    const monthlyStatus = useMemo(() => {
        const isPaidTx = (r: any) => ['paid', 'lunas'].includes(String(r.status || '').toLowerCase());
        return wargas.filter(w => w.billingType === 'BULANAN').map(w => {
            const txs = reports.filter(r =>
                String(r.wargaId) === String(w.id) &&
                String(r.category || '').toLowerCase() === 'bulanan' &&
                isPaidTx(r) &&
                new Date(r.timestamp).getFullYear() === year &&
                new Date(r.timestamp).getMonth() + 1 === month
            );
            const tx = txs.length ? txs.reduce((a, b) => new Date(b.timestamp).getTime() > new Date(a.timestamp).getTime() ? b : a) : null;
            return {
                id: w.id,
                name: w.name || 'Warga Tanpa Nama',
                dukuhId: w.dukuhId,
                rtNumber: rtList.find((rt: any) => rt.id === w.rtId)?.number || '-',
                dukuhName: dukuhList.find((du: any) => du.id === w.dukuhId)?.name || '-',
                monthlyFee: w.monthlyFee || 0,
                paid: !!tx,
                paidDate: tx ? new Date(tx.timestamp).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'}) : '',
                paidAmount: tx ? Number(tx.amount) || 0 : 0,
                paidTs: tx ? new Date(tx.timestamp).getTime() : 0
            };
        });
    }, [wargas, reports, dukuhList, rtList, month, year]);

    const sortedMonthly = useMemo(() => {
        const arr = [...monthlyStatus];
        arr.sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'nama') cmp = String(a.name).localeCompare(String(b.name), 'id');
            else if (sortKey === 'dukuh') cmp = String(a.dukuhName).localeCompare(String(b.dukuhName), 'id') || String(a.rtNumber).localeCompare(String(b.rtNumber), 'id');
            else if (sortKey === 'rt') cmp = String(a.rtNumber).localeCompare(String(b.rtNumber), 'id');
            else if (sortKey === 'tarif') cmp = a.monthlyFee - b.monthlyFee;
            else if (sortKey === 'status') cmp = Number(a.paid) - Number(b.paid);
            else if (sortKey === 'tanggal') cmp = a.paidTs - b.paidTs;
            else cmp = a.paidAmount - b.paidAmount;
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [monthlyStatus, sortKey, sortDir]);

    const filteredMonthly = useMemo(() =>
        sortedMonthly.filter(m =>
            (statusFilter === 'semua' || (statusFilter === 'lunas' ? m.paid : !m.paid)) &&
            (dukuhFilter === 'semua' || m.dukuhId === dukuhFilter)
        ),
    [sortedMonthly, statusFilter, dukuhFilter]);

    const paidCount = useMemo(() => monthlyStatus.filter(m => m.paid).length, [monthlyStatus]);
    const totalMonthlyPaid = useMemo(() => monthlyStatus.reduce((s, m) => s + m.paidAmount, 0), [monthlyStatus]);

    // Jumlah baris akhir — dihitung dari baris yang sedang tampil (mengikuti filter)
    const totalTarifShown = useMemo(() => filteredMonthly.reduce((s, m) => s + m.monthlyFee, 0), [filteredMonthly]);
    const totalNominalShown = useMemo(() => filteredMonthly.reduce((s, m) => s + m.paidAmount, 0), [filteredMonthly]);
    const paidShown = useMemo(() => filteredMonthly.filter(m => m.paid).length, [filteredMonthly]);

    const handleSort = (key: typeof sortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir(key === 'nama' || key === 'dukuh' || key === 'rt' ? 'asc' : 'desc');
        }
    };

    const sortArrow = (key: typeof sortKey) => sortKey === key ? (sortDir === 'asc' ? ' \u25b2' : ' \u25bc') : '';

    const monthName = new Date(year, month - 1).toLocaleString('id-ID', {month: 'long'});
    const dukuhName = dukuhFilter === 'semua' ? 'Semua Wilayah' : (dukuhList.find((d: any) => d.id === dukuhFilter)?.name || '-');

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const rows = filteredMonthly.map((m, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><div class="font-bold">${m.name}</div></td>
                <td>${m.dukuhName}</td>
                <td>${m.rtNumber}</td>
                <td style="text-align:right">Rp${m.monthlyFee.toLocaleString('id-ID')}</td>
                <td>${m.paid ? 'Lunas' : 'Belum'}</td>
                <td>${m.paidDate || '-'}</td>
                <td style="text-align:right; font-weight:bold;">${m.paid ? 'Rp' + m.paidAmount.toLocaleString('id-ID') : '-'}</td>
            </tr>
        `).join('');

        const totalRow = filteredMonthly.length ? `
            <tr style="font-weight:800; background:#f5f3ff; border-top: 2px solid #c4b5fd;">
                <td>&mdash;</td>
                <td>JUMLAH (${filteredMonthly.length} warga)</td>
                <td>&mdash;</td>
                <td>&mdash;</td>
                <td style="text-align:right">Rp${totalTarifShown.toLocaleString('id-ID')}</td>
                <td>${paidShown} Lunas</td>
                <td>&mdash;</td>
                <td style="text-align:right">Rp${totalNominalShown.toLocaleString('id-ID')}</td>
            </tr>` : '';

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
                        <div class="report-title">Status Iuran Bulanan</div>
                        <div class="print-date">PERIODE: ${monthName} ${year} • WILAYAH: ${dukuhName}</div>
                        <div class="print-date">DICETAK PADA: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <table>
                    <thead><tr><th>No</th><th>Nama</th><th>Dukuh</th><th>RT</th><th style="text-align:right">Tarif</th><th>Status</th><th>Tgl Bayar</th><th style="text-align:right">Nominal</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="8" style="text-align:center; padding: 20px;">Tidak ada warga tarif bulanan</td></tr>'}${totalRow}</tbody>
                </table>
                <div class="summary-box">
                    <div class="total-line">
                        <span>LUNAS: ${paidCount} DARI ${monthlyStatus.length} WARGA</span>
                        <span style="color: #10b981;">TERKUMPUL: Rp${totalMonthlyPaid.toLocaleString('id-ID')}</span>
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
            <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Bulan</label>
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20">
                            {Array.from({length: 12}, (_, i) => (
                                <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('id-ID', {month: 'long'})}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tahun</label>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20">
                            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Wilayah</label>
                        <select value={dukuhFilter} onChange={e => setDukuhFilter(e.target.value === 'semua' ? 'semua' : Number(e.target.value))} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20">
                            <option value="semua">Semua Wilayah</option>
                            {dukuhList.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    <div className="flex gap-1.5">
                        {(['semua', 'lunas', 'belum'] as const).map(f => (
                            <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${statusFilter === f ? 'bg-purple-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                {f === 'semua' ? 'Semua' : f === 'lunas' ? 'Lunas' : 'Belum'}
                            </button>
                        ))}
                    </div>
                    <button onClick={handlePrint} className="bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/10"><DownloadIcon /> Cetak Laporan</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-purple-50 border border-purple-100">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Warga Bulanan</p>
                    <p className="text-xl font-black text-purple-700 mt-1">{monthlyStatus.length} Warga</p>
                </div>
                <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sudah Lunas</p>
                    <p className="text-xl font-black text-emerald-700 mt-1">{paidCount} Warga</p>
                </div>
                <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Belum Bayar</p>
                    <p className="text-xl font-black text-amber-700 mt-1">{monthlyStatus.length - paidCount} Warga</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-100 border border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Terkumpul</p>
                    <p className="text-xl font-black text-slate-800 mt-1">Rp{totalMonthlyPaid.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 bg-purple-50/70 border-b border-purple-100">
                    <p className="font-bold text-purple-800 text-sm">Status Iuran Bulanan — {monthName} {year}</p>
                    <p className="text-xs text-purple-500 font-medium mt-0.5">{paidCount} dari {monthlyStatus.length} warga sudah lunas • Terkumpul Rp{totalMonthlyPaid.toLocaleString('id-ID')}</p>
                </div>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="p-4">No</th>
                            <th className="p-4 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('nama')}>Nama{sortArrow('nama')}</th>
                            <th className="p-4 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('dukuh')}>Dukuh{sortArrow('dukuh')}</th>
                            <th className="p-4 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('rt')}>RT{sortArrow('rt')}</th>
                            <th className="p-4 text-right cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('tarif')}>Tarif{sortArrow('tarif')}</th>
                            <th className="p-4 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('status')}>Status{sortArrow('status')}</th>
                            <th className="p-4 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('tanggal')}>Tgl Bayar{sortArrow('tanggal')}</th>
                            <th className="p-4 text-right cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('nominal')}>Nominal{sortArrow('nominal')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={8} className="p-6 text-center animate-pulse font-bold text-slate-300">Memproses Data...</td></tr>
                        ) : filteredMonthly.map((m, i) => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 font-bold text-slate-400">{i + 1}</td>
                                <td className="p-4 font-bold text-slate-700">{m.name}</td>
                                <td className="p-4 font-medium text-slate-500">{m.dukuhName}</td>
                                <td className="p-4 font-medium text-slate-500">{m.rtNumber}</td>
                                <td className="p-4 text-right font-medium text-slate-500">Rp{m.monthlyFee.toLocaleString('id-ID')}</td>
                                <td className="p-4">{m.paid ? <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">Lunas</span> : <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">Belum</span>}</td>
                                <td className="p-4 font-bold text-slate-400">{m.paidDate || '-'}</td>
                                <td className="p-4 text-right font-bold text-purple-600">{m.paid ? `Rp${m.paidAmount.toLocaleString('id-ID')}` : '-'}</td>
                            </tr>
                        ))}
                        {!loading && filteredMonthly.length === 0 && (
                            <tr><td colSpan={8} className="p-6 text-center text-slate-400 font-bold italic text-xs">Tidak ada warga tarif bulanan</td></tr>
                        )}
                    </tbody>
                    {!loading && filteredMonthly.length > 0 && (
                        <tfoot>
                            <tr className="bg-purple-50/70 border-t-2 border-purple-200 font-black">
                                <td className="p-4 text-slate-400">&mdash;</td>
                                <td className="p-4 text-slate-800">JUMLAH ({filteredMonthly.length} warga)</td>
                                <td className="p-4 text-slate-400">&mdash;</td>
                                <td className="p-4 text-slate-400">&mdash;</td>
                                <td className="p-4 text-right text-slate-800">Rp{totalTarifShown.toLocaleString('id-ID')}</td>
                                <td className="p-4 text-emerald-700">{paidShown} Lunas</td>
                                <td className="p-4 text-slate-400">&mdash;</td>
                                <td className="p-4 text-right text-purple-700">Rp{totalNominalShown.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

export default MonthlyIuranStatusReport;
