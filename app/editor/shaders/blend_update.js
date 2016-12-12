import Texture from '../Texture'

export default function(settings) {

	// set rgb uniforms depending on the channels string
	this.uniforms({
		amount: settings.amount,
	});

	console.log('BLEND SETTINGS', settings);

	if(settings.blendTexture) {
		console.log('binding image to blend with');
		settings.blendTexture.use(3);
		this.gl.uniform1i(this.gl.getUniformLocation(this.program, "blendTexture"), 3);
	}
}