'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type Toast = {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
};

// Simple global toast store
let toastListeners: Array<(toast: Toast) => void> = [];

export function showToast(message: string, type: Toast['type'] = 'info') {
    const toast = { id: crypto.randomUUID(), message, type };
    toastListeners.forEach((fn) => fn(toast));
}

export function Toaster() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, 4000);
        };
        toastListeners.push(listener);
        return () => {
            toastListeners = toastListeners.filter((l) => l !== listener);
        };
    }, []);

    const icons = { success: CheckCircle2, error: AlertTriangle, info: Info };
    const colors = {
        success: 'border-green-500/30 bg-green-500/10 text-green-400',
        error: 'border-red-500/30 bg-red-500/10 text-red-400',
        info: 'border-brand-500/30 bg-brand-500/10 text-brand-400',
    };

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => {
                const Icon = icons[toast.type];
                return (
                    <div
                        key={toast.id}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm pointer-events-auto shadow-xl animate-slide-in-right',
                            colors[toast.type]
                        )}
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground">{toast.message}</p>
                        <button
                            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                            className="ml-2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
