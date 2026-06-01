/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: 'var(--bg-darkBg)', // Zinc-950 in dark, slate-50 in light
        darkCard: 'var(--bg-darkCard)', // Charcoal in dark, white in light
        glassBorder: 'var(--border-glass)',
        glassText: 'var(--text-glassMuted)',
        accentGold: '#f59e0b', // Amber-500
        accentBlue: '#3b82f6', // Blue-500
        accentGreen: '#10b981', // Emerald-500
        accentRed: '#ef4444', // Red-500
        accentPurple: '#8b5cf6', // Purple-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        premium: 'var(--shadow-premium)',
        glow: 'var(--shadow-glow)',
      },
    },
  },
  plugins: [],
};
