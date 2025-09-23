import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Sidebar from "./components/SideBar";
import LoginModal from "./components/LoginModal";
import Properties from "./components/Properties";
import PropertyDetailsPage from "./components/PropertyDetailsPage";
import AdminDashboard from "./components/AdminDashboard";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import Wishlist from "./components/Wishlist";
import Profile from "./components/Profile";

function App() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <AuthProvider>
      <WishlistProvider>
        <Router>
          <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="lg:h-screen">
        <NavBar
          isDesktopCollapsed={isDesktopCollapsed}
          setIsDesktopCollapsed={setIsDesktopCollapsed}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onLoginClick={() => setIsLoginModalOpen(true)}
        />
        
        {/* Main content area with sidebar inside */}
        <div className="lg:flex lg:h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isDesktopCollapsed={isDesktopCollapsed}
            onLoginClick={() => setIsLoginModalOpen(true)}
          />
          
          {/* Content area - takes remaining space in flex layout */}
          <main className={`flex-1 transition-all duration-200 ${
            isDesktopCollapsed ? "lg:ml-16" : "lg:ml-64"
          }`}>
            <Routes>
              <Route path="/" element={<Properties />} />
              <Route path="/property/:id" element={<PropertyDetailsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/favorites" element={<Wishlist />} />
              <Route path='/profile' element={<Profile/>} />
              <Route path="*" element={<div className="p-6">404 Not Found</div>} />
            </Routes>
          </main>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
    </Router>
    </WishlistProvider>
  </AuthProvider>
  );
}

export default App;
