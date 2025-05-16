import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.currentTarget === e.target) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50'
      onClick={handleOverlayClick}
    >
      <div className='bg-base-200 rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-lg relative'>
        <button
          className='absolute top-2 right-2 text-gray-600 hover:text-black text-xl'
          onClick={onClose}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};
