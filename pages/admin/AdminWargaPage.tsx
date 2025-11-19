
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT, createWarga, updateWarga, deleteWarga } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, QrCodeIcon, ChevronDownIcon, SearchIcon } from '@/components/icons';

const WargaForm: React.FC<{
  warga?: Warga | null;
  onSave: (warga: Omit<Warga, 'id'> | Warga) => void;
  onCancel: () => void;
  dukuhList: Dukuh[];
  rtList: RT[];
}> = ({ warga, onSave, onCancel, dukuhList, rtList }) => {
  const [formData, setFormData] = useState({
    name: warga?.name || '',
    dukuhId: warga?.dukuhId || 0,
    rtId: warga?.rtId || 0,
    dailyFee: warga?.dailyFee || 2000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(warga ? { ...warga, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
            <input type="text" placeholder="Nama Lengkap" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" required />
        </div>
        <div className="grid grid-cols-2 gap-5">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dukuh</label>
                <div className="relative">
                    <select value={formData.dukuhId} onChange={e => setFormData({...formData, dukuhId: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none bg-white transition-all" required>
                        <option value={0} disabled>Pilih Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">RT</label>
                <div className="relative">
                     <select value={formData.rtId} onChange={e => setFormData({...formData, rtId: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none appearance-none bg-white transition-all" required>
                        <option value={0} disabled>Pilih RT</option>
                        {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"/>
                </div>
            </div>
        </div>
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tarif Harian (Rp)</label>
            <input type="number" placeholder="Tarif Harian (Rp)" value={formData.dailyFee} onChange={e => setFormData({...formData, dailyFee: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" required />
        </div>
      <div className="flex justify-end gap-3 pt-6">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">Batal</button>
        <button type="submit" className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5">Simpan</button>
      </div>
    </form>
  );
};


const AdminWargaPage: React.FC = () => {
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    
    // Selection & Actions
    const [wargaToEdit, setWargaToEdit] = useState<Warga | null>(null);
    const [wargaToShowQr, setWargaToShowQr] = useState<Warga | null>(null);
    const [wargaToDelete, setWargaToDelete] = useState<Warga | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filters & Sorting
    const [filters, setFilters] = useState({ search: '', dukuhId: 'all', rtId: 'all' });
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'name', direction: 'ascending'});

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [wargaData, dukuhData, rtData] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
            setWargaList(wargaData);
            setDukuhList(dukuhData);
            setRtList(rtData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, itemsPerPage]);

    const getDukuhName = useCallback((dukuhId: number) => dukuhList.find(d => d.id === dukuhId)?.name || 'N/A', [dukuhList]);
    const getRTNumber = useCallback((rtId: number) => rtList.find(rt => rt.id === rtId)?.number || 'N/A', [rtList]);

    const filteredWarga = useMemo(() => {
        return wargaList.filter(w => {
            const searchMatch = w.name.toLowerCase().includes(filters.search.toLowerCase()) || w.id.includes(filters.search);
            const dukuhMatch = filters.dukuhId === 'all' || w.dukuhId === Number(filters.dukuhId);
            const rtMatch = filters.rtId === 'all' || w.rtId === Number(filters.rtId);
            return searchMatch && dukuhMatch && rtMatch;
        });
    }, [wargaList, filters]);

    const sortedWarga = useMemo(() => {
        let sortableItems = [...filteredWarga];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const getValue = (warga: Warga, key: string) => {
                    if (key === 'dukuhName') return getDukuhName(warga.dukuhId);
                    if (key === 'rtNumber') return getRTNumber(warga.rtId);
                    return warga[key as keyof Warga];
                };

                const aValue = getValue(a, sortConfig.key);
                const bValue = getValue(b, sortConfig.key);

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredWarga, sortConfig, getDukuhName, getRTNumber]);
    
    const paginatedWarga = useMemo(() => {
        if (itemsPerPage === 'all') return sortedWarga;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedWarga.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedWarga, currentPage, itemsPerPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedWarga.length / itemsPerPage);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setSelectedIds(new Set()); 
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allVisibleIds = sortedWarga.map(w => w.id);
            setSelectedIds(new Set(allVisibleIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const isAllSelected = sortedWarga.length > 0 && sortedWarga.every(w => selectedIds.has(w.id));
    const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

    const handleSave = async (warga: Omit<Warga, 'id'> | Warga) => {
        if ('id' in warga) {
            await updateWarga(warga.id, warga);
        } else {
            await createWarga(warga);
        }
        fetchData();
        setIsFormModalOpen(false);
        setWargaToEdit(null);
    };

    const handleDeleteConfirm = async (id: string) => {
        await deleteWarga(id);
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });
        fetchData();
        setWargaToDelete(null);
    };

    const handleBulkDeleteConfirm = async () => {
        setLoading(true);
        try {
            const promises = Array.from(selectedIds).map((id) => deleteWarga(id as string));
            await Promise.all(promises);
            setSelectedIds(new Set());
            await fetchData();
        } catch (error) {
            console.error("Error bulk deleting:", error);
        } finally {
            setLoading(false);
            setIsBulkDeleteModalOpen(false);
        }
    };

    const openFormModal = (warga: Warga | null = null) => {
        setWargaToEdit(warga);
        setIsFormModalOpen(true);
    };
    
    const openQrModal = (warga: Warga) => {
        setWargaToShowQr(warga);
        setIsQrModalOpen(true);
    };

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const SortableHeader: React.FC<{ sortKey: string; label: string; className?: string }> = ({ sortKey, label, className }) => (
        <th className={`p-4 text-left ${className}`}>
            <button onClick={() => requestSort(sortKey)} className="font-bold w-full text-left uppercase text-xs text-slate-400 tracking-wider hover:text-emerald-600 transition-colors flex items-center gap-1">
                {label}
                <span className="text-emerald-500 text-[10px]">{getSortIndicator(sortKey)}</span>
            </button>
        </th>
    );

     // --- Print ---
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const tableRows = sortedWarga.map(warga => `
                <tr>
                    <td>${warga.id}</td>
                    <td>${warga.name}</td>
                    <td>${getRTNumber(warga.rtId)}</td>
                    <td>${getDukuhName(warga.dukuhId)}</td>
                    <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(warga.dailyFee)}</td>
                </tr>
            `).join('');
            
            const content = `
                <html>
                    <head><title>Data Warga</title><style>body{font-family:sans-serif}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}.currency{text-align:right}</style></head>
                    <body>
                        <h1>Data Warga</h1>
                        <p>Total: ${sortedWarga.length}</p>
                        <table><thead><tr><th>ID</th><th>Nama</th><th>RT</th><th>Dukuh</th><th>Tarif</th></tr></thead><tbody>${tableRows}</tbody></table>
                        <script>window.print();window.close();</script>
                    </body>
                </html>
            `;
            printWindow.document.write(content);
            printWindow.document.close();
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-slate-800 tracking-tight">Data Warga</h1>
                    <p className="mt-1 text-slate-500 text-lg">Kelola data penduduk Desa Rowosari.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 ? (
                         <button 
                            onClick={() => setIsBulkDeleteModalOpen(true)} 
                            className="bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all flex items-center gap-2 animate-fade-in"
                        >
                            <TrashIcon className="text-lg"/>
                            Hapus ({selectedIds.size})
                        </button>
                    ) : (
                        <>
                             <button onClick={handlePrint} className="bg-white text-slate-600 font-semibold px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                                Cetak
                            </button>
                            <button onClick={() => openFormModal()} className="bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all transform hover:-translate-y-0.5">
                                + Warga Baru
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Filters & Search - Glassmorphism style */}
            <div className="glass-card p-2 rounded-2xl">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Cari nama atau ID..." 
                            value={filters.search} 
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 border-b-2 border-transparent focus:border-emerald-500 rounded-xl focus:bg-white outline-none transition-all placeholder-slate-400 font-medium text-slate-700" 
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"/>
                    </div>
                    <div className="relative">
                         <select 
                            name="dukuhId" 
                            value={filters.dukuhId} 
                            onChange={(e) => handleFilterChange('dukuhId', e.target.value)} 
                            className="w-full pl-4 pr-10 py-3 bg-white/50 border-b-2 border-transparent focus:border-emerald-500 rounded-xl focus:bg-white outline-none appearance-none transition-all font-medium text-slate-700"
                        >
                            <option value="all">Semua Dukuh</option>
                            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"/>
                    </div>
                    <div className="relative">
                         <select 
                            name="rtId" 
                            value={filters.rtId} 
                            onChange={(e) => handleFilterChange('rtId', e.target.value)} 
                             className="w-full pl-4 pr-10 py-3 bg-white/50 border-b-2 border-transparent focus:border-emerald-500 rounded-xl focus:bg-white outline-none appearance-none transition-all font-medium text-slate-700"
                        >
                            <option value="all">Semua RT</option>
                            {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"/>
                    </div>
                 </div>
            </div>

            {/* Modern Table - Clean Rows */}
            <div className="overflow-hidden">
                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-separate border-spacing-y-3 text-left text-sm">
                        <thead>
                            <tr>
                                <th className="p-4 w-16 text-center">
                                     <input 
                                        type="checkbox" 
                                        className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                        checked={isAllSelected}
                                        ref={input => { if (input) input.indeterminate = isIndeterminate; }}
                                        onChange={handleSelectAll}
                                        disabled={sortedWarga.length === 0}
                                    />
                                </th>
                                <SortableHeader sortKey="id" label="ID" />
                                <SortableHeader sortKey="name" label="Nama" />
                                <SortableHeader sortKey="rtNumber" label="RT" />
                                <SortableHeader sortKey="dukuhName" label="Dukuh" />
                                <SortableHeader sortKey="dailyFee" label="Tarif" />
                                <th className="p-4 text-center uppercase text-xs font-bold text-slate-400 tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="bg-white shadow-sm rounded-xl animate-pulse">
                                        <td className="p-4 rounded-l-xl"><div className="h-4 w-4 bg-slate-100 rounded mx-auto"></div></td>
                                        <td className="p-4"><div className="h-4 w-16 bg-slate-100 rounded"></div></td>
                                        <td className="p-4"><div className="h-4 w-32 bg-slate-100 rounded"></div></td>
                                        <td className="p-4"><div className="h-4 w-12 bg-slate-100 rounded"></div></td>
                                        <td className="p-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                        <td className="p-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                        <td className="p-4 rounded-r-xl"><div className="h-8 w-20 bg-slate-100 rounded mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : paginatedWarga.map((warga) => (
                                <tr 
                                    key={warga.id} 
                                    className={`bg-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group ${selectedIds.has(warga.id) ? 'ring-2 ring-emerald-400 bg-emerald-50/30' : ''}`}
                                >
                                    <td className="p-4 text-center rounded-l-2xl">
                                         <input 
                                            type="checkbox" 
                                            className="h-5 w-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                            checked={selectedIds.has(warga.id)}
                                            onChange={() => handleSelectOne(warga.id)}
                                        />
                                    </td>
                                    <td className="p-4 font-mono font-semibold text-slate-500 group-hover:text-emerald-600 transition-colors">{warga.id}</td>
                                    <td className="p-4 font-bold text-slate-700">{warga.name}</td>
                                    <td className="p-4 text-slate-600">RT {getRTNumber(warga.rtId)}</td>
                                    <td className="p-4 text-slate-600">{getDukuhName(warga.dukuhId)}</td>
                                    <td className="p-4">
                                        <span className="bg-emerald-100 text-emerald-700 py-1 px-3 rounded-full text-xs font-bold">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(warga.dailyFee)}
                                        </span>
                                    </td>
                                    <td className="p-4 rounded-r-2xl">
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => openQrModal(warga)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" title="QR Code"><QrCodeIcon className="text-lg"/></button>
                                            <button onClick={() => openFormModal(warga)} className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><PencilIcon className="text-lg" /></button>
                                            <button onClick={() => setWargaToDelete(warga)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><TrashIcon className="text-lg" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && sortedWarga.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <SearchIcon className="text-3xl text-slate-300"/>
                        </div>
                        <h3 className="font-bold text-lg text-slate-600">Data Tidak Ditemukan</h3>
                        <p>Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
                    </div>
                )}
                 {/* Pagination Controls */}
                {!loading && sortedWarga.length > 0 && (
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
                                {itemsPerPage !== 'all' 
                                    ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, sortedWarga.length)} dari ${sortedWarga.length}`
                                    : `Total ${sortedWarga.length}`
                                }
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

            {/* --- MODALS --- */}

            <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setWargaToEdit(null); }} title={wargaToEdit ? 'Edit Data Warga' : 'Tambah Warga Baru'}>
                <WargaForm warga={wargaToEdit} onSave={handleSave} onCancel={() => { setIsFormModalOpen(false); setWargaToEdit(null); }} dukuhList={dukuhList} rtList={rtList} />
            </Modal>
            
            <Modal isOpen={isQrModalOpen} onClose={() => { setIsQrModalOpen(false); setWargaToShowQr(null); }} title={`QR Code: ${wargaToShowQr?.name}`}>
                {wargaToShowQr && (
                    <div className="flex flex-col items-center pt-6 pb-2">
                        <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100">
                            <QRCodeSVG value={wargaToShowQr.id} size={220} />
                        </div>
                        <p className="mt-6 font-bold text-4xl font-mono text-slate-800 tracking-[0.2em]">{wargaToShowQr.id}</p>
                        <p className="text-slate-400 mt-2 font-medium text-sm">Gunakan kode ini untuk transaksi.</p>
                    </div>
                )}
            </Modal>

            {/* Single Delete Modal */}
            <Modal isOpen={!!wargaToDelete} onClose={() => setWargaToDelete(null)} title="Hapus Data" size="md">
                {wargaToDelete && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                            <TrashIcon className="text-3xl"/>
                        </div>
                        <p className="text-slate-600 mb-6">
                            Anda yakin ingin menghapus data <strong>{wargaToDelete.name}</strong>? Tindakan ini permanen.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button type="button" onClick={() => setWargaToDelete(null)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleDeleteConfirm(wargaToDelete.id)} 
                                className="px-5 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Bulk Delete Modal */}
            <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} title="Hapus Banyak Data" size="md">
                <div className="text-center">
                     <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                        <TrashIcon className="text-3xl"/>
                    </div>
                    <p className="text-slate-600 mb-2">
                        Anda akan menghapus <strong>{selectedIds.size}</strong> data warga.
                    </p>
                    <p className="text-sm text-red-500 font-semibold mb-6 bg-red-50 py-2 rounded-lg">Tindakan ini tidak dapat dibatalkan!</p>
                    <div className="flex justify-center gap-3">
                        <button type="button" onClick={() => setIsBulkDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                            Batal
                        </button>
                        <button 
                            type="button" 
                            disabled={loading}
                            onClick={handleBulkDeleteConfirm} 
                            className="px-5 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all disabled:bg-slate-300 disabled:shadow-none"
                        >
                            {loading ? 'Menghapus...' : 'Hapus Semua'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminWargaPage;
