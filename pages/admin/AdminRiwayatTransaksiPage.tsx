
import React, { useState, useEffect, useMemo } from 'react';
import { getReports } from '@/services/api';
import type { Transaksi } from '@/types';
import { SearchIcon, ClipboardListIcon } from '@/components/icons';

interface ReportRow extends Transaksi {
    wargaName: string;
    petugasName: string;
    dukuhName: string;
    rtNumber: string;
}

const AdminRiwayatTransaksiPage: React.FC = () => {
    const [transactions, setTransactions] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
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
        };
        fetchData();
    }, [startDate, endDate]);

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

    const totalAmount = useMemo(() => filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0), [filteredTransactions]);

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
                            
                            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 20px; }
                            .header h1 { font-size: 20px; color: #0d9488; margin: 0; text-transform: uppercase; font-weight: 800; }
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
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Riwayat Transaksi</h1>
                        <p className="mt-1 text-slate-500">Lihat daftar lengkap transaksi pembayaran.</p>
                    </div>
                    <button 
                        onClick={handlePrint}
                        disabled={filteredTransactions.length === 0}
                        className="bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:bg-slate-400"
                    >
                        <ClipboardListIcon className="text-lg"/>
                        Cetak Data
                    </button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dari Tanggal</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sampai Tanggal</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div className="md:col-span-6">
                         <label className="block text-sm font-medium text-slate-700 mb-1">Cari Transaksi</label>
                         <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Cari nama warga, petugas, atau ID..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Waktu</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Warga</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Wilayah</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Petugas</th>
                                <th className="p-4 text-right uppercase text-xs font-semibold text-slate-500 tracking-wider">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={5}><div className="h-6 bg-slate-200 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : filteredTransactions.length > 0 ? (
                                filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-700">
                                            <div>{new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                                            <div className="text-xs text-slate-500">{new Date(tx.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-800">{tx.wargaName}</td>
                                        <td className="p-4 text-slate-600 text-xs">
                                            RT {tx.rtNumber}, {tx.dukuhName}
                                        </td>
                                        <td className="p-4 text-slate-600">{tx.petugasName}</td>
                                        <td className="p-4 text-right font-mono font-medium text-primary">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(tx.amount)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Tidak ada data transaksi yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredTransactions.length > 0 && (
                            <tfoot className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                                <tr>
                                    <td colSpan={4} className="p-4 text-right">Total Halaman Ini</td>
                                    <td className="p-4 text-right font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalAmount)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default AdminRiwayatTransaksiPage;
