import fs from 'fs'
import http from 'http'
import request from 'request'

import ProcessImage from './processor'

const port = 8085

const typeExts = {
	'image/gif': 'gif',
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/jpg': 'jpg',
}

/*
const downloadImage = ({ uri, fileName, callback, errorCallback }) => {
	request.head(uri, (err, res, body) => {
	    const contentType = res.headers['content-type']
	    const contentLength = res.headers['content-length']
	    if(Object.keys(typeExts).indexOf(contentType) < 0) {
	    	errorCallback('Unsupported filetype')
	    }else{
	    	const newFileName = `${fileName}.${typeExts[contentType]}`
	    	request(uri).pipe(fs.createWriteStream(newFileName)).on('close', () => {
	    		callback({
	    			fileName: newFileName,
	    			contentType,
	    			contentLength,
	    		})
	    	})
	    }
	})
}
*/

const getImageBuffer = ({uri, callback, errorCallback}) => {
	request.head(uri, (err, res, body) => {
	    const contentType = res.headers['content-type']
	    const contentLength = res.headers['content-length']
	    if(Object.keys(typeExts).indexOf(contentType) < 0) {
	    	errorCallback('Unsupported filetype')
	    }else{
			request.defaults({encoding: null})
			request.get(uri, (error, response, body) => {
				if(error || response.statusCode < 200 || response.statusCode >= 300) {
					errorCallback('could not fetch image')
				}else{
					const buffer = Buffer.from(body)
					console.log('!!!CHECK!!!', Buffer.isBuffer(buffer))
					callback({
						buffer,
		    			contentType,
		    			contentLength,
					})
				}
			})
		}
	})
}


const requestHandler = (request, response) => {
	if(request.method == 'POST') {
     	let queryData = ''
		request.on('data', function(data) {
            queryData += data
            if(queryData.length > 1e6) {
                queryData = ''
                response.writeHead(413, {'Content-Type': 'text/plain'}).end()
                request.connection.destroy()
            }
        })

        request.on('end', function() {
        	try {
            	const postData = JSON.parse(queryData)
        		console.log('postData:', postData)

            	if(postData.url) {
            		/*
            		downloadImage({
            			uri: postData.url,
            			callback: data => {
            				console.log(data)
				            response.writeHead(200, "OK", {'Content-Type': 'text/plain'})
				            response.end()
				        },
				        errorCallback: message => {
				        	throw message
				        }
            		})
            		*/
            		getImageBuffer({
            			uri: postData.url,
            			callback: ({buffer, contentType, contentLength}) => {
            				const processor = new ProcessImage()
            				processor.processImage({
            					buffer,
            					contentType,
            					contentLength,
            					extension: typeExts[contentType],
            					instructions: postData.instructions || [],
            					errorCallback: error => console.log('Error processing image', error),
            					callback: () => console.log('OK.'),
            				})

            				// console.log(data)
				            response.writeHead(200, "OK", {'Content-Type': 'text/plain'})
				            response.end()
				        },
				        errorCallback: message => {
				        	throw message
				        }
            		})
            	}else{
            		throw 'no url'
            	}

	        } catch(err) {
	        	response.writeHead(400, {'Content-Type': 'text/plain'})
        		response.end()
	        }

        })
	}else{
		response.writeHead(405, {'Content-Type': 'text/plain'})
        response.end()
	}
}

const server = http.createServer(requestHandler)

server.listen(port, err => {
	if(err) {
		console.log('error:', err)
	}else{
		console.log(`server is listening on ${port}`)
	}
})