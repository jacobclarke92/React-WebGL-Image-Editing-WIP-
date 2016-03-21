var path = require('path');
var webpack = require('webpack');

var babelLoaderSettings = JSON.stringify({
	cacheDirectory: true,
	presets: ['es2015', 'stage-0', 'react']
});

module.exports = {
	devtool: '#sourcemap',
	entry: {
		scripts: [
			'webpack-dev-server/client?http://0.0.0.0:3000', // WebpackDevServer host and port
			'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
			'./app/index.js'
		],
	},
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name].js',
		publicPath: '/dist/' //used for webpack-dev-server
	},
	plugins: [
		new webpack.NoErrorsPlugin(),
		new webpack.HotModuleReplacementPlugin(),
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
				loaders: ['react-hot','babel?'+babelLoaderSettings],
				include: [path.join(__dirname, 'app')]
			},
			{
				test: /\.glsl$/,
				loader: 'webpack-glsl',
				include: [path.join(__dirname, 'app')],
			},
			{
				test: /\.json$/,
				loader: 'json',
				include: [path.join(__dirname, 'app')],
			},
			{
				test: /\.css$/,
				loader: 'style!css',
				include: [path.join(__dirname, 'app')],
			},
		],
	}
};
