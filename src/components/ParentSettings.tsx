import React, { useRef, useState } from 'react';

interface ParentSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  customImages: {
    correct: string | null;
    wrong: string | null;
  };
  onImageChange: (type: 'correct' | 'wrong', image: string | null) => void;
  currentAge: number | null;
  onAgeChange: (age: number) => void;
}

export const ParentSettings: React.FC<ParentSettingsProps> = ({
  isOpen,
  onClose,
  customImages,
  onImageChange,
  currentAge,
  onAgeChange,
}) => {
  const correctInputRef = useRef<HTMLInputElement>(null);
  const wrongInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ correct: string | null; wrong: string | null }>(customImages);
  const [selectedAge, setSelectedAge] = useState<number | null>(currentAge);
  
  const ages: number[] = [3, 4, 5, 6, 7, 8, 9, 10];

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
    if (selectedAge !== null) {
      onAgeChange(selectedAge);
    }
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
          Hier kannst du das Alter deines Kindes ändern und eigene Bilder für das Feedback hochladen.
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
