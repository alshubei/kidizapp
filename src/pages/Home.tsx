import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgeGate } from '@/components/AgeGate';
import { getAgeFromStorage } from '@/lib/ageUtils';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showAgeGate, setShowAgeGate] = React.useState(false);
  const [hasAge, setHasAge] = React.useState(false);

  useEffect(() => {
    const storedAge = getAgeFromStorage();
    if (storedAge) {
      setHasAge(true);
      // Auto-redirect to game if age is already set
      navigate('/game', { replace: true });
    } else {
      setShowAgeGate(true);
    }
  }, [navigate]);

  const handleAgeSelected = (age: number) => {
    setShowAgeGate(false);
    // Navigate to age route which will set age and redirect to game
    navigate(`/age/${age}`);
  };

  if (!showAgeGate && !hasAge) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-warm flex items-center justify-center p-4">
      {showAgeGate && <AgeGate onAgeSelected={handleAgeSelected} />}
    </div>
  );
};

export default Home;

