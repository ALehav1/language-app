import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: number;
    type: ToastType;
    message: string;
    duration: number;
}

interface ToastContextValue {
    showToast: (opts: { type: ToastType; message: string; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(
        ({ type, message, duration = 3000 }: { type: ToastType; message: string; duration?: number }) => {
            const id = nextId++;
            const toast: ToastMessage = { id, type, message, duration };

            setToasts((prev) => {
                // Keep max 3 visible, drop oldest if needed
                const updated = [...prev, toast];
                return updated.slice(-3);
            });

            setTimeout(() => removeToast(id), duration);
        },
        [removeToast]
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

// --- Toast rendering ---

const ICON: Record<ToastType, { symbol: string; color: string }> = {
    success: { symbol: '\u2713', color: 'text-green-400' },
    error: { symbol: '\u2717', color: 'text-red-400' },
    info: { symbol: 'i', color: 'text-blue-400' },
};

const BG: Record<ToastType, string> = {
    success: 'bg-green-500/15 border-green-500/30',
    error: 'bg-red-500/15 border-red-500/30',
    info: 'bg-blue-500/15 border-blue-500/30',
};

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: number) => void }) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[60] flex flex-col items-center gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <button
                    key={toast.id}
                    onClick={() => onDismiss(toast.id)}
                    className={`pointer-events-auto w-full max-w-md flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md text-sm text-white shadow-lg transition-all animate-[slideUp_150ms_ease-out] ${BG[toast.type]}`}
                >
                    <span className={`font-bold text-base ${ICON[toast.type].color}`}>
                        {ICON[toast.type].symbol}
                    </span>
                    <span className="flex-1 text-left">{toast.message}</span>
                </button>
            ))}
        </div>
    );
}
