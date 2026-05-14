/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Bảng màu pastel ấm — Soft Nostalgic Academia
      colors: {
        cream: {
          50:  '#fefdf9',
          100: '#fdf8ef',
          200: '#faf0d7',
          300: '#f5e2b3',
          400: '#edcc84',
          500: '#e3b455',
        },
        rose: {
          soft: '#fce7f3',
          warm: '#fbcfe8',
          deep: '#ec4899',
        },
        sage: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
        },
        sky: {
          pastel: '#e0f2fe',
          soft:   '#bae6fd',
        },
        lavender: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
        },
        paper: '#fefce8',
        ink:   '#3d2c1e',
      },
      // Font chữ đặc trưng
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Nunito"', 'sans-serif'],
        hand:    ['"Caveat"', 'cursive'],
      },
      // Shadow ấm như tờ giấy
      boxShadow: {
        paper:   '2px 4px 20px rgba(61,44,30,0.12), 0 1px 4px rgba(61,44,30,0.08)',
        'paper-hover': '6px 12px 32px rgba(61,44,30,0.18), 0 2px 8px rgba(61,44,30,0.12)',
        card:    '0 4px 24px rgba(236,72,153,0.08), 0 1px 6px rgba(61,44,30,0.06)',
        float:   '0 8px 32px rgba(61,44,30,0.16)',
      },
      // Animation timing
      transitionTimingFunction: {
        bounce: 'cubic-bezier(0.34,1.56,0.64,1)',
        soft:   'cubic-bezier(0.25,0.46,0.45,0.94)',
      },
      keyframes: {
        'float-up': {
          '0%':   { opacity: 1, transform: 'translateY(0) scale(1)' },
          '100%': { opacity: 0, transform: 'translateY(-80px) scale(1.5)' },
        },
        'petal-fall': {
          '0%':   { transform: 'translateY(-10vh) rotate(0deg)', opacity: 0.9 },
          '100%': { transform: 'translateY(105vh) rotate(720deg)', opacity: 0 },
        },
        'fade-in-up': {
          '0%':   { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%':      { transform: 'scale(1.3)' },
          '50%':      { transform: 'scale(1.1)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'float-up':   'float-up 0.8s ease-out forwards',
        'petal-fall': 'petal-fall linear forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        heartbeat:    'heartbeat 0.4s ease-in-out',
        shimmer:      'shimmer 2s linear infinite',
        'spin-slow':  'spin-slow 3s linear infinite',
      },
    },
  },
  plugins: [],
}
