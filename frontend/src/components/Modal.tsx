import { useEffect } from 'react';
import { X } from 'lucide-react';
import { buttonStyles } from '../styles/buttonStyles';

export interface ModalButton {
  text: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'tertiary' | 'danger';
}

interface ModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  buttons: ModalButton[];
  onClose: () => void;
}

export default function Modal({ isOpen, title, message, buttons, onClose }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getButtonStyle = (variant: ModalButton['variant']) => {
    switch (variant) {
      case 'primary':
        return buttonStyles.primarySmall;
      case 'danger':
        return buttonStyles.dangerSmall;
      case 'tertiary':
        return buttonStyles.tertiarySmall;
      case 'secondary':
      default:
        return buttonStyles.secondarySmall;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-[480px] max-w-[90vw] max-h-[80vh] overflow-auto p-6 animate-fadeIn relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
          title="Exit"
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>

        {title && (
          <h3 className="text-lg font-medium mb-3 text-gray-900 pr-8" style={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'" }}>
            {title}
          </h3>
        )}
        
        <p className="text-base text-gray-700 mb-5">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3">
          {buttons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className={getButtonStyle(button.variant)}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
