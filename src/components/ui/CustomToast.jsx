import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef();

  const showToast = useCallback((message, { type = 'info', duration = 3000 } = {}) => {
    setToast({ message, type });
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const handleClose = () => setToast(null);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          className={`fixed left-1/2 bottom-8 z-[2147483647] px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-medium text-white animate-toast-in ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}
          style={{ transform: 'translateX(-50%)', minWidth: 200, maxWidth: 400 }}
          role="alert"
        >
          {toast.type === 'success' && <span>✅</span>}
          {toast.type === 'error' && <span>❌</span>}
          {toast.type === 'info' && <span>ℹ️</span>}
          <span>{toast.message}</span>
          <button onClick={handleClose} className="ml-2 text-white/80 hover:text-white">✕</button>
          <style jsx>{`
            @keyframes toast-in {
              from { opacity: 0; transform: translateX(-50%) translateY(40px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
            .animate-toast-in { animation: toast-in 0.3s cubic-bezier(.4,0,.2,1); }
          `}</style>
        </div>
      )}
    </ToastContext.Provider>
  );
}
