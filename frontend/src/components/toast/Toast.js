import { useEffect, useState } from 'react';
import './Toast.css';

/**
 * Toast notification component that displays a temporary message and fades out.
 *
 * @component
 * @param {Object} props - Component props.
 * @param {string} props.message - The message text to display inside the toast.
 * @param {() => void} props.onClose - Callback invoked after the toast disappears.
 * @param {number} [props.duration=3000] - Time in milliseconds before the toast hides (default: 3000ms).
 * @returns {JSX.Element} A toast element that auto-dismisses after the given duration.
 */
function Toast({ message, onClose, duration = 3000 }) {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const hideTimer = setTimeout(() => setVisible(false), duration);
		return () => clearTimeout(hideTimer);
	}, [duration]);

	// Give the exit animation time to play before actually removing
	useEffect(() => {
		if (!visible) {
			const removeTimer = setTimeout(() => {
				onClose();
			}, 300); // Duration of the exit animation
			return () => clearTimeout(removeTimer);
		}
	}, [visible, onClose]);

	return (
		<div className={`toast ${visible ? 'toastVisible' : 'toastHidden'}`}>
			{message}
		</div>
	);
}

export default Toast;
