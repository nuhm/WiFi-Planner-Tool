import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './ButtonWithText.css';

/**
 * A reusable button component with an icon and a text label.
 * @param {function} onClick - Function to call on click.
 * @param {object} icon - FontAwesome icon.
 * @param {string} text - Label to display under the icon.
 * @param {string} [ariaLabel] - Optional accessibility label.
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
