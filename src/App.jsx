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
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import ContactPage from "./components/ContactForm";
import ScrollToTop from "./util/ScrollToTop";

function App() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <AuthProvider>
      <WishlistProvider>
        <Router>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
            {/* Navbar */}
            <NavBar
              isDesktopCollapsed={isDesktopCollapsed}
              setIsDesktopCollapsed={setIsDesktopCollapsed}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              onLoginClick={() => setIsLoginModalOpen(true)}
            />

            {/* Main + Sidebar (flex-1 makes this fill available height) */}
            <div className="flex min-h-screen">
              {/* Sidebar */}
              <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isDesktopCollapsed={isDesktopCollapsed}
                onLoginClick={() => setIsLoginModalOpen(true)}
              />

              {/* Content */}
              <main className="flex-1 min-w-0 bg-gray-900 text-gray-100 overflow-x-auto">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Properties />} />
                    <Route
                      path="/property/:slug"
                      element={<PropertyDetailsPage />}
                    />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/favorites" element={<Wishlist />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route
                      path="*"
                      element={<div className="p-6">404 Not Found</div>}
                    />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>

            {/* Footer - always at bottom */}
            <Footer />

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
