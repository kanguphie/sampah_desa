import React, { useState, useEffect, useCallback } from 'react';
import { getSchedule, updateSchedule, getAllDukuh } from '@/services/api';
import Modal from '@/components/Modal';
import { PencilIcon } from '@/components/icons';
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
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [dukuhList, setDukuhList] = useState<Dukuh[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dayToEdit, setDayToEdit] = useState<{ day: string; schedule: number[] | 'libur' } | null>(null);

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

    const handleSave = async (day: string, newSchedule: number[] | 'libur') => {
        await updateSchedule(day, newSchedule);
        fetchData();
        setIsModalOpen(false);
        setDayToEdit(null);
    };
    
    const openFormModal = (day: string, currentSchedule: number[] | 'libur') => {
        setDayToEdit({ day, schedule: currentSchedule });
        setIsModalOpen(true);
    };

    const getScheduleDisplay = (scheduleData: number[] | 'libur') => {
        if (scheduleData === 'libur' || scheduleData.length === 0) {
            return <span className="text-amber-600 font-semibold">Libur</span>;
        }
        return scheduleData
            .map(id => dukuhList.find(d => d.id === id)?.name)
            .filter(Boolean)
            .join(', ');
    };

    const scheduleOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <h1 className="text-2xl font-bold font-display text-slate-800">Pengaturan Jadwal</h1>
                <p className="mt-1 text-slate-500">Atur jadwal pengambilan sampah mingguan untuk seluruh wilayah.</p>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-200">
                    {loading ? (
                        Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="p-4 animate-pulse">
                                <div className="h-6 w-3/4 bg-slate-200 rounded"></div>
                            </div>
                        ))
                    ) : schedule && scheduleOrder.map((day) => (
                        <div key={day} className="p-4 md:p-5 flex justify-between items-center hover:bg-slate-50 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{day}</h3>
                                <p className="text-slate-500">{getScheduleDisplay(schedule[day])}</p>
                            </div>
                            <button onClick={() => openFormModal(day, schedule[day])} className="flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-slate-200 border border-slate-200 transition-colors">
                                <PencilIcon className="text-lg" />
                                <span className="hidden sm:inline">Edit</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <Modal 
              isOpen={isModalOpen} 
              onClose={() => { setIsModalOpen(false); setDayToEdit(null); }} 
              title={`Edit Jadwal untuk Hari ${dayToEdit?.day}`}
            >
                {dayToEdit && (
                    <ScheduleForm 
                        day={dayToEdit.day}
                        currentSchedule={dayToEdit.schedule}
                        onSave={handleSave}
                        onCancel={() => { setIsModalOpen(false); setDayToEdit(null); }} 
                        dukuhList={dukuhList}
                    />
                )}
            </Modal>
        </div>
    );
};

export default AdminPengaturanPage;