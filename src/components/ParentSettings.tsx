import React, { useRef, useState } from 'react';

interface ParentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  customImages: {
    correct: string | null;
    wrong: string | null;
  };
  onImageChange: (type: 'correct' | 'wrong', image: string | null) => void;
}

export const ParentSettings: React.FC<ParentSettingsProps> = ({
  isOpen,
  onClose,
  customImages,
  onImageChange,
}) => {
  const correctInputRef = useRef<HTMLInputElement>(null);
  const wrongInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ correct: string | null; wrong: string | null }>(customImages);

  if (!isOpen) return null;

  const handleFileChange = (type: 'correct' | 'wrong', file: File | null) => {
    if (!file) {
      setPreview(prev => ({ ...prev, [type]: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(prev => ({ ...prev, [type]: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onImageChange('correct', preview.correct);
    onImageChange('wrong', preview.wrong);
    onClose();
  };

  const handleReset = (type: 'correct' | 'wrong') => {
    setPreview(prev => ({ ...prev, [type]: null }));
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
          Hier kannst du eigene Bilder für das Feedback hochladen. 
          Die Bilder erscheinen, wenn das Kind richtig oder falsch antwortet.
        </p>

        {/* Correct Image Upload */}
        <div className="mb-6">
          <label className="block font-bold text-success mb-2">
            ✅ Bild für "Richtig"
          </label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-success/50 flex items-center justify-center overflow-hidden bg-success/10">
              {preview.correct ? (
                <img src={preview.correct} alt="Richtig Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">😊</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={correctInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('correct', e.target.files?.[0] || null)}
                className="text-sm w-full"
              />
              {preview.correct && (
                <button
                  onClick={() => handleReset('correct')}
                  className="text-xs text-destructive hover:underline"
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wrong Image Upload */}
        <div className="mb-8">
          <label className="block font-bold text-destructive mb-2">
            ❌ Bild für "Falsch"
          </label>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-destructive/50 flex items-center justify-center overflow-hidden bg-destructive/10">
              {preview.wrong ? (
                <img src={preview.wrong} alt="Falsch Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">😢</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={wrongInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('wrong', e.target.files?.[0] || null)}
                className="text-sm w-full"
              />
              {preview.wrong && (
                <button
                  onClick={() => handleReset('wrong')}
                  className="text-xs text-destructive hover:underline"
                >
                  Zurücksetzen
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
    </div>
  );
};
