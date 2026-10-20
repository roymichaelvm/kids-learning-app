/**
 * Lumina Learning Hub — Speech Synthesis Engine
 * Provides crystal-clear native speech pronunciation for Malayalam, Hindi, Spanish, and English.
 */
(function (window) {
  'use strict';

  function speakNativeAudio(text, langCode, fallbackPhonetic) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = String(text || '').trim();
      if (!cleanText) return;

      const code = langCode || 'en-US';
      const voices = window.speechSynthesis.getVoices() || [];
      const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(code.toLowerCase()));

      let utteranceText = cleanText;
      let utteranceLang = code;
      let selectedVoice = match || null;

      // If no native voice matching langCode was found and cleanText has non-Latin characters
      // (such as Malayalam or Hindi script), fall back to romanized phonetic text so browser voice can pronounce it!
      const hasNonLatin = /[^\u0000-\u007F]/.test(cleanText);
      if (!match && hasNonLatin && fallbackPhonetic) {
        utteranceText = String(fallbackPhonetic).trim();
        utteranceLang = 'en-US';
        selectedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) || null;
      }

      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.lang = utteranceLang;
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
      if (selectedVoice) utterance.voice = selectedVoice;

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
