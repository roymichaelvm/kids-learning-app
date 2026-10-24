/** Tailwind configuration - moved here from the inline tailwind.config
 *  script that the Play CDN used. Content scanning includes the JS files
 *  because many class names live in template strings there. */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './parent.html', './js/**/*.js', './firebase-db.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        kids: ['"Fredoka"', 'cursive', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        /* Workbook redesign: cards read as paper sheets on a desk — a
           crisp hard offset shadow in ink tint instead of the soft grey
           SaaS blur. See the WORKBOOK REDESIGN block in index.html. */
        'bento': '0 1px 2px rgba(22, 35, 61, 0.05), 3px 3px 0 0 rgba(22, 35, 61, 0.08)',
        'kids-btn': '0 6px 0 0 #d97706',
        'kids-btn-active': '0 2px 0 0 #d97706',
        'kids-card': '0 8px 0 0 rgba(0,0,0,0.06)',
      }
    }
  },
  plugins: [],
}
