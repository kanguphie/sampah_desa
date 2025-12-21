
import React, { useState, useEffect, useCallback } from 'react';
import { getSchedule, updateSchedule, getAllDukuh } from '@/services/api';
import Modal from '@/components/Modal';
import { PencilIcon, HomeIcon, ClockIcon, CheckCircleIcon } from '@/components/icons';
import type { Dukuh } from '@/types';

type Schedule = Record<string, number[] | 'libur'>;

const ScheduleForm: React.FC<{
  day: string;
  currentSchedule: number[] | 'libur';
  onSave: (day: string, newSchedule: number[] | 'libur') => void;
  onCancel: () => void;
  dukuhList: Dukuh[];
}> = ({ day, currentSchedule, onSave, onCancel, dukuhList }) => {
  const isHoliday = currentSchedule === 'libur';
  const [selectedDukuhIds, setSelectedDukuhIds] = useState<number[]>(isHoliday ? [] : currentSchedule);
  const [isHolidayChecked, setIsHolidayChecked] = useState(isHoliday);

  const handleDukuhChange = (dukuhId: number) => {
    setSelectedDukuhIds(prev =>
      prev.includes(dukuhId) ? prev.filter(id => id !== dukuhId) : [...prev, dukuhId]
    );
  };

  const handleHolidayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsHolidayChecked(checked);
    if (checked) {
      setSelectedDukuhIds([]);
    }
  };

  useEffect(() => {
    if (selectedDukuhIds.length > 0) {
      setIsHolidayChecked(false);
    }
  }, [selectedDukuhIds]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isHolidayChecked) {
      onSave(day, 'libur');
    } else {
      onSave(day, selectedDukuhIds);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Pilih Wilayah Pengambilan untuk Hari {day}</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {dukuhList.map(dukuh => (
                 <label key={dukuh.id} className="flex items-center p-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    <input 
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary disabled:opacity-50"
                      checked={selectedDukuhIds.includes(dukuh.id)}
                      onChange={() => handleDukuhChange(dukuh.id)}
                      disabled={isHolidayChecked}
                    />
                    <span className="ml-3 text-slate-700">{dukuh.name}</span>
                 </label>
            ))}
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
         <label className="flex items-center p-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <input 
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500 disabled:opacity-50"
              checked={isHolidayChecked}
              onChange={handleHolidayChange}
              disabled={selectedDukuhIds.length > 0}
            />
            <span className="ml-3 font-semibold text-slate-700">Jadikan Hari Libur</span>
         </label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors">Simpan</button>
      </div>
    </form>
  );
};


const AdminPengaturanPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'jadwal' | 'profil'>('jadwal');
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dayToEdit, setDayToEdit] = useState<{ day: string; schedule: number[] | 'libur' } | null>(null);

    // Form Profil Desa State
    const [villageProfile, setVillageProfile] = useState({
        name: 'Rowosari',
        head: 'Bapak Maryanto',
        address: 'Jl. Raya Rowosari No. 1, Kec. Limpung, Kab. Batang',
        vision: 'Membangun desa yang bersih, sehat, dan mandiri secara ekonomi.',
        mission: 'Mendigitalisasi layanan masyarakat dan pengelolaan lingkungan berkelanjutan.'
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [scheduleData, dukuhData] = await Promise.all([getSchedule(), getAllDukuh()]);
            setSchedule(scheduleData);
            setDukuhList(dukuhData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSchedule = async (day: string, newSchedule: number[] | 'libur') => {
        await updateSchedule(day, newSchedule);
        fetchData();
        setIsModalOpen(false);
        setDayToEdit(null);
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Profil desa berhasil diperbarui!");
    };
    
    const openFormModal = (day: string, currentSchedule: number[] | 'libur') => {
        setDayToEdit({ day, schedule: currentSchedule });
        setIsModalOpen(true);
    };

    const getScheduleDisplay = (scheduleData: number[] | 'libur') => {
        if (scheduleData === 'libur' || scheduleData.length === 0) {
            return <span className="text-amber-600 font-semibold italic text-sm">Libur Pengambilan</span>;
        }
        return scheduleData
            .map(id => dukuhList.find(d => d.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    const scheduleOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pengaturan Sistem</h1>
                <p className="mt-1 text-slate-500 font-medium">Konfigurasi operasional dan identitas Desa Rowosari.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
                    <button 
                        onClick={() => setActiveTab('jadwal')}
                        className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'jadwal' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <ClockIcon className="text-lg" /> Jadwal Pengambilan
                    </button>
                    <button 
                        onClick={() => setActiveTab('profil')}
                        className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'profil' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <HomeIcon className="text-lg" /> Profil Desa
                    </button>
                </div>

                <div className="p-6 md:p-10 animate-fade-in">
                    {activeTab === 'jadwal' ? (
                        <div className="space-y-4">
                            <div className="mb-6">
                                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Jadwal Operasional</h3>
                                <p className="text-slate-400 text-sm font-medium">Atur pembagian wilayah pengambilan sampah per hari.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {loading ? (
                                    Array.from({ length: 7 }).map((_, i) => (
                                        <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse"></div>
                                    ))
                                ) : schedule && scheduleOrder.map((day) => (
                                    <div key={day} className="group p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none">{day.substring(0,3)}</span>
                                                <ClockIcon className={`text-xl mt-1 ${schedule[day] === 'libur' ? 'text-amber-500' : 'text-emerald-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 text-lg">{day}</h4>
                                                <p className="text-slate-500 text-sm font-medium line-clamp-1">{getScheduleDisplay(schedule[day])}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => openFormModal(day, schedule[day])} 
                                            className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <PencilIcon /> Edit Jadwal
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateProfile} className="max-w-3xl mx-auto space-y-8">
                            <div className="text-center mb-10">
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border-2 border-emerald-100 shadow-inner">
                                    <HomeIcon className="text-5xl" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Identitas Desa</h3>
                                <p className="text-slate-400 font-medium">Informasi ini akan ditampilkan pada slip laporan dan kartu warga.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Desa</label>
                                    <input type="text" value={villageProfile.name} onChange={e => setVillageProfile({...villageProfile, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kepala Desa / Lurah</label>
                                    <input type="text" value={villageProfile.head} onChange={e => setVillageProfile({...villageProfile, head: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Sekretariat / Kantor</label>
                                    <input type="text" value={villageProfile.address} onChange={e => setVillageProfile({...villageProfile, address: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visi Desa</label>
                                    <textarea rows={3} value={villageProfile.vision} onChange={e => setVillageProfile({...villageProfile, vision: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700 resize-none"></textarea>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Misi Desa</label>
                                    <textarea rows={3} value={villageProfile.mission} onChange={e => setVillageProfile({...villageProfile, mission: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-medium text-slate-700 resize-none"></textarea>
                                </div>
                            </div>

                            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-black shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-3">
                                <CheckCircleIcon /> Simpan Perubahan Profil
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <Modal 
              isOpen={isModalOpen} 
              onClose={() => { setIsModalOpen(false); setDayToEdit(null); }} 
              title={`Edit Jadwal Hari ${dayToEdit?.day}`}
            >
                {dayToEdit && (
                    <ScheduleForm 
                        day={dayToEdit.day}
                        currentSchedule={dayToEdit.schedule}
                        onSave={handleSaveSchedule}
                        onCancel={() => { setIsModalOpen(false); setDayToEdit(null); }} 
                        dukuhList={dukuhList}
                    />
                )}
            </Modal>
        </div>
    );
};

export default AdminPengaturanPage;
