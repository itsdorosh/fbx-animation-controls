const path = require('path');

module.exports = () => ({
	entry: './src/FBXAnimationControls.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'FBXAnimationControls.js',
		publicPath: '/dist/',
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},
	devServer: {
		public: 'localhost:4200',
		host: '0.0.0.0',
		contentBase: path.join(__dirname, '/'),
		inline: true,
		clientLogLevel: 'error',
		open: true,
		openPage: 'examples/basic/',
		compress: true,
		port: 4200,
	},
});
