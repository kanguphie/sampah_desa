
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getReports, deleteTransaksi } from '@/services/api';
import type { Transaksi } from '@/types';
import { SearchIcon, ClipboardListIcon, TrashIcon } from '@/components/icons';
import Modal from '@/components/Modal';

interface ReportRow extends Transaksi {
    wargaName: string;
    petugasName: string;
    dukuhName: string;
    rtNumber: string;
}

const AdminRiwayatTransaksiPage: React.FC = () => {
    const [transactions, setTransactions] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [transactionToDelete, setTransactionToDelete] = useState<ReportRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Filters
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getReports({
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            });
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [startDate, endDate, searchQuery, itemsPerPage]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const query = searchQuery.toLowerCase();
            return (
                tx.wargaName.toLowerCase().includes(query) ||
                tx.petugasName.toLowerCase().includes(query) ||
                tx.id.toLowerCase().includes(query) ||
                tx.dukuhName.toLowerCase().includes(query)
            );
        });
    }, [transactions, searchQuery]);

    // Pagination Logic
    const paginatedTransactions = useMemo(() => {
        if (itemsPerPage === 'all') return filteredTransactions;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredTransactions.length / itemsPerPage);

    const totalAmount = useMemo(() => filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0), [filteredTransactions]);

    const handleDeleteConfirm = async () => {
        if (!transactionToDelete) return;
        setIsDeleting(true);
        try {
            await deleteTransaksi(transactionToDelete.id);
            await fetchData(); // Refresh data
            setTransactionToDelete(null);
        } catch (error) {
            console.error("Gagal menghapus transaksi", error);
            alert("Gagal menghapus transaksi. Silakan coba lagi.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const dateRange = `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`;
            
            const tableRows = filteredTransactions.map(tx => `
                <tr>
                    <td>${new Date(tx.timestamp).toLocaleDateString('id-ID')} <br/> <span style="font-size: 0.8em; color: #666;">${new Date(tx.timestamp).toLocaleTimeString('id-ID')}</span></td>
                    <td>${tx.wargaName}<br/><span style="font-size: 0.8em; color: #666;">RT ${tx.rtNumber}, ${tx.dukuhName}</span></td>
                    <td>${tx.petugasName}</td>
                    <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount)}</td>
                </tr>
            `).join('');

            const content = `
                <html>
                    <head>
                        <title>Riwayat Transaksi</title>
                        <style>
                            body { font-family: 'Inter', sans-serif; color: #333; -webkit-print-color-adjust: exact; font-size: 10pt; }
                            @page { size: A4; margin: 1.5cm; }
                            
                            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px; }
                            .header h1 { font-size: 20px; color: #10b981; margin: 0; text-transform: uppercase; font-weight: 800; }
                            .header p { margin: 0; font-size: 9pt; color: #666; }
                            
                            .meta { margin-bottom: 15px; font-size: 9pt; }
                            .meta strong { margin-right: 5px; }
                            
                            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
                            thead { background-color: #f1f5f9; color: #1e293b; display: table-header-group; }
                            tr { page-break-inside: avoid; }
                            
                            .currency { text-align: right; font-family: monospace; white-space: nowrap; }
                            
                            .footer { margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; }
                            .print-time { margin-top: 30px; text-align: center; font-size: 8pt; color: #9ca3af; font-weight: normal; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div>
                                <h1>SapaDesa</h1>
                                <p>Desa Rowosari</p>
                            </div>
                            <div style="text-align: right;">
                                <h1>Riwayat Transaksi</h1>
                            </div>
                        </div>
                        
                        <div class="meta">
                            <p><strong>Periode:</strong> ${dateRange}</p>
                            <p><strong>Total Data:</strong> ${filteredTransactions.length} Transaksi</p>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 20%;">Waktu</th>
                                    <th style="width: 40%;">Warga & Wilayah</th>
                                    <th style="width: 25%;">Petugas</th>
                                    <th style="width: 15%;" class="currency">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredTransactions.length > 0 ? tableRows : '<tr><td colspan="4" style="text-align: center; padding: 20px;">Tidak ada data transaksi.</td></tr>'}
                            </tbody>
                        </table>

                        <div class="footer">
                            <span>Total Pemasukan Periode Ini:</span>
                            <span>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}</span>
                        </div>

                        <div class="print-time">
                            Dicetak pada ${new Date().toLocaleString('id-ID')}
                        </div>
                        
                        <script>
                            window.onload = function() { window.print(); window.close(); }
                        </script>
                    </body>
                </html>
            `;
            printWindow.document.write(content);
            printWindow.document.close();
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-soft">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Riwayat Transaksi</h1>
                        <p className="mt-1 text-slate-500">Lihat daftar lengkap transaksi pembayaran.</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        disabled={filteredTransactions.length === 0}
                        className="bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl shadow-lg hover:bg-slate-900 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:bg-slate-400 disabled:shadow-none disabled:translate-y-0"
                    >
                        <ClipboardListIcon className="text-lg"/>
                        Cetak Data
                    </button>
                </div>
            </div>

            <div className="glass-card p-2 rounded-2xl">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-xl p-1 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                            <label className="block text-xs font-bold text-slate-400 uppercase ml-3 mt-1">Dari Tanggal</label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                className="w-full px-3 py-1 bg-transparent border-none focus:ring-0 font-medium text-slate-700" 
                            />
                        </div>
                    </div>
                    <div className="md:col-span-3">
                         <div className="bg-white rounded-xl p-1 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                            <label className="block text-xs font-bold text-slate-400 uppercase ml-3 mt-1">Sampai Tanggal</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                className="w-full px-3 py-1 bg-transparent border-none focus:ring-0 font-medium text-slate-700" 
                            />
                        </div>
                    </div>
                    <div className="md:col-span-6">
                         <div className="relative bg-white rounded-xl p-1 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all h-full flex flex-col justify-center">
                            <input 
                                type="text" 
                                placeholder="Cari nama warga, petugas, atau ID..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 font-medium text-slate-700 placeholder-slate-400" 
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden">
                 <div className="overflow-x-auto pb-4">
                    <table className="w-full border-separate border-spacing-y-3 text-left text-sm">
                        <thead>
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-bold text-slate-400 tracking-wider">Waktu</th>
                                <th className="p-4 text-left uppercase text-xs font-bold text-slate-400 tracking-wider">Warga</th>
                                <th className="p-4 text-left uppercase text-xs font-bold text-slate-400 tracking-wider">Wilayah</th>
                                <th className="p-4 text-left uppercase text-xs font-bold text-slate-400 tracking-wider">Petugas</th>
                                <th className="p-4 text-right uppercase text-xs font-bold text-slate-400 tracking-wider">Jumlah</th>
                                <th className="p-4 text-center uppercase text-xs font-bold text-slate-400 tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="bg-white shadow-sm rounded-xl animate-pulse">
                                        <td className="p-4 rounded-l-xl" colSpan={6}><div className="h-6 bg-slate-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((tx) => (
                                    <tr key={tx.id} className="bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                                        <td className="p-4 text-slate-700 rounded-l-2xl">
                                            <div className="font-medium">{new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">{tx.wargaName}</td>
                                        <td className="p-4 text-slate-600 text-xs">
                                            <span className="bg-slate-100 px-2 py-1 rounded-md">RT {tx.rtNumber}</span> <span className="text-slate-400 mx-1">•</span> {tx.dukuhName}
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                                    {tx.petugasName.charAt(0)}
                                                </div>
                                                {tx.petugasName}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-emerald-600">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount)}
                                        </td>
                                        <td className="p-4 text-center rounded-r-2xl">
                                            <button 
                                                onClick={() => setTransactionToDelete(tx)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                title="Hapus Transaksi"
                                            >
                                                <TrashIcon className="text-lg" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                        Tidak ada data transaksi yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredTransactions.length > 0 && (
                            <tfoot>
                                <tr className="font-bold text-slate-700">
                                    <td colSpan={4} className="p-4 text-right uppercase text-xs tracking-wider">Total Halaman Ini</td>
                                    <td className="p-4 text-right font-mono text-emerald-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(paginatedTransactions.reduce((sum, tx) => sum + tx.amount, 0))}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                 </div>
                 {/* Pagination Controls */}
                 {!loading && filteredTransactions.length > 0 && (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-4">
                        <div className="flex items-center text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-xl shadow-sm">
                            <span className="mr-2">Baris per halaman:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="border-none bg-transparent font-bold text-slate-700 focus:ring-0 cursor-pointer outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value="all">Semua</option>
                            </select>
                            <span className="ml-4 text-slate-400 border-l border-slate-200 pl-4">
                                data per halaman. (Total: {filteredTransactions.length})
                            </span>
                        </div>
                        {itemsPerPage !== 'all' && (
                            <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                >
                                    Sebelumnya
                                </button>
                                <span className="text-sm font-bold text-white bg-emerald-500 w-8 h-8 flex items-center justify-center rounded-lg shadow-md shadow-emerald-500/30">
                                    {currentPage}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={!!transactionToDelete} onClose={() => setTransactionToDelete(null)} title="Hapus Transaksi" size="md">
                {transactionToDelete && (
                    <div>
                        <p className="text-slate-700 text-center mb-6">
                            Apakah Anda yakin ingin menghapus riwayat transaksi ini?
                        </p>
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 text-center mb-6 shadow-sm">
                            <p className="font-bold text-slate-800 text-xl mb-1">{transactionToDelete.wargaName}</p>
                            <p className="text-sm text-slate-500 mb-3">
                                {new Date(transactionToDelete.timestamp).toLocaleDateString('id-ID', { dateStyle: 'full' })} • {new Date(transactionToDelete.timestamp).toLocaleTimeString('id-ID')}
                            </p>
                            <div className="inline-block bg-white px-4 py-1 rounded-full border border-rose-200">
                                <p className="font-mono text-2xl font-bold text-rose-600">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(transactionToDelete.amount)}
                                </p>
                            </div>
                        </div>
                         <p className="text-xs text-center text-slate-400 bg-slate-50 p-2 rounded-lg">
                            ⚠ Tindakan ini akan menghapus catatan keuangan dan tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-center gap-3 mt-8">
                            <button 
                                onClick={() => setTransactionToDelete(null)} 
                                className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                                disabled={isDeleting}
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleDeleteConfirm} 
                                className="bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/30 transition-all transform hover:-translate-y-0.5 disabled:bg-slate-400 disabled:shadow-none disabled:translate-y-0"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminRiwayatTransaksiPage;
