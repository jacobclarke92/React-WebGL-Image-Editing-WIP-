export default function(settings) {
	this.uniforms({
		...settings.value,
		enabled: settings.enabled,
	});
}