import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Kamera-Zugriff wurde verweigert oder ist nicht verfügbar.');
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    onCapture(dataUrl);
  };

  const handleCancel = () => {
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4">
      <div className="bg-card rounded-3xl p-6 max-w-2xl w-full">
        <h3 className="text-xl font-bold mb-4 text-center">📷 Kamera</h3>
        
        {error ? (
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-muted rounded-lg font-bold hover:bg-muted/80"
            >
              Schließen
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-4 rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-all"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCapture}
                className="flex-1 py-3 px-4 rounded-xl bg-btn-green text-white font-bold shadow-fun-sm btn-bounce"
              >
                📷 Foto aufnehmen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

