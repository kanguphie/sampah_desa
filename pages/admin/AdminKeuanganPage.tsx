
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Pengeluaran } from '@/types';
import { getAllPengeluaran, createPengeluaran, updatePengeluaran, deletePengeluaran } from '@/services/api';
import Modal from '@/components/Modal';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
        <input 
          type="date" 
          value={formData.date} 
          onChange={e => setFormData({...formData, date: e.target.value})} 
          className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
        <input 
          type="text" 
          placeholder="Contoh: Gaji Petugas, Beli Bensin" 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp)</label>
        <input 
          type="number" 
          placeholder="Jumlah Pengeluaran" 
          value={formData.amount} 
          onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
          className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors">Simpan</button>
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

    // Pagination Logic
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

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Manajemen Keuangan</h1>
                        <p className="mt-1 text-slate-500">Kelola catatan pengeluaran operasional.</p>
                    </div>
                    <button onClick={() => openFormModal()} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors">
                        + Tambah Pengeluaran
                    </button>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-5">
                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-lg bg-red-100">
                  <BanknotesIcon className="text-3xl text-red-600"/>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-500">Total Pengeluaran Bulan Ini</p>
                    {loading ? 
                        <div className="h-8 w-40 bg-slate-200 rounded animate-pulse mt-1"></div> :
                        <p className="text-3xl font-bold font-display text-slate-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalPengeluaranBulanIni)}</p>
                    }
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Tanggal</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Keterangan</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Jumlah</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500 tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={4}><div className="h-6 bg-slate-200 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : paginatedPengeluaran.map((pengeluaran) => (
                                <tr key={pengeluaran.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-600">{new Date(pengeluaran.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                                    <td className="p-4 font-semibold text-slate-800">{pengeluaran.description}</td>
                                    <td className="p-4 font-mono text-slate-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pengeluaran.amount)}</td>
                                    <td className="p-4">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => openFormModal(pengeluaran)} className="text-slate-500 hover:text-blue-600" title="Edit Pengeluaran"><PencilIcon className="text-xl" /></button>
                                            <button onClick={() => setPengeluaranToDelete(pengeluaran)} className="text-slate-500 hover:text-red-600" title="Hapus Pengeluaran"><TrashIcon className="text-xl" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {!loading && pengeluaranList.length === 0 && (
                        <div className="text-center p-8 text-slate-500">
                            <h3 className="font-semibold text-lg">Belum Ada Data</h3>
                            <p>Silakan tambahkan data pengeluaran pertama Anda.</p>
                        </div>
                    )}
                </div>
                {/* Pagination Controls */}
                {!loading && pengeluaranList.length > 0 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center text-sm text-slate-600">
                            <span className="mr-2">Tampilkan</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value="all">Semua</option>
                            </select>
                            <span className="ml-2">
                                data per halaman. (Total: {pengeluaranList.length})
                            </span>
                        </div>
                        {itemsPerPage !== 'all' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                <span className="text-sm font-medium text-slate-600">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => { setIsFormModalOpen(false); setPengeluaranToEdit(null); }} title={pengeluaranToEdit ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}>
                <PengeluaranForm pengeluaran={pengeluaranToEdit} onSave={handleSave} onCancel={() => { setIsFormModalOpen(false); setPengeluaranToEdit(null); }} />
            </Modal>
            
            <Modal isOpen={!!pengeluaranToDelete} onClose={() => setPengeluaranToDelete(null)} title="Konfirmasi Hapus Data" size="md">
                {pengeluaranToDelete && (
                    <div>
                        <p className="text-slate-700 text-center">
                            Apakah Anda yakin ingin menghapus data pengeluaran ini secara permanen?
                        </p>
                        <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                             <strong className="font-semibold text-red-800">{pengeluaranToDelete.description}</strong>
                             <p className="text-red-700 font-mono text-sm">({new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pengeluaranToDelete.amount)})</p>
                        </div>
                        <p className="text-sm text-center text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex justify-center gap-3 mt-6">
                            <button type="button" onClick={() => setPengeluaranToDelete(null)} className="bg-slate-200 text-slate-800 px-5 py-2 rounded-lg hover:bg-slate-300 font-semibold">
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleDeleteConfirm(pengeluaranToDelete.id)} 
                                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 font-semibold"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminKeuanganPage;
