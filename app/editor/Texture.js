export default class Texture {

	constructor(gl, width = 0, height = 0, format, type) {
		this.gl = gl;
		this.width = width;
		this.height = height;
		this.format = format || gl.RGBA;
		this.type = type || gl.UNSIGNED_BYTE;

		this.id = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.id);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        if(width && height) this.loadEmpty();

		// allow chaining
		return this;
	}

	destroy() {
        this.gl.deleteTexture(this.id);
        this.id = null;
    }

	loadContentsOf(element) {

        if(!element) {
            console.log('No element provided to load into texture');
            return this;
        }

		// update dimensions in case they changed
        this.width = element.width || element.videoWidth;
        this.height = element.height || element.videoHeight;

        // write image/video element to texture
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.format,
            this.format,
            this.type,
            element
        );

        return this;
    }

    loadFromBytes(data, width, height) {
    	// update dimensions in case they changed
        this.width = width || this.width;
        this.height = height || this.height;

        // change format and type to correspond to byte array
        this.format = this.gl.RGBA;
        this.type = this.gl.UNSIGNED_BYTE;

        // make sure gl is using this texture
        this.use();

        // write bytearray to texture
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.format,
            this.width,
            this.height,
            0,
            this.format,
            this.type,
            new Uint8Array(data)
        );

        return this;
    }

    loadEmpty() {
        this.use();

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.format,
            this.width,
            this.height,
            0,
            this.format,
            this.type,
            null
        );

        return this;
    }

    use(unit) {
        if(typeof unit != 'undefined' && unit >= 0) this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
        return this;
    }

    unuse(unit) {
        if(typeof unit != 'undefined' && unit >= 0) this.gl.activeTexture(this.gl.TEXTURE0 + (unit || 0));
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        return this;
    }

}