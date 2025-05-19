import React, { createContext, useCallback, useContext, useState } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
	const [toasts, setToasts] = useState([]);

	const showToast = useCallback((message, duration = 3000) => {
		const id = Date.now() + Math.random();
		setToasts((prev) => [...prev, { id, message, duration }]);
	}, []);

	const removeToast = (id) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	};

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className="toast-container">
				{toasts.map((toast) => (
					<Toast
						key={toast.id}
						message={toast.message}
						duration={toast.duration}
						onClose={() => removeToast(toast.id)}
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
}

export function useToast() {
	return useContext(ToastContext);
}
