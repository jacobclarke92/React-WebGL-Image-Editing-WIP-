import Texture from '../Texture'

export default function(settings) {

	// set rgb uniforms depending on the channels string
	this.uniforms({
		amount: settings.amount,
		blendType: 1,
	});

	if(settings.blendTexture) {
		settings.blendTexture.use(3);
		this.gl.uniform1i(this.gl.getUniformLocation(this.program, "blendTexture"), 3);
		this.gl.activeTexture(this.gl.TEXTURE0);
	}
}