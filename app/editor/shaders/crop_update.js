export default function(settings) {
	console.log('CROP SETTINGS', settings.value);
	this.uniforms({
		...settings.value,
		enabled: settings.enabled,
	});
}