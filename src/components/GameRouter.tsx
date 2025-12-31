import React, { useState, useEffect } from 'react';
import { AgeGate } from '@/components/AgeGate';
import { getAgeFromStorage, saveAgeToStorage } from '@/lib/ageUtils';
import { AgeRange } from '@/types/game';
import MathGame from '@/pages/MathGame';
import ShapeGame from '@/pages/ShapeGame';

export const GameRouter: React.FC = () => {
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [childAge, setChildAge] = useState<AgeRange | null>(null);

  // Load age from storage on mount
  useEffect(() => {
    const storedAge = getAgeFromStorage();
    if (storedAge) {
      setChildAge(storedAge);
    } else {
      setShowAgeGate(true);
    }
  }, []);

  const handleAgeSelected = (age: number) => {
    const ageRange = age as AgeRange;
    setChildAge(ageRange);
    saveAgeToStorage(ageRange);
    setShowAgeGate(false);
  };

  // Show age gate if no age is set
  if (!childAge || showAgeGate) {
    return <AgeGate onAgeSelected={handleAgeSelected} />;
  }

  // Route to appropriate game based on age
  if (childAge >= 6) {
    // Ages 6-10: Math game
    return <MathGame />;
  } else {
    // Ages 3-5: Shape game
    return <ShapeGame />;
  }
};

