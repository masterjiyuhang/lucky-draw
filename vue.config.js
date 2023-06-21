const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
  },
  chainWebpack: config => {
    // 配置图片和字体文件的loader
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => {
        options.fallback.options.name = '[name].[ext]';
        options.limit = 100;
        return options;
      });

    config.module
      .rule('fonts')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => {
        options.fallback.options.name = '[name].[ext]';
        options.limit = 100;
        return options;
      });
  },
  configureWebpack: {
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html', // 自定义HTML模板路径
        inlineSource: '.(js|css)$' // 指定要内联的资源类型
      }),
      new HtmlWebpackInlineSourcePlugin()
    ]
  }
};
