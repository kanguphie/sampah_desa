
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT, createWarga, updateWarga, deleteWarga, bulkCreateWarga, bulkDeleteWarga } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, SearchIcon, QrCodeIcon, DownloadIcon, UploadIcon, FileExcelIcon, CheckCircleIcon, XIcon, AlertCircleIcon } from '@/components/icons';
import { QRCodeSVG } from 'qrcode.react';
import { exportToExcel, readWargaExcel } from '@/services/excel';
import { useVillageProfile } from '@/context/VillageProfileContext';

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
    billingType: (warga?.billingType || 'HARIAN') as 'HARIAN' | 'BULANAN',
    dailyFee: warga?.dailyFee !== undefined ? warga.dailyFee : 2000,
    monthlyFee: warga?.monthlyFee !== undefined ? warga.monthlyFee : 25000,
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
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metode & Frekuensi Pembayaran</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData({...formData, billingType: 'HARIAN'})}
            className={`p-4 rounded-2xl border text-left transition-all ${formData.billingType === 'HARIAN' ? 'bg-primary/5 border-primary ring-2 ring-primary/20 text-primary' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide mb-1">
              <span className={`w-3 h-3 rounded-full border-2 ${formData.billingType === 'HARIAN' ? 'border-primary bg-primary' : 'border-slate-300'}`}></span>
              Harian (Per Ambil)
            </div>
            <p className="text-[11px] text-slate-500">Iuran ditarik setiap jadwal sampah diambil (2 hari sekali).</p>
          </button>

          <button
            type="button"
            onClick={() => setFormData({...formData, billingType: 'BULANAN'})}
            className={`p-4 rounded-2xl border text-left transition-all ${formData.billingType === 'BULANAN' ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wide mb-1">
              <span className={`w-3 h-3 rounded-full border-2 ${formData.billingType === 'BULANAN' ? 'border-purple-600 bg-purple-600' : 'border-slate-300'}`}></span>
              Bulanan (Tetap)
            </div>
            <p className="text-[11px] text-slate-500">Iuran dibayar sebulan sekali dengan nominal tarif paket tertentu.</p>
          </button>
        </div>
      </div>

      {formData.billingType === 'HARIAN' ? (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tarif Per Pengambilan (2 Hari Sekali)</label>
          <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
              <input type="number" value={formData.dailyFee} onChange={e => setFormData({...formData, dailyFee: Number(e.target.value)})} className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold" placeholder="2000" required />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1">Tarif Iuran Bulanan (Sebulan Sekali)</label>
          <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-purple-400">Rp</span>
              <input type="number" value={formData.monthlyFee} onChange={e => setFormData({...formData, monthlyFee: Number(e.target.value)})} className="w-full pl-12 pr-5 py-3.5 bg-purple-50/50 border border-purple-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-purple-900" placeholder="25000" required />
          </div>
          <p className="text-[11px] text-slate-400 ml-1 italic">Warga bulanan tidak ditarik iuran setiap 2 hari sekali, melainkan satu kali per bulan.</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Batal</button>
        <button type="submit" className="flex-1 py-3.5 rounded-2xl font-bold bg-primary text-white hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all">Simpan Data</button>
      </div>
    </form>
  );
};

const AdminWargaPage: React.FC = () => {
    const { profile } = useVillageProfile();
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    
    // States for Import Modal
    const [importLoading, setImportLoading] = useState(false);
    const [importReview, setImportReview] = useState<{
        valid: Partial<Warga>[],
        invalidCount: number,
        total: number,
        idErrors: boolean
    } | null>(null);

    const [filters, setFilters] = useState({ search: '', dukuhId: 'all', rtId: 'all', billingType: 'all' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Warga | 'address'; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedWarga, setSelectedWarga] = useState<Warga | null>(null);
    const [qrToShow, setQrToShow] = useState<Warga | null>(null);
    const [wargaToDelete, setWargaToDelete] = useState<Warga | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Multi-selection & Bulk Delete states
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [w, d, r] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
            setWargaList(w);
            setDukuhList(d);
            setRtList(r);
        } catch (err) {
            console.error("Error loading data", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSort = (key: keyof Warga | 'address') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredWarga = useMemo(() => {
        let items = wargaList.filter(w => {
            const matchSearch = (w.name || '').toLowerCase().includes(filters.search.toLowerCase()) || (w.id || '').includes(filters.search);
            const matchDukuh = filters.dukuhId === 'all' || w.dukuhId === Number(filters.dukuhId);
            const matchRT = filters.rtId === 'all' || w.rtId === Number(filters.rtId);
            const matchBilling = filters.billingType === 'all' || (w.billingType || 'HARIAN') === filters.billingType;
            return matchSearch && matchDukuh && matchRT && matchBilling;
        });

        return items.sort((a, b) => {
            let aVal: any, bVal: any;
            if (sortConfig.key === 'address') {
                const dukuhA = dukuhList.find(d => d.id === a.dukuhId)?.name || '';
                const dukuhB = dukuhList.find(d => d.id === b.dukuhId)?.name || '';
                aVal = dukuhA + (rtList.find(r => r.id === a.rtId)?.number || '');
                bVal = dukuhB + (rtList.find(r => r.id === b.rtId)?.number || '');
            } else {
                aVal = a[sortConfig.key as keyof Warga];
                bVal = b[sortConfig.key as keyof Warga];
            }

            if (typeof aVal === 'string') {
                return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [wargaList, filters, sortConfig, dukuhList, rtList]);

    const paginatedWarga = useMemo(() => {
        if (itemsPerPage === 'all') return sortedAndFilteredWarga;
        const start = (currentPage - 1) * (itemsPerPage as number);
        return sortedAndFilteredWarga.slice(start, start + (itemsPerPage as number));
    }, [sortedAndFilteredWarga, itemsPerPage, currentPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(sortedAndFilteredWarga.length / (itemsPerPage as number)));

    // Ensure current page is within valid range when data changes
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    const getPaginationRange = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages: (number | string)[] = [];
        if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, '...', totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
        return pages;
    };

    // --- SELECTION & BULK ACTIONS LOGIC ---
    const isAllPageSelected = paginatedWarga.length > 0 && paginatedWarga.every(w => selectedIds.includes(w.id));
    const isSomePageSelected = paginatedWarga.some(w => selectedIds.includes(w.id)) && !isAllPageSelected;

    useEffect(() => {
        if (headerCheckboxRef.current) {
            headerCheckboxRef.current.indeterminate = isSomePageSelected;
        }
    }, [isSomePageSelected]);

    const handleToggleSelectPage = () => {
        if (isAllPageSelected) {
            const pageIds = new Set(paginatedWarga.map(w => w.id));
            setSelectedIds(prev => prev.filter(id => !pageIds.has(id)));
        } else {
            const pageIds = paginatedWarga.map(w => w.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const handleToggleSelectOne = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllFiltered = () => {
        setSelectedIds(sortedAndFilteredWarga.map(w => w.id));
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
    };

    const handleConfirmBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        setBulkDeleting(true);
        try {
            await bulkDeleteWarga(selectedIds);
            const count = selectedIds.length;
            setSelectedIds([]);
            setIsBulkDeleteModalOpen(false);
            setMessage({ type: 'success', text: `${count} data warga berhasil dihapus massal.` });
            await fetchData();
        } catch (err: any) {
            console.error("Gagal hapus massal warga", err);
            setMessage({ type: 'error', text: 'Gagal menghapus data warga secara massal.' });
        } finally {
            setBulkDeleting(false);
        }
    };

    // --- IMPORT LOGIC ---

    const handleDownloadTemplate = () => {
        const templateData = [
            { "Nama": "Budi Santoso", "Tipe Pembayaran": "HARIAN", "Tarif": 2000, "Tarif Bulanan": 0, "Kode Dukuh": 1, "Kode RT": 1 },
            { "Nama": "Siti Aminah", "Tipe Pembayaran": "BULANAN", "Tarif": 0, "Tarif Bulanan": 25000, "Kode Dukuh": 1, "Kode RT": 2 },
        ];
        exportToExcel(templateData, "Template_Warga_Rowosari", "DataWarga");
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setImportLoading(true);
        try {
            const rawData = await readWargaExcel(file);
            
            const valid: Partial<Warga>[] = [];
            let invalidCount = 0;
            let foundIdErrors = false;

            // Buat Set ID wilayah yang ada di sistem untuk pencarian cepat (O(1))
            const existingDukuhIds = new Set(dukuhList.map(d => d.id));
            const existingRtIds = new Set(rtList.map(r => r.id));

            rawData.forEach(row => {
                const hasName = !!row.name && row.name.toString().trim().length >= 1;
                const hasFee = row.dailyFee !== undefined && !isNaN(Number(row.dailyFee));
                
                // Cek apakah ID wilayah ada di sistem (database)
                const dId = Number(row.dukuhId);
                const rId = Number(row.rtId);
                const isDukuhValid = !isNaN(dId) && existingDukuhIds.has(dId);
                const isRtValid = !isNaN(rId) && existingRtIds.has(rId);
                
                if (hasName && hasFee && isDukuhValid && isRtValid) {
                    valid.push(row as any);
                } else {
                    invalidCount++;
                    if (!isDukuhValid || !isRtValid) foundIdErrors = true;
                }
            });

            setImportReview({
                valid,
                invalidCount,
                total: rawData.length,
                idErrors: foundIdErrors
            });
        } catch (err: any) { 
            const errorMsg = err instanceof Error ? err.message : String(err);
            setMessage({ type: 'error', text: "Gagal membaca Excel: " + errorMsg }); 
        } finally { 
            setImportLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const confirmImport = async () => {
        if (!importReview || importReview.valid.length === 0) return;
        
        setImportLoading(true);
        try {
            await bulkCreateWarga(importReview.valid);
            await fetchData();
            setMessage({ type: 'success', text: `Berhasil mengimpor ${importReview.valid.length} warga.` });
            setImportReview(null);
        } catch (err: any) {
            console.error("Confirm Import Error:", err);
            // Pastikan error dikonversi ke string agar tidak tampil [object Object]
            const msg = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
            setMessage({ type: 'error', text: "Gagal menyimpan ke database:\n" + msg });
        } finally {
            setImportLoading(false);
        }
    };

    const SortIcon = ({ col }: { col: keyof Warga | 'address' }) => {
        if (sortConfig.key !== col) return <i className="fa-solid fa-sort opacity-20 ml-1"></i>;
        return sortConfig.direction === 'asc' 
            ? <i className="fa-solid fa-arrow-up-z-a text-primary ml-1"></i> 
            : <i className="fa-solid fa-arrow-down-z-a text-primary ml-1"></i>;
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Data Warga</h1>
                    <p className="text-slate-500 text-sm font-medium">Manajemen profil warga desa Rowosari.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".xlsx, .xls" className="hidden" />
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={() => setIsBulkDeleteModalOpen(true)} 
                            className="flex-1 md:flex-none bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-rose-600/20 animate-slide-in-up"
                        >
                            <TrashIcon /> Hapus Massal ({selectedIds.length})
                        </button>
                    )}
                    <button onClick={handleDownloadTemplate} className="flex-1 md:flex-none bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 border border-slate-200 text-xs">
                        <FileExcelIcon className="text-emerald-500" /> Template
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={importLoading} className="flex-1 md:flex-none bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2 text-xs">
                        <UploadIcon /> {importLoading ? 'Membaca...' : 'Import Excel'}
                    </button>
                    <button onClick={() => { setSelectedWarga(null); setIsFormModalOpen(true); }} className="flex-1 md:flex-none bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all text-sm">
                      + Tambah Warga
                    </button>
                </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="relative md:col-span-2">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari nama atau ID..." 
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-semibold text-sm" 
                            value={filters.search} 
                            onChange={e => { setFilters({...filters, search: e.target.value}); setCurrentPage(1); }} 
                        />
                    </div>
                    <select 
                        className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-bold text-slate-600 text-xs" 
                        onChange={e => { setFilters({...filters, dukuhId: e.target.value}); setCurrentPage(1); }} 
                        value={filters.dukuhId}
                    >
                        <option value="all">Semua Dukuh</option>
                        {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select 
                        className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-bold text-slate-600 text-xs" 
                        onChange={e => { setFilters({...filters, rtId: e.target.value}); setCurrentPage(1); }} 
                        value={filters.rtId}
                    >
                        <option value="all">Semua RT</option>
                        {rtList.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                    </select>
                    <select 
                        className="px-4 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none bg-slate-50 font-bold text-slate-600 text-xs" 
                        onChange={e => { setFilters({...filters, billingType: e.target.value}); setCurrentPage(1); }} 
                        value={filters.billingType}
                    >
                        <option value="all">Semua Pembayaran</option>
                        <option value="HARIAN">Harian (2 Hari Sekali)</option>
                        <option value="BULANAN">Bulanan (Sebulan Sekali)</option>
                    </select>
                </div>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Baris Per Halaman</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={e => { setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }} 
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Ditemukan <span className="text-slate-700 font-black">{sortedAndFilteredWarga.length}</span> Warga
                    </p>
                </div>
            </div>

            {/* BULK SELECTION ACTION BAR */}
            {selectedIds.length > 0 && (
                <div className="bg-slate-900 text-white p-4 px-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl shadow-slate-900/10 border border-slate-800 animate-slide-in-up">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">
                            {selectedIds.length}
                        </span>
                        <div>
                            <p className="text-xs font-black text-white uppercase tracking-wider">
                                {selectedIds.length} Warga Dipilih
                            </p>
                            <p className="text-[11px] text-slate-400">
                                {selectedIds.length === sortedAndFilteredWarga.length 
                                    ? 'Semua data hasil filter telah dipilih' 
                                    : `${selectedIds.length} dari ${sortedAndFilteredWarga.length} warga hasil filter dipilih`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                        {selectedIds.length < sortedAndFilteredWarga.length && (
                            <button
                                type="button"
                                onClick={handleSelectAllFiltered}
                                className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all"
                            >
                                Pilih Semua ({sortedAndFilteredWarga.length} Warga)
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleClearSelection}
                            className="text-xs font-bold text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl hover:bg-slate-800 transition-all"
                        >
                            Batal Pilih
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                        >
                            <TrashIcon className="text-sm" />
                            Hapus Massal ({selectedIds.length})
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 font-bold text-slate-400 uppercase text-[10px] tracking-widest">
                                <th className="p-5 w-12 text-center">
                                    <div className="flex items-center justify-center">
                                        <input 
                                            ref={headerCheckboxRef}
                                            type="checkbox"
                                            checked={isAllPageSelected}
                                            onChange={handleToggleSelectPage}
                                            title={isAllPageSelected ? 'Batal pilih semua di halaman ini' : 'Pilih semua di halaman ini'}
                                            className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-all accent-emerald-600"
                                        />
                                    </div>
                                </th>
                                <th onClick={() => handleSort('id')} className="p-5 cursor-pointer hover:text-primary transition-colors whitespace-nowrap">ID <SortIcon col="id" /></th>
                                <th onClick={() => handleSort('name')} className="p-5 cursor-pointer hover:text-primary transition-colors">Nama Lengkap <SortIcon col="name" /></th>
                                <th onClick={() => handleSort('address')} className="p-5 cursor-pointer hover:text-primary transition-colors">Wilayah (RT/Dukuh) <SortIcon col="address" /></th>
                                <th onClick={() => handleSort('dailyFee')} className="p-5 text-right cursor-pointer hover:text-primary transition-colors whitespace-nowrap">Tipe & Tarif <SortIcon col="dailyFee" /></th>
                                <th className="p-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={6} className="p-10 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest text-xs">Memuat data Warga...</td></tr> : 
                            paginatedWarga.length === 0 ? (
                                <tr><td colSpan={6} className="p-10 text-center font-bold text-slate-400 text-xs italic">Tidak ada data warga yang cocok dengan filter.</td></tr>
                            ) :
                            paginatedWarga.map(w => {
                                const isBulanan = w.billingType === 'BULANAN';
                                const isSelected = selectedIds.includes(w.id);
                                return (
                                    <tr key={w.id} className={`transition-colors ${isSelected ? 'bg-emerald-50/50 hover:bg-emerald-50/80' : 'hover:bg-slate-50/50'}`}>
                                        <td className="p-5 w-12 text-center" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-center">
                                                <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelectOne(w.id)}
                                                    className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 focus:ring-2 cursor-pointer transition-all accent-emerald-600"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-5 text-xs font-bold text-slate-400 font-mono tracking-tighter">{(w.id || 'N/A')}</td>
                                        <td className="p-5">
                                            <p className="font-bold text-slate-800">{(w.name || 'Warga Tanpa Nama')}</p>
                                            {w.totalDebt && w.totalDebt > 0 ? (
                                                <span className="inline-block mt-0.5 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                                                    Tunggakan: Rp{w.totalDebt.toLocaleString('id-ID')}
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="p-5 text-slate-500 font-medium text-xs">RT {rtList.find(r => r.id === w.rtId)?.number || '?'}, {dukuhList.find(d => d.id === w.dukuhId)?.name || '?'}</td>
                                        <td className="p-5 text-right">
                                            {isBulanan ? (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="inline-block px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        Bulanan
                                                    </span>
                                                    <span className="font-mono font-black text-slate-800 text-sm">
                                                        Rp{(w.monthlyFee || 0).toLocaleString('id-ID')}<span className="text-[10px] font-normal text-slate-400">/bln</span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                        Harian
                                                    </span>
                                                    <span className="font-mono font-black text-slate-800 text-sm">
                                                        Rp{(w.dailyFee || 0).toLocaleString('id-ID')}<span className="text-[10px] font-normal text-slate-400">/ambil</span>
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex justify-center items-center gap-1">
                                                <button onClick={() => setQrToShow(w)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="QR Code"><QrCodeIcon className="text-xl" /></button>
                                                <button onClick={() => { setSelectedWarga(w); setIsFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" title="Edit"><PencilIcon className="text-xl" /></button>
                                                <button onClick={() => setWargaToDelete(w)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Hapus"><TrashIcon className="text-xl" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                {sortedAndFilteredWarga.length > 0 && (
                    <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Left: Info data */}
                        <div className="text-xs font-semibold text-slate-500 text-center md:text-left">
                            Menampilkan <span className="font-bold text-slate-800">
                                {itemsPerPage === 'all' ? 1 : Math.min((currentPage - 1) * (itemsPerPage as number) + 1, sortedAndFilteredWarga.length)}
                            </span> - <span className="font-bold text-slate-800">
                                {itemsPerPage === 'all' ? sortedAndFilteredWarga.length : Math.min(currentPage * (itemsPerPage as number), sortedAndFilteredWarga.length)}
                            </span> dari <span className="font-bold text-slate-800">{sortedAndFilteredWarga.length}</span> warga
                            {itemsPerPage !== 'all' && totalPages > 1 && (
                                <span className="ml-2 text-slate-400">
                                    (Halaman <strong className="text-slate-700">{currentPage}</strong> dari <strong className="text-slate-700">{totalPages}</strong>)
                                </span>
                            )}
                        </div>

                        {/* Right: Pagination Controls */}
                        {itemsPerPage !== 'all' && totalPages > 1 && (
                            <div className="flex items-center flex-wrap justify-center gap-1.5">
                                {/* First Page */}
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    title="Halaman Pertama"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <i className="fa-solid fa-angles-left"></i>
                                </button>

                                {/* Prev Page */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    title="Halaman Sebelumnya"
                                    className="px-2.5 h-8 rounded-xl flex items-center justify-center gap-1 font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                                    <span className="hidden sm:inline">Prev</span>
                                </button>

                                {/* Numbered Pages */}
                                {getPaginationRange().map((page, idx) => {
                                    if (page === '...') {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-400 select-none">
                                                ...
                                            </span>
                                        );
                                    }
                                    const isCurrent = page === currentPage;
                                    return (
                                        <button
                                            key={`page-${page}`}
                                            onClick={() => setCurrentPage(Number(page))}
                                            className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                                isCurrent 
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105' 
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                {/* Next Page */}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    title="Halaman Selanjutnya"
                                    className="px-2.5 h-8 rounded-xl flex items-center justify-center gap-1 font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                                </button>

                                {/* Last Page */}
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    title="Halaman Terakhir"
                                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
                                >
                                    <i className="fa-solid fa-angles-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL: FORM ADD/EDIT */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedWarga ? 'Edit Warga' : 'Tambah Warga'} size="lg">
                <WargaForm warga={selectedWarga} dukuhList={dukuhList} rtList={rtList} onSave={async (d) => { if ('id' in d) await updateWarga(d.id, d as Warga); else await createWarga(d); fetchData(); setIsFormModalOpen(false); }} onCancel={() => setIsFormModalOpen(false)} />
            </Modal>

            {/* MODAL: REVIEW IMPORT EXCEL */}
            <Modal isOpen={!!importReview} onClose={() => setImportReview(null)} title="Review Import Excel" size="lg">
                {importReview && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Baris</p>
                                <p className="text-2xl font-black text-slate-800">{importReview.total}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Siap Impor</p>
                                <p className="text-2xl font-black text-emerald-700">{importReview.valid.length}</p>
                            </div>
                            <div className="bg-rose-50 p-4 rounded-2xl text-center border border-rose-100">
                                <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Dilewati</p>
                                <p className="text-2xl font-black text-rose-700">{importReview.invalidCount}</p>
                            </div>
                        </div>

                        {(importReview.invalidCount > 0 || importReview.idErrors) && (
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                                <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-1"></i>
                                <div>
                                    <p className="text-xs text-amber-800 leading-relaxed font-bold uppercase mb-1">Beberapa Data Tidak Valid</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        {importReview.idErrors 
                                            ? "Masalah Utama: Beberapa Kode Dukuh atau Kode RT di Excel tidak ditemukan di database. Pastikan wilayah sudah didaftarkan di menu 'Data Wilayah' sebelum impor."
                                            : "Pastikan judul kolom sesuai: Nama, Tarif, Kode Dukuh, Kode RT. Baris dengan data kosong akan otomatis dilewati."
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-2xl">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 sticky top-0 font-bold text-slate-500">
                                    <tr>
                                        <th className="p-3">Nama (Hasil Baca)</th>
                                        <th className="p-3">Wilayah</th>
                                        <th className="p-3 text-right">Tarif</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {importReview.valid.length > 0 ? importReview.valid.slice(0, 20).map((w, i) => (
                                        <tr key={i}>
                                            <td className="p-3 font-semibold text-slate-700">{w.name}</td>
                                            <td className="p-3 text-slate-500">
                                                RT {rtList.find(r => r.id === Number(w.rtId))?.number || '?'}, {dukuhList.find(d => d.id === Number(w.dukuhId))?.name || 'ID ' + w.dukuhId + ' Tidak Ada'}
                                            </td>
                                            <td className="p-3 text-right font-mono text-slate-500">Rp{(w.dailyFee || 0).toLocaleString('id-ID')}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="p-10 text-center text-slate-400 italic">Tidak ada data yang valid untuk diimpor. Periksa kembali file Excel Anda.</td></tr>
                                    )}
                                    {importReview.valid.length > 20 && (
                                        <tr><td colSpan={3} className="p-3 text-center text-slate-400 italic font-medium">...dan {importReview.valid.length - 20} data lainnya</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setImportReview(null)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">Batal</button>
                            <button 
                                onClick={confirmImport} 
                                disabled={importLoading || importReview.valid.length === 0} 
                                className="flex-[2] py-4 rounded-2xl font-bold bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
                            >
                                {importLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircleIcon />}
                                Simpan ke Database
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!qrToShow} onClose={() => setQrToShow(null)} title="Kartu Warga (Barcode)">
                {qrToShow && (
                    <div className="text-center py-6 flex flex-col items-center">
                        <div id="qr-card-printable" className="p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-sm mb-6 flex flex-col items-center w-full max-w-xs relative overflow-hidden">
                            {/* Card Header Branding */}
                            {profile?.logo_horizontal_url ? (
                                <img src={profile.logo_horizontal_url} alt="Logo" className="h-8 mb-6 object-contain" />
                            ) : profile?.logo_url ? (
                                <img src={profile.logo_url} alt="Logo" className="h-8 mb-6 object-contain" />
                            ) : (
                                <div className="bg-emerald-500 w-full h-12 -mt-8 -mx-8 mb-6 flex items-center justify-center">
                                    <span className="text-white font-black uppercase tracking-widest text-[10px]">{profile?.branding_title || 'SAPADESA CARD'}</span>
                                </div>
                            )}

                            <div className="qr-container p-2 bg-white border border-slate-100 rounded-2xl mb-2">
                                <QRCodeSVG value={qrToShow.id || ''} size={180} />
                            </div>

                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-6 leading-tight">{(qrToShow.name || 'N/A')}</h4>
                            <p className="text-sm font-bold text-slate-500 font-mono mt-1 tracking-wider">ID: {(qrToShow.id || 'N/A')}</p>
                            
                            <p className="text-[11px] text-slate-400 mt-4 font-bold uppercase tracking-widest border-t border-slate-50 pt-3 w-full">
                                {dukuhList.find(d => d.id === qrToShow.dukuhId)?.name || '?'} — RT {rtList.find(r => r.id === qrToShow.rtId)?.number || '?'}
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full">
                            <button 
                                onClick={() => {
                                    const printContent = document.getElementById('qr-card-printable')?.innerHTML;
                                    const win = window.open('', '_blank');
                                    if (win) {
                                        win.document.write(`
                                            <html>
                                                <head>
                                                    <title>Cetak Kartu - ${qrToShow.name}</title>
                                                    <style>
                                                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&display=swap');
                                                        body { font-family: 'Plus Jakarta Sans', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                                                        .card { 
                                                            border: 1px solid #e2e8f0; 
                                                            padding: 40px; 
                                                            border-radius: 30px; 
                                                            text-align: center; 
                                                            display: flex; 
                                                            flex-direction: column; 
                                                            align-items: center;
                                                            width: 8cm;
                                                            min-height: 10cm;
                                                            box-sizing: border-box;
                                                        }
                                                        img { height: 30px; margin-bottom: 20px; object-fit: contain; }
                                                        .qr-container { margin: 10px 0; }
                                                        h4 { margin: 20px 0 5px; font-size: 18pt; font-weight: 800; text-transform: uppercase; color: #0f172a; }
                                                        p { margin: 0; font-size: 12pt; font-weight: 700; color: #64748b; font-family: monospace; }
                                                        .loc { margin-top: 20px; font-size: 10pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; border-top: 1px solid #f1f5f9; padding-top: 15px; width: 100%; }
                                                    </style>
                                                </head>
                                                <body>
                                                    <div class="card">${printContent}</div>
                                                    <script>
                                                        window.addEventListener('load', () => {
                                                            setTimeout(() => {
                                                                window.print();
                                                                window.close();
                                                            }, 500);
                                                        });
                                                    </script>
                                                </body>
                                            </html>
                                        `);
                                        win.document.close();
                                    }
                                }} 
                                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-black transition-all"
                            >
                                <QrCodeIcon /> Cetak Kartu QR
                            </button>
                            <button onClick={() => setQrToShow(null)} className="text-slate-400 font-bold text-xs py-2">Tutup</button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={!!wargaToDelete} onClose={() => setWargaToDelete(null)} title="Hapus Data">
                {wargaToDelete && (
                    <div className="text-center py-4">
                        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><TrashIcon className="text-4xl text-rose-500" /></div>
                        <p className="font-bold text-slate-800 text-lg px-4">Hapus warga <span className="text-rose-600">"{(wargaToDelete.name || 'Warga Terpilih')}"</span>?</p>
                        <p className="text-xs text-slate-400 mt-2">Data warga dan riwayat transaksinya akan dihapus dari sistem.</p>
                        <div className="mt-8 flex gap-3 px-2">
                            <button onClick={() => setWargaToDelete(null)} className="flex-1 py-4 rounded-2xl text-slate-500 font-bold hover:bg-slate-100 transition-all text-sm">Batal</button>
                            <button onClick={async () => { 
                                await deleteWarga(wargaToDelete.id); 
                                setSelectedIds(prev => prev.filter(id => id !== wargaToDelete.id));
                                fetchData(); 
                                setWargaToDelete(null); 
                                setMessage({ type: 'success', text: 'Data warga berhasil dihapus.' }); 
                            }} className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all text-sm">Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL: HAPUS MASSAL (BULK DELETE) */}
            <Modal isOpen={isBulkDeleteModalOpen} onClose={() => !bulkDeleting && setIsBulkDeleteModalOpen(false)} title="Hapus Massal Warga" size="md">
                <div className="text-center py-2 space-y-4">
                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto border border-rose-100">
                        <TrashIcon className="text-4xl text-rose-500" />
                    </div>
                    
                    <div>
                        <h3 className="font-black text-slate-800 text-lg">
                            Hapus <span className="text-rose-600">{selectedIds.length} Data Warga</span>?
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            Data dari <strong className="text-slate-700">{selectedIds.length} warga</strong> yang dipilih beserta seluruh riwayat transaksinya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                        </p>
                    </div>

                    {/* Selected citizens list preview */}
                    <div className="max-h-52 overflow-y-auto border border-slate-100 rounded-2xl p-2 bg-slate-50 text-left divide-y divide-slate-100">
                        {wargaList
                            .filter(w => selectedIds.includes(w.id))
                            .slice(0, 8)
                            .map(w => (
                                <div key={w.id} className="py-2 px-3 flex items-center justify-between text-xs">
                                    <div className="min-w-0 pr-2">
                                        <p className="font-bold text-slate-700 truncate">{w.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">ID: {w.id} • RT {rtList.find(r => r.id === w.rtId)?.number || '?'}, {dukuhList.find(d => d.id === w.dukuhId)?.name || '?'}</p>
                                    </div>
                                    <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${w.billingType === 'BULANAN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {w.billingType || 'HARIAN'}
                                    </span>
                                </div>
                            ))}
                        {selectedIds.length > 8 && (
                            <div className="py-2.5 px-3 text-center text-xs font-bold text-slate-400 italic bg-white/60 rounded-xl mt-1">
                                ...dan {selectedIds.length - 8} warga lainnya
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button 
                            type="button" 
                            disabled={bulkDeleting}
                            onClick={() => setIsBulkDeleteModalOpen(false)} 
                            className="flex-1 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all text-sm disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button 
                            type="button"
                            disabled={bulkDeleting}
                            onClick={handleConfirmBulkDelete} 
                            className="flex-[2] py-3.5 rounded-2xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all text-sm flex items-center justify-center gap-2 disabled:bg-slate-300"
                        >
                            {bulkDeleting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <TrashIcon />
                                    Ya, Hapus {selectedIds.length} Warga
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* NOTIFICATION TOAST */}
            {message && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[10000] animate-slide-in-up">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                        {message.type === 'success' ? <CheckCircleIcon className="text-xl text-emerald-500" /> : <AlertCircleIcon className="text-xl text-rose-500" />}
                        <p className="text-xs font-black uppercase tracking-tight">{message.text}</p>
                        <button onClick={() => setMessage(null)} className="ml-2 text-slate-400 hover:text-slate-600">
                            <XIcon className="text-lg" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWargaPage;
