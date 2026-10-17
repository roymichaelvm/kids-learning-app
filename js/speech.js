/**
 * Lumina Learning Hub — Speech Synthesis Engine
 * Provides crystal-clear native speech pronunciation for Malayalam, Hindi, Spanish, and English.
 */
(function (window) {
  'use strict';

  function speakNativeAudio(text, langCode) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = String(text || '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const code = langCode || 'en-US';
      utterance.lang = code;
      utterance.rate = 0.88;
      utterance.pitch = 1.0;

      // Select voice matching language if available
      const voices = window.speechSynthesis.getVoices() || [];
      const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(code.toLowerCase()));
      if (match) utterance.voice = match;

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  // Pre-load voices on browser ready
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

  window.speakNativeAudio = speakNativeAudio;
})(window);
