
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllWarga, getAllDukuh, getAllRT, getTransactionsByWargaId, deleteTransaksi, recalculateDebt } from '@/services/api';
import type { Warga, Dukuh, RT, Transaksi } from '@/types';
import { DownloadIcon, ClipboardListIcon, FileExcelIcon, SearchIcon, TrashIcon, XIcon, InfoIcon, ScaleBalancedIcon } from '@/components/icons';
import Modal from '@/components/Modal';

const UnpaidReport: React.FC = () => {
    const navigate = useNavigate();
    const [list, setList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // Modal states
    const [detailWarga, setDetailWarga] = useState<Warga | null>(null);
    const [wargaTransactions, setWargaTransactions] = useState<Transaksi[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    
    const [filters, setFilters] = useState({
        search: '',
        dukuhId: 'all',
        rtId: 'all'
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [all, d, r] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
            // Filter hanya yang memiliki tunggakan
            const withDebt = all.filter(w => (w.totalDebt || 0) > 0).sort((a,b) => (b.totalDebt || 0) - (a.totalDebt || 0));
            setList(withDebt);
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

    const handleSync = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log("[Sync] Button clicked");
        if (!window.confirm("Kalkulasi ulang saldo tunggakan seluruh warga berdasarkan riwayat transaksi?")) {
            console.log("[Sync] Cancelled by user");
            return;
        }
        
        setSyncing(true);
        try {
            console.log("[Sync] Sending request to server...");
            const res = await recalculateDebt();
            console.log("[Sync] Server responded:", res);
            
            console.log("[Sync] Fetching fresh data...");
            await fetchData();
            
            // Also update detailWarga if it's open
            if (detailWarga) {
                const refreshedWargas = await getAllWarga();
                const updated = refreshedWargas.find(w => w.id === detailWarga.id);
                if (updated) {
                    if (updated.totalDebt <= 0) setDetailWarga(null);
                    else setDetailWarga(updated);
                }
            }
            
            console.log("[Sync] Data fetched successfully");
            
            alert("Sinkronisasi berhasil! Saldo warga telah dikoreksi berdasarkan riwayat transaksi.");
        } catch (error: any) {
            console.error("[Sync] Error during sync:", error);
            alert("Gagal melakukan sinkronisasi: " + (error.message || "Kesalahan server"));
        } finally {
            setSyncing(false);
            console.log("[Sync] Process finished");
        }
    };

    const openDetail = async (warga: Warga) => {
        setDetailWarga(warga);
        setLoadingTransactions(true);
        try {
            const txs = await getTransactionsByWargaId(warga.id);
            // Hanya ambil yang unpaid
            const unpaidTxs = txs.filter((t: Transaksi) => t.status.toLowerCase() === 'unpaid' || t.status === 'HUTANG');
            setWargaTransactions(unpaidTxs);
        } catch (error) {
            console.error("Error fetching transactions", error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    const handleDeleteTx = async (txId: string) => {
        if (!window.confirm("Hapus catatan tunggakan ini? Tindakan ini akan mengoreksi saldo saldo warga.")) return;
        
        try {
            await deleteTransaksi(txId);
            // Refresh main list first to update totalDebt in UI
            await fetchData();
            
            // Refresh detail
            if (detailWarga) {
                const txs = await getTransactionsByWargaId(detailWarga.id);
                const unpaidTxs = txs.filter((t: Transaksi) => t.status.toLowerCase() === 'unpaid' || t.status === 'HUTANG');
                setWargaTransactions(unpaidTxs);
                
                // Update current detailWarga info from the freshly fetched list
                const updatedWarga = (await getAllWarga()).find(w => w.id === detailWarga.id);
                if (updatedWarga) {
                    if (updatedWarga.totalDebt <= 0) {
                        setDetailWarga(null);
                    } else {
                        setDetailWarga(updatedWarga);
                    }
                }
            }
        } catch (error) {
            alert("Gagal menghapus transaksi.");
        }
    };

    const filteredList = useMemo(() => {
        return list.filter(w => {
            const matchSearch = w.name.toLowerCase().includes(filters.search.toLowerCase()) || w.id.includes(filters.search);
            const matchDukuh = filters.dukuhId === 'all' || w.dukuhId === Number(filters.dukuhId);
            const matchRT = filters.rtId === 'all' || w.rtId === Number(filters.rtId);
            return matchSearch && matchDukuh && matchRT;
        });
    }, [list, filters]);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredList.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredList.map(w => w.id)));
        }
    };

    const handlePrintTable = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const totalTunggakan = filteredList.reduce((s, i) => s + (i.totalDebt || 0), 0);
        const rows = filteredList.map((w, idx) => {
            // FIX: Use rtList state lookup instead of async getRTById to avoid Promise property errors
            const rtNum = rtList.find(r => r.id === w.rtId)?.number || 'N/A';
            // FIX: Use dukuhList state lookup instead of async getDukuhById to avoid Promise property errors
            const dukuhName = dukuhList.find(d => d.id === w.dukuhId)?.name || 'N/A';
            return `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td style="font-family:monospace">${w.id}</td>
                    <td style="font-weight:700">${w.name}</td>
                    <td>RT ${rtNum}, ${dukuhName}</td>
                    <td style="text-align:right; font-weight:800">Rp${w.totalDebt.toLocaleString('id-ID')}</td>
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
                    .footer { margin-top: 40px; display: flex; justify-content: flex-end; }
                    .sign-box { text-align: center; width: 200px; }
                    .sign-date { font-size: 9pt; margin-bottom: 60px; }
                    .sign-name { font-weight: 800; text-decoration: underline; text-transform: uppercase; }
                    .summary-row { background: #f1f5f9; font-weight: 800; }
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
                        <div class="report-title">Daftar Tunggakan Iuran</div>
                        <div class="print-date">WAKTU CETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <table>
                    <thead><tr><th>No</th><th>ID Warga</th><th>Nama Lengkap Warga</th><th>Wilayah (RT/Dukuh)</th><th style="text-align:right">Total Tunggakan</th></tr></thead>
                    <tbody>
                        ${rows || '<tr><td colspan="5" style="text-align:center">Tidak ada data sesuai filter</td></tr>'}
                        <tr class="summary-row">
                            <td colspan="4" style="text-align:right">TOTAL SELURUH TUNGGAKAN DESA:</td>
                            <td style="text-align:right">Rp${totalTunggakan.toLocaleString('id-ID')}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="footer">
                    <div class="sign-box">
                        <div class="sign-date">Batang, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</div>
                        <div style="font-size:9pt; margin-bottom: 60px;">Admin Keuangan Desa</div>
                        <div class="sign-name">( ............................ )</div>
                    </div>
                </div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const generateSlipHtml = (w: Warga) => {
        // FIX: Use rtList state lookup instead of async getRTById to avoid Promise property errors
        const rtNum = rtList.find(r => r.id === w.rtId)?.number || 'N/A';
        // FIX: Use dukuhList state lookup instead of async getDukuhById to avoid Promise property errors
        const dukuhName = dukuhList.find(d => d.id === w.dukuhId)?.name || 'N/A';
        return `
            <div class="slip-wrapper">
                <div class="header">
                    <div class="header-left">
                        <h1 class="logo">SAPADESA</h1>
                        <p class="sub-1">PENGELOLAAN SAMPAH DESA ROWOSARI, BATANG</p>
                        <p class="sub-2">SEKRETARIAT: KANTOR DESA ROWOSARI, JAWA TENGAH 51271</p>
                    </div>
                    <div class="header-right">
                        <div class="slip-title">SLIP TUNGGAKAN IURAN</div>
                        <div class="print-date">TGL CETAK: ${new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                </div>
                <div class="content-grid">
                    <div class="info-section">
                        <div class="info-row"><span class="label">ID WARGA:</span><span class="value">${w.id}</span></div>
                        <div class="info-row"><span class="label">NAMA LENGKAP:</span><span class="value">${w.name}</span></div>
                        <div class="info-row"><span class="label">WILAYAH:</span><span class="value">RT ${rtNum}, ${dukuhName}</span></div>
                        <div class="info-row" style="margin-top:10px;"><span class="label">STATUS:</span><span class="value" style="color:#e11d48;">BELUM TERBAYAR</span></div>
                    </div>
                    <div class="debt-section">
                        <div class="debt-label">TOTAL TUNGGAKAN</div>
                        <div class="debt-amount">Rp${w.totalDebt.toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <div class="footer">
                    <p class="footer-msg">PENTING: Harap segera melakukan pelunasan tunggakan iuran kebersihan melalui petugas penagih atau kantor desa Rowosari. Abaikan jika Anda telah melunasi.</p>
                    <div class="sign-box">
                        <div class="sign"><p>Warga</p><div class="sign-line">${w.name}</div></div>
                        <div class="sign"><p>Petugas</p><div class="sign-line">( .................... )</div></div>
                    </div>
                </div>
            </div>
        `;
    };

    const handlePrintSlips = (targetWargas: Warga[]) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const allSlips = targetWargas.map(w => generateSlipHtml(w)).join('');
        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4 portrait; margin: 0; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; background: white; }
                    .slip-wrapper { height: 98mm; box-sizing: border-box; padding: 10mm; border-bottom: 1px dashed #cbd5e1; page-break-inside: avoid; position: relative; overflow: hidden; }
                    .slip-wrapper:nth-child(3n) { border-bottom: 1px dashed #94a3b8; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
                    .header-left .logo { color: #10b981; font-size: 16pt; font-weight: 800; margin: 0; line-height: 1; }
                    .header-left .sub-1 { font-size: 7.5pt; font-weight: 700; color: #1e293b; margin: 4px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 6pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .slip-title { font-size: 11pt; font-weight: 800; text-transform: uppercase; color: #1e293b; }
                    .print-date { font-size: 7pt; color: #94a3b8; font-weight: 600; margin-top: 3px; }
                    .content-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 15px; margin-top: 8px; }
                    .info-section { border-right: 1px dashed #e2e8f0; padding-right: 15px; }
                    .info-row { display: flex; margin-bottom: 5px; font-size: 8.5pt; }
                    .label { color: #64748b; font-weight: 700; width: 90px; text-transform: uppercase; font-size: 6.5pt; }
                    .value { font-weight: 800; color: #1e293b; flex: 1; }
                    .debt-section { background: #fff1f2; padding: 10px; border-radius: 10px; text-align: center; border: 1px solid #fecdd3; display: flex; flex-direction: column; justify-content: center; }
                    .debt-label { font-size: 7.5pt; font-weight: 800; color: #e11d48; text-transform: uppercase; margin-bottom: 2px; }
                    .debt-amount { font-size: 22pt; font-weight: 900; color: #e11d48; letter-spacing: -1px; }
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; }
                    .footer-msg { font-size: 6.5pt; color: #64748b; width: 65%; font-style: italic; margin: 0; line-height: 1.3; }
                    .sign-box { display: flex; gap: 30px; font-size: 7.5pt; }
                    .sign { width: 90px; text-align: center; }
                    .sign-line { margin-top: 25px; border-top: 1.5px solid #000; padding-top: 2px; font-weight: 800; text-transform: uppercase; font-size: 7pt; }
                    @media print { .slip-wrapper:nth-child(3n) { page-break-after: always; } }
                </style>
            </head>
            <body>
                ${allSlips}
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintSelected = () => {
        const selectedWargas = list.filter(w => selectedIds.has(w.id));
        if (selectedWargas.length > 0) {
            handlePrintSlips(selectedWargas);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                            <ClipboardListIcon className="text-3xl text-rose-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tunggakan Desa</p>
                            <p className="text-3xl font-black text-rose-600 tracking-tight">Rp{filteredList.reduce((s,i)=>s+(i.totalDebt || 0),0).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <button 
                            onClick={handleSync} 
                            disabled={syncing}
                            className="flex-1 lg:flex-none px-5 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-[10px] uppercase tracking-widest border border-emerald-100 disabled:opacity-50"
                        >
                            <ScaleBalancedIcon className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sinkronisasi...' : 'Sinkron Saldo'}
                        </button>
                        <button onClick={handlePrintTable} className="flex-1 lg:flex-none bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-sm transition-all text-[10px] uppercase tracking-widest">
                            <FileExcelIcon className="text-emerald-500 text-sm" /> Cetak Daftar (Tabel)
                        </button>
                        {selectedIds.size > 0 && (
                            <button onClick={handlePrintSelected} className="flex-1 lg:flex-none bg-primary text-white hover:bg-primary-focus px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all text-[10px] uppercase tracking-widest">
                                <DownloadIcon /> Slip ({selectedIds.size})
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Cari nama..." className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-semibold text-xs" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
                    </div>
                    <select className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs" onChange={e => setFilters({...filters, dukuhId: e.target.value})} value={filters.dukuhId}>
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-xs" onChange={e => setFilters({...filters, rtId: e.target.value})} value={filters.rtId}>
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
                                <th className="p-5 w-12 text-center">
                                    <input type="checkbox" checked={filteredList.length > 0 && selectedIds.size === filteredList.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" />
                                </th>
                                <th className="p-5">Warga & Wilayah</th>
                                <th className="p-5 text-right">Nilai Tunggakan</th>
                                <th className="p-5 text-center">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memproses Data...</td></tr> : 
                            filteredList.length > 0 ? filteredList.map(w => (
                                <tr key={w.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(w.id) ? 'bg-emerald-50/30' : ''}`}>
                                    <td className="p-5 text-center"><input type="checkbox" checked={selectedIds.has(w.id)} onChange={() => toggleSelect(w.id)} className="w-4 h-4 rounded border-slate-300 text-primary cursor-pointer" /></td>
                                    <td className="p-5" onClick={() => toggleSelect(w.id)}>
                                        <p className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors cursor-pointer">{w.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            {/* FIX: Use rtList and dukuhList state lookup instead of async API calls */}
                                            RT {rtList.find(r => r.id === w.rtId)?.number || 'N/A'}, {dukuhList.find(d => d.id === w.dukuhId)?.name || 'N/A'}
                                        </p>
                                    </td>
                                    <td className="p-5 text-right font-black text-rose-600 text-base">Rp{w.totalDebt.toLocaleString('id-ID')}</td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); openDetail(w); }} className="bg-indigo-500 text-white hover:bg-indigo-600 px-3 py-2 rounded-lg text-[10px] font-bold transition-all shadow-md flex items-center gap-1">
                                                <InfoIcon className="text-xs" /> Kelola
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handlePrintSlips([w]); }} className="bg-slate-900 text-white hover:bg-black px-3 py-2 rounded-lg text-[10px] font-bold transition-all shadow-md">Slip DL</button>
                                        </div>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic text-xs uppercase">Tidak ada data sesuai filter</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL */}
            <Modal isOpen={!!detailWarga} onClose={() => setDetailWarga(null)} title="Detail Tunggakan" size="lg">
                {detailWarga && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{detailWarga.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {detailWarga.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Saldo Arrears</p>
                                <p className="text-2xl font-black text-rose-600">Rp{detailWarga.totalDebt.toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daftar Transaksi Belum Terbayar</h4>
                            {loadingTransactions ? (
                                <div className="p-10 text-center animate-pulse text-slate-400 font-bold text-xs">Mengambil rincian...</div>
                            ) : wargaTransactions.length > 0 ? (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {wargaTransactions.map(tx => (
                                        <div key={tx.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center group hover:border-indigo-200 transition-all">
                                            <div>
                                                <p className="font-black text-slate-700 text-sm">{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal Tidak Diketahui'}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">Jam: {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-rose-600">Rp{(tx.amount || 0).toLocaleString('id-ID')}</p>
                                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Hutang</p>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteTx(tx.id)} 
                                                    className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Hapus tunggakan ini"
                                                >
                                                    <TrashIcon className="text-lg" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
                                    <p className="text-slate-400 font-bold text-xs uppercase italic">Tidak ditemukan riwayat tunggakan aktif.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-amber-500">
                                <InfoIcon />
                            </div>
                            <div>
                                <p className="text-[11px] text-amber-700 font-bold uppercase tracking-tight mb-1">Informasi Sinkronisasi</p>
                                <p className="text-[11px] text-amber-600/80 leading-relaxed font-medium">
                                    Jika Anda menghapus riwayat di atas namun jumlah saldo masih tidak sesuai, silakan gunakan fitur <span className="font-black text-emerald-600 underline cursor-pointer" onClick={() => navigate('/admin/pengaturan')}>Sinkronisasi</span> di menu Pengaturan atau klik tombol <span className="font-black text-emerald-600 underline cursor-pointer" onClick={handleSync}>Sinkron Saldo</span> di bagian atas laporan ini.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UnpaidReport;
