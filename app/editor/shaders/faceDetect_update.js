import Program from '../Program'
import Texture from '../Texture'
import Framebuffer from '../Framebuffer'

import { getActiveUniforms } from '../utils/webglUtils'
import { imageToGreyArray, integralImage } from '../utils/imageProcessUtils'
import lbpStage_vertex from './lbpStage_vertex.glsl'
import lbpStage_fragment from './lbpStage_fragment.glsl'

const wantColourBuffer = true;

const resizeMax = 320; // max width or height
const THRESHOLD_EPS = 1e-5;

// called within context of a Program
export default function(settings) {
	const { url, imageElement, cascade, scaleFactor, windowSize } = settings;
	const gl = this.gl;

	const setupStart = new Date();

    this.imageElement = imageElement;
	this.cascade = cascade;
	this.scaleFactor = scaleFactor;
	this.windowSize = windowSize;
	this.integralWidth = this.width + 1;
	this.integralHeight = this.height + 1;

	// Determine number of stages and scales for cascade
	this.nstages = cascade.stages.length;
    this.nscales = 0;

    for (let scale = 1.0; (scale * this.windowSize < this.width) && (scale * this.windowSize < this.height); scale *= this.scaleFactor) {
        this.nscales += 1;
    }

    // Array to time stages and scales
    // Width: nscales, Height: nstages
    this.stageTimes = [];
    for(let i=0; i<this.nstages; i++) {
        const a = [];
        for(let j=0; j<this.nscales; j++) {
            a.push(0);
        }
        this.stageTimes.push(a);
    }

    // create lookup table and texture
    this.lbpLookupTableSize = calculateLBPLookupTableSize.call(this);
    this.lbpLookupTexture = createLBPLookupTexture.call(this);


    // init framebuffers and textures
    const framebuffer1 = new Framebuffer(gl);
    const framebuffer2 = new Framebuffer(gl);
    this.finalFramebuffer = new Framebuffer(gl);
    this.framebuffers = [framebuffer1, framebuffer2];

	const outTexture1 = new Texture(gl, this.width, this.height).loadEmpty();
	const outTexture2 = new Texture(gl, this.width, this.height).loadEmpty();
    this.finalTexture = new Texture(gl, this.width, this.height).loadEmpty();
	this.outTextures = [outTexture1, outTexture2];

    framebuffer1.use();
    framebuffer1.attachTexture(outTexture1.id);
    framebuffer2.use();
    framebuffer2.attachTexture(outTexture2.id);
    this.finalFramebuffer.use();
    this.finalFramebuffer.attachTexture(this.finalTexture.id);

    
    // Compile the code for all the shaders (one for each stage)
    this.vertBuf = undefined; // Keep track of vertex buffer for quad. Set in setupShaders
    this.lbpShaders = setupShaders.call(this);
    
    this.integral = new Float32Array(this.integralWidth * this.integralHeight);
    this.integralTexture = new Texture(gl, this.integralWidth, this.integralHeight, gl.LUMINANCE);

    this.pixels = new Uint8Array(this.width * this.height * 4);
    this.greyImage = new Uint8Array(this.width * this.height);
    console.log('Face detectuin setup time', new Date() - setupStart);
    
}

function calculateLBPLookupTableSize() {
    const cascade = this.cascade;
	const stages = cascade.stages;
	const lbpArrangements = 256;
    let maxWeakClassifiers = 0;
	let nweak = 0;

    // Find max number of weak classifiers (for width of texture)
    for (let k = 0; k < stages.length; k ++) {
        nweak = stages[k].weakClassifiers.length;
        maxWeakClassifiers = nweak > maxWeakClassifiers ? nweak : maxWeakClassifiers;
    }

    const texWidth = maxWeakClassifiers * lbpArrangements;
    const texHeight = this.nstages;

    return [texWidth, texHeight];
}

function createLBPLookupTexture () {
	const gl = this.gl;
    const cascade = this.cascade;
	const stages = cascade.stages;
	const lbpArrangements = 256;
	const dim = this.lbpLookupTableSize;
	const texWidth = dim[0];
	const texHeight = dim[1];
    const lbpMapArray = new Uint8Array(texWidth * texHeight);

    for (let k = 0; k < this.nstages; k ++) {
        for (let wi = 0; wi < stages[k].weakClassifiers.length; wi ++) {
            const bitvec = stages[k].weakClassifiers[wi].categoryBitVector;
            for (let lbpVal = 0; lbpVal < lbpArrangements; lbpVal ++) {
                const bit = Boolean(bitvec[lbpVal >> 5] & (1 << (lbpVal & 31)));
                lbpMapArray[(wi * lbpArrangements + lbpVal) + k * texWidth] = bit * 255;
            }
        }
    }

    const oldTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const texture = new Texture(gl, texWidth, texHeight, gl.LUMINANCE);

    texture.loadFromBytes(lbpMapArray, texWidth, texHeight);
    gl.bindTexture(gl.TEXTURE_2D, oldTexture);

    return texture.id;
}

function setupShaders() {

	const shaderArray = [];
	const cascade = this.cascade;
	const nstages = this.nstages;

	for(let s=0; s<nstages; s++) {
		const stage = cascade.stages[s];
		const nweak = stage.weakClassifiers.length;
		const defs = { STAGEN: s, NWEAK: nweak };
		if(s == nstages-1) defs['LAST_STAGE'] = 1;

		let definesString = '';
		for(let key in defs) {
			definesString += "#define "+key+" "+defs[key]+"\n";
		}

		const vertex = definesString + "\n" + lbpStage_vertex;
		const fragment = definesString + "\n" + lbpStage_fragment;
		const lbpShader = new Program('lbpShader', this.gl, vertex, fragment);
		lbpShader.use();

		console.log(getActiveUniforms(this.gl, lbpShader.program));
		const uniforms = {
			uResolution: [this.width, this.height],
			uImageSize: [this.width, this.height],
			uIntegralImageSize: [this.integralWidth, this.integralHeight],
			stageThreshold: stage.stageThreshold - THRESHOLD_EPS,
			leafValues: [],
			featureRectangles: [],
			lbpLookupTableSize: this.lbpLookupTableSize,
			uSampler: 0,
			lbpLookupTexture: 1,
			scale: 1.0,
			scaleN: 1,
			activeWindows: 2,
		};

		for (let k = 0; k < nweak; k += 1) {
            uniforms.leafValues = uniforms.leafValues.concat(stage.weakClassifiers[k].leafValues);
            uniforms.featureRectangles = uniforms.featureRectangles.concat(stage.weakClassifiers[k].featureRectangle);
        }

		lbpShader.uniforms(uniforms);
		lbpShader.willRender();

		shaderArray.push(lbpShader)
	}

	return shaderArray;
}

function detect() {
    const gl = this.gl;
    const totalTimeStart = new Date();
    const cascade = this.cascade;
    const times = [];

    // Upload original image
    if(gpuIntegral) {
        gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }

    // Convert to grayscale
    const grey = imageToGreyArray(this.imageElement, this.greyImage, this.width, this.height);

    // Create and upload integral image
    integralImage(grey, this.width, this.height, this.integral);
    
    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, this.integralWidth, this.integralHeight, 0, gl.LUMINANCE,
            gl.FLOAT, this.integral);

    // Bind textures for the integral image and LBP lookup table
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lbpLookupTexture);


    var detectTimeStart = new Date();
    var rectangles = []

    var ndraws = 0;

    // Ordinal number of the scale, which will be written as the output pixel
    // value when a rectangle is detected at a certain scale
    var scaleN = 1;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear final output framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    var scale = 1.0;

    for (let s=0; s < this.nscales; s++) {
        var scaleTime = new Date();
        var scaledWindowSize = Math.round(scale * this.windowSize);
        var drawWidth = this.width - scaledWindowSize;
        var drawHeight = this.height - scaledWindowSize;

        gl.viewport(0, 0, drawWidth, drawHeight);
        gl.disable(gl.BLEND);

        for (let stageN = 0; stageN < this.nstages; stageN ++) {

            // Render to the framebuffer holding one texture, while using the
            // other texture, containing windows still active from the previous
            // stage as input
            const outFramebuffer = this.framebuffers[stageN % 2];
            gl.bindFramebuffer(gl.FRAMEBUFFER, outFramebuffer);

            gl.clearColor(0,0,0,0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            if(stageN == this.nstages-1) {
                // On last stage render to final out texture
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
                gl.enable(gl.BLEND);
            }


            // Bind the texture of windows still active (potentially faces) to
            // texture unit 2
            if(!zCull && !stencilCull) {
                var activeWindowTexture = this.outTextures[(stageN + 1) % 2];
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, activeWindowTexture);
            }


            gl.useProgram(this.lbpShaders[stageN]);
            this.lbpShaders[stageN].uniforms({"scale": scale, "scaleN": scaleN})
            // cv.shaders.setUniforms(this.lbpShaders[stageN], {"scale": scale, "scaleN": scaleN});
            // cv.shaders.setAttributes(this.lbpShaders[stageN], {aPosition: this.vertBuf});
            this.lbpShaders[stageN].willRender();


            if (showImage && stageN === 0) {
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                break;
            }
            
            /*
            if(timeStage) {
                // Do the draw many times and take average
                var niters = 10;
                var drawStart = new Date();
                for(var n=0; n<niters; n++) {
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                    ndraws += 1;
                    // Dummy readPixels to wait until gpu finishes
                    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
                }
                var drawTime = new Date() - drawStart;
                drawTime /= niters;
                this.stageTimes[stageN][s] = drawTime;
            } else {
                */
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                ndraws ++;
            // }
        }


        scale *= this.scaleFactor;
        scaleN += 1;
    }

    // Gather the rectangles from the image
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
    //cv.utils.showRGBA(this.pixels, this.width, this.height);
    var k, x, y, pixelValue, scaleBy;
    for (k = 0; k < this.width * this.height; k += 1) {
        // Scale number stored as pixel value
        pixelValue = this.pixels[k * 4];
        if (pixelValue != 0) {
            scaleBy = Math.pow(this.scaleFactor, pixelValue-1);
            x = (k) % this.width;
            y = Math.floor((k) / this.width);
            rectangles.push([x, y, Math.floor(this.windowSize * scaleBy),
                                   Math.floor(this.windowSize * scaleBy)]);
        }
    }

    //console.log("number of draw calls:", ndraws);
    var detectTime = new Date() - detectTimeStart;
    var totalTime = new Date() - totalTimeStart;
    console.log("Detection time:", detectTime, "Detection+integral:", totalTime);
    window.times.push(detectTime);
    gl.disable(gl.DEPTH_TEST);
    this.rectangles = rectangles;
    return rectangles;
}

