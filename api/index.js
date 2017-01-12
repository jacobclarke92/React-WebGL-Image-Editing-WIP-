// based on this http://thejackalofjavascript.com/architecting-a-restful-node-js-app/

import path from 'path'
import express from 'express'
import logger from 'morgan'
import bodyParser from 'body-parser'

import validateRequest from './middlewares/validate-request'
import routes from './routes'

const app = express();

app.use(logger('dev'));
app.use(bodyParser.json());

app.all('/*', (req, res, next) => {
	// CORS headers
	res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');

	// Set custom headers for CORS
	res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');

	if (req.method == 'OPTIONS') {
		res.status(200).end();
	} else {
		next();
	}
});

// Auth Middleware - This will check if the token is valid
// Only the requests that start with /api/v1/* will be checked for the token.
// Any URL's that do not follow the below pattern should be avoided unless you 
// are sure that authentication is not needed
app.all('/api/v1/*', [validateRequest]);


app.use('/', routes);

// If no route is matched by now, it must be a 404
app.use((req, res, next) => {
	res.status(404);
	res.json({status: 404, message: 'Resource not found'});
	next();
});
 
// Start the server
app.set('port', process.env.PORT || 3000);
 
const server = app.listen(app.get('port'), () => {
	console.log('Express server listening on port ' + server.address().port);
});