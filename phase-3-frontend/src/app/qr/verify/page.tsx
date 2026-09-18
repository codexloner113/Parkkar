"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, QrCode, Camera, CameraOff } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getApiError } from "@/lib/errors";
import { useVerifyBookingQr } from "@/hooks/useResources";

type BarcodeDetectorLike = {
  detect: (image: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructorLike = new (options?: {
  formats?: string[];
}) => BarcodeDetectorLike;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructorLike;
  }
}

function VerifyQrContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);

  const verify = useVerifyBookingQr();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanFrameRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (scanFrameRef.current !== null) {
      cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const extractToken = (value: string) => {
    try {
      const url = new URL(value);
      const queryToken = url.searchParams.get("token");
      return queryToken ?? value;
    } catch {
      return value;
    }
  };

  const startCamera = async () => {
    setErrorText("");

    if (!window.BarcodeDetector) {
      setCameraSupported(false);
      setErrorText(
        "Camera QR scanning is not supported in this browser. Paste the QR token below instead.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      setErrorText(
        "Camera access is not supported on this device. Paste the QR token below instead.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);

      const detector = new window.BarcodeDetector({
        formats: ["qr_code"],
      });

      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;

        try {
          const codes = await detector.detect(videoRef.current);
          const raw = codes[0]?.rawValue;

          if (raw) {
            setToken(extractToken(raw));
            stopCamera();
            return;
          }
        } catch {
          // Continue scanning until a QR value is detected.
        }

        scanFrameRef.current = requestAnimationFrame(() => {
          void scan();
        });
      };

      void scan();
    } catch (err) {
      setCameraActive(false);
      setErrorText(
        getApiError(err, "Unable to access the camera.").message,
      );
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleVerify = async (action: "ENTRY" | "EXIT") => {
    setMessage("");
    setErrorText("");

    if (!token.trim()) {
      setErrorText("Scan a booking QR or paste its token first.");
      return;
    }

    try {
      const result = await verify.mutateAsync({
        token: extractToken(token.trim()),
        action,
      });

      setMessage(
        `${action === "ENTRY" ? "Entry" : "Exit"} verified successfully for booking #${result.data.booking.id}.`,
      );
    } catch (err) {
      setErrorText(
        getApiError(err, "QR verification failed.").message,
      );
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
                QR VERIFICATION
              </div>
              <h1 className="text-2xl font-bold">Verify booking</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Partners and admins can scan a booking QR to verify entry and exit.
          </p>

          {errorText && (
            <div className="mt-5">
              <Alert message={errorText} />
            </div>
          )}

          {message && (
            <div className="mt-5">
              <Alert tone="success" message={message} />
            </div>
          )}

          {cameraActive && (
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
              <video
                ref={videoRef}
                className="aspect-square w-full object-cover"
                muted
                playsInline
              />
              <div className="flex items-center justify-between p-3 text-xs text-slate-300">
                <span>Point the camera at the booking QR.</span>
                <Button
                  variant="secondary"
                  className="px-3 py-2"
                  onClick={stopCamera}
                >
                  <CameraOff className="h-4 w-4" />
                  Stop
                </Button>
              </div>
            </div>
          )}

          {!cameraActive && cameraSupported && (
            <Button
              variant="secondary"
              className="mt-6"
              onClick={startCamera}
            >
              <Camera className="h-4 w-4" />
              Scan with camera
            </Button>
          )}

          <label className="mt-6 block text-sm font-semibold text-slate-700">
            QR token
          </label>

          <textarea
            value={token}
            onChange={(event) => setToken(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 p-3 text-xs outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            placeholder="The scanned booking token appears here"
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => handleVerify("ENTRY")}
              loading={verify.isPending}
            >
              <CheckCircle2 className="h-4 w-4" />
              Verify entry
            </Button>

            <Button
              variant="secondary"
              onClick={() => handleVerify("EXIT")}
              loading={verify.isPending}
            >
              Verify exit
            </Button>
          </div>
        </Card>
      </main>
    </AppShell>
  );
}

export default function Page() {
  return (
    <ProtectedRoute roles={["PARTNER", "ADMIN"]}>
      <VerifyQrContent />
    </ProtectedRoute>
  );
}
