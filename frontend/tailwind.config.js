/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          900: "#0d1117",
          800: "#161b22",
          700: "#1c2333",
          600: "#252d3a",
          500: "#30394a",
        },
        accent: {
          blue: "#58a6ff",
          green: "#3fb950",
          purple: "#bc8cff",
          orange: "#d29922",
          pink: "#f778ba",
          red: "#f85149",
        },
      },
    },
  },
  plugins: [],
};
