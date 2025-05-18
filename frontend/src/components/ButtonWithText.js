import "../styles/ButtonWithText.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
      <div
        className="btn"
        onClick={onClick}
        aria-label={ariaLabel || text}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
      <p className="btnLabel">{text}</p>
    </div>
  );
};
