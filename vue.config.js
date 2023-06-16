module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/lucky-draw' : '/',
  devServer: {
    proxy: {
      '^/base-api/': {
        target: 'https://api-dev2.jctrans.com/',
        changeOrigin: true,
        pathRewrite: {
          '^/base-api/': '/'
        }
      }
    }
  }
};
