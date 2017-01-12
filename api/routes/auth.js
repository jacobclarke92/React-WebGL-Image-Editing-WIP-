import jwt from 'jwt-simple'
import mysql from 'mysql'

import secret from '../config/secret'
import mysqlConfig from '../config/mysql-config'

export function login(req, res) {

	const username = req.body.username || '';
	const password = req.body.password || '';

	if(username == '' || password == '') {
		res.status(401);
		res.json({
			'status': 401,
			'message': 'Invalid credentials',
		});
		return;
	}

	validate({username, password}, (err, dbUserObj) => {

		if(err) {
			res.status(err.status);
			res.json(err);
			return;
		}

		res.json(genToken(dbUserObj));

	});

}

export function validate({username, password}, callback) {

	const connection = mysql.createConnection(mysqlConfig);
	connection.connect(err => {
		if(err) {
			callback({status: 500, message: 'Database error'});
		}
		connection.query({sql: `SELECT * FROM \`users\` WHERE \`username\` = "${username}" AND \`password\` = "${password}"`}, (error, results, fields) => {
			if(error) {
				connection.destroy();
				callback({status: 500, message: 'Database error'});
				return;
			}
			if(!results.length) {
				connection.destroy();
				callback({status: 401, message: 'Invalid credentials'});
				return;
			}

			connection.destroy();
			callback(false, results[0]);
		});
	});
}

export function validateUser(username, callback) {

	const connection = mysql.createConnection(mysqlConfig);
	connection.connect(err => {
		if(err) {
			callback({status: 500, message: 'Database error'});
		}
		connection.query({sql: `SELECT * FROM \`users\` WHERE \`username\` = "${username}"`}, (error, results, fields) => {
			if(error) {
				connection.destroy();
				callback({status: 500, message: 'Database error'});
				return;
			}
			if(!results.length) {
				connection.destroy();
				callback({status: 401, message: 'User doesn\'t exist'});
				return;
			}

			connection.destroy();
			callback(false, results[0]);
		});
	});
}

function genToken(user) {
	const expires = expiresInDays(7);
	const token = jwt.encode({exp: expires}, secret());

	return { token, expires, user };
}

function expiresInDays(days) {
	const dateObj = new Date();
	return dateObj.setDate(dateObj.getDate() + days);
}