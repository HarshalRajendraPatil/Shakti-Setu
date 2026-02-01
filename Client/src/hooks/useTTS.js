import { useState } from 'react';

export const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);

  const speak = (text, langCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); 
    setSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const targetLang = langCode === 'hi' ? 'hi-IN' : 'en-US';
    
    const preferredVoice = voices.find(v => v.lang === targetLang && v.name.includes('Google'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.lang = targetLang;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  return { speak, stop, speaking };
};
