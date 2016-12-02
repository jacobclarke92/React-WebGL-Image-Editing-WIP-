import Texture from '../Texture'

export default function(settings) {

	// set rgb uniforms depending on the channels string
	this.uniforms({
		amount: settings.amount,
	});

	console.log('BLEND SETTINGS', settings);

	if(settings.originalImage) {
		console.log('binding image to blend with');
		settings.originalImage.use(3);
		this.gl.uniform1i(this.gl.getUniformLocation(this.program, "originalImage"), 3);
	}
}