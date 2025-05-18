import '../styles/TopBar.css';
const { electronAPI } = window;

export default function TopBar() {
   const handleMinimize = () => electronAPI.minimize();
   const handleMaximize = () => electronAPI.maximize();
   const handleClose = () => electronAPI.close();

   return (
      <div className="topbar">
         <div className="topbar-buttons">
         <button className="topbar-btn" onClick={handleMinimize}>–</button>
         <button className="topbar-btn" onClick={handleMaximize}>□</button>
         <button className="topbar-btn close" onClick={handleClose}>×</button>
         </div>
      </div>
   );
};