var path = require('path');
var webpack = require('webpack');

module.exports = {
	devtool: '#sourcemap',
	entry: {
		scripts: './app/index.js',
	},
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js',
		publicPath: 'dist/' //used for webpack-dev-server
	},
	plugins: [
		new webpack.NoErrorsPlugin(),
	],
	resolve: {
		root: [
			path.resolve('./app/')
		]
	},
	module: {
		loaders: [
			{
				test: /\.jsx?$/,
				loader: 'babel',
				query: {
					cacheDirectory: true,
					plugins: ['transform-decorators-legacy'],
					presets: ['es2015', 'stage-0', 'react']
				},
				exclude: /(node_modules)/,
				include: [path.join(__dirname, 'app')]
			},
			{
				test: /\.glsl$/,
				loader: 'webpack-glsl',
				include: [ path.join(__dirname, 'app') ],
			},
			{
				test: /\.json$/,
				loader: 'json',
				include: [path.join(__dirname, 'app')],
			},
		],
	}
};
