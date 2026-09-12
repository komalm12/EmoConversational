/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F8F4EF',
        ink: '#1F1D1A',
        muted: '#6E6660',
        blush: '#F0DFD2',
        peach: '#E0A97A',
        sage: '#B5C7AD',
        sky: '#C7DBF0',
      },
      boxShadow: {
        panel: '0 20px 45px rgba(31, 29, 26, 0.08)',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

