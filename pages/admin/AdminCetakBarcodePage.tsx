import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Warga, Dukuh, RT } from '@/types';
import { getAllWarga, getAllDukuh, getAllRT } from '@/services/api';
import { useVillageProfile } from '@/context/VillageProfileContext';
import { DownloadIcon, SearchIcon, CheckCircleIcon, TrashIcon, XIcon, UsersIcon } from '@/components/icons';

const AdminCetakBarcodePage: React.FC = () => {
    const { profile } = useVillageProfile();
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState<string>('');
    
    // Filters & Search
    const [selectedDukuhIds, setSelectedDukuhIds] = useState<number[]>([]);
    const [selectedRtIds, setSelectedRtIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Citizen Selection State (stores citizen IDs chosen across multiple Dukuh & RT)
    const [selectedWargaIds, setSelectedWargaIds] = useState<Set<string>>(new Set());
    const [printMode, setPrintMode] = useState<'selected' | 'filtered'>('filtered');
    const [viewTab, setViewTab] = useState<'all' | 'selected_only'>('all');
    const [showSelectedModal, setShowSelectedModal] = useState(false);

    // Layout configuration
    const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'A3+'>('A3+');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const printCardsRef = useRef<HTMLDivElement>(null);

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

    const getDukuhName = (id: number) => dukuhList.find(d => d.id === id)?.name || 'N/A';
    const getRTNumber = (id: number) => rtList.find(r => r.id === id)?.number || 'N/A';

    // Filter citizens based on multi-Dukuh, multi-RT, and search query
    const filteredWarga = useMemo(() => {
        return wargaList.filter(warga => {
            const dukuhMatch = selectedDukuhIds.length === 0 || selectedDukuhIds.includes(warga.dukuhId);
            const rtMatch = selectedRtIds.length === 0 || selectedRtIds.includes(warga.rtId);
            const searchMatch = !searchQuery.trim() || 
                warga.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
                warga.id.toLowerCase().includes(searchQuery.toLowerCase().trim());
            return dukuhMatch && rtMatch && searchMatch;
        });
    }, [wargaList, selectedDukuhIds, selectedRtIds, searchQuery]);

    // List of selected citizens across any Dukuh and RT
    const selectedWargaList = useMemo(() => {
        return wargaList.filter(w => selectedWargaIds.has(w.id));
    }, [wargaList, selectedWargaIds]);

    // Auto-update printMode when selections are added or cleared
    useEffect(() => {
        if (selectedWargaIds.size > 0 && printMode !== 'selected') {
            setPrintMode('selected');
        } else if (selectedWargaIds.size === 0 && printMode === 'selected') {
            setPrintMode('filtered');
        }
    }, [selectedWargaIds.size]);

    // Summary of selected citizens grouped by Dukuh
    const selectedDukuhSummary = useMemo(() => {
        const map = new Map<number, number>();
        selectedWargaList.forEach(w => {
            map.set(w.dukuhId, (map.get(w.dukuhId) || 0) + 1);
        });
        return Array.from(map.entries()).map(([dukuhId, count]) => ({
            dukuhId,
            name: getDukuhName(dukuhId),
            count
        }));
    }, [selectedWargaList, dukuhList]);

    // Summary of selected citizens grouped by RT
    const selectedRtSummary = useMemo(() => {
        const map = new Map<number, number>();
        selectedWargaList.forEach(w => {
            map.set(w.rtId, (map.get(w.rtId) || 0) + 1);
        });
        return Array.from(map.entries()).map(([rtId, count]) => ({
            rtId,
            number: getRTNumber(rtId),
            count
        }));
    }, [selectedWargaList, rtList]);

    // Citizens to be displayed in the UI grid
    const displayWarga = useMemo(() => {
        if (viewTab === 'selected_only') {
            if (!searchQuery.trim()) return selectedWargaList;
            return selectedWargaList.filter(w => 
                w.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
                w.id.toLowerCase().includes(searchQuery.toLowerCase().trim())
            );
        }
        return filteredWarga;
    }, [viewTab, selectedWargaList, filteredWarga, searchQuery]);

    // Citizens that will actually be printed or downloaded to PDF
    const wargaToPrint = useMemo(() => {
        if (printMode === 'selected') {
            return selectedWargaList;
        }
        return filteredWarga;
    }, [printMode, selectedWargaList, filteredWarga]);

    // Selection handlers
    const toggleSelectWarga = (id: string) => {
        setSelectedWargaIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAllVisible = () => {
        setSelectedWargaIds(prev => {
            const next = new Set(prev);
            displayWarga.forEach(w => next.add(w.id));
            return next;
        });
    };

    const deselectAllVisible = () => {
        setSelectedWargaIds(prev => {
            const next = new Set(prev);
            displayWarga.forEach(w => next.delete(w.id));
            return next;
        });
    };

    const clearAllSelections = () => {
        setSelectedWargaIds(new Set());
        if (viewTab === 'selected_only') {
            setViewTab('all');
        }
    };

    // Multi-Dukuh Filter toggle
    const toggleDukuhFilter = (id: number) => {
        setSelectedDukuhIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            }
            return [...prev, id];
        });
    };

    // Multi-RT Filter toggle
    const toggleRtFilter = (id: number) => {
        setSelectedRtIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            }
            return [...prev, id];
        });
    };

    const handlePrint = () => {
        if (!printCardsRef.current || wargaToPrint.length === 0) return;

        const layout = currentLayout;
        const title = printMode === 'selected' 
            ? `Barcode Warga Terpilih (${wargaToPrint.length} Warga - ${selectedDukuhSummary.length} Dukuh, ${selectedRtSummary.length} RT)`
            : `Barcode Warga - ${selectedDukuhIds.length === 1 ? getDukuhName(selectedDukuhIds[0]) : 'Multi Dukuh'}, ${selectedRtIds.length === 1 ? `RT ${getRTNumber(selectedRtIds[0])}` : 'Multi RT'}`;

        const cardElements = Array.from(printCardsRef.current.children) as HTMLElement[];
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

                        .no-print {
                            display: none !important;
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
        if (!printCardsRef.current || wargaToPrint.length === 0) return;
        
        setIsDownloading(true);
        setDownloadProgress('Menyiapkan dokumen...');
        
        const layout = currentLayout;
        const fileName = printMode === 'selected'
            ? `Barcode-Warga-Pilihan-${wargaToPrint.length}-Warga-${selectedDukuhSummary.length}Dukuh-${paperSize}-${orientation}.pdf`
            : `Barcode-Warga-Filter-${wargaToPrint.length}-Warga-${paperSize}-${orientation}.pdf`;

        const cardElements = Array.from(printCardsRef.current.children) as HTMLElement[];
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
                        .no-print {
                            display: none !important;
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
            {/* Header & Print Actions Bar */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold font-display text-slate-800">Cetak Barcode Warga</h1>
                            {selectedWargaIds.size > 0 && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
                                    {selectedWargaIds.size} Dipilih
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-slate-500">Pilih beberapa warga dari berbagai Dukuh dan RT, atur ukuran kertas, lalu cetak atau unduh PDF.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <span className="text-xs font-bold text-slate-500 uppercase">Kertas:</span>
                            <select 
                                value={paperSize} 
                                onChange={(e) => setPaperSize(e.target.value as any)}
                                className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none focus:ring-0 cursor-pointer"
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
                                className="bg-transparent border-none text-sm font-bold text-slate-800 outline-none focus:ring-0 cursor-pointer"
                            >
                                <option value="portrait">Tegak (Portrait)</option>
                                <option value="landscape">Miring (Landscape)</option>
                            </select>
                        </div>

                        <button 
                            onClick={handleDownloadPDF} 
                            disabled={wargaToPrint.length === 0 || isDownloading} 
                            className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm shadow-blue-200 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            title={`Unduh ${wargaToPrint.length} kartu ke file PDF`}
                        >
                            <DownloadIcon /> {isDownloading ? (downloadProgress || 'Memproses...') : `Unduh PDF (${wargaToPrint.length})`}
                        </button>

                        <button 
                            onClick={handlePrint} 
                            disabled={wargaToPrint.length === 0} 
                            className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm shadow-emerald-200 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            title={`Cetak langsung ${wargaToPrint.length} kartu`}
                        >
                            <i className="fa-solid fa-print"></i>
                            Cetak ({wargaToPrint.length})
                        </button>
                    </div>
                </div>

                {/* Target Mode Segmented Controller */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Cetak:</span>
                        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setPrintMode('selected')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    printMode === 'selected' 
                                        ? 'bg-white text-blue-700 shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <CheckCircleIcon className="text-sm" />
                                Warga Terpilih ({selectedWargaIds.size})
                            </button>
                            <button
                                type="button"
                                onClick={() => setPrintMode('filtered')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    printMode === 'filtered' 
                                        ? 'bg-white text-blue-700 shadow-sm' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <UsersIcon className="text-sm" />
                                Semua Sesuai Filter ({filteredWarga.length})
                            </button>
                        </div>
                    </div>

                    {/* Paper & Capacity Info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Kapasitas: <strong className="text-slate-800">{currentLayout.cardsPerPage} Kartu / Lembar</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Ukuran Kartu: <strong className="text-slate-800">6 × 8 cm</strong></span>
                        </span>
                        {wargaToPrint.length > 0 && (
                            <span className="flex items-center gap-1.5 ml-auto">
                                <span className="text-slate-500">Estimasi Kebutuhan:</span>
                                <strong className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                                    {Math.ceil(wargaToPrint.length / currentLayout.cardsPerPage)} Lembar
                                </strong>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Selection Summary Banner (Visible when citizens are selected) */}
            {selectedWargaIds.size > 0 && (
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 border border-blue-200/90 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                            </span>
                            <h3 className="text-sm font-bold text-blue-900">
                                {selectedWargaIds.size} Warga Terpilih Siap Dicetak
                            </h3>
                            <span className="text-xs text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full font-semibold border border-blue-200">
                                Dari {selectedDukuhSummary.length} Dukuh & {selectedRtSummary.length} RT Berbeda
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-xs text-slate-500">Rincian:</span>
                            {selectedDukuhSummary.map(d => (
                                <span key={d.dukuhId} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-blue-200 text-blue-800 px-2 py-0.5 rounded-md shadow-2xs">
                                    <span>{d.name}</span>
                                    <span className="bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.2 text-[10px] font-bold">{d.count}</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowSelectedModal(true)}
                            className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white hover:bg-blue-50 border border-blue-300 px-3 py-1.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                            <i className="fa-solid fa-list-check"></i>
                            Lihat Daftar Terpilih
                        </button>
                        <button
                            type="button"
                            onClick={clearAllSelections}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                            <TrashIcon className="text-xs" />
                            Kosongkan Pilihan
                        </button>
                    </div>
                </div>
            )}

            {/* Filter, Search & Selection Controls Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200/80 space-y-4">
                {/* Search Bar & View Tab */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <SearchIcon className="text-sm" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama warga atau ID barcode..."
                            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                <XIcon className="text-xs" />
                            </button>
                        )}
                    </div>

                    {/* View Filter Tab (All vs Selected Only) */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setViewTab('all')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                viewTab === 'all' 
                                    ? 'bg-white text-slate-800 shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Tampilkan Semua ({filteredWarga.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewTab('selected_only')}
                            disabled={selectedWargaIds.size === 0}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                                viewTab === 'selected_only' 
                                    ? 'bg-white text-blue-700 shadow-xs' 
                                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed'
                            }`}
                        >
                            <i className="fa-solid fa-check text-blue-600"></i>
                            Hanya Yang Dipilih ({selectedWargaIds.size})
                        </button>
                    </div>
                </div>

                {/* Multi-Dukuh Filter Pills */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <i className="fa-solid fa-map-pin text-blue-500"></i>
                            Filter Dukuh (Bisa Pilih Lebih Dari Satu):
                        </label>
                        {selectedDukuhIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedDukuhIds([])}
                                className="text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                                Reset Filter Dukuh
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedDukuhIds([])}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedDukuhIds.length === 0
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                        >
                            Semua Dukuh
                        </button>
                        {dukuhList.map(dukuh => {
                            const isSelected = selectedDukuhIds.includes(dukuh.id);
                            const count = wargaList.filter(w => w.dukuhId === dukuh.id).length;
                            return (
                                <button
                                    key={dukuh.id}
                                    type="button"
                                    onClick={() => toggleDukuhFilter(dukuh.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    <span>{dukuh.name}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Multi-RT Filter Pills */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <i className="fa-solid fa-layer-group text-emerald-500"></i>
                            Filter RT (Bisa Pilih Lebih Dari Satu):
                        </label>
                        {selectedRtIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedRtIds([])}
                                className="text-[11px] font-semibold text-blue-600 hover:underline"
                            >
                                Reset Filter RT
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedRtIds([])}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                selectedRtIds.length === 0
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            }`}
                        >
                            Semua RT
                        </button>
                        {rtList.map(rt => {
                            const isSelected = selectedRtIds.includes(rt.id);
                            const count = wargaList.filter(w => {
                                const dukuhMatch = selectedDukuhIds.length === 0 || selectedDukuhIds.includes(w.dukuhId);
                                return dukuhMatch && w.rtId === rt.id;
                            }).length;
                            return (
                                <button
                                    key={rt.id}
                                    type="button"
                                    onClick={() => toggleRtFilter(rt.id)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    <span>RT {rt.number}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Selection Actions Toolbar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-500">Aksi Pilihan Cepat:</span>
                        <button
                            type="button"
                            onClick={selectAllVisible}
                            disabled={displayWarga.length === 0}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            + Pilih Semua Yang Tampil ({displayWarga.length})
                        </button>
                        <button
                            type="button"
                            onClick={deselectAllVisible}
                            disabled={displayWarga.length === 0}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            - Batal Pilih Yang Tampil
                        </button>
                    </div>

                    <div className="text-slate-500 font-medium">
                        Menampilkan <strong className="text-slate-800 font-bold">{displayWarga.length}</strong> dari total {wargaList.length} warga
                    </div>
                </div>
            </div>
            
            {/* Citizen Cards Interactive Grid */}
            {loading ? (
                <div className="text-center text-slate-500 py-16 bg-white rounded-xl border border-slate-200">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="font-semibold text-sm">Memuat data warga...</p>
                </div>
            ) : displayWarga.length === 0 ? (
                <div className="text-center py-14 bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <UsersIcon className="text-xl" />
                    </div>
                    <p className="text-slate-700 font-bold text-base">Tidak ada data warga sesuai filter</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                        {viewTab === 'selected_only' 
                            ? 'Belum ada warga yang dipilih. Beralih ke tab "Tampilkan Semua" untuk mencentang warga yang ingin dicetak.' 
                            : 'Silakan sesuaikan kata kunci pencarian atau filter Dukuh dan RT di atas.'}
                    </p>
                    {viewTab === 'selected_only' && (
                        <button
                            type="button"
                            onClick={() => setViewTab('all')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                            Buka Daftar Semua Warga
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayWarga.map(warga => {
                        const isSelected = selectedWargaIds.has(warga.id);
                        return (
                            <div 
                                key={warga.id} 
                                onClick={() => toggleSelectWarga(warga.id)}
                                className={`barcode-item-screen relative rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer select-none transition-all duration-150 ${
                                    isSelected 
                                        ? 'bg-blue-50/40 border-2 border-blue-500 shadow-md ring-2 ring-blue-400/20' 
                                        : 'bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                {/* Checkbox Selector Badge */}
                                <div className="absolute top-2.5 right-2.5 z-10">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                        isSelected 
                                            ? 'bg-blue-600 text-white ring-2 ring-blue-200' 
                                            : 'bg-slate-100 text-transparent border border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                                    }`}>
                                        <i className="fa-solid fa-check text-[11px]"></i>
                                    </div>
                                </div>

                                {/* Status Tag */}
                                {isSelected && (
                                    <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-600 text-white tracking-wider uppercase">
                                        Terpilih
                                    </span>
                                )}

                                {/* Logo / Branding Header */}
                                {profile?.logo_horizontal_url ? (
                                    <img src={profile.logo_horizontal_url} alt="Logo" className="logo-print mb-2 h-6 object-contain" crossOrigin="anonymous" />
                                ) : profile?.logo_url ? (
                                    <img src={profile.logo_url} alt="Logo" className="logo-print mb-2 h-6 object-contain" crossOrigin="anonymous" />
                                ) : (
                                    <div className="branding-fallback mb-2 font-black text-slate-800 text-xs">{profile?.branding_title || 'SapaDesa'}</div>
                                )}

                                {/* QR Code Container */}
                                <div className="p-1 bg-white mb-2 rounded-lg border border-slate-100 flex items-center justify-center shadow-2xs">
                                    <QRCodeSVG value={warga.id} size={118} xmlns="http://www.w3.org/2000/svg" />
                                </div>
                                
                                {/* Warga Info */}
                                <h3 className="name-text font-black text-sm text-slate-900 uppercase tracking-tight text-center leading-snug line-clamp-2 px-1">
                                    {warga.name}
                                </h3>
                                <p className="id-text text-xs text-slate-500 font-mono font-bold tracking-wider text-center mt-1">
                                    {warga.id}
                                </p>
                                <div className="mt-2 text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider text-center">
                                    {getDukuhName(warga.dukuhId)} — RT {getRTNumber(warga.rtId)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hidden Offscreen Container: Used exclusively for pristine PDF generation and Window Print */}
            <div 
                ref={printCardsRef} 
                style={{ 
                    position: 'fixed', 
                    left: '-99999px', 
                    top: 0, 
                    opacity: 0, 
                    pointerEvents: 'none' 
                }}
            >
                {wargaToPrint.map(warga => (
                    <div key={warga.id} className="barcode-item-print">
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

            {/* Modal: List of Selected Citizens */}
            {showSelectedModal && createPortal(
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setShowSelectedModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slide-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <i className="fa-solid fa-list-check text-blue-600"></i>
                                    Daftar Warga Terpilih ({selectedWargaList.length})
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Warga terpilih dari {selectedDukuhSummary.length} Dukuh dan {selectedRtSummary.length} RT yang siap dicetak
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowSelectedModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                            >
                                <XIcon className="text-xs" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1">
                            {selectedWargaList.length === 0 ? (
                                <p className="text-center text-slate-400 py-8 text-sm">Belum ada warga yang dipilih.</p>
                            ) : (
                                <div className="space-y-4">
                                    {selectedDukuhSummary.map(dukuhInfo => {
                                        const wargaInDukuh = selectedWargaList.filter(w => w.dukuhId === dukuhInfo.dukuhId);
                                        return (
                                            <div key={dukuhInfo.dukuhId} className="border border-slate-200 rounded-xl overflow-hidden">
                                                <div className="bg-slate-100/80 px-3.5 py-2 flex items-center justify-between border-b border-slate-200">
                                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                        <i className="fa-solid fa-map-pin text-blue-500"></i>
                                                        Dukuh {dukuhInfo.name}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                        {wargaInDukuh.length} warga
                                                    </span>
                                                </div>
                                                <div className="divide-y divide-slate-100">
                                                    {wargaInDukuh.map(w => (
                                                        <div key={w.id} className="p-2.5 px-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                                                            <div>
                                                                <h4 className="text-xs font-bold text-slate-800 uppercase">{w.name}</h4>
                                                                <p className="text-[11px] text-slate-500 font-mono">
                                                                    ID: {w.id} • RT {getRTNumber(w.rtId)}
                                                                </p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleSelectWarga(w.id)}
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                                title="Hapus dari pilihan"
                                                            >
                                                                <TrashIcon className="text-xs" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={clearAllSelections}
                                disabled={selectedWargaList.length === 0}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                            >
                                <TrashIcon className="text-xs" />
                                Kosongkan Semua
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowSelectedModal(false)}
                                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSelectedModal(false);
                                        setPrintMode('selected');
                                        handlePrint();
                                    }}
                                    disabled={selectedWargaList.length === 0}
                                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                    <i className="fa-solid fa-print"></i>
                                    Cetak Warga Terpilih ({selectedWargaList.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Download Progress Full-Screen Overlay */}
            {isDownloading && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center text-white p-6 text-center">
                    <div className="w-14 h-14 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-5 shadow-lg"></div>
                    <h3 className="text-xl font-bold font-display text-white">Menyusun Dokumen PDF...</h3>
                    <p className="text-base text-blue-300 mt-2 font-semibold tracking-wide">{downloadProgress || 'Memproses lembar...'}</p>
                    <p className="text-xs text-slate-400 mt-3 max-w-sm">
                        Mohon tunggu sejenak hingga seluruh lembar ({Math.ceil(wargaToPrint.length / currentLayout.cardsPerPage)} lembar) selesai diproses dan berkas otomatis terunduh.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminCetakBarcodePage;
