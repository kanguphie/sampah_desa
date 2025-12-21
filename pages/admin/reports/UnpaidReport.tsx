
import React, { useState, useEffect, useMemo } from 'react';
import { getAllWarga, getDukuhById, getRTById } from '@/services/api';
import type { Warga } from '@/types';
import { DownloadIcon, ClipboardListIcon, CheckCircleIcon } from '@/components/icons';

const UnpaidReport: React.FC = () => {
    const [list, setList] = useState<Warga[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const all = await getAllWarga();
            // Filter only those with debt
            const withDebt = all.filter(w => (w.totalDebt || 0) > 0).sort((a,b) => (b.totalDebt || 0) - (a.totalDebt || 0));
            setList(withDebt);
            setLoading(false);
        };
        fetch();
    }, []);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === list.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(list.map(w => w.id)));
        }
    };

    const generateSlipHtml = (w: Warga) => {
        const rtNum = getRTById(w.rtId)?.number || 'N/A';
        const dukuhName = getDukuhById(w.dukuhId)?.name || 'N/A';
        
        return `
            <div class="slip-wrapper">
                <div class="header">
                    <div class="header-left">
                        <h1 class="logo">SAPADESA</h1>
                        <p class="sub-1">PENGELOLAAN SAMPAH DESA ROWOSARI, BATANG</p>
                        <p class="sub-2">SEKRETARIAT: KANTOR DESA ROWOSARI, JAWA TENGAH 51271</p>
                    </div>
                    <div class="header-right">
                        <div class="slip-title">SLIP TUNGGAKAN IURAN</div>
                        <div class="print-date">TGL CETAK: ${new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                </div>

                <div class="content-grid">
                    <div class="info-section">
                        <div class="info-row"><span class="label">ID WARGA:</span><span class="value">${w.id}</span></div>
                        <div class="info-row"><span class="label">NAMA LENGKAP:</span><span class="value">${w.name}</span></div>
                        <div class="info-row"><span class="label">WILAYAH:</span><span class="value">RT ${rtNum}, ${dukuhName}</span></div>
                        <div class="info-row" style="margin-top:10px;"><span class="label">STATUS:</span><span class="value" style="color:#e11d48;">BELUM TERBAYAR</span></div>
                    </div>

                    <div class="debt-section">
                        <div class="debt-label">TOTAL TUNGGAKAN</div>
                        <div class="debt-amount">Rp${w.totalDebt.toLocaleString('id-ID')}</div>
                    </div>
                </div>

                <div class="footer">
                    <p class="footer-msg">PENTING: Harap segera melakukan pelunasan tunggakan iuran kebersihan melalui petugas penagih atau kantor desa Rowosari. Abaikan jika Anda telah melunasi.</p>
                    <div class="sign-box">
                        <div class="sign"><p>Warga</p><div class="sign-line">${w.name}</div></div>
                        <div class="sign"><p>Petugas</p><div class="sign-line">( .................... )</div></div>
                    </div>
                </div>
            </div>
        `;
    };

    const handlePrintSlips = (targetWargas: Warga[]) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const allSlips = targetWargas.map(w => generateSlipHtml(w)).join('');

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4 portrait; margin: 0; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; background: white; }
                    
                    /* Slip Wrapper set to 1/3 of A4 Height (approx 99mm) */
                    .slip-wrapper { 
                        height: 98mm; 
                        box-sizing: border-box; 
                        padding: 10mm; 
                        border-bottom: 1px dashed #cbd5e1;
                        page-break-inside: avoid;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    /* Last slip on page doesn't need border but let's keep it for cutting guide */
                    .slip-wrapper:nth-child(3n) { border-bottom: 1px dashed #94a3b8; }

                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
                    .header-left .logo { color: #10b981; font-size: 16pt; font-weight: 800; margin: 0; line-height: 1; }
                    .header-left .sub-1 { font-size: 7.5pt; font-weight: 700; color: #1e293b; margin: 4px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 6pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    
                    .header-right { text-align: right; }
                    .slip-title { font-size: 11pt; font-weight: 800; text-transform: uppercase; color: #1e293b; }
                    .print-date { font-size: 7pt; color: #94a3b8; font-weight: 600; margin-top: 3px; }
                    
                    .content-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 15px; margin-top: 8px; }
                    
                    .info-section { border-right: 1px dashed #e2e8f0; padding-right: 15px; }
                    .info-row { display: flex; margin-bottom: 5px; font-size: 8.5pt; }
                    .label { color: #64748b; font-weight: 700; width: 90px; text-transform: uppercase; font-size: 6.5pt; }
                    .value { font-weight: 800; color: #1e293b; flex: 1; }
                    
                    .debt-section { background: #fff1f2; padding: 10px; border-radius: 10px; text-align: center; border: 1px solid #fecdd3; display: flex; flex-direction: column; justify-content: center; }
                    .debt-label { font-size: 7.5pt; font-weight: 800; color: #e11d48; text-transform: uppercase; margin-bottom: 2px; }
                    .debt-amount { font-size: 22pt; font-weight: 900; color: #e11d48; letter-spacing: -1px; }
                    
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; }
                    .footer-msg { font-size: 6.5pt; color: #64748b; width: 65%; font-style: italic; margin: 0; line-height: 1.3; }
                    .sign-box { display: flex; gap: 30px; font-size: 7.5pt; }
                    .sign { width: 90px; text-align: center; }
                    .sign-line { margin-top: 25px; border-top: 1.5px solid #000; padding-top: 2px; font-weight: 800; text-transform: uppercase; font-size: 7pt; }
                    
                    @media print {
                        .slip-wrapper:nth-child(3n) { page-break-after: always; }
                    }
                </style>
            </head>
            <body>
                ${allSlips}
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handlePrintSelected = () => {
        const selectedWargas = list.filter(w => selectedIds.has(w.id));
        if (selectedWargas.length > 0) {
            handlePrintSlips(selectedWargas);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center shadow-inner gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">
                        <ClipboardListIcon className="text-3xl text-rose-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang Desa</p>
                        <p className="text-4xl font-black text-rose-600 tracking-tight">Rp{list.reduce((s,i)=>s+(i.totalDebt || 0),0).toLocaleString('id-ID')}</p>
                    </div>
                </div>
                
                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <div className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black uppercase">
                        {list.length} Rumah Tunggakan
                    </div>
                    {selectedIds.size > 0 && (
                        <button 
                            onClick={handlePrintSelected}
                            className="w-full md:w-auto bg-primary text-white hover:bg-primary-focus px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all animate-fade-in"
                        >
                            <DownloadIcon /> Cetak Pilihan (${selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="p-6 w-12">
                                    <div className="flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={list.length > 0 && selectedIds.size === list.length}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all"
                                        />
                                    </div>
                                </th>
                                <th className="p-6">Warga & Wilayah</th>
                                <th className="p-6 text-right">Nilai Tunggakan</th>
                                <th className="p-6 text-center">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memproses Data Tunggakan...</td></tr>
                            ) : list.length > 0 ? (
                                list.map(w => (
                                    <tr key={w.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.has(w.id) ? 'bg-emerald-50/30' : ''}`}>
                                        <td className="p-6">
                                            <div className="flex items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(w.id)}
                                                    onChange={() => toggleSelect(w.id)}
                                                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-all"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-6" onClick={() => toggleSelect(w.id)}>
                                            <div className="cursor-pointer">
                                                <p className="font-bold text-slate-800 text-base group-hover:text-primary transition-colors">{w.name}</p>
                                                <p className="text-xs text-slate-500 font-medium font-mono">ID: {w.id} • RT {getRTById(w.rtId)?.number}, {getDukuhById(w.dukuhId)?.name}</p>
                                            </div>
                                        </td>
                                        <td className="p-6 text-right font-black text-rose-600 text-lg font-mono">Rp{w.totalDebt.toLocaleString('id-ID')}</td>
                                        <td className="p-6 text-center">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handlePrintSlips([w]); }} 
                                                className="bg-slate-900 text-white hover:bg-black px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-slate-900/10"
                                            >
                                                <ClipboardListIcon className="text-sm" /> Cetak Slip
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic uppercase tracking-widest text-xs">Tidak ada warga yang memiliki tunggakan saat ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                <div className="bg-white p-2.5 rounded-xl shadow-sm"><CheckCircleIcon className="text-blue-500 text-xl" /></div>
                <div>
                    <p className="text-sm font-bold text-blue-800">Tips Penghematan Kertas</p>
                    <p className="text-xs text-blue-600 mt-1">Sistem akan otomatis mengatur layout cetak. Gunakan fitur "Pilih Semua" dan "Cetak Pilihan" untuk mencetak maksimal 3 slip per halaman A4 agar penggunaan kertas lebih efisien.</p>
                </div>
            </div>
        </div>
    );
};

export default UnpaidReport;
