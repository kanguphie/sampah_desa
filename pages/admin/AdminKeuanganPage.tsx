
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Pengeluaran } from '@/types';
import { getPengeluaran, createPengeluaran, updatePengeluaran, deletePengeluaran, getAdminDashboardStats } from '@/services/api';
import Modal from '@/components/Modal';
import { TrashIcon, PencilIcon, BanknotesIcon, SearchIcon, DownloadIcon, ScaleBalancedIcon, CurrencyDollarIcon, XIcon } from '@/components/icons';

const PengeluaranForm: React.FC<{
  pengeluaran?: Pengeluaran | null;
  onSave: (p: Omit<Pengeluaran, 'id'> | Pengeluaran) => void;
  onCancel: () => void;
}> = ({ pengeluaran, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: pengeluaran?.date ? new Date(pengeluaran.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: pengeluaran?.description || '',
    amount: pengeluaran?.amount || 0,
  });

  // Handler untuk format nominal uang (titik ribuan dan hapus nol depan)
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('0') && raw.length > 1) raw = raw.replace(/^0+/, '');
    const val = raw === '' ? 0 : Number(raw);
    setFormData({ ...formData, amount: val });
  };

  const displayAmount = formData.amount === 0 ? '' : formData.amount.toLocaleString('id-ID');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(pengeluaran ? { ...pengeluaran, ...formData, date: new Date(formData.date) } : { ...formData, date: new Date(formData.date) }); }} className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Transaksi</label>
        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-semibold text-slate-700" required />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Keperluan</label>
        <input type="text" placeholder="Contoh: Pembelian Bensin Tossa, Gaji Petugas, dsb" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-semibold text-slate-700" required />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Nominal (Pengeluaran)</label>
        <div className="relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-rose-500 transition-colors">Rp</span>
            <input 
                type="text" 
                inputMode="numeric"
                value={displayAmount} 
                onChange={handleAmountChange} 
                placeholder="0"
                className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-black text-rose-600 text-lg" 
                required 
            />
        </div>
        <p className="text-[10px] text-slate-400 italic ml-1">* Masukkan nominal tanpa titik/koma</p>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onCancel} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Batal</button>
        <button type="submit" className="flex-1 py-4 rounded-2xl font-bold bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/20 transition-all">Simpan Catatan</button>
      </div>
    </form>
  );
};

const AdminKeuanganPage: React.FC = () => {
    const [list, setList] = useState<Pengeluaran[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({ 
        search: '',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected, setSelected] = useState<Pengeluaran | null>(null);
    const [toDelete, setToDelete] = useState<Pengeluaran | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [data, s] = await Promise.all([
                getPengeluaran({ startDate: new Date(filters.startDate), endDate: new Date(filters.endDate) }),
                getAdminDashboardStats()
            ]);
            setList(data);
            setStats(s);
        } catch (err) {
            console.error("Failed to load financial data", err);
        } finally {
            setLoading(false);
        }
    }, [filters.startDate, filters.endDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = useMemo(() => {
        return list.filter(p => (p.description || '').toLowerCase().includes((filters.search || '').toLowerCase()));
    }, [list, filters.search]);

    const paginated = useMemo(() => {
        if (itemsPerPage === 'all') return filtered;
        const start = (currentPage - 1) * (itemsPerPage as number);
        return filtered.slice(start, start + (itemsPerPage as number));
    }, [filtered, itemsPerPage, currentPage]);

    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filtered.length / (itemsPerPage as number));

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const rows = filtered.map(p => `<tr><td>${new Date(p.date).toLocaleDateString('id-ID')}</td><td>${p.description || '-'}</td><td style="text-align:right">Rp${(p.amount || 0).toLocaleString('id-ID')}</td></tr>`).join('');
        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4; margin: 1cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 25px; }
                    .header-left .logo { color: #10b981; font-size: 24pt; font-weight: 800; margin: 0; line-height: 1.1; }
                    .header-left .sub-1 { font-size: 9pt; font-weight: 700; color: #1e293b; margin: 5px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 3px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
                    .print-date { font-size: 8pt; color: #94a3b8; font-weight: 600; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 8.5pt; text-transform: uppercase; border-bottom: 1.5px solid #e2e8f0; color: #475569; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt; }
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
                        <div class="report-title">Laporan Pengeluaran Kas</div>
                        <div class="print-date">PERIODE: ${filters.startDate} s/d ${filters.endDate}</div>
                        <div class="print-date">DICETAK PADA: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <table><thead><tr><th>Tanggal</th><th>Keterangan Keperluan</th><th style="text-align:right">Nominal</th></tr></thead><tbody>${rows || '<tr><td colspan="3" style="text-align:center">Tidak ada catatan pengeluaran</td></tr>'}</tbody></table>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>`);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight font-display">Manajemen Keuangan</h1>
                    <p className="text-slate-500 text-sm font-medium">Monitoring arus kas masuk dan operasional pengeluaran desa.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={handlePrint} className="flex-1 md:flex-none bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><DownloadIcon /> Cetak Laporan</button>
                    <button onClick={() => { setSelected(null); setIsModalOpen(true); }} className="flex-1 md:flex-none bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5">+ Catat Pengeluaran</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                    <div className="bg-emerald-50 text-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner"><ScaleBalancedIcon className="text-2xl" /></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Kas (Net)</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tight">Rp{(stats?.balance || 0).toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                    <div className="bg-blue-50 text-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner"><CurrencyDollarIcon className="text-2xl" /></div>
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Total Pemasukan</p>
                      <p className="text-2xl font-black text-blue-600 tracking-tight">Rp{(stats?.totalRevenue || 0).toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex items-center gap-5">
                    <div className="bg-rose-50 text-rose-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner"><BanknotesIcon className="text-2xl" /></div>
                    <div>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Total Pengeluaran</p>
                      <p className="text-2xl font-black text-rose-600 tracking-tight">Rp{(stats?.totalExpense || 0).toLocaleString('id-ID')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Dari Tanggal</label>
                        <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-700" />
                    </div>
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Sampai Tanggal</label>
                        <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="w-full bg-transparent font-bold text-xs outline-none text-slate-700" />
                    </div>
                    <div className="lg:col-span-2 relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Pencarian Deskripsi</label>
                        <div className="relative">
                            <input type="text" placeholder="Contoh: Bensin, Gaji..." className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-slate-50/50 font-semibold text-xs text-slate-700 placeholder-slate-400" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
                            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Tampilkan</span>
                        <select value={itemsPerPage} onChange={e => { setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value)); setCurrentPage(1); }} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20">
                            <option value={10}>10 Baris</option><option value={25}>25 Baris</option><option value="all">Semua</option>
                        </select>
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total {filtered.length} Catatan</p>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left font-sans">
                        <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-5">Tanggal</th><th className="p-5">Keperluan / Keterangan</th><th className="p-5 text-right">Nominal</th><th className="p-5 text-center">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse font-bold text-slate-300 uppercase tracking-widest text-xs">Memuat data Keuangan...</td></tr> : 
                            paginated.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-5 font-bold text-slate-400 text-xs font-mono">{p.date ? new Date(p.date).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : 'N/A'}</td>
                                    <td className="p-5 font-bold text-slate-700 group-hover:text-rose-500 transition-colors">{(p.description || '-')}</td>
                                    <td className="p-5 text-right font-black text-rose-600 text-base font-mono">Rp{(p.amount || 0).toLocaleString('id-ID')}</td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button onClick={() => { setSelected(p); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all" title="Edit"><PencilIcon className="text-xl" /></button>
                                            <button onClick={() => setToDelete(p)} className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all" title="Hapus"><TrashIcon className="text-xl" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">Belum ada catatan pengeluaran pada periode ini</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {itemsPerPage !== 'all' && totalPages > 1 && (
                    <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-center gap-3">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 text-slate-400 disabled:opacity-30 hover:text-primary transition-colors"><i className="fa-solid fa-chevron-left text-lg"></i></button>
                        <div className="flex items-center gap-1 font-bold text-slate-700">
                          <span className="bg-primary text-white w-8 h-8 flex items-center justify-center rounded-lg shadow-sm text-xs">{currentPage}</span>
                          <span className="text-xs text-slate-400 px-2">/</span>
                          <span className="text-xs text-slate-400">{totalPages}</span>
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 text-slate-400 disabled:opacity-30 hover:text-primary transition-colors"><i className="fa-solid fa-chevron-right text-lg"></i></button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Edit Catatan Keuangan' : 'Catat Pengeluaran Baru'} size="lg">
                <PengeluaranForm pengeluaran={selected} onSave={async (d) => { if ('id' in d) await updatePengeluaran(d.id, d as Pengeluaran); else await createPengeluaran(d as any); fetchData(); setIsModalOpen(false); }} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            
            <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Konfirmasi Hapus">
                {toDelete && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrashIcon className="text-3xl" />
                        </div>
                        <p className="font-bold text-slate-800 text-lg">Hapus catatan pengeluaran?</p>
                        <p className="text-slate-500 text-sm mt-2 px-6">"{(toDelete.description || '-')}"</p>
                        <p className="text-xs text-rose-400 mt-4 italic">Tindakan ini akan mempengaruhi perhitungan saldo akhir desa.</p>
                        <div className="mt-10 flex gap-3">
                            <button onClick={() => setToDelete(null)} className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Batal</button>
                            <button onClick={async () => { await deletePengeluaran(toDelete.id); fetchData(); setToDelete(null); }} className="flex-1 py-4 rounded-2xl font-bold bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all">Ya, Hapus</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminKeuanganPage;
