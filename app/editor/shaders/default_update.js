// called within context of a Program
export default function(settings) {
	if(settings.key && settings.value) {
		console.log('updating uniform:', settings.key, settings.value);
		this.uniforms({
			[settings.key]: settings.value,
		});
	}
}