import React, { useRef, useState, useEffect } from 'react';
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
  const [cameraType, setCameraType] = useState<'correct' | 'wrong' | null>(null);
  const recorderRef = useRef<{ start: () => void; stop: () => Promise<Blob | null> } | null>(null);
  
  const ages: number[] = [3, 4, 5, 6, 7, 8, 9, 10];

  // Load saved assets from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      // Load from localStorage (persisted assets)
      const savedCorrectImage = loadCustomImage('correct');
      const savedWrongImage = loadCustomImage('wrong');
      const savedCorrectAudio = loadCustomAudio('correct');
      const savedWrongAudio = loadCustomAudio('wrong');

      // Use saved assets if available, otherwise use props
      setPreview({
        correct: savedCorrectImage || customImages.correct,
        wrong: savedWrongImage || customImages.wrong,
      });
      setAudioPreview({
        correct: savedCorrectAudio || customAudio.correct,
        wrong: savedWrongAudio || customAudio.wrong,
      });
      setSelectedAge(currentAge);
    }
  }, [isOpen, customImages, customAudio, currentAge]);

  if (!isOpen) return null;

  const handleFileChange = async (type: 'correct' | 'wrong', file: File | null) => {
    if (!file) {
      setPreview(prev => ({ ...prev, [type]: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      // Compress image to save storage space
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

  const handleCameraCapture = (type: 'correct' | 'wrong') => {
    setCameraType(type);
    setShowCamera(prev => ({ ...prev, [type]: true }));
  };

  const handleCameraCaptureComplete = async (type: 'correct' | 'wrong', image: string) => {
    try {
      // Compress camera image to save storage space
      const compressed = await compressImage(image);
      setPreview(prev => ({ ...prev, [type]: compressed }));
    } catch (error) {
      console.error('Error compressing camera image:', error);
      setPreview(prev => ({ ...prev, [type]: image }));
    }
    setShowCamera(prev => ({ ...prev, [type]: false }));
    setCameraType(null);
  };

  const handleCameraCancel = (type: 'correct' | 'wrong') => {
    setShowCamera(prev => ({ ...prev, [type]: false }));
    setCameraType(null);
  };

  const handleStartRecording = async (type: 'correct' | 'wrong') => {
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

  const handleStopRecording = async (type: 'correct' | 'wrong') => {
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

  const handlePlayAudio = async (type: 'correct' | 'wrong') => {
    const audio = audioPreview[type];
    if (audio) {
      try {
        await playAudio(audio);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const handleSave = () => {
    // Save to localStorage for offline use
    saveCustomImage('correct', preview.correct);
    saveCustomImage('wrong', preview.wrong);
    saveCustomAudio('correct', audioPreview.correct);
    saveCustomAudio('wrong', audioPreview.wrong);
    
    // Update parent component state
    onImageChange('correct', preview.correct);
    onImageChange('wrong', preview.wrong);
    onAudioChange('correct', audioPreview.correct);
    onAudioChange('wrong', audioPreview.wrong);
    if (selectedAge !== null) {
      onAgeChange(selectedAge);
    }
    onClose();
  };

  const handleReset = (type: 'correct' | 'wrong') => {
    setPreview(prev => ({ ...prev, [type]: null }));
    setAudioPreview(prev => ({ ...prev, [type]: null }));
    // Also clear from localStorage
    saveCustomImage(type, null);
    saveCustomAudio(type, null);
    if (type === 'correct' && correctInputRef.current) {
      correctInputRef.current.value = '';
    }
    if (type === 'wrong' && wrongInputRef.current) {
      wrongInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <div className="bg-card rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            ⚙️ Eltern-Einstellungen
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        <p className="text-muted-foreground mb-6 text-sm">
          Hier kannst du das Alter deines Kindes ändern, eigene Bilder und Audio-Aufnahmen für das Feedback hochladen.
          <span className="block mt-2 text-xs">💾 Alle Einstellungen werden lokal gespeichert und funktionieren offline.</span>
        </p>

        {/* Age Selection */}
        <div className="mb-6">
          <label className="block font-bold text-foreground mb-3">
            👶 Alter des Kindes (3-10 Jahre)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ages.map((age) => (
              <button
                key={age}
                onClick={() => setSelectedAge(age)}
                className={`py-3 px-2 rounded-xl font-bold text-base transition-all ${
                  selectedAge === age
                    ? 'bg-btn-green text-white shadow-fun-sm scale-105'
                    : 'bg-muted text-foreground hover:bg-muted/80 hover:scale-105'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
          {selectedAge && (
            <p className="text-xs text-muted-foreground mt-2">
              Aktuelles Alter: {selectedAge} Jahre
            </p>
          )}
        </div>

        {/* Correct Image Upload */}
        <div className="mb-6">
          <label className="block font-bold text-success mb-2">
            ✅ Bild für "Richtig"
          </label>
          <div className="space-y-3">
            {/* Large preview */}
            <div className="w-full h-48 rounded-xl border-2 border-dashed border-success/50 flex items-center justify-center overflow-hidden bg-success/10">
              {preview.correct ? (
                <img 
                  src={preview.correct} 
                  alt="Richtig Preview" 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <div className="text-center">
                  <span className="text-6xl block mb-2">😊</span>
                  <span className="text-sm text-muted-foreground">Kein Bild ausgewählt</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <label className="flex-1 px-4 py-2 bg-btn-blue text-white rounded-lg text-sm font-bold hover:bg-btn-blue/80 transition-all cursor-pointer text-center">
                  📁 Bild auswählen
                  <input
                    ref={correctInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('correct', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => handleCameraCapture('correct')}
                  className="px-4 py-2 bg-btn-blue text-white rounded-lg text-sm font-bold hover:bg-btn-blue/80 transition-all"
                  title="Kamera"
                >
                  📷 Kamera
                </button>
              </div>
              {preview.correct && (
                <button
                  onClick={() => handleReset('correct')}
                  className="w-full text-sm text-destructive hover:underline py-1"
                >
                  🗑️ Bild entfernen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wrong Image Upload */}
        <div className="mb-6">
          <label className="block font-bold text-destructive mb-2">
            ❌ Bild für "Falsch"
          </label>
          <div className="space-y-3">
            {/* Large preview */}
            <div className="w-full h-48 rounded-xl border-2 border-dashed border-destructive/50 flex items-center justify-center overflow-hidden bg-destructive/10">
              {preview.wrong ? (
                <img 
                  src={preview.wrong} 
                  alt="Falsch Preview" 
                  className="w-full h-full object-contain" 
                />
              ) : (
                <div className="text-center">
                  <span className="text-6xl block mb-2">😢</span>
                  <span className="text-sm text-muted-foreground">Kein Bild ausgewählt</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <label className="flex-1 px-4 py-2 bg-btn-blue text-white rounded-lg text-sm font-bold hover:bg-btn-blue/80 transition-all cursor-pointer text-center">
                  📁 Bild auswählen
                  <input
                    ref={wrongInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('wrong', e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => handleCameraCapture('wrong')}
                  className="px-4 py-2 bg-btn-blue text-white rounded-lg text-sm font-bold hover:bg-btn-blue/80 transition-all"
                  title="Kamera"
                >
                  📷 Kamera
                </button>
              </div>
              {preview.wrong && (
                <button
                  onClick={() => handleReset('wrong')}
                  className="w-full text-sm text-destructive hover:underline py-1"
                >
                  🗑️ Bild entfernen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Correct Audio Recording */}
        <div className="mb-6">
          <label className="block font-bold text-success mb-2">
            🔊 Audio für "Richtig"
          </label>
          <div className="space-y-3">
            <div className="w-full h-24 rounded-xl border-2 border-dashed border-success/50 flex items-center justify-center bg-success/10">
              {audioPreview.correct ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio('correct')}
                    className="text-4xl hover:scale-110 transition-transform"
                    title="Abspielen"
                  >
                    ▶️
                  </button>
                  <span className="text-xs text-muted-foreground">Klicke zum Abspielen</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-4xl block mb-1">🔇</span>
                  <span className="text-sm text-muted-foreground">Keine Aufnahme</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {!isRecording.correct ? (
                <button
                  onClick={() => handleStartRecording('correct')}
                  className="w-full px-4 py-2 bg-success text-white rounded-lg text-sm font-bold hover:bg-success/80 transition-all"
                >
                  🎤 Aufnahme starten
                </button>
              ) : (
                <button
                  onClick={() => handleStopRecording('correct')}
                  className="w-full px-4 py-2 bg-destructive text-white rounded-lg text-sm font-bold hover:bg-destructive/80 transition-all animate-pulse"
                >
                  ⏹️ Aufnahme stoppen
                </button>
              )}
              {audioPreview.correct && (
                <button
                  onClick={() => {
                    setAudioPreview(prev => ({ ...prev, correct: null }));
                    saveCustomAudio('correct', null);
                  }}
                  className="w-full text-sm text-destructive hover:underline py-1"
                >
                  🗑️ Audio entfernen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wrong Audio Recording */}
        <div className="mb-8">
          <label className="block font-bold text-destructive mb-2">
            🔊 Audio für "Falsch"
          </label>
          <div className="space-y-3">
            <div className="w-full h-24 rounded-xl border-2 border-dashed border-destructive/50 flex items-center justify-center bg-destructive/10">
              {audioPreview.wrong ? (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => handlePlayAudio('wrong')}
                    className="text-4xl hover:scale-110 transition-transform"
                    title="Abspielen"
                  >
                    ▶️
                  </button>
                  <span className="text-xs text-muted-foreground">Klicke zum Abspielen</span>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-4xl block mb-1">🔇</span>
                  <span className="text-sm text-muted-foreground">Keine Aufnahme</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {!isRecording.wrong ? (
                <button
                  onClick={() => handleStartRecording('wrong')}
                  className="w-full px-4 py-2 bg-destructive text-white rounded-lg text-sm font-bold hover:bg-destructive/80 transition-all"
                >
                  🎤 Aufnahme starten
                </button>
              ) : (
                <button
                  onClick={() => handleStopRecording('wrong')}
                  className="w-full px-4 py-2 bg-destructive text-white rounded-lg text-sm font-bold hover:bg-destructive/80 transition-all animate-pulse"
                >
                  ⏹️ Aufnahme stoppen
                </button>
              )}
              {audioPreview.wrong && (
                <button
                  onClick={() => {
                    setAudioPreview(prev => ({ ...prev, wrong: null }));
                    saveCustomAudio('wrong', null);
                  }}
                  className="w-full text-sm text-destructive hover:underline py-1"
                >
                  🗑️ Audio entfernen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-border text-foreground font-bold transition-all hover:bg-muted"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-btn-green text-white font-bold shadow-fun-sm btn-bounce"
          >
            💾 Speichern
          </button>
        </div>
      </div>

      {/* Camera Capture Modal */}
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
