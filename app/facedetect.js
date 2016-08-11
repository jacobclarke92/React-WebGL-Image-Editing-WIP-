import Shaders from './editor/shaders'
import Texture from './editor/Texture'
import Program from './editor/Program'
import Framebuffer from './editor/Framebuffer'

import { getProgramInfo } from './editor/utils/webglUtils'
import cascadeFrontalFace from './editor/constants/cascade_frontalface'

const url = 'test_face.jpg';
const width = 307;
const height = 409;

const canvas = document.getElementById('canvas');
canvas.width = width;
canvas.height = height;

let gl = canvas.getContext('experimental-webgl');
if(!gl) gl = canvas.getContext('webgl');
gl.viewport(0, 0, width, height);

const image = new Image();
image.onload = () => handleImageLoad(image);
image.src = url;

let imageTexture = null;
let defaultProgram = null;
let faceDetectProgram = null;
let framebuffers = [];
let currentFramebufferIndex = -1;

function getTempFramebuffer(index) {
	if(!framebuffers[index]) {
		framebuffers[index] = new Framebuffer(gl).use();
		framebuffers[index].attachEmptyTexture(width, height);
	}
	return framebuffers[index];
}

function handleImageLoad(image) {

	if(imageTexture) imageTexture.destroy();
	imageTexture = new Texture(gl, image.width, image.height);
	imageTexture.loadContentsOf(image);

	if(defaultProgram) defaultProgram.destroy();
	defaultProgram = new Program('default', gl, Shaders.default.vertex, Shaders.default.fragment, Shaders.default.update);
	defaultProgram.resize(width, height);

	if(faceDetectProgram) faceDetectProgram.destroy();
	const faceDetectShader = Shaders['faceDetect'];
	faceDetectProgram = new Program('faceDetect', gl, faceDetectShader.vertex, faceDetectShader.fragment, faceDetectShader.update);
	faceDetectProgram.resize(width, height);

	render();
}

function render() {

	let count = 0;

	const defaultStep = {key: 'default'};
	defaultProgram.update(defaultStep, 0);
	let sourceTexture = count === 0 ? imageTexture : getTempFramebuffer(currentFramebufferIndex).texture;
	let target = null;
	currentFramebufferIndex = (currentFramebufferIndex+1)%2;
	target = getTempFramebuffer(currentFramebufferIndex).id;

	defaultProgram.willRender();
	sourceTexture.use();
	gl.bindFramebuffer(gl.FRAMEBUFFER, target);
	defaultProgram.didRender();
	defaultProgram.draw();



	count ++;

	const faceDetectStep = {
		key: 'faceDetect', 
		cascade: cascadeFrontalFace,
		scaleFactor: 1.2,
		windowSize: 24,
		url: url,
		imageElement: image,
	};
	faceDetectProgram.update(faceDetectStep, 0);
	sourceTexture = count === 0 ? imageTexture : getTempFramebuffer(currentFramebufferIndex).texture;
	target = null;

	faceDetectProgram.willRender();
	sourceTexture.use();
	gl.bindFramebuffer(gl.FRAMEBUFFER, target);
	faceDetectProgram.didRender();
	faceDetectProgram.draw();

}