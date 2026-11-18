import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, CameraOff, CheckCircle2, ScanLine, ShieldCheck, UserRound, Users, Mail, Clock3, AlertCircle, LoaderCircle, Keyboard, RotateCcw } from "lucide-react";

import { adminApiRequest } from "../../lib/api";

export default function AttendanceManager() {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const processingRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scanMode, setScanMode] = useState("camera");

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());

      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }, []);

  const markAttendance = useCallback(
    async (qrToken) => {
      if (!qrToken?.trim() || processingRef.current) return;

      processingRef.current = true;
      setScanning(true);
      setError("");
      setResult(null);

      try {
        const response = await adminApiRequest("/api/admin/attendance/scan", {
          method: "POST",
          body: JSON.stringify({
            qrToken: qrToken.trim(),
          }),
        });

        setResult(response);
        setManualToken("");

        // Stop camera after a successful check-in.
        stopCamera();
      } catch (err) {
        setError(err.message || "Unable to mark attendance.");
      } finally {
        processingRef.current = false;
        setScanning(false);
      }
    },
    [stopCamera],
  );

  const startCamera = async () => {
    setCameraError("");
    setError("");
    setResult(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access requires HTTPS or localhost.");
      }

      const reader = new BrowserMultiFormatReader();

      readerRef.current = reader;

      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (scanResult, scanError) => {
        if (scanResult && !processingRef.current) {
          const token = scanResult.getText();

          if (token) {
            markAttendance(token);
          }
        }
      });

      controlsRef.current = controls;
      setCameraActive(true);
    } catch (err) {
      setCameraError(err.message || "Unable to access the camera.");
      stopCamera();
    }
  };

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleManualSubmit = (event) => {
    event.preventDefault();

    if (!manualToken.trim()) {
      setError("Please enter a QR token.");
      return;
    }

    markAttendance(manualToken);
  };

  const resetScanner = () => {
    setResult(null);
    setError("");
    setCameraError("");
    setManualToken("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="text-blue-600" size={23} />
            <h2 className="text-2xl font-semibold text-gray-900">Attendance Manager</h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">Scan participant hall tickets to verify and mark attendance.</p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
          <ShieldCheck size={15} />
          Admin Check-in
        </div>
      </div>

      {/* Scanner and manual entry */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Camera Scanner */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-semibold text-gray-900">QR Scanner</h3>
              <p className="mt-1 text-xs text-gray-500">Use your device camera to scan a ticket.</p>
            </div>

            <Camera size={20} className="text-gray-500" />
          </div>

          <div className="p-5">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gray-950">
              <video ref={videoRef} className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`} muted playsInline />

              {!cameraActive && (
                <div className="px-6 text-center text-white">
                  <ScanLine size={48} className="mx-auto mb-3 text-gray-500" />
                  <p className="text-sm font-medium">Camera is currently inactive</p>
                  <p className="mt-1 text-xs text-gray-400">Start the camera to scan QR codes.</p>
                </div>
              )}

              {cameraActive && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-36 w-36 rounded-xl border-2 border-blue-400 shadow-[0_0_0_999px_rgba(0,0,0,0.25)]" />
                </div>
              )}

              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-900">
                    <LoaderCircle size={18} className="animate-spin" />
                    Verifying ticket...
                  </div>
                </div>
              )}
            </div>

            {cameraError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{cameraError}</div>}

            <div className="mt-4 flex gap-3">
              {!cameraActive ? (
                <button onClick={startCamera} disabled={scanning} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-50">
                  <Camera size={17} />
                  Start Camera
                </button>
              ) : (
                <button onClick={stopCamera} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  <CameraOff size={17} />
                  Stop Camera
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <Keyboard size={20} className="text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Manual Check-in</h3>
              <p className="mt-1 text-xs text-gray-500">Enter the QR token if scanning is unavailable.</p>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4 p-5">
            <div>
              <label htmlFor="qr-token" className="mb-2 block text-sm font-medium text-gray-700">
                Participant QR Token
              </label>

              <input id="qr-token" type="text" value={manualToken} onChange={(event) => setManualToken(event.target.value)} placeholder="Enter or paste QR token..." className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" disabled={scanning} />
            </div>

            <button type="submit" disabled={scanning || !manualToken.trim()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {scanning ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
              Verify & Mark Attendance
            </button>

            <p className="text-xs leading-5 text-gray-400">Only valid tickets associated with a registered participant can be checked in.</p>
          </form>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Check-in unsuccessful</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="overflow-hidden rounded-xl border border-green-200 bg-white">
          <div className="flex items-center gap-3 border-b border-green-100 bg-green-50 px-5 py-4">
            <CheckCircle2 size={24} className="text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Attendance Marked Successfully</h3>
              <p className="mt-1 text-xs text-green-700">Participant has been checked in.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <UserRound size={19} className="mt-1 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Participant</p>
                <p className="mt-1 font-semibold text-gray-900">{result.participantName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={19} className="mt-1 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="mt-1 break-all text-sm font-medium text-gray-900">{result.participantEmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users size={19} className="mt-1 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Team</p>
                <p className="mt-1 font-semibold text-gray-900">{result.teamName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ScanLine size={19} className="mt-1 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Event</p>
                <p className="mt-1 font-semibold text-gray-900">{result.eventName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:col-span-2">
              <Clock3 size={19} className="mt-1 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Check-in time</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{result.checkedInAt ? new Date(result.checkedInAt).toLocaleString() : "Recorded"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 p-4">
            <button onClick={resetScanner} className="flex items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
              <RotateCcw size={16} />
              Scan Next Participant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
