/**
 * Bundled application entry (Vite prototype).
 * Imports the compiled Tailwind stylesheet and the existing application
 * scripts in the exact order the pages used to load them with classic
 * <script defer> tags. Every file is an IIFE that attaches its API to
 * window.*, which is why they work unchanged as ES module imports, and
 * why the inline onclick handlers in the HTML keep working.
 */
import './styles.css';
import '../js/utils.js';
import '../js/speech.js';
import '../js/dictionary.js';
import '../js/spelling-builder.js';
import '../js/kid-playground.js';
import '../js/teen-studio.js';
import '../js/app.js';
