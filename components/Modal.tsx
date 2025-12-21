
import React, { ReactNode, useEffect } from 'react';
import { XIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Prevent scrolling on body when modal is open
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

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden">
      {/* Overlay / Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Positioning Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full animate-slide-in-up ${sizeClass}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="group flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
              aria-label="Tutup"
            >
              <XIcon className="text-xl group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Body with Internal Scroll if content is too tall */}
          <div className="max-h-[80vh] overflow-y-auto p-6 custom-scrollbar">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
