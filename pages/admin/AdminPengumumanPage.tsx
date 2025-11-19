
import React, { useState, useEffect, useCallback } from 'react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '@/services/api';
import type { Announcement } from '@/types';
import { MegaphoneIcon, PencilIcon, TrashIcon, CheckCircleIcon } from '@/components/icons';
import Modal from '@/components/Modal';

const AnnouncementForm: React.FC<{
    announcement?: Announcement | null;
    onSave: (data: Omit<Announcement, 'id' | 'date'>) => void;
    onCancel: () => void;
}> = ({ announcement, onSave, onCancel }) => {
    const [title, setTitle] = useState(announcement?.title || '');
    const [content, setContent] = useState(announcement?.content || '');
    const [isActive, setIsActive] = useState(announcement?.isActive ?? true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ title, content, isActive });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Pengumuman</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Isi Pengumuman</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary" required></textarea>
            </div>
            <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-5 w-5 text-primary rounded focus:ring-primary" />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Aktifkan Pengumuman</label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-focus">Simpan</button>
            </div>
        </form>
    );
};

const AdminPengumumanPage: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const data = await getAnnouncements();
        setAnnouncements(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (data: Omit<Announcement, 'id' | 'date'>) => {
        if (selectedAnnouncement) {
            await updateAnnouncement(selectedAnnouncement.id, data);
        } else {
            await createAnnouncement(data);
        }
        fetchData();
        setIsModalOpen(false);
        setSelectedAnnouncement(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus pengumuman ini?')) {
            await deleteAnnouncement(id);
            fetchData();
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-display text-slate-800">Pengumuman</h1>
                    <p className="text-slate-500 mt-1">Kelola informasi yang ditampilkan di halaman publik.</p>
                </div>
                <button onClick={() => { setSelectedAnnouncement(null); setIsModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-primary-focus transition-colors font-semibold">
                    + Buat Pengumuman
                </button>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <p className="text-center text-slate-500">Memuat...</p>
                ) : announcements.length > 0 ? (
                    announcements.map(item => (
                        <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between gap-4">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                                    {item.isActive ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold border border-green-200">Aktif</span>
                                    ) : (
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold border border-slate-200">Tidak Aktif</span>
                                    )}
                                </div>
                                <p className="text-slate-600 text-sm mb-2">{item.content}</p>
                                <p className="text-xs text-slate-400">Diposting: {new Date(item.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => { setSelectedAnnouncement(item); setIsModalOpen(true); }} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"><PencilIcon /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"><TrashIcon /></button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                        <MegaphoneIcon className="text-4xl text-slate-300 mb-3" />
                        <p className="text-slate-500">Belum ada pengumuman.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAnnouncement ? 'Edit Pengumuman' : 'Buat Pengumuman'}>
                <AnnouncementForm announcement={selectedAnnouncement} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default AdminPengumumanPage;
