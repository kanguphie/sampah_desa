
import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Mencegah body scrolling saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    md: 'max-w-md',
    lg: 'max-w-xl'
  }[size];

  // Menggunakan Portal agar modal berada di root DOM (di bawah body)
  // Menghindari masalah 'transform' pada elemen induk yang merusak posisi fixed
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Backdrop dengan Blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div 
        className={`relative bg-white rounded-3xl shadow-2xl w-full ${sizeClass} max-h-full flex flex-col animate-slide-in-up transition-all overflow-hidden`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header - Tetap di Atas */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-white/50 backdrop-blur-md">
          <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="group flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
            aria-label="Tutup"
          >
            <XIcon className="text-2xl group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Body - Scrollable Secara Internal jika konten sangat panjang */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
