
import React, { useState, useEffect, useCallback } from 'react';
import { getSchedule, updateSchedule, getAllDukuh, markDayAsSkipped, getVillageProfile, updateVillageProfile } from '@/services/api';
import Modal from '@/components/Modal';
import { PencilIcon, HomeIcon, ClockIcon, XIcon, CheckCircleIcon, PhoneIcon, EnvelopeIcon } from '@/components/icons';
import type { Dukuh, VillageProfile } from '@/types';

type Schedule = Record<string, number[] | 'libur'>;

const ScheduleForm: React.FC<{
  day: string;
  currentSchedule: number[] | 'libur';
  onSave: (day: string, newSchedule: number[] | 'libur') => void;
  onCancel: () => void;
  dukuhList: Dukuh[];
}> = ({ day, currentSchedule, onSave, onCancel, dukuhList }) => {
  const isHoliday = currentSchedule === 'libur';
  const [selectedDukuhIds, setSelectedDukuhIds] = useState<number[]>(isHoliday ? [] : (currentSchedule as number[] || []));
  const [isHolidayChecked, setIsHolidayChecked] = useState(isHoliday);

  const handleDukuhChange = (dukuhId: number) => {
    setSelectedDukuhIds(prev => {
      const current = prev || [];
      return current.includes(dukuhId) ? current.filter(id => id !== dukuhId) : [...current, dukuhId];
    });
  };

  const handleHolidayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsHolidayChecked(checked);
    if (checked) {
      setSelectedDukuhIds([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(day, isHolidayChecked ? 'libur' : selectedDukuhIds);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-3">Wilayah Pengambilan - {day}</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {dukuhList.map(dukuh => (
                 <label key={dukuh.id} className="flex items-center p-3 rounded-lg hover:bg-slate-100 cursor-pointer">
                    <input 
                      type="checkbox"
                      className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
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
         <label className="flex items-center p-3 rounded-lg hover:bg-slate-100 cursor-pointer">
            <input 
              type="checkbox"
              className="h-5 w-5 rounded border-slate-300 text-amber-500"
              checked={isHolidayChecked}
              onChange={handleHolidayChange}
            />
            <span className="ml-3 font-semibold text-slate-700">Jadikan Hari Libur</span>
         </label>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg">Batal</button>
        <button type="submit" className="bg-primary text-primary-content font-semibold px-4 py-2 rounded-lg">Simpan</button>
      </div>
    </form>
  );
};

const VillageProfileForm: React.FC = () => {
    const [profile, setProfile] = useState<Omit<VillageProfile, 'id' | 'lastUpdated'>>({
        name: '',
        district: '',
        regency: '',
        address: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            const data = await getVillageProfile();
            if (data) {
                const { id, lastUpdated, ...cleanProfile } = data;
                setProfile(cleanProfile);
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await updateVillageProfile(profile);
            setMessage({ type: 'success', text: 'Profil Desa berhasil diperbarui!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Gagal memperbarui profil desa.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest text-xs">Memuat Profil Desa...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-2xl mx-auto">
            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                    {message.type === 'success' ? <CheckCircleIcon /> : <XIcon />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Desa</label>
                    <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="Contoh: Rowosari" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                    <input type="text" value={profile.district} onChange={e => setProfile({...profile, district: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="Limpung" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kabupaten</label>
                    <input type="text" value={profile.regency} onChange={e => setProfile({...profile, regency: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="Batang" required />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap Sekretariat</label>
                    <textarea value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700 resize-none" placeholder="Alamat kantor desa..." required />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp Layanan</label>
                    <div className="relative">
                        <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="08123..." required />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Resmi</label>
                    <div className="relative">
                        <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none font-bold text-slate-700" placeholder="desa@gmail.com" required />
                    </div>
                </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:bg-slate-300 uppercase tracking-widest flex items-center justify-center gap-3">
                {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircleIcon />}
                Simpan Profil Desa
            </button>
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
    const [isSkipping, setIsSkipping] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [scheduleData, dukuhData] = await Promise.all([getSchedule(), getAllDukuh()]);
            setSchedule(scheduleData as Schedule);
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
    };

    const openFormModal = (day: string, currentSchedule: number[] | 'libur') => {
        setDayToEdit({ day, schedule: currentSchedule });
        setIsModalOpen(true);
    };

    const handleSkipToday = async () => {
        if (!schedule) return;
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = days[new Date().getDay()];
        const currentSched = (schedule as any)[todayName];

        if (currentSched === 'libur' || !currentSched || !currentSched.length) {
            alert("Hari ini adalah hari libur.");
            return;
        }

        if (window.confirm(`Batalkan pengambilan hari ini? Iuran warga di wilayah terjadwal akan otomatis ditambahkan ke tunggakan (Hutang).`)) {
            setIsSkipping(true);
            try {
                await markDayAsSkipped(currentSched);
                alert("Berhasil! Iuran warga hari ini telah dialihkan ke tunggakan.");
            } catch (err) {
                alert("Gagal memproses data.");
            } finally {
                setIsSkipping(false);
            }
        }
    };

    const getScheduleDisplay = (scheduleData: number[] | 'libur') => {
        if (scheduleData === 'libur' || !scheduleData || scheduleData.length === 0) {
            return <span className="text-amber-600 font-semibold italic text-sm">Libur Pengambilan</span>;
        }
        return (scheduleData as number[])
            .map(id => dukuhList.find(d => d.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    const scheduleOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const todayName = scheduleOrder[(new Date().getDay() + 6) % 7];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight">Pengaturan Sistem</h1>
                  <p className="mt-1 text-slate-500 text-sm">Konfigurasi operasional dan identitas desa.</p>
                </div>
                {activeTab === 'jadwal' && (
                    <button 
                        onClick={handleSkipToday}
                        disabled={isSkipping}
                        className="bg-rose-50 text-rose-600 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all flex items-center gap-2"
                    >
                        <XIcon className="text-sm" /> Batal Ambil Hari Ini
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 p-2 bg-slate-50/50">
                    <button onClick={() => setActiveTab('jadwal')} className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'jadwal' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}>
                        <ClockIcon className="text-lg" /> Jadwal Pengambilan
                    </button>
                    <button onClick={() => setActiveTab('profil')} className={`flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'profil' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}>
                        <HomeIcon className="text-lg" /> Profil Desa
                    </button>
                </div>

                <div className="p-6 md:p-10 animate-fade-in min-h-[400px]">
                    {activeTab === 'jadwal' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                {loading ? (
                                    Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-20 bg-slate-50 rounded-3xl animate-pulse"></div>)
                                ) : schedule && scheduleOrder.map((day) => (
                                    <div key={day} className={`group p-5 border rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${day === todayName ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">{day.substring(0,3)}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-slate-800 text-lg">{day}</h4>
                                                    {day === todayName && <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Hari Ini</span>}
                                                </div>
                                                <p className="text-slate-500 text-sm font-medium line-clamp-1">{getScheduleDisplay(schedule[day])}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => openFormModal(day, schedule[day])} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-primary hover:text-white hover:border-primary transition-all flex items-center justify-center gap-2 shadow-sm text-sm">
                                            <PencilIcon /> Edit
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <VillageProfileForm />
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Edit Jadwal - ${dayToEdit?.day}`}>
                {dayToEdit && (
                    <ScheduleForm 
                        day={dayToEdit.day}
                        currentSchedule={dayToEdit.schedule}
                        onSave={handleSaveSchedule}
                        onCancel={() => setIsModalOpen(false)} 
                        dukuhList={dukuhList}
                    />
                )}
            </Modal>
        </div>
    );
};

export default AdminPengaturanPage;
