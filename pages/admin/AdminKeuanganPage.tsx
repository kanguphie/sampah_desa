
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Pengeluaran } from '@/types';
import { getAllPengeluaran, createPengeluaran, updatePengeluaran, deletePengeluaran } from '@/services/api';
import Modal from '@/components/Modal';
// Removed non-existent PlusIcon import as it is not exported from icons component and not used as a component here
import { TrashIcon, PencilIcon, BanknotesIcon } from '@/components/icons';

// Form Component for Add/Edit
const PengeluaranForm: React.FC<{
  pengeluaran?: Pengeluaran | null;
  onSave: (pengeluaran: Omit<Pengeluaran, 'id'> | Pengeluaran) => void;
  onCancel: () => void;
}> = ({ pengeluaran, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: pengeluaran?.date ? new Date(pengeluaran.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: pengeluaran?.description || '',
    amount: pengeluaran?.amount || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
        ...formData,
        date: new Date(formData.date),
        amount: Number(formData.amount)
    };
    onSave(pengeluaran ? { ...pengeluaran, ...dataToSave } : dataToSave);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tanggal Transaksi</label>
        <input 
          type="date" 
          value={formData.date} 
          onChange={e => setFormData({...formData, date: e.target.value})} 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" required />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Keterangan / Deskripsi</label>
        <input 
          type="text" 
          placeholder="Contoh: Pembelian Bensin Motor Tossa" 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" required />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Jumlah Nominal (Rp)</label>
        <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold">Rp</span>
            </div>
            <input 
                type="number" 
                placeholder="0" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-mono font-bold" required />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Batal</button>
        <button type="submit" className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all">Simpan Catatan</button>
      </div>
    </form>
  );
};


// Main Page Component
const AdminKeuanganPage: React.FC = () => {
    const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [pengeluaranToEdit, setPengeluaranToEdit] = useState<Pengeluaran | null>(null);
    const [pengeluaranToDelete, setPengeluaranToDelete] = useState<Pengeluaran | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllPengeluaran();
            setPengeluaranList(data);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const paginatedPengeluaran = useMemo(() => {
        if (itemsPerPage === 'all') return pengeluaranList;
        const startIndex = (currentPage - 1) * itemsPerPage;
        return pengeluaranList.slice(startIndex, startIndex + itemsPerPage);
    }, [pengeluaranList, currentPage, itemsPerPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(pengeluaranList.length / itemsPerPage);

    const handleSave = async (pengeluaran: Omit<Pengeluaran, 'id'> | Pengeluaran) => {
        if ('id' in pengeluaran) {
            await updatePengeluaran(pengeluaran.id, pengeluaran);
        } else {
            await createPengeluaran(pengeluaran as Omit<Pengeluaran, 'id'>);
        }
        fetchData();
        setIsFormModalOpen(false);
        setPengeluaranToEdit(null);
    };

    const handleDeleteConfirm = async (id: string) => {
        await deletePengeluaran(id);
        fetchData();
        setPengeluaranToDelete(null);
    };

    const openFormModal = (pengeluaran: Pengeluaran | null = null) => {
        setPengeluaranToEdit(pengeluaran);
        setIsFormModalOpen(true);
    };
    
    const totalPengeluaranBulanIni = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        return pengeluaranList
            .filter(p => {
                const pDate = new Date(p.date);
                return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + p.amount, 0);
    }, [pengeluaranList]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR', 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        }).format(amount).replace(/\s/g, ' ');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Manajemen Keuangan</h1>
                    <p className="text-slate-500 text-sm mt-0.5 font-medium">Kelola catatan pengeluaran operasional.</p>
                </div>
                <button 
                    onClick={() => openFormModal()} 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus text-sm"></i>
                    Tambah Pengeluaran
                </button>
            </div>
            
            {/* Summary Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-6 animate-fade-in">
                <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 shadow-inner">
                  <i className="fa-solid fa-money-bill-transfer text-3xl text-rose-500"></i>
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pengeluaran Bulan Ini</p>
                    {loading ? 
                        <div className="h-10 w-48 bg-slate-100 rounded-lg animate-pulse"></div> :
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                            {formatCurrency(totalPengeluaranBulanIni).split(',')[0]}
                        </h2>
                    }
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest">Tanggal</th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest">Keterangan</th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest">Jumlah</th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-5" colSpan={4}><div className="h-6 bg-slate-50 rounded animate-pulse w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedPengeluaran.map((pengeluaran) => (
                                <tr key={pengeluaran.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="p-5 text-slate-500 font-medium">
                                        {new Date(pengeluaran.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className="p-5">
                                        <p className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{pengeluaran.description}</p>
                                    </td>
                                    <td className="p-5 font-mono text-slate-600 font-medium">
                                        {formatCurrency(pengeluaran.amount)}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex justify-center items-center gap-4">
                                            <button 
                                                onClick={() => openFormModal(pengeluaran)} 
                                                className="text-slate-400 hover:text-indigo-600 transition-colors" 
                                                title="Edit Data"
                                            >
                                                <PencilIcon className="text-xl" />
                                            </button>
                                            <button 
                                                onClick={() => setPengeluaranToDelete(pengeluaran)} 
                                                className="text-slate-400 hover:text-rose-600 transition-colors" 
                                                title="Hapus Data"
                                            >
                                                <TrashIcon className="text-xl" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {!loading && pengeluaranList.length === 0 && (
                        <div className="text-center py-20 px-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                                <BanknotesIcon className="text-4xl text-slate-300"/>
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg">Belum Ada Pengeluaran</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2">Catatan pengeluaran operasional Anda akan muncul di sini setelah Anda menambahkannya.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && pengeluaranList.length > 0 && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/30 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <span className="mr-3">Tampilkan</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-slate-700"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value="all">Semua</option>
                            </select>
                            <span className="ml-3">Total: {pengeluaranList.length} Catatan</span>
                        </div>
                        {itemsPerPage !== 'all' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 text-xs">
                                    Halaman {currentPage} / {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setPengeluaranToEdit(null); }} title={pengeluaranToEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'} size="lg">
                <PengeluaranForm pengeluaran={pengeluaranToEdit} onSave={handleSave} onCancel={() => { setIsFormModalOpen(false); setPengeluaranToEdit(null); }} />
            </Modal>
            
            <Modal isOpen={!!pengeluaranToDelete} onClose={() => setPengeluaranToDelete(null)} title="Hapus Data Pengeluaran" size="md">
                {pengeluaranToDelete && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                             <TrashIcon className="text-3xl text-rose-500"/>
                        </div>
                        <p className="text-slate-700 font-medium">
                            Hapus catatan pengeluaran <span className="font-bold">"{pengeluaranToDelete.description}"</span>?
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <button onClick={() => setPengeluaranToDelete(null)} className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Batal</button>
                            <button 
                                onClick={() => handleDeleteConfirm(pengeluaranToDelete.id)} 
                                className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                            >
                                Ya, Hapus Permanen
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminKeuanganPage;
