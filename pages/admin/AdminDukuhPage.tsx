
import React, { useState, useEffect, useMemo } from 'react';
import type { Dukuh, RT } from '@/types';
import { getAllDukuh, createDukuh, updateDukuh, deleteDukuh, getAllRT, createRT, updateRT, deleteRT } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, ChevronDownIcon } from '@/components/icons';

// --- COMPONENTS: Forms ---

const DukuhForm: React.FC<{
  dukuh?: Dukuh | null;
  onSave: (dukuh: Omit<Dukuh, 'id'> | Dukuh) => void;
  onCancel: () => void;
}> = ({ dukuh, onSave, onCancel }) => {
  const [name, setName] = useState(dukuh?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(dukuh ? { ...dukuh, name } : { name });
  };

  return (
     <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Dukuh</label>
        <input type="text" placeholder="Contoh: Rowosari" value={name} onChange={e => setName(e.target.value)} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors">Simpan</button>
      </div>
    </form>
  );
};

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
    if (!formData.number.trim()) return;
    onSave(rt ? { ...rt, ...formData } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nomor RT</label>
        <input type="text" placeholder="Contoh: 01, 02" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="p-2.5 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-primary focus:border-primary" required />
        <p className="text-xs text-slate-500 mt-1">Nomor RT ini bersifat global dan dapat digunakan di dukuh manapun.</p>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors">Simpan</button>
      </div>
    </form>
  );
};

// --- MAIN PAGE ---

const AdminWilayahPage: React.FC = () => {
    // State for Dukuh
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [isDukuhModalOpen, setIsDukuhModalOpen] = useState(false);
    const [selectedDukuh, setSelectedDukuh] = useState<Dukuh | null>(null);
    const [dukuhToDelete, setDukuhToDelete] = useState<Dukuh | null>(null);
    // Pagination Dukuh
    const [dukuhPage, setDukuhPage] = useState(1);
    const [dukuhLimit, setDukuhLimit] = useState<number | 'all'>(10);

    // State for RT
    const [rtList, setRtList] = useState<RT[]>([]);
    const [isRtModalOpen, setIsRtModalOpen] = useState(false);
    const [selectedRT, setSelectedRT] = useState<RT | null>(null);
    const [rtToDelete, setRtToDelete] = useState<RT | null>(null);
    // Pagination RT
    const [rtPage, setRtPage] = useState(1);
    const [rtLimit, setRtLimit] = useState<number | 'all'>(10);

    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dukuhData, rtData] = await Promise.all([getAllDukuh(), getAllRT()]);
            setDukuhList(dukuhData);
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

    // --- Pagination Logic Dukuh ---
    const paginatedDukuh = useMemo(() => {
        if (dukuhLimit === 'all') return dukuhList;
        const startIndex = (dukuhPage - 1) * dukuhLimit;
        return dukuhList.slice(startIndex, startIndex + dukuhLimit);
    }, [dukuhList, dukuhPage, dukuhLimit]);
    const totalDukuhPages = dukuhLimit === 'all' ? 1 : Math.ceil(dukuhList.length / dukuhLimit);

    // --- Pagination Logic RT ---
    const paginatedRt = useMemo(() => {
        if (rtLimit === 'all') return rtList;
        const startIndex = (rtPage - 1) * rtLimit;
        return rtList.slice(startIndex, startIndex + rtLimit);
    }, [rtList, rtPage, rtLimit]);
    const totalRtPages = rtLimit === 'all' ? 1 : Math.ceil(rtList.length / rtLimit);


    // --- Handlers: Dukuh ---
    const handleSaveDukuh = async (dukuh: Omit<Dukuh, 'id'> | Dukuh) => {
        if ('id' in dukuh) {
            await updateDukuh(dukuh.id, dukuh);
        } else {
            await createDukuh(dukuh);
        }
        fetchData();
        setIsDukuhModalOpen(false);
        setSelectedDukuh(null);
    };

    const handleDeleteDukuhConfirm = async (id: number) => {
        await deleteDukuh(id);
        fetchData();
        setDukuhToDelete(null);
    };

    const openDukuhModal = (dukuh: Dukuh | null = null) => {
        setSelectedDukuh(dukuh);
        setIsDukuhModalOpen(true);
    };

    // --- Handlers: RT ---
    const handleSaveRT = async (rt: Omit<RT, 'id'> | RT) => {
        if ('id' in rt) {
            await updateRT(rt.id, rt);
        } else {
            await createRT(rt);
        }
        fetchData();
        setIsRtModalOpen(false);
        setSelectedRT(null);
    };

    const handleDeleteRTConfirm = async (id: number) => {
        await deleteRT(id);
        fetchData();
        setRtToDelete(null);
    };

    const openRtModal = (rt: RT | null = null) => {
        setSelectedRT(rt);
        setIsRtModalOpen(true);
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                 <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Manajemen Data Wilayah</h1>
                        <p className="mt-1 text-slate-500">Kelola data Dukuh dan Master Data RT.</p>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* --- KOLOM KIRI: DATA DUKUH --- */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                             <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm">D</span>
                             Daftar Dukuh
                        </h2>
                        <button onClick={() => openDukuhModal()} className="text-sm bg-primary text-white font-semibold px-3 py-2 rounded-lg hover:bg-primary-focus transition-colors shadow-sm">
                            + Dukuh
                        </button>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500">Nama Dukuh</th>
                                        <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500 w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                     {loading ? (
                                        <tr><td colSpan={2} className="p-4 text-center text-slate-400">Memuat...</td></tr>
                                    ) : paginatedDukuh.length > 0 ? (
                                        paginatedDukuh.map((dukuh) => (
                                        <tr 
                                            key={dukuh.id} 
                                            className="hover:bg-slate-50 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="font-semibold text-slate-800">{dukuh.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">ID: {dukuh.id}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button onClick={() => openDukuhModal(dukuh)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><PencilIcon className="text-lg" /></button>
                                                    <button onClick={() => setDukuhToDelete(dukuh)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="text-lg" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={2} className="p-6 text-center text-slate-400 italic">Belum ada data Dukuh.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls Dukuh */}
                        {!loading && dukuhList.length > 0 && (
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center text-xs text-slate-600">
                                    <select
                                        value={dukuhLimit}
                                        onChange={(e) => setDukuhLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                        className="border border-slate-300 rounded px-1 py-1 focus:outline-none bg-white mr-2"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value="all">Semua</option>
                                    </select>
                                    <span>Data (Total: {dukuhList.length})</span>
                                </div>
                                {dukuhLimit !== 'all' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDukuhPage(prev => Math.max(prev - 1, 1))}
                                            disabled={dukuhPage === 1}
                                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            Prev
                                        </button>
                                        <span className="text-xs font-medium text-slate-600">
                                            {dukuhPage} / {totalDukuhPages}
                                        </span>
                                        <button
                                            onClick={() => setDukuhPage(prev => Math.min(prev + 1, totalDukuhPages))}
                                            disabled={dukuhPage === totalDukuhPages}
                                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- KOLOM KANAN: DATA RT (MASTER) --- */}
                <div className="space-y-4">
                     <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                             <span className="bg-sky-500 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm">R</span>
                             Master Data RT
                        </h2>
                        <button 
                            onClick={() => openRtModal()} 
                            className="text-sm bg-sky-500 text-white font-semibold px-3 py-2 rounded-lg hover:bg-sky-600 transition-colors shadow-sm"
                        >
                            + RT Baru
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500">Nomor RT</th>
                                        <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500 w-24">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {loading ? (
                                         <tr><td colSpan={2} className="p-4 text-center text-slate-400">Memuat...</td></tr>
                                    ) : paginatedRt.length > 0 ? (
                                        paginatedRt.map((rt) => (
                                            <tr key={rt.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-semibold text-slate-800">RT {rt.number}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button onClick={() => openRtModal(rt)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"><PencilIcon className="text-lg" /></button>
                                                        <button onClick={() => setRtToDelete(rt)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><TrashIcon className="text-lg" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={2} className="p-8 text-center text-slate-500">Belum ada data Master RT.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Controls RT */}
                        {!loading && rtList.length > 0 && (
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center text-xs text-slate-600">
                                    <select
                                        value={rtLimit}
                                        onChange={(e) => setRtLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                        className="border border-slate-300 rounded px-1 py-1 focus:outline-none bg-white mr-2"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value="all">Semua</option>
                                    </select>
                                    <span>Data (Total: {rtList.length})</span>
                                </div>
                                {rtLimit !== 'all' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setRtPage(prev => Math.max(prev - 1, 1))}
                                            disabled={rtPage === 1}
                                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            Prev
                                        </button>
                                        <span className="text-xs font-medium text-slate-600">
                                            {rtPage} / {totalRtPages}
                                        </span>
                                        <button
                                            onClick={() => setRtPage(prev => Math.min(prev + 1, totalRtPages))}
                                            disabled={rtPage === totalRtPages}
                                            className="px-2 py-1 border border-slate-300 rounded bg-white text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 italic text-center">* Data RT bersifat global dan tidak terikat pada dukuh tertentu di tabel ini.</p>
                </div>
            </div>

            {/* --- MODALS --- */}
            
            <Modal isOpen={isDukuhModalOpen} onClose={() => { setIsDukuhModalOpen(false); setSelectedDukuh(null); }} title={selectedDukuh ? 'Edit Data Dukuh' : 'Tambah Dukuh Baru'}>
                <DukuhForm dukuh={selectedDukuh} onSave={handleSaveDukuh} onCancel={() => { setIsDukuhModalOpen(false); setSelectedDukuh(null); }} />
            </Modal>
            
            <Modal isOpen={!!dukuhToDelete} onClose={() => setDukuhToDelete(null)} title="Hapus Dukuh" size="md">
                {dukuhToDelete && (
                    <div>
                        <p className="text-slate-700 text-center">Hapus Dukuh <strong>{dukuhToDelete.name}</strong>?</p>
                         <p className="text-xs text-center text-red-600 mt-2 bg-red-50 p-2 rounded border border-red-100">PERHATIAN: Data Warga yang terhubung ke dukuh ini akan kehilangan referensi wilayahnya!</p>
                        <div className="flex justify-center gap-3 mt-6">
                            <button onClick={() => setDukuhToDelete(null)} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold">Batal</button>
                            <button onClick={() => handleDeleteDukuhConfirm(dukuhToDelete.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isRtModalOpen} onClose={() => { setIsRtModalOpen(false); setSelectedRT(null); }} title={selectedRT ? 'Edit Master Data RT' : 'Tambah Master RT'}>
                <RTForm 
                    rt={selectedRT} 
                    onSave={handleSaveRT} 
                    onCancel={() => { setIsRtModalOpen(false); setSelectedRT(null); }} 
                />
            </Modal>

            <Modal isOpen={!!rtToDelete} onClose={() => setRtToDelete(null)} title="Hapus Master RT" size="md">
                {rtToDelete && (
                     <div>
                        <p className="text-slate-700 text-center">Hapus <strong>RT {rtToDelete.number}</strong> dari Master Data?</p>
                        <p className="text-xs text-center text-red-600 mt-4 bg-red-50 p-2 rounded border border-red-100">PERHATIAN: Semua Warga di semua Dukuh yang menggunakan nomor RT ini akan kehilangan referensi RT-nya!</p>
                        <div className="flex justify-center gap-3 mt-6">
                            <button onClick={() => setRtToDelete(null)} className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-semibold">Batal</button>
                            <button onClick={() => handleDeleteRTConfirm(rtToDelete.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminWilayahPage;
