import Texture from './Texture'

export default class FramebufferTexture {

	constructor(gl) {
		this.gl = gl;
		this.id = gl.createFramebuffer();
		
		this.texture = null

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

	attachEmptyTexture(width, height) {
		this.texture = new Texture(this.gl, width, height);
		this.texture.loadEmpty();
		this.attachTexture(this.texture.id);
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