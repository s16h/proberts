/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Custom color palette
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Darker shades for dark mode
        dark: {
          900: '#0A0A0A', // Almost black
          800: '#121212', // Very dark
          700: '#1A1A1A', // Slightly lighter
          600: '#222222',
          500: '#2A2A2A',
          400: '#333333',
        },
      },
      animation: {
        'typewriter': 'typing 3s steps(40, end), blink-caret .75s step-end infinite',
      },
      keyframes: {
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: 'currentColor' },
        },
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
}