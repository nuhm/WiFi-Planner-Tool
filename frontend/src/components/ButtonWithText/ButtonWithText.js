import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ButtonWithText.css';

/**
 * Reusable button with an icon and label underneath.
 *
 * - Used for things like navigation or tool actions
 */
export const ButtonWithText = ({ onClick, icon, text, ariaLabel }) => {
	return (
		<div className="btnContainer">
			<button className="btn" onClick={onClick} aria-label={ariaLabel || text}>
				<FontAwesomeIcon icon={icon} />
			</button>
			<p className="btnLabel">{text}</p>
		</div>
	);
};
