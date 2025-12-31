import { useCallback, useState } from 'react';

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

export const useSpeech = () => {
  const [isMuted, setIsMuted] = useState(true);

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

  const speakCorrect = useCallback(() => {
    const phrase = correctPhrases[Math.floor(Math.random() * correctPhrases.length)];
    speak(phrase);
  }, [speak]);

  const speakWrong = useCallback(() => {
    const phrase = wrongPhrases[Math.floor(Math.random() * wrongPhrases.length)];
    speak(phrase);
  }, [speak]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    speakCorrect,
    speakWrong,
    speak,
  };
};
