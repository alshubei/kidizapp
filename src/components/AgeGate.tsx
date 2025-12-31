import React, { useState } from 'react';

interface AgeGateProps {
  onAgeSelected: (age: number) => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onAgeSelected }) => {
  const [selectedAge, setSelectedAge] = useState<number | null>(null);

  const ages: number[] = [3, 4, 5, 6, 7, 8, 9, 10];

  const handleAgeSelect = (age: number) => {
    setSelectedAge(age);
  };

  const handleConfirm = () => {
    if (selectedAge !== null) {
      onAgeSelected(selectedAge);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm">
      <div className="bg-card rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <span className="text-5xl mb-4 block">👨‍👩‍👧‍👦</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Altersauswahl
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Bitte wähle das Alter deines Kindes aus, um das Spiel anzupassen.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {ages.map((age) => (
            <button
              key={age}
              onClick={() => handleAgeSelect(age)}
              className={`py-4 px-2 rounded-xl font-bold text-lg transition-all ${
                selectedAge === age
                  ? 'bg-btn-green text-white shadow-fun-sm scale-105'
                  : 'bg-muted text-foreground hover:bg-muted/80 hover:scale-105'
              }`}
            >
              {age}
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-xs text-muted-foreground">
            Das Spiel wird automatisch an das gewählte Alter angepasst.
          </p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedAge === null}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-fun-sm transition-all ${
            selectedAge !== null
              ? 'bg-btn-green text-white btn-bounce'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {selectedAge !== null ? '🎮 Spiel starten' : 'Bitte Alter wählen'}
        </button>
      </div>
    </div>
  );
};

