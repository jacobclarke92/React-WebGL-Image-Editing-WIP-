export default class Framebuffer {

	constructor(gl) {
		this.gl = gl;
		this.id = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);

		// allow chaining
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
		
		// allow chaining
		return this;
	}

}