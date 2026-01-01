import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveAgeToStorage } from '@/lib/ageUtils';
import { AgeRange } from '@/types/game';
import { PlayerNameDialog } from '@/components/PlayerNameDialog';
import { getPlayerName, savePlayerName, clearGameProgress } from '@/lib/gameProgressStorage';

const AgeRoute: React.FC = () => {
  const { age } = useParams<{ age: string }>();
  const navigate = useNavigate();
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);

  useEffect(() => {
    if (age) {
      const ageNum = parseInt(age, 10);
      if (ageNum >= 3 && ageNum <= 10) {
        const range = ageNum as AgeRange;
        setAgeRange(range);
        saveAgeToStorage(range);
        
        // Check if player name exists, if not show dialog
        const playerName = getPlayerName();
        if (!playerName) {
          setShowNameDialog(true);
        } else {
          // Redirect to game after setting age
          navigate('/game', { replace: true });
        }
      } else {
        // Invalid age, redirect to home
        navigate('/', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [age, navigate]);

  const handleNameConfirmed = (name: string) => {
    // Starting a new game - clear any existing progress and save new name
    clearGameProgress();
    savePlayerName(name);
    setShowNameDialog(false);
    // Redirect to game
    navigate('/game', { replace: true });
  };

  const handleNameDialogCancel = () => {
    // Still proceed to game even if they cancel (they can set name later)
    navigate('/game', { replace: true });
  };

  if (showNameDialog) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
        <PlayerNameDialog
          isOpen={showNameDialog}
          onConfirm={handleNameConfirmed}
          onCancel={handleNameDialogCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-muted-foreground">Alter wird gesetzt...</p>
      </div>
    </div>
  );
};

export default AgeRoute;

