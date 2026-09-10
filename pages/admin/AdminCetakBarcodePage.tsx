
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT } from '@/services/api';
import { useVillageProfile } from '@/context/VillageProfileContext';
import { DownloadIcon } from '@/components/icons';

const AdminCetakBarcodePage: React.FC = () => {
    const { profile } = useVillageProfile();
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<string>('');
    const [filters, setFilters] = useState({ dukuhId: 'all', rtId: 'all' });
    const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'A3+'>('A3+');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const printRef = useRef<HTMLDivElement>(null);

    // Exact layout calculation based on paper dimensions, 1cm margins, 6x8cm cards, and 0.22cm gap
    const getPageLayout = (paper: 'A4' | 'A3' | 'A3+', orient: 'portrait' | 'landscape') => {
        const baseDimensions: Record<'A4' | 'A3' | 'A3+', [number, number]> = {
            'A4': [210, 297],
            'A3': [297, 420],
            'A3+': [329, 483]
        };

        const [rawW, rawH] = baseDimensions[paper];
        const pageWidth = orient === 'landscape' ? rawH : rawW;
        const pageHeight = orient === 'landscape' ? rawW : rawH;

        const margin = 10;  // 10 mm (1 cm)
        const gap = 2.2;    // 2.2 mm (0.22 cm)
        const cardW = 60;   // 60 mm (6.0 cm)
        const cardH = 80;   // 80 mm (8.0 cm)

        const printableW = pageWidth - (2 * margin);
        const printableH = pageHeight - (2 * margin);

        const cols = Math.floor((printableW + gap) / (cardW + gap));
        const rows = Math.floor((printableH + gap) / (cardH + gap));
        const cardsPerPage = cols * rows;

        return {
            pageWidth,
            pageHeight,
            margin,
            gap,
            cardW,
            cardH,
            cols,
            rows,
            cardsPerPage
        };
    };

    const currentLayout = useMemo(() => {
        return getPageLayout(paperSize, orientation);
    }, [paperSize, orientation]);

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
        if (!printRef.current || filteredWarga.length === 0) return;

        const layout = currentLayout;
        const dukuhName = filters.dukuhId !== 'all' ? dukuhList.find(d => d.id === Number(filters.dukuhId))?.name : 'Semua Dukuh';
        const rtNumber = filters.rtId !== 'all' ? `RT ${rtList.find(r => r.id === Number(filters.rtId))?.number}` : 'Semua RT';
        const title = `Barcode Warga - ${dukuhName}, ${rtNumber}`;

        const cardElements = Array.from(printRef.current.children) as HTMLElement[];
        const pages: HTMLElement[][] = [];
        for (let i = 0; i < cardElements.length; i += layout.cardsPerPage) {
            pages.push(cardElements.slice(i, i + layout.cardsPerPage));
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const pagesHtml = pages.map((pageCards, idx) => `
            <div class="print-page ${idx === pages.length - 1 ? 'last-page' : ''}">
                <div class="barcode-grid-print">
                    ${pageCards.map(c => c.outerHTML).join('')}
                </div>
            </div>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>${title}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                        
                        * {
                            box-sizing: border-box;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }

                        @page { 
                            size: ${layout.pageWidth}mm ${layout.pageHeight}mm; 
                            margin: 0; 
                        }
                        
                        html, body { 
                            margin: 0;
                            padding: 0;
                            background: #ffffff;
                            font-family: 'Plus Jakarta Sans', sans-serif; 
                            color: #1e293b;
                        }

                        .print-page { 
                            width: ${layout.pageWidth}mm;
                            height: ${layout.pageHeight}mm;
                            max-height: ${layout.pageHeight}mm;
                            padding: ${layout.margin}mm;
                            box-sizing: border-box;
                            page-break-after: always;
                            break-after: page;
                            overflow: hidden;
                            background: #ffffff;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: flex-start;
                        }

                        .print-page.last-page {
                            page-break-after: auto;
                            break-after: auto;
                        }

                        .barcode-grid-print { 
                            display: grid; 
                            grid-template-columns: repeat(${layout.cols}, ${layout.cardW}mm); 
                            gap: ${layout.gap}mm; 
                            justify-content: center;
                            width: 100%;
                            margin: 0;
                            padding: 0;
                        }

                        .barcode-item-print { 
                            width: ${layout.cardW}mm !important;
                            height: ${layout.cardH}mm !important;
                            min-width: ${layout.cardW}mm !important;
                            max-width: ${layout.cardW}mm !important;
                            min-height: ${layout.cardH}mm !important;
                            max-height: ${layout.cardH}mm !important;
                            display: flex !important; 
                            flex-direction: column !important; 
                            align-items: center !important; 
                            justify-content: flex-start !important; 
                            border: 1px solid #cbd5e1 !important; 
                            padding: 3.5mm 2.5mm !important; 
                            border-radius: 8px !important; 
                            text-align: center !important; 
                            background: #ffffff !important;
                            box-sizing: border-box !important;
                            margin: 0 !important;
                            overflow: hidden !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                        }

                        .logo-print { 
                            height: 18px !important; 
                            max-height: 18px !important;
                            margin-bottom: 2mm !important; 
                            object-fit: contain !important; 
                        }

                        .branding-fallback {
                            font-size: 8pt !important;
                            font-weight: 800 !important;
                            color: #0f172a !important;
                            margin-bottom: 2mm !important;
                            letter-spacing: -0.02em !important;
                            line-height: 1.2 !important;
                        }

                        .qr-container { 
                            width: 124px !important;
                            height: 124px !important;
                            min-width: 124px !important;
                            min-height: 124px !important;
                            max-width: 124px !important;
                            max-height: 124px !important;
                            padding: 2px !important;
                            background: #ffffff !important;
                            margin: 0 auto 2.5mm auto !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            overflow: hidden !important;
                            box-sizing: border-box !important;
                        }

                        .qr-container svg {
                            width: 120px !important;
                            height: 120px !important;
                            min-width: 120px !important;
                            min-height: 120px !important;
                            max-width: 120px !important;
                            max-height: 120px !important;
                            display: block !important;
                        }

                        .name-text { 
                            margin: 0 0 1.5mm 0 !important; 
                            padding: 2px 2px !important;
                            font-size: 8.5pt !important; 
                            font-weight: 800 !important; 
                            text-transform: uppercase !important; 
                            color: #0f172a !important; 
                            line-height: 1.35 !important; 
                            max-width: 55mm !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                            overflow: visible !important;
                            word-break: break-word !important;
                            text-align: center !important;
                        }

                        .id-text { 
                            margin: 0 0 1.2mm 0 !important; 
                            font-size: 8pt !important; 
                            font-family: 'Courier New', Courier, monospace !important; 
                            font-weight: 700 !important; 
                            color: #475569 !important; 
                            line-height: 1.2 !important;
                            letter-spacing: 0.08em !important;
                            text-align: center !important;
                        }

                        .loc-text { 
                            margin: 0 !important; 
                            font-size: 7pt !important; 
                            color: #64748b !important; 
                            font-weight: 600 !important; 
                            text-transform: uppercase !important;
                            letter-spacing: 0.03em !important;
                            line-height: 1.2 !important;
                            text-align: center !important;
                        }
                    </style>
                </head>
                <body>
                    ${pagesHtml}
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
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current || filteredWarga.length === 0) return;
        
        setIsDownloading(true);
        setDownloadProgress('Menyiapkan dokumen...');
        
        const layout = currentLayout;
        const dukuhName = filters.dukuhId !== 'all' ? dukuhList.find(d => d.id === Number(filters.dukuhId))?.name : 'Semua-Dukuh';
        const rtNumber = filters.rtId !== 'all' ? `RT-${rtList.find(r => r.id === Number(filters.rtId))?.number}` : 'Semua-RT';
        const fileName = `Barcode-Warga-${dukuhName}-${rtNumber}-${paperSize}-${orientation}.pdf`;

        const cardElements = Array.from(printRef.current.children) as HTMLElement[];
        const pages: HTMLElement[][] = [];
        for (let i = 0; i < cardElements.length; i += layout.cardsPerPage) {
            pages.push(cardElements.slice(i, i + layout.cardsPerPage));
        }

        try {
            // @ts-ignore
            const { jsPDF } = await import('jspdf');
            // @ts-ignore
            const html2canvas = (await import('html2canvas')).default;

            const pdf = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: [layout.pageWidth, layout.pageHeight]
            });

            for (let i = 0; i < pages.length; i++) {
                setDownloadProgress(`Memproses lembar ${i + 1} dari ${pages.length}...`);

                // Create a temporary container for this specific page
                const tempPage = document.createElement('div');
                tempPage.style.position = 'fixed';
                tempPage.style.top = '0';
                tempPage.style.left = '0';
                tempPage.style.zIndex = '50000';
                tempPage.style.opacity = '1';
                tempPage.style.pointerEvents = 'none';
                tempPage.style.width = `${layout.pageWidth}mm`;
                tempPage.style.height = `${layout.pageHeight}mm`;
                tempPage.style.padding = `${layout.margin}mm`;
                tempPage.style.boxSizing = 'border-box';
                tempPage.style.background = '#ffffff';
                tempPage.style.display = 'flex';
                tempPage.style.flexDirection = 'column';
                tempPage.style.alignItems = 'center';
                tempPage.style.justifyContent = 'flex-start';
                tempPage.style.overflow = 'hidden';

                tempPage.innerHTML = `
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                        * { box-sizing: border-box; }
                        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: #ffffff; }
                        .temp-grid {
                            display: grid;
                            grid-template-columns: repeat(${layout.cols}, ${layout.cardW}mm);
                            gap: ${layout.gap}mm;
                            justify-content: center;
                            width: 100%;
                            margin: 0;
                            padding: 0;
                        }
                        .barcode-item-print {
                            width: ${layout.cardW}mm !important;
                            height: ${layout.cardH}mm !important;
                            min-width: ${layout.cardW}mm !important;
                            max-width: ${layout.cardW}mm !important;
                            min-height: ${layout.cardH}mm !important;
                            max-height: ${layout.cardH}mm !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            justify-content: flex-start !important;
                            border: 1px solid #cbd5e1 !important;
                            padding: 3.5mm 2.5mm !important;
                            border-radius: 8px !important;
                            text-align: center !important;
                            background: #ffffff !important;
                            box-sizing: border-box !important;
                            margin: 0 !important;
                            overflow: hidden !important;
                        }
                        .logo-print {
                            height: 18px !important;
                            max-height: 18px !important;
                            margin-bottom: 2mm !important;
                            object-fit: contain !important;
                        }
                        .branding-fallback {
                            font-size: 8pt !important;
                            font-weight: 800 !important;
                            color: #0f172a !important;
                            margin-bottom: 2mm !important;
                            line-height: 1.2 !important;
                        }
                        .qr-container {
                            width: 124px !important;
                            height: 124px !important;
                            min-width: 124px !important;
                            min-height: 124px !important;
                            max-width: 124px !important;
                            max-height: 124px !important;
                            padding: 2px !important;
                            background: #ffffff !important;
                            margin: 0 auto 2.5mm auto !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            overflow: hidden !important;
                            box-sizing: border-box !important;
                        }
                        .qr-container svg {
                            width: 120px !important;
                            height: 120px !important;
                            min-width: 120px !important;
                            min-height: 120px !important;
                            max-width: 120px !important;
                            max-height: 120px !important;
                            display: block !important;
                        }
                        .name-text {
                            margin: 0 0 1.5mm 0 !important;
                            padding: 2px 2px !important;
                            font-size: 8.5pt !important;
                            font-weight: 800 !important;
                            text-transform: uppercase !important;
                            color: #0f172a !important;
                            line-height: 1.35 !important;
                            max-width: 55mm !important;
                            width: 100% !important;
                            box-sizing: border-box !important;
                            overflow: visible !important;
                            word-break: break-word !important;
                            text-align: center !important;
                        }
                        .id-text {
                            margin: 0 0 1.2mm 0 !important;
                            font-size: 8pt !important;
                            font-family: 'Courier New', Courier, monospace !important;
                            font-weight: 700 !important;
                            color: #475569 !important;
                            line-height: 1.2 !important;
                            letter-spacing: 0.08em !important;
                            text-align: center !important;
                        }
                        .loc-text {
                            margin: 0 !important;
                            font-size: 7pt !important;
                            color: #64748b !important;
                            font-weight: 600 !important;
                            text-transform: uppercase !important;
                            letter-spacing: 0.03em !important;
                            line-height: 1.2 !important;
                            text-align: center !important;
                        }
                    </style>
                    <div class="temp-grid">
                        ${pages[i].map(c => c.outerHTML).join('')}
                    </div>
                `;

                document.body.appendChild(tempPage);

                // Wait for any images or font layout
                const imgs = Array.from(tempPage.querySelectorAll('img'));
                await Promise.all(imgs.map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                }));

                await new Promise(r => setTimeout(r, 120));

                const targetW = tempPage.offsetWidth;
                const targetH = tempPage.offsetHeight;

                const canvas = await html2canvas(tempPage, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    width: targetW,
                    height: targetH,
                    windowWidth: targetW + 100,
                    windowHeight: targetH + 100,
                    x: 0,
                    y: 0,
                    scrollX: 0,
                    scrollY: 0
                });

                document.body.removeChild(tempPage);

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                if (i > 0) {
                    pdf.addPage([layout.pageWidth, layout.pageHeight], orientation);
                }
                pdf.addImage(imgData, 'JPEG', 0, 0, layout.pageWidth, layout.pageHeight, undefined, 'FAST');
            }

            pdf.save(fileName);
        } catch (error) {
            console.error("PDF Generation failed", error);
            alert("Gagal membuat PDF. Silakan coba lagi.");
        } finally {
            setIsDownloading(false);
            setDownloadProgress('');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Cetak Barcode Warga</h1>
                        <p className="mt-1 text-slate-500">Pilih warga, ukuran kertas, dan orientasi cetak.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <span className="text-xs font-bold text-slate-500 uppercase">Kertas:</span>
                            <select 
                                value={paperSize} 
                                onChange={(e) => setPaperSize(e.target.value as any)}
                                className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none focus:ring-0"
                            >
                                <option value="A4">A4</option>
                                <option value="A3">A3</option>
                                <option value="A3+">A3+</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <span className="text-xs font-bold text-slate-500 uppercase">Orientasi:</span>
                            <select 
                                value={orientation} 
                                onChange={(e) => setOrientation(e.target.value as any)}
                                className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none focus:ring-0"
                            >
                                <option value="portrait">Tegak (Portrait)</option>
                                <option value="landscape">Miring (Landscape)</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={filteredWarga.length === 0 || isDownloading} 
                            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-400 transition-colors flex items-center gap-2"
                        >
                            <DownloadIcon /> {isDownloading ? (downloadProgress || 'Memproses...') : 'Unduh PDF'}
                        </button>
                        <button onClick={handlePrint} disabled={filteredWarga.length === 0} className="bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm shadow-emerald-200 hover:bg-emerald-600 disabled:bg-slate-400 transition-colors">
                            Cetak ({filteredWarga.length})
                        </button>
                    </div>
                </div>

                {/* Layout Specification Info Banner */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Format: <strong className="text-slate-800">{paperSize} ({currentLayout.pageWidth / 10} × {currentLayout.pageHeight / 10} cm)</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Kapasitas: <strong className="text-emerald-700 font-bold">{currentLayout.cardsPerPage} Kartu / Lembar</strong> ({currentLayout.cols} kolom × {currentLayout.rows} baris)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>Ukuran Kartu: <strong className="text-slate-800">6 × 8 cm</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span>Margin: <strong className="text-slate-800">1 cm</strong> • Jarak Antar Kartu: <strong className="text-slate-800">0.22 cm</strong></span>
                    </div>
                    {filteredWarga.length > 0 && (
                        <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-slate-500">Estimasi Kebutuhan:</span>
                            <strong className="text-blue-700 font-bold bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-md">
                                {Math.ceil(filteredWarga.length / currentLayout.cardsPerPage)} Lembar
                            </strong>
                        </div>
                    )}
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
                                <img src={profile.logo_horizontal_url} alt="Logo" className="logo-print mb-3 h-7 object-contain" crossOrigin="anonymous" />
                            ) : profile?.logo_url ? (
                                <img src={profile.logo_url} alt="Logo" className="logo-print mb-3 h-7 object-contain" crossOrigin="anonymous" />
                            ) : (
                                <div className="branding-fallback mb-3 font-black text-slate-800 text-sm">{profile?.branding_title || 'SapaDesa'}</div>
                            )}

                            <div className="qr-container p-1 bg-white mb-2 overflow-hidden flex items-center justify-center">
                                <QRCodeSVG value={warga.id} size={120} xmlns="http://www.w3.org/2000/svg" />
                            </div>
                            
                            <h3 className="name-text font-extrabold text-sm text-slate-900 uppercase tracking-tight text-center">{warga.name}</h3>
                            <p className="id-text text-xs text-slate-600 font-mono font-bold tracking-wider text-center">{warga.id}</p>
                            <p className="loc-text text-[11px] text-slate-500 font-semibold uppercase tracking-wider text-center">
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

            {/* Download Progress Full-Screen Overlay */}
            {isDownloading && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center text-white p-6 text-center">
                    <div className="w-14 h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-5 shadow-lg"></div>
                    <h3 className="text-xl font-bold font-display text-white">Menyusun Dokumen PDF...</h3>
                    <p className="text-base text-blue-300 mt-2 font-semibold tracking-wide">{downloadProgress || 'Memproses lembar...'}</p>
                    <p className="text-xs text-slate-400 mt-3 max-w-sm">
                        Mohon tunggu sejenak hingga seluruh lembar selesai diproses dan berkas otomatis terunduh.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminCetakBarcodePage;
