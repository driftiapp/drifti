module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'cssnano': process.env.NODE_ENV === 'production' ? {
      preset: ['default', {
        discardComments: {
          removeAll: true,
          removeAllButFirst: true,
        },
        normalizeWhitespace: true,
      }],
    } : false,
  },
}; 