export default class Framebuffer {

	constructor(gl) {
		this.gl = gl;
		this.id = gl.createFramebuffer();
		this.use();

		return this;
	}

	attachTexture(texture) {
		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER, 
			this.gl.COLOR_ATTACHMENT0, 
			this.gl.TEXTURE_2D, 
			texture, 
			0
		);
		
		return this;
	}

	destroy() {
		this.gl.deleteFramebuffer(this.id);
		this.id = null;
	}

	use() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.id);
		return this;
	}

	unuse() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		return this;
	}

}