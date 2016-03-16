export default class Texture {

	constructor(gl, width, height, format, type) {
		this.gl = gl;
		this.width = width;
		this.height = height;
		this.format = format;
		this.type = type;

		this.id = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.id);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

		// allow chaining
		return this;
	}

	destroy() {
        this.gl.deleteTexture(this.id);
        this.id = null;
    }

	loadContentsOf(element) {
		// update dimensions in case they changed
        if(element) {
        	this.width = element.width || element.videoWidth;
        	this.height = element.height || element.videoHeight;
        }

        // make sure gl is using this texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);

        // write image/video element to texture
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.format, this.format, this.type, element);
    }

    loadFromBytes(data, width, height) {
    	// update dimensions in case they changed
        this.width = width;
        this.height = height;

        // change format and type to correspond to byte array
        this.format = this.gl.RGBA;
        this.type = this.gl.UNSIGNED_BYTE;

        // make sure gl is using this texture
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);

        // write bytearray to texture
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.type, new Uint8Array(data));
    }


    use(unit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    }

    unuse(unit) {
        this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    }

    drawTo(callback) {
        // start rendering to this texture
        this.gl.framebuffer = this.gl.framebuffer || this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.gl.framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.id, 0);
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('incomplete framebuffer');
        }

        // do the drawing
        callback();

        // stop rendering to this texture
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    swapWith(other) {
        let temp = null;
        temp = other.id; 	 other.id 	  = this.id; 	 this.id 	 = temp;
        temp = other.width;  other.width  = this.width;  this.width  = temp;
        temp = other.height; other.height = this.height; this.height = temp;
        temp = other.format; other.format = this.format; this.format = temp;
    }


}