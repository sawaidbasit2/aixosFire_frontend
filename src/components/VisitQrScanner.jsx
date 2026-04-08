import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

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
    const html5QrCode = new Html5Qrcode(readerId);
    scannerRef.current = html5QrCode;

    const config = { fps: 8, qrbox: { width: 220, height: 220 } };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onDecodedRef.current?.(decodedText);
        },
        () => {}
      )
      .then(() => {
        if (cancelled) {
          safeCleanup(html5QrCode);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('QR scanner start failed:', err);
        }
        safeCleanup(html5QrCode);
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      safeCleanup(s);
    };
  }, [active, readerId]);

  return <div id={readerId} className="w-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-900" />;
};

export default VisitQrScanner;
