import '../styles/TopBar.css';
const { electronAPI } = window;

/**
 * Custom window top bar for Electron (draggable).
 * Includes minimize, maximize, and close buttons.
 */
export default function TopBar() {
   const handleMinimize = () => electronAPI.minimize();
   const handleMaximize = () => electronAPI.maximize();
   const handleClose = () => electronAPI.close();

   return (
      <div className="topbar">
         <div className="topbar-buttons">
         <button className="topbar-btn" onClick={handleMinimize} aria-label="Minimize window">–</button>
         <button className="topbar-btn" onClick={handleMaximize} aria-label="Maximize window">□</button>
         <button className="topbar-btn close" onClick={handleClose} aria-label="Close window">×</button>
         </div>
      </div>
   );
};