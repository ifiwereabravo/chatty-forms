import { useState, useEffect, createContext, useContext, useCallback } from '@wordpress/element';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

        if (duration > 0) {
            setTimeout(() => dismissToast(id), duration);
        }
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {createPortal(
                <div className="chatty-forms-toast-container">
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`chatty-forms-toast ${t.type} ${t.exiting ? 'exiting' : ''}`}
                            onClick={() => dismissToast(t.id)}
                        >
                            {t.type === 'success' && '✓ '}
                            {t.type === 'error' && '✗ '}
                            {t.type === 'warning' && '⚠ '}
                            {t.type === 'info' && 'ℹ '}
                            {t.message}
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};
