import { useCallback, useState } from 'react';
import { playAudio } from '@/lib/audioUtils';

const correctPhrases = [
  "Super gemacht!",
  "Klasse! Genau richtig!",
  "Ich bin stolz auf dich!",
  "Jaaa, das ist richtig!",
  "Wunderbar! Du bist ein Mathe-Star!",
  "Fantastisch!",
];

const wrongPhrases = [
  "Nochmal versuchen!",
  "Nicht schlimm, du schaffst das!",
  "Versuch es nochmal!",
  "Ohh, das war knapp. Probier es nochmal!",
  "Du kannst das! Versuch es noch einmal!",
];

interface CustomAudio {
  correct: string | null;
  wrong: string | null;
}

export const useSpeech = (customAudio?: CustomAudio) => {
  const [isMuted, setIsMuted] = useState(false);

  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    // Try to find a German voice
    const voices = window.speechSynthesis.getVoices();
    const germanVoice = voices.find(voice => voice.lang.startsWith('de'));
    if (germanVoice) {
      utterance.voice = germanVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const speakCorrect = useCallback(async () => {
    if (isMuted) return;
    
    // Play custom audio if available
    if (customAudio?.correct) {
      try {
        await playAudio(customAudio.correct);
        return;
      } catch (error) {
        console.error('Error playing custom audio:', error);
        // Fall back to text-to-speech
      }
    }
    
    // Fall back to text-to-speech
    const phrase = correctPhrases[Math.floor(Math.random() * correctPhrases.length)];
    speak(phrase);
  }, [speak, isMuted, customAudio]);

  const speakWrong = useCallback(async () => {
    if (isMuted) return;
    
    // Play custom audio if available
    if (customAudio?.wrong) {
      try {
        await playAudio(customAudio.wrong);
        return;
      } catch (error) {
        console.error('Error playing custom audio:', error);
        // Fall back to text-to-speech
      }
    }
    
    // Fall back to text-to-speech
    const phrase = wrongPhrases[Math.floor(Math.random() * wrongPhrases.length)];
    speak(phrase);
  }, [speak, isMuted, customAudio]);

  const speakQuestion = useCallback((text: string) => {
    if (isMuted) return;
    speak(text);
  }, [speak, isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    speakCorrect,
    speakWrong,
    speakQuestion,
    speak,
  };
};
