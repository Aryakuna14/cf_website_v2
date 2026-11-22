/** @type {import('tailwindcss').Config} */
// Design system: U&I palette and poster style (from uandi.org.in). Full-width yellow, red, teal and
// near-black blocks, pink accents, near-black text, wide heavy capital headings (Archivo, like U&I's Druk).
// Change colours here, never as one-off hex values in the HTML.
module.exports = {
  content: ["./*.html", "./js/**/*.js", "./scripts/render.mjs"], // render.mjs writes the story cards
  darkMode: "class",
  theme: {
    extend: {
      colors: { // U&I colours at 92% brightness (same shades, toned down; any darker and black headlines on crimson get hard to read). Page off-white at 97%.
        bg: "#efece5",        // soft warm off-white: page, menu bar, "Home /" strip and cards (pure white glared next to the bright colours)
        surface: "#ebebeb",   // light grey for alternating sections
        line: "#dfd9cf",      // borders (warm, to sit on the off-white)
        ink: "#201e1e",       // main text (near-black)
        blue: "#0937fd",      // U&I blue: keyboard focus outlines only (visible on yellow, teal and white)
        pink: "#d53e94",      // U&I pink (uandi.my.canva.site/fellowship-2025): accent text, numbers, boxes
        orange: "#eb8547",    // U&I orange (same fellowship page): section background, ink text on top
        red: "#bb0100",       // U&I red: logo, small labels, chips (white text on top)
        crimson: "#d30244",   // U&I volunteer-page crimson (uandi.org.in/volunteer): home hero, Donate sections.
                              // On it: white text (5.4:1), black only at 24px+ (3.05:1), sun-yellow only at 24px+ (3.7:1)
        sun: "#e5da2e",       // U&I volunteer-page yellow: big headline words and pill buttons on crimson (black text on top)
        yellow: "#ebc919",    // U&I yellow: main buttons (ink text on top)
        teal: "#0bb1cd",      // U&I teal (uandi.org.in/volunteer): section background, ink text on top
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
