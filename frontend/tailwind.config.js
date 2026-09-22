/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        jev: {
          bg: "#08090E",
          surface: "#0D0F18",
          card: "#121622",
          hover: "#1A2030",
          border: "#20283C",
          "border-bright": "#33415F",
          cyan: "#00F0FF",
          purple: "#A855F7",
          pink: "#FF007A",
          green: "#00FF88",
          amber: "#FFB800",
          red: "#FF3366",
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 240, 255, 0.45)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.45)',
        'glow-pink': '0 0 25px -5px rgba(255, 0, 122, 0.45)',
        'glow-green': '0 0 25px -5px rgba(0, 255, 136, 0.45)',
        'glow-red': '0 0 25px -5px rgba(255, 51, 102, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
