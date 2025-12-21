
import React, { useState, useEffect, useMemo, FC } from 'react';
import { getReports, getAllDukuh, getAllRT, getPengeluaran, getUnpaidWargaForDate, getScheduleForDate, getDukuhById, getRTById, getParticipationReport } from '@/services/api';
import { exportToExcel } from '@/services/excel';
import type { Transaksi, Dukuh, RT, Pengeluaran, Warga, ParticipationStats } from '@/types';
import { UserSlashIcon, FileExcelIcon, EyeIcon, ChevronDownIcon } from '@/components/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Modal from '@/components/Modal';

interface ReportRow extends Transaksi {
    wargaName: string;
    petugasName: string;
    dukuhName: string;
    rtNumber: string;
}

const printReport = (title: string, content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>${title}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; color: #333; -webkit-print-color-adjust: exact; }
                        @page { size: F4; margin: 1.5cm; }
                        
                        .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 20px; }
                        .print-header h1 { font-size: 24px; color: #0d9488; margin: 0; }
                        .print-header p { margin: 0; font-size: 10pt; color: #666; }
                        
                        h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 1rem; color: #333; }
                        h3 { font-size: 16px; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #333; }
                        
                        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10pt; }
                        thead { background-color: #f1f5f9; color: #333; }
                        tr { page-break-inside: avoid; }
                        
                        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                        .summary-card { border: 1px solid #e5e7eb; background-color: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
                        .summary-card p { margin: 0; font-size: 12px; color: #666; }
                        .summary-card strong { display: block; font-size: 18px; margin-top: 4px; }
                        .pemasukan { color: #15803d; }
                        .pengeluaran { color: #b91c1c; }
                        .saldo { color: #0d9488; }
                        
                        .currency { text-align: right; font-family: 'Courier New', Courier, monospace; }

                        .print-footer { text-align: center; margin-top: 2rem; font-size: 8pt; color: #9ca3af; }
                        
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    ${content}
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
};

const LaporanHarian: FC = () => {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            const selectedDate = new Date(date);
            try {
                const [reportData, pengeluaranData] = await Promise.all([
                    getReports({ startDate: selectedDate, endDate: selectedDate }),
                    getPengeluaran({ startDate: selectedDate, endDate: selectedDate })
                ]);
                setReports(reportData);
                setPengeluaranList(pengeluaranData);
            } catch (error) {
                console.error("Failed to fetch daily reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [date]);

    const totalPemasukan = useMemo(() => reports.reduce((sum, item) => sum + item.amount, 0), [reports]);
    const totalPengeluaran = useMemo(() => pengeluaranList.reduce((sum, item) => sum + item.amount, 0), [pengeluaranList]);
    const saldo = totalPemasukan - totalPengeluaran;

    const handleExportExcel = () => {
        const data = reports.map(r => ({
            Tanggal: new Date(r.timestamp).toLocaleDateString(),
            Waktu: new Date(r.timestamp).toLocaleTimeString(),
            Warga: r.wargaName,
            Dukuh: r.dukuhName,
            RT: r.rtNumber,
            Petugas: r.petugasName,
            Jumlah: r.amount
        }));
        exportToExcel(data, `Laporan_Harian_${date}`);
    };

    const handlePrint = () => {
        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'full' });
        const title = `Laporan Harian - ${formattedDate}`;
        
        let pemasukanRows = reports.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleTimeString('id-ID')}</td>
                <td>${item.wargaName} (RT ${item.rtNumber}, ${item.dukuhName})</td>
                <td>${item.petugasName}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}</td>
            </tr>
        `).join('');

        let pengeluaranRows = pengeluaranList.map(item => `
            <tr>
                <td>${new Date(item.date).toLocaleTimeString('id-ID')}</td>
                <td colspan="2">${item.description}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="print-header"><h1>SapaDesa</h1><p>Laporan Keuangan</p></div>
            <h2>${title}</h2>
            <div class="summary-grid">
                <div class="summary-card"><p>Total Pemasukan</p><strong class="pemasukan">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPemasukan)}</strong></div>
                <div class="summary-card"><p>Total Pengeluaran</p><strong class="pengeluaran">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPengeluaran)}</strong></div>
                <div class="summary-card"><p>Saldo Akhir</p><strong class="saldo">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(saldo)}</strong></div>
            </div>

            <h3>Rincian Pemasukan</h3>
            <table>
                <thead><tr><th>Waktu</th><th>Warga</th><th>Petugas</th><th class="currency">Jumlah</th></tr></thead>
                <tbody>${reports.length > 0 ? pemasukanRows : '<tr><td colspan="4" style="text-align: center;">Tidak ada pemasukan.</td></tr>'}</tbody>
            </table>

            <h3>Rincian Pengeluaran</h3>
            <table>
                <thead><tr><th>Waktu</th><th colspan="2">Keterangan</th><th class="currency">Jumlah</th></tr></thead>
                <tbody>${pengeluaranList.length > 0 ? pengeluaranRows : '<tr><td colspan="4" style="text-align: center;">Tidak ada pengeluaran.</td></tr>'}</tbody>
            </table>
            <div class="print-footer"><p>Dicetak pada ${new Date().toLocaleString('id-ID')}</p></div>
        `;
        printReport(title, content);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                <div className="flex-grow">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tanggal</label>
                     <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full" />
                </div>
                <div className="flex items-end gap-2">
                    <button onClick={handleExportExcel} className="self-end bg-white text-emerald-600 border border-emerald-200 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2"><FileExcelIcon /> Export Excel</button>
                    <button onClick={handlePrint} className="self-end bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors">Cetak</button>
                </div>
            </div>
            <ReportSummary totalPemasukan={totalPemasukan} totalPengeluaran={totalPengeluaran} saldo={saldo} count={reports.length} />
            <ReportTable reports={reports} loading={loading} />
        </div>
    );
};

const LaporanBulanan: FC = () => {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        const fetchReports = async () => {
            const [year, monthNum] = month.split('-').map(Number);
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0);
            setLoading(true);
            try {
                 const [reportData, pengeluaranData] = await Promise.all([
                    getReports({ startDate, endDate }),
                    getPengeluaran({ startDate, endDate })
                ]);
                setReports(reportData);
                setPengeluaranList(pengeluaranData);
            } catch (error) {
                console.error("Failed to fetch monthly reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [month]);
    
    const totalPemasukan = useMemo(() => reports.reduce((sum, item) => sum + item.amount, 0), [reports]);
    const totalPengeluaran = useMemo(() => pengeluaranList.reduce((sum, item) => sum + item.amount, 0), [pengeluaranList]);
    const saldo = totalPemasukan - totalPengeluaran;

    const handleExportExcel = () => {
         const data = reports.map(r => ({
            Tanggal: new Date(r.timestamp).toLocaleDateString(),
            Warga: r.wargaName,
            Dukuh: r.dukuhName,
            RT: r.rtNumber,
            Jumlah: r.amount
        }));
        exportToExcel(data, `Laporan_Bulanan_${month}`);
    };

    const handlePrint = () => {
        const [year, monthNum] = month.split('-');
        const title = `Laporan Bulanan - ${new Date(Number(year), Number(monthNum) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
        
        let tableRows = reports.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleDateString('id-ID')}</td>
                <td>${item.wargaName}</td>
                <td>RT ${item.rtNumber}, ${item.dukuhName}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}</td>
            </tr>
        `).join('');
        
        let pengeluaranRows = pengeluaranList.map(item => `
            <tr>
                <td>${new Date(item.date).toLocaleDateString('id-ID')}</td>
                <td colspan="2">${item.description}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="print-header"><h1>SapaDesa</h1><p>Laporan Keuangan</p></div>
            <h2>${title}</h2>
            <div class="summary-grid">
                <div class="summary-card"><p>Total Pemasukan</p><strong class="pemasukan">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPemasukan)}</strong></div>
                <div class="summary-card"><p>Total Pengeluaran</p><strong class="pengeluaran">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPengeluaran)}</strong></div>
                <div class="summary-card"><p>Saldo Akhir</p><strong class="saldo">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(saldo)}</strong></div>
            </div>

            <h3>Rincian Pemasukan</h3>
            <table>
                <thead><tr><th>Tanggal</th><th>Warga</th><th>Wilayah</th><th class="currency">Jumlah</th></tr></thead>
                <tbody>${reports.length > 0 ? tableRows : '<tr><td colspan="4" style="text-align: center;">Tidak ada pemasukan.</td></tr>'}</tbody>
            </table>

            <h3>Rincian Pengeluaran</h3>
            <table>
                <thead><tr><th>Tanggal</th><th colspan="2">Keterangan</th><th class="currency">Jumlah</th></tr></thead>
                <tbody>${pengeluaranList.length > 0 ? pengeluaranRows : '<tr><td colspan="4" style="text-align: center;">Tidak ada pengeluaran.</td></tr>'}</tbody>
            </table>
            <div class="print-footer"><p>Dicetak pada ${new Date().toLocaleString('id-ID')}</p></div>
        `;
        printReport(title, content);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                 <div className="flex-grow">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Bulan & Tahun</label>
                     <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full" />
                </div>
                <div className="flex items-end gap-2">
                     <button onClick={handleExportExcel} className="self-end bg-white text-emerald-600 border border-emerald-200 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-2"><FileExcelIcon /> Export Excel</button>
                     <button onClick={handlePrint} className="self-end bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors">Cetak</button>
                </div>
            </div>
            <ReportSummary totalPemasukan={totalPemasukan} totalPengeluaran={totalPengeluaran} saldo={saldo} count={reports.length} />
            <ReportTable reports={reports} loading={loading} />
        </div>
    );
};

const LaporanWilayah: FC = () => {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        dukuhId: 'all',
        rtId: 'all',
    });

    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const [dukuhData, rtData] = await Promise.all([getAllDukuh(), getAllRT()]);
                setDukuhList(dukuhData);
                setRtList(rtData);
            } catch (error) {
                console.error("Failed to fetch filter data", error);
            }
        };
        fetchFilterData();
    }, []);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const reportData = await getReports({
                    startDate: new Date(filters.startDate),
                    endDate: new Date(filters.endDate),
                    dukuhId: filters.dukuhId === 'all' ? undefined : Number(filters.dukuhId),
                    rtId: filters.rtId === 'all' ? undefined : Number(filters.rtId),
                });
                setReports(reportData);
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [filters]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = {...prev, [name]: value};
            return newFilters;
        });
    };

    const availableRTs = useMemo(() => rtList, [rtList]);

    const totalPemasukan = useMemo(() => reports.reduce((sum, item) => sum + item.amount, 0), [reports]);

    const handlePrint = () => {
        const dukuhName = filters.dukuhId !== 'all' ? dukuhList.find(d => d.id === Number(filters.dukuhId))?.name : 'Semua Dukuh';
        const rtNumber = filters.rtId !== 'all' ? `RT ${rtList.find(r => r.id === Number(filters.rtId))?.number}` : 'Semua RT';
        const dateRange = `${new Date(filters.startDate  + 'T00:00:00').toLocaleDateString('id-ID')} - ${new Date(filters.endDate  + 'T00:00:00').toLocaleDateString('id-ID')}`;
        const title = `Laporan Wilayah - ${dukuhName}, ${rtNumber}`;

        let tableRows = reports.map(item => `
            <tr>
                <td>${new Date(item.timestamp).toLocaleString('id-ID')}</td>
                <td>${item.wargaName}</td>
                <td>RT ${item.rtNumber}, ${item.dukuhName}</td>
                <td>${item.petugasName}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amount)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="print-header"><h1>SapaDesa</h1><p>Laporan Pemasukan</p></div>
            <h2>${title}</h2>
            <p>Periode: ${dateRange}</p>
            <div class="summary-grid">
                <div class="summary-card" style="grid-column: span 3 / span 3;"><p>Total Pemasukan</p><strong class="pemasukan">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPemasukan)}</strong></div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>Nama Warga</th>
                        <th>Wilayah</th>
                        <th>Petugas</th>
                        <th class="currency">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.length > 0 ? tableRows : '<tr><td colspan="5" style="text-align: center;">Tidak ada data.</td></tr>'}
                </tbody>
            </table>
            <div class="print-footer"><p>Dicetak pada ${new Date().toLocaleString('id-ID')}</p></div>
        `;
        printReport(title, content);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg w-full" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Akhir</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Dukuh</label>
                        <select name="dukuhId" value={filters.dukuhId} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg w-full">
                            <option value="all">Semua Dukuh</option>
                            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">RT</label>
                        <select name="rtId" value={filters.rtId} onChange={handleFilterChange} className="p-2 border border-slate-300 rounded-lg w-full">
                            <option value="all">Semua RT</option>
                            {availableRTs.map(rt => <option key={rt.id} value={rt.id}>RT {rt.number}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-2 flex items-end">
                        <button onClick={handlePrint} className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors w-full md:w-auto">Cetak Laporan</button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="text-slate-500 text-sm font-medium">Total Pemasukan (Berdasarkan Filter)</h3>
                    <p className="text-3xl font-bold font-display text-primary mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPemasukan)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                    <h3 className="text-slate-500 text-sm font-medium">Jumlah Transaksi (Berdasarkan Filter)</h3>
                    <p className="text-3xl font-bold font-display text-sky-600 mt-1">{reports.length}</p>
                </div>
            </div>
            <ReportTable reports={reports} loading={loading} />
        </div>
    );
};

const LaporanTahunan: FC = () => {
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [pengeluaranList, setPengeluaranList] = useState<Pengeluaran[]>([]);
    const [loading, setLoading] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchReports = async () => {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year, 11, 31, 23, 59, 59);
            setLoading(true);
            try {
                const [reportData, pengeluaranData] = await Promise.all([
                    getReports({ startDate, endDate }),
                    getPengeluaran({ startDate, endDate })
                ]);
                setReports(reportData);
                setPengeluaranList(pengeluaranData);
            } catch (error) {
                console.error("Failed to fetch yearly reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [year]);
    
    const monthlySummary = useMemo(() => {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const summary = monthNames.map(name => ({
            name,
            pemasukan: 0,
            pengeluaran: 0,
            saldo: 0,
        }));

        reports.forEach(report => {
            const monthIndex = new Date(report.timestamp).getMonth();
            summary[monthIndex].pemasukan += report.amount;
        });

        pengeluaranList.forEach(expense => {
            const monthIndex = new Date(expense.date).getMonth();
            summary[monthIndex].pengeluaran += expense.amount;
        });

        summary.forEach(month => {
            month.saldo = month.pemasukan - month.pengeluaran;
        });

        return summary;
    }, [reports, pengeluaranList]);

    const totalPemasukan = useMemo(() => reports.reduce((sum, item) => sum + item.amount, 0), [reports]);
    const totalPengeluaran = useMemo(() => pengeluaranList.reduce((sum, item) => sum + item.amount, 0), [pengeluaranList]);
    const saldo = totalPemasukan - totalPengeluaran;

    const handlePrint = () => {
        const title = `Laporan Tahunan - ${year}`;
        
        let tableRows = monthlySummary.map(month => `
            <tr>
                <td>${month.name}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(month.pemasukan)}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(month.pengeluaran)}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(month.saldo)}</td>
            </tr>
        `).join('');

        const content = `
            <div class="print-header"><h1>SapaDesa</h1><p>Laporan Keuangan</p></div>
            <h2>${title}</h2>
            <div class="summary-grid">
                 <div class="summary-card"><p>Total Pemasukan</p><strong class="pemasukan">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPemasukan)}</strong></div>
                <div class="summary-card"><p>Total Pengeluaran</p><strong class="pengeluaran">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPengeluaran)}</strong></div>
                <div class="summary-card"><p>Saldo Akhir</p><strong class="saldo">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(saldo)}</strong></div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Bulan</th>
                        <th class="currency">Pemasukan</th>
                        <th class="currency">Pengeluaran</th>
                        <th class="currency">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthlySummary.length > 0 ? tableRows : '<tr><td colspan="4" style="text-align: center;">Tidak ada data.</td></tr>'}
                </tbody>
            </table>
            <div class="print-footer"><p>Dicetak pada ${new Date().toLocaleString('id-ID')}</p></div>
        `;
        printReport(title, content);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tahun</label>
                    <input 
                        type="number" 
                        value={year} 
                        onChange={e => setYear(Number(e.target.value))} 
                        className="p-2 border border-slate-300 rounded-lg w-full"
                        placeholder="Masukkan Tahun"
                        min="2020"
                        max={new Date().getFullYear() + 5}
                    />
                </div>
                <button onClick={handlePrint} className="self-end bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus transition-colors">Cetak</button>
            </div>
            <ReportSummary totalPemasukan={totalPemasukan} totalPengeluaran={totalPengeluaran} saldo={saldo} count={reports.length} />
             <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Bulan</th>
                                <th className="p-4 text-right uppercase text-xs font-semibold text-slate-500 tracking-wider">Pemasukan</th>
                                <th className="p-4 text-right uppercase text-xs font-semibold text-slate-500 tracking-wider">Pengeluaran</th>
                                <th className="p-4 text-right uppercase text-xs font-semibold text-slate-500 tracking-wider">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-6">Memuat laporan...</td></tr>
                            ) : monthlySummary.map((month, index) => (
                                <tr key={index} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-semibold text-slate-800">{month.name}</td>
                                    <td className="p-4 text-right font-mono text-green-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(month.pemasukan)}</td>
                                    <td className="p-4 text-right font-mono text-red-700">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(month.pengeluaran)}</td>
                                    <td className="p-4 text-right font-mono text-slate-700 font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(month.saldo)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

const LaporanPartisipasi: FC = () => {
    const [stats, setStats] = useState<ParticipationStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedRT, setSelectedRT] = useState<ParticipationStats | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const [year, monthNum] = month.split('-').map(Number);
            try {
                const data = await getParticipationReport(monthNum, year);
                setStats(data || []);
            } catch (error) {
                console.error("Failed to fetch participation report", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [month]);

    const openDetailModal = (stat: ParticipationStats) => {
        setSelectedRT(stat);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                 <div className="flex-grow">
                     <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Bulan & Tahun</label>
                     <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full" />
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm relative min-h-[400px]">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Grafik Partisipasi per RT (%)</h3>
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : null}
                
                <div className="h-[300px] w-full">
                    {stats.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="rtNumber" tickFormatter={(val) => `RT ${val}`} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                    formatter={(value: any) => {
                                        const numValue = typeof value === 'number' ? value : parseFloat(value);
                                        return [!isNaN(numValue) ? `${numValue.toFixed(1)}%` : '0%', 'Partisipasi'];
                                    }}
                                    labelFormatter={(label) => `RT ${label}`}
                                />
                                <Legend />
                                <Bar dataKey="participationRate" fill="#10b981" radius={[4, 4, 0, 0]} name="Persentase Partisipasi" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 italic">
                            Tidak ada data untuk ditampilkan
                        </div>
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500">RT</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500">Total Warga</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500">Sudah Bayar</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500">Belum Bayar</th>
                                <th className="p-4 text-right uppercase text-xs font-semibold text-slate-500">Persentase</th>
                                <th className="p-4 text-center uppercase text-xs font-semibold text-slate-500">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Memuat data...</td></tr>
                            ) : stats.length > 0 ? (
                                stats.map((stat) => (
                                    <tr key={stat.rtId} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-800">RT {stat.rtNumber}</td>
                                        <td className="p-4 text-center text-slate-600">{stat.totalWarga}</td>
                                        <td className="p-4 text-center text-emerald-600 font-semibold">{stat.activeWarga}</td>
                                        <td className="p-4 text-center text-red-600 font-semibold">{stat.totalWarga - stat.activeWarga}</td>
                                        <td className="p-4 text-right font-mono">
                                            <div className="flex items-center justify-end gap-2">
                                                <span>{stat.participationRate.toFixed(1)}%</span>
                                                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${stat.participationRate >= 80 ? 'bg-emerald-500' : stat.participationRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                        style={{ width: `${stat.participationRate}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => openDetailModal(stat)}
                                                className="text-slate-500 hover:text-primary p-2 rounded-full hover:bg-slate-100"
                                                title="Lihat Warga Belum Bayar"
                                            >
                                                <EyeIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Tidak ada data.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Warga Belum Bayar - RT ${selectedRT?.rtNumber}`}>
                {selectedRT && (
                    <div>
                        <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 text-sm">
                            Menampilkan <strong>{selectedRT.unpaidWargaList.length}</strong> warga yang belum melakukan transaksi sama sekali pada bulan ini.
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            {selectedRT.unpaidWargaList.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 sticky top-0">
                                        <tr>
                                            <th className="p-3 font-semibold">ID</th>
                                            <th className="p-3 font-semibold">Nama</th>
                                            <th className="p-3 font-semibold">Dukuh</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedRT.unpaidWargaList.map(warga => (
                                            <tr key={warga.id}>
                                                <td className="p-3 font-mono text-slate-500">{warga.id}</td>
                                                <td className="p-3 font-medium text-slate-800">{warga.name}</td>
                                                <td className="p-3 text-slate-500">{getDukuhById(warga.dukuhId)?.name || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <p>Semua warga di RT ini sudah berpartisipasi!</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 text-right">
                            <button onClick={() => setIsModalOpen(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-300">Tutup</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

const LaporanBelumBayar: FC = () => {
    const [unpaidWarga, setUnpaidWarga] = useState<Warga[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<{ isHoliday: boolean; dukuhNames: string[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchUnpaidWarga = async () => {
            setLoading(true);
            const selectedDate = new Date(date);
            try {
                const [wargaData, scheduleData] = await Promise.all([
                    getUnpaidWargaForDate(selectedDate),
                    getScheduleForDate(selectedDate)
                ]);
                setUnpaidWarga(wargaData);
                setScheduleInfo(scheduleData);
            } catch (error) {
                console.error("Failed to fetch unpaid warga report", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUnpaidWarga();
    }, [date]);
    
    const totalEstimasi = useMemo(() => {
        return unpaidWarga.reduce((sum, warga) => sum + warga.dailyFee, 0);
    }, [unpaidWarga]);

    const handlePrint = () => {
        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { dateStyle: 'full' });
        const title = `Laporan Warga Belum Bayar - ${formattedDate}`;

        let tableRows = unpaidWarga.map(warga => {
            const rt = getRTById(warga.rtId);
            const dukuh = getDukuhById(warga.dukuhId);
            return `
            <tr>
                <td>${warga.id}</td>
                <td>${warga.name}</td>
                <td>RT ${rt?.number || 'N/A'}, ${dukuh?.name || 'N/A'}</td>
                <td class="currency">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(warga.dailyFee)}</td>
            </tr>
        `}).join('');

        const content = `
            <div class="print-header"><h1>SapaDesa</h1><p>Laporan Tunggakan</p></div>
            <h2>${title}</h2>
             <div class="summary-grid" style="grid-template-columns: 1fr 1fr;">
                 <div class="summary-card"><p>Jadwal Pengambilan</p><strong>${scheduleInfo?.isHoliday ? 'LIBUR' : (scheduleInfo?.dukuhNames.join(', ') || 'Tidak Ada')}</strong></div>
                 <div class="summary-card"><p>Estimasi Pemasukan Tertunda</p><strong class="pemasukan">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalEstimasi)}</strong></div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID Warga</th>
                        <th>Nama Warga</th>
                        <th>Wilayah</th>
                        <th class="currency">Tarif</th>
                    </tr>
                </thead>
                <tbody>
                    ${unpaidWarga.length > 0 ? tableRows : `<tr><td colspan="4" style="text-align: center;">${scheduleInfo?.isHoliday ? 'Hari ini libur.' : 'Semua warga terjadwal sudah lunas.'}</td></tr>`}
                </tbody>
            </table>
            <div class="print-footer"><p>Dicetak pada ${new Date().toLocaleString('id-ID')}</p></div>
        `;
        printReport(title, content);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex gap-4 items-center">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Tanggal Laporan</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border border-slate-300 rounded-lg w-full" />
                </div>
                <button onClick={handlePrint} disabled={loading} className="self-end bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg shadow-sm shadow-primary/30 hover:bg-primary-focus disabled:bg-slate-400">Cetak</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                    <p className="text-sm font-medium text-slate-500">Jadwal Pengambilan pada tanggal ini:</p>
                    <p className="text-lg font-bold text-slate-800">{loading ? 'Memuat...' : (scheduleInfo?.isHoliday ? 'LIBUR' : (scheduleInfo?.dukuhNames.join(', ') || 'Tidak Ada'))}</p>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
                    <p className="text-sm font-medium text-slate-500">Total Estimasi Pemasukan Tertunda</p>
                    <p className="text-lg font-bold text-primary">{loading ? 'Memuat...' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalEstimasi)}</p>
                </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">ID Warga</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Nama</th>
                                <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Wilayah</th>
                                <th className="p-4 text-right uppercase text-xs font-semibold text-slate-500 tracking-wider">Tarif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center p-6 text-slate-500">Memuat data...</td></tr>
                            ) : unpaidWarga.length > 0 ? (
                                unpaidWarga.map(warga => (
                                    <tr key={warga.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono text-slate-600">{warga.id}</td>
                                        <td className="p-4 font-semibold text-slate-800">{warga.name}</td>
                                        <td className="p-4 text-slate-600">RT {getRTById(warga.rtId)?.number}, {getDukuhById(warga.dukuhId)?.name}</td>
                                        <td className="p-4 text-right font-mono text-slate-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(warga.dailyFee)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="text-center p-8 text-slate-500">
                                    <h3 className="font-semibold text-lg">{scheduleInfo?.isHoliday ? 'Hari Libur' : 'Data Tidak Ditemukan'}</h3>
                                    <p>{scheduleInfo?.isHoliday ? 'Tidak ada jadwal pengambilan sampah.' : 'Semua warga yang terjadwal telah melakukan pembayaran.'}</p>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


const ReportSummary: FC<{totalPemasukan: number, totalPengeluaran: number, saldo: number, count: number}> = ({ totalPemasukan, totalPengeluaran, saldo, count }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
            <h3 className="text-slate-500 text-sm font-medium">Total Pemasukan</h3>
            <p className="text-3xl font-bold font-display text-primary mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPemasukan)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
            <h3 className="text-slate-500 text-sm font-medium">Total Pengeluaran</h3>
            <p className="text-3xl font-bold font-display text-red-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalPengeluaran)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
            <h3 className="text-slate-500 text-sm font-medium">Saldo</h3>
            <p className="text-3xl font-bold font-display text-emerald-600 mt-1">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(saldo)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200/80">
            <h3 className="text-slate-500 text-sm font-medium">Jumlah Transaksi</h3>
            <p className="text-3xl font-bold font-display text-sky-600 mt-1">{count}</p>
        </div>
    </div>
);

const ReportTable: FC<{reports: ReportRow[], loading: boolean}> = ({ reports, loading }) => (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Waktu</th>
                        <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Nama Warga</th>
                        <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Wilayah</th>
                        <th className="p-4 text-left uppercase text-xs font-semibold text-slate-500 tracking-wider">Petugas</th>
                        <th className="p-4 text-right uppercase text-xs font-semibold text-slate-500 tracking-wider">Jumlah</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {loading ? (
                        <tr><td colSpan={5} className="text-center p-6 text-slate-500">Memuat laporan...</td></tr>
                    ) : reports.length > 0 ? (
                        reports.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-600">{new Date(item.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                <td className="p-4 font-semibold text-slate-800">{item.wargaName}</td>
                                <td className="p-4 text-slate-600">RT {item.rtNumber}, {item.dukuhName}</td>
                                <td className="p-4 text-slate-600">{item.petugasName}</td>
                                <td className="p-4 text-right font-mono text-slate-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.amount)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={5} className="text-center p-8 text-slate-500">
                             <h3 className="font-semibold text-lg">Data Tidak Ditemukan</h3>
                            <p>Tidak ada data transaksi untuk filter yang dipilih.</p>
                        </td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const AdminLaporanPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'harian' | 'bulanan' | 'wilayah' | 'tahunan' | 'partisipasi' | 'belumBayar'>('harian');
    
    const renderContent = () => {
        switch(activeTab) {
            case 'harian': return <LaporanHarian />;
            case 'bulanan': return <LaporanBulanan />;
            case 'wilayah': return <LaporanWilayah />;
            case 'tahunan': return <LaporanTahunan />;
            case 'partisipasi': return <LaporanPartisipasi />;
            case 'belumBayar': return <LaporanBelumBayar />;
            default: return null;
        }
    };
    
    const TabButton: FC<{tabName: 'harian' | 'bulanan' | 'wilayah' | 'tahunan' | 'partisipasi' | 'belumBayar', children: React.ReactNode}> = ({tabName, children}) => (
         <button
            onClick={() => setActiveTab(tabName)}
            className={`${activeTab === tabName ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-4 border-b-2 font-semibold text-sm transition-colors focus:outline-none`}
        >
            {children}
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <h1 className="text-2xl font-bold font-display text-slate-800">Laporan</h1>
                <p className="mt-1 text-slate-500">Lihat, cetak, dan ekspor laporan pemasukan, pengeluaran, dan data tunggakan.</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-2 px-4 overflow-x-auto" aria-label="Tabs">
                        <TabButton tabName="harian">Laporan Harian</TabButton>
                        <TabButton tabName="bulanan">Laporan Bulanan</TabButton>
                        <TabButton tabName="wilayah">Laporan Wilayah</TabButton>
                        <TabButton tabName="tahunan">Laporan Tahunan</TabButton>
                        <TabButton tabName="partisipasi">Laporan Partisipasi</TabButton>
                        <TabButton tabName="belumBayar">Warga Belum Bayar</TabButton>
                    </nav>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminLaporanPage;
