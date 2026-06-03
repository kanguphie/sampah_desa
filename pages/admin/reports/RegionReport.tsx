
import React, { useState, useEffect } from 'react';
import { getAllDukuh, getReports } from '@/services/api';
import type { Dukuh } from '@/types';
import { DownloadIcon } from '@/components/icons';

const RegionReport: React.FC = () => {
    const [dukuhs, setDukuhs] = useState<Dukuh[]>([]);
    const [selectedDukuh, setSelectedDukuh] = useState<string>('all');
    const [regionData, setRegionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const d = await getAllDukuh();
            setDukuhs(d);
            
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const startStr = `${year}-${month}-01`;
            const endStr = `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`;
            const r = await getReports({ startDate: startStr, endDate: endStr });
            
            // Group by Region
            const grouped = d.map(dukuh => {
                const txs = r.filter(tx => tx.dukuhName === dukuh.name);
                return {
                    id: dukuh.id,
                    name: dukuh.name,
                    total: txs.reduce((s, i) => s + i.amount, 0),
                    count: txs.length
                };
            });
            setRegionData(grouped);
            setLoading(false);
        };
        fetch();
    }, []);

    const filtered = selectedDukuh === 'all' ? regionData : regionData.filter(r => r.id === Number(selectedDukuh));

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const rows = filtered.map(r => `<tr><td>${r.name}</td><td>${r.count} Transaksi</td><td style="text-align:right">Rp${r.total.toLocaleString('id-ID')}</td></tr>`).join('');
        printWindow.document.write(`<html><head><style>body{font-family:'Plus Jakarta Sans',sans-serif;padding:50px;color:#1e293b;} .kop{text-align:center;border-bottom:3px double #10b981;margin-bottom:30px;padding-bottom:15px;} h1{color:#10b981;margin:0;font-size:24pt;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #e2e8f0;padding:15px;text-align:left;} th{background:#f8fafc;color:#475569;text-transform:uppercase;font-size:9pt;letter-spacing:1px;}</style></head><body><div class="kop"><h1>SAPADESA</h1><p>ROWOSARI • LIMPUNG • BATANG</p></div><h2 style="text-align:center">REKAPITULASI PEMASUKAN PER WILAYAH</h2><p style="text-align:center">Periode Bulan Berjalan</p><table><thead><tr><th>Dukuh/Wilayah</th><th>Volume Transaksi</th><th style="text-align:right">Total Kontribusi</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Filter Wilayah Khusus</label>
                    <select value={selectedDukuh} onChange={e => setSelectedDukuh(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="all">Seluruh Wilayah Desa</option>
                        {dukuhs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <button onClick={handlePrint} className="w-full md:w-auto bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all"><DownloadIcon /> Cetak Laporan Wilayah</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(region => (
                    <div key={region.id} className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mt-16 -mr-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-4">{region.name}</h3>
                        <div className="space-y-4 relative z-10">
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partisipasi</p><p className="text-lg font-bold text-slate-700">{region.count} Transaksi</p></div>
                            <div className="pt-4 border-t border-slate-50"><p className="text-[10px] font-black text-primary uppercase tracking-widest">Kontribusi Iuran</p><p className="text-2xl font-black text-emerald-600">Rp{region.total.toLocaleString('id-ID')}</p></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RegionReport;
