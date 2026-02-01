import { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const useSpeechRecognition = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const { language } = useContext(AppContext);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognitionRef.current = recognition;
  }, [language, onResult]);

  const start = () => recognitionRef.current?.start();
  const stop = () => recognitionRef.current?.stop();

  return { isListening, start, stop };
};
