
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
                    @page { size: 210mm 99mm; margin: 1cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; margin: 0; padding: 0; background: white; }
                    
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px; }
                    .header-left .logo { color: #10b981; font-size: 18pt; font-weight: 800; margin: 0; line-height: 1; }
                    .header-left .sub-1 { font-size: 8pt; font-weight: 700; color: #1e293b; margin: 5px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 6.5pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    
                    .header-right { text-align: right; }
                    .slip-title { font-size: 12pt; font-weight: 800; text-transform: uppercase; color: #1e293b; }
                    .print-date { font-size: 7.5pt; color: #94a3b8; font-weight: 600; margin-top: 5px; }
                    
                    .content-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-top: 10px; }
                    
                    .info-section { border-right: 1px dashed #e2e8f0; padding-right: 20px; }
                    .info-row { display: flex; margin-bottom: 6px; font-size: 9pt; }
                    .label { color: #64748b; font-weight: 700; width: 100px; text-transform: uppercase; font-size: 7pt; }
                    .value { font-weight: 800; color: #1e293b; flex: 1; }
                    
                    .debt-section { background: #fff1f2; padding: 12px; border-radius: 12px; text-align: center; border: 1px solid #fecdd3; display: flex; flex-direction: column; justify-content: center; }
                    .debt-label { font-size: 8pt; font-weight: 800; color: #e11d48; text-transform: uppercase; margin-bottom: 4px; }
                    .debt-amount { font-size: 24pt; font-weight: 900; color: #e11d48; letter-spacing: -1px; }
                    
                    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; }
                    .footer-msg { font-size: 7pt; color: #64748b; width: 60%; font-style: italic; }
                    .sign-box { display: flex; gap: 40px; font-size: 8pt; }
                    .sign { width: 100px; text-align: center; }
                    .sign-line { margin-top: 30px; border-top: 1.5px solid #000; padding-top: 3px; font-weight: 800; }
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
                        <div class="slip-title">SLIP TUNGGAKAN IURAN</div>
                        <div class="print-date">TGL CETAK: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
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
                                    <p className="text-xs text-slate-500 font-medium font-mono">ID: {w.id} • RT {getRTById(w.rtId)?.number}, {getDukuhById(w.dukuhId)?.name}</p>
                                </td>
                                <td className="p-6 text-right font-black text-rose-600 text-lg font-mono">Rp{w.totalDebt.toLocaleString('id-ID')}</td>
                                <td className="p-6 text-center">
                                    <button onClick={() => handlePrintSlip(w)} className="bg-slate-900 text-white hover:bg-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-slate-900/10"><ClipboardListIcon className="text-sm" /> Cetak Slip Tunggakan (DL)</button>
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
