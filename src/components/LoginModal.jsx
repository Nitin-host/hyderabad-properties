import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Phone, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PhoneInputDropdown from '../util/PhoneNumberDropdown';

const LoginModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    otp: "",
  });
  const [step, setStep] = useState("login");
  // steps: "login" | "otp" | "forgot" | "reset"

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { login, register, verifyOtp, forgotPassword, resetPassword } =
    useAuth();

  // At the top of your component
  React.useEffect(() => {
    if (!isOpen) {
      // Reset modal state whenever it is closed
      setStep("login");
      setIsLogin(true);
      setFormData({ name: "", email: "", password: "", phone: "", otp: "" });
      setErrors({});
      setShowSuccess(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;

      if (step === "login") {
        result = await login(formData.email, formData.password);
        if (result.otpRequired) {
          setStep("otp");
          setShowSuccess(false);
          setErrors({});
          setIsLoading(false);
          return;
        }
      } else if (step === "otp") {
        result = await verifyOtp(formData.email, formData.otp);
      } else if (step === "forgot") {
        result = await forgotPassword(formData.email);
        if (result.success) {
          setStep("reset");
        }
      } else if (step === "reset") {
        result = await resetPassword(formData.token, formData.password);
      } else {
        if (!isLogin) {
          result = await register(
            formData.name,
            formData.email,
            formData.password,
            formData.phone
          );
        }
      }

      if (result.success) {
        setShowSuccess(true);
        setErrors({});
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            password: "",
            phone: "",
            otp: "",
          });
          setShowSuccess(false);
          onClose();
        }, 1500);
      } else {
        setErrors({ submit: result.error || "Action failed" });
      }
    } catch (error) {
      setErrors({ submit: "Unexpected error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {step === "otp"
              ? "Enter OTP"
              : step === "forgot"
              ? "Forgot Password"
              : step === "reset"
              ? "Reset Password"
              : isLogin
              ? "Welcome to RR Properties"
              : "Create Account"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* OTP Step */}
          {step === "otp" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter OTP sent to your email
              </label>
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-700 border-gray-600 text-white"
                  placeholder="6-digit OTP"
                />
              </div>
            </div>
          )}

          {/* Forgot Password Step */}
          {step === "forgot" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter your email to reset password
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter your email"
                />
              </div>
            </div>
          )}

          {/* Reset Password Step */}
          {step === "reset" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter New Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-700 border-gray-600 text-white"
                  placeholder="New password"
                />
              </div>
            </div>
          )}

          {/* Normal Login/Register */}
          {step === "login" && (
            <>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <PhoneInputDropdown
                    allowedCountries={["IN"]}
                    onChange={(data) =>
                      setFormData((prev) => ({ ...prev, phone: data.phone }))
                    }
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border rounded-lg bg-gray-700 border-gray-600 text-white"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <p
                className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer mt-1"
                onClick={() => setStep("forgot")}
              >
                Forgot Password?
              </p>
            </>
          )}

          {/* Errors */}
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Success */}
          {showSuccess && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
              <p className="text-green-400 text-sm">Success!</p>
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
          >
            {isLoading
              ? "Please wait..."
              : step === "otp"
              ? "Verify OTP"
              : step === "forgot"
              ? "Send Reset Link"
              : step === "reset"
              ? "Reset Password"
              : isLogin
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Switch Login/Register */}
        {step === "login" && (
          <div className="px-6 pb-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;