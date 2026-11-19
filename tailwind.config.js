/** @type {import('tailwindcss').Config} */
// Design system: U&I palette and poster style (from uandi.org.in). Full-width yellow, red, teal and
// near-black blocks, pink accents, near-black text, wide heavy capital headings (Archivo, like U&I's Druk).
// Change colours here, never as one-off hex values in the HTML.
module.exports = {
  content: ["./*.html", "./js/**/*.js", "./scripts/render.mjs"], // render.mjs writes the story cards
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
        red: "#cb0100",       // U&I red: logo, small labels, chips (white text on top)
        crimson: "#e5024a",   // U&I volunteer-page crimson (uandi.org.in/volunteer): home hero, Donate sections.
                              // On it: white text (4.7:1), black only at 24px+ (4.4:1), sun-yellow only at 24px+ (3.9:1)
        sun: "#f9ed32",       // U&I volunteer-page yellow: big headline words and pill buttons on crimson (black text on top)
        yellow: "#ffda1b",    // U&I yellow: main buttons (ink text on top)
        teal: "#0cc0df",      // U&I teal (uandi.org.in/volunteer): section background, ink text on top
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["Archivo", "Plus Jakarta Sans", "Arial Black", "Impact", "sans-serif"], // Jakarta draws ₹, which Archivo lacks
        hand: ["Londrina Solid", "Archivo", "Impact", "sans-serif"], // U&I volunteer-page style capitals
      },
    },
  },
  plugins: [],
};
