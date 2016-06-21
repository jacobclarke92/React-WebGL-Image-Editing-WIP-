import fs from 'fs'
import path from 'path'

import async from 'async'
import sizeOf from 'image-size'
import getPixels from 'get-pixels'
import savePixels from 'save-pixels'
import GL from 'gl'

import Program from '../app/editor/Program'
import Texture from '../app/editor/Texture'
import FramebufferTexture from '../app/editor/FramebufferTexture'
import Shaders from '../app/editor/shaders'

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
const defaultProgram = new Program('default', gl, Shaders.default.vertex, Shaders.default.fragment, Shaders.default.update);

console.log(gl.drawingBufferHeight, gl.drawingBufferWidth);
const EXT_resize = gl.getExtension('STACKGL_resize_drawingbuffer');
function resize(_width, _height) {
	width = _width;
	height = _height;
	EXT_resize.resize(width, height);
	console.log(gl.drawingBufferHeight, gl.drawingBufferWidth);
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

function resizeViewport() {
	gl.viewport(0, 0, width, height);
}

function resizePrograms() {
	if(defaultProgram) defaultProgram.resize(width, height);
	for(let program of programs) {
		program.resize(width, height);
	}
}

function renderEditSteps() {
	console.log('OMG do some rendering');
}

if('editSteps' in args) {
	editSteps = JSON.parse(args.editSteps);
	editStepKeys = editSteps.map(editStep => editStep.key);
}

if('input' in args) {
	const imagePath = path.resolve(args.input);
	async.parallel([
		callback => sizeOf(imagePath, (err, dimensions) => {
			if(err) return callback(err);
			resizeViewport(dimensions.width, dimensions.height);
			callback();
		}),
		callback => getPixels(imagePath, (err, pixels) => {
			if(err) return callback(err);
			console.log('Got pixels');
			imagePixels = pixels;
			callback();
		}),
	], err => {
		if(err) console.log('Error', err);
		console.log('Done');
		imageTexture.loadFromBytes(imagePixels, width, height);

		buildPrograms();
		resizePrograms();
		renderEditSteps();
	})
}