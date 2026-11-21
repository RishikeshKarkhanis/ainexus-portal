import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle, Mail, LockKeyhole, UserRound, CheckCircle2, ShieldCheck, Sun, Moon } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

export default function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [isAcropolisStudent, setIsAcropolisStudent] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState("email");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    enrollmentNumber: "",
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
    setIsAcropolisStudent(false);
    setFormData((prev) => ({ ...prev, enrollmentNumber: "" }));
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
        if (isAcropolisStudent && !/^[^@\s]+@acropolis\.in$/i.test(formData.email.trim())) {
          setStatus("error");
          setMessage('Acropolis students must register using an email ending in "@acropolis.in".');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setStatus("error");
          setMessage("Passwords do not match.");
          return;
        }

        const data = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          acropolisStudent: isAcropolisStudent,
          enrollmentNumber: isAcropolisStudent ? formData.enrollmentNumber.trim() : null,
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

  const inputClass = "auth-input w-full border-b border-[#8B929F]/40 bg-transparent py-4 pl-11 pr-12 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#8B929F] focus:border-[#6F91D8]";

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
    <div style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className={`auth-shell starfield relative min-h-screen overflow-hidden px-5 py-6 sm:px-8 lg:px-12 ${isLight ? "light-theme" : "bg-[#00001F] text-[#E8E5DF]"}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

        .auth-shell {
          background-color: #00001F;
          background-image:
            radial-gradient(1px 1px at 8% 18%, rgba(232,229,223,.72) 50%, transparent 100%),
            radial-gradient(1px 1px at 24% 72%, rgba(174,187,208,.48) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 48% 28%, rgba(232,229,223,.58) 50%, transparent 100%),
            radial-gradient(1px 1px at 71% 82%, rgba(111,145,216,.72) 50%, transparent 100%),
            radial-gradient(1px 1px at 88% 34%, rgba(232,229,223,.62) 50%, transparent 100%);
          background-size: 420px 360px;
        }
        .auth-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: .28;
          background: radial-gradient(ellipse at 18% 45%, rgba(30,79,154,.24), transparent 38%),
                      radial-gradient(ellipse at 82% 55%, rgba(59,130,214,.12), transparent 34%);
        }
        .auth-grid {
          background-image: linear-gradient(rgba(111,145,216,.11) 1px, transparent 1px), linear-gradient(90deg, rgba(111,145,216,.11) 1px, transparent 1px);
          background-size: 34px 34px;
        }
        .auth-card {
          background: linear-gradient(145deg, rgba(12,20,48,.97), rgba(5,9,31,.95));
          border: 1px solid rgba(111,145,216,.32);
          box-shadow: 0 28px 90px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.035);
          backdrop-filter: blur(18px);
        }
        .auth-input { color: #E8E5DF !important; }
        .auth-input::placeholder { color: #8B929F !important; }
        .auth-orbit {
          border: 1px solid rgba(111,145,216,.42);
          box-shadow: 0 0 55px rgba(59,130,214,.08), inset 0 0 35px rgba(59,130,214,.04);
        }
        .auth-kicker { letter-spacing: .24em; }
        .auth-shell.light-theme {
          background-color: #F2F1EC;
          color: #00001F;
          background-image:
            radial-gradient(1px 1px at 8% 18%, rgba(30,79,154,.22) 50%, transparent 100%),
            radial-gradient(1px 1px at 24% 72%, rgba(70,83,106,.16) 50%, transparent 100%),
            radial-gradient(1.5px 1.5px at 48% 28%, rgba(30,79,154,.18) 50%, transparent 100%),
            radial-gradient(1px 1px at 71% 82%, rgba(111,145,216,.30) 50%, transparent 100%);
        }
        .light-theme::before { opacity: .22; }
        .light-theme .auth-card {
          background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(246,247,250,.97));
          border-color: rgba(30,79,154,.22);
          box-shadow: 0 24px 70px rgba(25,43,75,.10), inset 0 1px 0 rgba(255,255,255,.9);
        }
        .light-theme [class*="text-[#E8E5DF]"] { color: #00001F !important; }
        .light-theme [class*="text-[#AEBBD0]"] { color: #46536A !important; }
        .light-theme [class*="text-[#8B929F]"] { color: #697386 !important; }
        .light-theme [class*="text-[#6F91D8]"] { color: #315F9D !important; }
        .light-theme [class*="border-[#3B82D6]"] { border-color: rgba(30,79,154,.25) !important; }
        .light-theme input { color: #00001F !important; border-color: rgba(70,83,106,.38) !important; }
        .light-theme input::placeholder { color: #8992A2 !important; }
        .light-theme .auth-orbit { border-color: rgba(30,79,154,.24); box-shadow: 0 0 55px rgba(30,79,154,.06), inset 0 0 35px rgba(30,79,154,.035); }
        .light-theme button[class*="bg-[#1E4F9A]"] { color: #FFFFFF !important; }
        .light-theme button[class*="bg-[#1E4F9A]"]:hover { color: #FFFFFF !important; }
        @media (prefers-reduced-motion: no-preference) {
          .auth-orbit-outer { animation: orbit-pulse 8s ease-in-out infinite; }
          @keyframes orbit-pulse { 0%,100% { transform: scale(1); opacity: .72; } 50% { transform: scale(1.035); opacity: 1; } }
        }
      `}</style>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ backgroundImage: "radial-gradient(1px 1px at 8% 18%, rgba(232,229,223,.75) 50%, transparent 100%), radial-gradient(1px 1px at 24% 72%, rgba(174,187,208,.6) 50%, transparent 100%), radial-gradient(1.5px 1.5px at 48% 28%, rgba(232,229,223,.65) 50%, transparent 100%), radial-gradient(1px 1px at 71% 82%, rgba(111,145,216,.8) 50%, transparent 100%), radial-gradient(1px 1px at 88% 34%, rgba(232,229,223,.7) 50%, transparent 100%)", backgroundSize: "420px 360px" }}
      />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-[#3B82D6]/30 pb-5">
        <Link to="/" className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center border border-[#3B82D6]/40 bg-[#1E4F9A]/10 text-3xl leading-none text-[#6F91D8]">
            <img src="\icons\favicon.ico" alt="" />
          </span>
          <span className="flex flex-col">
            <span className="text-lg font-semibold tracking-[0.24em] text-[#E8E5DF]">AI NEXUS</span>
            <span className="mt-1 text-[10px] tracking-[0.28em] text-[#AEBBD0]">ACROPOLIS INSTITUTE</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setIsLight((current) => !current)} aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"} title={isLight ? "Switch to dark mode" : "Switch to light mode"} className="inline-flex h-10 w-10 items-center justify-center border border-[#3B82D6]/35 text-[#AEBBD0] transition hover:border-[#3B82D6] hover:text-[#E8E5DF]">
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#AEBBD0] transition hover:text-[#E8E5DF]">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-125px)] max-w-7xl items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.85fr] lg:gap-24 lg:py-12">
        <section className="relative hidden min-h-[590px] flex-col justify-center lg:flex">
          <p className="auth-kicker mb-8 flex items-center gap-4 text-[10px] tracking-[0.2em] text-[#6F91D8]">
            <span>✦ &nbsp; DEPARTMENT OF CSE (AI &amp; ML)</span>
            <span className="h-px w-20 bg-[#3B82D6]/70" />
          </p>
          <h1 className="max-w-2xl text-7xl leading-[0.96] tracking-[-0.055em] text-[#E8E5DF] xl:text-[6.5rem]">
            Ideas take
            <br />
            <span className="italic text-[#6F91D8]">shape here.</span>
          </h1>
          <p className="mt-7 max-w-lg text-2xl italic leading-snug text-[#AEBBD0]">A community built on curiosity, collaboration and technology.</p>
          <p className="mt-7 max-w-md text-sm leading-8 text-[#AEBBD0]">Connect with fellow builders, take part in events and explore what you can create with AI Nexus.</p>
          <div className="auth-grid relative mt-12 h-52 max-w-lg overflow-hidden border border-[#3B82D6]/30 p-6">
            <div className="auth-orbit auth-orbit-outer absolute right-8 top-5 h-40 w-40 rounded-full" />
            <div className="auth-orbit absolute right-[4.25rem] top-[3.25rem] h-24 w-24 rounded-full" />
            <div className="absolute bottom-6 left-6">
              <p className="text-[9px] tracking-[0.25em] text-[#6F91D8]">FIG. 02 — YOUR NEXT CHAPTER</p>
              <p className="mt-2 text-xs text-[#AEBBD0]">Curiosity into capability.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-xl">
          <div className="mb-8 text-center lg:hidden">
            <p className="text-xs tracking-[0.25em] text-[#3B82D6]">✦ &nbsp; ACROPOLIS INSTITUTE</p>
            <h1 className="mt-4 text-5xl tracking-tight text-[#E8E5DF]">AI Nexus</h1>
          </div>

          <div className="auth-card relative overflow-hidden p-6 sm:p-9">
            <div className="mb-7">
              <p className="auth-kicker text-[10px] uppercase tracking-[0.22em] text-[#6F91D8]">{isLogin ? "Welcome Back" : isRegister ? "Join Our Community" : recoveryStep === "success" ? "Recovery Complete" : "Account Recovery"}</p>
              <h2 className="mt-4 text-3xl leading-[1.12] tracking-[-0.025em] text-[#E8E5DF] sm:text-[2.65rem]">{title}</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#AEBBD0]">{description}</p>
            </div>

            {isForgot && recoveryStep !== "success" && (
              <div className="mb-8 flex items-center gap-2">
                {["email", "otp", "reset"].map((step, index) => {
                  const steps = ["email", "otp", "reset"];
                  const currentIndex = steps.indexOf(recoveryStep);
                  const completed = index <= currentIndex;
                  return <div key={step} className={`h-1 flex-1 transition ${completed ? "bg-[#3B82D6]" : "bg-[#8B929F]/25"}`} />;
                })}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <div>
                  <label className="mb-2 block text-xs tracking-[0.12em] text-[#AEBBD0]">Full Name</label>
                  <div className="relative">
                    <UserRound size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                    <input type="text" name="name" value={formData.name} onChange={updateField} placeholder="Enter your full name" autoComplete="name" required className={inputClass} />
                  </div>
                </div>
              )}

              {(!isForgot || recoveryStep === "email") && (
                <div>
                  <label className="mb-2 block text-xs tracking-[0.12em] text-[#AEBBD0]">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                    <input type="email" name="email" value={formData.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required readOnly={isForgot && recoveryStep !== "email"} className={`${inputClass} ${isForgot && recoveryStep !== "email" ? "cursor-not-allowed opacity-60" : ""}`} />
                  </div>
                </div>
              )}

              {isRegister && (
                <label className="flex cursor-pointer items-start gap-3 border border-[#3B82D6]/20 bg-[#00001F]/35 p-3 transition hover:border-[#3B82D6]/45">
                  <input
                    type="checkbox"
                    checked={isAcropolisStudent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsAcropolisStudent(checked);
                      if (!checked) {
                        setFormData((prev) => ({ ...prev, enrollmentNumber: "" }));
                      }
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#3B82D6]"
                  />
                  <span>
                    <span className="block text-sm text-[#E8E5DF]">I'm an Acropolis student</span>
                    <span className="mt-1 block text-xs leading-5 text-[#AEBBD0]">If selected, use your institutional email address ending in @acropolis.in.</span>
                  </span>
                </label>
              )}

              {isRegister && (
                <div>
                  <label className="mb-2 block text-xs tracking-[0.12em] text-[#AEBBD0]">Enrollment Number</label>
                  <input type="text" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={updateField} placeholder={isAcropolisStudent ? "Enter your enrollment number" : "Available to Acropolis students only"} disabled={!isAcropolisStudent} required={isAcropolisStudent} autoComplete="off" className={`${inputClass} pl-0 ${isAcropolisStudent ? "" : "cursor-not-allowed border-[#EAB308]/30 bg-[#EAB308]/5 text-[#8B929F] opacity-70"}`} />
                  {!isAcropolisStudent && <p className="mt-2 border-l-2 border-yellow-400/70 bg-yellow-400/5 px-3 py-2 text-xs leading-5 text-yellow-300">Enrollment number should only be filled by Acropolis students.</p>}
                </div>
              )}

              {isForgot && recoveryStep === "otp" && (
                <div>
                  <label className="mb-2 block text-xs tracking-[0.12em] text-[#AEBBD0]">Verification Code</label>
                  <div className="relative">
                    <ShieldCheck size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setFormData((prev) => ({ ...prev, otp: value }));
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
                    <button type="button" onClick={resendOtp} disabled={isLoading} className="text-xs text-[#6F91D8] transition hover:text-[#E8E5DF] disabled:opacity-50">
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              {(!isForgot || recoveryStep === "reset") && recoveryStep !== "success" && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-xs tracking-[0.12em] text-[#AEBBD0]">{isForgot ? "New Password" : "Password"}</label>
                    {isLogin && (
                      <button type="button" onClick={() => changeMode("forgot")} className="text-xs text-[#6F91D8] transition hover:text-[#E8E5DF]">
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <LockKeyhole size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={updateField} placeholder={isForgot ? "Enter your new password" : "Enter your password"} autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} maxLength={72} required className={inputClass} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#8B929F] transition hover:text-[#E8E5DF]">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {(isRegister || (isForgot && recoveryStep === "reset")) && (
                <div>
                  <label className="mb-2 block text-xs tracking-[0.12em] text-[#AEBBD0]">Confirm Password</label>
                  <div className="relative">
                    <LockKeyhole size={18} className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={updateField} placeholder="Re-enter your password" autoComplete="new-password" minLength={8} maxLength={72} required className={inputClass} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide password" : "Show password"} className="absolute right-1 top-1/2 -translate-y-1/2 text-[#8B929F] transition hover:text-[#E8E5DF]">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {message && (
                <div className={`flex items-start gap-2 border p-3 text-sm ${status === "success" ? "border-green-500/30 bg-green-500/5 text-green-400" : "border-red-500/30 bg-red-500/5 text-red-400"}`}>
                  {status === "success" && <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
                  <p>{message}</p>
                </div>
              )}

              {isForgot && recoveryStep === "success" ? (
                <button
                  type="button"
                  onClick={() => {
                    changeMode("login");
                    setFormData((prev) => ({ ...prev, password: "", confirmPassword: "", otp: "" }));
                  }}
                  className="flex w-full items-center justify-center gap-3 bg-[#1E4F9A] px-6 py-4 text-sm text-[#E8E5DF] transition hover:bg-[#3B82D6]">
                  Continue to Login <ArrowRight size={17} />
                </button>
              ) : (
                <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-3 bg-[#1E4F9A] px-6 py-4 text-sm text-[#E8E5DF] transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:opacity-60">
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

            <div className="mt-7 border-t border-[#3B82D6]/25 pt-6 text-center">
              {isLogin && (
                <p className="text-sm text-[#AEBBD0]">
                  Don't have an account?{" "}
                  <button type="button" onClick={() => changeMode("register")} className="ml-1 text-[#6F91D8] transition hover:text-[#E8E5DF]">
                    Create Account
                  </button>
                </p>
              )}
              {isRegister && (
                <p className="text-sm text-[#AEBBD0]">
                  Already have an account?{" "}
                  <button type="button" onClick={() => changeMode("login")} className="ml-1 text-[#6F91D8] transition hover:text-[#E8E5DF]">
                    Sign In
                  </button>
                </p>
              )}
              {isForgot && recoveryStep !== "success" && (
                <button type="button" onClick={() => changeMode("login")} className="inline-flex items-center gap-2 text-sm text-[#6F91D8] transition hover:text-[#E8E5DF]">
                  <ArrowLeft size={15} />
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
          <p className="mt-7 text-center text-xs tracking-wide text-[#8B929F]">© {new Date().getFullYear()} AI Nexus · Acropolis Institute</p>
        </section>
      </main>
    </div>
  );
}
