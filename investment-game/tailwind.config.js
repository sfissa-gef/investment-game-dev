/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'token-gold': '#F5A623',
        'action-green': '#4CAF50',
        'lush-green': '#7CB342',
        'info-blue': '#1565C0',
        'earth-brown': '#8D6E63',
        'rain-blue': '#90CAF9',
        'drought-tan': '#D7CCC8',
        'drought-deep': '#A1887F',
        'canvas': '#FFFBF2',
        'ink': '#1B1B1B',
      },
      fontSize: {
        'token-xl': ['48px', { lineHeight: '1', fontWeight: '700' }],
        'token-lg': ['32px', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'body': ['18px', { lineHeight: '1.4' }],
        'badge': ['14px', { lineHeight: '1', fontWeight: '700' }],
      },
      minHeight: { 'touch': '56px' },
      minWidth: { 'touch': '56px' },
    },
  },
  plugins: [],
};
