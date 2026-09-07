
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getReports, deleteTransaksi, getAllDukuh, getAllRT } from '@/services/api';
import type { Transaksi, Dukuh, RT } from '@/types';
import { SearchIcon, TrashIcon, ChevronDownIcon, DownloadIcon, BanknotesIcon, CurrencyDollarIcon, CheckCircleIcon, AlertCircleIcon } from '@/components/icons';
import Modal from '@/components/Modal';

interface ReportRow extends Transaksi {
    wargaName: string;
    petugasName: string;
    dukuhName: string;
    rtNumber: string;
    wargaDukuhId?: number;
    wargaRtId?: number;
}

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
        } else {
            dateObj = new Date(d);
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

const displayLocalDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp === 'string') {
        const parts = timestamp.split(' ');
        if (parts.length >= 1) {
            const dateParts = parts[0].split('-');
            if (dateParts.length === 3) {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const monthIdx = parseInt(dateParts[1]) - 1;
                const month = monthNames[monthIdx] || dateParts[1];
                const day = dateParts[2];
                return `${day} ${month}`;
            }
        }
    }
    try {
        return new Date(timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch {
        return 'N/A';
    }
};

const displayLocalTime = (timestamp: any) => {
    if (!timestamp) return '--:--';
    if (typeof timestamp === 'string') {
        const parts = timestamp.split(' ');
        if (parts.length >= 2) {
            const timeParts = parts[1].split(':');
            if (timeParts.length >= 2) {
                return `${timeParts[0]}.${timeParts[1]}`;
            }
        }
    }
    try {
        return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '--:--';
    }
};

const AdminRiwayatTransaksiPage: React.FC = () => {
    const [transactions, setTransactions] = useState<ReportRow[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<ReportRow | null>(null);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);
    
    const [filters, setFilters] = useState({
        startDate: toLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        endDate: toLocalDateString(new Date()),
        search: '',
        dukuhId: 'all',
        rtId: 'all',
        category: 'all'
    });

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);

    const getWilayahText = useCallback((tx: ReportRow) => {
        const rtId = tx.wargaRtId;
        const dukuhId = tx.wargaDukuhId;
        
        const rtObj = rtList.find(r => r.id === Number(rtId));
        const rtText = rtObj ? `RT ${rtObj.number}` : (tx.rtNumber ? `RT ${tx.rtNumber}` : 'RT ?');
        
        const dObj = dukuhList.find(d => d.id === Number(dukuhId));
        const dukuhText = dObj ? dObj.name : (tx.dukuhName || 'N/A');
        
        return `${rtText}, ${dukuhText}`;
    }, [rtList, dukuhList]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [data, d, r] = await Promise.all([
                getReports({ startDate: filters.startDate, endDate: filters.endDate }),
                getAllDukuh(),
                getAllRT()
            ]);
            setTransactions(data);
            setDukuhList(d);
            setRtList(r);
        } catch (error: any) {
            console.error("Gagal mengambil transaksi:", error.message || error);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredTx = useMemo(() => {
        let items = transactions.filter(tx => {
            const query = (filters.search || '').toLowerCase();
            const matchSearch = 
                (tx.wargaName || '').toLowerCase().includes(query) || 
                (tx.id || '').toLowerCase().includes(query) || 
                (tx.wargaId || '').toLowerCase().includes(query);
            
            // Filter menggunakan flattened data dari API (wargaDukuhId & wargaRtId)
            const matchDukuh = filters.dukuhId === 'all' || String(tx.wargaDukuhId) === String(filters.dukuhId);
            const matchRT = filters.rtId === 'all' || String(tx.wargaRtId) === String(filters.rtId);
            const matchCategory = filters.category === 'all' || tx.category === filters.category;
            
            // Client-side local date matching for timezone compatibility
            let matchDate = true;
            if (tx.timestamp) {
                const txDateStr = toLocalDateString(tx.timestamp);
                matchDate = txDateStr >= filters.startDate && txDateStr <= filters.endDate;
            }
            
            return matchSearch && matchDukuh && matchRT && matchCategory && matchDate;
        });

        items.sort((a, b) => {
            let aVal: any, bVal: any;
            switch(sortConfig.key) {
                case 'warga': aVal = (a.wargaName || ''); bVal = (b.wargaName || ''); break;
                case 'petugas': aVal = (a.petugasName || ''); bVal = (b.petugasName || ''); break;
                case 'amount': aVal = (a.amount || 0); bVal = (b.amount || 0); break;
                case 'category': aVal = (a.category || ''); bVal = (b.category || ''); break;
                case 'wilayah': aVal = getWilayahText(a); bVal = getWilayahText(b); break;
                default: aVal = a.timestamp ? (typeof a.timestamp === 'string' ? a.timestamp : new Date(a.timestamp).toISOString()) : ''; bVal = b.timestamp ? (typeof b.timestamp === 'string' ? b.timestamp : new Date(b.timestamp).toISOString()) : '';
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return items;
    }, [transactions, filters, sortConfig, getWilayahText]);

    const paginatedTx = useMemo(() => {
        if (itemsPerPage === 'all') return sortedAndFilteredTx;
        const start = (currentPage - 1) * (itemsPerPage as number);
        return sortedAndFilteredTx.slice(start, start + (itemsPerPage as number));
    }, [sortedAndFilteredTx, itemsPerPage, currentPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(sortedAndFilteredTx.length / (itemsPerPage as number)));

    // Ensure current page is within valid range
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const getPaginationRange = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | string)[] = [];
        if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
        return pages;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const formatDateForPrint = (ts: any) => {
            if (!ts) return 'N/A';
            if (typeof ts === 'string') {
                const parts = ts.split(' ');
                if (parts.length >= 1) {
                    const dateParts = parts[0].split('-');
                    if (dateParts.length === 3) {
                        return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                    }
                }
            }
            try {
                return new Date(ts).toLocaleDateString('id-ID');
            } catch {
                return 'N/A';
            }
        };

        const rows = sortedAndFilteredTx.map(tx => `
            <tr>
                <td>${formatDateForPrint(tx.timestamp)}</td>
                <td><div style="font-weight:700;">${tx.wargaName || 'Warga Terhapus'}</div><div style="font-size:7pt; color:#64748b;">ID: ${tx.wargaId || 'N/A'}</div></td>
                <td>${getWilayahText(tx)}</td>
                <td><span style="font-size:8pt; font-weight:800; color:${tx.category === 'TUNGGAKAN' ? '#6366f1' : '#10b981'}">${tx.category || 'IURAN'}</span></td>
                <td>${tx.petugasName || 'N/A'}</td>
                <td style="text-align:right; font-weight:700;">Rp${(tx.amount || 0).toLocaleString('id-ID')}</td>
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
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 12pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
                    .print-date { font-size: 8pt; color: #94a3b8; font-weight: 600; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 8.5pt; text-transform: uppercase; border-bottom: 1.5px solid #e2e8f0; color: #475569; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; }
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
                        <div class="report-title">Laporan Riwayat Transaksi</div>
                        <div class="print-date">PERIODE: ${filters.startDate} - ${filters.endDate}</div>
                        <div class="print-date">WAKTU CETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <table>
                    <thead><tr><th>Tanggal</th><th>Warga</th><th>Wilayah</th><th>Kategori</th><th>Petugas</th><th style="text-align:right">Jumlah</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="6" style="text-align:center; padding: 20px;">Tidak ditemukan data transaksi sesuai filter</td></tr>'}</tbody>
                </table>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return <ChevronDownIcon className="ml-1 opacity-20" />;
        return sortConfig.direction === 'asc' 
            ? <i className="fa-solid fa-sort-up ml-1 text-primary"></i> 
            : <i className="fa-solid fa-sort-down ml-1 text-primary"></i>;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight font-display">Riwayat Transaksi</h1>
                    <p className="mt-1 text-slate-500 text-sm font-medium">Monitoring seluruh aliran dana retribusi warga.</p>
                </div>
                <button onClick={handlePrint} className="w-full md:w-auto bg-slate-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                    <DownloadIcon /> Cetak Laporan
                </button>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Dari</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value, currentPage: 1} as any)} className="w-full bg-transparent font-bold text-xs outline-none" />
                    </div>
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Sampai</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value, currentPage: 1} as any)} className="w-full bg-transparent font-bold text-xs outline-none" />
                    </div>
                    <select 
                        className="px-3 py-2 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50/50 outline-none focus:ring-2 focus:ring-primary/20" 
                        onChange={e => setFilters({...filters, category: e.target.value, currentPage: 1} as any)} 
                        value={filters.category}
                    >
                        <option value="all">Semua Jenis</option>
                        <option value="IURAN">Iuran Harian</option>
                        <option value="TUNGGAKAN">Bayar Tunggakan</option>
                    </select>
                    <select 
                        className="px-3 py-2 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50/50 outline-none focus:ring-2 focus:ring-primary/20" 
                        onChange={e => setFilters({...filters, dukuhId: e.target.value, currentPage: 1} as any)} 
                        value={filters.dukuhId}
                    >
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                    </select>
                    <select 
                        className="px-3 py-2 border border-slate-200 rounded-xl font-bold text-xs bg-slate-50/50 outline-none focus:ring-2 focus:ring-primary/20" 
                        onChange={e => setFilters({...filters, rtId: e.target.value, currentPage: 1} as any)} 
                        value={filters.rtId}
                    >
                        <option value="all">Semua RT</option>
                        {rtList.map(rt => <option key={rt.id} value={String(rt.id)}>RT {rt.number}</option>)}
                    </select>
                    <div className="relative">
                        <input type="text" placeholder="Cari warga/petugas..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value, currentPage: 1} as any)} className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50/50 outline-none focus:ring-2 focus:ring-primary/20" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tampilkan</span>
                        <select value={itemsPerPage} onChange={e => { setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20">
                            <option value={10}>10 Baris</option>
                            <option value={25}>25 Baris</option>
                            <option value={50}>50 Baris</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total {sortedAndFilteredTx.length} Transaksi Terdeteksi</div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left font-sans">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                <th onClick={() => requestSort('timestamp')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all w-32"><div className="flex items-center">Waktu <SortIcon column="timestamp" /></div></th>
                                <th onClick={() => requestSort('warga')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center">Warga <SortIcon column="warga" /></div></th>
                                <th onClick={() => requestSort('category')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all text-center"><div className="flex items-center justify-center">Kategori <SortIcon column="category" /></div></th>
                                <th onClick={() => requestSort('wilayah')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center">Wilayah <SortIcon column="wilayah" /></div></th>
                                <th onClick={() => requestSort('petugas')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center">Petugas <SortIcon column="petugas" /></div></th>
                                <th onClick={() => requestSort('amount')} className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center justify-end">Jumlah <SortIcon column="amount" /></div></th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={7} className="p-10 text-center animate-pulse">Sinkronisasi Database...</td></tr> : 
                            paginatedTx.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 text-xs font-medium text-slate-500">
                                        <div className="font-bold text-slate-700">{displayLocalDate(tx.timestamp)}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{displayLocalTime(tx.timestamp)}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700 group-hover:text-primary transition-colors">{(tx.wargaName || 'Warga Terhapus')}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">ID: {(tx.wargaId || 'N/A')}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {tx.category === 'TUNGGAKAN' ? (
                                            <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-indigo-100">
                                                <BanknotesIcon className="text-[10px]" /> Tunggakan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-emerald-100">
                                                <CurrencyDollarIcon className="text-[10px]" /> Iuran
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs text-slate-500 font-medium">{getWilayahText(tx)}</td>
                                    <td className="p-4 text-slate-600 font-medium text-[10px] uppercase tracking-wider">{(tx.petugasName || 'N/A')}</td>
                                    <td className="p-4 text-right font-mono font-black text-emerald-600 text-base">Rp{(tx.amount || 0).toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => setTransactionToDelete(tx)} className="text-slate-300 hover:text-rose-500 p-2 rounded-lg transition-all" title="Hapus"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && sortedAndFilteredTx.length === 0 && (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-400 font-bold italic text-xs uppercase">Tidak ada data transaksi yang ditemukan sesuai filter</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                {sortedAndFilteredTx.length > 0 && (
                    <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Left: Info data */}
                        <div className="text-xs font-semibold text-slate-500 text-center md:text-left">
                            Menampilkan <span className="font-bold text-slate-800">
                                {itemsPerPage === 'all' ? 1 : Math.min((currentPage - 1) * (itemsPerPage as number) + 1, sortedAndFilteredTx.length)}
                            </span> - <span className="font-bold text-slate-800">
                                {itemsPerPage === 'all' ? sortedAndFilteredTx.length : Math.min(currentPage * (itemsPerPage as number), sortedAndFilteredTx.length)}
                            </span> dari <span className="font-bold text-slate-800">{sortedAndFilteredTx.length}</span> transaksi
                            {itemsPerPage !== 'all' && totalPages > 1 && (
                                <span className="ml-2 text-slate-400">
                                    (Halaman <strong className="text-slate-700">{currentPage}</strong> dari <strong className="text-slate-700">{totalPages}</strong>)
                                </span>
                            )}
                        </div>

                        {/* Right: Pagination Controls */}
                        {itemsPerPage !== 'all' && totalPages > 1 && (
                            <div className="flex items-center flex-wrap justify-center gap-1.5">
                                {/* First Page */}
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    title="Halaman Pertama"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <i className="fa-solid fa-angles-left"></i>
                                </button>

                                {/* Prev Page */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    title="Halaman Sebelumnya"
                                    className="px-2.5 h-8 rounded-xl flex items-center justify-center gap-1 font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                                    <span className="hidden sm:inline">Prev</span>
                                </button>

                                {/* Numbered Pages */}
                                {getPaginationRange().map((page, idx) => {
                                    if (page === '...') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-400 select-none">
                                                ...
                                            </span>
                                        );
                                    }
                                    const isCurrent = page === currentPage;
                                    return (
                                        <button
                                            key={`page-${page}`}
                                            onClick={() => setCurrentPage(Number(page))}
                                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                                isCurrent 
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105' 
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                {/* Next Page */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    title="Halaman Selanjutnya"
                                    className="px-2.5 h-8 rounded-xl flex items-center justify-center gap-1 font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                                </button>

                                {/* Last Page */}
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    title="Halaman Terakhir"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <i className="fa-solid fa-angles-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={!!transactionToDelete} onClose={() => setTransactionToDelete(null)} title="Hapus Transaksi">
                {transactionToDelete && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                          <TrashIcon className="text-3xl" />
                        </div>
                        <p className="font-bold text-slate-800 text-lg">Hapus riwayat transaksi ini?</p>
                        <p className="text-xs text-slate-400 mt-2 px-6">Tindakan ini akan mempengaruhi laporan saldo keuangan desa secara permanen.</p>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setTransactionToDelete(null)} className="flex-1 py-4 font-bold text-slate-500 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">Batal</button>
                            <button onClick={async () => { 
                                try {
                                    await deleteTransaksi(transactionToDelete.id); 
                                    setMessage({ type: 'success', text: 'Berhasil menghapus transaksi' });
                                    fetchData(); 
                                    setTransactionToDelete(null); 
                                } catch (error: any) {
                                    setMessage({ type: 'error', text: 'Gagal menghapus: ' + (error.message || 'Error server') });
                                }
                            }} className="flex-1 py-4 font-bold bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">Ya, Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Notification Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all animate-slide-in-right ${
                    message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {message.type === 'success' ? <CheckCircleIcon className="text-xl" /> : <AlertCircleIcon className="text-xl" />}
                    <p className="font-bold text-sm tracking-tight">{message.text}</p>
                </div>
            )}
        </div>
    );
};

export default AdminRiwayatTransaksiPage;
