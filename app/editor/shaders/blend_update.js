import Texture from '../Texture'
import * as BlendTypes from '../constants/blendTypes'

export default function(settings) {

	// set rgb uniforms depending on the channels string
	this.uniforms({
		amount: settings.amount,
		blendType: settings.blendType || BlendTypes.ALPHA,
	});

	if(settings.blendTexture) {
		settings.blendTexture.use(3);
		this.gl.uniform1i(this.gl.getUniformLocation(this.program, "blendTexture"), 3);
		this.gl.activeTexture(this.gl.TEXTURE0);
	}
}