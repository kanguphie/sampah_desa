
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
            setList(all.filter(w => w.totalDebt > 0).sort((a,b) => b.totalDebt - a.totalDebt));
            setLoading(false);
        };
        fetch();
    }, []);

    const handlePrintSlip = (w: Warga) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                    @page { size: A4; margin: 25mm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 20mm; border: 1px solid #e2e8f0; }
                    .kop { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 30px; }
                    .kop h1 { margin: 0; color: #10b981; font-size: 24pt; font-weight: 800; }
                    .kop p { margin: 0; font-weight: 600; text-transform: uppercase; font-size: 10pt; }
                    .title { text-align: center; font-size: 14pt; font-weight: 800; text-decoration: underline; margin-bottom: 40px; }
                    .warga-info { margin-bottom: 30px; }
                    .warga-info table td { padding: 5px 10px; font-weight: 600; }
                    .content { margin-bottom: 40px; text-align: justify; }
                    .debt-box { background: #f8fafc; border: 2px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
                    .debt-box .label { font-size: 10pt; font-weight: 800; color: #ef4444; text-transform: uppercase; }
                    .debt-box .amount { font-size: 28pt; font-weight: 900; color: #ef4444; }
                    .footer-grid { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
                    .sign { text-align: center; }
                    .sign-line { margin-top: 70px; border-top: 1px solid black; font-weight: 800; }
                </style>
            </head>
            <body>
                <div class="kop">
                    <h1>SAPADESA</h1>
                    <p>Pengelolaan Sampah Desa Rowosari, Limpung, Batang</p>
                    <p style="font-size: 8pt; color: #64748b;">Sekretariat: Kantor Desa Rowosari, Jawa Tengah 51271</p>
                </div>
                <div class="title">SURAT TAGIHAN IURAN KEBERSIHAN</div>
                <p>Kepada Yth.<br/>Bapak/Ibu <strong>${w.name}</strong><br/>di Tempat.</p>
                <div class="content">
                    <p>Dengan hormat, melalui surat ini kami sampaikan informasi mengenai akumulasi tunggakan iuran pengelolaan sampah pada sistem <strong>SapaDesa</strong> atas identitas warga sebagai berikut:</p>
                    <div class="warga-info">
                        <table>
                            <tr><td>ID Warga</td><td>: ${w.id}</td></tr>
                            <tr><td>Nama Lengkap</td><td>: ${w.name}</td></tr>
                            <tr><td>Wilayah</td><td>: RT ${getRTById(w.rtId)?.number}, ${getDukuhById(w.dukuhId)?.name}</td></tr>
                        </table>
                    </div>
                    <p>Berdasarkan data sistem kami, Bapak/Ibu memiliki kewajiban iuran yang belum terselesaikan sebesar:</p>
                    <div class="debt-box">
                        <div class="label">Total Tunggakan</div>
                        <div class="amount">Rp${w.totalDebt.toLocaleString('id-ID')}</div>
                    </div>
                    <p>Mohon kiranya Bapak/Ibu dapat segera melakukan pelunasan iuran tersebut melalui petugas penagih lapangan atau datang langsung ke kantor desa. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>
                </div>
                <div class="footer-grid">
                    <div class="sign"><p>Warga Bersangkutan</p><div class="sign-line">${w.name}</div></div>
                    <div class="sign"><p>Rowosari, ${new Date().toLocaleDateString('id-ID', {dateStyle:'long'})}<br/>Admin SapaDesa</p><div class="sign-line">( .................................... )</div></div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex justify-between items-center shadow-inner">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang Desa</p><p className="text-4xl font-black text-rose-600 tracking-tight">Rp${list.reduce((s,i)=>s+i.totalDebt,0).toLocaleString('id-ID')}</p></div>
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
                                    <p className="text-xs text-slate-500 font-medium">RT ${getRTById(w.rtId)?.number}, ${getDukuhById(w.dukuhId)?.name} • ID: ${w.id}</p>
                                </td>
                                <td className="p-6 text-right font-black text-rose-600 text-lg">Rp${w.totalDebt.toLocaleString('id-ID')}</td>
                                <td className="p-6 text-center">
                                    <button onClick={() => handlePrintSlip(w)} className="bg-slate-900 text-white hover:bg-black px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-lg shadow-slate-900/10"><DownloadIcon className="text-sm" /> Cetak Surat Tagihan (A4)</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnpaidReport;
