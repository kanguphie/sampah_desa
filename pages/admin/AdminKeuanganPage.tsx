import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Pengeluaran, PemasukanLain } from '@/types';
import { 
    getPengeluaran, 
    createPengeluaran, 
    updatePengeluaran, 
    deletePengeluaran,
    getPemasukanLain,
    createPemasukanLain,
    updatePemasukanLain,
    deletePemasukanLain,
    getReports,
    getAdminDashboardStats 
} from '@/services/api';
import Modal from '@/components/Modal';
import { 
    TrashIcon, 
    PencilIcon, 
    BanknotesIcon, 
    SearchIcon, 
    DownloadIcon, 
    ScaleBalancedIcon, 
    CurrencyDollarIcon, 
    SparklesIcon,
    RecycleIcon,
    UsersIcon
} from '@/components/icons';

const toLocalDateString = (d: Date | string | null | undefined): string => {
    if (!d) return '';
    let dateObj: Date;
    if (d instanceof Date) {
        dateObj = d;
    } else if (typeof d === 'string') {
        if (d.includes(' ')) {
            const [datePart, timePart] = d.split(' ');
            const [year, month, day] = datePart.split('-').map(Number);
            if (timePart) {
                const [hour, minute, second] = timePart.split(':').map(Number);
                dateObj = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
            } else {
                dateObj = new Date(year, month - 1, day);
            }
        } else if (d.includes('T')) {
            const datePart = d.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            dateObj = new Date(year, month - 1, day);
        } else {
            const parts = d.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts.map(Number);
                dateObj = new Date(year, month - 1, day);
            } else {
                dateObj = new Date(d);
            }
        }
    } else {
        dateObj = new Date(d);
    }

    if (isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const SOURCE_OPTIONS = [
    'Penjualan Rosok / Sampah Daur Ulang (Kardus, Plastik, Besi)',
    'Penjualan Kompos & Pupuk Organik',
    'Alokasi Dana Desa / APBDes / BUMDes',
    'Donasi / Swadaya Warga / CSR',
    'Retribusi Khusus (Pasar / Event / Hajatan)',
    'Lain-lain'
];

// --- FORM PEMASUKAN LAIN ---
const PemasukanLainForm: React.FC<{
  pemasukan?: PemasukanLain | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ pemasukan, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: pemasukan?.date ? toLocalDateString(pemasukan.date) : toLocalDateString(new Date()),
    source: pemasukan?.source || SOURCE_OPTIONS[0],
    description: pemasukan?.description || '',
    amount: pemasukan?.amount || 0,
    category: pemasukan?.category || 'PEMASUKAN_LAIN'
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('0') && raw.length > 1) raw = raw.replace(/^0+/, '');
    const val = raw === '' ? 0 : Number(raw);
    setFormData(prev => ({ ...prev, amount: val }));
  };

  const handleQuickAmount = (val: number) => {
    setFormData(prev => ({ ...prev, amount: val }));
  };

  const displayAmount = formData.amount === 0 ? '' : formData.amount.toLocaleString('id-ID');

  return (
    <form onSubmit={(e) => { 
        e.preventDefault(); 
        onSave(pemasukan ? { ...pemasukan, ...formData } : { ...formData }); 
    }} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Pemasukan</label>
        <input 
            type="date" 
            value={formData.date} 
            onChange={e => setFormData({ ...formData, date: e.target.value })} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 text-sm" 
            required 
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sumber Pemasukan</label>
        <select 
            value={formData.source} 
            onChange={e => setFormData({ ...formData, source: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-700 text-sm"
        >
            {SOURCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Rincian</label>
        <input 
            type="text" 
            placeholder="Contoh: Penjualan 120kg kardus dan 50kg botol plastik lapak Barokah" 
            value={formData.description} 
            onChange={e => setFormData({ ...formData, description: e.target.value })} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-700 text-sm" 
            required 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Nominal (Pemasukan)</label>
        <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-emerald-600 transition-colors">Rp</span>
            <input 
                type="text" 
                inputMode="numeric"
                value={displayAmount} 
                onChange={handleAmountChange} 
                placeholder="0"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-black text-emerald-600 text-xl font-mono" 
                required 
            />
        </div>
        {/* Tombol Cepat Nominal */}
        <div className="flex flex-wrap gap-1.5 pt-1">
            {[50000, 100000, 250000, 500000, 1000000].map(amt => (
                <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100 transition-all"
                >
                    +Rp{amt.toLocaleString('id-ID')}
                </button>
            ))}
        </div>
      </div>

      <div className="flex gap-3 pt-3 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm">Batal</button>
        <button type="submit" className="flex-1 py-3.5 rounded-2xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all text-sm">
            {pemasukan ? 'Simpan Perubahan' : 'Simpan Pemasukan'}
        </button>
      </div>
    </form>
  );
};

// --- FORM PENGELUARAN ---
const PengeluaranForm: React.FC<{
  pengeluaran?: Pengeluaran | null;
  onSave: (p: any) => void;
  onCancel: () => void;
}> = ({ pengeluaran, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: pengeluaran?.date ? toLocalDateString(pengeluaran.date) : toLocalDateString(new Date()),
    description: pengeluaran?.description || '',
    amount: pengeluaran?.amount || 0,
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('0') && raw.length > 1) raw = raw.replace(/^0+/, '');
    const val = raw === '' ? 0 : Number(raw);
    setFormData(prev => ({ ...prev, amount: val }));
  };

  const handleQuickAmount = (val: number) => {
    setFormData(prev => ({ ...prev, amount: val }));
  };

  const displayAmount = formData.amount === 0 ? '' : formData.amount.toLocaleString('id-ID');

  return (
    <form onSubmit={(e) => { 
        e.preventDefault(); 
        onSave(pengeluaran ? { ...pengeluaran, ...formData } : { ...formData }); 
    }} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Transaksi</label>
        <input 
            type="date" 
            value={formData.date} 
            onChange={e => setFormData({ ...formData, date: e.target.value })} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold text-slate-700 text-sm" 
            required 
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Keperluan</label>
        <input 
            type="text" 
            placeholder="Contoh: Pembelian Bensin Tossa, Gaji Petugas, Tambal Ban, dsb" 
            value={formData.description} 
            onChange={e => setFormData({ ...formData, description: e.target.value })} 
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-slate-700 text-sm" 
            required 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Nominal (Pengeluaran)</label>
        <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-rose-500 transition-colors">Rp</span>
            <input 
                type="text" 
                inputMode="numeric"
                value={displayAmount} 
                onChange={handleAmountChange} 
                placeholder="0"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-black text-rose-600 text-xl font-mono" 
                required 
            />
        </div>
        {/* Tombol Cepat Nominal */}
        <div className="flex flex-wrap gap-1.5 pt-1">
            {[20000, 50000, 100000, 250000, 500000].map(amt => (
                <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60 hover:bg-rose-100 transition-all"
                >
                    +Rp{amt.toLocaleString('id-ID')}
                </button>
            ))}
        </div>
      </div>

      <div className="flex gap-3 pt-3 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm">Batal</button>
        <button type="submit" className="flex-1 py-3.5 rounded-2xl font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all text-sm">
            {pengeluaran ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}
        </button>
      </div>
    </form>
  );
};

type ActiveTabType = 'all' | 'pemasukan_lain' | 'pengeluaran' | 'iuran';

const AdminKeuanganPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTabType>('all');
    const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
    const [pemasukanLainList, setPemasukanLainList] = useState<PemasukanLain[]>([]);
    const [iuranList, setIuranList] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({ 
        search: '',
        startDate: toLocalDateString(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        endDate: toLocalDateString(new Date())
    });

    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modals State
    const [modalType, setModalType] = useState<'pemasukan' | 'pengeluaran' | null>(null);
    const [selectedPemasukan, setSelectedPemasukan] = useState<PemasukanLain | null>(null);
    const [selectedPengeluaran, setSelectedPengeluaran] = useState<Pengeluaran | null>(null);
    const [toDelete, setToDelete] = useState<{ type: 'pemasukan' | 'pengeluaran'; item: any } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [pList, incList, repList, s] = await Promise.all([
                getPengeluaran({ startDate: filters.startDate, endDate: filters.endDate }),
                getPemasukanLain({ startDate: filters.startDate, endDate: filters.endDate }),
                getReports({ startDate: filters.startDate, endDate: filters.endDate }),
                getAdminDashboardStats()
            ]);
            setPengeluaranList(Array.isArray(pList) ? pList : []);
            setPemasukanLainList(Array.isArray(incList) ? incList : []);
            setIuranList(Array.isArray(repList) ? repList.filter((r: any) => r.status === 'paid') : []);
            setStats(s);
        } catch (err) {
            console.error("Failed to load financial data", err);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Summary calculations for filtered period
    const periodSummary = useMemo(() => {
        const totalIuran = iuranList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalOther = pemasukanLainList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalExp = pengeluaranList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const totalIncome = totalIuran + totalOther;
        const netBalance = totalIncome - totalExp;
        return { totalIuran, totalOther, totalIncome, totalExp, netBalance };
    }, [iuranList, pemasukanLainList, pengeluaranList]);

    // Unified combined list for 'all' tab
    const combinedTransactions = useMemo(() => {
        const items: Array<{
            id: string;
            date: string;
            type: 'iuran' | 'pemasukan_lain' | 'pengeluaran';
            title: string;
            subtitle?: string;
            amount: number;
            raw: any;
        }> = [];

        iuranList.forEach(item => {
            items.push({
                id: `iuran-${item.id}`,
                date: toLocalDateString(item.timestamp),
                type: 'iuran',
                title: item.wargaName || 'Iuran Warga',
                subtitle: `RT ${item.rtNumber || '-'}, ${item.dukuhName || '-'} • Petugas: ${item.petugasName || '-'}`,
                amount: Number(item.amount) || 0,
                raw: item
            });
        });

        pemasukanLainList.forEach(item => {
            items.push({
                id: item.id,
                date: toLocalDateString(item.date),
                type: 'pemasukan_lain',
                title: item.description || 'Pemasukan Lain',
                subtitle: item.source || 'Sumber Lainnya',
                amount: Number(item.amount) || 0,
                raw: item
            });
        });

        pengeluaranList.forEach(item => {
            items.push({
                id: item.id,
                date: toLocalDateString(item.date),
                type: 'pengeluaran',
                title: item.description || 'Pengeluaran',
                subtitle: item.category || 'Operasional',
                amount: -(Number(item.amount) || 0),
                raw: item
            });
        });

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [iuranList, pemasukanLainList, pengeluaranList]);

    // Filtered lists based on search
    const filteredPemasukanLain = useMemo(() => {
        const q = filters.search.toLowerCase();
        return pemasukanLainList.filter(p => 
            (p.description || '').toLowerCase().includes(q) || 
            (p.source || '').toLowerCase().includes(q)
        );
    }, [pemasukanLainList, filters.search]);

    const filteredPengeluaran = useMemo(() => {
        const q = filters.search.toLowerCase();
        return pengeluaranList.filter(p => 
            (p.description || '').toLowerCase().includes(q)
        );
    }, [pengeluaranList, filters.search]);

    const filteredIuran = useMemo(() => {
        const q = filters.search.toLowerCase();
        return iuranList.filter(item => 
            (item.wargaName || '').toLowerCase().includes(q) ||
            (item.dukuhName || '').toLowerCase().includes(q)
        );
    }, [iuranList, filters.search]);

    const filteredCombined = useMemo(() => {
        const q = filters.search.toLowerCase();
        return combinedTransactions.filter(item => 
            item.title.toLowerCase().includes(q) || 
            (item.subtitle && item.subtitle.toLowerCase().includes(q))
        );
    }, [combinedTransactions, filters.search]);

    // Active table data
    const currentTableData = useMemo(() => {
        if (activeTab === 'pemasukan_lain') return filteredPemasukanLain;
        if (activeTab === 'pengeluaran') return filteredPengeluaran;
        if (activeTab === 'iuran') return filteredIuran;
        return filteredCombined;
    }, [activeTab, filteredPemasukanLain, filteredPengeluaran, filteredIuran, filteredCombined]);

    const paginatedData = useMemo(() => {
        if (itemsPerPage === 'all') return currentTableData;
        const start = (currentPage - 1) * (itemsPerPage as number);
        return currentTableData.slice(start, start + (itemsPerPage as number));
    }, [currentTableData, itemsPerPage, currentPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(currentTableData.length / (itemsPerPage as number));

    // Save Handlers
    const handleSavePemasukan = async (data: any) => {
        try {
            if (data.id) {
                await updatePemasukanLain(data.id, data);
            } else {
                await createPemasukanLain(data);
            }
            setModalType(null);
            setSelectedPemasukan(null);
            await fetchData();
        } catch (err: any) {
            console.error('Failed to save pemasukan lain:', err);
        }
    };

    const handleSavePengeluaran = async (data: any) => {
        try {
            if (data.id) {
                await updatePengeluaran(data.id, data);
            } else {
                await createPengeluaran(data);
            }
            setModalType(null);
            setSelectedPengeluaran(null);
            await fetchData();
        } catch (err: any) {
            console.error('Failed to save pengeluaran:', err);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!toDelete) return;
        try {
            if (toDelete.type === 'pemasukan') {
                await deletePemasukanLain(toDelete.item.id);
            } else {
                await deletePengeluaran(toDelete.item.id);
            }
            setToDelete(null);
            await fetchData();
        } catch (err: any) {
            console.error('Failed to delete transaction:', err);
        }
    };

    // Print Handler
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        let tableTitle = 'Semua Arus Kas (Pemasukan & Pengeluaran)';
        if (activeTab === 'pemasukan_lain') tableTitle = 'Laporan Pemasukan Lain (Non-Iuran)';
        if (activeTab === 'pengeluaran') tableTitle = 'Laporan Pengeluaran Operasional';
        if (activeTab === 'iuran') tableTitle = 'Laporan Iuran Sampah Warga';

        let tableHeader = '';
        let tableRows = '';

        if (activeTab === 'pemasukan_lain') {
            tableHeader = '<tr><th>Tanggal</th><th>Sumber Pemasukan</th><th>Keterangan / Uraian</th><th style="text-align:right">Nominal</th></tr>';
            tableRows = filteredPemasukanLain.map(p => `
                <tr>
                    <td>${new Date(p.date).toLocaleDateString('id-ID')}</td>
                    <td><strong>${p.source || 'Lainnya'}</strong></td>
                    <td>${p.description || '-'}</td>
                    <td style="text-align:right; color:#059669; font-weight:bold;">Rp${(p.amount || 0).toLocaleString('id-ID')}</td>
                </tr>
            `).join('');
        } else if (activeTab === 'pengeluaran') {
            tableHeader = '<tr><th>Tanggal</th><th>Keperluan / Uraian</th><th style="text-align:right">Nominal</th></tr>';
            tableRows = filteredPengeluaran.map(p => `
                <tr>
                    <td>${new Date(p.date).toLocaleDateString('id-ID')}</td>
                    <td>${p.description || '-'}</td>
                    <td style="text-align:right; color:#e11d48; font-weight:bold;">Rp${(p.amount || 0).toLocaleString('id-ID')}</td>
                </tr>
            `).join('');
        } else if (activeTab === 'iuran') {
            tableHeader = '<tr><th>Tanggal</th><th>Warga</th><th>Wilayah</th><th style="text-align:right">Nominal</th></tr>';
            tableRows = filteredIuran.map(i => `
                <tr>
                    <td>${new Date(i.timestamp).toLocaleDateString('id-ID')}</td>
                    <td><strong>${i.wargaName}</strong></td>
                    <td>RT ${i.rtNumber}, ${i.dukuhName}</td>
                    <td style="text-align:right; color:#0284c7; font-weight:bold;">Rp${(i.amount || 0).toLocaleString('id-ID')}</td>
                </tr>
            `).join('');
        } else {
            tableHeader = '<tr><th>Tanggal</th><th>Jenis</th><th>Uraian / Keterangan</th><th style="text-align:right">Nominal</th></tr>';
            tableRows = filteredCombined.map(c => `
                <tr>
                    <td>${new Date(c.date).toLocaleDateString('id-ID')}</td>
                    <td><strong>${c.type === 'iuran' ? 'Iuran Warga' : c.type === 'pemasukan_lain' ? 'Pemasukan Lain' : 'Pengeluaran'}</strong></td>
                    <td>${c.title} ${c.subtitle ? `<br><small style="color:#64748b">${c.subtitle}</small>` : ''}</td>
                    <td style="text-align:right; font-weight:bold; color:${c.amount >= 0 ? '#059669' : '#e11d48'}">
                        ${c.amount >= 0 ? '+' : ''}Rp${c.amount.toLocaleString('id-ID')}
                    </td>
                </tr>
            `).join('');
        }

        printWindow.document.write(`
            <html>
            <head>
                <title>${tableTitle}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4; margin: 1cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
                    .header-left .logo { color: #059669; font-size: 24pt; font-weight: 800; margin: 0; line-height: 1.1; }
                    .header-left .sub-1 { font-size: 9pt; font-weight: 700; color: #1e293b; margin: 5px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 3px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 13pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
                    .print-date { font-size: 8pt; color: #64748b; font-weight: 600; margin-top: 3px; }
                    .summary-box { display: flex; gap: 15px; margin-bottom: 20px; }
                    .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #f8fafc; }
                    .card-label { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
                    .card-val { font-size: 11pt; font-weight: 800; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 8pt; text-transform: uppercase; border-bottom: 1.5px solid #cbd5e1; color: #334155; }
                    td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-left">
                        <h1 class="logo">SAPADESA</h1>
                        <p class="sub-1">PENGELOLAAN SAMPAH DESA ROWOSARI, BATANG</p>
                        <p class="sub-2">SEKRETARIAT: KANTOR DESA ROWOSARI, JAWA TENGAH 51271</p>
                    </div>
                    <div class="header-right">
                        <div class="report-title">${tableTitle}</div>
                        <div class="print-date">PERIODE: ${filters.startDate} s/d ${filters.endDate}</div>
                        <div class="print-date">DICETAK PADA: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>

                <div class="summary-box">
                    <div class="card">
                        <div class="card-label">Iuran Warga (Periode)</div>
                        <div class="card-val" style="color:#0284c7">Rp${periodSummary.totalIuran.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Pemasukan Lain (Periode)</div>
                        <div class="card-val" style="color:#059669">Rp${periodSummary.totalOther.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Total Pengeluaran (Periode)</div>
                        <div class="card-val" style="color:#e11d48">Rp${periodSummary.totalExp.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Saldo Bersih (Periode)</div>
                        <div class="card-val" style="color:#0f172a">Rp${periodSummary.netBalance.toLocaleString('id-ID')}</div>
                    </div>
                </div>

                <table>
                    <thead>${tableHeader}</thead>
                    <tbody>${tableRows || '<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">Tidak ada data pada periode ini</td></tr>'}</tbody>
                </table>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            {/* Top Header Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight font-display">Manajemen Keuangan Desa</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        Pencatatan pemasukan iuran warga, pemasukan non-iuran (rosok, donasi, dana desa), dan pengeluaran operasional.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                    <button 
                        onClick={handlePrint} 
                        className="bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                        <DownloadIcon /> Cetak Laporan
                    </button>
                    <button 
                        onClick={() => { setSelectedPemasukan(null); setModalType('pemasukan'); }} 
                        className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm transform hover:-translate-y-0.5"
                    >
                        <SparklesIcon /> + Pemasukan Lain
                    </button>
                    <button 
                        onClick={() => { setSelectedPengeluaran(null); setModalType('pengeluaran'); }} 
                        className="bg-rose-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm transform hover:-translate-y-0.5"
                    >
                        + Catat Pengeluaran
                    </button>
                </div>
            </div>

            {/* Financial Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* 1. Saldo Bersih */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <ScaleBalancedIcon className="text-2xl" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Saldo Kas Keseluruhan</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight truncate">
                            Rp{(stats?.balance || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                            Periode Ini: Rp{periodSummary.netBalance.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                {/* 2. Iuran Warga */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="bg-blue-50 text-blue-600 w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <UsersIcon className="text-2xl" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest truncate">Iuran Sampah Warga</p>
                        <p className="text-xl sm:text-2xl font-black text-blue-600 tracking-tight truncate">
                            Rp{(stats?.totalIuran || stats?.totalRevenue || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Periode: Rp{periodSummary.totalIuran.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                {/* 3. Pemasukan Lain */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <SparklesIcon className="text-2xl" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest truncate">Pemasukan Lain (Non-Iuran)</p>
                        <p className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight truncate">
                            Rp{(stats?.totalOtherIncome || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Periode: Rp{periodSummary.totalOther.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                {/* 4. Total Pengeluaran */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="bg-rose-50 text-rose-600 w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                        <BanknotesIcon className="text-2xl" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest truncate">Total Pengeluaran</p>
                        <p className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight truncate">
                            Rp{(stats?.totalExpense || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Periode: Rp{periodSummary.totalExp.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter & Navigation Card */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-5">
                {/* Tabs Bar */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                    <button
                        onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                            activeTab === 'all' 
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <ScaleBalancedIcon className="text-sm" />
                        Semua Arus Kas ({filteredCombined.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('pemasukan_lain'); setCurrentPage(1); }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                            activeTab === 'pemasukan_lain' 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <SparklesIcon className="text-sm" />
                        Pemasukan Lain ({filteredPemasukanLain.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('pengeluaran'); setCurrentPage(1); }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                            activeTab === 'pengeluaran' 
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10' 
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <BanknotesIcon className="text-sm" />
                        Pengeluaran Operasional ({filteredPengeluaran.length})
                    </button>
                    <button
                        onClick={() => { setActiveTab('iuran'); setCurrentPage(1); }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                            activeTab === 'iuran' 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <UsersIcon className="text-sm" />
                        Iuran Sampah ({filteredIuran.length})
                    </button>
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Dari Tanggal</label>
                        <input 
                            type="date" 
                            value={filters.startDate} 
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })} 
                            className="w-full bg-transparent font-bold text-xs outline-none text-slate-700" 
                        />
                    </div>
                    <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Sampai Tanggal</label>
                        <input 
                            type="date" 
                            value={filters.endDate} 
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })} 
                            className="w-full bg-transparent font-bold text-xs outline-none text-slate-700" 
                        />
                    </div>
                    <div className="sm:col-span-2 relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Cari Keterangan / Sumber / Nama</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Cari transaksi..." 
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none bg-slate-50/50 font-semibold text-xs text-slate-700 placeholder-slate-400" 
                                value={filters.search} 
                                onChange={e => setFilters({ ...filters, search: e.target.value })} 
                            />
                            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        </div>
                    </div>
                </div>

                {/* Table meta info */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tampilkan</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={e => { setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }} 
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900"
                        >
                            <option value={10}>10 Baris</option>
                            <option value={25}>25 Baris</option>
                            <option value={50}>50 Baris</option>
                            <option value="all">Semua</option>
                        </select>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total {currentTableData.length} Catatan
                    </p>
                </div>
            </div>

            {/* Main Table Display */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {/* TAB: SEMUA ARUS KAS */}
                    {activeTab === 'all' && (
                        <table className="w-full text-sm text-left font-sans">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="p-5">Tanggal</th>
                                    <th className="p-5">Jenis Transaksi</th>
                                    <th className="p-5">Uraian / Keterangan</th>
                                    <th className="p-5 text-right">Nominal</th>
                                    <th className="p-5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-10 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest text-xs">Memuat Data Keuangan...</td></tr>
                                ) : paginatedData.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5 font-bold text-slate-400 text-xs font-mono">
                                            {item.date ? new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="p-5">
                                            {item.type === 'iuran' && (
                                                <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wider">
                                                    Iuran Warga
                                                </span>
                                            )}
                                            {item.type === 'pemasukan_lain' && (
                                                <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                                                    Pemasukan Lain
                                                </span>
                                            )}
                                            {item.type === 'pengeluaran' && (
                                                <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60 uppercase tracking-wider">
                                                    Pengeluaran
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <p className="font-bold text-slate-800">{item.title}</p>
                                            {item.subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{item.subtitle}</p>}
                                        </td>
                                        <td className="p-5 text-right font-black text-base font-mono">
                                            <span className={item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                {item.amount >= 0 ? '+' : ''}Rp{Math.abs(item.amount).toLocaleString('id-ID')}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            {item.type === 'pemasukan_lain' && (
                                                <div className="flex justify-center gap-1">
                                                    <button 
                                                        onClick={() => { setSelectedPemasukan(item.raw); setModalType('pemasukan'); }} 
                                                        className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all" 
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="text-lg" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setToDelete({ type: 'pemasukan', item: item.raw })} 
                                                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all" 
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="text-lg" />
                                                    </button>
                                                </div>
                                            )}
                                            {item.type === 'pengeluaran' && (
                                                <div className="flex justify-center gap-1">
                                                    <button 
                                                        onClick={() => { setSelectedPengeluaran(item.raw); setModalType('pengeluaran'); }} 
                                                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all" 
                                                        title="Edit"
                                                    >
                                                        <PencilIcon className="text-lg" />
                                                    </button>
                                                    <button 
                                                        onClick={() => setToDelete({ type: 'pengeluaran', item: item.raw })} 
                                                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all" 
                                                        title="Hapus"
                                                    >
                                                        <TrashIcon className="text-lg" />
                                                    </button>
                                                </div>
                                            )}
                                            {item.type === 'iuran' && (
                                                <span className="text-xs text-slate-300 font-semibold italic">Transaksi Warga</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && paginatedData.length === 0 && (
                                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">Belum ada catatan pada periode ini</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* TAB: PEMASUKAN LAIN (NON-IURAN) */}
                    {activeTab === 'pemasukan_lain' && (
                        <table className="w-full text-sm text-left font-sans">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="p-5">Tanggal</th>
                                    <th className="p-5">Sumber Pemasukan</th>
                                    <th className="p-5">Keterangan / Uraian</th>
                                    <th className="p-5 text-right">Nominal Pemasukan</th>
                                    <th className="p-5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-10 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest text-xs">Memuat Data Pemasukan Lain...</td></tr>
                                ) : paginatedData.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5 font-bold text-slate-400 text-xs font-mono">
                                            {p.date ? new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="p-5">
                                            <span className="font-bold text-slate-800 block">{p.source || 'Lain-lain'}</span>
                                        </td>
                                        <td className="p-5 font-medium text-slate-600">
                                            {p.description || '-'}
                                        </td>
                                        <td className="p-5 text-right font-black text-emerald-600 text-base font-mono">
                                            +Rp{(p.amount || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button 
                                                    onClick={() => { setSelectedPemasukan(p); setModalType('pemasukan'); }} 
                                                    className="p-2 text-slate-400 hover:text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all" 
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="text-lg" />
                                                </button>
                                                <button 
                                                    onClick={() => setToDelete({ type: 'pemasukan', item: p })} 
                                                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all" 
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="text-lg" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && paginatedData.length === 0 && (
                                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">Belum ada catatan pemasukan lain pada periode ini</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* TAB: PENGELUARAN */}
                    {activeTab === 'pengeluaran' && (
                        <table className="w-full text-sm text-left font-sans">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="p-5">Tanggal</th>
                                    <th className="p-5">Keperluan / Keterangan</th>
                                    <th className="p-5 text-right">Nominal Pengeluaran</th>
                                    <th className="p-5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={4} className="p-10 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest text-xs">Memuat Data Pengeluaran...</td></tr>
                                ) : paginatedData.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5 font-bold text-slate-400 text-xs font-mono">
                                            {p.date ? new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="p-5 font-bold text-slate-700">
                                            {p.description || '-'}
                                        </td>
                                        <td className="p-5 text-right font-black text-rose-600 text-base font-mono">
                                            -Rp{(p.amount || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button 
                                                    onClick={() => { setSelectedPengeluaran(p); setModalType('pengeluaran'); }} 
                                                    className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all" 
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="text-lg" />
                                                </button>
                                                <button 
                                                    onClick={() => setToDelete({ type: 'pengeluaran', item: p })} 
                                                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all" 
                                                    title="Hapus"
                                                >
                                                    <TrashIcon className="text-lg" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && paginatedData.length === 0 && (
                                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">Belum ada catatan pengeluaran pada periode ini</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {/* TAB: IURAN WARGA */}
                    {activeTab === 'iuran' && (
                        <table className="w-full text-sm text-left font-sans">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="p-5">Waktu</th>
                                    <th className="p-5">Nama Warga</th>
                                    <th className="p-5">Wilayah</th>
                                    <th className="p-5">Petugas Kolektor</th>
                                    <th className="p-5 text-right">Nominal Iuran</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="p-10 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest text-xs">Memuat Data Iuran...</td></tr>
                                ) : paginatedData.map((i: any) => (
                                    <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-5 font-bold text-slate-400 text-xs font-mono">
                                            {i.timestamp ? new Date(i.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td className="p-5 font-bold text-slate-800">
                                            {i.wargaName}
                                        </td>
                                        <td className="p-5 text-slate-500 text-xs font-semibold">
                                            RT {i.rtNumber}, {i.dukuhName}
                                        </td>
                                        <td className="p-5 text-slate-600 font-medium">
                                            {i.petugasName || '-'}
                                        </td>
                                        <td className="p-5 text-right font-black text-blue-600 text-base font-mono">
                                            Rp{(i.amount || 0).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                                {!loading && paginatedData.length === 0 && (
                                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">Belum ada iuran sampah pada periode ini</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Controls */}
                {itemsPerPage !== 'all' && totalPages > 1 && (
                    <div className="p-5 bg-slate-50/40 border-t border-slate-100 flex justify-between items-center px-6">
                        <p className="text-xs text-slate-400 font-semibold">
                            Halaman <span className="text-slate-700 font-bold">{currentPage}</span> dari <span className="text-slate-700 font-bold">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                            >
                                Sebelumnya
                            </button>
                            <span className="bg-slate-900 text-white w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold shadow-sm">
                                {currentPage}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages} 
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Form Pemasukan Lain */}
            <Modal 
                isOpen={modalType === 'pemasukan'} 
                onClose={() => { setModalType(null); setSelectedPemasukan(null); }} 
                title={selectedPemasukan ? 'Edit Pemasukan Lain' : 'Catat Pemasukan Lain (Non-Iuran)'} 
                size="lg"
            >
                <PemasukanLainForm 
                    pemasukan={selectedPemasukan} 
                    onSave={handleSavePemasukan} 
                    onCancel={() => { setModalType(null); setSelectedPemasukan(null); }} 
                />
            </Modal>

            {/* Modal Form Pengeluaran */}
            <Modal 
                isOpen={modalType === 'pengeluaran'} 
                onClose={() => { setModalType(null); setSelectedPengeluaran(null); }} 
                title={selectedPengeluaran ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'} 
                size="lg"
            >
                <PengeluaranForm 
                    pengeluaran={selectedPengeluaran} 
                    onSave={handleSavePengeluaran} 
                    onCancel={() => { setModalType(null); setSelectedPengeluaran(null); }} 
                />
            </Modal>
            
            {/* Modal Konfirmasi Hapus */}
            <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Konfirmasi Hapus">
                {toDelete && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <TrashIcon className="text-3xl" />
                        </div>
                        <p className="font-bold text-slate-800 text-lg">
                            Hapus catatan {toDelete.type === 'pemasukan' ? 'pemasukan lain' : 'pengeluaran'}?
                        </p>
                        <p className="text-slate-500 text-sm mt-2 px-4 font-medium">
                            "{toDelete.item.description || toDelete.item.source || '-'}"
                        </p>
                        <p className="text-xs text-rose-500 mt-3 font-semibold">
                            Nominal: Rp{(toDelete.item.amount || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-slate-400 mt-2 italic">Tindakan ini akan mempengaruhi rekapitulasi kas desa.</p>
                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={() => setToDelete(null)} 
                                className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all text-sm"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleDeleteConfirm} 
                                className="flex-1 py-3.5 rounded-2xl font-bold bg-rose-600 text-white shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all text-sm"
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
