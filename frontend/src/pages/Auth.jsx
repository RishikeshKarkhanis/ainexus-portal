import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, BrainCircuit, Eye, EyeOff, LoaderCircle, Mail, LockKeyhole, UserRound, CheckCircle2, ShieldCheck } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

export default function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [recoveryStep, setRecoveryStep] = useState("email");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: "",
  });

  const [resetToken, setResetToken] = useState("");

  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const updateField = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setRecoveryStep("email");
    setStatus("idle");
    setMessage("");
    setResetToken("");

    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleForgotPassword = async () => {
    const data = await apiRequest("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: formData.email.trim(),
      }),
    });

    setRecoveryStep("otp");
    setStatus("success");
    setMessage(data.message || "If an account exists with this email, an OTP has been sent.");
  };

  const handleVerifyOtp = async () => {
    const data = await apiRequest("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({
        email: formData.email.trim(),
        otp: formData.otp,
      }),
    });

    setResetToken(data.resetToken);

    setRecoveryStep("reset");
    setStatus("success");
    setMessage("OTP verified successfully. You can now set a new password.");
  };

  const handleResetPassword = async () => {
    if (formData.password.length < 8) {
      setStatus("error");
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    await apiRequest("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        resetToken,
        newPassword: formData.password,
      }),
    });

    setRecoveryStep("success");
    setStatus("success");
    setMessage("Your password has been changed successfully. A confirmation email has been sent.");

    setFormData((prev) => ({
      ...prev,
      password: "",
      confirmPassword: "",
      otp: "",
    }));

    setResetToken("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus("loading");
    setMessage("");

    try {
      if (mode === "login") {
        await login({
          email: formData.email,
          password: formData.password,
        });

        navigate("/");
        return;
      }

      if (mode === "register") {
        if (formData.password !== formData.confirmPassword) {
          setStatus("error");
          setMessage("Passwords do not match.");
          return;
        }

        const data = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        setStatus("success");
        setMessage(data.message || "Account created successfully. You can now log in.");

        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));

        return;
      }

      if (mode === "forgot") {
        if (recoveryStep === "email") {
          await handleForgotPassword();
          return;
        }

        if (recoveryStep === "otp") {
          await handleVerifyOtp();
          return;
        }

        if (recoveryStep === "reset") {
          await handleResetPassword();
          return;
        }
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Something went wrong. Please try again.");
    }
  };

  const resendOtp = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const data = await apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email.trim(),
        }),
      });

      setFormData((prev) => ({
        ...prev,
        otp: "",
      }));

      setStatus("success");
      setMessage(data.message || "If an account exists, a new OTP has been sent.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to resend OTP.");
    }
  };

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  const inputClass = "w-full rounded-lg border border-white/10 bg-[#0D1222] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500";

  const isLoading = status === "loading";

  const title = isLogin ? "Sign in to your account." : isRegister ? "Create your account." : recoveryStep === "email" ? "Forgot your password?" : recoveryStep === "otp" ? "Verify your email." : recoveryStep === "reset" ? "Create a new password." : "Password changed!";

  const description = isLogin
    ? "Access your events, registrations and AI Nexus profile."
    : isRegister
      ? "Create an account to participate in AI Nexus events and activities."
      : recoveryStep === "email"
        ? "Enter your registered email address to recover your account."
        : recoveryStep === "otp"
          ? `We've sent a 6-digit verification code to ${formData.email}.`
          : recoveryStep === "reset"
            ? "Your email has been verified. Choose a strong new password."
            : "Your account password has been updated successfully.";

  const submitLabel = isLogin ? "Sign In" : isRegister ? "Create Account" : recoveryStep === "email" ? "Send OTP" : recoveryStep === "otp" ? "Verify OTP" : "Reset Password";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080B16] px-5 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-violet-700/10 blur-[130px]" />

      <div className="relative w-full max-w-md">
        {/* Back to home */}
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
            <BrainCircuit size={34} className="text-blue-400" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-wide text-white">
            AI <span className="text-blue-400">NEXUS</span>
          </h1>

          <p className="mt-2 text-xs tracking-[0.2em] text-slate-500">ACROPOLIS INSTITUTE</p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-white/10 bg-[#11182B] p-7 shadow-2xl shadow-black/20 sm:p-9">
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">{isLogin ? "Welcome Back" : isRegister ? "Join Our Community" : recoveryStep === "success" ? "Recovery Complete" : "Account Recovery"}</p>

            <h2 className="mt-3 text-2xl font-bold text-white">{title}</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
          </div>

          {/* Progress indicator */}
          {isForgot && recoveryStep !== "success" && (
            <div className="mb-7 flex items-center gap-2">
              {["email", "otp", "reset"].map((step, index) => {
                const steps = ["email", "otp", "reset"];
                const currentIndex = steps.indexOf(recoveryStep);
                const completed = index <= currentIndex;

                return <div key={step} className={`h-1.5 flex-1 rounded-full transition ${completed ? "bg-blue-500" : "bg-white/10"}`} />;
              })}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            {isRegister && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Full Name</label>

                <div className="relative">
                  <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                  <input type="text" name="name" value={formData.name} onChange={updateField} placeholder="Enter your full name" autoComplete="name" required className={inputClass} />
                </div>
              </div>
            )}

            {/* Email */}
            {(!isForgot || recoveryStep === "email") && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>

                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                  <input type="email" name="email" value={formData.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required readOnly={isForgot && recoveryStep !== "email"} className={`${inputClass} ${isForgot && recoveryStep !== "email" ? "cursor-not-allowed opacity-60" : ""}`} />
                </div>
              </div>
            )}

            {/* OTP */}
            {isForgot && recoveryStep === "otp" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Verification Code</label>

                <div className="relative">
                  <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 6);

                      setFormData((prev) => ({
                        ...prev,
                        otp: value,
                      }));
                    }}
                    placeholder="Enter 6-digit OTP"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    className={inputClass}
                  />
                </div>

                <div className="mt-3 text-right">
                  <button type="button" onClick={resendOtp} disabled={isLoading} className="text-xs font-medium text-blue-400 transition hover:text-blue-300 disabled:opacity-50">
                    Resend OTP
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            {(!isForgot || recoveryStep === "reset") && recoveryStep !== "success" && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">{isForgot ? "New Password" : "Password"}</label>

                  {isLogin && (
                    <button type="button" onClick={() => changeMode("forgot")} className="text-xs font-medium text-blue-400 transition hover:text-blue-300">
                      Forgot Password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={updateField} placeholder={isForgot ? "Enter your new password" : "Enter your password"} autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} maxLength={72} required className={inputClass} />

                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            {(isRegister || (isForgot && recoveryStep === "reset")) && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Confirm Password</label>

                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={updateField} placeholder="Re-enter your password" autoComplete="new-password" minLength={8} maxLength={72} required className={inputClass} />

                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Status messages */}
            {message && (
              <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${status === "success" ? "border-green-500/20 bg-green-500/5 text-green-400" : "border-red-500/20 bg-red-500/5 text-red-400"}`}>
                {status === "success" && <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}

                <p>{message}</p>
              </div>
            )}

            {/* Success state */}
            {isForgot && recoveryStep === "success" ? (
              <button
                type="button"
                onClick={() => {
                  changeMode("login");
                  setFormData((prev) => ({
                    ...prev,
                    password: "",
                    confirmPassword: "",
                    otp: "",
                  }));
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500">
                Continue to Login
                <ArrowRight size={17} />
              </button>
            ) : (
              /* Submit */
              <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {submitLabel}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            )}
          </form>

          {/* Mode switching */}
          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            {isLogin && (
              <p className="text-sm text-slate-400">
                Don't have an account?{" "}
                <button type="button" onClick={() => changeMode("register")} className="font-semibold text-blue-400 transition hover:text-blue-300">
                  Create Account
                </button>
              </p>
            )}

            {isRegister && (
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <button type="button" onClick={() => changeMode("login")} className="font-semibold text-blue-400 transition hover:text-blue-300">
                  Sign In
                </button>
              </p>
            )}

            {isForgot && recoveryStep !== "success" && (
              <button type="button" onClick={() => changeMode("login")} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300">
                <ArrowLeft size={15} />
                Back to Sign In
              </button>
            )}
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-slate-600">© {new Date().getFullYear()} AI Nexus · Acropolis Institute</p>
      </div>
    </div>
  );
}
