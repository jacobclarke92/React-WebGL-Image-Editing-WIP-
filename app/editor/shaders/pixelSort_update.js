// called within context of a Program
export default function(settings) {
	if(settings.key && settings.value) {
		// console.log('updating uniform:', settings.key, settings.value);
		this.uniforms({
			[settings.key]: settings.value,
			resolution: [this.width, this.height],
			texel: [1/this.width, 1/this.height],
			pixel: [1/this.width, 1/this.height],
			MM: 1.0,
		});
	}
}