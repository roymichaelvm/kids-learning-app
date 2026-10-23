/**
 * Lumina Learning Hub — Speech Synthesis Engine
 * Provides crystal-clear native speech pronunciation for Malayalam, Hindi, Spanish, and English.
 */
(function (window) {
  'use strict';

  function speakNativeAudio(text, langCode, fallbackPhonetic) {
    if (!('speechSynthesis' in window)) return Promise.resolve();
    try {
      window.speechSynthesis.cancel();
      const cleanText = String(text || '').trim();
      if (!cleanText) return Promise.resolve();

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

      // Return a promise that resolves when this utterance finishes (or
      // errors), so callers can wait for the speech before moving on —
      // e.g. Spelling Bee must not load the next word mid-sentence.
      // A watchdog guarantees the promise settles even if the browser
      // never fires an end event for a cancelled utterance.
      return new Promise(resolve => {
        let settled = false;
        const done = () => { if (!settled) { settled = true; resolve(); } };
        utterance.onend = done;
        utterance.onerror = done;
        setTimeout(done, 12000);
        window.speechSynthesis.speak(utterance);
      });
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      return Promise.resolve();
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
