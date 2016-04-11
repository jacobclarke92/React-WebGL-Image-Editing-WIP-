// called within context of a Program
export default function(settings) {
	if(settings.key && settings.value) {
		console.log('updating hueAdjustment uniforms:', settings.key, settings.value);
		this.uniforms({
			amount: settings.value,
			baseColor: settings.color,
		});
	}
}