/**
 * نظام تنبيهات (Toast) مركزي مع دعم i18n.
 *
 * الاستخدام في أي مكوّن:
 *   import { useToast } from '@/components/ui/Toast';
 *   const { addToast } = useToast();
 *   addToast('success', t('toasts.saved'));        // مع i18n
 *   addToast('error',   'Connection failed');       // نص خام
 */
import {
  createContext, useCallback, useContext, useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, durationMs?: number) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error  : 'bg-red-500',
  warning: 'bg-amber-500',
  info   : 'bg-sky-500',
};

const ICON: Record<ToastType, JSX.Element> = {
  success: <CheckCircle2  className="w-5 h-5 shrink-0" />,
  error  : <XCircle       className="w-5 h-5 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 shrink-0" />,
  info   : <Info          className="w-5 h-5 shrink-0" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback<ToastContextValue['addToast']>((type, message, durationMs = 4000) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, type, message, duration: durationMs }]);
    if (durationMs > 0) {
      setTimeout(() => removeToast(id), durationMs);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium transition-all duration-300 animate-in slide-in-from-top-4 ${STYLES[t.type]}`}
          >
            {ICON[t.type]}
            <span className="flex-1 break-words">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="opacity-70 hover:opacity-100 shrink-0"
              aria-label="close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
