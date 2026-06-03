
import React, { useState, useEffect } from 'react';
import type { RT } from '@/types';
import { getAllRT, createRT, updateRT, deleteRT } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, CheckCircleIcon, AlertCircleIcon } from '@/components/icons';

const RTForm: React.FC<{
  rt?: RT | null;
  onSave: (rt: Omit<RT, 'id'> | RT) => void;
  onCancel: () => void;
}> = ({ rt, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    number: rt?.number || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(rt ? { ...rt, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor RT</label>
        <input type="text" placeholder="Contoh: 01, 02" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors">Simpan</button>
      </div>
    </form>
  );
};

const AdminRtPage: React.FC = () => {
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRT, setSelectedRT] = useState<RT | null>(null);
    const [rtToDelete, setRtToDelete] = useState<RT | null>(null);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const rtData = await getAllRT();
            setRtList(rtData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (rt: Omit<RT, 'id'> | RT) => {
        try {
            if ('id' in rt) {
                await updateRT(rt.id, rt);
                setMessage({ type: 'success', text: 'Berhasil memperbarui data RT' });
            } else {
                await createRT(rt);
                setMessage({ type: 'success', text: 'Berhasil menambah RT baru' });
            }
            fetchData();
            setIsModalOpen(false);
            setSelectedRT(null);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Gagal menyimpan: ' + (error.message || 'Error server') });
        }
    };

    const handleDeleteConfirm = async (id: number) => {
        try {
            await deleteRT(id);
            setMessage({ type: 'success', text: 'Data RT berhasil dihapus' });
            fetchData();
            setRtToDelete(null);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Gagal menghapus: ' + (error.message || 'Error server') });
        }
    };

    const openFormModal = (rt: RT | null = null) => {
        setSelectedRT(rt);
        setIsModalOpen(true);
    };
    
    return (
        <div className="space-y-6">
            {/* Notification Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all animate-slide-in-right ${
                    message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                    {message.type === 'success' ? <CheckCircleIcon className="text-xl" /> : <AlertCircleIcon className="text-xl" />}
                    <p className="font-bold text-sm tracking-tight">{message.text}</p>
                </div>
            )}

             <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                 <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Manajemen Data RT</h1>
                        <p className="mt-1 text-slate-500">Tambah, edit, atau hapus data RT di Desa Rowosari.</p>
                    </div>
                    <button onClick={() => openFormModal()} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors">
                        + Tambah RT
                    </button>
                </div>
            </div>
            
             <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">ID</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Nomor RT</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500 tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200">
                             {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={3}><div className="h-6 bg-slate-200 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : rtList.map((rt) => (
                                <tr key={rt.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-slate-600">{rt.id}</td>
                                    <td className="p-4 font-semibold text-slate-800">RT {rt.number}</td>
                                    <td className="p-4">
                                        <div className="flex justify-center items-center gap-3">
                                            <button onClick={() => openFormModal(rt)} className="text-slate-500 hover:text-blue-600" title="Edit RT"><PencilIcon className="text-xl" /></button>
                                            <button onClick={() => setRtToDelete(rt)} className="text-slate-500 hover:text-red-600" title="Hapus RT"><TrashIcon className="text-xl" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedRT(null); }} title={selectedRT ? 'Edit Data RT' : 'Tambah RT Baru'}>
                <RTForm rt={selectedRT} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setSelectedRT(null); }} />
            </Modal>

            <Modal isOpen={!!rtToDelete} onClose={() => setRtToDelete(null)} title="Konfirmasi Hapus Data" size="md">
                {rtToDelete && (
                     <div>
                        <p className="text-slate-700 text-center">
                            Apakah Anda yakin ingin menghapus data RT ini?
                        </p>
                        <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                             <strong className="font-semibold text-red-800 text-lg">RT {rtToDelete.number}</strong>
                        </div>
                        <p className="text-sm text-center text-red-600">
                            Semua data Warga yang terkait akan kehilangan referensi RT.
                        </p>
                        <div className="flex justify-center gap-3 mt-6">
                            <button type="button" onClick={() => setRtToDelete(null)} className="bg-slate-200 text-slate-800 px-5 py-2 rounded-lg hover:bg-slate-300 font-semibold">
                                Batal
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleDeleteConfirm(rtToDelete.id)} 
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

export default AdminRtPage;
