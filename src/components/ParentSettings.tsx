import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Check,
  ImagePlus,
  Camera,
  Mic,
  Square,
  Play,
  Trash2,
  Save,
} from 'lucide-react';
import { CameraCapture } from '@/components/CameraCapture';
import { recordAudio, blobToDataURL, playAudio } from '@/lib/audioUtils';
import { saveCustomImage, saveCustomAudio, loadCustomImage, loadCustomAudio, compressImage } from '@/lib/assetStorage';

interface ParentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  customImages: {
    correct: string | null;
    wrong: string | null;
  };
  onImageChange: (type: 'correct' | 'wrong', image: string | null) => void;
  customAudio: {
    correct: string | null;
    wrong: string | null;
  };
  onAudioChange: (type: 'correct' | 'wrong', audio: string | null) => void;
  currentAge: number | null;
  onAgeChange: (age: number) => void;
}

type FeedbackKind = 'correct' | 'wrong';

export const ParentSettings: React.FC<ParentSettingsProps> = ({
  isOpen,
  onClose,
  customImages,
  onImageChange,
  customAudio,
  onAudioChange,
  currentAge,
  onAgeChange,
}) => {
  const correctInputRef = useRef<HTMLInputElement>(null);
  const wrongInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ correct: string | null; wrong: string | null }>(customImages);
  const [audioPreview, setAudioPreview] = useState<{ correct: string | null; wrong: string | null }>(customAudio);
  const [selectedAge, setSelectedAge] = useState<number | null>(currentAge);
  const [isRecording, setIsRecording] = useState<{ correct: boolean; wrong: boolean }>({ correct: false, wrong: false });
  const [showCamera, setShowCamera] = useState<{ correct: boolean; wrong: boolean }>({ correct: false, wrong: false });
  const [cameraType, setCameraType] = useState<FeedbackKind | null>(null);
  const recorderRef = useRef<{ start: () => void; stop: () => Promise<Blob | null> } | null>(null);

  const ages: number[] = [3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    if (isOpen) {
      setPreview({
        correct: loadCustomImage('correct') || customImages.correct,
        wrong: loadCustomImage('wrong') || customImages.wrong,
      });
      setAudioPreview({
        correct: loadCustomAudio('correct') || customAudio.correct,
        wrong: loadCustomAudio('wrong') || customAudio.wrong,
      });
      setSelectedAge(currentAge);
    }
  }, [isOpen, customImages, customAudio, currentAge]);

  if (!isOpen) return null;

  const handleFileChange = async (type: FeedbackKind, file: File | null) => {
    if (!file) {
      setPreview(prev => ({ ...prev, [type]: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      try {
        const compressed = await compressImage(result);
        setPreview(prev => ({ ...prev, [type]: compressed }));
      } catch (error) {
        console.error('Error compressing image:', error);
        setPreview(prev => ({ ...prev, [type]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (type: FeedbackKind) => {
    setCameraType(type);
    setShowCamera(prev => ({ ...prev, [type]: true }));
  };

  const handleCameraCaptureComplete = async (type: FeedbackKind, image: string) => {
    try {
      const compressed = await compressImage(image);
      setPreview(prev => ({ ...prev, [type]: compressed }));
    } catch (error) {
      console.error('Error compressing camera image:', error);
      setPreview(prev => ({ ...prev, [type]: image }));
    }
    setShowCamera(prev => ({ ...prev, [type]: false }));
    setCameraType(null);
  };

  const handleCameraCancel = (type: FeedbackKind) => {
    setShowCamera(prev => ({ ...prev, [type]: false }));
    setCameraType(null);
  };

  const handleStartRecording = async (type: FeedbackKind) => {
    try {
      const recorder = await recordAudio();
      recorderRef.current = recorder;
      setIsRecording(prev => ({ ...prev, [type]: true }));
      recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Mikrofon-Zugriff wurde verweigert oder ist nicht verfügbar.');
    }
  };

  const handleStopRecording = async (type: FeedbackKind) => {
    if (!recorderRef.current) return;

    try {
      const blob = await recorderRef.current.stop();
      if (blob) {
        const dataURL = await blobToDataURL(blob);
        setAudioPreview(prev => ({ ...prev, [type]: dataURL }));
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    } finally {
      setIsRecording(prev => ({ ...prev, [type]: false }));
      recorderRef.current = null;
    }
  };

  const handlePlayAudio = async (type: FeedbackKind) => {
    const audio = audioPreview[type];
    if (!audio) return;
    try {
      await playAudio(audio);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSave = () => {
    saveCustomImage('correct', preview.correct);
    saveCustomImage('wrong', preview.wrong);
    saveCustomAudio('correct', audioPreview.correct);
    saveCustomAudio('wrong', audioPreview.wrong);

    onImageChange('correct', preview.correct);
    onImageChange('wrong', preview.wrong);
    onAudioChange('correct', audioPreview.correct);
    onAudioChange('wrong', audioPreview.wrong);
    if (selectedAge !== null) {
      onAgeChange(selectedAge);
    }
    onClose();
  };

  const handleReset = (type: FeedbackKind) => {
    setPreview(prev => ({ ...prev, [type]: null }));
    setAudioPreview(prev => ({ ...prev, [type]: null }));
    saveCustomImage(type, null);
    saveCustomAudio(type, null);
    if (type === 'correct' && correctInputRef.current) correctInputRef.current.value = '';
    if (type === 'wrong' && wrongInputRef.current) wrongInputRef.current.value = '';
  };

  const iconBtn =
    'inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-[#E8E0F5] text-[#2D3561] shadow-sm active:scale-95 transition-transform disabled:opacity-40';

  const renderFeedbackCard = (type: FeedbackKind) => {
    const isCorrect = type === 'correct';
    const accent = isCorrect ? '#10B981' : '#EF4444';
    const accentBg = isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
    const inputRef = isCorrect ? correctInputRef : wrongInputRef;
    const hasImage = Boolean(preview[type]);
    const hasAudio = Boolean(audioPreview[type]);
    const recording = isRecording[type];

    return (
      <div
        className="rounded-2xl p-2.5 flex flex-col gap-2 min-w-0"
        style={{ background: accentBg, border: `1.5px solid ${accent}33` }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white"
            style={{ background: accent }}
          >
            {isCorrect ? <Check className="w-3 h-3" strokeWidth={3} /> : <X className="w-3 h-3" strokeWidth={3} />}
          </span>
          <span className="text-xs font-bold text-[#2D3561]">
            {isCorrect ? 'Richtig' : 'Falsch'}
          </span>
        </div>

        <div
          className="w-full aspect-square max-h-[88px] rounded-xl flex items-center justify-center overflow-hidden bg-white/70 border border-dashed"
          style={{ borderColor: `${accent}55` }}
        >
          {hasImage ? (
            <img src={preview[type]!} alt="" className="w-full h-full object-contain" />
          ) : (
            <ImagePlus className="w-6 h-6 opacity-35" style={{ color: accent }} />
          )}
        </div>

        <div className="grid grid-cols-4 gap-1">
          <label className={`${iconBtn} cursor-pointer`} title="Bild wählen" aria-label="Bild wählen">
            <ImagePlus className="w-4 h-4" strokeWidth={2.25} />
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => handleCameraCapture(type)}
            className={iconBtn}
            title="Kamera"
            aria-label="Kamera"
          >
            <Camera className="w-4 h-4" strokeWidth={2.25} />
          </button>
          {!recording ? (
            <button
              type="button"
              onClick={() => handleStartRecording(type)}
              className={iconBtn}
              title="Audio aufnehmen"
              aria-label="Audio aufnehmen"
            >
              <Mic className="w-4 h-4" strokeWidth={2.25} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStopRecording(type)}
              className={`${iconBtn} !bg-red-500 !text-white !border-red-500 animate-pulse`}
              title="Stoppen"
              aria-label="Aufnahme stoppen"
            >
              <Square className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
            </button>
          )}
          <button
            type="button"
            onClick={() => (hasAudio ? handlePlayAudio(type) : undefined)}
            disabled={!hasAudio}
            className={iconBtn}
            title="Audio abspielen"
            aria-label="Audio abspielen"
          >
            <Play className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>

        {(hasImage || hasAudio) && (
          <button
            type="button"
            onClick={() => handleReset(type)}
            className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#999] py-0.5"
          >
            <Trash2 className="w-3 h-3" />
            Zurücksetzen
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2D3561]/35 backdrop-blur-[2px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white w-full max-w-[400px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[min(92dvh,640px)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="parent-settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
          <h2 id="parent-settings-title" className="text-lg font-bold text-[#2D3561]">
            Einstellungen
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F7F4FB] flex items-center justify-center text-[#2D3561] active:scale-95"
            aria-label="Schließen"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Body — compact, usually no scroll on phones */}
        <div className="px-4 pb-2 flex flex-col gap-3.5 overflow-y-auto min-h-0">
          <div>
            <div className="text-[11px] font-semibold tracking-wide text-[#999] mb-1.5 uppercase">
              Alter
            </div>
            <div className="grid grid-cols-8 gap-1">
              {ages.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setSelectedAge(age)}
                  className={`h-9 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                    selectedAge === age
                      ? 'bg-[#7C3AED] text-white shadow-sm'
                      : 'bg-[#F7F4FB] text-[#2D3561]'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-wide text-[#999] mb-1.5 uppercase">
              Feedback (Bild & Audio)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {renderFeedbackCard('correct')}
              {renderFeedbackCard('wrong')}
            </div>
            <p className="text-[10px] text-[#AAA] mt-1.5 leading-snug">
              Lokal gespeichert · funktioniert offline
            </p>
          </div>
        </div>

        {/* Sticky actions */}
        <div
          className="flex gap-2 px-4 pt-2 pb-3.5 shrink-0 border-t border-[#F0ECF7]"
          style={{ paddingBottom: 'max(0.875rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-[#E8E0F5] text-[#2D3561] font-bold text-sm active:scale-[0.98]"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 h-11 rounded-xl bg-[#10B981] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Save className="w-4 h-4" strokeWidth={2.25} />
            Speichern
          </button>
        </div>
      </div>

      {showCamera.correct && cameraType === 'correct' && (
        <CameraCapture
          onCapture={(image) => handleCameraCaptureComplete('correct', image)}
          onCancel={() => handleCameraCancel('correct')}
        />
      )}
      {showCamera.wrong && cameraType === 'wrong' && (
        <CameraCapture
          onCapture={(image) => handleCameraCaptureComplete('wrong', image)}
          onCancel={() => handleCameraCancel('wrong')}
        />
      )}
    </div>
  );
};
