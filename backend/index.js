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


function combineGroupEditStepKeys(instructions) {
	return instructions.reduce((steps, group) => [...steps, ...(group.steps || [])], []).map(step => step.key);
}

let width = 10;
let height = 10;
let imagePixels = null;
let programs = {};
let framebuffers = [];
let rawInstructions = [];
let lastEditStepsKeys = [];
let currentFramebufferIndex = -1;
let editGroupFramebuffer = null;

const gl = GL(10, 10);
const imageTexture = new Texture(gl);

const defaultProgram = new Program('default_node', gl, Shaders.default_node.vertex, Shaders.default_node.fragment, Shaders.default_node.update);
const blendProgram = new Program('blendProgram', gl, Shaders.blend.vertex, Shaders.blend.fragment, Shaders.blend.update);

const EXT_resize = gl.getExtension('STACKGL_resize_drawingbuffer');

function getTempFramebuffer(index) {
	if(!framebuffers[index]) {
		framebuffers[index] = new Framebuffer(gl).use();
		framebuffers[index].attachEmptyTexture(width, height);
	}
	return framebuffers[index];
}

function buildPrograms() {
	resetPrograms();
	rawInstructions.filter(group => group.steps && group.steps.length > 0).forEach(group => {
		const groupName = group.name;
		if(!(groupName in programs)) programs[groupName] = [];
		group.steps.forEach(step => {
			programs[groupName].push(addProgram(step.key));
		});
	});
}

function addProgram(label) {
	if(!(label in Shaders)) {
		console.warn('No shader found for:', label);
		return;
	}
	const shader = Shaders[label];
	const program = new Program(label, gl, shader.vertex, shader.fragment, shader.update);
	// this.programs.push(program);
	return program;
}

function resetPrograms() {
	Object.keys(programs).forEach(groupKey => {
		for(let program of programs[groupKey]) {
			program.destroy();
		}
	});
	programs = {};
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
	if(blendProgram) blendProgram.resize(width, height);
	Object.keys(programs).forEach(groupKey => {
		for(let program of programs[groupKey]) {
			program.resize(width, height);
		}
	});
}

function resizeFramebuffers() {
	for(let i = 0; i < framebuffers.length; i ++) {
		framebuffers[i].resizeTexture(width, height);
	}
	editGroupFramebuffer.resizeTexture(width, height);
}

function renderEditSteps() {
	
	const instructions = [{name: 'preRender', steps: [{key: 'default'}]}, ...rawInstructions].filter(group => group.steps && group.steps.length > 0);

	let totalStepCount = -1;
	let lastProgram = null;

	// iterate over instruction groups
	for(let groupCount = 0; groupCount < instructions.length; groupCount ++) {
		const group = instructions[groupCount];
		const groupName = group.name;
		const steps = group.steps || [];

		// iterate over group edit steps
		for(let count = 0; count < steps.length; count ++) {
			const step = steps[count];
			totalStepCount ++;

			// select the correct program, if first, select the default injected shader from above
			const program = totalStepCount === 0 ? defaultProgram : programs[groupName][count];
			lastProgram = program;

			// switch to program
			program.use();

			// iterations are just a means of compounding a program's render output
			// its sole purpose is to make my self-indulgent pixel-sorting shader work :~)
			const iterations = step.iterations || 1;
			for(let iteration = 0; iteration < iterations; iteration++) {

				// run the shader's update function -- modifies uniforms
				// program must be in use before calling update otherwise previously active program's uniforms get modified
				program.update(step, iteration);

				const sourceTexture = totalStepCount === 0 ? imageTexture : getTempFramebuffer(currentFramebufferIndex).texture;

				let target = null;
				if(!(count >= steps.length-1 && groupCount >= instructions.length-1 && iteration >= iterations-1 && !('amount' in group))) {
					currentFramebufferIndex = (currentFramebufferIndex+1)%2;
					target = getTempFramebuffer(currentFramebufferIndex).id;
				}

				program.willRender();

				sourceTexture.use();
				gl.bindFramebuffer(gl.FRAMEBUFFER, target);

				program.didRender();
				program.draw();

			}


			// if last edit step of group and next group has an 'amount' value then store current image in seperate framebuffer
			if(count >= steps.length-1 && groupCount < instructions.length-1 && ('amount' in instructions[groupCount+1])) {
				editGroupFramebuffer.use();
				program.draw();
			}


			
			// if last edit step of group and group needs to blend with last group then do that
			if(groupCount > 0 && count >= steps.length-1 && ('amount' in group)) {
				
				const sourceTexture = getTempFramebuffer(currentFramebufferIndex).texture;

				let blendTarget = null;
				if(groupCount < instructions.length-1) {
					currentFramebufferIndex = (currentFramebufferIndex+1)%2;
					blendTarget = getTempFramebuffer(currentFramebufferIndex).id;
				}

				blendProgram.use();
				blendProgram.update({
					key: 'blend', 
					amount: group.amount, 
					blendTexture: editGroupFramebuffer.texture,
				});

				blendProgram.willRender();
				sourceTexture.use();
				gl.bindFramebuffer(gl.FRAMEBUFFER, blendTarget);
				blendProgram.didRender();
				blendProgram.draw();

			}
			
		}
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

if('instructions' in args) {
	rawInstructions = JSON.parse(args.instructions);
	lastEditStepsKeys = combineGroupEditStepKeys(rawInstructions)
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

		resizeViewport(pixels.shape[0], pixels.shape[1]);
		editGroupFramebuffer = new Framebuffer(gl).use();
		editGroupFramebuffer.attachEmptyTexture(width, height);
		
		imageTexture.loadFromBytes(pixels.data, width, height);
		console.log('----------\nAfter image sent to webgl\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();




		buildPrograms();
		resizePrograms();
		resizeFramebuffers();

		console.log('----------\nAfter programs init\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		renderEditSteps();
		console.log('----------\nAfter render\n', (startMem-OS.freemem())/1024/1024 + 'mb\n' + (new Date().getTime()-lastTime) + 'ms');
		lastTime = new Date().getTime();

		saveImage(); 
	});
}