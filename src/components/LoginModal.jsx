import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Phone,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PhoneInputDropdown from "../util/PhoneNumberDropdown";

const LoginModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { login, register, verifyOtp, forgotPassword, resetPassword } =
    useAuth();

  useEffect(() => {
    if (!isOpen) {
      setStep("login");
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
      } else if (step === "register") {
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.phone
        );
      } else if (step === "otp") {
        result = await verifyOtp(formData.email, formData.otp);
      } else if (step === "forgot") {
        result = await forgotPassword(formData.email);
        if (result.success) setStep("reset");
      } else if (step === "reset") {
        result = await resetPassword(formData.token, formData.password);
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
      <div className="w-full max-w-md bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold text-center flex-1">
            {step === "otp"
              ? "Enter OTP"
              : step === "forgot"
              ? "Forgot Password"
              : step === "reset"
              ? "Reset Password"
              : step === "register"
              ? "Create Account"
              : "Welcome to RR Properties"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {step === "otp" && (
            <div>
              <label className="block mb-2 text-sm font-medium">
                Enter OTP sent to your email
              </label>
              <div className="flex justify-between gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={formData.otp[index] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      let newOtp = formData.otp.split("");
                      newOtp[index] = val;
                      setFormData((prev) => ({
                        ...prev,
                        otp: newOtp.join(""),
                      }));

                      // Auto-focus next input
                      if (val && index < 5) {
                        const next = document.getElementById(
                          `otp-${index + 1}`
                        );
                        if (next) next.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Backspace" &&
                        !formData.otp[index] &&
                        index > 0
                      ) {
                        const prev = document.getElementById(
                          `otp-${index - 1}`
                        );
                        if (prev) prev.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData
                        .getData("text")
                        .replace(/\\D/g, "")
                        .slice(0, 6);
                      if (pasted.length) {
                        let newOtp = formData.otp.split("");
                        for (let i = 0; i < pasted.length; i++) {
                          newOtp[i] = pasted[i];
                        }
                        setFormData((prev) => ({
                          ...prev,
                          otp: newOtp.join(""),
                        }));

                        // Fill inputs visually
                        pasted.split("").forEach((char, i) => {
                          const box = document.getElementById(`otp-${i}`);
                          if (box) box.value = char;
                        });

                        // Focus last filled input
                        const lastBox = document.getElementById(
                          `otp-${pasted.length - 1}`
                        );
                        if (lastBox) lastBox.focus();
                      }
                    }}
                    id={`otp-${index}`}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-600 rounded-lg 
                     bg-gray-800 text-white placeholder-gray-400 focus:outline-none 
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                ))}
              </div>
            </div>
          )}
          {(step === "login" || step === "register") && (
            <>
              {step === "register" && (
                <>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
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
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      Phone Number
                    </label>
                    <PhoneInputDropdown
                      allowedCountries={["IN"]}
                      onChange={(data) =>
                        setFormData((prev) => ({ ...prev, phone: data.phone }))
                      }
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium">Email</label>
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
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">
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
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
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

              {step === "login" && (
                <p
                  className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer mt-1"
                  onClick={() => setStep("forgot")}
                >
                  Forgot Password?
                </p>
              )}
            </>
          )}
          {step === "forgot" && (
            <div>
              <label className="block mb-2 text-sm font-medium">
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
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}
          {step === "reset" && (
            <div>
              <label className="block mb-2 text-sm font-medium">
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
                  placeholder="New password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}
          {showSuccess && (
            <div className="bg-green-900/20 border border-green-800 rounded-lg p-3">
              <p className="text-green-400 text-sm">Success!</p>
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-3 transition transform hover:scale-105 shadow-md"
          >
            {isLoading
              ? "Please wait..."
              : step === "otp"
              ? "Verify OTP"
              : step === "forgot"
              ? "Send Reset Link"
              : step === "reset"
              ? "Reset Password"
              : step === "register"
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        {(step === "login" || step === "register") && (
          <div className="pt-6 text-center">
            <p className="text-gray-400">
              {step === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                onClick={() => setStep(step === "login" ? "register" : "login")}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                {step === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;