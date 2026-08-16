import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, Check } from "lucide-react";

type Props = {
  onCapture: (dataUrls: string[]) => void;
  onClose: () => void;
  /** Fallback for devices where the live camera can't be opened. */
  onFallback?: () => void;
  max?: number;
};

/**
 * Live webcam capture modal (works on desktop, where the `capture` attribute on
 * a file input is ignored and only opens a file picker).
 */
export function CameraCapture({ onCapture, onClose, onFallback, max = 12 }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [shots, setShots] = useState<string[]>([]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setReady(false);
      setError(null);
      stop();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: facing }),
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setReady(true);
        // Labels are only exposed once permission is granted.
        const list = await navigator.mediaDevices.enumerateDevices();
        if (cancelled) return;
        const cams = list.filter((d) => d.kind === "videoinput");
        setDevices(cams);
        if (!deviceId) {
          const active = stream.getVideoTracks()[0]?.getSettings().deviceId;
          if (active) setDeviceId(active);
        }
      } catch (err) {
        const name = (err as { name?: string })?.name ?? "";
        setError(
          name === "NotAllowedError"
            ? "Camera permission was blocked. Allow camera access in your browser's address bar, then try again."
            : name === "NotFoundError"
              ? "No camera was found on this device."
              : "Could not open the camera on this device.",
        );
      }
    }
    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [facing, deviceId, stop]);

  const snap = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setShots((prev) => [...prev, canvas.toDataURL("image/jpeg", 0.9)].slice(0, max));
  }, [max]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4">
      <div className="paper-card w-full max-w-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-extrabold">
            <Camera className="h-5 w-5" /> Snap it
          </h2>
          <button
            type="button"
            onClick={() => {
              stop();
              onClose();
            }}
            aria-label="Close camera"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-border bg-card"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border-2 border-border bg-black">
          {error ? (
            <div className="p-6 text-center text-sm font-semibold text-primary">{error}</div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="aspect-video w-full object-cover"
            />
          )}
        </div>

        {shots.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {shots.map((src, i) => (
              <img
                key={`${i}-${src.slice(-10)}`}
                src={src}
                alt={`Captured photo ${i + 1}`}
                className="aspect-square w-full rounded-xl border-2 border-border object-cover"
              />
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {error ? (
            onFallback && (
              <button
                type="button"
                onClick={() => {
                  stop();
                  onFallback();
                }}
                className="btn-crayon"
              >
                Choose a photo instead
              </button>
            )
          ) : (
            <>
              <button
                type="button"
                onClick={snap}
                disabled={!ready || shots.length >= max}
                className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary px-6 py-2.5 text-base font-extrabold text-primary-foreground disabled:opacity-50"
              >
                <Camera className="h-4 w-4" /> Take photo
              </button>
              {devices.length > 1 ? (
                <label className="inline-flex items-center gap-2 text-sm font-bold">
                  <span className="sr-only">Camera</span>
                  <select
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="max-w-[16rem] rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold"
                    aria-label="Choose camera"
                  >
                    {devices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDeviceId("");
                    setFacing((f) => (f === "user" ? "environment" : "user"));
                  }}
                  className="btn-crayon"
                >
                  <RefreshCw className="h-4 w-4" /> Flip camera
                </button>
              )}
            </>
          )}
          {shots.length > 0 && (
            <button
              type="button"
              onClick={() => {
                stop();
                onCapture(shots);
              }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-secondary px-6 py-2.5 text-base font-extrabold text-secondary-foreground"
            >
              <Check className="h-4 w-4" /> Use {shots.length} photo
              {shots.length === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
