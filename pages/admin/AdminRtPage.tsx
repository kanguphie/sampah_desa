import React, { useState, useEffect } from 'react';
import type { RT, Dukuh } from '@/types';
import { getAllRT, createRT, updateRT, deleteRT, getAllDukuh } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon } from '@/components/icons';

const RTForm: React.FC<{
  rt?: RT | null;
  onSave: (rt: Omit<RT, 'id'> | RT) => void;
  onCancel: () => void;
  dukuhList: Dukuh[];
}> = ({ rt, onSave, onCancel, dukuhList }) => {
  const [formData, setFormData] = useState({
    number: rt?.number || '',
    dukuhId: rt?.dukuhId || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.dukuhId === 0) return; // Prevent saving without a Dukuh
    onSave(rt ? { ...rt, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor RT</label>
        <input type="text" placeholder="Contoh: 01, 02" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
       <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Dukuh</label>
        <select value={formData.dukuhId} onChange={e => setFormData({...formData, dukuhId: Number(e.target.value)})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required>
          <option value={0} disabled>Pilih Dukuh</option>
          {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
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
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRT, setSelectedRT] = useState<RT | null>(null);
    const [rtToDelete, setRtToDelete] = useState<RT | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rtData, dukuhData] = await Promise.all([getAllRT(), getAllDukuh()]);
            setRtList(rtData);
            setDukuhList(dukuhData);
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
        if ('id' in rt) {
            await updateRT(rt.id, rt);
        } else {
            await createRT(rt);
        }
        fetchData();
        setIsModalOpen(false);
        setSelectedRT(null);
    };

    const handleDeleteConfirm = async (id: number) => {
        await deleteRT(id);
        fetchData();
        setRtToDelete(null);
    };

    const openFormModal = (rt: RT | null = null) => {
        setSelectedRT(rt);
        setIsModalOpen(true);
    };
    
    const getDukuhName = (dukuhId: number) => {
        return dukuhList.find(d => d.id === dukuhId)?.name || 'N/A';
    }

    return (
        <div className="space-y-6">
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
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Dukuh</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500 tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200">
                             {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="p-4" colSpan={4}><div className="h-6 bg-slate-200 rounded animate-pulse"></div></td>
                                    </tr>
                                ))
                            ) : rtList.map((rt) => (
                                <tr key={rt.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-slate-600">{rt.id}</td>
                                    <td className="p-4 font-semibold text-slate-800">RT {rt.number}</td>
                                    <td className="p-4 text-slate-600">{getDukuhName(rt.dukuhId)}</td>
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
                <RTForm rt={selectedRT} onSave={handleSave} onCancel={() => { setIsModalOpen(false); setSelectedRT(null); }} dukuhList={dukuhList} />
            </Modal>

            <Modal isOpen={!!rtToDelete} onClose={() => setRtToDelete(null)} title="Konfirmasi Hapus Data" size="md">
                {rtToDelete && (
                     <div>
                        <p className="text-slate-700 text-center">
                            Apakah Anda yakin ingin menghapus data RT ini?
                        </p>
                        <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                             <strong className="font-semibold text-red-800 text-lg">RT {rtToDelete.number} - {getDukuhName(rtToDelete.dukuhId)}</strong>
                        </div>
                        <p className="text-sm text-center text-red-600">
                            Semua data Warga yang terkait akan ikut terhapus permanen.
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