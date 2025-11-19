
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT, createWarga, updateWarga, deleteWarga } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, QrCodeIcon } from '@/components/icons';

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
  
  // RT is now independent master data, no filtering needed by Dukuh

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input type="text" placeholder="Nama Lengkap" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dukuh</label>
                <select value={formData.dukuhId} onChange={e => setFormData({...formData, dukuhId: Number(e.target.value)})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required>
                    <option value={0} disabled>Pilih Dukuh</option>
                    {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">RT</label>
                <select value={formData.rtId} onChange={e => setFormData({...formData, rtId: Number(e.target.value)})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required>
                    <option value={0} disabled>Pilih RT</option>
                    {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                </select>
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tarif Harian (Rp)</label>
            <input type="number" placeholder="Tarif Harian (Rp)" value={formData.dailyFee} onChange={e => setFormData({...formData, dailyFee: Number(e.target.value)})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
        </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors">Simpan</button>
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

    const getDukuhName = useCallback((dukuhId: number) => dukuhList.find(d => d.id === dukuhId)?.name || 'N/A', [dukuhList]);
    const getRTNumber = useCallback((rtId: number) => rtList.find(rt => rt.id === rtId)?.number || 'N/A', [rtList]);

    // Filter options for dropdown (always show all RTs now)
    const availableRTs = useMemo(() => rtList, [rtList]);

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
    
    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            // Note: We don't reset RT filter when Dukuh changes anymore because RTs are independent IDs
            return newFilters;
        });
        setSelectedIds(new Set()); // Reset selection on filter change
    };

    // --- Selection Logic ---

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all visible items
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

    // --- CRUD Logic ---

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

    // --- UI Helpers ---

    const getSortIndicator = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const SortableHeader: React.FC<{ sortKey: string; label: string; className?: string }> = ({ sortKey, label, className }) => (
        <th className={`p-4 text-left ${className}`}>
            <button onClick={() => requestSort(sortKey)} className="font-semibold w-full text-left uppercase text-xs text-slate-500 tracking-wider">
                {label}
                <span className="text-primary">{getSortIndicator(sortKey)}</span>
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
                    <head>
                        <title>Data Warga</title>
                        <style>
                            body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
                            @page { size: F4; margin: 1.5cm; }
                            .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 20px; }
                            .print-header h1 { font-size: 24px; color: #0d9488; margin: 0; }
                            .print-header p { margin: 0; font-size: 10pt; color: #666; }
                            .print-footer { text-align: center; margin-top: 1.5rem; font-size: 8pt; color: #888; }
                            table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 10pt; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            thead { background-color: #f1f5f9; color: #333; }
                            tr { page-break-inside: avoid; }
                            .currency { text-align: right; }
                        </style>
                    </head>
                    <body>
                        <div class="print-header">
                            <h1>SapaDesa - Data Warga</h1>
                            <p>Total Warga: ${sortedWarga.length}</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nama</th>
                                    <th>RT</th>
                                    <th>Dukuh</th>
                                    <th class="currency">Tarif</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                        <div class="print-footer">
                            <p>Dicetak pada ${new Date().toLocaleString('id-ID')}</p>
                        </div>
                        <script>
                            window.addEventListener('load', () => {
                                window.print();
                                window.close();
                            });
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
                        <h1 className="text-2xl font-bold font-display text-slate-800">Manajemen Data Warga</h1>
                        <p className="mt-1 text-slate-500">Tambah, edit, atau hapus data warga Desa Rowosari.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 ? (
                             <button 
                                onClick={() => setIsBulkDeleteModalOpen(true)} 
                                className="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <TrashIcon className="text-sm"/>
                                Hapus ({selectedIds.size})
                            </button>
                        ) : (
                            <>
                                <button onClick={handlePrint} className="bg-slate-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-slate-800 transition-colors">
                                    Cetak
                                </button>
                                <button onClick={() => openFormModal()} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors">
                                    + Tambah Warga
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                        type="text" 
                        placeholder="Cari nama atau ID warga..." 
                        value={filters.search} 
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary" 
                    />
                     <select 
                        name="dukuhId" 
                        value={filters.dukuhId} 
                        onChange={(e) => handleFilterChange('dukuhId', e.target.value)} 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                     <select 
                        name="rtId" 
                        value={filters.rtId} 
                        onChange={(e) => handleFilterChange('rtId', e.target.value)} 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value="all">Semua RT</option>
                        {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                    </select>
                 </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 w-12 text-center">
                                     <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
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
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500 tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={7}><div className="h-6 bg-slate-200 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : sortedWarga.map((warga) => (
                                <tr key={warga.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(warga.id) ? 'bg-teal-50/60' : ''}`}>
                                    <td className="p-4 text-center">
                                         <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                            checked={selectedIds.has(warga.id)}
                                            onChange={() => handleSelectOne(warga.id)}
                                        />
                                    </td>
                                    <td className="p-4 font-mono text-slate-600">{warga.id}</td>
                                    <td className="p-4 font-semibold text-slate-800">{warga.name}</td>
                                    <td className="p-4 text-slate-600">RT {getRTNumber(warga.rtId)}</td>
                                    <td className="p-4 text-slate-600">{getDukuhName(warga.dukuhId)}</td>
                                    <td className="p-4 font-mono text-slate-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(warga.dailyFee)}</td>
                                    <td className="p-4">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => openQrModal(warga)} className="text-slate-500 hover:text-primary" title="Tampilkan QR Code"><QrCodeIcon className="text-xl"/></button>
                                            <button onClick={() => openFormModal(warga)} className="text-slate-500 hover:text-blue-600" title="Edit Warga"><PencilIcon className="text-xl" /></button>
                                            <button onClick={() => setWargaToDelete(warga)} className="text-slate-500 hover:text-red-600" title="Hapus Warga"><TrashIcon className="text-xl" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && sortedWarga.length === 0 && (
                    <div className="text-center p-8 text-slate-500">
                        <h3 className="font-semibold text-lg">Data Tidak Ditemukan</h3>
                        <p>Tidak ada data warga yang cocok dengan filter atau pencarian Anda.</p>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setWargaToEdit(null); }} title={wargaToEdit ? 'Edit Warga' : 'Tambah Warga Baru'}>
                <WargaForm warga={wargaToEdit} onSave={handleSave} onCancel={() => { setIsFormModalOpen(false); setWargaToEdit(null); }} dukuhList={dukuhList} rtList={rtList} />
            </Modal>
            
            <Modal isOpen={isQrModalOpen} onClose={() => { setIsQrModalOpen(false); setWargaToShowQr(null); }} title={`QR Code: ${wargaToShowQr?.name}`}>
                {wargaToShowQr && (
                    <div className="flex flex-col items-center pt-4">
                        <QRCodeSVG value={wargaToShowQr.id} size={256} className="rounded-lg shadow-lg" />
                        <p className="mt-6 font-bold text-3xl font-mono text-slate-800 tracking-widest">{wargaToShowQr.id}</p>
                        <p className="text-slate-500">Gunakan QR Code ini untuk pencatatan pembayaran.</p>
                    </div>
                )}
            </Modal>

            {/* Single Delete Modal */}
            <Modal isOpen={!!wargaToDelete} onClose={() => setWargaToDelete(null)} title="Konfirmasi Hapus Data" size="md">
                {wargaToDelete && (
                    <div>
                        <p className="text-slate-700 text-center">
                            Apakah Anda yakin ingin menghapus data warga ini secara permanen?
                        </p>
                        <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                             <strong className="font-semibold text-red-800 text-lg">{wargaToDelete.name}</strong>
                             <p className="text-red-700 font-mono text-sm">(ID: {wargaToDelete.id})</p>
                        </div>
                        <p className="text-sm text-center text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex justify-center gap-3 mt-6">
                            <button type="button" onClick={() => setWargaToDelete(null)} className="bg-slate-200 text-slate-800 px-5 py-2 rounded-lg hover:bg-slate-300 font-semibold">
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleDeleteConfirm(wargaToDelete.id)} 
                                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 font-semibold"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Bulk Delete Modal */}
            <Modal isOpen={isBulkDeleteModalOpen} onClose={() => setIsBulkDeleteModalOpen(false)} title="Hapus Banyak Data" size="md">
                <div>
                    <p className="text-slate-700 text-center">
                        Apakah Anda yakin ingin menghapus <strong>{selectedIds.size}</strong> data warga terpilih?
                    </p>
                    <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                            <TrashIcon className="text-3xl text-red-500 mb-2 mx-auto block"/>
                            <span className="font-bold text-red-800">{selectedIds.size} Data akan dihapus</span>
                    </div>
                    <p className="text-sm text-center text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                    <div className="flex justify-center gap-3 mt-6">
                        <button type="button" onClick={() => setIsBulkDeleteModalOpen(false)} className="bg-slate-200 text-slate-800 px-5 py-2 rounded-lg hover:bg-slate-300 font-semibold">
                            Batal
                        </button>
                        <button 
                            type="button" 
                            disabled={loading}
                            onClick={handleBulkDeleteConfirm} 
                            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 font-semibold disabled:bg-slate-400"
                        >
                            {loading ? 'Menghapus...' : 'Ya, Hapus Semua'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminWargaPage;