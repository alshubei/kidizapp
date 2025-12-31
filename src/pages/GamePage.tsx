import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAgeFromStorage } from '@/lib/ageUtils';
import { AgeRange } from '@/types/game';
import ShapeGame from './ShapeGame';
import MathGame from './MathGame';

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const [childAge, setChildAge] = React.useState<AgeRange | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const storedAge = getAgeFromStorage();
    if (storedAge) {
      setChildAge(storedAge);
      setIsLoading(false);
    } else {
      // No age set, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-warm flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-muted-foreground">Lade Spiel...</p>
        </div>
      </div>
    );
  }

  if (!childAge) {
    return null;
  }

  // Route to appropriate game based on age
  if (childAge >= 7) {
    return <MathGame />;
  } else {
    return <ShapeGame />;
  }
};

export default GamePage;

