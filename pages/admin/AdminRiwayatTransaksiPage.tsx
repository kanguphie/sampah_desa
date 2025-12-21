
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getReports, deleteTransaksi, getAllDukuh, getAllRT } from '@/services/api';
import type { Transaksi, Dukuh, RT } from '@/types';
import { SearchIcon, ClipboardListIcon, TrashIcon, ChevronDownIcon, DownloadIcon } from '@/components/icons';
import Modal from '@/components/Modal';

interface ReportRow extends Transaksi {
    wargaName: string;
    petugasName: string;
    dukuhName: string;
    rtNumber: string;
}

const AdminRiwayatTransaksiPage: React.FC = () => {
    const [transactions, setTransactions] = useState<ReportRow[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [transactionToDelete, setTransactionToDelete] = useState<ReportRow | null>(null);
    
    // Filters & Sorting
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        search: '',
        dukuhId: 'all',
        rtId: 'all'
    });
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [data, d, r] = await Promise.all([
                getReports({ startDate: new Date(filters.startDate), endDate: new Date(filters.endDate) }),
                getAllDukuh(),
                getAllRT()
            ]);
            setTransactions(data);
            setDukuhList(d);
            setRtList(r);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
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
            const query = filters.search.toLowerCase();
            const matchSearch = tx.wargaName.toLowerCase().includes(query) || tx.id.toLowerCase().includes(query);
            const matchDukuh = filters.dukuhId === 'all' || tx.dukuhName === dukuhList.find(d => d.id === Number(filters.dukuhId))?.name;
            const matchRT = filters.rtId === 'all' || tx.rtNumber === rtList.find(r => r.id === Number(filters.rtId))?.number;
            return matchSearch && matchDukuh && matchRT;
        });

        items.sort((a, b) => {
            let aVal: any, bVal: any;
            switch(sortConfig.key) {
                case 'warga': aVal = a.wargaName; bVal = b.wargaName; break;
                case 'petugas': aVal = a.petugasName; bVal = b.petugasName; break;
                case 'amount': aVal = a.amount; bVal = b.amount; break;
                case 'wilayah': aVal = a.dukuhName + a.rtNumber; bVal = b.dukuhName + b.rtNumber; break;
                default: aVal = new Date(a.timestamp).getTime(); bVal = new Date(b.timestamp).getTime();
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return items;
    }, [transactions, filters, sortConfig, dukuhList, rtList]);

    const paginatedTx = useMemo(() => {
        if (itemsPerPage === 'all') return sortedAndFilteredTx;
        const start = (currentPage - 1) * (itemsPerPage as number);
        return sortedAndFilteredTx.slice(start, start + (itemsPerPage as number));
    }, [sortedAndFilteredTx, itemsPerPage, currentPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedAndFilteredTx.length / (itemsPerPage as number));

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const rows = sortedAndFilteredTx.map(tx => `
            <tr>
                <td>${new Date(tx.timestamp).toLocaleDateString('id-ID')}</td>
                <td>${tx.wargaName}</td>
                <td>RT ${tx.rtNumber}, ${tx.dukuhName}</td>
                <td>${tx.petugasName}</td>
                <td style="text-align:right">Rp${tx.amount.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head><style>body{font-family:'Plus Jakarta Sans',sans-serif;padding:50px;color:#1e293b;} .kop{text-align:center;border-bottom:3px double #10b981;margin-bottom:30px;padding-bottom:15px;} h1{color:#10b981;margin:0;font-size:24pt;} .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:10pt;font-weight:bold;color:#64748b;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #e2e8f0;padding:12px;text-align:left;font-size:10pt;} th{background:#f8fafc;color:#475569;text-transform:uppercase;font-size:9pt;letter-spacing:1px;}</style></head>
                <body>
                    <div class="kop"><h1>SAPADESA</h1><p>ROWOSARI • LIMPUNG • BATANG</p></div>
                    <div class="meta"><span>RIWAYAT TRANSAKSI</span><span>PERIODE: ${filters.startDate} s/d ${filters.endDate}</span></div>
                    <table><thead><tr><th>Tgl</th><th>Warga</th><th>Wilayah</th><th>Petugas</th><th style="text-align:right">Jumlah</th></tr></thead><tbody>${rows}</tbody></table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
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
                    <p className="mt-1 text-slate-500 text-sm font-medium">Monitoring arus kas harian retribusi warga.</p>
                </div>
                <button onClick={handlePrint} className="w-full md:w-auto bg-slate-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                    <DownloadIcon /> Cetak Laporan
                </button>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Dari</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full bg-transparent font-bold text-sm outline-none" />
                    </div>
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Sampai</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full bg-transparent font-bold text-sm outline-none" />
                    </div>
                    <select className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm bg-slate-50/50" onChange={e => setFilters({...filters, dukuhId: e.target.value})} value={filters.dukuhId}>
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-sm bg-slate-50/50" onChange={e => setFilters({...filters, rtId: e.target.value})} value={filters.rtId}>
                        <option value="all">Semua RT</option>
                        {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                    </select>
                    <div className="relative">
                        <input type="text" placeholder="Cari warga/petugas..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm font-medium bg-slate-50/50 outline-none" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total {sortedAndFilteredTx.length} Transaksi</div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left font-sans">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                                <th onClick={() => requestSort('timestamp')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center">Waktu <SortIcon column="timestamp" /></div></th>
                                <th onClick={() => requestSort('warga')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center">Warga <SortIcon column="warga" /></div></th>
                                <th onClick={() => requestSort('wilayah')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center">Wilayah <SortIcon column="wilayah" /></div></th>
                                <th onClick={() => requestSort('petugas')} className="p-4 cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center">Petugas <SortIcon column="petugas" /></div></th>
                                <th onClick={() => requestSort('amount')} className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-all"><div className="flex items-center justify-end">Jumlah <SortIcon column="amount" /></div></th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={6} className="p-10 text-center animate-pulse">Memuat data transaksi...</td></tr> : 
                            paginatedTx.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 text-xs font-medium text-slate-500">
                                        {new Date(tx.timestamp).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })}
                                        <div className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700 group-hover:text-primary transition-colors">{tx.wargaName}</td>
                                    <td className="p-4 text-xs text-slate-500 font-medium">RT {tx.rtNumber}, {tx.dukuhName}</td>
                                    <td className="p-4 text-slate-600 font-medium text-xs uppercase tracking-tight">{tx.petugasName}</td>
                                    <td className="p-4 text-right font-mono font-black text-emerald-600 text-base">Rp{tx.amount.toLocaleString('id-ID')}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => setTransactionToDelete(tx)} className="text-slate-300 hover:text-rose-500 p-2 rounded-lg transition-all" title="Hapus"><TrashIcon /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {itemsPerPage !== 'all' && totalPages > 1 && (
                    <div className="p-5 bg-slate-50/30 border-t border-slate-100 flex justify-center items-center">
                        <div className="flex items-center gap-1 font-bold text-sm">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 disabled:opacity-20 text-slate-400 hover:text-primary transition-colors"><i className="fa-solid fa-chevron-left"></i></button>
                            <span className="bg-primary text-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm">{currentPage}</span>
                            <span className="px-2 text-slate-400 font-medium">dari {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 disabled:opacity-20 text-slate-400 hover:text-primary transition-colors"><i className="fa-solid fa-chevron-right"></i></button>
                        </div>
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
                            <button onClick={async () => { await deleteTransaksi(transactionToDelete.id); fetchData(); setTransactionToDelete(null); }} className="flex-1 py-4 font-bold bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">Ya, Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminRiwayatTransaksiPage;
