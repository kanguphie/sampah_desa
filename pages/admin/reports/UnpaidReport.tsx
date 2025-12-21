
import React, { useState, useEffect } from 'react';
import { getAllWarga, getDukuhById, getRTById } from '@/services/api';
import type { Warga } from '@/types';
import { DownloadIcon, ClipboardListIcon } from '@/components/icons';

const UnpaidReport: React.FC = () => {
    const [list, setList] = useState<Warga[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const all = await getAllWarga();
            setList(all.filter(w => (w.totalDebt || 0) > 0).sort((a,b) => (b.totalDebt || 0) - (a.totalDebt || 0)));
            setLoading(false);
        };
        fetch();
    }, []);

    const handlePrintSlip = (w: Warga) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        const rtNum = getRTById(w.rtId)?.number || 'N/A';
        const dukuhName = getDukuhById(w.dukuhId)?.name || 'N/A';

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: 100mm 210mm; margin: 1cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; background: white; }
                    
                    .slip-container { border: 1px dashed #cbd5e1; padding: 15px; border-radius: 8px; }
                    
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
                    .header-left .logo { color: #10b981; font-size: 16pt; font-weight: 800; margin: 0; line-height: 1; }
                    .header-left .sub-1 { font-size: 6.5pt; font-weight: 700; color: #1e293b; margin: 4px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 5.5pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    
                    .header-right { text-align: right; }
                    .slip-title { font-size: 9pt; font-weight: 800; text-transform: uppercase; }
                    .print-date { font-size: 6pt; color: #94a3b8; font-weight: 600; }
                    
                    .info-grid { margin: 15px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 10px 0; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 8.5pt; }
                    .label { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 7pt; }
                    .value { font-weight: 700; text-align: right; }
                    
                    .debt-section { background: #fff1f2; padding: 15px; border-radius: 8px; text-align: center; margin-top: 10px; }
                    .debt-label { font-size: 7.5pt; font-weight: 800; color: #e11d48; text-transform: uppercase; margin-bottom: 4px; }
                    .debt-amount { font-size: 20pt; font-weight: 900; color: #e11d48; }
                    
                    .footer-text { font-size: 7.5pt; text-align: center; color: #64748b; margin-top: 15px; line-height: 1.4; font-style: italic; }
                    .signature-box { display: flex; justify-content: space-between; margin-top: 25px; font-size: 8pt; }
                    .sign { width: 40%; text-align: center; }
                    .sign-line { margin-top: 35px; border-top: 1px solid #000; padding-top: 3px; font-weight: 800; }
                </style>
            </head>
            <body>
                <div class="slip-container">
                    <div class="header">
                        <div class="header-left">
                            <h1 class="logo">SAPADESA</h1>
                            <p class="sub-1">PEMDES ROWOSARI, LIMPUNG, BATANG</p>
                        </div>
                        <div class="header-right">
                            <div class="slip-title">SLIP TUNGGAKAN</div>
                            <div class="print-date">DICETAK: ${new Date().toLocaleDateString('id-ID')}</div>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="info-row"><span class="label">ID WARGA:</span><span class="value">${w.id}</span></div>
                        <div class="info-row"><span class="label">NAMA LENGKAP:</span><span class="value">${w.name}</span></div>
                        <div class="info-row"><span class="label">WILAYAH:</span><span class="value">RT ${rtNum}, ${dukuhName}</span></div>
                    </div>

                    <div class="debt-section">
                        <div class="debt-label">TOTAL TUNGGAKAN IURAN</div>
                        <div class="debt-amount">Rp${w.totalDebt.toLocaleString('id-ID')}</div>
                    </div>

                    <p class="footer-text">Harap segera melakukan pelunasan tunggakan iuran kebersihan melalui petugas lapangan atau kantor desa Rowosari.</p>
                    
                    <div class="signature-box">
                        <div class="sign"><p>Warga</p><div class="sign-line">${w.name}</div></div>
                        <div class="sign"><p>Petugas</p><div class="sign-line">( .................... )</div></div>
                    </div>
                </div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex justify-between items-center shadow-inner">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang Desa</p><p className="text-4xl font-black text-rose-600 tracking-tight">Rp{list.reduce((s,i)=>s+(i.totalDebt || 0),0).toLocaleString('id-ID')}</p></div>
                <div className="text-right"><p className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-xs font-black uppercase">{list.length} Rumah Tunggakan</p></div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-6">Warga & Wilayah</th><th className="p-6 text-right">Nilai Tunggakan</th><th className="p-6 text-center">Tindakan</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={3} className="p-10 text-center animate-pulse">Memuat...</td></tr> : 
                        list.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-6">
                                    <p className="font-bold text-slate-800 text-base">{w.name}</p>
                                    <p className="text-xs text-slate-500 font-medium font-mono">ID: ${w.id} • RT ${getRTById(w.rtId)?.number}, ${getDukuhById(w.dukuhId)?.name}</p>
                                </td>
                                <td className="p-6 text-right font-black text-rose-600 text-lg font-mono">Rp${w.totalDebt.toLocaleString('id-ID')}</td>
                                <td className="p-6 text-center">
                                    <button onClick={() => handlePrintSlip(w)} className="bg-slate-900 text-white hover:bg-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-slate-900/10"><ClipboardListIcon className="text-sm" /> Cetak Slip Tunggakan</button>
                                </td>
                            </tr>
                        ))}
                        {!loading && list.length === 0 && (
                            <tr><td colSpan={3} className="p-12 text-center text-slate-400 font-bold italic">Tidak ada warga yang memiliki tunggakan.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnpaidReport;
