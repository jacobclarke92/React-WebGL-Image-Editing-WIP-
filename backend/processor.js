import fs from 'fs'
// import path from 'path'
import _find from 'lodash/find'

import OS from 'os'
import ndarray from 'ndarray'
// import sizeOf from 'image-size'
import getPixels from 'get-pixels'
import savePixels from 'save-pixels'
import GL from 'gl'

import Processor from '../app/editor/Processor'

const startTime = new Date().getTime();
const startMem = OS.freemem();
let lastTime = new Date().getTime();
console.log('Init memory\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');

const args = {};
process.argv.slice(2).forEach(arg => {
	const parts = arg.split('=');
	if(parts.length > 1) args[parts[0]] = parts[1];
	else args[arg] = null;
});


export default class ProcessImage {
	constructor() {

		this.width = 10;
		this.height = 10;
		this.instructions = [];
		this.gl = GL(10, 10);
		this.ImageProcessor = new Processor(this.gl, this.instructions);
		this.ImageProcessor.debug = true;
	}

	processImage({buffer, instructions, contentType, contentLength, extension, callback, errorCallback}) {
		this.ImageProcessor.setInstructions(instructions);
		console.log(buffer, contentType)
		getPixels(buffer, contentType, (err, pixels) => {
			if(err) {
				console.log('Error reading file', err);
				errorCallback(err);
				return;
			}
			console.log('Got pixels');
			console.log('----------\nAfter pixels read\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
			lastTime = new Date().getTime();

			this.width = pixels.shape[0];
			this.height = pixels.shape[1];

			const utilitySteps = _find(instructions, {name: 'utility'}, {}).steps || [];
			const rotateStep = _find(utilitySteps, {key: 'rotate'});
			const cropStep = _find(utilitySteps, {key: 'crop'});
			
			if(rotateStep && (rotateStep.value == 90 || rotateStep.value == 270)) {
				this.width = pixels.shape[1];
				this.height = pixels.shape[0];
			}

			if(cropStep && cropStep.value) {
				this.width = Math.floor(this.width * cropStep.value.width);
				this.height = Math.floor(this.height * cropStep.value.height);
			}


			console.log('---------\nResizing viewport', width, height);

			this.ImageProcessor.setCanvasSize(this.width, this.height);
			this.ImageProcessor.imageLoaded(pixels.data, pixels.shape[0], pixels.shape[1]);

			console.log('----------\nAfter image sent to webgl\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
			lastTime = new Date().getTime();

			this.ImageProcessor.buildPrograms();
			this.ImageProcessor.resizeAll();

			console.log('----------\nAfter programs init\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
			lastTime = new Date().getTime();

			this.ImageProcessor.renderInstructions();
			console.log('----------\nAfter render\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
			lastTime = new Date().getTime();

			this.saveImage({contentType, extension, callback, callbackError}); 
		});
	}

	saveImage({contentType, extension, callback, callbackError}) {
		const pixels = new Uint8Array(this.width * this.height * 4);
		this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);

		const savePath = `tmp_processed.${extension}`
		const saveFile = fs.createWriteStream(savePath, {flags: 'w'});

		const data = ndarray(pixels, [this.width, this.height, 4], [4, 4 * this.width, 1], 0);

		console.log('----------\nAfter image fetch\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		const stream = savePixels(data, extension, (extension == 'jpg' || extension == 'jpeg') ? {quality: 80} : null).pipe(saveFile);
		stream.on('finish', () => {
			const endTime = new Date().getTime();
			console.log('----------\nAfter save\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
			lastTime = new Date().getTime();
			console.log('TOOK: '+(endTime-startTime)+'ms');



			callback(savePath)
		});
	}
}