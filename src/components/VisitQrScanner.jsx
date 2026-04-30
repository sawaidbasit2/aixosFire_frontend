import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

const safeStop = async (scanner) => {
  if (!scanner) return;
  try {
    const state = scanner.getState();
    if (
      state === Html5QrcodeScannerState.SCANNING ||
      state === Html5QrcodeScannerState.PAUSED
    ) {
      await scanner.stop();
    }
  } catch {
    /* ignore */
  }
  try {
    scanner.clear();
  } catch {
    /* ignore */
  }
};

const waitForElement = (id, maxMs = 3000) =>
  new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const el = document.getElementById(id);
      if (el && el.clientWidth > 0) return resolve(true);
      if (Date.now() - start > maxMs) return resolve(false);
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });

/**
 * Inline QR code scanner using html5-qrcode.
 *
 * Props:
 *   readerId  – unique DOM id for the scanner container
 *   active    – mount/unmount the camera stream
 *   onDecoded – called with the raw decoded string on every successful frame
 */
const VisitQrScanner = ({ readerId, active, onDecoded }) => {
  const onDecodedRef = useRef(onDecoded);
  const scannerRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);

  useEffect(() => {
    if (!active || !readerId) return undefined;

    stoppedRef.current = false;
    let html5QrCode = null;

    const start = async () => {
      const found = await waitForElement(readerId);
      if (!found || stoppedRef.current) return;

      html5QrCode = new Html5Qrcode(readerId, { verbose: false });
      scannerRef.current = html5QrCode;

      // Prefer back/rear camera; fall back to any available camera
      let cameraId;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras?.length) {
          const back = cameras.find((c) =>
            /back|rear|environment|wide/i.test(c.label || '')
          );
          cameraId = (back ?? cameras[0]).id;
        }
      } catch {
        /* getCameras failed — will use facingMode below */
      }

      if (stoppedRef.current) return;

      const config = {
        fps: 10,
        // Fixed 250×250 box works reliably; dynamic sizing can confuse the decoder
        qrbox: { width: 250, height: 250 },
        // Allow mirror-image frames — essential for front cameras and some rear cameras
        disableFlip: false,
        // No experimentalFeatures: BarcodeDetector API is unreliable across mobile browsers
      };

      const onSuccess = (decodedText) => {
        if (stoppedRef.current) return;
        stoppedRef.current = true;
        // Stop the scanner immediately so it doesn't keep firing
        safeStop(html5QrCode).finally(() => {
          scannerRef.current = null;
        });
        onDecodedRef.current?.(decodedText);
      };

      const onError = () => {
        /* suppress per-frame "not found" errors */
      };

      try {
        // Try with a real camera id first (more reliable on mobile)
        if (cameraId) {
          await html5QrCode.start(cameraId, config, onSuccess, onError);
        } else {
          throw new Error('no cameraId');
        }
      } catch {
        if (stoppedRef.current) return;
        // Fallback: environment facing mode (works on most modern mobile browsers)
        try {
          await safeStop(html5QrCode);
          html5QrCode = new Html5Qrcode(readerId, { verbose: false });
          scannerRef.current = html5QrCode;
          await html5QrCode.start(
            { facingMode: { exact: 'environment' } },
            config,
            onSuccess,
            onError
          );
        } catch {
          if (stoppedRef.current) return;
          // Last resort: any available camera (usually front on laptops)
          try {
            await safeStop(html5QrCode);
            html5QrCode = new Html5Qrcode(readerId, { verbose: false });
            scannerRef.current = html5QrCode;
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              onSuccess,
              onError
            );
          } catch (err) {
            console.error('[VisitQrScanner] all camera attempts failed:', err);
            scannerRef.current = null;
          }
        }
      }
    };

    start();

    return () => {
      stoppedRef.current = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      safeStop(s);
    };
  }, [active, readerId]);

  return (
    <div
      id={readerId}
      className="w-full min-h-[260px] rounded-2xl overflow-hidden bg-slate-900"
    />
  );
};

export default VisitQrScanner;
