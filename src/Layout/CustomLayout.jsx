
import React from "react";
import Bot from "@/Components/production/chatbot/NewChatBot";
import Sidebar from "@/Components/production/sidenav";


const PanelLayout = ({ children, url, allowedRoutes, onReturn, currentPage }) => {
  
  return ( 
    <div style={{ width: "100vw", minHeight: "100vh" }}>
      <Sidebar url={url} allowedRoutes={allowedRoutes} onReturn={onReturn} currentPage={currentPage}>
        {children}
        <Bot url={url} />
      </Sidebar>
    </div>
   
  );
};

export default PanelLayout;
