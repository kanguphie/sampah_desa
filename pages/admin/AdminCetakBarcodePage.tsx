
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT } from '@/services/api';
import { useVillageProfile } from '@/context/VillageProfileContext';

const AdminCetakBarcodePage: React.FC = () => {
    const { profile } = useVillageProfile();
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ dukuhId: 'all', rtId: 'all' });
    const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'A3+'>('A4');
    const printRef = useRef<HTMLDivElement>(null);

    const paperDimensions = {
        'A4': 'A4',
        'A3': 'A3',
        'A3+': '329mm 483mm'
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [wargaData, dukuhData, rtData] = await Promise.all([getAllWarga(), getAllDukuh(), getAllRT()]);
                setWargaList(wargaData);
                setDukuhList(dukuhData);
                setRtList(rtData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            return newFilters;
        });
    };
    
    const availableRTs = useMemo(() => rtList, [rtList]);

    const filteredWarga = useMemo(() => {
        return wargaList.filter(warga => {
            const dukuhMatch = filters.dukuhId === 'all' || warga.dukuhId === Number(filters.dukuhId);
            const rtMatch = filters.rtId === 'all' || warga.rtId === Number(filters.rtId);
            return dukuhMatch && rtMatch;
        });
    }, [wargaList, filters]);

    const getDukuhName = (id: number) => dukuhList.find(d => d.id === id)?.name || 'N/A';
    const getRTNumber = (id: number) => rtList.find(r => r.id === id)?.number || 'N/A';

    const handlePrint = () => {
        const contentToPrint = printRef.current?.innerHTML;
        const dukuhName = filters.dukuhId !== 'all' ? dukuhList.find(d => d.id === Number(filters.dukuhId))?.name : 'Semua Dukuh';
        const rtNumber = filters.rtId !== 'all' ? `RT ${rtList.find(r => r.id === Number(filters.rtId))?.number}` : 'Semua RT';
        const title = `Barcode Warga - ${dukuhName}, ${rtNumber}`;

        if (contentToPrint) {
            const printWindow = window.open('', '_blank');
            if(printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>${title}</title>
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                                body { 
                                    font-family: 'Plus Jakarta Sans', sans-serif; 
                                    -webkit-print-color-adjust: exact; 
                                    margin: 0;
                                    padding: 0;
                                    color: #1e293b;
                                }
                                .print-container { padding: 0.5cm; }
                                .barcode-grid-print { 
                                    display: grid; 
                                    grid-template-columns: repeat(auto-fill, minmax(5.8cm, 1fr)); 
                                    gap: 0.5cm; 
                                    width: 100%;
                                }
                                .barcode-item-print { 
                                    display: flex; 
                                    flex-direction: column; 
                                    align-items: center; 
                                    justify-content: center; 
                                    page-break-inside: avoid; 
                                    border: 1px solid #e2e8f0; 
                                    padding: 20px; 
                                    border-radius: 12px; 
                                    text-align: center; 
                                    background: white;
                                    min-height: 5.5cm;
                                    box-sizing: border-box;
                                }
                                .logo-print { 
                                    height: 24px; 
                                    margin-bottom: 12px; 
                                    object-fit: contain; 
                                }
                                .branding-fallback {
                                    font-size: 11pt;
                                    font-weight: 800;
                                    color: #0f172a;
                                    margin-bottom: 12px;
                                    letter-spacing: -0.02em;
                                }
                                .qr-container { 
                                    padding: 5px;
                                    background: white;
                                    margin-bottom: 5px;
                                }
                                .name-text { 
                                    margin: 10px 0 2px; 
                                    font-size: 11pt; 
                                    font-weight: 800; 
                                    text-transform: uppercase; 
                                    color: #0f172a; 
                                    line-height: 1.2; 
                                    word-break: break-word;
                                }
                                .id-text { 
                                    margin: 0; 
                                    font-size: 10pt; 
                                    font-family: 'Courier New', Courier, monospace; 
                                    font-weight: 700; 
                                    color: #475569; 
                                }
                                .loc-text { 
                                    margin-top: 6px; 
                                    font-size: 9pt; 
                                    color: #64748b; 
                                    font-weight: 600; 
                                }
                                
                                @media print {
                                    @page { 
                                        size: ${paperDimensions[paperSize]}; 
                                        margin: 15mm; 
                                    }
                                    body { 
                                        padding: 0; 
                                        margin: 0;
                                    }
                                    .barcode-grid-print {
                                        gap: 8mm;
                                    }
                                    .barcode-item-print { 
                                        border-color: #cbd5e1; 
                                        break-inside: avoid;
                                        page-break-inside: avoid;
                                        margin-bottom: 2mm;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="print-container">
                                <div class="barcode-grid-print">${contentToPrint}</div>
                            </div>
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
                printWindow.document.close();
            }
        }
    };


    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Cetak Barcode Warga</h1>
                        <p className="mt-1 text-slate-500">Gunakan filter untuk memilih warga dan ukuran kertas.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <span className="text-xs font-bold text-slate-500 uppercase">Ukuran Kertas:</span>
                            <select 
                                value={paperSize} 
                                onChange={(e) => setPaperSize(e.target.value as any)}
                                className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none focus:ring-0"
                            >
                                <option value="A4">A4 (Standar)</option>
                                <option value="A3">A3</option>
                                <option value="A3+">A3+ (Stiker 32.9cm x 48.3cm)</option>
                            </select>
                        </div>
                        <button onClick={handlePrint} disabled={filteredWarga.length === 0} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus disabled:bg-slate-400 transition-colors">
                            Cetak ({filteredWarga.length})
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Filter Dukuh</label>
                        <select name="dukuhId" value={filters.dukuhId} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg w-full">
                            <option value="all">Semua Dukuh</option>
                            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Filter RT</label>
                        <select name="rtId" value={filters.rtId} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg w-full">
                            <option value="all">Semua RT</option>
                            {availableRTs.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            
            {loading ? <p className="text-center text-slate-500 py-10">Memuat data warga...</p> : (
                <div ref={printRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredWarga.map(warga => (
                        <div key={warga.id} className="barcode-item-print border border-slate-200 p-6 rounded-2xl flex flex-col items-center text-center bg-white shadow-sm hover:shadow-md transition-all">
                            {/* Logo / Branding Header */}
                            {profile?.logo_horizontal_url ? (
                                <img src={profile.logo_horizontal_url} alt="Logo" className="logo-print mb-3 h-7 object-contain" />
                            ) : profile?.logo_url ? (
                                <img src={profile.logo_url} alt="Logo" className="logo-print mb-3 h-7 object-contain" />
                            ) : (
                                <div className="branding-fallback mb-3 font-black text-slate-800 text-sm">{profile?.branding_title || 'SapaDesa'}</div>
                            )}

                            <div className="qr-container p-1 bg-white mb-2">
                                <QRCodeSVG value={warga.id} size={140} />
                            </div>
                            
                            <h3 className="name-text mt-3 font-black text-base text-slate-900 uppercase tracking-tight leading-tight">{warga.name}</h3>
                            <p className="id-text text-sm text-slate-500 font-mono font-bold tracking-widest">{warga.id}</p>
                            <p className="loc-text text-[11px] text-slate-400 mt-2 font-semibold uppercase tracking-wider">
                                {getDukuhName(warga.dukuhId)} — RT {getRTNumber(warga.rtId)}
                            </p>
                        </div>
                    ))}
                </div>
            )}
             {filteredWarga.length === 0 && !loading && (
                <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-200/80">
                    <p className="text-slate-500 font-semibold">Tidak ada data warga sesuai filter</p>
                    <p className="text-sm text-slate-400 mt-1">Silakan ubah filter di atas untuk menampilkan data.</p>
                </div>
            )}
        </div>
    );
};

export default AdminCetakBarcodePage;
