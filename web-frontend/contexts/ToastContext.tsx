import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Toast, ToastContainer } from '@/components/Toast';

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  // Convenience methods
  success: (
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;
  error: (title: string, message?: string, options?: Partial<Toast>) => string;
  info: (title: string, message?: string, options?: Partial<Toast>) => string;
  warning: (
    title: string,
    message?: string,
    options?: Partial<Toast>
  ) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addToast = useCallback(
    (toastData: Omit<Toast, 'id'>) => {
      const id = generateId();
      const toast: Toast = {
        id,
        duration: 5000, // Default 5 seconds
        dismissible: true,
        ...toastData,
      };

      setToasts(prev => [...prev, toast]);
      return id;
    },
    [generateId]
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: 'success',
        title,
        message,
        ...options,
      });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: 'error',
        title,
        message,
        duration: 7000, // Errors stay longer
        ...options,
      });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: 'info',
        title,
        message,
        ...options,
      });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Toast>) => {
      return addToast({
        type: 'warning',
        title,
        message,
        duration: 6000, // Warnings stay a bit longer
        ...options,
      });
    },
    [addToast]
  );

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
