// called within context of a Program
export default function(settings) {
	if(settings.key && (settings.value || settings.value === 0)) {
		// console.log('updating uniform:', settings.key, settings.value);
		this.uniforms({
			[settings.key]: settings.value,
		});
	}
}