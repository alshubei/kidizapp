import { useCallback, useState, useEffect } from 'react';
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
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // Track user interaction to enable speech synthesis
  // Speech synthesis requires user interaction in most browsers
  useEffect(() => {
    if (typeof window === 'undefined' || hasUserInteracted) return;

    const enableSpeech = () => {
      setHasUserInteracted(true);
    };
    
    document.addEventListener('click', enableSpeech, { once: true });
    document.addEventListener('touchstart', enableSpeech, { once: true });
    document.addEventListener('keydown', enableSpeech, { once: true });

    return () => {
      document.removeEventListener('click', enableSpeech);
      document.removeEventListener('touchstart', enableSpeech);
      document.removeEventListener('keydown', enableSpeech);
    };
  }, [hasUserInteracted]);

  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) {
      console.log('Speech disabled:', { isMuted, hasSpeechSynthesis: 'speechSynthesis' in window });
      return;
    }

    if (!text || text.trim() === '') {
      console.warn('Empty text provided to speak');
      return;
    }

    // Check if user has interacted (required for speech synthesis in most browsers)
    // Note: We'll try to speak anyway - if it fails with 'not-allowed', we'll handle it in the error handler

    console.log('Speaking:', text, { isMuted, hasUserInteracted, hasSpeechSynthesis: 'speechSynthesis' in window });

    // Only cancel if speech is actually speaking or pending
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      console.log('Canceling existing speech');
      window.speechSynthesis.cancel();
      // Wait a bit for cancellation to complete
      setTimeout(() => {
        startSpeaking(text);
      }, 100);
    } else {
      startSpeaking(text);
    }

    function startSpeaking(textToSpeak: string) {
      // Get voices first
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length);
      
      // Try to find a German voice
      const germanVoice = voices.find(voice => voice.lang.startsWith('de'));
      const selectedVoice = germanVoice || null;
      
      if (selectedVoice) {
        console.log('Using German voice:', selectedVoice.name, selectedVoice.lang);
      } else {
        console.warn('No German voice found, using default voice');
      }
      
      // Create utterance with all properties set BEFORE speaking
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'de-DE';
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      
      // Set voice immediately if available
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Add error handlers
      utterance.onerror = (event) => {
        // Ignore 'canceled' errors as they're expected when canceling
        if (event.error === 'canceled') {
          return;
        }
        
        // Handle 'not-allowed' error - user interaction required
        if (event.error === 'not-allowed') {
          console.warn('Speech not allowed - requires user interaction. Click the replay button to enable.');
          return;
        }
        
        console.error('Speech synthesis error:', event.error, event);
      };

      utterance.onstart = () => {
        console.log('✅ Speech started successfully');
      };

      utterance.onend = () => {
        console.log('✅ Speech ended successfully');
      };

      utterance.onpause = () => {
        console.log('⚠️ Speech paused');
      };

      utterance.onresume = () => {
        console.log('▶️ Speech resumed');
      };
      
      // Check speech synthesis state before speaking
      console.log('Speech synthesis state before speak:', {
        speaking: window.speechSynthesis.speaking,
        pending: window.speechSynthesis.pending,
        paused: window.speechSynthesis.paused
      });
      
      // Speak with everything already configured
      try {
        console.log('Calling speechSynthesis.speak with:', {
          text: textToSpeak,
          lang: utterance.lang,
          voice: utterance.voice?.name || 'default',
          rate: utterance.rate,
          pitch: utterance.pitch,
          volume: utterance.volume,
          voiceURI: utterance.voice?.voiceURI || 'default'
        });
        
        // Ensure we're not in the middle of another utterance
        if (window.speechSynthesis.speaking) {
          console.log('Already speaking, canceling first');
          window.speechSynthesis.cancel();
          // Wait a moment for cancellation
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
            console.log('speak() called after cancel');
          }, 50);
        } else {
          window.speechSynthesis.speak(utterance);
          console.log('speak() called successfully');
        }
        
        // Check state immediately and after delay
        setTimeout(() => {
          const state = {
            speaking: window.speechSynthesis.speaking,
            pending: window.speechSynthesis.pending,
            paused: window.speechSynthesis.paused,
            hasUtterance: !!utterance
          };
          console.log('Speech state after 50ms:', state);
          
          // If not speaking and not pending, something went wrong
          if (!state.speaking && !state.pending) {
            console.warn('⚠️ Speech did not start - trying again without voice selection');
            // Try again without setting a specific voice
            const fallbackUtterance = new SpeechSynthesisUtterance(textToSpeak);
            fallbackUtterance.lang = 'de-DE';
            fallbackUtterance.rate = 0.9;
            fallbackUtterance.pitch = 1.1;
            fallbackUtterance.volume = 1.0;
            fallbackUtterance.onstart = () => console.log('✅ Fallback speech started');
            fallbackUtterance.onerror = (e) => console.error('Fallback error:', e.error);
            window.speechSynthesis.speak(fallbackUtterance);
          }
        }, 50);
        
        // Also check after longer delay
        setTimeout(() => {
          console.log('Speech state after 200ms:', {
            speaking: window.speechSynthesis.speaking,
            pending: window.speechSynthesis.pending,
            paused: window.speechSynthesis.paused
          });
        }, 200);
      } catch (error) {
        console.error('Error calling speak:', error);
      }
    }
  }, [isMuted, hasUserInteracted]);

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
    console.log('speakQuestion called:', { text, isMuted });
    if (isMuted) {
      console.log('Speech is muted, not speaking');
      return;
    }
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
