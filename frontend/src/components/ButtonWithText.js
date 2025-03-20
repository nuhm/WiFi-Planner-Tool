import "../styles/ButtonWithText.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const ButtonWithText = ({ onClick, icon, text }) => {
   return (
      <div className="btnContainer">
         <div className="btn" onClick={onClick}>
            <FontAwesomeIcon icon={icon} />
         </div>
         <p>
            {text}
         </p>
      </div>
   );
}