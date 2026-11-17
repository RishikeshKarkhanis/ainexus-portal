import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

export default function AdminPanelLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("credentials");

  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // This page is intended for signed-in users. The backend must still
  // enforce admin authorization independently of this frontend check.

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchAdmins = async () => {
      setLoadingAdmins(true);
      setError("");

      try {
        const response = await apiRequest("/api/admin/auth/admins");
        const adminList = Array.isArray(response) ? response : (response?.admins ?? []);

        if (!cancelled) {
          setAdmins(adminList);
          if (adminList.length > 0) {
            const currentAdmin = adminList.find((admin) => admin.userId === user?.userId);
            setSelectedAdminId(currentAdmin?.userId ?? adminList[0].userId ?? "");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load administrator accounts.");
        }
      } finally {
        if (!cancelled) setLoadingAdmins(false);
      }
    };

    fetchAdmins();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.userId]);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAdminId) {
      setError("Please select an administrator account.");
      return;
    }

    if (!adminPassword.trim()) {
      setError("Please enter the admin password.");
      return;
    }

    setSendingOtp(true);

    try {
      const response = await apiRequest("/api/admin/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({
          adminUserId: selectedAdminId,
          adminPassword,
        }),
      });

      setStep("otp");
      setSuccess(response?.message || "A verification code has been sent to the selected administrator's registered email.");
    } catch (err) {
      setError(err.message || "Could not send the verification code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the valid 6-digit verification code.");
      return;
    }

    setVerifyingOtp(true);

    try {
      const response = await apiRequest("/api/admin/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          adminUserId: selectedAdminId,
          otp,
        }),
      });

      if (!response?.token) {
        throw new Error("The server did not return an admin session token.");
      }

      // Keep the admin session separate from the regular user JWT.
      sessionStorage.setItem("adminToken", response.token);
      sessionStorage.setItem("adminUserId", selectedAdminId);

      setSuccess("Admin verification successful. Redirecting...");
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "OTP verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleChangeAdmin = () => {
    setStep("credentials");
    setOtp("");
    setAdminPassword("");
    setError("");
    setSuccess("");
  };

  // ADD THIS HERE
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#00001F] text-[#E8E5DF]">Loading session...</div>;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#00001F] px-5 py-12 text-[#E8E5DF]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3B82D6]/10" />
        <div className="absolute left-1/2 top-1/2 h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3B82D6]/15" />
        <div className="absolute left-1/2 top-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3B82D6]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,214,0.12),transparent_65%)]" />
      </div>

      <section className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#AEBBD0] transition hover:text-[#E8E5DF]">
          <ArrowLeft size={16} />
          Back to AI Nexus
        </Link>

        <div className="border border-[#3B82D6]/30 bg-[#080D24]/95 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center border border-[#3B82D6]/40 bg-[#3B82D6]/10 text-[#6F91D8]">
              <ShieldCheck size={32} strokeWidth={1.5} />
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#3B82D6]">AI Nexus · Restricted Access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#E8E5DF]">Admin Verification</h1>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#AEBBD0]">Verify your administrator account to access the AI Nexus control panel.</p>
          </div>

          <div className="mb-7 flex items-center gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center text-xs font-semibold ${step === "credentials" ? "bg-[#1E4F9A] text-white" : "bg-emerald-500/15 text-emerald-400"}`}>{step === "otp" ? <CheckCircle2 size={17} /> : "1"}</div>
            <div className={`h-px flex-1 ${step === "otp" ? "bg-[#3B82D6]" : "bg-[#3B82D6]/20"}`} />
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center text-xs font-semibold ${step === "otp" ? "bg-[#1E4F9A] text-white" : "border border-[#3B82D6]/30 text-[#8B929F]"}`}>2</div>
          </div>

          {error && (
            <div role="alert" className="mb-5 border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mb-5 border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-300">
              {success}
            </div>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label htmlFor="admin-account" className="mb-2 block text-sm font-medium text-[#AEBBD0]">
                  Administrator account
                </label>
                <div className="relative">
                  <UserRound size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                  <select id="admin-account" value={selectedAdminId} onChange={(event) => setSelectedAdminId(event.target.value)} disabled={loadingAdmins || admins.length === 0} required className="w-full appearance-none border border-[#3B82D6]/25 bg-[#00001F] py-3.5 pl-11 pr-4 text-sm text-[#E8E5DF] outline-none transition focus:border-[#3B82D6] disabled:cursor-not-allowed disabled:opacity-60">
                    {loadingAdmins ? (
                      <option value="">Loading administrators...</option>
                    ) : admins.length === 0 ? (
                      <option value="">No administrator accounts found</option>
                    ) : (
                      admins.map((admin) => (
                        <option key={admin.userId} value={admin.userId}>
                          {admin.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {!loadingAdmins && admins.length === 0 && !error && <p className="mt-2 text-xs text-[#8B929F]">No admin accounts are currently available.</p>}
              </div>

              <div>
                <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-[#AEBBD0]">
                  Common admin password
                </label>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                  <input id="admin-password" type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} placeholder="Enter admin password" autoComplete="current-password" required className="w-full border border-[#3B82D6]/25 bg-[#00001F] py-3.5 pl-11 pr-4 text-sm text-[#E8E5DF] outline-none transition placeholder:text-[#65718A] focus:border-[#3B82D6]" />
                </div>
              </div>

              <button type="submit" disabled={loadingAdmins || admins.length === 0 || sendingOtp || !selectedAdminId} className="inline-flex w-full items-center justify-center gap-2 bg-[#1E4F9A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:opacity-50">
                {sendingOtp ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Sending verification code...
                  </>
                ) : (
                  <>
                    Continue to OTP verification
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#3B82D6]/30 bg-[#3B82D6]/10 text-[#6F91D8]">
                  <Mail size={22} />
                </div>
                <h2 className="text-lg font-semibold text-[#E8E5DF]">Check your email</h2>
                <p className="mt-2 text-sm leading-6 text-[#AEBBD0]">Enter the 6-digit verification code sent to the selected administrator's registered email address.</p>
              </div>

              <div>
                <label htmlFor="admin-otp" className="mb-2 block text-sm font-medium text-[#AEBBD0]">
                  One-time password
                </label>
                <div className="relative">
                  <KeyRound size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F91D8]" />
                  <input
                    id="admin-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    required
                    className="w-full border border-[#3B82D6]/25 bg-[#00001F] py-3.5 pl-11 pr-4 text-center text-lg tracking-[0.45em] text-[#E8E5DF] outline-none transition placeholder:text-sm placeholder:tracking-normal placeholder:text-[#65718A] focus:border-[#3B82D6]"
                  />
                </div>
              </div>

              <button type="submit" disabled={verifyingOtp || otp.length !== 6} className="inline-flex w-full items-center justify-center gap-2 bg-[#1E4F9A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3B82D6] disabled:cursor-not-allowed disabled:opacity-50">
                {verifyingOtp ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify and enter admin panel
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <button type="button" onClick={handleChangeAdmin} disabled={verifyingOtp} className="w-full py-2 text-sm text-[#AEBBD0] transition hover:text-[#E8E5DF] disabled:opacity-50">
                Change administrator / go back
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-[#3B82D6]/15 pt-5 text-center">
            <p className="text-xs leading-5 text-[#77839B]">
              <LockKeyhole size={12} className="mr-1 inline-block" />
              This area is restricted to authorized AI Nexus administrators.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs tracking-wide text-[#65718A]">AI NEXUS · ACROPOLIS INSTITUTE</p>
      </section>
    </main>
  );
}
