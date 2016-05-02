// called within context of a Program
export default function(settings) {
	if(settings.key && settings.value) {
		console.log('updating hueAdjustment uniforms:', settings);
		this.uniforms({
			amount: settings.value,
			baseColor: settings.color,
			range: settings.range,
		});
	}
}