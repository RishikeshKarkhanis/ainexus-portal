import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, BrainCircuit, Eye, EyeOff, LoaderCircle, Mail, LockKeyhole, UserRound, CheckCircle2 } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Auth() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

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
    setStatus("idle");
    setMessage("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus("loading");
    setMessage("");

    if (mode === "register" && formData.password !== formData.confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

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

      // Forgot password API is not implemented yet.
      setStatus("error");
      setMessage("Password recovery is not available yet. Please try again later.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to connect to the server.");
    }
  };

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  const inputClass = "w-full rounded-lg border border-white/10 bg-[#0D1222] py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500";

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
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">{isLogin ? "Welcome Back" : isRegister ? "Join Our Community" : "Account Recovery"}</p>

            <h2 className="mt-3 text-2xl font-bold text-white">{isLogin ? "Sign in to your account." : isRegister ? "Create your account." : "Forgot your password?"}</h2>

            <p className="mt-3 text-sm leading-6 text-slate-400">{isLogin ? "Access your events, registrations and AI Nexus profile." : isRegister ? "Create an account to participate in AI Nexus events and activities." : "Enter your registered email address to recover your account."}</p>
          </div>

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
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email Address</label>

              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                <input type="email" name="email" value={formData.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required className={inputClass} />
              </div>
            </div>

            {/* Password */}
            {!isForgot && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">Password</label>

                  {isLogin && (
                    <button type="button" onClick={() => changeMode("forgot")} className="text-xs font-medium text-blue-400 transition hover:text-blue-300">
                      Forgot Password?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={updateField} placeholder="Enter your password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} required className={inputClass} />

                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            {isRegister && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Confirm Password</label>

                <div className="relative">
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={updateField} placeholder="Re-enter your password" autoComplete="new-password" minLength={8} required className={inputClass} />

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

            {/* Submit */}
            <button type="submit" disabled={status === "loading"} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
              {status === "loading" ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {isLogin ? "Sign In" : isRegister ? "Create Account" : "Send Reset Link"}

                  <ArrowRight size={17} />
                </>
              )}
            </button>
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

            {isForgot && (
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
