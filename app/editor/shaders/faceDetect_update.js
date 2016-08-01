import Program from '../Program'
import Texture from '../Texture'
import Framebuffer from '../Framebuffer'

import { getActiveUniforms } from '../utils/webglUtils'
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



