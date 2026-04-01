import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, Undo2 } from 'lucide-react';

const CameraCapture = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `captured_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setCapturedImage({
            file,
            preview: URL.createObjectURL(blob)
          });
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage.file);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 sm:p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[85vh]">
        
        {/* Header */}
        <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Camera size={20} />
            {capturedImage ? 'Preview Photo' : 'Take Photo'}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>
        </div>

        {/* Viewport */}
        <div className="flex-1 relative flex items-center justify-center bg-black min-h-[300px]">
          {!capturedImage ? (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-contain"
              />
              {error && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                  <div className="bg-red-500/20 text-red-500 p-4 rounded-2xl backdrop-blur-md border border-red-500/50">
                    <p className="font-bold">{error}</p>
                    <button 
                      onClick={startCamera}
                      className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl font-bold text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <img 
              src={capturedImage.preview} 
              alt="Captured" 
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Controls */}
        <div className="p-8 bg-slate-900 border-t border-white/5">
          {!capturedImage ? (
            <div className="flex items-center justify-around">
              <button 
                onClick={toggleCamera}
                className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all active:scale-95"
                title="Switch Camera"
              >
                <RefreshCw size={24} />
              </button>
              
              <button 
                onClick={capturePhoto}
                disabled={!stream || error}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-glow active:scale-90 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <div className="w-16 h-16 border-4 border-slate-900 rounded-full" />
              </button>
              
              <div className="w-14" /> {/* Spacer */}
            </div>
          ) : (
            <div className="flex gap-4">
              <button 
                onClick={handleRetake}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Undo2 size={20} />
                Retake
              </button>
              <button 
                onClick={handleUsePhoto}
                className="flex-1 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 transition-all active:scale-95"
              >
                <Check size={20} />
                Use Photo
              </button>
            </div>
          )}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
