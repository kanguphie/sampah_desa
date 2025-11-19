
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT } from '@/services/api';

const AdminCetakBarcodePage: React.FC = () => {
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ dukuhId: 'all', rtId: 'all' });
    const printRef = useRef<HTMLDivElement>(null);

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
                                body { font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact; }
                                .print-container { padding: 0.5cm; }
                                .barcode-grid-print { 
                                    display: grid; 
                                    grid-template-columns: repeat(3, 1fr); 
                                    gap: 0.5cm; 
                                }
                                .barcode-item-print { 
                                    display: flex; 
                                    flex-direction: column; 
                                    align-items: center; 
                                    justify-content: center; 
                                    page-break-inside: avoid; 
                                    border: 1px dashed #94a3b8; 
                                    padding: 15px; 
                                    border-radius: 8px; 
                                    text-align: center; 
                                    background: white;
                                }
                                .qr-container { margin-bottom: 10px; }
                                .name-text { margin: 5px 0 2px; font-size: 11pt; font-weight: 800; text-transform: uppercase; color: #0f172a; line-height: 1.2; }
                                .id-text { margin: 0; font-size: 10pt; font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #334152; }
                                .loc-text { margin-top: 2px; font-size: 9pt; color: #64748b; font-weight: 500; }
                                
                                @media print {
                                    @page { size: A4; margin: 1cm; }
                                    .barcode-item-print { box-shadow: none; }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="print-container">
                                <h2 style="text-align: center; font-size: 14pt; margin-bottom: 20px;">${title}</h2>
                                <div class="barcode-grid-print">${contentToPrint}</div>
                            </div>
                             <script>
                                window.addEventListener('load', () => {
                                    window.print();
                                    window.close();
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
                        <p className="mt-1 text-slate-500">Gunakan filter untuk memilih warga yang akan dicetak QR Code-nya.</p>
                    </div>
                    <button onClick={handlePrint} disabled={filteredWarga.length === 0} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus disabled:bg-slate-400 transition-colors">
                        Cetak ({filteredWarga.length})
                    </button>
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
                        <div key={warga.id} className="barcode-item-print border border-slate-300 p-4 rounded-lg flex flex-col items-center text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="qr-container p-1 bg-white">
                                <QRCodeSVG value={warga.id} size={120} />
                            </div>
                            <h3 className="name-text mt-3 font-bold text-sm text-slate-900 uppercase">{warga.name}</h3>
                            <p className="id-text text-sm text-slate-700 font-mono font-bold">{warga.id}</p>
                            <p className="loc-text text-xs text-slate-500 mt-1 font-medium">
                                {getDukuhName(warga.dukuhId)} - RT {getRTNumber(warga.rtId)}
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
