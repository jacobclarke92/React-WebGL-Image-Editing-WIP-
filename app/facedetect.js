// import * as clm from './editor/lib/clm'
// import pModel from './editor/constants/model_pca_20_svm'
import frontalface from './editor/constants/frontalface'
// import rafPolyfill from './utils/raf_polyfill'
import jsfeat from 'jsfeat'
import deepEqual from 'deep-equal'
import $ from 'jquery'

// import Shaders from './editor/shaders'
// import Texture from './editor/Texture'
// import Program from './editor/Program'
// import Framebuffer from './editor/Framebuffer'
// import { getProgramInfo } from './editor/utils/webglUtils'
// import cascadeFrontalFace from './editor/constants/cascade_frontalface'

const url = 'test_face1.jpg';
let width = 307;
let height = 409;

const imageCanvas = document.getElementById('image');
const imageCC = imageCanvas.getContext('2d');
imageCanvas.width = width;
imageCanvas.height = height;

const overlayCanvas = document.getElementById('overlay');
const overlayCC = overlayCanvas.getContext('2d');
overlayCanvas.width = width;
overlayCanvas.height = height;

const image = new Image();
image.onload = () => handleImageLoad(image);
image.src = url;

let ctrack = null;
let drawRequest = null;

$('.face-button').each((i, elem) => {
	$(elem).on('click', event => image.src = 'test_face'+(i+1)+'.jpg');
});

function getRectCenter(rect) {
	return {x: rect.x + rect.width/2, y: rect.y + rect.height/2};
}

function dist(pt1, pt2) {
	return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
}

function handleImageLoad(image) {
	/*
	const _width = image.width;
	const _height = image.height;

	if(_width > _height) {
		width = 800;
		height = _height/(_width/800);
	}else{
		height = 800;
		width = _width/(_height/800);
	}*/
	width = image.width;
	height = image.height;

	imageCanvas.width = width;
	imageCanvas.height = height;
	overlayCanvas.width = width;
	overlayCanvas.height = height;
	imageCC.drawImage(image, 0, 0, width, height);//, 0, 0, width, height);


	const startTime = new Date().getTime();
	// setTimeout(() => {
		
		const w = width;
		const h = height;
		const img_u8 = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t);
		const ii_sum = new Int32Array((w+1)*(h+1));
		const ii_sqsum = new Int32Array((w+1)*(h+1));
		const ii_tilted = new Int32Array((w+1)*(h+1));
		const imageData = imageCC.getImageData(0, 0, width, height);
	    jsfeat.imgproc.grayscale(imageData.data, w, h, img_u8, jsfeat.COLOR_RGBA2GRAY);
	    jsfeat.imgproc.equalize_histogram(img_u8, img_u8);
	    jsfeat.imgproc.compute_integral_image(img_u8, ii_sum, ii_sqsum, null);

	    let rects = jsfeat.haar.detect_multi_scale(ii_sum, ii_sqsum, ii_tilted, null, img_u8.cols, img_u8.rows, frontalface, 1.15, 2);
    	
    	rects = rects.filter(rect => rect.confidence > 106.2);

    	console.log('Got rects in '+(new Date().getTime() - startTime)+'ms');

	    const newRects = [];
	    const rectCenters = [];
	    const rectProximity = (width+height)/2 / 20;
    	for(let rect of rects) {

    		const rectCenter = getRectCenter(rect);
    		const foundNeighbor = rectCenters.reduce((found, pt) => found ? found : dist(rectCenter, pt) <= rectProximity, false);
    		const insideAnother = rects.reduce((found, item) => found ? found : (
				!deepEqual(rect, item) && (
					item.x >= rect.x && 
					item.x+item.width <= rect.x+rect.width && 
					item.y >= rect.y &&
					item.y+item.height <= rect.y+rect.height
				)
			), false);
			if(!foundNeighbor && !insideAnother) {
    			rectCenters.push(rectCenter);
	    		overlayCC.strokeStyle = '#00FF00';//rgba(0,255,0, '+((110 - rect.confidence)*85 )+')';
	    		overlayCC.strokeRect(rect.x, rect.y, rect.width, rect.height);
	    		overlayCC.stroke();
	    	}
    	}

    	/*
	    var data_u32 = new Uint32Array(imageData.data.buffer);
	    var alpha = (0xff << 24);
	    var i = img_u8.cols*img_u8.rows, pix = 0;
	    while(--i >= 0) {
	        pix = img_u8.data[i];
	        data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
	    }
	    imageCC.putImageData(imageData,0,0);
	    */
	   
	// }, 2000);
	
	/*
	ctrack = new clm.tracker({stopOnConvergence : true, useWebGL: true});
	ctrack.init(pModel);
	animateClean();
	*/	
}

function animateClean() {
	ctrack.start(imageCanvas);
	drawLoop();
}

function drawLoop() {
	drawRequest = requestAnimFrame(drawLoop);
	overlayCC.clearRect(0, 0, width, height);
	if (ctrack.getCurrentPosition()) {
		ctrack.draw(overlay);
	}
}

// detect if tracker fails to find a face
document.addEventListener("clmtrackrNotFound", function(event) {
	ctrack.stop();
	console.warn("The tracking had problems with finding a face in this image. Try selecting the face in the image manually.")
}, false);

// detect if tracker loses tracking of face
document.addEventListener("clmtrackrLost", function(event) {
	ctrack.stop();
	console.warn("The tracking had problems converging on a face in this image. Try selecting the face in the image manually.")
}, false);

// detect if tracker has converged
document.addEventListener("clmtrackrConverged", function(event) {
	document.getElementById('convergence').innerHTML = "CONVERGED";
	document.getElementById('convergence').style.backgroundColor = "#00FF00";
	// stop drawloop
	cancelRequestAnimFrame(drawRequest);
}, false);



/*

let gl = canvas.getContext('experimental-webgl');
if(!gl) gl = canvas.getContext('webgl');
gl.viewport(0, 0, width, height);

let imageTexture = null;
let defaultProgram = null;
let faceDetectProgram = null;
let framebuffers = [];
let currentFramebufferIndex = -1;

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

function getTempFramebuffer(index) {
	if(!framebuffers[index]) {
		framebuffers[index] = new Framebuffer(gl).use();
		framebuffers[index].attachEmptyTexture(width, height);
	}
	return framebuffers[index];
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
*/