import React from 'react';
import '../App.css';
const { electronAPI } = window;

export default function TopBar() {
   const handleMinimize = () => electronAPI.minimize();
   const handleMaximize = () => electronAPI.maximize();
   const handleClose = () => electronAPI.close();

   return (
      <div
         style={{
         height: '32px',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'flex-end',
         backgroundColor: '#202225',
         WebkitAppRegion: 'drag',
         userSelect: 'none',
         }}
      >
         <div style={{ display: 'flex', WebkitAppRegion: 'no-drag' }}>
         <button className="topbar-btn" onClick={handleMinimize}>–</button>
         <button className="topbar-btn" onClick={handleMaximize}>□</button>
         <button className="topbar-btn close" onClick={handleClose}>×</button>
         </div>
      </div>
   );
};