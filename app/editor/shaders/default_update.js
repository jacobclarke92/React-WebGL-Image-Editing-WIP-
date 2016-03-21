// called within context of a Program
export default function(settings) {
	console.log('updating:', this.label, settings);
	this.uniforms({
		[settings.key]: settings.value,
	})
}