
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Petugas } from '@/types';
import { getAllPetugas, createPetugas, updatePetugas, deletePetugas } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon } from '@/components/icons';

const PetugasForm: React.FC<{
  petugas?: Petugas | null;
  onSave: (petugas: Omit<Petugas, 'id'> | Petugas) => void;
  onCancel: () => void;
}> = ({ petugas, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: petugas?.name || '',
    phone: petugas?.phone || '',
    pin: petugas?.pin || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.length !== 6) {
        alert("PIN harus tepat 6 digit angka.");
        return;
    }
    onSave(petugas ? { ...petugas, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Petugas</label>
        <input type="text" placeholder="Nama Lengkap Petugas" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor HP</label>
        <input type="tel" placeholder="08..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">PIN (6 digit)</label>
        <input type="text" placeholder="PIN 6 Digit" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} maxLength={6} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary font-mono tracking-widest" required />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors">Simpan</button>
      </div>
    </form>
  );
};


const AdminPetugasPage: React.FC = () => {
    const [petugasList, setPetugasList] = useState<Petugas[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPetugas, setSelectedPetugas] = useState<Petugas | null>(null);
    const [petugasToDelete, setPetugasToDelete] = useState<Petugas | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllPetugas();
            setPetugasList(data);
        } catch (err) {
            console.error("Failed to fetch petugas", err);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const paginatedPetugas = useMemo(() => {
        if (itemsPerPage === 'all') return petugasList;
        const startIndex = (currentPage - 1) * (itemsPerPage as number);
        return petugasList.slice(startIndex, startIndex + (itemsPerPage as number));
    }, [petugasList, currentPage, itemsPerPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(petugasList.length / (itemsPerPage as number));


    const handleSave = useCallback(async (petugas: Omit<Petugas, 'id'> | Petugas) => {
        if ('id' in petugas) {
            await updatePetugas(petugas.id, petugas);
        } else {
            await createPetugas(petugas);
        }
        fetchData();
        setIsModalOpen(false);
        setSelectedPetugas(null);
    }, [fetchData]);

    const handleDeleteConfirm = useCallback(async (id: string) => {
        await deletePetugas(id);
        fetchData();
        setPetugasToDelete(null);
    }, [fetchData]);

    const openFormModal = useCallback((petugas: Petugas | null = null) => {
        setSelectedPetugas(petugas);
        setIsModalOpen(true);
    }, []);
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Manajemen Data Petugas</h1>
                        <p className="mt-1 text-slate-500">Tambah, edit, atau hapus data petugas penagih.</p>
                    </div>
                    <button onClick={() => openFormModal()} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors">
                        + Tambah Petugas
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">ID</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Nama</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">No. HP</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500 tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                           {loading ? (
                                Array.from({ length: 2 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={4}><div className="h-6 bg-slate-200 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : paginatedPetugas.map((petugas) => (
                                <tr key={petugas.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-slate-600">{petugas.id}</td>
                                    <td className="p-4 font-semibold text-slate-800">{petugas.name}</td>
                                    <td className="p-4 text-slate-600">{petugas.phone}</td>
                                    <td className="p-4">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => openFormModal(petugas)} className="text-slate-500 hover:text-blue-600" title="Edit Petugas"><PencilIcon className="text-xl" /></button>
                                            <button onClick={() => setPetugasToDelete(petugas)} className="text-slate-500 hover:text-red-600" title="Hapus Petugas"><TrashIcon className="text-xl" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                             {!loading && petugasList.length === 0 && (
                                <tr><td colSpan={4} className="text-center p-6 text-slate-500">Tidak ada data petugas.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 {!loading && petugasList.length > 0 && (
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
                                data per halaman. (Total: {petugasList.length})
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

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedPetugas(null); }} title={selectedPetugas ? 'Edit Data Petugas' : 'Tambah Petugas Baru'}>
                <PetugasForm petugas={selectedPetugas} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setSelectedPetugas(null); }} />
            </Modal>
            
            <Modal isOpen={!!petugasToDelete} onClose={() => setPetugasToDelete(null)} title="Konfirmasi Hapus Data" size="md">
                {petugasToDelete && (
                    <div>
                        <p className="text-slate-700 text-center">
                            Apakah Anda yakin ingin menghapus data petugas ini?
                        </p>
                         <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                             <strong className="font-semibold text-red-800 text-lg">{petugasToDelete.name}</strong>
                        </div>
                        <div className="flex justify-center gap-3 mt-6">
                            <button type="button" onClick={() => setPetugasToDelete(null)} className="bg-slate-200 text-slate-800 px-5 py-2 rounded-lg hover:bg-slate-300 font-semibold">
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleDeleteConfirm(petugasToDelete.id)} 
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

export default AdminPetugasPage;
