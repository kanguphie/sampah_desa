
import React, { useState, useEffect, useMemo } from 'react';
import { getAllWarga, getAllDukuh, getAllRT, getReports, getDukuhById, getRTById } from '@/services/api';
import type { Warga, Dukuh, RT } from '@/types';
import { DownloadIcon, UsersIcon, CheckCircleIcon, XIcon, SearchIcon } from '@/components/icons';

const ParticipationReport: React.FC = () => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [dukuhId, setDukuhId] = useState('all');
    const [rtId, setRtId] = useState('all');
    const [search, setSearch] = useState('');

    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [monthlyTxs, setMonthlyTxs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0);
            const [w, d, r, txs] = await Promise.all([
                getAllWarga(),
                getAllDukuh(),
                getAllRT(),
                getReports({ startDate: start, endDate: end })
            ]);
            setWargaList(w);
            setDukuhList(d);
            setRtList(r);
            setMonthlyTxs(txs);
            setLoading(false);
        };
        fetch();
    }, [month, year]);

    // ID warga yang sudah bayar minimal 1x di bulan ini (Hanya kategori IURAN)
    const paidWargaIds = useMemo(() => {
        return new Set(monthlyTxs.filter(tx => tx.category === 'IURAN').map(tx => tx.wargaId));
    }, [monthlyTxs]);

    const stats = useMemo(() => {
        const filteredWarga = wargaList.filter(w => {
            const matchDukuh = dukuhId === 'all' || w.dukuhId === Number(dukuhId);
            const matchRT = rtId === 'all' || w.rtId === Number(rtId);
            return matchDukuh && matchRT;
        });

        const activeCount = filteredWarga.filter(w => paidWargaIds.has(w.id)).length;
        const inactiveCount = filteredWarga.length - activeCount;
        const rate = filteredWarga.length > 0 ? (activeCount / filteredWarga.length) * 100 : 0;

        return { total: filteredWarga.length, active: activeCount, inactive: inactiveCount, rate };
    }, [wargaList, paidWargaIds, dukuhId, rtId]);

    const inactiveList = useMemo(() => {
        return wargaList.filter(w => {
            const matchDukuh = dukuhId === 'all' || w.dukuhId === Number(dukuhId);
            const matchRT = rtId === 'all' || w.rtId === Number(rtId);
            const isInactive = !paidWargaIds.has(w.id);
            const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
            return matchDukuh && matchRT && isInactive && matchSearch;
        });
    }, [wargaList, paidWargaIds, dukuhId, rtId, search]);

    const handlePrintInactive = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const mName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' });
        const rows = inactiveList.map((w, idx) => `
            <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td style="font-family:monospace">${w.id}</td>
                <td style="font-weight:700">${w.name}</td>
                <td>RT ${getRTById(w.rtId)?.number}, ${getDukuhById(w.dukuhId)?.name}</td>
                <td style="text-align:center; color:#e11d48; font-weight:800">TIDAK AKTIF</td>
            </tr>
        `).join('');

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
                    .footer { margin-top: 50px; text-align: right; font-size: 9pt; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <h1 class="logo">SAPADESA</h1>
                        <p class="sub-1">PENGELOLAAN SAMPAH DESA ROWOSARI, BATANG</p>
                        <p class="sub-2">SEKRETARIAT: KANTOR DESA ROWOSARI, JAWA TENGAH 51271</p>
                    </div>
                    <div class="header-right">
                        <div class="report-title">Daftar Warga Belum Bayar</div>
                        <div class="print-date">PERIODE: ${mName} ${year}</div>
                        <div class="print-date">CETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <div style="margin-bottom:20px; font-size:10pt;">
                    <strong>Filter Wilayah:</strong> ${dukuhId === 'all' ? 'Seluruh Desa' : getDukuhById(Number(dukuhId))?.name}, 
                    ${rtId === 'all' ? 'Semua RT' : 'RT ' + getRTById(Number(rtId))?.number}
                </div>
                <table>
                    <thead><tr><th>No</th><th>ID</th><th>Nama Warga</th><th>Wilayah</th><th>Status Bulan Ini</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="5" style="text-align:center">Semua warga aktif membayar bulan ini.</td></tr>'}</tbody>
                </table>
                <div class="footer">
                    <p>Rowosari, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                    <p style="margin-top:60px; font-weight:800;">( ............................ )</p>
                    <p>Admin Desa</p>
                </div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bulan</label>
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                            {Array.from({length:12}).map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('id-ID', {month: 'long'})}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun</label>
                        <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                            {[now.getFullYear(), now.getFullYear()-1].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dukuh</label>
                        <select value={dukuhId} onChange={e => setDukuhId(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                            <option value="all">Semua Dukuh</option>
                            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RT</label>
                        <select value={rtId} onChange={e => setRtId(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                            <option value="all">Semua RT</option>
                            {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkat Partisipasi</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                        <span className="text-4xl font-black text-emerald-500">{stats.rate.toFixed(1)}%</span>
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><CheckCircleIcon /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warga Aktif</p>
                    <p className="text-4xl font-black text-slate-800 mt-2">{stats.active}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Sudah Bayar</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center group cursor-pointer hover:border-rose-300 transition-colors" onClick={handlePrintInactive}>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Belum Membayar</p>
                    <p className="text-4xl font-black text-rose-600 mt-2">{stats.inactive}</p>
                    <p className="text-[10px] font-bold text-rose-400 uppercase mt-1 flex items-center justify-center gap-1 group-hover:scale-110 transition-transform">
                        <DownloadIcon className="text-[8px]" /> Klik Cetak Daftar
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Daftar Warga Tidak Aktif (${inactiveList.length})</h3>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        <input type="text" placeholder="Cari nama..." className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500/20" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="p-5 w-16 text-center">No</th>
                                <th className="p-5">Warga</th>
                                <th className="p-5">Wilayah</th>
                                <th className="p-5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memuat...</td></tr> : 
                            inactiveList.length > 0 ? inactiveList.map((w, i) => (
                                <tr key={w.id} className="hover:bg-rose-50 transition-colors group">
                                    <td className="p-5 text-center text-slate-400 font-mono text-xs">{i+1}</td>
                                    <td className="p-5">
                                        <p className="font-bold text-slate-700">{w.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {w.id}</p>
                                    </td>
                                    <td className="p-5 text-xs text-slate-500">RT {getRTById(w.rtId)?.number}, {getDukuhById(w.dukuhId)?.name}</td>
                                    <td className="p-5 text-center">
                                        <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Tidak Membayar</span>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic text-xs">Semua warga di wilayah ini telah membayar iuran bulan ini.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ParticipationReport;
