// called within context of a Program
export default function(settings, iteration = 0) {
	if(settings.key && settings.value) {
		this.uniforms({
			[settings.key]: settings.value,
			iteration,
			direction: -1.0,
			threshMin: 0.18,
			threshMax: 0.9,
		});
	}
}