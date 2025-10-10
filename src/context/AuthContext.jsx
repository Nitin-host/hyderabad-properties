import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { notifyError, notifySuccess } from "../util/Notifications";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // ✅ Initialize user directly from localStorage
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isLoading, setIsLoading] = useState(true);

  // Role-based permission helpers
  const hasAdminAccess = () =>
    user && (user.role === "admin" || user.role === "super_admin");

  const canManageProperties = () => hasAdminAccess();

  const isSuperAdmin = () => user && user.role === "super_admin";

  // ✅ Auth check on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authAPI.getProfile();
         const finalUser = userData.user || userData.data || userData; 
        localStorage.setItem("user", JSON.stringify(finalUser));
        setUser(finalUser);
      } catch (error) {
        if (error.status === 401) {
          // Try token refresh
          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const refreshResponse = await authAPI.refreshToken();
              if (refreshResponse.success && refreshResponse.data?.token) {
                localStorage.setItem("authToken", refreshResponse.data.token);
                if (refreshResponse.data.refreshToken) {
                  localStorage.setItem(
                    "refreshToken",
                    refreshResponse.data.refreshToken
                  );
                }
                const userData = await authAPI.getProfile();
                localStorage.setItem("user", JSON.stringify(userData));
                setUser(userData);
                setIsLoading(false);
                return;
              }
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
          logout();
        } else {
          console.error("Profile fetch failed:", error);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login({ email, password });

      // 🟢 Case 1: OTP required (super_admin)
      if (response.success && response.otpRequired) {
        return {
          success: true,
          otpRequired: true,
          email: email,
          message: response.message || "OTP sent to your email",
        };
      }

      if (response.success && response.mustChangePassword) {
        return {
          success: true,
          mustChangePassword: true,
          user: response.data.user,
          message: response.message,
        };
      }

      // 🟢 Case 2: Normal login
      if (response.success && response.data?.token) {
        localStorage.setItem("authToken", response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        notifySuccess("Login successful");
        return { success: true };
      }

      return {
        success: false,
        error: response.message || "Invalid credentials",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 New: Verify OTP for super_admin
  const verifyAdminOtp = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyAdminOtp({ email, otp });

      if (response.success && response.data?.token) {
        localStorage.setItem("authToken", response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.message || "OTP verification failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "OTP verification failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Forgot Password
  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword({ email });
      if (response.success) {
        return {
          success: true,
          message:
            response.message ||
            "OTP sent to your email. Please verify to reset password.",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to send reset link",
      };
    }
  };

  // 🟢 Verify Forgot Password OTP
  const verifyForgotOtp = async (email, otp) => {
    setIsLoading(true);
    try {
      const response = await authAPI.verifyForgotOtp({ email, otp });
      if (response.success) {
        return {
          success: true,
          message: response.message || "OTP verified.",
        };
      }

      if (response.success && response.data?.token) {
        localStorage.setItem("authToken", response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }

      return {
        success: false,
        error: response.message || "OTP verification failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "OTP verification failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 Reset Password
  const resetPassword = async (userData) => {
    try {
      const response = await authAPI.resetPassword(userData);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message || "Password reset failed",
      };
    }
  };


  const register = async (name, email, password, phone) => {
    setIsLoading(true);
    try {
      const response = await authAPI.register({ name, email, password, phone });

      if (response.success && response.data?.token) {
        localStorage.setItem("authToken", response.data.token);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }
      return {
        success: false,
        error: response.message || "Registration failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      notifySuccess("Logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);
      notifyError("Error during logout. Please try again.");
    } finally {
      setUser(null);
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  const value = {
    user,
    isLoading,
    login,
    verifyAdminOtp,
    forgotPassword,
    resetPassword,
    register,
    logout,
    isAuthenticated: !!user,
    hasAdminAccess,
    canManageProperties,
    isSuperAdmin,
    verifyForgotOtp,
    userRole: user?.role || "user",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
