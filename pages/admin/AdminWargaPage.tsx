
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT, createWarga, updateWarga, deleteWarga } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, SearchIcon, UsersIcon, ChevronDownIcon, DownloadIcon } from '@/components/icons';

// Form Component remains same for structure but styled better
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Warga</label>
        <input 
          type="text" 
          value={formData.name} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
          className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-semibold" 
          placeholder="Masukkan nama lengkap"
          required 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Dukuh / Wilayah</label>
          <select 
            value={formData.dukuhId} 
            onChange={e => setFormData({...formData, dukuhId: Number(e.target.value)})}
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-semibold"
          >
            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">RT</label>
          <select 
            value={formData.rtId} 
            onChange={e => setFormData({...formData, rtId: Number(e.target.value)})}
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-semibold"
          >
            {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tarif Iuran Harian</label>
        <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold group-focus-within:text-primary transition-colors">Rp</span>
            </div>
            <input 
              type="number" 
              value={formData.dailyFee} 
              onChange={e => setFormData({...formData, dailyFee: Number(e.target.value)})} 
              className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-mono font-bold text-lg" 
              required 
            />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Batal</button>
        <button type="submit" className="flex-1 py-4 rounded-2xl font-bold bg-primary text-white hover:bg-primary-focus shadow-xl shadow-primary/20 transition-all">Simpan</button>
      </div>
    </form>
  );
};

const AdminWargaPage: React.FC = () => {
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Sorting State
    const [filters, setFilters] = useState({ search: '', dukuhId: 'all', rtId: 'all' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Warga | 'dukuh' | 'rt'; direction: 'asc' | 'desc' | null }>({ key: 'name', direction: 'asc' });
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);

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

    const getDukuhName = (id: number) => dukuhList.find(d => d.id === id)?.name || 'N/A';
    const getRTNumber = (id: number) => rtList.find(r => r.id === id)?.number || 'N/A';

    // Handle Sorting Logic
    const requestSort = (key: typeof sortConfig.key) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredWarga = useMemo(() => {
        let items = wargaList.filter(w => {
            const matchSearch = w.name.toLowerCase().includes(filters.search.toLowerCase()) || w.id.includes(filters.search);
            const matchDukuh = filters.dukuhId === 'all' || w.dukuhId === Number(filters.dukuhId);
            const matchRT = filters.rtId === 'all' || w.rtId === Number(filters.rtId);
            return matchSearch && matchDukuh && matchRT;
        });

        if (sortConfig.direction !== null) {
            items.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Warga];
                let bValue: any = b[sortConfig.key as keyof Warga];

                if (sortConfig.key === 'dukuh') {
                    aValue = getDukuhName(a.dukuhId);
                    bValue = getDukuhName(b.dukuhId);
                } else if (sortConfig.key === 'rt') {
                    aValue = Number(getRTNumber(a.rtId));
                    bValue = Number(getRTNumber(b.rtId));
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [wargaList, filters, sortConfig, dukuhList, rtList]);

    // Pagination Logic
    const paginatedWarga = useMemo(() => {
        if (itemsPerPage === 'all') return sortedAndFilteredWarga;
        const start = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredWarga.slice(start, start + itemsPerPage);
    }, [sortedAndFilteredWarga, itemsPerPage, currentPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedAndFilteredWarga.length / itemsPerPage);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableRows = sortedAndFilteredWarga.map(w => `
            <tr>
                <td>${w.id}</td>
                <td>${w.name}</td>
                <td>RT ${getRTNumber(w.rtId)}, ${getDukuhName(w.dukuhId)}</td>
                <td style="text-align: right">Rp${w.dailyFee.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Data Warga SapaDesa</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #334152; }
                        h1 { text-align: center; color: #10b981; margin-bottom: 5px; }
                        p.meta { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 30px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
                        th { background: #f8fafc; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <h1>SapaDesa - Data Warga</h1>
                    <p class="meta">Dicetak pada: ${new Date().toLocaleString('id-ID')} | Total: ${sortedAndFilteredWarga.length} Warga</p>
                    <table>
                        <thead><tr><th>ID</th><th>Nama</th><th>Wilayah</th><th style="text-align: right">Tarif</th></tr></thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const SortIcon = ({ column }: { column: typeof sortConfig.key }) => {
        if (sortConfig.key !== column) return <ChevronDownIcon className="ml-1 opacity-20" />;
        return sortConfig.direction === 'asc' 
            ? <i className="fa-solid fa-sort-up ml-1 text-primary"></i> 
            : <i className="fa-solid fa-sort-down ml-1 text-primary"></i>;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Data Warga</h1>
                    <p className="text-slate-500 text-sm mt-0.5 font-medium">Kelola profil warga dan biaya iuran tetap.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handlePrint} className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                        <DownloadIcon /> Cetak Data
                    </button>
                    <button 
                      onClick={() => { setSelectedWarga(null); setIsFormModalOpen(true); }}
                      className="flex-1 md:flex-none bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-plus text-sm"></i> Tambah
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative md:col-span-2">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau ID..." 
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 font-medium"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                <select 
                    className="px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 text-slate-600 font-bold"
                    onChange={(e) => setFilters({...filters, dukuhId: e.target.value})}
                    value={filters.dukuhId}
                >
                    <option value="all">Semua Dukuh</option>
                    {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <select 
                    className="px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50 text-slate-600 font-bold"
                    onChange={(e) => setFilters({...filters, rtId: e.target.value})}
                    value={filters.rtId}
                >
                    <option value="all">Semua RT</option>
                    {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th onClick={() => requestSort('id')} className="p-5 cursor-pointer hover:bg-slate-100 transition-colors uppercase text-[11px] font-black text-slate-400 tracking-widest">
                                    <div className="flex items-center">ID <SortIcon column="id" /></div>
                                </th>
                                <th onClick={() => requestSort('name')} className="p-5 cursor-pointer hover:bg-slate-100 transition-colors uppercase text-[11px] font-black text-slate-400 tracking-widest">
                                    <div className="flex items-center">Nama <SortIcon column="name" /></div>
                                </th>
                                <th onClick={() => requestSort('dukuh')} className="p-5 cursor-pointer hover:bg-slate-100 transition-colors uppercase text-[11px] font-black text-slate-400 tracking-widest">
                                    <div className="flex items-center">Wilayah <SortIcon column="dukuh" /></div>
                                </th>
                                <th onClick={() => requestSort('dailyFee')} className="p-5 cursor-pointer hover:bg-slate-100 transition-colors uppercase text-[11px] font-black text-slate-400 tracking-widest text-right">
                                    <div className="flex items-center justify-end">Tarif <SortIcon column="dailyFee" /></div>
                                </th>
                                <th className="p-5 uppercase text-[11px] font-black text-slate-400 tracking-widest text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={5} className="p-5"><div className="h-6 bg-slate-50 rounded animate-pulse w-full"></div></td></tr>
                                ))
                            ) : paginatedWarga.map(w => (
                                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-5 font-mono text-slate-400 text-xs">{w.id}</td>
                                    <td className="p-5 font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{w.name}</td>
                                    <td className="p-5 text-slate-500 font-medium">RT {getRTNumber(w.rtId)}, {getDukuhName(w.dukuhId)}</td>
                                    <td className="p-5 text-right font-mono font-bold text-slate-600">
                                        Rp{w.dailyFee.toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-5">
                                        <div className="flex justify-center items-center gap-4">
                                            <button onClick={() => { setSelectedWarga(w); setIsFormModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 p-2.5 rounded-xl hover:bg-indigo-50 transition-all"><PencilIcon className="text-xl" /></button>
                                            <button onClick={() => setWargaToDelete(w)} className="text-slate-400 hover:text-rose-600 p-2.5 rounded-xl hover:bg-rose-50 transition-all"><TrashIcon className="text-xl" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Size & Page Controls */}
                <div className="p-5 bg-slate-50/30 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="mr-3">Tampilkan</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => { 
                                setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value="all">Semua</option>
                        </select>
                        <span className="ml-3">Total {sortedAndFilteredWarga.length} Data</span>
                    </div>

                    {itemsPerPage !== 'all' && totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-slate-400 hover:text-primary disabled:opacity-30"
                            >
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                            <span className="bg-primary text-white px-3 py-1 rounded-lg text-sm font-bold">
                                {currentPage}
                            </span>
                            <span className="text-slate-400 text-sm font-medium mx-1">dari {totalPages}</span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-slate-400 hover:text-primary disabled:opacity-30"
                            >
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedWarga ? 'Edit Warga' : 'Tambah Warga'} size="lg">
                <WargaForm warga={selectedWarga} dukuhList={dukuhList} rtList={rtList} onSave={async (data) => {
                    if ('id' in data) await updateWarga(data.id, data as Warga);
                    else await createWarga(data);
                    fetchData();
                    setIsFormModalOpen(false);
                }} onCancel={() => setIsFormModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!wargaToDelete} onClose={() => setWargaToDelete(null)} title="Hapus Warga">
                {wargaToDelete && (
                    <div className="text-center py-4">
                        <TrashIcon className="text-5xl text-rose-500 mb-4 mx-auto" />
                        <p className="font-bold text-slate-800 text-lg">Hapus {wargaToDelete.name}?</p>
                        <p className="text-slate-500 text-sm mt-2 px-6">Data yang dihapus tidak dapat dikembalikan.</p>
                        <div className="mt-8 flex gap-3">
                            <button onClick={() => setWargaToDelete(null)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl">Batal</button>
                            <button onClick={async () => { await deleteWarga(wargaToDelete.id); fetchData(); setWargaToDelete(null); }} className="flex-1 py-3 font-bold bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">Ya, Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminWargaPage;
