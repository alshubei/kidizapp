import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveAgeToStorage } from '@/lib/ageUtils';
import { AgeRange } from '@/types/game';

const AgeRoute: React.FC = () => {
  const { age } = useParams<{ age: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (age) {
      const ageNum = parseInt(age, 10);
      if (ageNum >= 3 && ageNum <= 10) {
        const ageRange = ageNum as AgeRange;
        saveAgeToStorage(ageRange);
        // Redirect to game after setting age
        navigate('/game', { replace: true });
      } else {
        // Invalid age, redirect to home
        navigate('/', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [age, navigate]);

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

