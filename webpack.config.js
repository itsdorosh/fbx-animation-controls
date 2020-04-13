const path = require('path');

module.exports = () => ({
	entry: './src/main.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'bundle.js',
		publicPath: '/dist/',
	},
	mode: "development",
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: /(node_modules)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
						plugins: [
							'@babel/plugin-proposal-class-properties',
							'@babel/plugin-proposal-private-methods'
						],
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
