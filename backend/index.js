import fs from 'fs'
import path from 'path'
import _find from 'lodash/find'

import OS from 'os'
import ndarray from 'ndarray'
import sizeOf from 'image-size'
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


let width = 10;
let height = 10;
let rawInstructions = ('instructions' in args) ? JSON.parse(args.instructions) : [];

const gl = GL(10, 10);
const EXT_resize = gl.getExtension('STACKGL_resize_drawingbuffer');
const ImageProcessor = new Processor(gl, rawInstructions);
ImageProcessor.debug = true;


function saveImage() {
	const pixels = new Uint8Array(width*height*4);
	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	const extIndex = args.input.lastIndexOf('.');
	const savePath = ('output' in args) ? args.output : args.input.slice(0, extIndex) + '_processed.' + args.input.slice(extIndex+1);
	const ext = savePath.slice(savePath.lastIndexOf('.')+1);
	const saveFile = fs.createWriteStream(savePath, {flags: 'w'});
	// console.log(pixels);
	const data = ndarray(pixels, [width, height, 4], [4, 4*width, 1], 0);
	console.log('----------\nAfter image fetch\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
	lastTime = new Date().getTime();

	const stream = savePixels(data, ext, (ext == 'jpg' || ext == 'jpeg') ? {quality: 80} : null).pipe(saveFile);
	stream.on('finish', () => {
		const endTime = new Date().getTime();
		console.log('----------\nAfter save\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();
		console.log('TOOK: '+(endTime-startTime)+'ms');
	});
}

if(gl == null) {
	console.log('HeadlessGL context could not be initialised :(');
}else if('input' in args) {

	const imagePath = path.isAbsolute(args.input) ? args.input : path.resolve(__dirname + '/../' + args.input);
	console.log(imagePath)
	getPixels(imagePath, (err, pixels) => {
		if(err) {
			console.log('Error reading file', err);
			return;
		}
		console.log('Got pixels');
		console.log('----------\nAfter pixels read\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		width = pixels.shape[0];
		height = pixels.shape[1];

		const utilitySteps = _find(rawInstructions, {name: 'utility'}).steps || [];
		const rotateStep = _find(utilitySteps, {key: 'rotate'});
		const cropStep = _find(utilitySteps, {key: 'crop'});
		
		if(rotateStep && (rotateStep.value == 90 || rotateStep.value == 270)) {
			width = pixels.shape[1];
			height = pixels.shape[0];
		}

		if(cropStep && cropStep.value) {
			width = Math.floor(width * cropStep.value.width);
			height = Math.floor(height * cropStep.value.height);
		}


		console.log('---------\nResizing viewport', width, height);

		ImageProcessor.setCanvasSize(width, height);
		ImageProcessor.imageLoaded(pixels.data, pixels.shape[0], pixels.shape[1]);

		console.log('----------\nAfter image sent to webgl\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		ImageProcessor.buildPrograms();
		ImageProcessor.resizeAll();

		console.log('----------\nAfter programs init\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		ImageProcessor.renderInstructions();
		console.log('----------\nAfter render\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		saveImage(); 
	});
}