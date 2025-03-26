import React, { useEffect } from 'react';
import '../styles/Toast.css';

function Toast({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast">
      {message}
    </div>
  );
}

export default Toast;
