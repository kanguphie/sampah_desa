
import React, { useState, useEffect, useMemo } from 'react';
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
            <html><head><style>
                body{font-family:'Plus Jakarta Sans',sans-serif;background:#f8fafc;padding:50px;display:flex;justify-content:center;}
                .slip{background:white;width:380px;border-radius:24px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.1);overflow:hidden;border:1px solid #e2e8f0;}
                .head{background:#10b981;padding:30px;text-align:center;color:white;}
                .head h2{margin:0;font-size:18pt;font-weight:900;letter-spacing:-0.5px;}
                .body{padding:30px;}
                .row{display:flex;justify-content:space-between;margin-bottom:15px;font-size:10pt;}
                .label{color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:8pt;}
                .value{color:#1e293b;font-weight:800;}
                .total-box{background:#f1f5f9;padding:25px;border-radius:16px;text-align:center;margin-top:20px;}
                .total-val{font-size:24pt;font-weight:900;color:#ef4444;display:block;}
                .footer{padding:20px;text-align:center;font-size:8pt;color:#94a3b8;border-top:1px dashed #e2e8f0;}
            </style></head><body>
                <div class="slip">
                    <div class="head"><h2>TAGIHAN IURAN</h2><p>ROWOSARI RowoPintar</p></div>
                    <div class="body">
                        <div class="row"><span class="label">ID WARGA</span><span class="value">${w.id}</span></div>
                        <div class="row"><span class="label">NAMA</span><span class="value">${w.name}</span></div>
                        <div class="row"><span class="label">WILAYAH</span><span class="value">RT ${getRTById(w.rtId)?.number}, ${getDukuhById(w.dukuhId)?.name}</span></div>
                        <div class="total-box"><span class="label">TOTAL TUNGGAKAN</span><span class="total-val">Rp${w.totalDebt.toLocaleString('id-ID')}</span></div>
                    </div>
                    <div class="footer">Dicetak pada ${new Date().toLocaleString('id-ID')}</div>
                </div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body></html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang Desa</p><p className="text-3xl font-black text-rose-600 tracking-tight">Rp{list.reduce((s,i)=>s+i.totalDebt,0).toLocaleString('id-ID')}</p></div>
                <div className="text-right"><p className="text-xs font-bold text-slate-500">{list.length} Warga Terdaftar Tunggakan</p></div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-5">Warga</th><th className="p-5">Wilayah</th><th className="p-5 text-right">Tunggakan</th><th className="p-5 text-center">Tindakan</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? <tr><td colSpan={4} className="p-10 text-center animate-pulse">Memuat...</td></tr> : 
                        list.map(w => (
                            <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5"><p className="font-bold text-slate-700">{w.name}</p><p className="text-[10px] text-slate-400 font-bold">{w.id}</p></td>
                                <td className="p-5 text-slate-500 font-medium italic">RT {getRTById(w.rtId)?.number}, {getDukuhById(w.dukuhId)?.name}</td>
                                <td className="p-5 text-right font-black text-rose-600">Rp{w.totalDebt.toLocaleString('id-ID')}</td>
                                <td className="p-5 text-center"><button onClick={() => handlePrintSlip(w)} className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mx-auto transition-all shadow-sm"><ClipboardListIcon className="text-sm" /> Cetak Slip</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UnpaidReport;
