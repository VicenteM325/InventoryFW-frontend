/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

// La escala blue-gray se lee de variables CSS (definidas en css/tailwind.css) para que el
// modo oscuro la reasigne sin tocar cada clase, incluidas las de los componentes de Material Tailwind.
const blueGray = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((tone) => [
    tone,
    `rgb(var(--blue-gray-${tone}) / <alpha-value>)`,
  ])
);

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: { "blue-gray": blueGray },
    },
  },
  plugins: [],
});
