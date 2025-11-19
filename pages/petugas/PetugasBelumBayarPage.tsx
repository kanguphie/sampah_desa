import React, { useState, useEffect, useMemo } from 'react';
import { getUnpaidWargaForToday, getAllDukuh, getAllRT, getScheduleForToday } from '@/services/api';
import type { Warga, Dukuh, RT } from '@/types';
import { SearchIcon, UsersIcon } from '@/components/icons';

const PetugasBelumBayarPage: React.FC = () => {
    const [unpaidWarga, setUnpaidWarga] = useState<Warga[]>([]);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [rtList, setRtList] = useState<RT[]>([]);
    const [scheduleInfo, setScheduleInfo] = useState<{ isHoliday: boolean, dukuhIds: number[], dukuhNames: string[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [wargaData, dukuhData, rtData, scheduleData] = await Promise.all([
                    getUnpaidWargaForToday(),
                    getAllDukuh(),
                    getAllRT(),
                    getScheduleForToday()
                ]);
                setUnpaidWarga(wargaData);
                setDukuhList(dukuhData);
                setRtList(rtData);
                setScheduleInfo(scheduleData);
            } catch (error) {
                console.error("Failed to fetch data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getDukuhName = (dukuhId: number) => dukuhList.find(d => d.id === dukuhId)?.name || 'N/A';
    const getRTNumber = (rtId: number) => rtList.find(rt => rt.id === rtId)?.number || 'N/A';

    const filteredWarga = useMemo(() => {
        if (!search) return unpaidWarga;
        return unpaidWarga.filter(w =>
            w.name.toLowerCase().includes(search.toLowerCase()) ||
            w.id.includes(search)
        );
    }, [unpaidWarga, search]);

    const renderEmptyState = () => {
        if (scheduleInfo?.isHoliday) {
            return (
                <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-slate-200/80">
                    <h3 className="font-semibold text-lg text-slate-600">Jadwal Libur</h3>
                    <p className="text-slate-500 mt-1 text-sm">Hari ini tidak ada jadwal pengambilan sampah.</p>
                </div>
            );
        }
        if (search) {
             return (
                <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-slate-200/80">
                    <h3 className="font-semibold text-lg text-slate-600">Data Tidak Ditemukan</h3>
                    <p className="text-slate-500 mt-1 text-sm">Tidak ada warga yang cocok dengan pencarian Anda.</p>
                </div>
            );
        }
        return (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-slate-200/80">
                <h3 className="font-semibold text-lg text-slate-600">Semua Warga Lunas</h3>
                <p className="text-slate-500 mt-1 text-sm">Semua warga di wilayah terjadwal telah melakukan pembayaran hari ini.</p>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-lg">
                        <UsersIcon className="text-2xl text-amber-600" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Warga Belum Bayar (Sesuai Jadwal)</p>
                        {loading ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mt-1"></div> : 
                            <p className="text-2xl font-bold font-display text-slate-800">{filteredWarga.length} <span className="text-base font-medium text-slate-500">Warga</span></p>
                        }
                    </div>
                </div>
                 {scheduleInfo && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                            Jadwal hari ini: 
                            <span className="font-semibold text-slate-700 ml-1">
                                {scheduleInfo.isHoliday ? 'Libur' : scheduleInfo.dukuhNames.join(', ')}
                            </span>
                        </p>
                    </div>
                 )}
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Cari nama atau ID warga..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <SearchIcon className="text-xl" />
                </div>
            </div>

            <div className="space-y-2">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80 animate-pulse">
                            <div className="h-5 w-3/4 bg-slate-200 rounded mb-2"></div>
                            <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                        </div>
                    ))
                ) : filteredWarga.length > 0 ? (
                    filteredWarga.map(warga => (
                        <div key={warga.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80">
                            <p className="font-semibold text-slate-800">{warga.name}</p>
                            <p className="text-sm text-slate-500">
                                Wilayah: RT {getRTNumber(warga.rtId)}, {getDukuhName(warga.dukuhId)}
                                <span className="mx-2 text-slate-300">|</span>
                                ID: <span className="font-mono">{warga.id}</span>
                            </p>
                        </div>
                    ))
                ) : (
                   renderEmptyState()
                )}
            </div>
        </div>
    );
};

export default PetugasBelumBayarPage;