
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT, createWarga, updateWarga, deleteWarga } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, SearchIcon, QrCodeIcon, ChevronDownIcon, DownloadIcon } from '@/components/icons';
import { QRCodeSVG } from 'qrcode.react';

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

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(warga ? { ...warga, ...formData } : formData); }} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Warga</label>
        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-semibold" placeholder="Nama Warga" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dukuh</label>
          <select value={formData.dukuhId} onChange={e => setFormData({...formData, dukuhId: Number(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-semibold">
            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RT</label>
          <select value={formData.rtId} onChange={e => setFormData({...formData, rtId: Number(e.target.value)})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-semibold">
            {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tarif Iuran Harian</label>
        <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
            <input type="number" value={formData.dailyFee} onChange={e => setFormData({...formData, dailyFee: Number(e.target.value)})} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold" required />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Batal</button>
        <button type="submit" className="flex-1 py-3.5 rounded-2xl font-bold bg-primary text-white hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all">Simpan Data</button>
      </div>
    </form>
  );
};

const AdminWargaPage: React.FC = () => {
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', dukuhId: 'all', rtId: 'all' });
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
    const [qrToShow, setQrToShow] = useState<Warga | null>(null);
    const [wargaToDelete, setWargaToDelete] = useState<Warga | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [w, d, r] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
        setWargaList(w);
        setDukuhList(d);
        setRtList(r);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const sortedAndFilteredWarga = useMemo(() => {
        let items = wargaList.filter(w => {
            const matchSearch = w.name.toLowerCase().includes(filters.search.toLowerCase()) || w.id.includes(filters.search);
            const matchDukuh = filters.dukuhId === 'all' || w.dukuhId === Number(filters.dukuhId);
            const matchRT = filters.rtId === 'all' || w.rtId === Number(filters.rtId);
            return matchSearch && matchDukuh && matchRT;
        });
        return items.sort((a, b) => {
            const aVal = String(a[sortConfig.key as keyof Warga]);
            const bVal = String(b[sortConfig.key as keyof Warga]);
            return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }, [wargaList, filters, sortConfig]);

    const paginatedWarga = useMemo(() => {
        if (itemsPerPage === 'all') return sortedAndFilteredWarga;
        const start = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredWarga.slice(start, start + itemsPerPage);
    }, [sortedAndFilteredWarga, itemsPerPage, currentPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(sortedAndFilteredWarga.length / itemsPerPage);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const rows = sortedAndFilteredWarga.map(w => `<tr><td>${w.id}</td><td>${w.name}</td><td>RT ${rtList.find(r => r.id === w.rtId)?.number}, ${dukuhList.find(d => d.id === w.dukuhId)?.name}</td><td style="text-align:right">Rp${w.dailyFee.toLocaleString('id-ID')}</td></tr>`).join('');
        printWindow.document.write(`<html><head><style>body{font-family:'Plus Jakarta Sans', sans-serif;padding:40px;color:#334155;} .header{text-align:center;border-bottom:2px solid #10b981;padding-bottom:10px;margin-bottom:20px;} h1{color:#10b981;margin:0;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #e2e8f0;padding:12px;text-align:left;font-size:12px;} th{background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:10px;letter-spacing:1px;}</style></head><body><div class="header"><h1>SAPADESA</h1><p>Data Warga Desa Rowosari - Dicetak pada ${new Date().toLocaleString('id-ID')}</p></div><table><thead><tr><th>ID</th><th>Nama</th><th>Wilayah</th><th style="text-align:right">Tarif</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Data Warga</h1>
                    <p className="text-slate-500 text-sm font-medium">Manajemen profil warga dan tarif retribusi harian.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handlePrint} className="flex-1 md:flex-none bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                      <DownloadIcon /> Cetak Semua
                    </button>
                    <button onClick={() => { setSelectedWarga(null); setIsFormModalOpen(true); }} className="flex-1 md:flex-none bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all">
                      + Tambah Warga
                    </button>
                </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative md:col-span-2">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="Cari nama atau ID..." className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-semibold" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
                    </div>
                    <select className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-bold text-slate-600" onChange={e => setFilters({...filters, dukuhId: e.target.value})} value={filters.dukuhId}>
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-bold text-slate-600" onChange={e => setFilters({...filters, rtId: e.target.value})} value={filters.rtId}>
                        <option value="all">Semua RT</option>
                        {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                    </select>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tampilkan</span>
                        <select value={itemsPerPage} onChange={e => { setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20">
                            <option value={10}>10 Baris</option>
                            <option value={25}>25 Baris</option>
                            <option value={50}>50 Baris</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total {sortedAndFilteredWarga.length} Warga</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                                <th className="p-5">ID</th>
                                <th className="p-5">Nama</th>
                                <th className="p-5">Wilayah</th>
                                <th className="p-5 text-right">Tarif</th>
                                <th className="p-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedWarga.map(w => (
                                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5 text-xs font-bold text-slate-400 font-mono">{w.id}</td>
                                    <td className="p-5 font-bold text-slate-700">{w.name}</td>
                                    <td className="p-5 text-slate-500 font-medium italic text-xs">RT {rtList.find(r => r.id === w.rtId)?.number}, {dukuhList.find(d => d.id === w.dukuhId)?.name}</td>
                                    <td className="p-5 text-right font-bold text-slate-700 font-mono">Rp{w.dailyFee.toLocaleString('id-ID')}</td>
                                    <td className="p-5">
                                        <div className="flex justify-center items-center gap-1">
                                            <button onClick={() => setQrToShow(w)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="QR Code"><QrCodeIcon className="text-xl" /></button>
                                            <button onClick={() => { setSelectedWarga(w); setIsFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="Edit"><PencilIcon className="text-xl" /></button>
                                            <button onClick={() => setWargaToDelete(w)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Hapus"><TrashIcon className="text-xl" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {itemsPerPage !== 'all' && totalPages > 1 && (
                    <div className="p-5 bg-slate-50/30 border-t border-slate-100 flex justify-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-slate-400 hover:text-primary disabled:opacity-30"><i className="fa-solid fa-chevron-left"></i></button>
                        <span className="bg-primary text-white px-3 py-1 rounded-xl text-xs font-bold flex items-center">{currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-slate-400 hover:text-primary disabled:opacity-30"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                )}
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedWarga ? 'Edit Warga' : 'Tambah Warga'} size="lg">
                <WargaForm warga={selectedWarga} dukuhList={dukuhList} rtList={rtList} onSave={async (d) => { if ('id' in d) await updateWarga(d.id, d as Warga); else await createWarga(d); fetchData(); setIsFormModalOpen(false); }} onCancel={() => setIsFormModalOpen(false)} />
            </Modal>

            <Modal isOpen={!!qrToShow} onClose={() => setQrToShow(null)} title="Kartu Warga (Barcode)">
                {qrToShow && (
                    <div className="text-center py-6 flex flex-col items-center">
                        <div className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm mb-6 flex flex-col items-center w-full max-w-xs">
                            <div className="bg-emerald-500 w-full h-12 -mt-8 -mx-8 mb-6 rounded-t-[2.5rem] flex items-center justify-center">
                              <span className="text-white font-black uppercase tracking-widest text-xs">SAPADESA CARD</span>
                            </div>
                            <QRCodeSVG value={qrToShow.id} size={180} />
                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-6">{qrToShow.name}</h4>
                            <p className="text-sm font-bold text-slate-400 mt-1">ID: {qrToShow.id}</p>
                            <p className="text-xs font-medium text-slate-400 mt-4 italic bg-slate-50 px-4 py-2 rounded-full border border-slate-100">RT {rtList.find(r => r.id === qrToShow.rtId)?.number}, {dukuhList.find(d => d.id === qrToShow.dukuhId)?.name}</p>
                        </div>
                        <button onClick={() => window.print()} className="w-full py-4 rounded-2xl bg-slate-800 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-slate-900 transition-all"><DownloadIcon /> Unduh / Cetak Slip</button>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!wargaToDelete} onClose={() => setWargaToDelete(null)} title="Hapus Data">
                {wargaToDelete && (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><TrashIcon className="text-4xl text-rose-500" /></div>
                        <p className="font-bold text-slate-800 text-lg px-4">Hapus warga <span className="text-rose-600">"{wargaToDelete.name}"</span>?</p>
                        <div className="mt-10 flex gap-3 px-2">
                            <button onClick={() => setWargaToDelete(null)} className="flex-1 py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-100">Batal</button>
                            <button onClick={async () => { await deleteWarga(wargaToDelete.id); fetchData(); setWargaToDelete(null); }} className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20">Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminWargaPage;
