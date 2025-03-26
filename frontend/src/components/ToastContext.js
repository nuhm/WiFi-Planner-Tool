import React, { createContext, useCallback, useContext, useState } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message, duration = 3000) => {
    setToastMessage({ message, duration });
  }, []);

  const handleClose = () => {
    setToastMessage(null);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          duration={toastMessage.duration}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
