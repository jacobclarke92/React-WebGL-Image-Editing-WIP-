export default class FaceDetector {

	constructor(gl, width, height, cascade) {

		const setupStart = new Date();

		this.gl = gl;
	    this.cascade = cascade;

	    this.scaleFactor = 1.2;
	    this.windowSize = 24;

	    // Dimensions of image detector will run on
	    this.width = width;
	    this.height = height;

	    // Integral image dims always one greater
	    this.integralWidth = width + 1;
	    this.integralHeight = height + 1;

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


	    this.lbpLookupTableSize = this.calculateLBPLookupTableSize();

	    this.lbpLookupTexture = this.createLBPLookupTexture();

	    // Output textures and framebuffers for pingponging
	    const framebuffer1 = gl.createFramebuffer();
	    const framebuffer2 = gl.createFramebuffer();
	    this.finalFramebuffer = gl.createFramebuffer();
	    this.framebuffers = [framebuffer1, framebuffer2];

	    if(wantColourBuffer || drawStages || (!zCull && !stencilCull)) {
	        const outTexture1 = cv.gpu.blankTexture(this.width, this.height,
	                {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
	        const outTexture2 = cv.gpu.blankTexture(this.width, this.height,
	                {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
	        this.outTextures = [outTexture1, outTexture2];
	    }
	    this.finalTexture = cv.gpu.blankTexture(this.width, this.height,
	                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});

	    if(gpuIntegral) {
	    	this.originalImageTexture = cv.gpu.blankTexture(this.width, this.height,
	                 {format: gl.RGBA, type: gl.UNSIGNED_BYTE, flip: false});
	    }

	    // Create buffer for depth
	    if(zCull) {
	        //this.depthTexture1 = cv.gpu.blankTexture(this.integralWidth, this.integralHeight,
	        //             {format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_SHORT, flip: false});
	        this.depthBuffer = gl.createRenderbuffer();
	        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
	        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
	    }

	    if(stencilCull) {
	        this.stencilBuffer = gl.createRenderbuffer();
	        gl.bindRenderbuffer(gl.RENDERBUFFER, this.stencilBuffer);
	        gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8, this.width, this.height);
	    }


	    // Attach textures to framebuffers (turns out doing this before
	    // setupShaders() makes the first draw/readPixels a lot faster)
	    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer1);
	    if(zCull) {
	        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
	    }
	    
	    if (stencilCull) {
	        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.stencilBuffer);
	    }
	    
	    if(wantColourBuffer || drawStages || (!zCull && !stencilCull)) {
	        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture1, 0);
	    }
	    

	    if(!zCull && !stencilCull) {
	        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer2);
	        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outTexture2, 0);
	    }

	    gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
	    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
	            gl.TEXTURE_2D, this.finalTexture, 0);
	    if(zCull) {
	        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
	    } 
	    
	    if(stencilCull) {
	        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, this.stencilBuffer);
	    }


	    // Compile the code for all the shaders (one for each stage)
	    this.vertBuf = undefined; // Keep track of vertex buffer for quad. Set in setupShaders
	    this.lbpShaders = this.setupShaders();

	    this.integral = new Float32Array(this.integralWidth * this.integralHeight);
	    this.integralTexture = cv.gpu.blankTexture(this.integralWidth,
	            this.integralHeight, {format: gl.LUMINANCE, filter: gl.NEAREST,
	                type: gl.FLOAT, flip: false});

	    this.pixels = new Uint8Array(this.width * this.height * 4);
	    this.greyImage = new Uint8Array(this.width * this.height);
	    console.log("Setup time", new Date() - setupStart);

	}


	detect(image) {
	    const totalTimeStart = new Date();
	    const cascade = this.cascade;
	    const gl = this.gl;

	    if (window.times === undefined) {
	        window.times = [];
	    }

	    if(zCull) gl.enable(gl.DEPTH_TEST);
	    
	    if(stencilCull) {
	        gl.enable(gl.STENCIL_TEST);
	        // Check if < 1
	        gl.stencilFunc(gl.LESS, 1, 0xff);
	        // If fail write 0
	        gl.stencilOp(gl.KEEP, gl.KEEP, gl.ZERO);
	    }

	    // Upload original image
	    if(gpuIntegral) {
	        gl.bindTexture(gl.TEXTURE_2D, this.originalImageTexture);
	        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	    }

	    // Convert to grayscale
	    //var greyStart = performance.now();
	    var grey = cv.imgproc.imageToGreyArray(image, this.greyImage, this.width, this.height);
	    //console.log("Grayscale time", performance.now() - greyStart);

	    // Create and upload integral image
	    //var integralStart = performance.now();
	    cv.imgproc.integralImage(grey, this.width, this.height, this.integral);
	    //console.log("Integral time", performance.now() - integralStart);
	    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);
	    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, this.integralWidth, this.integralHeight, 0, gl.LUMINANCE,
	            gl.FLOAT, this.integral);

	    // Bind textures for the integral image and LBP lookup table
	    gl.activeTexture(gl.TEXTURE0);
	    gl.bindTexture(gl.TEXTURE_2D, this.integralTexture);

	    gl.activeTexture(gl.TEXTURE1);
	    gl.bindTexture(gl.TEXTURE_2D, this.lbpLookupTexture);


	    const detectTimeStart = new Date();
	    const rectangles = []

	    let ndraws = 0;

	    // Ordinal number of the scale, which will be written as the output pixel
	    // value when a rectangle is detected at a certain scale
	    let scaleN = 1;

	    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	    // Clear final output framebuffer
	    gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
	    gl.clearColor(0,0,0,1);
	    gl.clear(gl.COLOR_BUFFER_BIT);

	    let scale = 1.0;

	    for (let s=0; s<this.nscales; s++) {
	        const scaleTime = new Date();
	        const scaledWindowSize = Math.round(scale * this.windowSize);
	        const drawWidth = this.width - scaledWindowSize;
	        const drawHeight = this.height - scaledWindowSize;

	        gl.viewport(0, 0, drawWidth, drawHeight);
	        gl.disable(gl.BLEND);


	        if(zCull) {
	            // Clear depthbuffer
	            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
	            gl.clearDepth(1.0);
	            gl.clear(gl.DEPTH_BUFFER_BIT);
	            //gl.colorMask(false,false,false,false);
	        }
	        
	        if(stencilCull) {
	            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[0]);
	            gl.clearStencil(1);
	            gl.clear(gl.STENCIL_BUFFER_BIT);
	        }


	        for (stageN = 0; stageN < this.nstages; stageN += 1) {

	            // Render to the framebuffer holding one texture, while using the
	            // other texture, containing windows still active from the previous
	            // stage as input
	            var outFramebuffer = this.framebuffers[stageN % 2];
	            if(zCull || stencilCull) {
	                outFramebuffer = this.framebuffers[0];
	            }
	            gl.bindFramebuffer(gl.FRAMEBUFFER, outFramebuffer);

	            gl.clearColor(0,0,0,0);
	            gl.clear(gl.COLOR_BUFFER_BIT);

	            if(stageN == this.nstages-1) {
	                // On last stage render to final out texture
	                gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFramebuffer);
	                if(zCull || stencilCull) { 
	                    //gl.colorMask(true,true,true,true);
	                } else {
	                    gl.enable(gl.BLEND);
	                }
	            }


	            // Bind the texture of windows still active (potentially faces) to
	            // texture unit 2
	            if(!zCull && !stencilCull) {
	                var activeWindowTexture = this.outTextures[(stageN + 1) % 2];
	                gl.activeTexture(gl.TEXTURE2);
	                gl.bindTexture(gl.TEXTURE_2D, activeWindowTexture);
	            }


	            gl.useProgram(this.lbpShaders[stageN]);
	            cv.shaders.setUniforms(this.lbpShaders[stageN], {"scale": scale, "scaleN": scaleN});
	            cv.shaders.setAttributes(this.lbpShaders[stageN], {aPosition: this.vertBuf});


	            if (showImage && stageN === 0) {
	                gl.drawArrays(gl.TRIANGLES, 0, 6);
	                break;
	            }

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
	                gl.drawArrays(gl.TRIANGLES, 0, 6);
	                ndraws += 1;
	            }
	            if(drawStages) { 
	                gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, this.pixels);
	                cv.utils.showRGBA(this.pixels, this.width, this.height);
	            }
	        }

	        if(drawStages) {
	            $('<br>').appendTo('body');
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

	    if(timeStage) {
	        console.log("stageTimes", this.stageTimes);
	    }

	    //console.log("number of draw calls:", ndraws);
	    const detectTime = new Date() - detectTimeStart;
	    const totalTime = new Date() - totalTimeStart;
	    console.log("Detection time:", detectTime, "Detection+integral:", totalTime);
	    window.times.push(detectTime);
	    gl.disable(gl.DEPTH_TEST);
	    this.rectangles = rectangles;
	    return rectangles;
	}


}