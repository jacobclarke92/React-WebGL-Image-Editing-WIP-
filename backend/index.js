import fs from 'fs'
import path from 'path'

import OS from 'os'
import ndarray from 'ndarray'
import sizeOf from 'image-size'
import getPixels from 'get-pixels'
import savePixels from 'save-pixels'
import GL from 'gl'

import Program from '../app/editor/Program'
import Texture from '../app/editor/Texture'
import Framebuffer from '../app/editor/Framebuffer'
import Shaders from '../app/editor/shaders'
import { getProgramInfo } from '../app/editor/utils/webglUtils'

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
// console.log(args);


let width = 10;
let height = 10;
let imagePixels = null;
let programs = [];
let framebuffers = [];
let editSteps = [];
let editStepKeys = [];
let currentFramebufferIndex = -1;

const gl = GL(10, 10);
const imageTexture = new Texture(gl);
const defaultProgram = new Program('default_node', gl, Shaders.default_node.vertex, Shaders.default_node.fragment, Shaders.default_node.update);

const EXT_resize = gl.getExtension('STACKGL_resize_drawingbuffer');

function getTempFramebuffer(index) {
	if(!framebuffers[index]) {
		framebuffers[index] = new Framebuffer(gl).use();
		framebuffers[index].attachEmptyTexture(width, height);
	}
	return framebuffers[index];
}

function resetPrograms() {
	for(let program of programs) {
		program.destroy();
	}
	programs = [];
}

function buildPrograms() {
	resetPrograms();
	editStepKeys.map(filterLabel => {
		addProgram(filterLabel);
	});
}

function addProgram(label) {
	const shader = Shaders[label];
	if(!shader) {
		console.warn('No shader found for:', label);
		return;
	}
	const program = new Program(label, gl, shader.vertex, shader.fragment, shader.update);
	programs.push(program);
	return program;
}

function resetFramebuffers() {
	currentFramebufferIndex = -1;
	for(let framebuffer of framebuffers) {
		if(framebuffer.texture) framebuffer.texture.destroy();
		framebuffer.destroy();
	}
	framebuffers = [];
}

function resizeViewport(_width, _height) {
	width = _width;
	height = _height;
	EXT_resize.resize(width, height);
	gl.viewport(0, 0, width, height);
	console.log(gl.drawingBufferHeight, gl.drawingBufferWidth);
}

function resizePrograms() {
	if(defaultProgram) defaultProgram.resize(width, height);
	for(let program of programs) {
		program.resize(width, height);
	}
}

function renderEditSteps() {
	console.log('OMG do some rendering');
	// const steps = [{key: 'default'}, ...editSteps];
	const steps = [{key: 'default_node'}, ...editSteps];
	// const steps = [{key: 'default'}];

	for(let count = 0; count < steps.length; count ++) {
		const step = steps[count];
		const program = count === 0 ? defaultProgram : programs[count-1];

		// switch to program
		program.use();

		// run the shader's update function -- modifies uniforms
		// program must be in use before calling update otherwise current program's uniforms get modified
		program.update(step);

		// determine source texture - original image texture if first pass or a framebuffer texture
		const sourceTexture = count === 0 ? imageTexture : getTempFramebuffer(currentFramebufferIndex).texture;

		// determine render target, set to null if last one because null = canvas
		let target = null;
		if(count < steps.length-1) {
			currentFramebufferIndex = (currentFramebufferIndex+1)%2;
			target = getTempFramebuffer(currentFramebufferIndex).id;
		}

		// pre-render calcs idk
		program.willRender();

		// use current source texture and framebuffer target
		sourceTexture.use();
		gl.bindFramebuffer(gl.FRAMEBUFFER, target);

		// post-render calcs idk
		program.didRender();

		// draw that shit
		program.draw();

		// console.log(getProgramInfo(gl, program.program).uniforms);
	}
}

function saveImage() {
	const pixels = new Uint8Array(width*height*4);
	gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	const extIndex = args.input.lastIndexOf('.');
	const savePath = ('output' in args) ? args.output : args.input.slice(0, extIndex) + '_processed.' + args.input.slice(extIndex+1);
	const ext = savePath.slice(savePath.lastIndexOf('.')+1);
	const saveFile = fs.createWriteStream(savePath, {flags: 'w'});
	// console.log(pixels);
	const data = ndarray(pixels, [width, height, 4], [4, 4*width, 1], 0);
	console.log('After image fetch\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
	lastTime = new Date().getTime();

	const stream = savePixels(data, ext, (ext == 'jpg' || ext == 'jpeg') ? {quality: 80} : null).pipe(saveFile);
	stream.on('finish', () => {
		const endTime = new Date().getTime();
		console.log('After save\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();
		console.log('TOOK: '+(endTime-startTime)+'ms');
	});
}

if('editSteps' in args) {
	editSteps = JSON.parse(args.editSteps);
	editStepKeys = editSteps.map(editStep => editStep.key);
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
		console.log('After pixels read\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		resizeViewport(pixels.shape[0], pixels.shape[1]);
		imageTexture.loadFromBytes(pixels.data, width, height);
		console.log('After image sent to webgl\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		buildPrograms();
		resizePrograms();
		console.log('After programs init\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		renderEditSteps();
		console.log('After render\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		saveImage(); 
	});
}