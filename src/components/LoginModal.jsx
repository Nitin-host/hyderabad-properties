import React, { useState, useEffect, useRef } from "react";
import { X, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PhoneInputDropdown from "../util/PhoneNumberDropdown";
import { notifyError, notifySuccess, notifyWarning } from "../util/Notifications";

const inputClass =
  "w-full pl-10 pr-4 py-3 border border-line rounded-xl bg-page text-fg placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition";

const PasswordHints = ({ strength }) => (
  <ul className="mt-2 text-xs space-y-1">
    {[
      ["length", "At least 8 characters"],
      ["uppercase", "One uppercase letter"],
      ["lowercase", "One lowercase letter"],
      ["number", "One number"],
      ["special", "One special character"],
    ].map(([key, label]) => (
      <li
        key={key}
        className={strength[key] ? "text-green-600 dark:text-green-400" : "text-red-500"}
      >
        • {label}
      </li>
    ))}
  </ul>
);

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
  const [showPasswordError, setShowPasswordError] = useState(false);
  const firstOtpRef = useRef(null);

  const {
    login,
    register,
    verifyAdminOtp,
    forgotPassword,
    verifyForgotOtp,
    resetPassword,
  } = useAuth();

  useEffect(() => {
    if ((step === "otp" || step === "otpReset") && isOpen) {
      firstOtpRef.current?.focus();
    }
  }, [step, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPadding = body.style.paddingRight;
    const scrollbarGap = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPadding;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStep("login");
      setFormData({ name: "", email: "", password: "", phone: "", otp: "" });
      setErrors({});
      setShowPassword(false);
      setShowPasswordError(false);
    }
  }, [isOpen]);

  const passwordRules = {
    length: /^(?=.{8,})/,
    uppercase: /^(?=.*[A-Z])/,
    lowercase: /^(?=.*[a-z])/,
    number: /^(?=.*\d)/,
    special: /^(?=.*[@$!%*?&])/,
  };

  const checkPasswordStrength = (password) => ({
    length: passwordRules.length.test(password),
    uppercase: passwordRules.uppercase.test(password),
    lowercase: passwordRules.lowercase.test(password),
    number: passwordRules.number.test(password),
    special: passwordRules.special.test(password),
  });

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
      setShowPasswordError(false);
    }
  };

  const isPasswordValid = () => Object.values(passwordStrength).every(Boolean);

  const titles = {
    login: { heading: "Sign in", sub: "Welcome back to RR Properties" },
    register: { heading: "Create account", sub: "Join RR Properties" },
    otp: { heading: "Enter OTP", sub: "We sent a 6-digit code to your email" },
    otpReset: { heading: "Enter OTP", sub: "Use the code sent to your email" },
    forgot: { heading: "Forgot password", sub: "We will email you a reset code" },
    reset: { heading: "New password", sub: "Choose a strong password" },
    changePassword: { heading: "Change password", sub: "Set a new password to continue" },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      let result;

      if (step === "login") {
        result = await login(formData.email, formData.password);
        if (result.otpRequired) {
          setStep("otp");
          notifyWarning("OTP sent to your email");
          setIsLoading(false);
          return;
        }
        if (result.mustChangePassword) {
          setStep("changePassword");
          setFormData((prev) => ({ ...prev, password: "" }));
          notifyWarning("Please change your password");
          setIsLoading(false);
          return;
        }
      } else if (step === "register") {
        if (!isPasswordValid()) {
          setShowPasswordError(true);
          setIsLoading(false);
          return;
        }
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.phone
        );
        if (result.success) notifySuccess("Account created");
      } else if (step === "otp") {
        result = await verifyAdminOtp(formData.email, formData.otp);
      } else if (step === "forgot") {
        result = await forgotPassword(formData.email);
        if (result.success) {
          notifySuccess("OTP sent to your email");
          setStep("otpReset");
          setIsLoading(false);
          return;
        }
      } else if (step === "otpReset") {
        result = await verifyForgotOtp(formData.email, formData.otp);
        if (result.success) {
          notifySuccess("OTP verified");
          setStep("reset");
          setIsLoading(false);
          return;
        }
      } else if (step === "reset" || step === "changePassword") {
        if (!isPasswordValid()) {
          setShowPasswordError(true);
          setIsLoading(false);
          return;
        }
        result = await resetPassword({
          email: formData.email,
          password: formData.password,
        });
        if (result.success) {
          notifySuccess("Password updated. Please sign in.");
          setStep("login");
          setFormData((prev) => ({ ...prev, password: "", otp: "" }));
          setIsLoading(false);
          return;
        }
      }

      if (result?.success) {
        onClose();
      } else {
        setErrors({ submit: result?.error || "Action failed" });
      }
    } catch (error) {
      notifyError(error?.message || "Unexpected error");
      setErrors({ submit: "Unexpected error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const copy = titles[step] || titles.login;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm overflow-hidden overscroll-none">
      <div className="w-full max-w-md bg-surface text-fg rounded-2xl shadow-2xl border border-line max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand mb-1">
              RR Properties
            </p>
            <h2 className="text-xl font-bold">{copy.heading}</h2>
            <p className="text-sm text-muted mt-1">{copy.sub}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-2 hover:bg-raised rounded-lg transition shrink-0"
          >
            <X size={18} className="text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 flex flex-col gap-4">
          {(step === "otp" || step === "otpReset") && (
            <div>
              <label className="block mb-2 text-sm font-medium">OTP</label>
              <div className="flex justify-between gap-1.5 sm:gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    ref={index === 0 ? firstOtpRef : null}
                    maxLength={1}
                    value={formData.otp[index] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      const newOtp = formData.otp.split("");
                      newOtp[index] = val;
                      setFormData((prev) => ({ ...prev, otp: newOtp.join("") }));
                      if (val && index < 5) {
                        document.getElementById(`otp-${index + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
                        document.getElementById(`otp-${index - 1}`)?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      if (!pasted) return;
                      setFormData((prev) => ({ ...prev, otp: pasted.padEnd(6, " ").trim() }));
                      document.getElementById(`otp-${Math.min(pasted.length, 6) - 1}`)?.focus();
                    }}
                    className="w-10 h-12 sm:w-12 text-center text-lg font-bold border border-line rounded-xl bg-page text-fg focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                  />
                ))}
              </div>
            </div>
          )}

          {step === "forgot" && (
            <div>
              <label className="block mb-2 text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className={inputClass}
                  required
                />
              </div>
              <button
                type="button"
                className="text-sm text-muted mt-3 hover:text-brand"
                onClick={() => setStep("login")}
              >
                ← Back to sign in
              </button>
            </div>
          )}

          {(step === "login" || step === "register") && (
            <>
              {step === "register" && (
                <>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">Phone</label>
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
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Your password"
                    className={`${inputClass} pr-12`}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {step === "register" && showPasswordError && (
                  <PasswordHints strength={passwordStrength} />
                )}
              </div>

              {step === "login" && (
                <button
                  type="button"
                  className="text-sm text-brand text-left hover:opacity-80"
                  onClick={() => setStep("forgot")}
                >
                  Forgot password?
                </button>
              )}
            </>
          )}

          {(step === "reset" || step === "changePassword") && (
            <div>
              <label className="block mb-2 text-sm font-medium">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="New password"
                  className={`${inputClass} pr-12`}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {showPasswordError && <PasswordHints strength={passwordStrength} />}
            </div>
          )}

          {errors.submit && (
            <div className="rounded-xl border border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 p-3">
              <p className="text-sm">{errors.submit}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand hover:opacity-90 text-brand-fg font-semibold rounded-xl px-4 py-3 transition shadow-sm disabled:opacity-60"
          >
            {isLoading
              ? "Please wait…"
              : step === "otp" || step === "otpReset"
                ? "Verify OTP"
                : step === "forgot"
                  ? "Send OTP"
                  : step === "reset" || step === "changePassword"
                    ? "Save password"
                    : step === "register"
                      ? "Create account"
                      : "Sign in"}
          </button>

          {(step === "login" || step === "register") && (
            <p className="text-center text-sm text-muted">
              {step === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setStep(step === "login" ? "register" : "login")}
                className="ml-1.5 text-brand font-medium hover:opacity-80"
              >
                {step === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
