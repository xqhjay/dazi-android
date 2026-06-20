/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#60A5FA'
        },
        secondary: {
          DEFAULT: '#0EA5E9',
          dark: '#38BDF8'
        },
        accent: {
          DEFAULT: '#F59E0B',
          dark: '#FBBF24'
        },
        surface: {
          DEFAULT: '#F8FAFC',
          dark: '#1E293B'
        },
        bg: {
          DEFAULT: '#FFFFFF',
          dark: '#0F172A'
        }
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)'
      }
    }
  },
  plugins: []
}
