import React, { useState, useEffect, useMemo } from 'react';
import { getAllWarga, getAllDukuh, getAllRT, getReports, getSchedule, getVisitNotes, saveVisitNote } from '@/services/api';
import type { Warga, Dukuh, RT } from '@/types';
import { DownloadIcon, UsersIcon, CheckCircleIcon, SearchIcon } from '@/components/icons';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const toLocalDateStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const txDateStr = (tx: any): string => {
    const t = tx.timestamp;
    if (t instanceof Date) return toLocalDateStr(t);
    return String(t || '').slice(0, 10);
};

// Nilai dukuhIds di tabel schedules bisa berupa array, string JSON,
// atau 'libur' — samakan cara bacanya dengan endpoint /schedule/today.
const parseDukuhIds = (raw: any): number[] => {
    let v: any = raw;
    if (typeof v === 'string') {
        try { v = JSON.parse(v); } catch { return []; }
    }
    if (v === 'libur') return [];
    if (Array.isArray(v)) return v.map(Number).filter((n: number) => !isNaN(n));
    return [];
};

const DailyVisitReport: React.FC = () => {
    const [dateStr, setDateStr] = useState(toLocalDateStr(new Date()));
    const [dukuhId, setDukuhId] = useState('all');
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<'wilayah' | 'nama'>('wilayah');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [dayTxs, setDayTxs] = useState<any[]>([]);
    const [scheduleObj, setScheduleObj] = useState<any>({});
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            const [w, d, r, txs, sched, vnotes] = await Promise.all([
                getAllWarga(),
                getAllDukuh(),
                getAllRT(),
                getReports({ startDate: dateStr, endDate: dateStr }),
                getSchedule(),
                // Alasan tidak boleh menggagalkan laporan kalau endpoint
                // belum ikut deploy — kolom alasan tinggal mulai kosong.
                getVisitNotes(dateStr).catch(() => ({}))
            ]);
            setWargaList(w);
            setDukuhList(d);
            setRtList(r);
            setDayTxs(txs);
            setScheduleObj(sched || {});
            setNotes(vnotes || {});
            setSavedNotes(vnotes || {});
            setLoading(false);
        };
        fetch();
    }, [dateStr]);

    const dayName = DAYS_ID[new Date(dateStr + 'T00:00:00').getDay()];
    const scheduledDukuhIds = parseDukuhIds(scheduleObj[dayName]);
    const isHoliday = scheduledDukuhIds.length === 0;

    // "Dikunjungi" = ada transaksi apa pun hari itu untuk warga itu:
    // bayar, TIDAK BAYAR (catatan hutang), atau bayar pakai deposit.
    const visitedIds = useMemo(() => {
        return new Set(dayTxs.filter(tx => txDateStr(tx) === dateStr).map(tx => String(tx.wargaId)));
    }, [dayTxs, dateStr]);

    const scheduledWarga = useMemo(() => {
        return wargaList.filter(w => {
            const inSchedule = scheduledDukuhIds.includes(Number(w.dukuhId));
            const matchDukuh = dukuhId === 'all' || w.dukuhId === Number(dukuhId);
            return inSchedule && matchDukuh;
        });
    }, [wargaList, scheduledDukuhIds, dukuhId]);

    const visitedCount = scheduledWarga.filter(w => visitedIds.has(String(w.id))).length;
    const notVisitedCount = scheduledWarga.length - visitedCount;
    const coverage = scheduledWarga.length > 0 ? (visitedCount / scheduledWarga.length) * 100 : 0;

    const notVisitedList = useMemo(() => {
        return scheduledWarga.filter(w => {
            const isNotVisited = !visitedIds.has(String(w.id));
            const matchSearch = w.name.toLowerCase().includes(search.toLowerCase());
            return isNotVisited && matchSearch;
        });
    }, [scheduledWarga, visitedIds, search]);

    const sortedNotVisited = useMemo(() => {
        const arr = [...notVisitedList];
        arr.sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'nama') {
                cmp = a.name.localeCompare(b.name, 'id');
            } else {
                const dukuhA = dukuhList.find(d => d.id === a.dukuhId)?.name || '';
                const dukuhB = dukuhList.find(d => d.id === b.dukuhId)?.name || '';
                const rtA = rtList.find(r => r.id === a.rtId)?.number || '';
                const rtB = rtList.find(r => r.id === b.rtId)?.number || '';
                cmp = dukuhA.localeCompare(dukuhB, 'id') || String(rtA).localeCompare(String(rtB), 'id') || a.name.localeCompare(b.name, 'id');
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return arr;
    }, [notVisitedList, dukuhList, rtList, sortKey, sortDir]);

    const handleSort = (key: typeof sortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sortArrow = (key: typeof sortKey) => sortKey === key ? (sortDir === 'asc' ? ' \u25b2' : ' \u25bc') : '';

    const handleNoteBlur = async (wargaId: string) => {
        const val = (notes[wargaId] || '').trim();
        if (val === (savedNotes[wargaId] || '')) return;
        try {
            await saveVisitNote(wargaId, dateStr, val);
            setSavedNotes(prev => ({ ...prev, [wargaId]: val }));
        } catch (e) {
            console.error('Gagal menyimpan alasan', e);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const dukuhLabel = dukuhId === 'all' ? 'Semua Dukuh' : dukuhList.find(d => d.id === Number(dukuhId))?.name || '-';
        const rows = sortedNotVisited.map((w, idx) => {
            const rtNum = rtList.find(r => r.id === w.rtId)?.number || 'N/A';
            const dukuhName = dukuhList.find(d => d.id === w.dukuhId)?.name || 'N/A';
            const note = (savedNotes[w.id] || '').replace(/</g, '&lt;');
            return `
                <tr>
                    <td style="text-align:center">${idx + 1}</td>
                    <td style="font-weight:700">${w.name}</td>
                    <td>${dukuhName}</td>
                    <td style="text-align:center">RT ${rtNum}</td>
                    <td>${note || '-'}</td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
            <head>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                    @page { size: A4; margin: 1.5cm; }
                    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f172a; padding-bottom: 10px; margin-bottom: 25px; }
                    .header-left .logo { color: #10b981; font-size: 24pt; font-weight: 800; margin: 0; line-height: 1.1; }
                    .header-left .sub-1 { font-size: 9pt; font-weight: 700; color: #1e293b; margin: 5px 0 0 0; text-transform: uppercase; }
                    .header-left .sub-2 { font-size: 7.5pt; font-weight: 500; color: #64748b; margin: 2px 0 0 0; text-transform: uppercase; }
                    .header-right { text-align: right; }
                    .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #1e293b; margin: 0; }
                    .print-date { font-size: 8pt; color: #94a3b8; font-weight: 600; margin-top: 4px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f8fafc; text-align: left; padding: 12px; font-size: 8.5pt; text-transform: uppercase; border: 1px solid #cbd5e1; color: #475569; }
                    td { padding: 10px 12px; border: 1px solid #cbd5e1; font-size: 9pt; }
                    .footer { margin-top: 50px; text-align: right; font-size: 9pt; }
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
                        <div class="report-title">Laporan Kunjungan Harian</div>
                        <div class="print-date">TANGGAL: ${dayName}, ${new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        <div class="print-date">CETAK: ${new Date().toLocaleString('id-ID')}</div>
                    </div>
                </div>
                <div style="margin-bottom:20px; font-size:10pt;">
                    <strong>Dukuh:</strong> ${dukuhLabel} &nbsp;|&nbsp;
                    <strong>Terjadwal:</strong> ${scheduledWarga.length} rumah &nbsp;|&nbsp;
                    <strong>Sudah dikunjungi:</strong> ${visitedCount} &nbsp;|&nbsp;
                    <strong>Belum di-scan:</strong> ${notVisitedCount} &nbsp;|&nbsp;
                    <strong>Cakupan:</strong> ${coverage.toFixed(1)}%
                </div>
                <table>
                    <thead><tr><th>No</th><th>Nama Warga</th><th>Dukuh</th><th>RT</th><th>Keterangan / Alasan</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="5" style="text-align:center">Semua rumah terjadwal sudah dikunjungi hari ini.</td></tr>'}</tbody>
                </table>
                <div class="footer">
                    <p>Rowosari, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                    <p style="margin-top:60px; font-weight:800;">( ............................ )</p>
                    <p>Admin Desa</p>
                </div>
                <script>window.onload=()=>{window.print();window.close();}</script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal</label>
                        <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dukuh</label>
                        <select value={dukuhId} onChange={e => setDukuhId(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none">
                            <option value="all">Semua Dukuh</option>
                            {dukuhList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jadwal Hari Ini</label>
                        <div className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs truncate">
                            {isHoliday ? 'Libur' : scheduledDukuhIds.map(id => dukuhList.find(d => d.id === id)?.name).filter(Boolean).join(', ') || '-'}
                        </div>
                    </div>
                </div>
                <p className="text-[11px] text-slate-400 font-medium px-1">
                    "Dikunjungi" = ada transaksi apa pun hari itu untuk warga itu (bayar, TIDAK BAYAR, atau bayar pakai deposit).
                    Rumah yang masuk jadwal tapi tanpa jejak sama sekali berarti tidak di-scan.
                </p>
                <div className="flex flex-wrap gap-2 justify-end">
                    <button onClick={handlePrint} className="px-5 py-3 bg-slate-800 text-white hover:bg-slate-900 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-slate-900/10 transition-all text-[10px] uppercase tracking-widest"><DownloadIcon /> Cetak Tabel</button>
                </div>
            </div>

            {isHoliday ? (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl text-center">
                    <p className="font-black text-amber-700 text-sm">Libur — tidak ada jadwal pengambilan pada {dayName}, {new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Terjadwal</p>
                            <p className="text-4xl font-black text-slate-800 mt-2">{scheduledWarga.length}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Rumah</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sudah Dikunjungi</p>
                            <p className="text-4xl font-black text-emerald-500 mt-2">{visitedCount}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Rumah</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Belum di-Scan</p>
                            <p className="text-4xl font-black text-rose-600 mt-2">{notVisitedCount}</p>
                            <p className="text-[10px] font-bold text-rose-400 uppercase mt-1">Rumah</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cakupan</p>
                            <div className="mt-2 flex items-center justify-center gap-2">
                                <span className="text-4xl font-black text-emerald-500">{coverage.toFixed(1)}%</span>
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><CheckCircleIcon /></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Daftar Rumah Belum di-Scan ({notVisitedList.length})</h3>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                                <input type="text" placeholder="Cari nama..." className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500/20" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="p-5 w-16 text-center">No</th>
                                        <th className="p-5 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('nama')}>Nama{sortArrow('nama')}</th>
                                        <th className="p-5 cursor-pointer select-none hover:text-slate-600" onClick={() => handleSort('wilayah')}>Dukuh{sortArrow('wilayah')}</th>
                                        <th className="p-5 text-center">RT</th>
                                        <th className="p-5">Keterangan / Alasan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? <tr><td colSpan={5} className="p-10 text-center animate-pulse">Memuat...</td></tr> :
                                    sortedNotVisited.length > 0 ? sortedNotVisited.map((w, i) => (
                                        <tr key={w.id} className="hover:bg-rose-50 transition-colors group">
                                            <td className="p-5 text-center text-slate-400 font-mono text-xs">{i+1}</td>
                                            <td className="p-5">
                                                <p className="font-bold text-slate-700">{w.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">ID: {w.id}</p>
                                            </td>
                                            <td className="p-5 text-xs text-slate-500">
                                                {dukuhList.find(d => d.id === w.dukuhId)?.name || 'N/A'}
                                            </td>
                                            <td className="p-5 text-center text-xs text-slate-500">
                                                RT {rtList.find(r => r.id === w.rtId)?.number || 'N/A'}
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        list="alasan-kunjungan"
                                                        placeholder="Isi alasan..."
                                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                        value={notes[w.id] || ''}
                                                        onChange={e => setNotes(prev => ({ ...prev, [w.id]: e.target.value }))}
                                                        onBlur={() => handleNoteBlur(w.id)}
                                                    />
                                                    {(savedNotes[w.id] || '') !== '' && (notes[w.id] || '') === (savedNotes[w.id] || '') && (
                                                        <span className="text-emerald-500 text-xs font-black shrink-0" title="Tersimpan">&#10003;</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold italic text-xs">Semua rumah terjadwal sudah dikunjungi pada tanggal ini.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                        <datalist id="alasan-kunjungan">
                            <option value="Rumah kosong" />
                            <option value="Warga tidak di rumah" />
                            <option value="QR rusak" />
                            <option value="Warga menolak" />
                            <option value="Jalan tidak bisa dilalui" />
                        </datalist>
                    </div>
                </>
            )}
        </div>
    );
};

export default DailyVisitReport;
