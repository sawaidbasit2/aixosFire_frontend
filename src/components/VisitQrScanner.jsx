import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from 'html5-qrcode';

const safeCleanup = (scanner) => {
  if (!scanner) return;
  try {
    const state = scanner.getState();
    const running =
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED;
    if (running) {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {
          try {
            scanner.clear();
          } catch {
            /* ignore */
          }
        });
    } else {
      try {
        scanner.clear();
      } catch {
        /* ignore */
      }
    }
  } catch {
    try {
      scanner.clear();
    } catch {
      /* ignore */
    }
  }
};

const waitForLayout = (readerId, maxAttempts = 18) =>
  new Promise((resolve) => {
    let n = 0;
    const tick = () => {
      const el = document.getElementById(readerId);
      if (el && el.clientWidth >= 48) {
        resolve(true);
        return;
      }
      n += 1;
      if (n >= maxAttempts) {
        resolve(!!document.getElementById(readerId));
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

/** Pick a real device when possible — `environment` alone often fails on laptops (no back camera). */
const resolveCameraConfig = async () => {
  try {
    const cameras = await Html5Qrcode.getCameras();
    if (!cameras?.length) {
      return { facingMode: 'user' };
    }
    const back = cameras.find((c) =>
      /back|rear|environment|wide/i.test(c.label || '')
    );
    return back ? back.id : cameras[0].id;
  } catch {
    return { facingMode: 'user' };
  }
};

const buildScannerConfig = () => ({
  /** Higher FPS = more decode attempts per second (snappier scan) */
  fps: 20,
  /** QR is symmetric; skipping mirror retry saves ~half the per-frame work */
  disableFlip: true,
  /** Slightly smaller region = less pixels to decode each frame */
  qrbox: (viewfinderWidth, viewfinderHeight) => {
    const m = Math.min(viewfinderWidth, viewfinderHeight);
    const side = Math.max(112, Math.min(260, Math.floor(m * 0.66)));
    return { width: side, height: side };
  },
});

const createScanner = (readerId) =>
  new Html5Qrcode(readerId, {
    verbose: false,
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    /** Native BarcodeDetector (where available) is faster; falls back internally */
    experimentalFeatures: { useBarCodeDetectorIfSupported: true },
  });

/**
 * Renders a camera QR scanner into `#readerId`. Parent controls visibility via `active`.
 */
const VisitQrScanner = ({ readerId, active, onDecoded }) => {
  const onDecodedRef = useRef(onDecoded);
  const scannerRef = useRef(null);

  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);

  useEffect(() => {
    if (!active || !readerId) return undefined;

    let cancelled = false;

    const run = async () => {
      await waitForLayout(readerId);
      if (cancelled) return;

      if (!document.getElementById(readerId)) {
        if (!cancelled) {
          toast.error('QR scanner could not find its view. Try again.');
        }
        return;
      }

      let cameraConfig = await resolveCameraConfig();
      if (cancelled) return;

      let html5QrCode = createScanner(readerId);
      scannerRef.current = html5QrCode;

      const scanConfig = buildScannerConfig();

      const startWith = async (cam) =>
        html5QrCode.start(
          cam,
          scanConfig,
          (decodedText) => {
            onDecodedRef.current?.(decodedText);
          },
          () => {}
        );

      try {
        await startWith(cameraConfig);
      } catch (firstErr) {
        if (cancelled) return;
        console.warn('QR camera start (primary) failed, trying fallback:', firstErr);
        safeCleanup(html5QrCode);
        html5QrCode = createScanner(readerId);
        scannerRef.current = html5QrCode;
        try {
          await startWith({ facingMode: 'user' });
        } catch (secondErr) {
          if (!cancelled) {
            console.error('QR scanner start failed:', secondErr);
            toast.error(
              'Camera could not start. Allow camera access, or try another browser.'
            );
          }
          safeCleanup(html5QrCode);
          scannerRef.current = null;
          return;
        }
      }

      if (cancelled) {
        safeCleanup(html5QrCode);
        scannerRef.current = null;
      }
    };

    run();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      safeCleanup(s);
    };
  }, [active, readerId]);

  return (
    <div
      id={readerId}
      className="w-full min-h-[240px] min-w-[200px] rounded-2xl overflow-hidden bg-slate-900"
      style={{ width: '100%' }}
    />
  );
};

export default VisitQrScanner;
