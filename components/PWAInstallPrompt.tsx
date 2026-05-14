
import React, { useEffect, useState } from 'react';
import { SparklesIcon } from './icons';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        // We've used the prompt, and can't use it again, so clear it
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900 text-white p-5 rounded-3xl shadow-2xl z-50 animate-bounce-slow border border-slate-700">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                    <SparklesIcon className="text-white text-xl" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm">Pasang Aplikasi</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Akses SapaDesa lebih cepat & stabil dengan memasang aplikasi di layar utama Anda.
                    </p>
                    <div className="mt-4 flex gap-2">
                        <button 
                            onClick={handleInstallClick}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            Pasang Sekarang
                        </button>
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="text-slate-400 hover:text-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            Nanti Saja
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translate(-50%, 0); }
                    50% { transform: translate(-50%, -10px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default PWAInstallPrompt;
