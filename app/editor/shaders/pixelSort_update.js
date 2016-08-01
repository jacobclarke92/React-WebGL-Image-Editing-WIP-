// called within context of a Program
export default function(_settings, iteration = 0) {
	const settings = Object.assign({min: 0.18, max: 0.9, direction: 1}, _settings);
	if(settings.key) {
		this.uniforms({
			iteration,
			inverted: -1.0,
			direction: settings.direction,
			threshMin: settings.min,
			threshMax: settings.max,
		});
	}
}