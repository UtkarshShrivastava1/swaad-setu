import React from 'react';
import ModalWrapper from '../../components/modals/ModalWrapper';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <ModalWrapper title={title} isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-red-500 text-white">Confirm</button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default ConfirmModal;
