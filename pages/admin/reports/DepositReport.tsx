import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllWarga, getAllDukuh, getAllRT } from '@/services/api';
import type { Warga, Dukuh, RT } from '@/types';
import { BanknotesIcon, FileExcelIcon, SearchIcon } from '@/components/icons';

const DepositReport: React.FC = () => {
    const [list, setList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        dukuhId: 'all',
        rtId: 'all'
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [all, d, r] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
            // Hanya warga yang memiliki saldo deposit
            const withDeposit = all.filter(w => (w.deposit || 0) > 0).sort((a, b) => (b.deposit || 0) - (a.deposit || 0));
            setList(withDeposit);
            setDukuhList(d);
            setRtList(r);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredList = useMemo(() => {
        return list.filter(w => {
            const matchSearch = filters.search === '' ||
                w.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                String(w.id).includes(filters.search);
            const matchDukuh = filters.dukuhId === 'all' || String(w.dukuhId) === filters.dukuhId;
            const matchRt = filters.rtId === 'all' || String(w.rtId) === filters.rtId;
            return matchSearch && matchDukuh && matchRt;
        });
    }, [list, filters]);

    const totalDeposit = useMemo(() => filteredList.reduce((s, w) => s + (w.deposit || 0), 0), [filteredList]);

    const handlePrintTable = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const rows = filteredList.map((w, idx) => {
            const rtNum = rtList.find(r => r.id === w.rtId)?.number || 'N/A';
            const dukuhName = dukuhList.find(d => d.id === w.dukuhId)?.name || 'N/A';
            return `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td style="font-family:monospace">${w.id}</td>
                    <td style="font-weight:700">${w.name}</td>
                    <td>RT ${rtNum}, ${dukuhName}</td>
                    <td style="text-align:right; font-weight:800">Rp${(w.deposit || 0).toLocaleString('id-ID')}</td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4; margin: 1.5cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 25px; }
                    .header-left .logo { color: #10b981; font-size: 24pt; font-weight: 800; margin: 0; line-height: 1.1; }
                    .header-left .sub-1 { font-size: 9pt; font-weight: 700; color: #1e293b; margin: 5px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
                    .print-date { font-size: 8pt; color: #94a3b8; font-weight: 600; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 8.5pt; text-transform: uppercase; border: 1px solid #cbd5e1; color: #475569; }
                    td { padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 9pt; }
                    .total-row td { font-weight: 800; background: #f0f9ff; }
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
                        <div class="report-title">Laporan Deposit Warga</div>
                        <div class="print-date">TGL CETAK: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr><th style="text-align:center">No</th><th>ID</th><th>Nama Warga</th><th>Wilayah</th><th style="text-align:right">Deposit</th></tr>
                    </thead>
                    <tbody>
                        ${rows}
                        <tr class="total-row"><td colspan="4" style="text-align:right">TOTAL DEPOSIT</td><td style="text-align:right">Rp${totalDeposit.toLocaleString('id-ID')}</td></tr>
                    </tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <BanknotesIcon className="text-3xl text-sky-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Deposit Desa</p>
                            <p className="text-3xl font-black text-sky-600 tracking-tight">Rp{totalDeposit.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <button onClick={handlePrintTable} className="flex-1 lg:flex-none bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-sm transition-all text-[10px] uppercase tracking-widest">
                            <FileExcelIcon className="text-emerald-500 text-sm" /> Cetak Daftar (Tabel)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Cari nama / ID..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-xs" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
                    </div>
                    <select className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs" onChange={e => setFilters({ ...filters, dukuhId: e.target.value })} value={filters.dukuhId}>
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs" onChange={e => setFilters({ ...filters, rtId: e.target.value })} value={filters.rtId}>
                        <option value="all">Semua RT</option>
                        {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="p-5">Warga & Wilayah</th>
                                <th className="p-5 text-right">Nilai Deposit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={2} className="p-10 text-center animate-pulse">Memproses Data...</td></tr> :
                                filteredList.length > 0 ? filteredList.map(w => (
                                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5">
                                            <p className="font-bold text-slate-800 text-sm">{w.name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">ID: {w.id}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                RT {rtList.find(r => r.id === w.rtId)?.number || 'N/A'}, {dukuhList.find(d => d.id === w.dukuhId)?.name || 'N/A'}
                                            </p>
                                        </td>
                                        <td className="p-5 text-right font-black text-sky-600 text-base">Rp{(w.deposit || 0).toLocaleString('id-ID')}</td>
                                    </tr>
                                )) : <tr><td colSpan={2} className="p-12 text-center text-slate-400 font-bold italic text-xs uppercase">Belum ada warga dengan saldo deposit</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DepositReport;
