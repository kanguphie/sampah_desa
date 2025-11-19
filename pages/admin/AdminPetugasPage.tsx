import React, { useState, useEffect, useCallback } from 'react';
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
        <label className="block text-sm font-medium text-slate-700 mb-1">PIN (4-6 digit)</label>
        <input type="text" placeholder="PIN untuk login" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '')})} maxLength={6} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
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

    // Fix: Wrapped fetchData in useCallback to ensure function identity across re-renders and fix scoping issues.
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllPetugas();
            setPetugasList(data);
        } catch (err) { // Fix: Changed 'error' variable to 'err' to avoid potential conflicts.
            console.error("Failed to fetch petugas", err);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Fix: Wrapped handleSave in useCallback to memoize the function.
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

    // Fix: Wrapped handleDeleteConfirm in useCallback.
    const handleDeleteConfirm = useCallback(async (id: string) => {
        await deletePetugas(id);
        fetchData();
        setPetugasToDelete(null);
    }, [fetchData]);

    // Fix: Wrapped openFormModal in useCallback.
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
                            ) : petugasList.map((petugas) => (
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
                        </tbody>
                    </table>
                </div>
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