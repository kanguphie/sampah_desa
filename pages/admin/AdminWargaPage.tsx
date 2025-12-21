
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT, createWarga, updateWarga, deleteWarga } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, SearchIcon, UsersIcon } from '@/components/icons';

// Form Component for Add/Edit Warga
const WargaForm: React.FC<{
  warga?: Warga | null;
  dukuhList: Dukuh[];
  rtList: RT[];
  onSave: (warga: Omit<Warga, 'id' | 'totalDebt'> | Warga) => void;
  onCancel: () => void;
}> = ({ warga, dukuhList, rtList, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: warga?.name || '',
    dukuhId: warga?.dukuhId || (dukuhList[0]?.id || 0),
    rtId: warga?.rtId || (rtList[0]?.id || 0),
    dailyFee: warga?.dailyFee || 2000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(warga ? { ...warga, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Nama Lengkap Warga</label>
        <input 
          type="text" 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" 
          placeholder="Contoh: Budi Santoso"
          required 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Dukuh / Wilayah</label>
          <select 
            value={formData.dukuhId} 
            onChange={e => setFormData({...formData, dukuhId: Number(e.target.value)})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          >
            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">RT</label>
          <select 
            value={formData.rtId} 
            onChange={e => setFormData({...formData, rtId: Number(e.target.value)})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
          >
            {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Tarif Iuran Harian</label>
        <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold">Rp</span>
            </div>
            <input 
              type="number" 
              value={formData.dailyFee} 
              onChange={e => setFormData({...formData, dailyFee: Number(e.target.value)})} 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-mono font-bold" 
              required 
            />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Batal</button>
        <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all">Simpan Perubahan</button>
      </div>
    </form>
  );
};

const AdminWargaPage: React.FC = () => {
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', dukuhId: 'all' });

    // Modals state
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
    const [wargaToDelete, setWargaToDelete] = useState<Warga | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [w, d, r] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
            setWargaList(w);
            setDukuhList(d);
            setRtList(r);
        } catch (error) {
            console.error("Failed to fetch warga data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredWarga = useMemo(() => {
        return wargaList.filter(w => {
            const matchSearch = w.name.toLowerCase().includes(filters.search.toLowerCase()) || w.id.includes(filters.search);
            const matchDukuh = filters.dukuhId === 'all' || w.dukuhId === Number(filters.dukuhId);
            return matchSearch && matchDukuh;
        });
    }, [wargaList, filters]);

    const getDukuhName = (id: number) => dukuhList.find(d => d.id === id)?.name || 'N/A';
    const getRTNumber = (id: number) => rtList.find(r => r.id === id)?.number || 'N/A';

    const handleSaveWarga = async (wargaData: Omit<Warga, 'id' | 'totalDebt'> | Warga) => {
        try {
            if ('id' in wargaData) {
                await updateWarga(wargaData.id, wargaData as Warga);
            } else {
                await createWarga(wargaData);
            }
            await fetchData();
            setIsFormModalOpen(false);
            setSelectedWarga(null);
        } catch (error) {
            alert("Gagal menyimpan data warga.");
        }
    };

    const handleDeleteConfirm = async (id: string) => {
        try {
            await deleteWarga(id);
            await fetchData();
            setWargaToDelete(null);
        } catch (error) {
            alert("Gagal menghapus data warga.");
        }
    };

    const openEditModal = (warga: Warga) => {
        setSelectedWarga(warga);
        setIsFormModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Data Warga</h1>
                    <p className="text-slate-500 text-sm mt-0.5 font-medium">Kelola profil warga dan biaya iuran tetap.</p>
                </div>
                <button 
                  onClick={() => { setSelectedWarga(null); setIsFormModalOpen(true); }}
                  className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus text-sm"></i> Tambah Warga
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau ID..." 
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                <select 
                    className="p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 text-slate-600 font-medium"
                    onChange={(e) => setFilters({...filters, dukuhId: e.target.value})}
                    value={filters.dukuhId}
                >
                    <option value="all">Semua Dukuh</option>
                    {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest">ID</th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest">Nama</th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest">Wilayah</th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest text-right">Tarif Harian</th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="p-5"><div className="h-6 bg-slate-50 rounded animate-pulse w-full"></div></td></tr>
                                ))
                            ) : filteredWarga.map(w => (
                                <tr key={w.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-5 font-mono text-slate-400 text-xs">{w.id}</td>
                                    <td className="p-5 font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{w.name}</td>
                                    <td className="p-5 text-slate-500 font-medium">RT {getRTNumber(w.rtId)}, {getDukuhName(w.dukuhId)}</td>
                                    <td className="p-5 text-right font-mono font-bold text-slate-600">
                                        Rp{w.dailyFee.toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex justify-center items-center gap-4">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); openEditModal(w); }}
                                              className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50"
                                              title="Edit Warga"
                                            >
                                                <PencilIcon className="text-xl" />
                                            </button>
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); setWargaToDelete(w); }}
                                              className="text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-rose-50"
                                              title="Hapus Warga"
                                            >
                                                <TrashIcon className="text-xl" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredWarga.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <UsersIcon className="text-3xl text-slate-200" />
                                        </div>
                                        Tidak ada data warga ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals are now robust and correctly centered */}
            <Modal 
              isOpen={isFormModalOpen} 
              onClose={() => { setIsFormModalOpen(false); setSelectedWarga(null); }} 
              title={selectedWarga ? 'Edit Data Warga' : 'Tambah Warga Baru'}
              size="lg"
            >
                <WargaForm 
                    warga={selectedWarga} 
                    dukuhList={dukuhList} 
                    rtList={rtList} 
                    onSave={handleSaveWarga} 
                    onCancel={() => { setIsFormModalOpen(false); setSelectedWarga(null); }} 
                />
            </Modal>

            <Modal isOpen={!!wargaToDelete} onClose={() => setWargaToDelete(null)} title="Hapus Data Warga" size="md">
                {wargaToDelete && (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                             <TrashIcon className="text-3xl text-rose-500"/>
                        </div>
                        <p className="text-slate-700 font-medium px-4">
                            Hapus data warga <span className="font-bold text-slate-900">"{wargaToDelete.name}"</span>?
                        </p>
                        <p className="text-xs text-slate-400 mt-2 px-6 italic">Tindakan ini permanen. Warga tidak akan muncul lagi di daftar penagihan petugas.</p>
                        <div className="mt-8 flex justify-center gap-3">
                            <button onClick={() => setWargaToDelete(null)} className="flex-1 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors border border-slate-200">Batal</button>
                            <button 
                                onClick={() => handleDeleteConfirm(wargaToDelete.id)} 
                                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminWargaPage;
