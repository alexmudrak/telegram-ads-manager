import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-gray-700 rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-lg relative'>
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
