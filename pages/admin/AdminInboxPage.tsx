
import React, { useState, useEffect, useCallback } from 'react';
import { getMessages, markMessageAsRead, deleteMessage } from '@/services/api';
import type { ContactMessage } from '@/types';
import { TrashIcon, EnvelopeIcon, EnvelopeOpenIcon, PhoneIcon } from '@/components/icons';
import Modal from '@/components/Modal';

const AdminInboxPage: React.FC = () => {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMessages();
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleViewMessage = async (msg: ContactMessage) => {
        setSelectedMessage(msg);
        if (!msg.isRead) {
            await markMessageAsRead(msg.id);
            // Update local state to reflect read status
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
        }
    };

    const handleDeleteConfirm = async () => {
        if (messageToDelete) {
            await deleteMessage(messageToDelete.id);
            setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
            setMessageToDelete(null);
            if (selectedMessage?.id === messageToDelete.id) {
                setSelectedMessage(null);
            }
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const msgDate = new Date(date);
        
        // If today, show time
        if (msgDate.setHours(0,0,0,0) === now.setHours(0,0,0,0)) {
            return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
        // Else show date
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="space-y-6">
             <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold font-display text-slate-800">Kotak Masuk</h1>
                        <p className="mt-1 text-slate-500">Pesan dari warga melalui halaman Kontak.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden min-h-[400px]">
                 {loading ? (
                     <div className="p-8 text-center text-slate-500">Memuat pesan...</div>
                 ) : messages.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                         <EnvelopeOpenIcon className="text-5xl mb-4 opacity-20" />
                         <p>Belum ada pesan masuk.</p>
                     </div>
                 ) : (
                     <div className="divide-y divide-slate-100">
                         {messages.map(msg => (
                             <div 
                                key={msg.id} 
                                onClick={() => handleViewMessage(msg)}
                                className={`group flex items-center gap-4 p-4 cursor-pointer transition-all hover:bg-slate-50 ${!msg.isRead ? 'bg-emerald-50/30' : ''}`}
                             >
                                 <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!msg.isRead ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                     {!msg.isRead ? <EnvelopeIcon /> : <EnvelopeOpenIcon />}
                                 </div>
                                 
                                 <div className="flex-grow min-w-0">
                                     <div className="flex justify-between items-baseline mb-1">
                                         <h3 className={`text-sm truncate ${!msg.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                                             {msg.name}
                                         </h3>
                                         <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{formatTime(msg.timestamp)}</span>
                                     </div>
                                     <p className={`text-sm truncate ${!msg.isRead ? 'text-slate-800' : 'text-slate-500'}`}>
                                         {msg.message}
                                     </p>
                                 </div>

                                 <button 
                                    onClick={(e) => { e.stopPropagation(); setMessageToDelete(msg); }}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    title="Hapus Pesan"
                                 >
                                     <TrashIcon />
                                 </button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>

            {/* Detail Message Modal */}
            <Modal isOpen={!!selectedMessage} onClose={() => setSelectedMessage(null)} title="Detail Pesan" size="lg">
                 {selectedMessage && (
                     <div className="space-y-6">
                         <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                             <div>
                                 <h3 className="text-xl font-bold text-slate-800">{selectedMessage.name}</h3>
                                 <div className="flex items-center text-slate-500 text-sm mt-1">
                                     <PhoneIcon className="mr-2 text-xs" />
                                     {selectedMessage.contact}
                                 </div>
                             </div>
                             <div className="text-right text-xs text-slate-400">
                                 <p>{new Date(selectedMessage.timestamp).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                                 <p>{new Date(selectedMessage.timestamp).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</p>
                             </div>
                         </div>
                         
                         <div className="bg-slate-50 p-4 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[150px]">
                             {selectedMessage.message}
                         </div>

                         <div className="flex justify-end pt-4 gap-3">
                             <button 
                                onClick={() => setSelectedMessage(null)} 
                                className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                             >
                                 Tutup
                             </button>
                             <button 
                                onClick={() => { setMessageToDelete(selectedMessage); }} 
                                className="px-5 py-2.5 rounded-xl font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                             >
                                 Hapus Pesan
                             </button>
                         </div>
                     </div>
                 )}
            </Modal>

            {/* Confirm Delete Modal */}
             <Modal isOpen={!!messageToDelete} onClose={() => setMessageToDelete(null)} title="Hapus Pesan" size="md">
                {messageToDelete && (
                    <div>
                        <p className="text-slate-700 text-center mb-6">
                            Hapus pesan dari <strong>{messageToDelete.name}</strong>?
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setMessageToDelete(null)} className="bg-slate-200 text-slate-800 px-5 py-2 rounded-lg hover:bg-slate-300 font-semibold">
                                Batal
                            </button>
                            <button 
                                onClick={handleDeleteConfirm} 
                                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 font-semibold shadow-lg shadow-red-500/30"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminInboxPage;
