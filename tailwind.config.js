/** @type {import('tailwindcss').Config} */
// Design system: U&I palette and poster style (from uandi.org.in). Full-width yellow, red, teal and
// near-black blocks, pink accents, near-black text, wide heavy capital headings (Archivo, like U&I's Druk).
// Change colours here, never as one-off hex values in the HTML.
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#fcfcfc",        // U&I off-white page background (not pure white)
        surface: "#ebebeb",   // light grey for alternating sections
        line: "#e8e8e8",      // borders
        ink: "#201e1e",       // main text (near-black)
        blue: "#0937fd",      // U&I blue: keyboard focus outlines only (visible on yellow, teal and white)
        pink: "#e843a1",      // U&I pink (uandi.my.canva.site/fellowship-2025): accent text, numbers, boxes
        orange: "#ff914d",    // U&I orange (same fellowship page): section background, ink text on top
        red: "#cb0100",       // U&I red: logo, highlights, bold fills (white text on top)
        yellow: "#ffda1b",    // U&I yellow: main buttons (ink text on top)
        teal: "#0cc0df",      // U&I teal (uandi.org.in/volunteer): section background, ink text on top
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Archivo", "Arial Black", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};
