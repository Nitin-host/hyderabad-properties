import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Sidebar from "./components/SideBar";
import LoginModal from "./components/LoginModal";
import Properties from "./components/Properties";
import PropertyDetailsPage from "./components/PropertyDetailsPage";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ThemeProvider } from "./context/ThemeContext";
import Wishlist from "./components/Wishlist";
import Profile from "./components/Profile";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import ContactPage from "./components/ContactForm";
import ScrollToTop from "./util/ScrollToTop";
import MobileBottomNav from "./components/MobileBottomNav";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const AdminDashboard = lazy(() => import("./components/AdminDashboard"));

function App() {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (mq.matches) setIsDesktopCollapsed(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <Router>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen bg-page text-fg">
            {/* Navbar */}
            <NavBar
              isDesktopCollapsed={isDesktopCollapsed}
              setIsDesktopCollapsed={setIsDesktopCollapsed}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              onLoginClick={() => setIsLoginModalOpen(true)}
            />

            <div className="flex flex-1 min-h-0">
              <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isDesktopCollapsed={isDesktopCollapsed}
              />

              <main className="flex-1 min-w-0 bg-page text-fg overflow-x-auto pb-24 lg:pb-0">
                <ErrorBoundary>
                  <Suspense
                    fallback={
                      <div className="p-6 text-muted">Loading…</div>
                    }
                  >
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
                  </Suspense>
                </ErrorBoundary>
              </main>
            </div>

            <Footer />

            <MobileBottomNav />
            <PWAInstallPrompt />

            {/* Login Modal */}
            <LoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
            />
          </div>
          </Router>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
