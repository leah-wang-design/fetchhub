import { useState, useCallback } from 'react';
import Modal, { ModalButton } from '../components/Modal';

interface ModalConfig {
  title?: string;
  message: string;
  buttons: ModalButton[];
}

interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({
    message: '',
    buttons: [],
  });
  const [toasts, setToasts] = useState<(ToastConfig & { id: number })[]>([]);

  const openModal = useCallback((modalConfig: ModalConfig) => {
    setConfig(modalConfig);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const confirm = useCallback(
    (title: string, message: string, confirmText: string, confirmVariant: 'primary' | 'tertiary' | 'danger' = 'primary'): Promise<boolean> => {
      return new Promise((resolve) => {
        openModal({
          title,
          message,
          buttons: [
            {
              text: 'Cancel',
              variant: 'tertiary',
              onClick: () => {
                closeModal();
                resolve(false);
              },
            },
            {
              text: confirmText,
              variant: confirmVariant,
              onClick: () => {
                closeModal();
                resolve(true);
              },
            },
          ],
        });
      });
    },
    [openModal, closeModal]
  );

  const alert = useCallback(
    (message: string): Promise<void> => {
      return new Promise((resolve) => {
        openModal({
          message,
          buttons: [
            {
              text: 'OK',
              variant: 'primary',
              onClick: () => {
                closeModal();
                resolve();
              },
            },
          ],
        });
      });
    },
    [openModal, closeModal]
  );

  const toast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ModalComponent = useCallback(
    () => (
      <>
        <Modal isOpen={isOpen} {...config} onClose={closeModal} />
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`min-w-[300px] max-w-md px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slideInRight ${
                toast.type === 'success'
                  ? 'bg-white dark:bg-gray-800 text-black dark:text-white border  border-stone-200 dark:border-gray-700'
                  : toast.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800'
              }`}
            >
              {toast.type === 'success' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </>
    ),
    [isOpen, config, closeModal, toasts, removeToast]
  );

  return {
    confirm,
    alert,
    toast,
    ModalComponent,
  };
}
